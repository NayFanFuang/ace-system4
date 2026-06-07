import os
import shutil
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import check_database, get_db
from app.deps import get_current_user
from app.models.audit_log import AuditLog
from app.models.auth_user import AuthAuditLog, AuthLoginLog, AuthUser
from app.models.clock import ClockSession
from app.models.email import EmailOutbox
from app.models.employee import Employee, ProjectAssignment, ProjectCatalog, ProjectPO, ProjectSite
from app.models.system_error import SystemErrorLog
from app.services.email_service import is_smtp_configured, smtp_config

router = APIRouter(prefix="/api/system", tags=["System Monitor"])

MONITOR_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "PROJECT_ADMIN", "DIRECTOR"}
AUDIT_SUMMARY_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "DIRECTOR"}
ERROR_MONITOR_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN"}
CRITICAL_AUDIT_ACTIONS = {
    "employee_archived",
    "employee_terminated",
    "login_deactivated",
    "password_reset_requested",
    "user_role_updated",
    "welcome_email_failed",
}
WARNING_AUDIT_ACTIONS = {
    "data_quality_issue_detected",
    "employee_status_changed",
    "login_created",
}
EMPLOYEE_CHANGE_ACTIONS = {
    "employee_created",
    "employee_profile_updated",
    "employee_contract_updated",
    "employee_status_changed",
    "employee_archived",
    "employee_terminated",
}
ACCESS_CHANGE_ACTIONS = {
    "login_created",
    "login_deactivated",
    "password_reset_requested",
    "welcome_email_sent",
    "welcome_email_failed",
}
ROLE_CHANGE_ACTIONS = {"user_role_updated"}


def _require_monitor_role(payload: dict) -> None:
    if payload.get("role") not in MONITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")


def _can_view_audit_summary(payload: dict) -> bool:
    return payload.get("role") in AUDIT_SUMMARY_ROLES


async def _count(db: AsyncSession, stmt) -> int:
    return int((await db.execute(stmt)).scalar_one() or 0)


def _audit_severity(action: str | None) -> str:
    action_value = (action or "").lower()
    if action_value in CRITICAL_AUDIT_ACTIONS or any(token in action_value for token in ("failed", "deleted", "terminated", "archived")):
        return "critical"
    if action_value in WARNING_AUDIT_ACTIONS or "detected" in action_value:
        return "warning"
    return "info"


def _audit_target_label(row: AuditLog) -> str:
    if row.entity_type and row.entity_id:
        return f"{row.entity_type}:{row.entity_id}"
    return row.entity_type or row.entity_id or "-"


def _serialize_recent_critical_log(row: AuditLog) -> dict:
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "severity": _audit_severity(row.action),
        "action": row.action,
        "action_label": row.action_label,
        "actor_name": row.changed_by_name,
        "actor_email": row.changed_by_email,
        "target_type": row.entity_type,
        "target_label": _audit_target_label(row),
        "source": row.source,
        "ip_address": row.ip_address,
    }


async def _audit_summary(db: AsyncSession, today_start: datetime, tomorrow_start: datetime) -> dict:
    today_filter = (AuditLog.created_at >= today_start, AuditLog.created_at < tomorrow_start)
    failed_sensitive_actions = [action for action in CRITICAL_AUDIT_ACTIONS if "failed" in action]

    today_events = await _count(db, select(func.count()).select_from(AuditLog).where(*today_filter))
    critical_events_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(CRITICAL_AUDIT_ACTIONS)),
    )
    warning_events_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(WARNING_AUDIT_ACTIONS)),
    )
    employee_changes_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(EMPLOYEE_CHANGE_ACTIONS)),
    )
    access_changes_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(ACCESS_CHANGE_ACTIONS)),
    )
    role_changes_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(ROLE_CHANGE_ACTIONS)),
    )
    failed_sensitive_actions_today = await _count(
        db,
        select(func.count())
        .select_from(AuditLog)
        .where(*today_filter, AuditLog.action.in_(failed_sensitive_actions)),
    )
    recent_critical_logs = (
        await db.execute(
            select(AuditLog)
            .where(AuditLog.action.in_(CRITICAL_AUDIT_ACTIONS))
            .order_by(AuditLog.created_at.desc())
            .limit(8)
        )
    ).scalars().all()

    risk_score = min(
        100,
        critical_events_today * 18
        + warning_events_today * 6
        + access_changes_today * 3
        + role_changes_today * 12
        + failed_sensitive_actions_today * 25,
    )
    return {
        "system_risk_score": risk_score,
        "today_events": today_events,
        "critical_events_today": critical_events_today,
        "warning_events_today": warning_events_today,
        "employee_changes_today": employee_changes_today,
        "access_changes_today": access_changes_today,
        "role_changes_today": role_changes_today,
        "failed_sensitive_actions_today": failed_sensitive_actions_today,
        "recent_critical_logs": [_serialize_recent_critical_log(row) for row in recent_critical_logs],
    }


@router.get("/monitor")
async def system_monitor(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_monitor_role(payload)
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    tomorrow_start = today_start + timedelta(days=1)

    employee_total = await _count(db, select(func.count()).select_from(Employee))
    auth_total = await _count(db, select(func.count()).select_from(AuthUser))
    active_employee_total = await _count(db, select(func.count()).select_from(Employee).where(Employee.status == "ACTIVE"))
    active_user_total = await _count(db, select(func.count()).select_from(AuthUser).where(AuthUser.is_active == True))
    employee_without_login = await _count(
        db,
        select(func.count())
        .select_from(Employee)
        .join(AuthUser, AuthUser.employee_code == Employee.employee_code, isouter=True)
        .where(Employee.status == "ACTIVE", AuthUser.id.is_(None)),
    )

    project_total = await _count(db, select(func.count()).select_from(ProjectCatalog))
    assignment_total = await _count(db, select(func.count()).select_from(ProjectAssignment).where(ProjectAssignment.is_active == True))
    site_total = await _count(db, select(func.count()).select_from(ProjectSite).where(ProjectSite.is_active == True))
    po_total = await _count(db, select(func.count()).select_from(ProjectPO))

    clock_today_total = await _count(db, select(func.count()).select_from(ClockSession).where(ClockSession.work_date == today))
    clock_active_total = await _count(db, select(func.count()).select_from(ClockSession).where(ClockSession.status == "ACTIVE"))
    clock_stuck_total = await _count(
        db,
        select(func.count()).select_from(ClockSession).where(ClockSession.status == "ACTIVE", ClockSession.work_date < today),
    )
    clock_missing_photo_total = await _count(
        db,
        select(func.count())
        .select_from(ClockSession)
        .where(
            ClockSession.work_date == today,
            (ClockSession.photo_in.is_(None)) | ((ClockSession.clock_out_at.is_not(None)) & (ClockSession.photo_out.is_(None))),
        ),
    )

    email_pending = await _count(db, select(func.count()).select_from(EmailOutbox).where(EmailOutbox.status == "PENDING"))
    email_failed = await _count(db, select(func.count()).select_from(EmailOutbox).where(EmailOutbox.status == "FAILED"))
    email_sent = await _count(db, select(func.count()).select_from(EmailOutbox).where(EmailOutbox.status == "SENT"))
    failed_login_today = await _count(
        db,
        select(func.count()).select_from(AuthLoginLog).where(AuthLoginLog.success == False, AuthLoginLog.created_at >= today_start, AuthLoginLog.created_at < tomorrow_start),
    )
    successful_login_today = await _count(
        db,
        select(func.count()).select_from(AuthLoginLog).where(AuthLoginLog.success == True, AuthLoginLog.created_at >= today_start, AuthLoginLog.created_at < tomorrow_start),
    )
    rate_limited_today = await _count(
        db,
        select(func.count()).select_from(AuthLoginLog).where(AuthLoginLog.failure_reason == "rate_limited", AuthLoginLog.created_at >= today_start, AuthLoginLog.created_at < tomorrow_start),
    )
    locked_accounts = await _count(
        db,
        select(func.count()).select_from(AuthUser).where(AuthUser.locked_until.is_not(None), AuthUser.locked_until > datetime.now(timezone.utc)),
    )

    recent_email_errors = (
        await db.execute(
            select(EmailOutbox)
            .where(EmailOutbox.status == "FAILED")
            .order_by(EmailOutbox.created_at.desc())
            .limit(5)
        )
    ).scalars().all()
    recent_auth_failures = (
        await db.execute(
            select(AuthLoginLog)
            .where(AuthLoginLog.success == False)
            .order_by(AuthLoginLog.created_at.desc())
            .limit(10)
        )
    ).scalars().all()
    recent_login_attempts = (
        await db.execute(
            select(AuthLoginLog)
            .order_by(AuthLoginLog.created_at.desc())
            .limit(12)
        )
    ).scalars().all()
    token_revoked_users = (
        await db.execute(
            select(AuthUser)
            .where(AuthUser.token_version > 1)
            .order_by(AuthUser.token_version.desc(), AuthUser.updated_at.desc())
            .limit(10)
        )
    ).scalars().all()
    stuck_sessions = (
        await db.execute(
            select(ClockSession)
            .where(ClockSession.status == "ACTIVE")
            .order_by(ClockSession.work_date, ClockSession.clock_in_at)
            .limit(10)
        )
    ).scalars().all()

    cfg = smtp_config()
    response = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "health": {
            "backend": "ok",
            "database": "ok" if await check_database() else "error",
            "email_configured": is_smtp_configured(),
            "smtp": {
                "provider": cfg["provider"],
                "host": cfg["host"] or None,
                "user": cfg["user"] or None,
                "from": cfg["from"] or None,
                "missing": [
                    name for name, value in {
                        "SMTP_HOST": cfg["host"],
                        "SMTP_USER": cfg["user"],
                        "SMTP_PASSWORD": cfg["password"],
                        "SMTP_FROM": cfg["from"],
                    }.items() if not value
                ],
            },
        },
        "metrics": {
            "employees": {"total": employee_total, "active": active_employee_total, "without_login": employee_without_login},
            "auth_users": {
                "total": auth_total,
                "active": active_user_total,
                "locked": locked_accounts,
                "failed_login_today": failed_login_today,
                "successful_login_today": successful_login_today,
                "rate_limited_today": rate_limited_today,
            },
            "projects": {"total": project_total, "assignments": assignment_total, "sites": site_total, "pos": po_total},
            "clock": {"today": clock_today_total, "active": clock_active_total, "stuck": clock_stuck_total, "missing_photo_today": clock_missing_photo_total},
            "email": {"pending": email_pending, "failed": email_failed, "sent": email_sent},
        },
        "issues": {
            "email_failed": [
                {
                    "id": row.id,
                    "recipient": row.recipient,
                    "subject": row.subject,
                    "error_code": row.error_code,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in recent_email_errors
            ],
            "auth_failures": [
                {
                    "employee_code": row.employee_code,
                    "identifier": row.identifier,
                    "ip_address": row.ip_address,
                    "user_agent": row.user_agent,
                    "detail": row.failure_reason,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in recent_auth_failures
            ],
            "login_attempts": [
                {
                    "identifier": row.identifier,
                    "employee_code": row.employee_code,
                    "ip_address": row.ip_address,
                    "user_agent": row.user_agent,
                    "success": row.success,
                    "failure_reason": row.failure_reason,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in recent_login_attempts
            ],
            "token_revoked_users": [
                {
                    "employee_code": row.employee_code,
                    "name": f"{row.first_name} {row.last_name}".strip(),
                    "role": row.role,
                    "token_version": row.token_version,
                    "is_active": row.is_active,
                    "locked_until": row.locked_until.isoformat() if row.locked_until else None,
                }
                for row in token_revoked_users
            ],
            "active_sessions": [
                {
                    "id": row.id,
                    "employee_code": row.employee_code,
                    "work_date": row.work_date.isoformat(),
                    "clock_in_at": row.clock_in_at.isoformat() if row.clock_in_at else None,
                    "site_code": row.site_code,
                }
                for row in stuck_sessions
            ],
        },
    }
    if _can_view_audit_summary(payload):
        response["audit"] = await _audit_summary(db, today_start, tomorrow_start)
    return response


WELCOME_SUBJECT_PATTERN = "%เข้าสู่ระบบ%"


def _welcome_failure_group(recipient: str | None, employee_status: str | None, employee_code: str | None) -> str:
    addr = (recipient or "").strip()
    if "@" not in addr:
        return "Invalid Recipient Data"
    if not employee_code:
        return "No Matching Employee"
    if (employee_status or "").upper() in {"TERMINATED", "ARCHIVED", "INACTIVE"}:
        return "Employee Terminated"
    return "Mailbox Not Found / SMTP Rejected"


@router.get("/monitor/welcome-emails")
async def welcome_email_monitor(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_monitor_role(payload)

    summary_rows = (
        await db.execute(
            select(EmailOutbox.status, func.count())
            .where(EmailOutbox.subject.ilike(WELCOME_SUBJECT_PATTERN))
            .group_by(EmailOutbox.status)
        )
    ).all()
    summary = {"sent": 0, "failed": 0, "pending": 0, "dry_run": 0, "total": 0}
    for status_value, count in summary_rows:
        key = (status_value or "").lower()
        if key == "sent":
            summary["sent"] = int(count)
        elif key == "failed":
            summary["failed"] = int(count)
        elif key == "pending":
            summary["pending"] = int(count)
        elif key == "dry_run":
            summary["dry_run"] = int(count)
        summary["total"] += int(count)

    failed_rows = (
        await db.execute(
            select(EmailOutbox, Employee.employee_code, Employee.full_name, Employee.status)
            .join(Employee, func.lower(Employee.email) == func.lower(EmailOutbox.recipient), isouter=True)
            .where(
                EmailOutbox.subject.ilike(WELCOME_SUBJECT_PATTERN),
                EmailOutbox.status.in_(["FAILED", "PENDING"]),
            )
            .order_by(EmailOutbox.created_at.desc())
            .limit(100)
        )
    ).all()
    failed = []
    for outbox, emp_code, emp_name, emp_status in failed_rows:
        failed.append({
            "id": outbox.id,
            "recipient": outbox.recipient,
            "status": outbox.status,
            "error_code": outbox.error_code,
            "error_message": (outbox.error_message or "")[:240],
            "attempts": outbox.attempts,
            "created_at": outbox.created_at.isoformat() if outbox.created_at else None,
            "employee_code": emp_code,
            "employee_name": emp_name,
            "employee_status": emp_status,
            "reason_group": _welcome_failure_group(outbox.recipient, emp_status, emp_code),
        })

    sent_subq = (
        select(
            func.lower(EmailOutbox.recipient).label("email_lc"),
            func.max(EmailOutbox.sent_at).label("sent_at"),
        )
        .where(EmailOutbox.subject.ilike(WELCOME_SUBJECT_PATTERN), EmailOutbox.status == "SENT")
        .group_by(func.lower(EmailOutbox.recipient))
        .subquery()
    )
    pending_rows = (
        await db.execute(
            select(AuthUser, Employee.full_name, sent_subq.c.sent_at)
            .join(Employee, Employee.employee_code == AuthUser.employee_code, isouter=True)
            .join(sent_subq, sent_subq.c.email_lc == func.lower(Employee.email))
            .where(AuthUser.last_login_at.is_(None), AuthUser.is_active == True)
            .order_by(sent_subq.c.sent_at.desc())
        )
    ).all()
    now = datetime.now(timezone.utc)
    pending_activation = []
    for user, full_name, welcome_sent_at in pending_rows:
        days = None
        if welcome_sent_at:
            days = (now - welcome_sent_at).days
        pending_activation.append({
            "employee_code": user.employee_code,
            "name": full_name or f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
            "role": user.role,
            "welcome_sent_at": welcome_sent_at.isoformat() if welcome_sent_at else None,
            "days_since_sent": days,
            "must_change_password": user.must_change_password,
        })

    no_welcome_rows = (
        await db.execute(
            select(AuthUser, Employee.full_name, Employee.email, Employee.status)
            .join(Employee, Employee.employee_code == AuthUser.employee_code, isouter=True)
            .outerjoin(sent_subq, sent_subq.c.email_lc == func.lower(Employee.email))
            .where(
                AuthUser.is_active == True,
                sent_subq.c.email_lc.is_(None),
                Employee.email.is_not(None),
            )
            .order_by(AuthUser.created_at.desc())
        )
    ).all()
    no_welcome_sent = []
    for user, full_name, emp_email, emp_status in no_welcome_rows:
        no_welcome_sent.append({
            "employee_code": user.employee_code,
            "name": full_name or f"{user.first_name} {user.last_name}".strip(),
            "email": emp_email or user.email,
            "role": user.role,
            "employee_status": emp_status,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        })

    failed_by_group: dict[str, int] = {}
    for row in failed:
        failed_by_group[row["reason_group"]] = failed_by_group.get(row["reason_group"], 0) + 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "failed_by_group": failed_by_group,
        "failed": failed,
        "pending_activation": pending_activation,
        "no_welcome_sent": no_welcome_sent,
    }


def _build_activation_timeline(emp: Employee, user: AuthUser | None, emails: list[EmailOutbox], first_login: datetime | None) -> list[dict]:
    """Ordered status-pipeline for one employee's onboarding into the system."""
    now = datetime.now(timezone.utc)
    steps: list[dict] = []

    steps.append({
        "key": "employee_created",
        "label": "Employee Record Created",
        "state": "done",
        "at": emp.created_at.isoformat() if emp.created_at else None,
        "note": emp.full_name,
    })

    if user:
        steps.append({
            "key": "login_created",
            "label": "Login Account Created",
            "state": "done",
            "at": user.created_at.isoformat() if user.created_at else None,
            "note": f"Role: {user.role}",
        })
    else:
        steps.append({
            "key": "login_created",
            "label": "Login Account Created",
            "state": "blocked",
            "at": None,
            "note": "No auth_user record — employee cannot log in",
        })

    last_sent = next((e for e in emails if e.status == "SENT"), None)
    last_failed = next((e for e in emails if e.status == "FAILED"), None)
    if last_sent:
        steps.append({
            "key": "welcome_sent",
            "label": "Welcome Email Sent",
            "state": "done",
            "at": last_sent.sent_at.isoformat() if last_sent.sent_at else (last_sent.created_at.isoformat() if last_sent.created_at else None),
            "note": f"To {last_sent.recipient}",
        })
    elif last_failed:
        steps.append({
            "key": "welcome_sent",
            "label": "Welcome Email Sent",
            "state": "failed",
            "at": last_failed.created_at.isoformat() if last_failed.created_at else None,
            "note": f"{last_failed.error_code or 'FAILED'} — {(last_failed.error_message or '')[:160]}",
        })
    elif emails:
        steps.append({
            "key": "welcome_sent",
            "label": "Welcome Email Sent",
            "state": "pending",
            "at": emails[0].created_at.isoformat() if emails[0].created_at else None,
            "note": f"Status: {emails[0].status}",
        })
    else:
        steps.append({
            "key": "welcome_sent",
            "label": "Welcome Email Sent",
            "state": "blocked" if not (emp.email or "").strip() else "pending",
            "at": None,
            "note": "No welcome email ever queued" if (emp.email or "").strip() else "Employee has no email address on record",
        })

    if first_login:
        steps.append({
            "key": "first_login",
            "label": "First Login",
            "state": "done",
            "at": first_login.isoformat(),
            "note": "User has logged in at least once",
        })
    else:
        days_waiting = None
        anchor = (last_sent.sent_at if last_sent else None) or (user.created_at if user else None)
        if anchor:
            days_waiting = (now - anchor).days
        steps.append({
            "key": "first_login",
            "label": "First Login",
            "state": "pending",
            "at": None,
            "note": f"Never logged in" + (f" — waited {days_waiting} day(s)" if days_waiting is not None else ""),
        })

    if user and user.must_change_password:
        steps.append({
            "key": "password_set",
            "label": "Password Changed from Default",
            "state": "pending",
            "at": None,
            "note": "Still on initial password",
        })
    elif user and user.password_changed_at:
        steps.append({
            "key": "password_set",
            "label": "Password Changed from Default",
            "state": "done",
            "at": user.password_changed_at.isoformat(),
            "note": "User has set a personal password",
        })

    if user and user.locked_until and user.locked_until > now:
        steps.append({
            "key": "locked",
            "label": "Account Locked",
            "state": "failed",
            "at": user.locked_until.isoformat(),
            "note": f"Locked until {user.locked_until.isoformat()} (failed_login_count={user.failed_login_count})",
        })

    return steps


@router.get("/monitor/welcome-emails/{employee_code}")
async def welcome_email_detail(employee_code: str, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_monitor_role(payload)

    emp = (await db.execute(select(Employee).where(Employee.employee_code == employee_code))).scalar_one_or_none()
    if emp is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))).scalar_one_or_none()

    email_lc = (emp.email or "").lower()
    emails: list[EmailOutbox] = []
    if email_lc:
        emails = (
            await db.execute(
                select(EmailOutbox)
                .where(EmailOutbox.subject.ilike(WELCOME_SUBJECT_PATTERN), func.lower(EmailOutbox.recipient) == email_lc)
                .order_by(EmailOutbox.created_at.desc())
            )
        ).scalars().all()

    login_clause = AuthLoginLog.employee_code == employee_code
    if email_lc:
        login_clause = login_clause | (func.lower(AuthLoginLog.identifier) == email_lc)
    login_attempts = (
        await db.execute(
            select(AuthLoginLog).where(login_clause).order_by(AuthLoginLog.created_at.desc()).limit(50)
        )
    ).scalars().all()
    first_login = (
        await db.execute(
            select(func.min(AuthLoginLog.created_at)).where(AuthLoginLog.employee_code == employee_code, AuthLoginLog.success == True)
        )
    ).scalar_one_or_none()
    if not first_login and user:
        first_login = user.last_login_at

    audit_rows: list[AuditLog] = []
    if _can_view_audit_summary(payload):
        audit_clause = (AuditLog.employee_id == emp.id) | (
            (AuditLog.entity_type == "employee") & (AuditLog.entity_id == str(emp.id))
        )
        if emails:
            audit_clause = audit_clause | (
                (AuditLog.entity_type == "email") & (AuditLog.entity_id.in_([str(e.id) for e in emails]))
            )
        audit_rows = (
            await db.execute(
                select(AuditLog).where(audit_clause).order_by(AuditLog.created_at.desc()).limit(30)
            )
        ).scalars().all()

    auth_audit = (
        await db.execute(
            select(AuthAuditLog)
            .where(AuthAuditLog.employee_code == employee_code)
            .order_by(AuthAuditLog.created_at.desc())
            .limit(30)
        )
    ).scalars().all()

    now = datetime.now(timezone.utc)
    account_state = None
    if user:
        account_state = {
            "is_active": user.is_active,
            "role": user.role,
            "must_change_password": user.must_change_password,
            "failed_login_count": user.failed_login_count,
            "locked": bool(user.locked_until and user.locked_until > now),
            "locked_until": user.locked_until.isoformat() if user.locked_until else None,
            "token_version": user.token_version,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "password_changed_at": user.password_changed_at.isoformat() if user.password_changed_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

    return {
        "generated_at": now.isoformat(),
        "employee": {
            "employee_code": emp.employee_code,
            "name": emp.full_name,
            "email": emp.email,
            "status": emp.status,
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
        },
        "account": account_state,
        "timeline": _build_activation_timeline(emp, user, emails, first_login),
        "emails": [
            {
                "id": e.id,
                "status": e.status,
                "recipient": e.recipient,
                "subject": e.subject,
                "error_code": e.error_code,
                "error_message": (e.error_message or "")[:400],
                "attempts": e.attempts,
                "provider": e.provider,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "sent_at": e.sent_at.isoformat() if e.sent_at else None,
            }
            for e in emails
        ],
        "login_attempts": [
            {
                "success": row.success,
                "identifier": row.identifier,
                "ip_address": row.ip_address,
                "user_agent": (row.user_agent or "")[:120],
                "failure_reason": row.failure_reason,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in login_attempts
        ],
        "auth_audit": [
            {
                "action": row.action,
                "success": row.success,
                "detail": row.detail,
                "actor_employee_code": row.actor_employee_code,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in auth_audit
        ],
        "audit_log": [
            {
                "action": row.action,
                "action_label": row.action_label,
                "actor_name": row.changed_by_name or row.changed_by_email,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "source": row.source,
                "ip_address": row.ip_address,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in audit_rows
        ],
    }


def _require_error_monitor_role(payload: dict) -> None:
    if payload.get("role") not in ERROR_MONITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")


@router.get("/monitor/errors")
async def error_monitor(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_error_monitor_role(payload)
    now = datetime.now(timezone.utc)
    today = now.date()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)

    total = await _count(db, select(func.count()).select_from(SystemErrorLog))
    today_count = await _count(db, select(func.count()).select_from(SystemErrorLog).where(SystemErrorLog.created_at >= today_start))
    week_count = await _count(db, select(func.count()).select_from(SystemErrorLog).where(SystemErrorLog.created_at >= week_start))
    unresolved = await _count(db, select(func.count()).select_from(SystemErrorLog).where(SystemErrorLog.resolved == False))

    by_type_rows = (
        await db.execute(
            select(SystemErrorLog.error_type, func.count())
            .where(SystemErrorLog.created_at >= week_start)
            .group_by(SystemErrorLog.error_type)
            .order_by(func.count().desc())
            .limit(10)
        )
    ).all()
    by_endpoint_rows = (
        await db.execute(
            select(SystemErrorLog.path, func.count())
            .where(SystemErrorLog.created_at >= week_start)
            .group_by(SystemErrorLog.path)
            .order_by(func.count().desc())
            .limit(10)
        )
    ).all()

    recent = (
        await db.execute(
            select(SystemErrorLog).order_by(SystemErrorLog.created_at.desc()).limit(50)
        )
    ).scalars().all()

    return {
        "generated_at": now.isoformat(),
        "summary": {
            "total": total,
            "today": today_count,
            "last_7d": week_count,
            "unresolved": unresolved,
        },
        "by_type": [{"error_type": t or "Unknown", "count": int(c)} for t, c in by_type_rows],
        "by_endpoint": [{"path": p or "-", "count": int(c)} for p, c in by_endpoint_rows],
        "recent": [
            {
                "id": row.id,
                "method": row.method,
                "path": row.path,
                "status_code": row.status_code,
                "error_type": row.error_type,
                "error_message": (row.error_message or "")[:200],
                "employee_code": row.employee_code,
                "ip_address": row.ip_address,
                "resolved": row.resolved,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in recent
        ],
    }


@router.get("/monitor/errors/{error_id}")
async def error_detail(error_id: int, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_error_monitor_role(payload)
    row = (await db.execute(select(SystemErrorLog).where(SystemErrorLog.id == error_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Error log not found")
    return {
        "id": row.id,
        "method": row.method,
        "path": row.path,
        "status_code": row.status_code,
        "error_type": row.error_type,
        "error_message": row.error_message,
        "traceback": row.traceback,
        "employee_code": row.employee_code,
        "ip_address": row.ip_address,
        "user_agent": row.user_agent,
        "resolved": row.resolved,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.post("/monitor/errors/{error_id}/resolve")
async def error_resolve(error_id: int, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_error_monitor_role(payload)
    row = (await db.execute(select(SystemErrorLog).where(SystemErrorLog.id == error_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Error log not found")
    row.resolved = not row.resolved
    await db.commit()
    return {"id": row.id, "resolved": row.resolved}


@router.post("/monitor/errors/_selftest")
async def error_selftest(payload: dict = Depends(get_current_user)):
    """Deliberately raise so SUPER_ADMIN can verify the capture pipeline end-to-end."""
    _require_error_monitor_role(payload)
    raise RuntimeError("System Monitor self-test: synthetic error to verify capture pipeline")


@router.get("/monitor/login-trend")
async def login_trend(days: int = 14, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_monitor_role(payload)
    days = max(1, min(days, 60))
    now = datetime.now(timezone.utc)
    today = now.date()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

    rows = (
        await db.execute(
            select(AuthLoginLog.employee_code, AuthLoginLog.identifier, AuthLoginLog.created_at)
            .where(AuthLoginLog.success == True, AuthLoginLog.created_at >= start_dt)
        )
    ).all()

    buckets: dict = {}
    for emp_code, identifier, created in rows:
        if created is None:
            continue
        d = created.astimezone(timezone.utc).date()
        bucket = buckets.setdefault(d, {"logins": 0, "users": set()})
        bucket["logins"] += 1
        bucket["users"].add(emp_code or identifier or "?")

    series = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        bucket = buckets.get(d)
        series.append({
            "date": d.isoformat(),
            "label": d.strftime("%m/%d"),
            "logins": bucket["logins"] if bucket else 0,
            "users": len(bucket["users"]) if bucket else 0,
        })

    user_counts = [s["users"] for s in series]
    return {
        "generated_at": now.isoformat(),
        "days": days,
        "series": series,
        "totals": {
            "users_today": series[-1]["users"] if series else 0,
            "logins_today": series[-1]["logins"] if series else 0,
            "peak_users": max(user_counts, default=0),
            "avg_users": round(sum(user_counts) / len(user_counts), 1) if user_counts else 0,
        },
    }


@router.get("/monitor/clock-trend")
async def clock_trend(days: int = 30, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _require_monitor_role(payload)
    days = max(1, min(days, 90))
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    rows = (
        await db.execute(
            select(ClockSession.employee_code, ClockSession.work_date)
            .where(ClockSession.work_date >= start_date, ClockSession.work_date <= today)
        )
    ).all()

    buckets: dict = {}
    for emp_code, work_date in rows:
        if work_date is None:
            continue
        bucket = buckets.setdefault(work_date, {"sessions": 0, "workers": set()})
        bucket["sessions"] += 1
        bucket["workers"].add(emp_code or "?")

    series = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        bucket = buckets.get(d)
        series.append({
            "date": d.isoformat(),
            "label": d.strftime("%m/%d"),
            "workers": len(bucket["workers"]) if bucket else 0,
            "sessions": bucket["sessions"] if bucket else 0,
        })

    worker_counts = [s["workers"] for s in series]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "days": days,
        "series": series,
        "totals": {
            "workers_today": series[-1]["workers"] if series else 0,
            "sessions_today": series[-1]["sessions"] if series else 0,
            "peak_workers": max(worker_counts, default=0),
            "avg_workers": round(sum(worker_counts) / len(worker_counts), 1) if worker_counts else 0,
        },
    }


@router.get("/monitor/db-health")
async def db_health(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in ERROR_MONITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")

    now = datetime.now(timezone.utc)

    max_conns = int((await db.execute(text("SELECT current_setting('max_connections')::int"))).scalar_one() or 0)
    state_rows = (
        await db.execute(
            text(
                "SELECT COALESCE(state, 'idle (pool)') AS st, count(*) "
                "FROM pg_stat_activity WHERE datname = current_database() GROUP BY st ORDER BY count(*) DESC"
            )
        )
    ).all()
    total_conns = sum(int(c) for _, c in state_rows)
    idle_in_txn = next((int(c) for st, c in state_rows if st == "idle in transaction"), 0)

    bloat_rows = (
        await db.execute(
            text(
                "SELECT relname, n_live_tup, n_dead_tup, "
                "CASE WHEN n_live_tup + n_dead_tup > 0 THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 1) ELSE 0 END AS dead_pct, "
                "pg_total_relation_size(relid) AS bytes, last_autovacuum "
                "FROM pg_stat_user_tables WHERE n_dead_tup > 0 ORDER BY dead_pct DESC, n_dead_tup DESC LIMIT 10"
            )
        )
    ).all()

    locks_total = int((await db.execute(text("SELECT count(*) FROM pg_locks"))).scalar_one() or 0)
    locks_waiting = int((await db.execute(text("SELECT count(*) FROM pg_locks WHERE NOT granted"))).scalar_one() or 0)

    slow_queries = []
    try:
        slow_rows = (
            await db.execute(
                text(
                    "SELECT calls, round(mean_exec_time::numeric, 2) AS mean_ms, "
                    "round(total_exec_time::numeric, 2) AS total_ms, query "
                    "FROM pg_stat_statements WHERE query NOT ILIKE '%pg_stat_statements%' "
                    "ORDER BY mean_exec_time DESC LIMIT 8"
                )
            )
        ).all()
        slow_queries = [
            {
                "calls": int(calls or 0),
                "mean_ms": float(mean_ms or 0),
                "total_ms": float(total_ms or 0),
                "query": " ".join((query or "").split())[:160],
            }
            for calls, mean_ms, total_ms, query in slow_rows
        ]
    except Exception:
        slow_queries = None  # extension not installed

    percent_conns = round(total_conns / max_conns * 100, 1) if max_conns else 0
    return {
        "generated_at": now.isoformat(),
        "connections": {
            "total": total_conns,
            "max": max_conns,
            "percent": percent_conns,
            "idle_in_transaction": idle_in_txn,
            "by_state": [{"state": st, "count": int(c)} for st, c in state_rows],
        },
        "locks": {"total": locks_total, "waiting": locks_waiting},
        "bloat": [
            {
                "name": name,
                "live": int(live or 0),
                "dead": int(dead or 0),
                "dead_pct": float(dead_pct or 0),
                "size_pretty": _human_bytes(size_bytes),
                "last_autovacuum": last_av.isoformat() if last_av else None,
            }
            for name, live, dead, dead_pct, size_bytes, last_av in bloat_rows
        ],
        "slow_queries": slow_queries,
        "slow_query_tracking": slow_queries is not None,
    }


def _human_bytes(num: float | int | None) -> str:
    value = float(num or 0)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024 or unit == "TB":
            return f"{int(value)} B" if unit == "B" else f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} TB"


def _dir_usage(path: str) -> tuple[int, int]:
    total = 0
    count = 0
    if not os.path.isdir(path):
        return 0, 0
    for root, _dirs, files in os.walk(path):
        for name in files:
            try:
                total += os.path.getsize(os.path.join(root, name))
                count += 1
            except OSError:
                pass
    return total, count


@router.get("/monitor/storage")
async def storage_monitor(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in ERROR_MONITOR_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")

    now = datetime.now(timezone.utc)

    # Server disk (the backend container root reflects the host volume).
    disks = []
    for label, path in (("Server Disk", "/"), ("Photos Volume", "/app/photos")):
        try:
            usage = shutil.disk_usage(path)
            percent = round(usage.used / usage.total * 100, 1) if usage.total else 0
            disks.append({
                "label": label,
                "path": path,
                "total_bytes": usage.total,
                "used_bytes": usage.used,
                "free_bytes": usage.free,
                "total_pretty": _human_bytes(usage.total),
                "used_pretty": _human_bytes(usage.used),
                "free_pretty": _human_bytes(usage.free),
                "percent_used": percent,
            })
        except OSError:
            pass

    # Photos directory (clock-in images).
    photo_bytes, photo_count = _dir_usage("/app/photos")

    # Postgres logical sizes.
    db_size = await _count(db, select(func.pg_database_size(func.current_database())))
    table_rows = (
        await db.execute(
            text(
                "SELECT relname, pg_total_relation_size(relid) AS bytes, n_live_tup "
                "FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 12"
            )
        )
    ).all()

    app_total = int(db_size or 0) + int(photo_bytes or 0)
    return {
        "generated_at": now.isoformat(),
        "disks": disks,
        "app_footprint": {
            "size_bytes": app_total,
            "size_pretty": _human_bytes(app_total),
        },
        "photos": {
            "count": photo_count,
            "size_bytes": photo_bytes,
            "size_pretty": _human_bytes(photo_bytes),
        },
        "database": {
            "size_bytes": int(db_size or 0),
            "size_pretty": _human_bytes(db_size),
        },
        "tables": [
            {
                "name": name,
                "size_bytes": int(size_bytes or 0),
                "size_pretty": _human_bytes(size_bytes),
                "rows": int(rows or 0),
            }
            for name, size_bytes, rows in table_rows
        ],
    }
