"""
Import / update all employees from "ACE and AE Employee Update_V190.xlsx"
Run inside the backend container:
  docker exec ace-system-backend python /app/scripts/sync_employees_v190.py
"""
import asyncio
import re
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import openpyxl
from sqlalchemy import select

from app.database import SessionLocal, engine, Base
from app.models.employee import Employee, ProjectCatalog

XLSX_PATH = Path(__file__).resolve().parent / "ACE and AE Employee Update_V190.xlsx"

SECTION_TO_TEAM = {
    "RF Project":              "RF",
    "TE Project":              "TE",
    "Enterprise Project":      "Enterprise",
    "Head Office":             "HQ",
    "Accounting and Finance":  "Finance",
    "Human Resources":         "HR",
    "Business Development":    "BD",
    "Purchasing":              "HQ",
}

DEPT_TO_TEAM = {
    "Computer Vision (AI)":  "AI",
    "Administrative":        "HQ",
    "Accounting":            "Finance",
    "HR":                    "HR",
    "HR ":                   "HR",
    "Executive Office":      "HQ",
    "Business Development":  "BD",
    "Purchasing":            "HQ",
}

NON_PROJECT_VALUES = {
    "Office Management",
    "Project Management",
    "Project Management\xa0 ",
    "Project Management ",
    "Computer Vision (AI)",
    "Sales and Business Development",
    "",
}


def _parse_project(raw):
    if not raw:
        return None, None
    s = str(raw).strip()
    if " : " in s:
        code, name = s.split(" : ", 1)
        return code.strip(), name.strip()
    # No separator — not a real project reference
    return None, None


def _fmt_date(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    return None


def _clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def _clean_emp_code(raw):
    """Remove Excel cell reference garbage like '+F81' appended to code."""
    if not raw:
        return None
    s = str(raw).strip()
    # Strip trailing +CELL_REF artefacts e.g. "ACECS399+F81"
    s = re.sub(r'\+[A-Z]+\d+$', '', s)
    return s.strip() or None


def load_xlsx():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        no = row[0]
        if not isinstance(no, int):
            continue

        name_en = _clean(row[1])
        if not name_en:
            continue

        emp_id = _clean_emp_code(row[4])
        if not emp_id:
            continue
        emp_upper = emp_id.upper()
        # Accept ACE*, ACECS*, AE*, AECS* codes
        if not (emp_upper.startswith("ACE") or emp_upper.startswith("AE")):
            continue

        emp_id = emp_upper

        nick           = _clean(row[3])
        join_since     = _fmt_date(row[5])
        department     = _clean(row[7])
        section        = _clean(row[8])
        position       = _clean(row[9])
        function_      = _clean(row[10])
        project_raw    = _clean(row[11])
        company        = _clean(row[12])
        contract_start = _fmt_date(row[13])
        contract_end   = _fmt_date(row[14])
        emp_status     = _clean(row[15])   # Permanent / Outsource
        phone          = _clean(row[16])
        personal_email = _clean(row[17])
        company_email  = _clean(row[18])
        contract_type  = _clean(row[19])   # Permanent / Contract X Months

        team = SECTION_TO_TEAM.get(section or "") or DEPT_TO_TEAM.get(department or "") or "OTHER"
        project_code, project_name = _parse_project(project_raw)

        # Parse Function field e.g. "DTE-L1" → role="DTE", level="L1"
        fn_clean = re.sub(r'[​‌‍﻿\xa0]', '', (function_ or '').strip())
        level_match = re.search(r'-(L[\d.]+)$', fn_clean, re.IGNORECASE)
        if level_match:
            job_level = level_match.group(1)
            role_code = fn_clean[:level_match.start()].strip()
        else:
            job_level = None
            role_code = fn_clean or None

        pos_clean = re.sub(r'[​‌‍﻿\xa0]', '', (position or '').strip()) or None

        email = company_email or personal_email

        hire_date = join_since or contract_start

        employment_type = "PERMANENT" if emp_status == "Permanent" else "CONTRACT"
        ct = "PERMANENT" if contract_type == "Permanent" else contract_type or "CONTRACT"

        # Strip salutation "Mr./Mrs./Ms." from name for first/last split
        name_stripped = re.sub(r'^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*', '', name_en, flags=re.IGNORECASE).strip()
        name_parts = name_stripped.split()
        first_name = name_parts[0] if name_parts else name_stripped
        last_name  = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

        rows.append({
            "employee_code":    emp_id,
            "email":            email,
            "full_name":        name_en,
            "first_name":       first_name,
            "last_name":        last_name,
            "preferred_name":   nick,
            "personal_email":   personal_email if personal_email != email else None,
            "phone":            phone,
            "department":       department or "Project",
            "job_title":        pos_clean,
            "project_team":     team,
            "section_name":     section,
            "project_role":     role_code,
            "job_level":        job_level,
            "project_code":     project_code,
            "project_name":     project_name,
            "position":         pos_clean,
            "cost_center":      company,
            "status":           "ACTIVE",
            "employment_type":  employment_type,
            "contract_type":    ct,
            "hire_date":        hire_date,
            "termination_date": contract_end if employment_type == "CONTRACT" else None,
            "nationality":      "Thai",
            "source":           "ACE_Employee_V190.xlsx",
        })
    return rows


async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    rows = load_xlsx()
    print(f"Loaded {len(rows)} employees from Excel")

    v190_codes = {r["employee_code"] for r in rows}
    projects: dict[str, dict] = {}
    inserted = updated = deactivated = 0

    async with SessionLocal() as db:
        # ── 1. Upsert all 94 V190 employees ──────────────────────────────────
        for r in rows:
            emp_code = r["employee_code"]
            existing = (await db.execute(
                select(Employee).where(Employee.employee_code == emp_code)
            )).scalar_one_or_none()

            if existing:
                for k, v in r.items():
                    setattr(existing, k, v)   # overwrite ALL fields, including None
                updated += 1
            else:
                db.add(Employee(**r))
                inserted += 1

            pc = r["project_code"]
            if pc:
                entry = projects.setdefault(pc, {
                    "project_code": pc,
                    "project_name": r["project_name"] or pc,
                    "team": r["project_team"],
                    "headcount": 0,
                })
                entry["headcount"] += 1

        await db.commit()
        print(f"  Inserted: {inserted}, Updated: {updated}")

        # ── 2. Deactivate employees NOT in V190 ──────────────────────────────
        all_employees = (await db.execute(select(Employee))).scalars().all()
        for emp in all_employees:
            if emp.employee_code not in v190_codes and emp.status == "ACTIVE":
                emp.status = "INACTIVE"
                deactivated += 1
        await db.commit()
        print(f"  Deactivated (not in V190): {deactivated}")

        # ── 3. Upsert project catalog ─────────────────────────────────────────
        pc_upserted = 0
        for pc_data in projects.values():
            ex = (await db.execute(
                select(ProjectCatalog).where(ProjectCatalog.project_code == pc_data["project_code"])
            )).scalar_one_or_none()
            if ex:
                ex.project_name = pc_data["project_name"]
                ex.headcount    = pc_data["headcount"]
            else:
                db.add(ProjectCatalog(**pc_data))
            pc_upserted += 1
        await db.commit()
        print(f"  Projects upserted: {pc_upserted}")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(run())
