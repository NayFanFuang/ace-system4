import json
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import ROLE_LABELS, ROLE_SCOPES, get_current_user
from app.models.audit_log import AuditLog
from app.models.auth_user import AuthUser
from app.models.settings import SystemSetting
from app.services.audit_service import write_audit_log


router = APIRouter(prefix="/api/admin", tags=["Admin"])

AUDIT_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "DIRECTOR"}
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


class UserRolePatch(BaseModel):
    role: str


def _serialize_auth_user(row: AuthUser) -> dict:
    name = f"{row.first_name or ''} {row.last_name or ''}".strip()
    return {
        "id": row.id,
        "employee_code": row.employee_code,
        "email": row.email,
        "name": name,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "position_code": row.position_code,
        "position_name": row.position_name,
        "role": row.role,
        "role_name": ROLE_LABELS.get(row.role, row.role.replace("_", " ").title()),
        "scopes": sorted(ROLE_SCOPES.get(row.role, set())),
        "is_active": row.is_active,
        "must_change_password": row.must_change_password,
        "token_version": row.token_version,
        "last_login_at": row.last_login_at.isoformat() if row.last_login_at else None,
        "locked_until": row.locked_until.isoformat() if row.locked_until else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _require_role_admin(payload: dict) -> None:
    if payload.get("role") not in {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")


def _require_audit_read(payload: dict) -> None:
    if payload.get("role") not in AUDIT_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")


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


def _serialize_audit_log(row: AuditLog, include_diff: bool = False) -> dict:
    payload = {
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
    if include_diff:
        payload.update({
            "target_id": row.entity_id,
            "employee_id": row.employee_id,
            "changed_fields": row.changed_fields or [],
            "before": row.old_value,
            "after": row.new_value,
            "user_agent": row.user_agent,
        })
    return payload


def _parse_date_start(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo:
        return parsed
    return datetime.combine(parsed.date(), time.min, tzinfo=timezone.utc)


def _parse_date_end(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo:
        return parsed
    return datetime.combine(parsed.date(), time.max, tzinfo=timezone.utc)


@router.get("/roles")
async def roles(payload: dict = Depends(get_current_user)):
    _require_role_admin(payload)
    return {
        "data": [
            {
                "role": role,
                "label": ROLE_LABELS.get(role, role.replace("_", " ").title()),
                "scopes": sorted(scopes),
            }
            for role, scopes in ROLE_SCOPES.items()
        ],
        "permission_matrix": ROLE_SCOPES,
    }


@router.get("/users")
async def users(
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role_admin(payload)
    filters = []
    if q:
        query_value = f"%{q.strip()}%"
        filters.append(or_(
            AuthUser.employee_code.ilike(query_value),
            AuthUser.email.ilike(query_value),
            AuthUser.first_name.ilike(query_value),
            AuthUser.last_name.ilike(query_value),
        ))
    if role:
        filters.append(AuthUser.role == role.upper())
    if status:
        status_value = status.upper()
        if status_value == "ACTIVE":
            filters.append(AuthUser.is_active == True)
        elif status_value == "INACTIVE":
            filters.append(AuthUser.is_active == False)

    total = int((await db.execute(select(func.count()).select_from(AuthUser).where(*filters))).scalar_one() or 0)
    rows = (
        await db.execute(
            select(AuthUser)
            .where(*filters)
            .order_by(AuthUser.employee_code.asc())
            .offset(offset)
            .limit(limit)
        )
    ).scalars().all()
    return {
        "data": [_serialize_auth_user(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/audit-logs")
async def audit_logs(
    q: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    severity: str | None = None,
    action: str | None = None,
    actor: str | None = None,
    target: str | None = None,
    source: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_audit_read(payload)
    filters = []
    start = _parse_date_start(date_from)
    end = _parse_date_end(date_to)
    if start:
        filters.append(AuditLog.created_at >= start)
    if end:
        filters.append(AuditLog.created_at <= end)
    if action:
        filters.append(AuditLog.action.ilike(f"%{action.strip()}%"))
    if actor:
        actor_value = f"%{actor.strip()}%"
        filters.append(or_(AuditLog.changed_by_name.ilike(actor_value), AuditLog.changed_by_email.ilike(actor_value)))
    if target:
        target_value = f"%{target.strip()}%"
        filters.append(or_(AuditLog.entity_type.ilike(target_value), AuditLog.entity_id.ilike(target_value)))
    if source:
        filters.append(AuditLog.source.ilike(f"%{source.strip()}%"))
    if q:
        query_value = f"%{q.strip()}%"
        filters.append(or_(
            AuditLog.action.ilike(query_value),
            AuditLog.action_label.ilike(query_value),
            AuditLog.changed_by_name.ilike(query_value),
            AuditLog.changed_by_email.ilike(query_value),
            AuditLog.entity_type.ilike(query_value),
            AuditLog.entity_id.ilike(query_value),
            AuditLog.source.ilike(query_value),
            AuditLog.ip_address.ilike(query_value),
        ))
    if severity:
        severity_value = severity.lower()
        if severity_value == "critical":
            filters.append(AuditLog.action.in_(CRITICAL_AUDIT_ACTIONS))
        elif severity_value == "warning":
            filters.append(AuditLog.action.in_(WARNING_AUDIT_ACTIONS))
        elif severity_value == "info":
            filters.append(AuditLog.action.not_in(CRITICAL_AUDIT_ACTIONS | WARNING_AUDIT_ACTIONS))

    total = int((await db.execute(select(func.count()).select_from(AuditLog).where(*filters))).scalar_one() or 0)
    rows = (
        await db.execute(
            select(AuditLog)
            .where(*filters)
            .order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
    ).scalars().all()
    return {
        "data": [_serialize_audit_log(row, include_diff=True) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/audit-logs/{log_id}")
async def audit_log_detail(
    log_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_audit_read(payload)
    row = (await db.execute(select(AuditLog).where(AuditLog.id == log_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Audit log not found")
    return _serialize_audit_log(row, include_diff=True)


@router.patch("/users/{user_id}/roles")
async def update_user_role(
    user_id: int,
    body: UserRolePatch,
    request: Request,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role_admin(payload)
    role = body.role.upper()
    if role not in ROLE_SCOPES:
        raise HTTPException(400, "Unknown role")
    user = (await db.execute(select(AuthUser).where(AuthUser.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    old_role = user.role
    user.role = role
    await write_audit_log(
        db,
        action="user_role_updated",
        entity_type="auth_user",
        entity_id=user.id,
        payload=payload,
        old_value={"role": old_role},
        new_value={"role": role, "employee_code": user.employee_code},
        changed_fields=["role"],
        request=request,
        source="Admin API",
    )
    await db.commit()
    return {"success": True, "user_id": user.id, "role": user.role}


# ─────────────────────────────────────────────────────────────────────────────
# Clock role settings (per-role toggles: enabled / GPS / photo / enforceRadius)
# Stored in system_settings table as a single JSON row, key='clock_role_config'
# ─────────────────────────────────────────────────────────────────────────────
import json
from app.models.settings import SystemSetting

CLOCK_SETTINGS_KEY = "clock_role_config"

DEFAULT_CLOCK_ROLE_CONFIG = {
    "DTE":       {"enabled": True, "gpsRequired": True, "photoRequired": True, "enforceRadius": True},
    "DTE_DAILY": {"enabled": True, "gpsRequired": True, "photoRequired": True, "enforceRadius": True},
    "TE":        {"enabled": True, "gpsRequired": True, "photoRequired": True, "enforceRadius": True},
    "DTA":       {"enabled": True, "gpsRequired": True, "photoRequired": True, "enforceRadius": False},
    "OTHER":     {"enabled": True, "gpsRequired": True, "photoRequired": True, "enforceRadius": False},
}


def _merge_clock_config(stored: dict) -> dict:
    out = {}
    for role, defaults in DEFAULT_CLOCK_ROLE_CONFIG.items():
        merged = dict(defaults)
        if isinstance(stored.get(role), dict):
            for k, v in stored[role].items():
                if k in merged and isinstance(v, bool):
                    merged[k] = v
        out[role] = merged
    return out


@router.get("/clock-settings", tags=["Clock Settings"])
async def get_clock_settings(db: AsyncSession = Depends(get_db)):
    """Public — anyone needs the rules in order to clock correctly."""
    row = (await db.execute(select(SystemSetting).where(SystemSetting.key == CLOCK_SETTINGS_KEY))).scalar_one_or_none()
    stored = {}
    if row and row.value:
        try:
            stored = json.loads(row.value) or {}
        except Exception:
            stored = {}
    return {"config": _merge_clock_config(stored), "updated_at": row.updated_at.isoformat() if row else None}


@router.put("/clock-settings", tags=["Clock Settings"])
async def put_clock_settings(
    body: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    if payload.get("role") not in {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    incoming = body.get("config") if isinstance(body, dict) else None
    if not isinstance(incoming, dict):
        raise HTTPException(400, "Body must be { config: { ROLE: {...} } }")
    merged = _merge_clock_config(incoming)
    row = (await db.execute(select(SystemSetting).where(SystemSetting.key == CLOCK_SETTINGS_KEY))).scalar_one_or_none()
    old_value = None
    if row:
        try:
            old_value = json.loads(row.value)
        except Exception:
            old_value = None
        row.value = json.dumps(merged)
        row.label = "Clock role config"
    else:
        db.add(SystemSetting(key=CLOCK_SETTINGS_KEY, value=json.dumps(merged), label="Clock role config"))
    await write_audit_log(
        db,
        action="clock_settings_updated",
        entity_type="system_setting",
        entity_id=0,
        payload=payload,
        old_value=old_value,
        new_value=merged,
        changed_fields=["clock_role_config"],
        request=request,
        source="Admin API",
    )
    await db.commit()
    return {"success": True, "config": merged}
