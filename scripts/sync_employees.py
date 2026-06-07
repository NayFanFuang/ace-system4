"""
Sync all employees from Employee.xlsx into the employees table.
Run inside the backend container:
  docker exec ace-system-backend python /app/scripts/sync_employees.py
"""
import asyncio
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import openpyxl
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import SessionLocal, engine, Base
from app.models.employee import Employee, ProjectCatalog

XLSX_PATH = Path(__file__).resolve().parents[1] / "Employee.xlsx"

SECTION_TO_TEAM = {
    "RF Project":                "RF",
    "TE Project":                "TE",
    "Enterprise Project":        "Enterprise",
    "Head Office":               "HQ",
    "Accounting and Finance":    "Finance",
    "Human Resources":           "HR",
}

DEPT_TO_TEAM = {
    "Computer Vision (AI)":  "AI",
    "Administrative":        "HQ",
    "Accounting":            "Finance",
    "HR":                    "HR",
    "HR ":                   "HR",
    "Executive Office":      "HQ",
}


def _parse_project(raw):
    if not raw:
        return None, None
    s = str(raw).strip()
    if " : " in s:
        code, name = s.split(" : ", 1)
        return code.strip(), s.strip()
    if s in ("Office Management", "Project Management\xa0 ", "Project Management ",
             "Computer Vision (AI)"):
        return None, None
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


def load_xlsx():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        no = row[0]
        if not isinstance(no, int):
            continue
        name_en      = _clean(row[1])
        if not name_en:
            continue
        nick         = _clean(row[3])
        emp_id       = _clean(row[4])
        join_since   = _fmt_date(row[5])
        department   = _clean(row[7])
        section      = _clean(row[8])
        position     = _clean(row[9])
        function_    = _clean(row[10])
        project_raw  = _clean(row[11])
        company      = _clean(row[12])
        contract_start = _fmt_date(row[13])
        contract_end = _fmt_date(row[14])
        emp_status   = _clean(row[15])   # Permanent / Outsource
        phone        = _clean(row[16])
        personal_email = _clean(row[17])
        company_email  = _clean(row[18])
        contract_type  = _clean(row[19])  # Permanent / Contract X Months

        team = SECTION_TO_TEAM.get(section) or DEPT_TO_TEAM.get(department or "") or "OTHER"
        section_name = section  # keep original Excel section name
        project_code, project_name = _parse_project(project_raw)

        # Split Function "DTE-L1" → role="DTE", level="L1"
        import re as _re
        fn_clean = _re.sub(r'[​‌‍﻿]', '', (function_ or '').strip())
        level_match = _re.search(r'-(L[\d.]+)$', fn_clean, _re.IGNORECASE)
        if level_match:
            job_level  = level_match.group(1)
            role_code  = fn_clean[:level_match.start()]
        else:
            job_level  = None
            role_code  = fn_clean or None

        # Clean unicode from position/job_title
        pos_clean = _re.sub(r'[​‌‍﻿]', '', (position or '').strip()) or None

        # derive position_code for clock type
        fn_upper = fn_clean.upper()
        if "DTE" in fn_upper or "DRIVE TEST ENGINEER" in fn_upper:
            position_code = "DTE"
        elif "DTA" in fn_upper or "DRIVE TEST ANALYSIS" in fn_upper:
            position_code = "DTA"
        else:
            position_code = "OTHER"

        email = company_email or personal_email

        hire_date = join_since or contract_start

        employment_type = "PERMANENT" if emp_status == "Permanent" else "CONTRACT"
        ct = "PERMANENT" if contract_type == "Permanent" else contract_type or "CONTRACT"

        name_parts = name_en.split()
        first_name = name_parts[0] if name_parts else name_en
        last_name  = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

        rows.append({
            "employee_code":  emp_id or f"NOID-{no:03d}",
            "email":          email,
            "full_name":      name_en,
            "first_name":     first_name,
            "last_name":      last_name,
            "preferred_name": nick,
            "personal_email": personal_email if personal_email != email else None,
            "phone":          phone,
            "department":     department or "Project",
            "job_title":      pos_clean,
            "project_team":   team,
            "section_name":   section_name,
            "project_role":   role_code,
            "job_level":      job_level,
            "project_code":   project_code,
            "project_name":   project_name,
            "position":       pos_clean,
            "cost_center":    company,
            "status":         "ACTIVE",
            "employment_type": employment_type,
            "contract_type":  ct,
            "hire_date":      hire_date,
            "termination_date": contract_end if employment_type == "CONTRACT" else None,
            "nationality":    "Thai",
            "source":         "Employee.xlsx",
            "_position_code": position_code,
        })
    return rows


async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    rows = load_xlsx()
    print(f"Loaded {len(rows)} employees from Excel")

    projects: dict[str, dict] = {}

    async with SessionLocal() as db:
        upserted = 0
        for r in rows:
            emp_code = r["employee_code"]
            existing = (await db.execute(
                select(Employee).where(Employee.employee_code == emp_code)
            )).scalar_one_or_none()

            fields = {k: v for k, v in r.items() if not k.startswith("_")}

            if existing:
                for k, v in fields.items():
                    if v is not None:
                        setattr(existing, k, v)
            else:
                db.add(Employee(**fields))
            upserted += 1

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
        print(f"Upserted {upserted} employees")

        # Upsert project catalog
        pc_upserted = 0
        for pc_data in projects.values():
            ex = (await db.execute(
                select(ProjectCatalog).where(ProjectCatalog.project_code == pc_data["project_code"])
            )).scalar_one_or_none()
            if ex:
                ex.project_name = pc_data["project_name"]
                ex.headcount = pc_data["headcount"]
            else:
                db.add(ProjectCatalog(**pc_data))
            pc_upserted += 1
        await db.commit()
        print(f"Upserted {pc_upserted} projects into project_catalog")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(run())
