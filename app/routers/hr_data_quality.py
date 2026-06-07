from __future__ import annotations

import csv
import io
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel
from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, require_hr_user
from app.models.audit_log import AuditLog
from app.models.auth_user import AuthUser
from app.models.email import EmailOutbox
from app.models.employee import Employee
from app.models.employee import ProjectAssignment
from app.services.audit_service import write_audit_log


router = APIRouter(prefix="/api/hr", tags=["HR Data Quality"])

SYSTEM_AUDIT_ROLES = {"SUPER_ADMIN", "HR_ADMIN", "BOSS", "DIRECTOR", "SYSTEM_ADMIN"}
REQUIRED_PROFILE_FIELDS = [
    ("email", "Company email"),
    ("phone", "Phone"),
    ("manager_name", "Manager"),
    ("cost_center", "Cost center"),
    ("work_location", "Work location"),
    ("job_level", "Job level"),
]
REQUIRED_DOCUMENT_TYPES = ["EDUCATION_CERT", "ID_CARD", "HOUSE_REGISTER", "TRAINING_CERT"]


def _filled(value: Any) -> bool:
    if value is None:
        return False
    text = str(value).strip()
    return bool(text and text not in {"-", "—", "N/A", "null", "None"})


def _dt(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _employee_name(row: Employee) -> str:
    return row.full_name or f"{row.first_name or ''} {row.last_name or ''}".strip() or row.employee_code


def _month_key(value: date | datetime | None) -> str | None:
    if not value:
        return None
    return f"{value.year:04d}-{value.month:02d}"


def _bucket_date(value: date | None, days: int = 30) -> str:
    if not value:
        return "No Date"
    today = date.today()
    delta = (value - today).days
    if delta < 0:
        return "Past Due"
    if delta <= days:
        return f"0-{days} days"
    if delta <= days * 2:
        return f"{days + 1}-{days * 2} days"
    if delta <= days * 3:
        return f"{days * 2 + 1}-{days * 3} days"
    return f">{days * 3} days"


def _tenure_bucket(hire_date: date | None) -> str:
    if not hire_date:
        return "Unknown"
    years = (date.today() - hire_date).days / 365.25
    if years < 1:
        return "<1 year"
    if years < 3:
        return "1-3 years"
    if years < 5:
        return "3-5 years"
    if years < 10:
        return "5-10 years"
    return "10+ years"


def _age_bucket(birth_date: date | None) -> str:
    if not birth_date:
        return "Unknown"
    age = int((date.today() - birth_date).days / 365.25)
    if age < 25:
        return "<25"
    if age < 35:
        return "25-34"
    if age < 45:
        return "35-44"
    if age < 55:
        return "45-54"
    return "55+"


def _count_rows(rows: list[dict], key: str) -> list[dict]:
    counts = Counter(row.get(key) or "Unspecified" for row in rows)
    return [{"label": label, "value": value} for label, value in counts.most_common()]


CRITICAL_AUDIT_ACTIONS = {
    "employee_archived",
    "employee_terminated",
    "login_deactivated",
    "password_reset_requested",
    "user_role_updated",
    "welcome_email_failed",
}
WARNING_AUDIT_ACTIONS = {"data_quality_issue_detected", "employee_status_changed", "login_created"}


def _audit_severity(action: str | None) -> str:
    action_value = (action or "").lower()
    if action_value in CRITICAL_AUDIT_ACTIONS or any(token in action_value for token in ("failed", "deleted", "terminated", "archived")):
        return "critical"
    if action_value in WARNING_AUDIT_ACTIONS or "detected" in action_value:
        return "warning"
    return "info"


def _xlsx_bytes(rows: list[dict]) -> bytes:
    headers = list(rows[0].keys()) if rows else ["report"]
    def cell_ref(col: int, row: int) -> str:
        name = ""
        col += 1
        while col:
            col, rem = divmod(col - 1, 26)
            name = chr(65 + rem) + name
        return f"{name}{row}"
    def esc(value: Any) -> str:
        return str(value if value is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    sheet_rows = []
    for r_index, values in enumerate([dict(zip(headers, headers))] + rows, start=1):
        cells = [
            f'<c r="{cell_ref(c_index, r_index)}" t="inlineStr"><is><t>{esc(values.get(header, ""))}</t></is></c>'
            for c_index, header in enumerate(headers)
        ]
        sheet_rows.append(f'<row r="{r_index}">{"".join(cells)}</row>')
    sheet = f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{"".join(sheet_rows)}</sheetData></worksheet>'
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        zf.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        zf.writestr("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="HR Report" sheetId="1" r:id="rId1"/></sheets></workbook>')
        zf.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        zf.writestr("xl/worksheets/sheet1.xml", sheet)
    return output.getvalue()


def _pdf_bytes(title: str, rows: list[dict]) -> bytes:
    lines = [title, f"Rows: {len(rows)}"] + [
        f"{row.get('employee_code', '')} {row.get('employee_name', '')} {row.get('department', '')}"[:90]
        for row in rows[:40]
    ]
    text = " BT /F1 10 Tf 50 780 Td " + " T* ".join(f"({line.replace('(', '').replace(')', '')}) Tj" for line in lines) + " ET"
    objects = [
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(text)} >> stream\n{text}\nendstream endobj",
    ]
    body = "\n".join(objects)
    return f"%PDF-1.4\n{body}\ntrailer << /Root 1 0 R >>\n%%EOF".encode("utf-8")


def _severity(issue_type: str) -> str:
    if issue_type in {"Duplicate employee code", "Duplicate company email", "Active employee with termination date", "Terminated employee with active login"}:
        return "High"
    if issue_type in {"Login not created", "Missing required data", "Missing documents", "Welcome email pending"}:
        return "Medium"
    return "Low"


def _issue(row: Employee, issue_type: str, field: str, action: str, status: str = "Open") -> dict:
    return {
        "id": f"{row.id}:{issue_type}:{field}",
        "issue_type": issue_type,
        "severity": _severity(issue_type),
        "employee_id": row.id,
        "employee_code": row.employee_code,
        "employee_name": _employee_name(row),
        "department": row.department,
        "employment_type": row.employment_type or row.contract_type,
        "problem_field": field,
        "recommended_action": action,
        "status": status,
        "last_updated": _dt(row.updated_at) or _dt(row.created_at),
    }


def _profile_score(row: Employee) -> tuple[int, list[dict]]:
    missing = []
    for field, label in REQUIRED_PROFILE_FIELDS:
        if not _filled(getattr(row, field, None)):
            missing.append(_issue(row, "Missing required data", label, f"Update {label.lower()} in employee profile."))
    score = round(((len(REQUIRED_PROFILE_FIELDS) - len(missing)) / len(REQUIRED_PROFILE_FIELDS)) * 100)
    return score, missing


def _document_score(row: Employee) -> tuple[int, list[dict]]:
    # The current /api/employees source does not expose uploaded document evidence.
    # Treat the required checklist as missing until a document source is connected.
    return 0, [
        _issue(
            row,
            "Missing documents",
            "Required document checklist",
            f"Upload or verify required documents: {', '.join(REQUIRED_DOCUMENT_TYPES)}.",
        )
    ]


def _system_score(row: Employee, auth_user: AuthUser | None, latest_welcome: EmailOutbox | None) -> tuple[int, list[dict]]:
    issues = []
    if not auth_user:
        issues.append(_issue(row, "Login not created", "Login account", "Create login account and send welcome email."))
    elif not auth_user.is_active and row.status != "TERMINATED":
        issues.append(_issue(row, "Login not created", "Login account", "Reactivate or review login account."))
    if auth_user and latest_welcome and latest_welcome.status != "SENT":
        issues.append(_issue(row, "Welcome email pending", "Welcome email", "Resend welcome email or verify SMTP status."))
    if row.status == "TERMINATED" and auth_user and auth_user.is_active:
        issues.append(_issue(row, "Terminated employee with active login", "Login account", "Deactivate login for terminated employee."))
    score = max(0, 100 - (50 * len(issues)))
    return score, issues


def _time_based_issues(row: Employee) -> list[dict]:
    today = date.today()
    issues = []
    if row.status == "ACTIVE" and row.termination_date:
        issues.append(_issue(row, "Active employee with termination date", "Termination date", "Confirm status or clear termination date."))
    if row.status == "PROBATION" and row.probation_end_date and today <= row.probation_end_date <= today + timedelta(days=30):
        issues.append(_issue(row, "Probation ending soon", "Probation end date", "Schedule probation review."))
    if row.status not in {"TERMINATED", "RESIGNED"} and row.termination_date and today <= row.termination_date <= today + timedelta(days=45):
        issues.append(_issue(row, "Contract expiring soon", "Termination / contract date", "Confirm renewal or offboarding plan."))
    return issues


def _employee_quality(row: Employee, auth_user: AuthUser | None, latest_welcome: EmailOutbox | None) -> dict:
    profile_score, profile_issues = _profile_score(row)
    document_score, document_issues = _document_score(row)
    system_score, system_issues = _system_score(row, auth_user, latest_welcome)
    issues = profile_issues + document_issues + system_issues + _time_based_issues(row)
    score = round((profile_score * 0.5) + (document_score * 0.3) + (system_score * 0.2))
    return {
        "employee_id": row.id,
        "employee_code": row.employee_code,
        "employee_name": _employee_name(row),
        "profile_score": profile_score,
        "document_score": document_score,
        "system_access_score": system_score,
        "overall_score": score,
        "issues": issues,
        "issue_count": len(issues),
    }


async def _summary_eligibility_rows(db: AsyncSession) -> list[dict]:
    employees = (await db.execute(select(Employee).order_by(Employee.full_name))).scalars().all()
    auth_users = {row.employee_code: row for row in (await db.execute(select(AuthUser))).scalars().all()}
    assignments = (await db.execute(select(ProjectAssignment).where(ProjectAssignment.is_active.is_(True)))).scalars().all()
    assigned_codes = {row.employee_code for row in assignments}
    rows = []
    for row in employees:
        user = auth_users.get(row.employee_code)
        required_missing = [label for field, label in REQUIRED_PROFILE_FIELDS if not _filled(getattr(row, field, None))]
        assignment_required = (row.department or "").lower() in {"project", "project management"} or bool(row.project_team in {"RF", "TE"})
        assigned = bool(row.employee_code in assigned_codes or row.project_code)
        readiness_missing = list(required_missing)
        if not user:
            readiness_missing.append("Login account")
        elif not user.is_active:
            readiness_missing.append("Active login")
        if row.status not in {"ACTIVE", "PROBATION"}:
            readiness_missing.append("Active or probation status")
        if assignment_required and not assigned:
            readiness_missing.append("Project assignment")
        clock_reasons = list(readiness_missing)
        if not (row.work_location or row.project_code or (user and user.work_location_name)):
            clock_reasons.append("Work location")
        if row.status in {"TERMINATED", "RESIGNED", "ARCHIVED"} or row.termination_date:
            clock_reasons.append("Not terminated or archived")
        kpi_reasons = []
        for label, value in [("Department", row.department), ("Position", row.position or row.job_title or row.project_role), ("Job level", row.job_level), ("Manager", row.manager_name or row.manager_code)]:
            if not _filled(value):
                kpi_reasons.append(label)
        if row.status not in {"ACTIVE", "PROBATION"}:
            kpi_reasons.append("Active or probation status")
        if assignment_required and not assigned:
            kpi_reasons.append("Project assignment")
        total = 6 + (1 if assignment_required else 0)
        score = max(0, round(((total - len(set(readiness_missing))) / total) * 100))
        rows.append({
            "employee_id": row.id,
            "employee_code": row.employee_code,
            "employee_name": _employee_name(row),
            "department": row.department,
            "readiness_score": score,
            "readiness_status": "Ready for Project Assignment" if not readiness_missing and not assigned else ("Active in Project" if not readiness_missing and assigned else "Not Ready"),
            "missing_requirements": sorted(set(readiness_missing)),
            "clock_eligible": not clock_reasons,
            "clock_blocking_reasons": sorted(set(clock_reasons)),
            "kpi_eligible": not kpi_reasons,
            "kpi_blocking_reasons": sorted(set(kpi_reasons)),
        })
    return rows


async def _quality_context(db: AsyncSession):
    employees = (await db.execute(select(Employee).order_by(Employee.full_name))).scalars().all()
    auth_users = {
        row.employee_code: row
        for row in (await db.execute(select(AuthUser))).scalars().all()
    }
    welcome_rows = (
        await db.execute(
            select(EmailOutbox)
            .where(EmailOutbox.subject.ilike("%welcome%"))
            .order_by(EmailOutbox.created_at.desc())
        )
    ).scalars().all()
    latest_by_recipient: dict[str, EmailOutbox] = {}
    for row in welcome_rows:
        key = (row.recipient or "").lower()
        if key and key not in latest_by_recipient:
            latest_by_recipient[key] = row
    return employees, auth_users, latest_by_recipient


async def _quality_rows(db: AsyncSession) -> list[dict]:
    employees, auth_users, latest_by_recipient = await _quality_context(db)
    email_counts = Counter((row.email or "").strip().lower() for row in employees if _filled(row.email))
    code_counts = Counter((row.employee_code or "").strip().upper() for row in employees if _filled(row.employee_code))
    rows = []
    for row in employees:
        auth_user = auth_users.get(row.employee_code)
        latest_welcome = latest_by_recipient.get((row.email or "").lower())
        quality = _employee_quality(row, auth_user, latest_welcome)
        if code_counts.get((row.employee_code or "").upper(), 0) > 1:
            quality["issues"].append(_issue(row, "Duplicate employee code", "Employee code", "Merge or correct duplicate employee code."))
        if row.email and email_counts.get(row.email.strip().lower(), 0) > 1:
            quality["issues"].append(_issue(row, "Duplicate company email", "Company email", "Assign a unique company email."))
        rows.append(quality)
    return rows


@router.get("/data-quality/summary")
async def data_quality_summary(payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _quality_rows(db)
    issues = [issue for row in rows for issue in row["issues"]]
    total = len(rows)
    avg_score = round(sum(row["overall_score"] for row in rows) / total) if total else 100

    def count_issue(name: str) -> int:
        return sum(1 for issue in issues if issue["issue_type"] == name)

    missing_field = lambda label: sum(1 for issue in issues if issue["issue_type"] == "Missing required data" and issue["problem_field"] == label)
    return {
        "overall_score": avg_score,
        "employee_count": total,
        "open_issue_count": len(issues),
        "missing_required_data": count_issue("Missing required data"),
        "missing_documents": count_issue("Missing documents"),
        "missing_company_email": missing_field("Company email"),
        "missing_phone": missing_field("Phone"),
        "missing_manager": missing_field("Manager"),
        "missing_cost_center": missing_field("Cost center"),
        "missing_work_location": missing_field("Work location"),
        "missing_job_level": missing_field("Job level"),
        "login_not_created": count_issue("Login not created"),
        "welcome_email_pending": count_issue("Welcome email pending"),
        "duplicate_employee_code": count_issue("Duplicate employee code"),
        "duplicate_company_email": count_issue("Duplicate company email"),
        "active_employee_with_termination_date": count_issue("Active employee with termination date"),
        "terminated_employee_with_active_login": count_issue("Terminated employee with active login"),
        "probation_ending_soon": count_issue("Probation ending soon"),
        "contract_expiring_soon": count_issue("Contract expiring soon"),
        "score_weights": {"profile": 50, "documents": 30, "system_access": 20},
    }


@router.get("/data-quality/issues")
async def data_quality_issues(
    severity: str = Query(""),
    issue_type: str = Query(""),
    department: str = Query(""),
    status: str = Query(""),
    employment_type: str = Query(""),
    missing_documents: bool = Query(False),
    system_access_issue: bool = Query(False),
    search: str = Query(""),
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await _quality_rows(db)
    issues = [issue for row in rows for issue in row["issues"]]
    if severity:
        issues = [i for i in issues if i["severity"].lower() == severity.lower()]
    if issue_type:
        issues = [i for i in issues if i["issue_type"] == issue_type]
    if department:
        issues = [i for i in issues if i["department"] == department]
    if status:
        issues = [i for i in issues if i["status"] == status]
    if employment_type:
        issues = [i for i in issues if i.get("employment_type") == employment_type]
    if missing_documents:
        issues = [i for i in issues if i["issue_type"] == "Missing documents"]
    if system_access_issue:
        issues = [i for i in issues if i["issue_type"] in {"Login not created", "Welcome email pending", "Terminated employee with active login"}]
    if search:
        q = search.lower()
        issues = [i for i in issues if q in " ".join(str(i.get(k, "")) for k in ("employee_code", "employee_name", "issue_type", "problem_field")).lower()]
    return {"data": issues, "total": len(issues)}


@router.get("/data-quality/employees/{employee_id}")
async def employee_data_quality(employee_id: int, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _quality_rows(db)
    row = next((item for item in rows if item["employee_id"] == employee_id), None)
    if not row:
        raise HTTPException(404, "Employee not found")
    return row


@router.post("/data-quality/recalculate")
async def recalculate_data_quality(request: Request, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _quality_rows(db)
    issues = [issue for row in rows for issue in row["issues"]]
    for issue in issues[:200]:
        await write_audit_log(
            db,
            action="data_quality_issue_detected",
            entity_type="data_quality_issue",
            entity_id=issue["id"],
            employee_id=issue["employee_id"],
            payload=payload,
            new_value={"issue_type": issue["issue_type"], "problem_field": issue["problem_field"], "severity": issue["severity"]},
            changed_fields=["issue_type", "problem_field", "severity"],
            request=request,
            source="Data Quality",
        )
    await db.commit()
    return {"status": "ok", "employees": len(rows), "issues": len(issues)}


# ─── Master Data: Departments ──────────────────────────────────────────────────

class DepartmentIn(BaseModel):
    code: str
    name: str
    sort_order: int | None = 0
    is_active: bool | None = True


@router.get("/departments")
async def list_departments(
    active_only: bool = Query(True),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sql = "SELECT id, code, name, sort_order, is_active FROM hr_departments"
    if active_only:
        sql += " WHERE is_active=TRUE"
    sql += " ORDER BY sort_order, code"
    rows = (await db.execute(text(sql))).mappings().all()
    return {"data": [dict(r) for r in rows], "total": len(rows)}


@router.post("/departments", status_code=201)
async def create_department(body: DepartmentIn, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(text("SELECT id FROM hr_departments WHERE code=:c"), {"c": body.code.upper()})).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Department code already exists")
    await db.execute(text(
        "INSERT INTO hr_departments (code, name, sort_order, is_active) VALUES (:c, :n, :s, :a)"
    ), {"c": body.code.upper(), "n": body.name, "s": body.sort_order or 0, "a": body.is_active if body.is_active is not None else True})
    await db.commit()
    return {"status": "ok", "code": body.code.upper()}


@router.patch("/departments/{dept_id}")
async def update_department(dept_id: int, body: DepartmentIn, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text(
        "UPDATE hr_departments SET name=:n, sort_order=:s, is_active=:a, updated_at=NOW() WHERE id=:id"
    ), {"id": dept_id, "n": body.name, "s": body.sort_order or 0, "a": body.is_active if body.is_active is not None else True})
    await db.commit()
    return {"status": "ok"}


@router.delete("/departments/{dept_id}")
async def delete_department(dept_id: int, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE hr_departments SET is_active=FALSE WHERE id=:id"), {"id": dept_id})
    await db.commit()
    return {"status": "ok"}


# ─── Master Data: Positions ────────────────────────────────────────────────────

class PositionIn(BaseModel):
    name: str
    dept_code: str | None = None
    section_name: str | None = None
    clock_type: str | None = "DAILY"
    gps_required: bool | None = True
    photo_required: bool | None = True
    system_role: str | None = "EMPLOYEE"
    sort_order: int | None = 0
    is_active: bool | None = True


@router.get("/positions")
async def list_positions(
    dept_code: str | None = Query(None),
    active_only: bool = Query(True),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clauses = []
    params = {}
    if active_only:
        clauses.append("is_active=TRUE")
    if dept_code:
        clauses.append("dept_code=:d")
        params["d"] = dept_code.upper()
    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    rows = (await db.execute(text(
        f"SELECT id, name, dept_code, section_name, clock_type, gps_required, photo_required, system_role, sort_order, is_active "
        f"FROM hr_positions{where} ORDER BY dept_code, sort_order, name"
    ), params)).mappings().all()
    return {"data": [dict(r) for r in rows], "total": len(rows)}


@router.post("/positions", status_code=201)
async def create_position(body: PositionIn, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text(
        "INSERT INTO hr_positions (name, dept_code, section_name, clock_type, gps_required, photo_required, system_role, sort_order, is_active) "
        "VALUES (:n, :d, :s, :ct, :gps, :photo, :role, :sort, :a)"
    ), {
        "n": body.name, "d": (body.dept_code or "").upper() or None, "s": body.section_name,
        "ct": body.clock_type or "DAILY", "gps": bool(body.gps_required), "photo": bool(body.photo_required),
        "role": body.system_role or "EMPLOYEE", "sort": body.sort_order or 0, "a": bool(body.is_active),
    })
    await db.commit()
    return {"status": "ok"}


@router.patch("/positions/{pos_id}")
async def update_position(pos_id: int, body: PositionIn, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text(
        "UPDATE hr_positions SET name=:n, dept_code=:d, section_name=:s, clock_type=:ct, gps_required=:gps, photo_required=:photo, system_role=:role, sort_order=:sort, is_active=:a, updated_at=NOW() "
        "WHERE id=:id"
    ), {
        "id": pos_id, "n": body.name, "d": (body.dept_code or "").upper() or None, "s": body.section_name,
        "ct": body.clock_type or "DAILY", "gps": bool(body.gps_required), "photo": bool(body.photo_required),
        "role": body.system_role or "EMPLOYEE", "sort": body.sort_order or 0, "a": bool(body.is_active),
    })
    await db.commit()
    return {"status": "ok"}


@router.delete("/positions/{pos_id}")
async def delete_position(pos_id: int, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE hr_positions SET is_active=FALSE WHERE id=:id"), {"id": pos_id})
    await db.commit()
    return {"status": "ok"}


@router.get("/org-chart")
async def org_chart(
    view: str = Query("dept", regex="^(dept|manager|project)$"),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(Employee).where(Employee.status.in_(("ACTIVE", "PROBATION"))))).scalars().all()
    total = len(rows)

    def emp_dict(e: Employee) -> dict:
        return {
            "id": e.id,
            "employee_code": e.employee_code,
            "full_name": e.full_name,
            "first_name": e.first_name,
            "last_name": e.last_name,
            "position": e.position or e.job_title or "—",
            "section_name": e.section_name,
            "department": e.department,
            "project_team": e.project_team,
            "project_role": e.project_role,
            "project_code": e.project_code,
            "manager_code": e.manager_code,
            "manager_name": e.manager_name,
            "employment_type": e.employment_type,
            "photo_url": e.photo_url,
            "email": e.email,
            "status": e.status,
        }

    items = [emp_dict(r) for r in rows]

    if view == "dept":
        # Build: ACE → Department → Section → Position group → employees
        tree = {"name": "ACE", "type": "root", "count": total, "children": []}
        by_dept: dict[str, dict] = {}
        for it in items:
            dept = it["department"] or "Unassigned"
            if dept not in by_dept:
                by_dept[dept] = {"name": dept, "type": "department", "count": 0, "children_map": {}}
            d = by_dept[dept]
            d["count"] += 1
            section = it["section_name"] or "—"
            if section not in d["children_map"]:
                d["children_map"][section] = {"name": section, "type": "section", "count": 0, "children_map": {}}
            s = d["children_map"][section]
            s["count"] += 1
            position = it["position"] or "—"
            if position not in s["children_map"]:
                s["children_map"][position] = {"name": position, "type": "position", "count": 0, "employees": []}
            p = s["children_map"][position]
            p["count"] += 1
            p["employees"].append(it)

        def finalize(node):
            if "children_map" in node:
                node["children"] = [finalize(c) for c in node["children_map"].values()]
                del node["children_map"]
            return node

        tree["children"] = sorted(
            [finalize(d) for d in by_dept.values()],
            key=lambda x: -x["count"],
        )
        return {"view": "dept", "total": total, "tree": tree}

    elif view == "project":
        tree = {"name": "Projects", "type": "root", "count": total, "children": []}
        by_proj: dict[str, dict] = {}
        for it in items:
            proj = it["project_code"] or "Unassigned"
            if proj not in by_proj:
                by_proj[proj] = {"name": proj, "type": "project", "count": 0, "employees": []}
            by_proj[proj]["count"] += 1
            by_proj[proj]["employees"].append(it)
        tree["children"] = sorted(by_proj.values(), key=lambda x: -x["count"])
        return {"view": "project", "total": total, "tree": tree}

    else:  # manager
        # Build hierarchy from manager_code
        by_code = {it["employee_code"]: it for it in items}
        children_map: dict[str | None, list] = {}
        for it in items:
            mgr = it.get("manager_code") if it.get("manager_code") in by_code else None
            children_map.setdefault(mgr, []).append(it)

        def build(code):
            kids = children_map.get(code, [])
            out = []
            for k in sorted(kids, key=lambda x: x["full_name"] or ""):
                out.append({
                    **k,
                    "type": "person",
                    "children": build(k["employee_code"]),
                })
            return out

        roots = build(None)
        return {"view": "manager", "total": total, "roots": roots}


@router.get("/contract-alerts")
async def contract_alerts(
    days: int = Query(30, ge=1, le=365),
    include_overdue: bool = Query(True),
    overdue_days: int = Query(90, ge=1, le=365),
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    cutoff = today + timedelta(days=days)
    overdue_from = today - timedelta(days=overdue_days)
    lower = overdue_from if include_overdue else today
    result = await db.execute(
        select(Employee).where(
            Employee.contract_end_date.is_not(None),
            Employee.contract_end_date >= lower,
            Employee.contract_end_date <= cutoff,
            Employee.status.in_(("ACTIVE", "PROBATION")),
        ).order_by(Employee.contract_end_date)
    )
    rows = result.scalars().all()

    def bucket(end: date) -> str:
        delta = (end - today).days
        if delta < 0: return "overdue"
        if delta <= 7: return "<=7"
        if delta <= 14: return "8-14"
        if delta <= 30: return "15-30"
        return "31+"

    items = [{
        "employee_id": e.id,
        "employee_code": e.employee_code,
        "full_name": e.full_name,
        "email": e.email,
        "department": e.department,
        "position": e.position or e.job_title,
        "contract_type": e.contract_type,
        "contract_start_date": e.contract_start_date.isoformat() if e.contract_start_date else None,
        "contract_end_date": e.contract_end_date.isoformat() if e.contract_end_date else None,
        "days_until_expiry": (e.contract_end_date - today).days,
        "bucket": bucket(e.contract_end_date),
        "manager_name": e.manager_name,
    } for e in rows]

    return {
        "total": len(items),
        "data": items,
        "within_days": days,
        "include_overdue": include_overdue,
        "overdue_days": overdue_days,
        "as_of_date": today.isoformat(),
        "buckets": {
            "overdue": sum(1 for i in items if i["bucket"] == "overdue"),
            "lte_7": sum(1 for i in items if i["bucket"] == "<=7"),
            "8_14": sum(1 for i in items if i["bucket"] == "8-14"),
            "15_30": sum(1 for i in items if i["bucket"] == "15-30"),
        },
    }


@router.post("/contract-alerts/send-digest")
async def contract_alerts_send_digest(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.email_service import contract_expiry_digest_email, queue_and_send_email

    today = date.today()
    cutoff = today + timedelta(days=days)
    emp_result = await db.execute(
        select(Employee).where(
            Employee.contract_end_date.is_not(None),
            Employee.contract_end_date >= today,
            Employee.contract_end_date <= cutoff,
            Employee.status.in_(("ACTIVE", "PROBATION")),
        ).order_by(Employee.contract_end_date)
    )
    expiring = emp_result.scalars().all()

    hr_result = await db.execute(
        select(AuthUser).where(
            AuthUser.role.in_(("HR_ADMIN", "SUPER_ADMIN")),
            AuthUser.is_active.is_(True),
            AuthUser.email.is_not(None),
        )
    )
    hr_users = hr_result.scalars().all()
    recipients = [u.email for u in hr_users if u.email]

    if not recipients:
        raise HTTPException(404, "No HR/Admin recipients found")
    if not expiring:
        return {"status": "no_expiring_contracts", "recipients": recipients, "total": 0}

    contracts = [{
        "employee_code": e.employee_code,
        "full_name": e.full_name,
        "department": e.department,
        "contract_type": e.contract_type,
        "contract_end_date": e.contract_end_date.isoformat(),
        "days_until_expiry": (e.contract_end_date - today).days,
    } for e in expiring]

    subject, body_text, body_html = contract_expiry_digest_email(contracts, days)

    primary = recipients[0]
    cc = recipients[1:] if len(recipients) > 1 else None
    sent_result = await queue_and_send_email(db, primary, subject, body_text, body_html, cc=cc)

    await write_audit_log(
        db, action="contract_expiry_digest_sent", entity_type="email",
        entity_id=sent_result.outbox_id, payload=payload,
        new_value={"recipients": recipients, "expiring_count": len(contracts), "within_days": days},
        changed_fields=["recipients", "expiring_count"], request=request, source="HR Data Quality",
    )
    await db.commit()

    return {
        "status": sent_result.status,
        "recipients": recipients,
        "total": len(contracts),
        "outbox_id": sent_result.outbox_id,
        "error_message": sent_result.error_message,
    }


@router.get("/project-readiness/summary")
async def project_readiness_summary(payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _summary_eligibility_rows(db)
    return {
        "data": rows,
        "total": len(rows),
        "ready": sum(1 for row in rows if row["readiness_status"] != "Not Ready"),
        "not_ready": sum(1 for row in rows if row["readiness_status"] == "Not Ready"),
        "average_score": round(sum(row["readiness_score"] for row in rows) / len(rows)) if rows else 100,
    }


@router.get("/clock-eligibility/summary")
async def clock_eligibility_summary(payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _summary_eligibility_rows(db)
    return {"data": rows, "total": len(rows), "eligible": sum(1 for row in rows if row["clock_eligible"]), "blocked": sum(1 for row in rows if not row["clock_eligible"])}


@router.get("/kpi-eligibility/summary")
async def kpi_eligibility_summary(payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    rows = await _summary_eligibility_rows(db)
    return {"data": rows, "total": len(rows), "eligible": sum(1 for row in rows if row["kpi_eligible"]), "blocked": sum(1 for row in rows if not row["kpi_eligible"])}


async def _analytics_payload(db: AsyncSession) -> dict:
    employees, auth_users, latest_by_recipient = await _quality_context(db)
    quality_rows = await _quality_rows(db)
    quality_by_id = {row["employee_id"]: row for row in quality_rows}
    readiness_rows = await _summary_eligibility_rows(db)
    readiness_by_id = {row["employee_id"]: row for row in readiness_rows}
    today = date.today()
    month = today.month
    year = today.year

    rows = []
    for emp in employees:
        quality = quality_by_id.get(emp.id, {})
        ready = readiness_by_id.get(emp.id, {})
        auth = auth_users.get(emp.employee_code)
        welcome = latest_by_recipient.get((emp.email or "").lower())
        rows.append({
            "employee_id": emp.id,
            "employee_code": emp.employee_code,
            "employee_name": _employee_name(emp),
            "email": emp.email,
            "department": emp.department or "Unspecified",
            "section": emp.section_name or emp.project_team or "Unspecified",
            "position": emp.position or emp.job_title or emp.project_role or "Unspecified",
            "job_level": emp.job_level or "Unspecified",
            "manager": emp.manager_name or emp.manager_code or "Unspecified",
            "status": emp.status or "Unspecified",
            "employment_type": emp.employment_type or "Unspecified",
            "contract_type": emp.contract_type or emp.employment_type or "Unspecified",
            "hire_date": emp.hire_date.isoformat() if emp.hire_date else None,
            "termination_date": emp.termination_date.isoformat() if emp.termination_date else None,
            "probation_end_date": emp.probation_end_date.isoformat() if emp.probation_end_date else None,
            "data_quality_score": quality.get("overall_score", 0),
            "missing_required_count": sum(1 for issue in quality.get("issues", []) if issue["issue_type"] == "Missing required data"),
            "missing_document_count": sum(1 for issue in quality.get("issues", []) if issue["issue_type"] == "Missing documents"),
            "project_readiness_status": ready.get("readiness_status", "Not Ready"),
            "project_ready": ready.get("readiness_status") != "Not Ready",
            "clock_eligible": bool(ready.get("clock_eligible")),
            "kpi_eligible": bool(ready.get("kpi_eligible")),
            "login_created": bool(auth),
            "login_active": bool(auth and auth.is_active),
            "welcome_sent": bool(welcome and welcome.status == "SENT"),
            "contract_expiring_bucket": _bucket_date(emp.termination_date, 30),
            "probation_ending_bucket": _bucket_date(emp.probation_end_date, 30),
            "tenure_bucket": _tenure_bucket(emp.hire_date),
            "age_bucket": _age_bucket(emp.date_of_birth),
        })

    total = len(rows)
    active = [r for r in rows if r["status"] == "ACTIVE"]
    terminated = [r for r in rows if r["status"] in {"TERMINATED", "RESIGNED"}]
    issues = [issue for row in quality_rows for issue in row["issues"]]
    by_dept_quality: dict[str, list[int]] = defaultdict(list)
    for row in rows:
        by_dept_quality[row["department"]].append(row["data_quality_score"])
    missing_breakdown = Counter(issue["problem_field"] for issue in issues if issue["issue_type"] == "Missing required data")
    hire_trend = Counter(_month_key(emp.hire_date) for emp in employees if emp.hire_date)
    term_trend = Counter(_month_key(emp.termination_date) for emp in employees if emp.termination_date)
    months = sorted(set(hire_trend.keys()) | set(term_trend.keys()))[-12:]
    active_login_terminated = sum(1 for emp in employees if emp.status in {"TERMINATED", "RESIGNED"} and auth_users.get(emp.employee_code) and auth_users[emp.employee_code].is_active)
    main_blocker = Counter(req for row in readiness_rows for req in row.get("missing_requirements", [])).most_common(1)

    def count_issue(name: str) -> int:
        return sum(1 for issue in issues if issue["issue_type"] == name)

    charts = {
        "headcount_by_department": _count_rows(rows, "department"),
        "headcount_by_section": _count_rows(rows, "section"),
        "status_distribution": _count_rows(rows, "status"),
        "employment_type_distribution": _count_rows(rows, "employment_type"),
        "monthly_hiring_trend": [{"label": m, "value": hire_trend.get(m, 0)} for m in months],
        "monthly_termination_trend": [{"label": m, "value": term_trend.get(m, 0)} for m in months],
        "new_hire_vs_termination": [{"label": m, "new_hires": hire_trend.get(m, 0), "terminations": term_trend.get(m, 0)} for m in months],
        "data_quality_by_department": [{"label": dept, "value": round(sum(scores) / len(scores))} for dept, scores in sorted(by_dept_quality.items())],
        "missing_data_breakdown": [{"label": label, "value": value} for label, value in missing_breakdown.most_common()],
        "project_readiness_funnel": [
            {"label": "Total", "value": total},
            {"label": "Active / Probation", "value": sum(1 for r in rows if r["status"] in {"ACTIVE", "PROBATION"})},
            {"label": "Login Active", "value": sum(1 for r in rows if r["login_active"])},
            {"label": "Project Ready", "value": sum(1 for r in rows if r["project_ready"])},
            {"label": "Clock Eligible", "value": sum(1 for r in rows if r["clock_eligible"])},
            {"label": "KPI Eligible", "value": sum(1 for r in rows if r["kpi_eligible"])},
        ],
        "clock_eligibility": [{"label": "Clock Eligible", "value": sum(1 for r in rows if r["clock_eligible"])}, {"label": "Clock Blocked", "value": sum(1 for r in rows if not r["clock_eligible"])}],
        "kpi_eligibility": [{"label": "KPI Eligible", "value": sum(1 for r in rows if r["kpi_eligible"])}, {"label": "KPI Blocked", "value": sum(1 for r in rows if not r["kpi_eligible"])}],
        "contract_expiring": _count_rows([r for r in rows if r["termination_date"]], "contract_expiring_bucket"),
        "probation_ending": _count_rows([r for r in rows if r["probation_end_date"]], "probation_ending_bucket"),
        "tenure_distribution": _count_rows(rows, "tenure_bucket"),
        "age_distribution": _count_rows(rows, "age_bucket"),
        "login_welcome_status": [
            {"label": "Login Active", "value": sum(1 for r in rows if r["login_active"])},
            {"label": "Login Not Created", "value": sum(1 for r in rows if not r["login_created"])},
            {"label": "Welcome Sent", "value": sum(1 for r in rows if r["welcome_sent"])},
            {"label": "Welcome Pending", "value": sum(1 for r in rows if r["login_created"] and not r["welcome_sent"])},
        ],
    }
    summary = {
        "total_employees": total,
        "active_employees": len(active),
        "probation_employees": sum(1 for r in rows if r["status"] == "PROBATION"),
        "subcontract_employees": sum(1 for r in rows if r["contract_type"] == "SUBCONTRACT" or r["employment_type"] == "SUBCONTRACT"),
        "on_leave_employees": sum(1 for r in rows if r["status"] == "ON_LEAVE"),
        "terminated_employees": len(terminated),
        "new_hires_this_month": sum(1 for emp in employees if emp.hire_date and emp.hire_date.year == year and emp.hire_date.month == month),
        "terminations_this_month": sum(1 for emp in employees if emp.termination_date and emp.termination_date.year == year and emp.termination_date.month == month),
        "average_data_quality_score": round(sum(r["data_quality_score"] for r in rows) / total) if total else 100,
        "project_ready_employees": sum(1 for r in rows if r["project_ready"]),
        "clock_eligible_employees": sum(1 for r in rows if r["clock_eligible"]),
        "kpi_eligible_employees": sum(1 for r in rows if r["kpi_eligible"]),
        "missing_required_data": count_issue("Missing required data"),
        "missing_documents": count_issue("Missing documents"),
        "login_not_created": count_issue("Login not created"),
        "welcome_email_pending": count_issue("Welcome email pending"),
        "contract_expiring_soon": count_issue("Contract expiring soon"),
        "probation_ending_soon": count_issue("Probation ending soon"),
    }
    insights = [
        {"title": "Highest headcount department", "value": charts["headcount_by_department"][0]["label"] if charts["headcount_by_department"] else "None", "severity": "info"},
        {"title": "Missing document warning", "value": summary["missing_documents"], "severity": "warning" if summary["missing_documents"] else "success"},
        {"title": "Contract expiring warning", "value": summary["contract_expiring_soon"], "severity": "warning" if summary["contract_expiring_soon"] else "success"},
        {"title": "Probation ending warning", "value": summary["probation_ending_soon"], "severity": "warning" if summary["probation_ending_soon"] else "success"},
        {"title": "Terminated employee with active login warning", "value": active_login_terminated, "severity": "critical" if active_login_terminated else "success"},
        {"title": "Data quality status", "value": f"{summary['average_data_quality_score']}% current baseline", "severity": "info"},
        {"title": "Main blocker for project readiness", "value": main_blocker[0][0] if main_blocker else "No blocker", "severity": "warning" if main_blocker else "success"},
    ]
    return {"summary": summary, "charts": charts, "insights": insights, "rows": rows}


@router.get("/analytics/summary")
async def analytics_summary(payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    data = await _analytics_payload(db)
    return {"summary": data["summary"], "charts": data["charts"], "insights": data["insights"]}


@router.get("/analytics/{chart_name}")
async def analytics_chart(chart_name: str, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    data = await _analytics_payload(db)
    normalized = chart_name.replace("-", "_")
    if normalized == "insights":
        return {"data": data["insights"]}
    if normalized not in data["charts"]:
        raise HTTPException(404, "Analytics chart not found")
    return {"data": data["charts"][normalized]}


@router.get("/reports/export")
async def export_report(
    report: str = Query("employee-master"),
    format: str = Query("csv"),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if report in {"audit-log", "audit-logs"}:
        _require_system_audit(payload)
        audit_rows = (await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(1000))).scalars().all()
        employees = {
            row.id: row
            for row in (await db.execute(select(Employee).where(Employee.id.in_([r.employee_id for r in audit_rows if r.employee_id])))).scalars().all()
        } if audit_rows else {}
        rows = [_audit_to_dict(row, employees.get(row.employee_id)) for row in audit_rows]
    else:
        if payload.get("role") not in {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "HR_VIEWER", "DIRECTOR"}:
            raise HTTPException(status_code=403, detail="Not allowed")
        data = await _analytics_payload(db)
        rows = data["rows"]
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    content = output.getvalue()
    filename = f"{report}.{format if format in {'csv', 'xlsx', 'pdf'} else 'csv'}"
    media_type = "text/csv"
    if format == "pdf":
        content = _pdf_bytes(report, rows)
        media_type = "application/pdf"
    elif format == "xlsx":
        content = _xlsx_bytes(rows)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return Response(content=content, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


def _audit_to_dict(row: AuditLog, employee: Employee | None = None) -> dict:
    return {
        "id": row.id,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "employee_id": row.employee_id,
        "employee_code": employee.employee_code if employee else None,
        "employee_name": _employee_name(employee) if employee else None,
        "action": row.action,
        "action_label": row.action_label,
        "severity": _audit_severity(row.action),
        "target_label": f"{row.entity_type}:{row.entity_id}" if row.entity_type and row.entity_id else (row.entity_type or row.entity_id),
        "changed_by_user_id": row.changed_by_user_id,
        "changed_by_name": row.changed_by_name,
        "changed_by_email": row.changed_by_email,
        "old_value": row.old_value,
        "new_value": row.new_value,
        "changed_fields": row.changed_fields or [],
        "ip_address": row.ip_address,
        "user_agent": row.user_agent,
        "source": row.source,
        "created_at": _dt(row.created_at),
    }


def _require_system_audit(payload: dict) -> None:
    if payload.get("role") not in SYSTEM_AUDIT_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")


@router.get("/audit-logs")
async def audit_logs(
    date_from: str = Query(""),
    date_to: str = Query(""),
    action: str = Query(""),
    employee: str = Query(""),
    changed_by: str = Query(""),
    severity: str = Query(""),
    target: str = Query(""),
    entity_type: str = Query(""),
    source: str = Query(""),
    limit: int = Query(100, ge=1, le=500),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_system_audit(payload)
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if date_from:
        stmt = stmt.where(AuditLog.created_at >= datetime.fromisoformat(date_from[:10]))
    if date_to:
        stmt = stmt.where(AuditLog.created_at < datetime.fromisoformat(date_to[:10]) + timedelta(days=1))
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if source:
        stmt = stmt.where(AuditLog.source == source)
    if changed_by:
        q = f"%{changed_by}%"
        stmt = stmt.where(or_(AuditLog.changed_by_name.ilike(q), AuditLog.changed_by_email.ilike(q)))
    if target:
        q = f"%{target}%"
        stmt = stmt.where(or_(AuditLog.entity_type.ilike(q), AuditLog.entity_id.ilike(q)))
    rows = (await db.execute(stmt)).scalars().all()
    employees = {
        row.id: row
        for row in (await db.execute(select(Employee).where(Employee.id.in_([r.employee_id for r in rows if r.employee_id])))).scalars().all()
    } if rows else {}
    data = [_audit_to_dict(row, employees.get(row.employee_id)) for row in rows]
    if employee:
        q = employee.lower()
        data = [row for row in data if q in f"{row.get('employee_code') or ''} {row.get('employee_name') or ''}".lower()]
    if severity:
        data = [row for row in data if row.get("severity") == severity]
    return {"data": data, "total": len(data)}


@router.get("/audit-logs/{audit_id}")
async def audit_log_detail(audit_id: int, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_system_audit(payload)
    row = (await db.execute(select(AuditLog).where(AuditLog.id == audit_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Audit log not found")
    employee = (await db.execute(select(Employee).where(Employee.id == row.employee_id))).scalar_one_or_none() if row.employee_id else None
    return _audit_to_dict(row, employee)


@router.get("/employees/{employee_id}/history")
async def employee_history(employee_id: int, payload: dict = Depends(require_hr_user), db: AsyncSession = Depends(get_db)):
    employee = (await db.execute(select(Employee).where(Employee.id == employee_id))).scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "Employee not found")
    rows = (
        await db.execute(
            select(AuditLog)
            .where(AuditLog.employee_id == employee_id)
            .order_by(AuditLog.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return {"data": [_audit_to_dict(row, employee) for row in rows], "total": len(rows)}
