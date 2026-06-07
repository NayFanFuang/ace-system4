import os
import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, require_hr_user, require_monitor_user, require_self_or_admin
from app.models.auth_user import AuthUser
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.settings import SystemSetting
from app.services.email_service import queue_and_send_email
from app.services.leave_emails import (
    leave_submitted_email,
    leave_pm_approved_email,
    leave_spm_approved_email,
    leave_dc_approved_email,
    leave_hr_acknowledged_email,
    leave_rejected_email,
)
from app.services.leave_tokens import (
    create_leave_token,
    decode_leave_token,
    APP_BASE_URL as APP_BASE_URL_FOR_EMAIL,
)
from jose import JWTError

router = APIRouter(prefix="/api/leave", tags=["Leave"])

SICK_LEAVE_TYPES = {"Sick Leave", "Sick", "Medical Leave"}
PERSONAL_LEAVE_TYPES = {"Personal Leave", "Personal"}
ANNUAL_LEAVE_TYPES = {"Annual Leave", "Vacation Leave", "Vacation"}
BOSS_FULL_NAME = "Seng Bun Lay"
LEAVE_ENTITLEMENTS = {
    "Sick Leave": 30.0,
    "Personal Leave": 3.0,
    "Annual Leave": 6.0,
    "Other Leave": None,
}
LEAVE_POLICY_KEY = "leave_entitlements"


# ── Schemas ───────────────────────────────────────────────────────────────────

class LeaveSubmitRequest(BaseModel):
    employee_code: str
    employee_name: str
    leave_type: str
    session_type: str = "Full Day"
    start_date: str
    end_date: str
    days: float = 1.0
    reason: str | None = None
    attachment_url: str | None = None


class StepActionRequest(BaseModel):
    actor_code: str
    reject_reason: str | None = None


class LeavePolicyRequest(BaseModel):
    entitlements: dict[str, float | None]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _chain_mode(db: AsyncSession) -> str:
    """Return 'FULL' (PM→SPM→DC→HR→Boss) or 'SHORT' (PM→DC→HR→Boss)."""
    row = (await db.execute(
        select(SystemSetting).where(SystemSetting.key == "leave_chain_mode")
    )).scalar_one_or_none()
    return (row.value if row else os.getenv("LEAVE_CHAIN_MODE", "SHORT")).upper()


async def _emails_by_role(db: AsyncSession, role: str) -> list[str]:
    rows = (await db.execute(
        select(AuthUser.email).where(
            AuthUser.role == role,
            AuthUser.is_active == True,
            AuthUser.email.isnot(None),
        )
    )).scalars().all()
    return [e for e in rows if e]


async def _manager_emails(db: AsyncSession, employee_code: str, fallback_role: str) -> list[str]:
    """Get emails of the direct manager. Falls back to all users with fallback_role."""
    emp = (await db.execute(
        select(Employee.manager_code).where(Employee.employee_code == employee_code)
    )).scalar_one_or_none()
    if emp:
        user = (await db.execute(
            select(AuthUser.email).where(
                AuthUser.employee_code == emp,
                AuthUser.email.isnot(None),
                AuthUser.is_active == True,
            )
        )).scalar_one_or_none()
        if user:
            return [user]
    return await _emails_by_role(db, fallback_role)


async def _notify(db: AsyncSession, emails: list[str], subject: str, body_text: str, body_html: str, cc: list[str] | None = None) -> None:
    for email in emails:
        await queue_and_send_email(db, email, subject, body_text, body_html, cc=cc)


async def _notify_role(db: AsyncSession, role: str, subject: str, body_text: str, body_html: str) -> None:
    await _notify(db, await _emails_by_role(db, role), subject, body_text, body_html)


async def _hr_emails(db: AsyncSession) -> list[str]:
    emails = []
    for role in ("HR_ADMIN", "HR"):
        emails.extend(await _emails_by_role(db, role))
    return sorted(set(emails))


async def _boss_emails(db: AsyncSession) -> list[str]:
    employee = (await db.execute(
        select(Employee).where(Employee.full_name.ilike(BOSS_FULL_NAME))
    )).scalar_one_or_none()
    emails: list[str] = []
    if employee and employee.email:
        emails.append(employee.email)
    if employee:
        auth_email = (await db.execute(
            select(AuthUser.email).where(
                AuthUser.employee_code == employee.employee_code,
                AuthUser.email.isnot(None),
                AuthUser.is_active == True,
            )
        )).scalar_one_or_none()
        if auth_email:
            emails.append(auth_email)
    if not emails:
        rows = (await db.execute(
            select(Employee.email).where(
                Employee.department.in_(["Executive Office", "Executive"]),
                Employee.section_name == "Head Office",
                Employee.email.isnot(None),
            )
        )).scalars().all()
        emails.extend(rows)
    return sorted(set(e for e in emails if e))


async def _hr_and_boss_emails(db: AsyncSession) -> list[str]:
    return sorted(set([*await _hr_emails(db), *await _boss_emails(db)]))


async def _employee_email(db: AsyncSession, employee_code: str) -> str | None:
    employee_email = (await db.execute(
        select(Employee.email).where(Employee.employee_code == employee_code, Employee.email.isnot(None))
    )).scalar_one_or_none()
    if employee_email:
        return employee_email
    return (await db.execute(
        select(AuthUser.email).where(
            AuthUser.employee_code == employee_code,
            AuthUser.email.isnot(None),
            AuthUser.is_active == True,
        )
    )).scalar_one_or_none()


async def _pd_emails(db: AsyncSession, employee_code: str, first_approver_code: str) -> list[str]:
    employee = (await db.execute(
        select(Employee).where(Employee.employee_code == employee_code)
    )).scalar_one_or_none()
    if employee and employee.department in {"Project", "Project Management"}:
        emails = []
        for role in ("DC", "DIRECTOR", "PROJECT_DIRECTOR"):
            emails.extend(await _emails_by_role(db, role))
        if emails:
            return sorted(set(emails))
    return await _manager_emails(db, first_approver_code, "DIRECTOR")


async def _leave_stakeholder_emails(db: AsyncSession, leave: LeaveRequest, actor_code: str | None = None) -> list[str]:
    """Resolve every email address that should at minimum receive a CC for this leave.

    The approval *chain* (who must click Approve) is controlled separately by the
    LeaveRequest.status machine. This function only decides who is *informed* —
    i.e. CC'd on every transition email.

    Policy: managers, project director, HR, and the Managing Director are
    informed for **every** leave type — including Sick. PM specifically needs to
    know about a Sick day so they can plan cover; Boss visibility is required
    for audit. (Previously PM/PD/Boss were skipped for Sick which left the
    requester's manager in the dark — see E2E trace for Peerapol/ACE056.)
    """
    emails: list[str] = []
    requester = await _employee_email(db, leave.employee_code)
    if requester:
        emails.append(requester)
    emails.extend(await _manager_emails(db, leave.employee_code, "PM"))
    emails.extend(await _pd_emails(
        db, leave.employee_code,
        actor_code or leave.pm_approved_by or leave.employee_code,
    ))
    emails.extend(await _hr_emails(db))
    emails.extend(await _boss_emails(db))
    return sorted(set(e for e in emails if e))


def _cc_for(to_emails: list[str], stakeholders: list[str]) -> list[str]:
    to_set = {email.lower() for email in to_emails}
    return [email for email in stakeholders if email.lower() not in to_set]


def _is_sick_leave(leave_type: str) -> bool:
    return leave_type in SICK_LEAVE_TYPES


def _is_personal_leave(leave_type: str) -> bool:
    return leave_type in PERSONAL_LEAVE_TYPES


def _requires_pd_approval(leave_type: str) -> bool:
    return not (_is_sick_leave(leave_type) or _is_personal_leave(leave_type))


def _leave_category(leave_type: str) -> str:
    if _is_sick_leave(leave_type):
        return "Sick Leave"
    if _is_personal_leave(leave_type):
        return "Personal Leave"
    if leave_type in ANNUAL_LEAVE_TYPES:
        return "Annual Leave"
    return "Other Leave"


def _days_text(days: float) -> str:
    return f"{days:.1f} day(s)"


def _normalize_leave_entitlements(raw: dict | None) -> dict[str, float | None]:
    values = dict(LEAVE_ENTITLEMENTS)
    if raw:
        for key in values:
            if key not in raw:
                continue
            value = raw[key]
            values[key] = None if value is None else max(0.0, float(value))
    return values


async def _leave_entitlements(db: AsyncSession) -> dict[str, float | None]:
    row = (await db.execute(
        select(SystemSetting).where(SystemSetting.key == LEAVE_POLICY_KEY)
    )).scalar_one_or_none()
    if not row:
        return dict(LEAVE_ENTITLEMENTS)
    try:
        return _normalize_leave_entitlements(json.loads(row.value or "{}"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return dict(LEAVE_ENTITLEMENTS)


def _month_window_back(anchor: date, n: int) -> list[tuple[int, int]]:
    """Return last n calendar months (year, month), ending with anchor's month."""
    out: list[tuple[int, int]] = []
    y, m = anchor.year, anchor.month
    for _ in range(n):
        out.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(out))


def _month_label(year: int, month: int) -> str:
    return f"{('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())[month - 1]} {year}"


async def _leave_stats(db: AsyncSession, leave: LeaveRequest) -> dict:
    category = _leave_category(leave.leave_type)
    year_start = date(leave.start_date.year, 1, 1)
    next_year_start = date(leave.start_date.year + 1, 1, 1)
    rows = (await db.execute(
        select(LeaveRequest).where(
            LeaveRequest.employee_code == leave.employee_code,
            LeaveRequest.start_date >= year_start,
            LeaveRequest.start_date < next_year_start,
        )
    )).scalars().all()

    approved_used = 0.0
    pending_days = 0.0
    for row in rows:
        if _leave_category(row.leave_type) != category:
            continue
        if row.status == "APPROVED":
            approved_used += float(row.days or 0)
        elif row.status.startswith("PENDING"):
            pending_days += float(row.days or 0)

    entitlements = await _leave_entitlements(db)
    entitlement = entitlements[category]
    if entitlement is None:
        entitlement_text = "Policy-based"
        remaining_text = "Policy-based"
    else:
        remaining_basis = approved_used if leave.status == "APPROVED" else approved_used + pending_days
        remaining_text = _days_text(entitlement - remaining_basis)
        entitlement_text = _days_text(entitlement)

    # ── 3-month rolling history (same category) ────────────────────────────
    months = _month_window_back(leave.start_date, 3)
    window_start = date(months[0][0], months[0][1], 1)
    history_rows = (await db.execute(
        select(LeaveRequest).where(
            LeaveRequest.employee_code == leave.employee_code,
            LeaveRequest.start_date >= window_start,
        )
    )).scalars().all()

    monthly_approved: dict[tuple[int, int], float] = {ym: 0.0 for ym in months}
    monthly_pending:  dict[tuple[int, int], float] = {ym: 0.0 for ym in months}
    for row in history_rows:
        if _leave_category(row.leave_type) != category:
            continue
        key = (row.start_date.year, row.start_date.month)
        if key not in monthly_approved:
            continue
        days = float(row.days or 0)
        if row.status == "APPROVED":
            monthly_approved[key] += days
        elif row.status.startswith("PENDING"):
            monthly_pending[key] += days

    last_3_months = [
        {
            "label":     _month_label(y, m),
            "year":      y,
            "month":     m,
            "approved":  monthly_approved[(y, m)],
            "pending":   monthly_pending[(y, m)],
        }
        for (y, m) in months
    ]
    last_3_months_total_approved = sum(item["approved"] for item in last_3_months)
    last_3_months_total_pending  = sum(item["pending"]  for item in last_3_months)

    return {
        "category": category,
        "year": leave.start_date.year,
        "entitlement": entitlement,
        "entitlement_text": entitlement_text,
        "approved_used": approved_used,
        "pending_days": pending_days,
        "this_request_days": float(leave.days or 0),
        "remaining_after_request_text": remaining_text,
        # 3-month rollup
        "last_3_months": last_3_months,
        "last_3_months_total_approved": last_3_months_total_approved,
        "last_3_months_total_pending":  last_3_months_total_pending,
    }


def _leave_dict(r: LeaveRequest) -> dict:
    return {
        "id": r.id,
        "employeeCode": r.employee_code,
        "employeeName": r.employee_name,
        "leaveType": r.leave_type,
        "sessionType": r.session_type,
        "startDate": r.start_date.isoformat(),
        "endDate": r.end_date.isoformat(),
        "days": r.days,
        "reason": r.reason or "",
        "attachmentUrl": r.attachment_url or "",
        "status": r.status,
        "pmApprovedBy": r.pm_approved_by or "",
        "pmApprovedAt": r.pm_approved_at.isoformat() if r.pm_approved_at else None,
        "spmApprovedBy": r.spm_approved_by or "",
        "spmApprovedAt": r.spm_approved_at.isoformat() if r.spm_approved_at else None,
        "dcApprovedBy": r.dc_approved_by or "",
        "dcApprovedAt": r.dc_approved_at.isoformat() if r.dc_approved_at else None,
        "hrAcknowledgedBy": r.hr_acknowledged_by or "",
        "hrAcknowledgedAt": r.hr_acknowledged_at.isoformat() if r.hr_acknowledged_at else None,
        "rejectAtStep": r.reject_at_step or "",
        "rejectReason": r.reject_reason or "",
        "reviewedBy": r.reviewed_by or "",
        "reviewedAt": r.reviewed_at.isoformat() if r.reviewed_at else None,
        "createdAt": r.created_at.isoformat(),
    }


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _resolve_actor_names(db: AsyncSession, codes: list[str | None]) -> dict[str, str]:
    """Map employee_codes to display names (full_name). Skips falsy codes.
    Used by email templates to show e.g. 'Atthapol Ruangboot (ACE010)' instead of bare 'ACE010'.
    """
    wanted = sorted({c for c in codes if c})
    if not wanted:
        return {}
    rows = (await db.execute(
        select(Employee.employee_code, Employee.full_name).where(Employee.employee_code.in_(wanted))
    )).all()
    return {r.employee_code: r.full_name for r in rows if r.full_name}


async def _actors_for(db: AsyncSession, leave: LeaveRequest, extra: list[str | None] | None = None) -> dict[str, str]:
    """Convenience: resolve every actor that may appear in any email template."""
    codes = [
        leave.employee_code,
        leave.pm_approved_by,
        leave.spm_approved_by,
        leave.dc_approved_by,
        leave.hr_acknowledged_by,
        leave.reviewed_by,
    ]
    if extra:
        codes.extend(extra)
    return await _resolve_actor_names(db, codes)


def _require_actor(payload: dict, actor_code: str) -> None:
    if payload.get("employee_code") == actor_code or payload.get("sub") == actor_code:
        return
    if payload.get("role") in {"SUPER_ADMIN", "HR_ADMIN", "PROJECT_ADMIN", "PM", "DC", "BOSS"}:
        return
    raise HTTPException(403, "Not allowed")


# ── Submit ────────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def submit_leave(
    body: LeaveSubmitRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_self_or_admin(payload, body.employee_code)
    from datetime import date as date_type
    start = date_type.fromisoformat(body.start_date)
    end = date_type.fromisoformat(body.end_date)
    if end < start:
        raise HTTPException(400, "End date must be on or after start date.")

    initial_status = "PENDING_HR" if _is_sick_leave(body.leave_type) else "PENDING_PM"
    leave = LeaveRequest(
        employee_code=body.employee_code,
        employee_name=body.employee_name,
        leave_type=body.leave_type,
        session_type=body.session_type,
        start_date=start,
        end_date=end,
        days=body.days,
        reason=body.reason,
        attachment_url=body.attachment_url,
        status=initial_status,
    )
    db.add(leave)
    await db.flush()

    # ── Over-budget guard ───────────────────────────────────────────────────
    # Reject submissions that would push the employee past their yearly
    # entitlement for this leave category. Skips when entitlement is None
    # (Policy-based categories like Other Leave have no hard cap).
    stats = await _leave_stats(db, leave)
    entitlement = stats["entitlement"]
    if entitlement is not None:
        # pending_days already includes this new request (just flushed above)
        consumed = stats["approved_used"] + stats["pending_days"]
        if consumed > entitlement + 1e-6:
            await db.rollback()
            raise HTTPException(
                400,
                (
                    f"Cannot submit: this would exceed your {stats['category']} entitlement "
                    f"({stats['entitlement_text']} per year). "
                    f"Approved used: {stats['approved_used']:.1f} d · "
                    f"Pending (incl. this): {stats['pending_days']:.1f} d · "
                    f"Over by {consumed - entitlement:.1f} d."
                ),
            )

    recipients = await _hr_emails(db) if _is_sick_leave(body.leave_type) else await _manager_emails(db, body.employee_code, "PM")
    subject, body_text, body_html = leave_submitted_email(leave, stats=stats, actors=await _actors_for(db, leave))
    stakeholders = await _leave_stakeholder_emails(db, leave)
    next_step = "hr" if _is_sick_leave(body.leave_type) else "pm"
    await _notify_with_links(
        db, recipients, leave.id, next_step, subject, body_text, body_html,
        cc=_cc_for(recipients, stakeholders),
    )

    await db.commit()
    await db.refresh(leave)
    return {"success": True, "id": leave.id, "leave": _leave_dict(leave)}


# ── Read ──────────────────────────────────────────────────────────────────────

@router.get("/my")
async def my_leaves(
    employee_code: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_self_or_admin(payload, employee_code)
    rows = (await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.employee_code == employee_code)
        .order_by(LeaveRequest.created_at.desc())
        .limit(50)
    )).scalars().all()
    return {"leaves": [_leave_dict(r) for r in rows]}


@router.get("/admin")
async def admin_leaves(
    status: str = "",
    employee_code: str = "",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LeaveRequest).order_by(LeaveRequest.created_at.desc())
    if status:
        stmt = stmt.where(LeaveRequest.status == status.upper())
    if employee_code:
        stmt = stmt.where(LeaveRequest.employee_code == employee_code)
    rows = (await db.execute(stmt.limit(200))).scalars().all()
    return {"leaves": [_leave_dict(r) for r in rows]}


@router.get("/chain-mode")
async def get_chain_mode(
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    return {"mode": await _chain_mode(db)}


@router.post("/chain-mode")
async def set_chain_mode(
    body: dict,
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    mode = body.get("mode", "SHORT").upper()
    if mode not in ("FULL", "SHORT"):
        raise HTTPException(400, "mode must be FULL or SHORT")
    row = (await db.execute(
        select(SystemSetting).where(SystemSetting.key == "leave_chain_mode")
    )).scalar_one_or_none()
    if row:
        row.value = mode
    else:
        db.add(SystemSetting(key="leave_chain_mode", value=mode, label="Leave Approval Chain Mode"))
    await db.commit()
    return {"mode": mode}


# ── Leave Policy ──────────────────────────────────────────────────────────────

@router.get("/policy")
async def get_leave_policy(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"entitlements": await _leave_entitlements(db)}


@router.put("/policy")
async def update_leave_policy(
    body: LeavePolicyRequest,
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    entitlements = _normalize_leave_entitlements(body.entitlements)
    row = (await db.execute(
        select(SystemSetting).where(SystemSetting.key == LEAVE_POLICY_KEY)
    )).scalar_one_or_none()
    value = json.dumps(entitlements)
    if row:
        row.value = value
        row.label = "Leave yearly entitlements"
    else:
        db.add(SystemSetting(key=LEAVE_POLICY_KEY, value=value, label="Leave yearly entitlements"))
    await db.commit()
    return {"entitlements": entitlements}


# ── PM Step ───────────────────────────────────────────────────────────────────

@router.post("/{leave_id}/pm-approve")
async def pm_approve(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_PM":
        raise HTTPException(400, f"Cannot PM-approve: status is {leave.status}.")

    leave.pm_approved_by = body.actor_code
    leave.pm_approved_at = _now()

    if _is_personal_leave(leave.leave_type):
        leave.status = "APPROVED"
        leave.reviewed_by = body.actor_code
        leave.reviewed_at = _now()
        stats = await _leave_stats(db, leave)
        subject, body_text, body_html = leave_hr_acknowledged_email(leave, stats=stats, actors=await _actors_for(db, leave))
        recipients = await _hr_and_boss_emails(db)
        stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
        await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    else:
        leave.status = "PENDING_DC"
        stats = await _leave_stats(db, leave)
        subject, body_text, body_html = leave_pm_approved_email(leave, next_step="PD", stats=stats, actors=await _actors_for(db, leave))
        recipients = await _pd_emails(db, leave.employee_code, body.actor_code)
        stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
        await _notify_with_links(
            db, recipients, leave.id, "pd", subject, body_text, body_html,
            cc=_cc_for(recipients, stakeholders),
        )

    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


@router.post("/{leave_id}/pm-reject")
async def pm_reject(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_PM":
        raise HTTPException(400, f"Cannot PM-reject: status is {leave.status}.")
    if not body.reject_reason:
        raise HTTPException(400, "Reject reason is required.")

    leave.status = "REJECTED"
    leave.pm_approved_by = body.actor_code
    leave.pm_approved_at = _now()
    leave.reject_at_step = "PM"
    leave.reject_reason = body.reject_reason
    leave.reviewed_by = body.actor_code
    leave.reviewed_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_rejected_email(leave, stats=stats, actors=await _actors_for(db, leave))
    recipients = await _hr_emails(db)
    stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
    await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


# ── SPM Step (Option A — FULL chain only) ─────────────────────────────────────

@router.post("/{leave_id}/spm-approve")
async def spm_approve(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_SPM":
        raise HTTPException(400, f"Cannot SPM-approve: status is {leave.status}.")

    leave.status = "PENDING_DC"
    leave.spm_approved_by = body.actor_code
    leave.spm_approved_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_spm_approved_email(leave, stats=stats, actors=await _actors_for(db, leave))
    await _notify_role(db, "DC", subject, body_text, body_html)
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


@router.post("/{leave_id}/spm-reject")
async def spm_reject(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_SPM":
        raise HTTPException(400, f"Cannot SPM-reject: status is {leave.status}.")
    if not body.reject_reason:
        raise HTTPException(400, "Reject reason is required.")

    leave.status = "REJECTED"
    leave.spm_approved_by = body.actor_code
    leave.spm_approved_at = _now()
    leave.reject_at_step = "SPM"
    leave.reject_reason = body.reject_reason
    leave.reviewed_by = body.actor_code
    leave.reviewed_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_rejected_email(leave, stats=stats, actors=await _actors_for(db, leave))
    recipients = await _hr_emails(db)
    stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
    await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


# ── DC Step ───────────────────────────────────────────────────────────────────

@router.post("/{leave_id}/pd-approve")
@router.post("/{leave_id}/dc-approve")
async def dc_approve(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_DC":
        raise HTTPException(400, f"Cannot PD-approve: status is {leave.status}.")

    leave.status = "APPROVED"
    leave.dc_approved_by = body.actor_code
    leave.dc_approved_at = _now()
    leave.reviewed_by = body.actor_code
    leave.reviewed_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_dc_approved_email(leave, stats=stats, actors=await _actors_for(db, leave))
    recipients = await _hr_and_boss_emails(db)
    stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
    await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


@router.post("/{leave_id}/pd-reject")
@router.post("/{leave_id}/dc-reject")
async def dc_reject(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_actor(payload, body.actor_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_DC":
        raise HTTPException(400, f"Cannot PD-reject: status is {leave.status}.")
    if not body.reject_reason:
        raise HTTPException(400, "Reject reason is required.")

    leave.status = "REJECTED"
    leave.dc_approved_by = body.actor_code
    leave.dc_approved_at = _now()
    leave.reject_at_step = "PD"
    leave.reject_reason = body.reject_reason
    leave.reviewed_by = body.actor_code
    leave.reviewed_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_rejected_email(leave, stats=stats, actors=await _actors_for(db, leave))
    recipients = await _hr_emails(db)
    stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
    await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


# ── HR Step ───────────────────────────────────────────────────────────────────

@router.post("/{leave_id}/hr-acknowledge")
async def hr_acknowledge(
    leave_id: int,
    body: StepActionRequest,
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status != "PENDING_HR":
        raise HTTPException(400, f"Cannot HR-acknowledge: status is {leave.status}.")

    leave.status = "APPROVED"
    leave.hr_acknowledged_by = body.actor_code
    leave.hr_acknowledged_at = _now()
    leave.reviewed_by = body.actor_code
    leave.reviewed_at = _now()

    stats = await _leave_stats(db, leave)
    subject, body_text, body_html = leave_hr_acknowledged_email(leave, stats=stats, actors=await _actors_for(db, leave))
    if _is_sick_leave(leave.leave_type):
        recipients = await _hr_emails(db)
    else:
        recipients = await _hr_and_boss_emails(db)
    stakeholders = await _leave_stakeholder_emails(db, leave, body.actor_code)
    await _notify(db, recipients, subject, body_text, body_html, cc=_cc_for(recipients, stakeholders))
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


# ── Cancel ────────────────────────────────────────────────────────────────────

@router.post("/{leave_id}/cancel")
async def cancel_leave(
    leave_id: int,
    employee_code: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_self_or_admin(payload, employee_code)
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.employee_code != employee_code:
        raise HTTPException(403, "You can only cancel your own requests.")
    if leave.status not in ("PENDING_PM", "PENDING_DC", "PENDING_HR"):
        raise HTTPException(400, f"Cannot cancel: status is {leave.status}.")
    leave.status = "CANCELLED"
    await db.commit()
    return {"success": True}


# ── Pending-for-me (in-app approval inbox) ───────────────────────────────────

async def _direct_reports(db: AsyncSession, manager_code: str) -> list[str]:
    """Return employee_codes that report directly to manager_code."""
    rows = (await db.execute(
        select(Employee.employee_code).where(Employee.manager_code == manager_code)
    )).scalars().all()
    return list(rows)


@router.get("/pending-for-me")
async def pending_for_me(
    employee_code: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return leave requests that this approver should act on.

    Determination of "should act":
    - PM step (PENDING_PM): leave.employee.manager_code == approver
      OR fallback: approver role in PROJECT_ROLES if no manager_code is set
    - PD step (PENDING_DC): approver role is DIRECTOR/DC/PROJECT_DIRECTOR (or superuser)
    - HR step (PENDING_HR): approver role is HR_ADMIN (or superuser)

    Also returns recent decisions made by this approver.
    """
    require_self_or_admin(payload, employee_code)
    me = (await db.execute(
        select(AuthUser).where(AuthUser.employee_code == employee_code, AuthUser.is_active == True)
    )).scalar_one_or_none()
    if not me:
        return {"pending": [], "recent": []}

    role = me.role
    direct = await _direct_reports(db, employee_code)

    pending: list[LeaveRequest] = []
    if direct:
        pm_rows = (await db.execute(
            select(LeaveRequest).where(
                LeaveRequest.status == "PENDING_PM",
                LeaveRequest.employee_code.in_(direct),
            ).order_by(LeaveRequest.created_at.desc())
        )).scalars().all()
        pending.extend(pm_rows)

    if role in {"DIRECTOR", "DC", "PROJECT_DIRECTOR", "SUPER_ADMIN", "SYSTEM_ADMIN"}:
        pd_rows = (await db.execute(
            select(LeaveRequest).where(LeaveRequest.status == "PENDING_DC")
            .order_by(LeaveRequest.created_at.desc())
        )).scalars().all()
        pending.extend(pd_rows)

    if role in {"HR_ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"}:
        hr_rows = (await db.execute(
            select(LeaveRequest).where(LeaveRequest.status == "PENDING_HR")
            .order_by(LeaveRequest.created_at.desc())
        )).scalars().all()
        pending.extend(hr_rows)

    # Dedup by id while preserving order
    seen = set()
    unique_pending = []
    for lv in pending:
        if lv.id not in seen:
            seen.add(lv.id)
            unique_pending.append(lv)

    recent = (await db.execute(
        select(LeaveRequest).where(
            LeaveRequest.reviewed_by == employee_code,
            LeaveRequest.status.in_(["APPROVED", "REJECTED"]),
        ).order_by(LeaveRequest.reviewed_at.desc()).limit(10)
    )).scalars().all()

    return {
        "pending": [_leave_dict(r) for r in unique_pending],
        "recent": [_leave_dict(r) for r in recent],
        "approver": {
            "code": employee_code,
            "role": role,
            "direct_reports_count": len(direct),
        },
    }


# ── By-token (in-email approval link) ────────────────────────────────────────

def _decode_or_400(token: str) -> dict:
    try:
        return decode_leave_token(token)
    except JWTError as e:
        raise HTTPException(400, f"Invalid or expired link: {e}")


@router.get("/by-token/{token}")
async def get_leave_by_token(token: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — fetch the leave + token info for the approval page."""
    payload = _decode_or_400(token)
    leave = (await db.execute(
        select(LeaveRequest).where(LeaveRequest.id == payload["leave_id"])
    )).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")

    step = payload["step"]
    expected_status = {"pm": "PENDING_PM", "pd": "PENDING_DC", "hr": "PENDING_HR"}[step]
    can_act = leave.status == expected_status

    stats = await _leave_stats(db, leave)
    return {
        "leave": _leave_dict(leave),
        "token": {
            "step": step,
            "approver_code": payload["approver_code"],
            "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat(),
        },
        "can_act": can_act,
        "current_status": leave.status,
        "expected_status": expected_status,
        "stats": stats,
    }


class TokenActionRequest(BaseModel):
    action: str  # "approve" | "reject"
    reject_reason: str | None = None


@router.post("/by-token/{token}/action")
async def act_leave_by_token(
    token: str,
    body: TokenActionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — approve or reject via signed link."""
    payload = _decode_or_400(token)
    leave = (await db.execute(
        select(LeaveRequest).where(LeaveRequest.id == payload["leave_id"])
    )).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")

    step = payload["step"]
    approver_code = payload["approver_code"]
    action = body.action

    if action not in ("approve", "reject"):
        raise HTTPException(400, "action must be 'approve' or 'reject'.")
    if action == "reject" and not (body.reject_reason or "").strip():
        raise HTTPException(400, "Reject reason is required.")

    expected_status = {"pm": "PENDING_PM", "pd": "PENDING_DC", "hr": "PENDING_HR"}[step]
    if leave.status != expected_status:
        raise HTTPException(400, f"This link is no longer valid. Current status is {leave.status}.")

    if action == "reject":
        leave.status = "REJECTED"
        leave.reject_at_step = {"pm": "PM", "pd": "PD", "hr": "HR"}[step]
        leave.reject_reason = body.reject_reason.strip()
        leave.reviewed_by = approver_code
        leave.reviewed_at = _now()
        if step == "pm":
            leave.pm_approved_by = approver_code
            leave.pm_approved_at = _now()
        elif step == "pd":
            leave.dc_approved_by = approver_code
            leave.dc_approved_at = _now()
        stats = await _leave_stats(db, leave)
        subject, txt, html = leave_rejected_email(leave, stats=stats, actors=await _actors_for(db, leave))
        recipients = await _hr_emails(db)
        stakeholders = await _leave_stakeholder_emails(db, leave, approver_code)
        await _notify(db, recipients, subject, txt, html, cc=_cc_for(recipients, stakeholders))
        await db.commit()
        return {"success": True, "leave": _leave_dict(leave), "result": "rejected"}

    # action == "approve"
    if step == "pm":
        leave.pm_approved_by = approver_code
        leave.pm_approved_at = _now()
        if _is_personal_leave(leave.leave_type):
            leave.status = "APPROVED"
            leave.reviewed_by = approver_code
            leave.reviewed_at = _now()
            stats = await _leave_stats(db, leave)
            subject, txt, html = leave_hr_acknowledged_email(leave, stats=stats, actors=await _actors_for(db, leave))
            recipients = await _hr_and_boss_emails(db)
            stakeholders = await _leave_stakeholder_emails(db, leave, approver_code)
            await _notify(db, recipients, subject, txt, html, cc=_cc_for(recipients, stakeholders))
        else:
            leave.status = "PENDING_DC"
            stats = await _leave_stats(db, leave)
            subject, txt, html = leave_pm_approved_email(leave, next_step="PD", stats=stats, actors=await _actors_for(db, leave))
            pd_recipients = await _pd_emails(db, leave.employee_code, approver_code)
            stakeholders = await _leave_stakeholder_emails(db, leave, approver_code)
            await _notify_with_links(
                db, pd_recipients, leave.id, "pd", subject, txt, html,
                cc=_cc_for(pd_recipients, stakeholders),
            )
    elif step == "pd":
        leave.status = "APPROVED"
        leave.dc_approved_by = approver_code
        leave.dc_approved_at = _now()
        leave.reviewed_by = approver_code
        leave.reviewed_at = _now()
        stats = await _leave_stats(db, leave)
        subject, txt, html = leave_dc_approved_email(leave, stats=stats, actors=await _actors_for(db, leave))
        recipients = await _hr_and_boss_emails(db)
        stakeholders = await _leave_stakeholder_emails(db, leave, approver_code)
        await _notify(db, recipients, subject, txt, html, cc=_cc_for(recipients, stakeholders))
    elif step == "hr":
        leave.status = "APPROVED"
        leave.hr_acknowledged_by = approver_code
        leave.hr_acknowledged_at = _now()
        leave.reviewed_by = approver_code
        leave.reviewed_at = _now()
        stats = await _leave_stats(db, leave)
        subject, txt, html = leave_hr_acknowledged_email(leave, stats=stats, actors=await _actors_for(db, leave))
        recipients = await _hr_emails(db) if _is_sick_leave(leave.leave_type) else await _hr_and_boss_emails(db)
        stakeholders = await _leave_stakeholder_emails(db, leave, approver_code)
        await _notify(db, recipients, subject, txt, html, cc=_cc_for(recipients, stakeholders))

    await db.commit()
    return {"success": True, "leave": _leave_dict(leave), "result": "approved"}


def _approval_link_block(url_quick: str, url_app: str) -> tuple[str, str]:
    """Return (html, text) blocks for the dual-path approval links."""
    html = (
        "<div style='margin:20px 0;padding:16px;background:#eff6ff;border:1px solid #93c5fd;"
        "border-radius:10px'>"
        "<div style='font-weight:800;color:#1e3a8a;margin-bottom:10px;font-size:13px'>"
        "Choose how to take action:</div>"
        "<table style='width:100%;border-collapse:separate;border-spacing:8px 0'>"
        "<tr>"
        "<td style='width:50%;text-align:center'>"
        f"<a href='{url_quick}' style='display:inline-block;background:#2447d8;color:#fff;"
        "text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px;font-size:13px;"
        "width:100%;box-sizing:border-box'>⚡ Quick Approve / Reject</a>"
        "<div style='font-size:11px;color:#64748b;margin-top:4px'>No login required · 7d expiry</div>"
        "</td>"
        "<td style='width:50%;text-align:center'>"
        f"<a href='{url_app}' style='display:inline-block;background:#fff;color:#2447d8;"
        "text-decoration:none;font-weight:800;padding:12px 18px;border-radius:8px;font-size:13px;"
        "border:1.5px solid #2447d8;width:100%;box-sizing:border-box'>📱 Open in ClockApp</a>"
        "<div style='font-size:11px;color:#64748b;margin-top:4px'>See all pending approvals</div>"
        "</td>"
        "</tr></table>"
        "</div>"
    )
    text = (
        f"\n\nQuick approve/reject (no login):\n  {url_quick}\n"
        f"\nOr open in ClockApp:\n  {url_app}\n"
    )
    return html, text


async def _notify_with_links(
    db: AsyncSession,
    recipients: list[str],
    leave_id: int,
    step: str,
    subject: str,
    body_text: str,
    body_html: str,
    cc: list[str] | None = None,
) -> None:
    """Send personalized email to each TO recipient (with a per-recipient signed link),
    then send a no-link notify-only email to CCs.

    Splitting prevents the audit fraud where any CC could click a link issued for
    the TO recipient and have the action attributed to the TO.
    """
    from app.services.leave_tokens import create_leave_token, approval_url
    app_url = f"{APP_BASE_URL_FOR_EMAIL}/ClockApp?tab=approvals&id={leave_id}"

    for email in recipients:
        approver_code = await _approver_code_for_email(db, email) or email
        token = create_leave_token(leave_id, approver_code, step)
        quick_url = approval_url(token)
        link_html, link_text = _approval_link_block(quick_url, app_url)
        html_with_link = body_html.replace("</p>", "</p>" + link_html, 1) if "</p>" in body_html else body_html + link_html
        text_with_link = body_text + link_text
        await queue_and_send_email(db, email, subject, text_with_link, html_with_link, cc=None)

    # CC list — notify-only, no link
    if cc:
        notify_html = body_html + (
            "<p style='margin-top:18px;font-size:12px;color:#64748b;font-style:italic'>"
            "You are on CC for visibility. To take action, log in to ClockApp → Approvals.</p>"
        )
        notify_text = body_text + "\n\n(CC — for visibility only. Log in to ClockApp to act.)\n"
        for cc_email in cc:
            await queue_and_send_email(db, cc_email, f"[CC] {subject}", notify_text, notify_html, cc=None)


async def _approver_code_for_email(db: AsyncSession, email: str) -> str | None:
    user = (await db.execute(
        select(AuthUser.employee_code).where(AuthUser.email.ilike(email), AuthUser.is_active == True)
    )).scalar_one_or_none()
    if user:
        return user
    emp = (await db.execute(
        select(Employee.employee_code).where(Employee.email.ilike(email))
    )).scalar_one_or_none()
    return emp


# ── Legacy endpoints ──────────────────────────────────────────────────────────

@router.post("/{leave_id}/approve")
async def approve_leave(
    leave_id: int,
    body: dict,
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status in ("APPROVED", "REJECTED", "CANCELLED"):
        raise HTTPException(400, f"Already {leave.status}.")
    leave.status = "APPROVED"
    leave.reviewed_by = body.get("reviewed_by", "Admin")
    leave.reviewed_at = _now()
    leave.hr_acknowledged_by = leave.reviewed_by
    leave.hr_acknowledged_at = leave.reviewed_at
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}


@router.post("/{leave_id}/reject")
async def reject_leave(
    leave_id: int,
    body: dict,
    payload: dict = Depends(require_hr_user),
    db: AsyncSession = Depends(get_db),
):
    leave = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(404, "Leave request not found.")
    if leave.status in ("APPROVED", "REJECTED", "CANCELLED"):
        raise HTTPException(400, f"Already {leave.status}.")
    if not body.get("reject_reason"):
        raise HTTPException(400, "Reject reason is required.")
    leave.status = "REJECTED"
    leave.reviewed_by = body.get("reviewed_by", "Admin")
    leave.reviewed_at = _now()
    leave.reject_reason = body.get("reject_reason")
    await db.commit()
    return {"success": True, "leave": _leave_dict(leave)}
