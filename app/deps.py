from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.auth_user import AuthUser
from app.services.auth_service import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

SUPER_ADMIN_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN"}
HR_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}
HR_READ_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "HR_VIEWER", "DIRECTOR"}
PROJECT_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "PROJECT_ADMIN", "HR_ADMIN", "DIRECTOR", "PM"}
MONITOR_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "HR_VIEWER", "PROJECT_ADMIN", "DIRECTOR", "PM"}
# Per-user allowlist for Clock Monitor endpoints (in addition to MONITOR_ROLES).
# Use when one EMPLOYEE-role person needs targeted Clock Monitor access
# without promoting them to a broader role.
# AE106 — Tipparat Buntaweelert (RF Project Admin position)
MONITOR_EXTRA_USERS = {"AE106"}
EMPLOYEE_OR_ADMIN_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "HR_VIEWER", "PROJECT_ADMIN", "DIRECTOR", "PM"}
# PO Collection Tracking dashboard — read access for Finance/Accounting, Project, and Executives.
# Accounting needs visibility into PO billing/collection state alongside Project + Directors.
PO_TRACKING_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "ACCOUNTING", "PROJECT_ADMIN", "PM", "DIRECTOR", "HR_ADMIN"}

ROLE_SCOPES = {
    "SUPER_ADMIN": {"admin:roles", "audit:read", "auth:read", "auth:write", "clock:read", "clock:write", "employees:read", "employees:write", "project:read", "project:write", "monitor:read", "kpi:read"},
    "SYSTEM_ADMIN": {"admin:roles", "audit:read", "auth:read", "auth:write", "clock:read", "clock:write", "employees:read", "employees:write", "project:read", "project:write", "monitor:read", "kpi:read"},
    "HR_ADMIN": {"audit:read", "auth:read", "auth:write", "clock:read", "clock:write", "employees:read", "employees:write", "project:read", "monitor:read", "kpi:read"},
    "HR_VIEWER": {"audit:read", "auth:read", "clock:read", "employees:read", "project:read", "monitor:read", "kpi:read"},
    "PROJECT_ADMIN": {"clock:read", "clock:write", "employees:read", "project:read", "project:write", "monitor:read", "kpi:read"},
    "PM": {"clock:read", "clock:write", "employees:read", "project:read", "project:write", "monitor:read", "kpi:read"},
    "DIRECTOR": {"audit:read", "clock:read", "employees:read", "project:read", "monitor:read", "kpi:read"},
    "ACCOUNTING": {"employees:read", "project:read", "kpi:read"},
    "EMPLOYEE": {"clock:read", "clock:write", "leave:read", "leave:write"},
}

ROLE_LABELS = {
    "SUPER_ADMIN": "System Admin",
    "SYSTEM_ADMIN": "System Admin",
    "HR_ADMIN": "HR Admin",
    "HR_VIEWER": "HR Viewer",
    "PROJECT_ADMIN": "Project Admin",
    "PM": "PM",
    "DIRECTOR": "Director",
    "ACCOUNTING": "Accounting",
    "EMPLOYEE": "Employee",
}


def _payload_with_user(payload: dict, user: AuthUser) -> dict:
    next_payload = dict(payload)
    next_payload["id"] = user.id
    next_payload["sub"] = user.employee_code
    next_payload["employeeCode"] = user.employee_code
    next_payload["employee_code"] = user.employee_code
    next_payload["role"] = user.role
    next_payload["token_version"] = user.token_version
    next_payload["scopes"] = sorted(ROLE_SCOPES.get(user.role, set()))
    return next_payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    employee_code = payload.get("sub") or payload.get("employeeCode") or payload.get("employee_code")
    if not employee_code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
    if int(payload.get("token_version") or 0) != int(user.token_version or 1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")
    return _payload_with_user(payload, user)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict | None:
    """Returns payload if token is valid, None if no token (does not raise)."""
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        return None
    employee_code = payload.get("sub") or payload.get("employeeCode") or payload.get("employee_code")
    if not employee_code:
        return None
    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))).scalar_one_or_none()
    if not user or not user.is_active or int(payload.get("token_version") or 0) != int(user.token_version or 1):
        return None
    return _payload_with_user(payload, user)


def require_role(payload: dict, allowed_roles: set[str]) -> dict:
    if payload.get("role") not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return payload


def require_scope(payload: dict, required_scope: str) -> dict:
    scopes = set(payload.get("scopes") or ROLE_SCOPES.get(payload.get("role"), set()))
    if required_scope not in scopes:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing required scope")
    return payload


requireAuth = get_current_user


def requireRole(allowed_roles: set[str]):
    async def dependency(payload: dict = Depends(get_current_user)) -> dict:
        return require_role(payload, allowed_roles)
    return dependency


def requireScope(required_scope: str):
    async def dependency(payload: dict = Depends(get_current_user)) -> dict:
        return require_scope(payload, required_scope)
    return dependency


async def require_super_admin(payload: dict = Depends(get_current_user)) -> dict:
    return require_role(payload, SUPER_ADMIN_ROLES)


async def require_hr_user(payload: dict = Depends(get_current_user)) -> dict:
    return require_role(payload, HR_ROLES)


async def require_hr_read_user(payload: dict = Depends(get_current_user)) -> dict:
    return require_role(payload, HR_READ_ROLES)


async def require_project_user(payload: dict = Depends(get_current_user)) -> dict:
    return require_role(payload, PROJECT_ROLES)


async def require_po_tracking_user(payload: dict = Depends(get_current_user)) -> dict:
    return require_role(payload, PO_TRACKING_ROLES)


async def require_monitor_user(payload: dict = Depends(get_current_user)) -> dict:
    if payload.get("role") in MONITOR_ROLES:
        return payload
    # Per-user allowlist (sub == employee_code in JWT)
    code = payload.get("employee_code") or payload.get("sub")
    if code in MONITOR_EXTRA_USERS:
        return payload
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")


def require_self_or_admin(payload: dict, employee_code: str) -> dict:
    if payload.get("employee_code") == employee_code or payload.get("sub") == employee_code:
        return payload
    return require_role(payload, EMPLOYEE_OR_ADMIN_ROLES)
