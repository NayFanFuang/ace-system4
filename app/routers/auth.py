import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

# Strip Unicode invisible / formatting characters that creep in when users
# copy-paste email from LINE / Outlook / PDF / Word.  Without this, an
# innocent-looking "thachatham@airconnect-e.com" containing a U+200B
# (zero-width space) silently fails the lookup with user_not_found.
# Covers: zero-width spaces, ZWNJ/ZWJ, LTR/RTL marks, BIDI overrides,
# word joiner, BOM/ZWNBSP.
_INVISIBLE_CODEPOINTS = "".join(
    chr(c) for c in (
        0x200B, 0x200C, 0x200D, 0x200E, 0x200F,
        0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
        0x2060,
        0xFEFF,
    )
)
_INVISIBLE_CHARS_RE = re.compile(f"[{re.escape(_INVISIBLE_CODEPOINTS)}]")


def _sanitize_identifier(value: str | None) -> str:
    """Normalize a login identifier: strip invisible chars + whitespace, lowercase."""
    if not value:
        return ""
    return _INVISIBLE_CHARS_RE.sub("", value).strip().lower()

from app.database import get_db
from app.deps import ROLE_LABELS, ROLE_SCOPES
from app.deps import get_current_user
from app.models.auth_user import AuthAuditLog, AuthLoginLog, AuthUser
from app.models.employee import Employee
from app.models.email import EmailOutbox
from app.services.email_service import app_base_url, is_smtp_configured, queue_and_send_email, smtp_config
from app.services.auth_service import create_access_token, hash_password, validate_password_policy, verify_password
from app.services.audit_service import write_audit_log

router = APIRouter(prefix="/api/auth", tags=["Auth"])

AUTH_COLUMNS = {
    "role": "VARCHAR(40) DEFAULT 'EMPLOYEE'",
    "must_change_password": "BOOLEAN DEFAULT false",
    "failed_login_count": "INTEGER DEFAULT 0",
    "token_version": "INTEGER DEFAULT 1",
    "locked_until": "TIMESTAMP WITH TIME ZONE",
    "last_login_at": "TIMESTAMP WITH TIME ZONE",
    "password_changed_at": "TIMESTAMP WITH TIME ZONE",
    "created_by": "INTEGER",
    "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT now()",
}

ROLE_BY_POSITION = {
    "ADMIN": "SUPER_ADMIN",
    "HR": "HR_ADMIN",
    "PROJECT_ADMIN": "PROJECT_ADMIN",
    "DTE": "EMPLOYEE",
}

# ── Seed users (matching frontend AUTH_USERS) ──────────────────────────────────

SEED_USERS = [
    {
        "employee_code": "ADMIN",
        "password": "admin1234",
        "first_name": "ACE",
        "last_name": "Admin",
        "email": "admin@airconnect-e.com",
        "department": "Management",
        "team": "System Administration",
        "position_code": "ADMIN",
        "role": "SUPER_ADMIN",
        "position_name": "System Administrator",
        "clock_type": "DAILY",
        "gps_required": False,
        "photo_required": False,
        "work_lat": None,
        "work_lng": None,
        "work_location_name": None,
        "allowed_radius_m": 0,
    },
    {
        "employee_code": "ACE056",
        "password": "ace1234",
        "first_name": "Peerapol",
        "last_name": "Piamsri",
        "email": "peerapol.p@airconnect-e.com",
        "department": "Project Management",
        "team": "Project Management",
        "position_code": "PM",
        "role": "EMPLOYEE",
        "position_name": "Project Manager",
        "clock_type": "DAILY",
        "gps_required": False,
        "photo_required": False,
        "work_lat": None,
        "work_lng": None,
        "work_location_name": None,
        "allowed_radius_m": 0,
    },
    {
        "employee_code": "HR-001",
        "password": "hr1234",
        "first_name": "HR",
        "last_name": "Admin",
        "email": "hr@airconnect-e.com",
        "department": "Human Resources",
        "team": "People Operations",
        "position_code": "HR",
        "role": "HR_ADMIN",
        "position_name": "HR Administrator",
        "clock_type": "DAILY",
        "gps_required": False,
        "photo_required": False,
        "work_lat": None,
        "work_lng": None,
        "work_location_name": None,
        "allowed_radius_m": 0,
    },
    {
        "employee_code": "PM-001",
        "password": "project1234",
        "first_name": "Project",
        "last_name": "Admin",
        "email": "project@airconnect-e.com",
        "department": "Project",
        "team": "Project Management",
        "position_code": "PROJECT_ADMIN",
        "role": "PROJECT_ADMIN",
        "position_name": "Project Administrator",
        "clock_type": "DAILY",
        "gps_required": False,
        "photo_required": False,
        "work_lat": None,
        "work_lng": None,
        "work_location_name": None,
        "allowed_radius_m": 0,
    },
]


async def seed_auth_users(db: AsyncSession) -> None:
    await ensure_auth_schema(db)
    has = (await db.execute(select(func.count()).select_from(AuthUser))).scalar_one()
    if has:
        await backfill_auth_security(db)
        return
    for u in SEED_USERS:
        fields = {k: v for k, v in u.items() if k != "password"}
        db.add(AuthUser(**fields, password_hash=hash_password(u["password"]), password_changed_at=datetime.now(timezone.utc)))
    await db.commit()


async def ensure_auth_schema(db: AsyncSession) -> None:
    existing = {
        row[0]
        for row in (
            await db.execute(text("""
                select column_name
                from information_schema.columns
                where table_name = 'auth_users'
            """))
        ).all()
    }
    for column, column_type in AUTH_COLUMNS.items():
        if column not in existing:
            await db.execute(text(f"alter table auth_users add column {column} {column_type}"))
    await db.commit()


async def backfill_auth_security(db: AsyncSession) -> None:
    users = (await db.execute(select(AuthUser))).scalars().all()
    changed = False
    for user in users:
        desired_role = ROLE_BY_POSITION.get(user.position_code, "EMPLOYEE")
        if not user.role or user.role == "EMPLOYEE" and desired_role != "EMPLOYEE":
            user.role = desired_role
            changed = True
        if user.failed_login_count is None:
            user.failed_login_count = 0
            changed = True
        if user.token_version is None:
            user.token_version = 1
            changed = True
        if user.password_changed_at is None:
            user.password_changed_at = user.created_at or datetime.now(timezone.utc)
            changed = True
        if user.must_change_password is None:
            user.must_change_password = False
            changed = True
    if changed:
        await db.commit()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_profile(u: AuthUser, emp: Employee | None = None) -> dict:
    return {
        "id": u.id,
        "employeeCode": u.employee_code,
        "firstName": u.first_name,
        "lastName": u.last_name,
        "name": f"{u.first_name} {u.last_name}",
        "email": u.email,
        "department": u.department,
        "team": u.team,
        "positionCode": u.position_code,
        "positionName": u.position_name,
        "clockType": u.clock_type,
        "gpsRequired": u.gps_required,
        "photoRequired": u.photo_required,
        "workLat": u.work_lat,
        "workLng": u.work_lng,
        "workLocationName": u.work_location_name,
        "allowedRadiusM": u.allowed_radius_m,
        "role": u.role,
        "roleName": ROLE_LABELS.get(u.role, u.role.replace("_", " ").title()),
        "permissionScope": sorted(ROLE_SCOPES.get(u.role, set())),
        "mustChangePassword": u.must_change_password,
        "lastLoginAt": u.last_login_at.isoformat() if u.last_login_at else None,
        "projectCode": emp.project_code if emp else None,
        "projectName": emp.project_name if emp else None,
    }


# ── Schemas ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str  # accepts email OR employee_code
    password: str


class UserCreateRequest(BaseModel):
    employee_code: str = Field(..., min_length=2, max_length=30)
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    email: EmailStr | None = None
    department: str = ""
    team: str | None = None
    position_code: str = "EMPLOYEE"
    position_name: str = "Employee"
    role: str = "EMPLOYEE"
    clock_type: str = "DAILY"
    gps_required: bool = False
    photo_required: bool = False
    must_change_password: bool = True


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class PasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=8)
    must_change_password: bool = True


class EmailTestRequest(BaseModel):
    recipient: EmailStr


def _require_password_policy(password: str, *, email: str | None = None, employee_code: str | None = None) -> None:
    try:
        validate_password_policy(password, email=email, employee_code=employee_code)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


async def write_audit(
    db: AsyncSession,
    action: str,
    employee_code: str | None,
    success: bool = True,
    detail: str | None = None,
    actor_employee_code: str | None = None,
) -> None:
    db.add(AuthAuditLog(
        employee_code=employee_code,
        action=action,
        success=success,
        detail=detail,
        actor_employee_code=actor_employee_code,
    ))


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else ""


async def write_login_log(
    db: AsyncSession,
    *,
    request: Request,
    identifier: str,
    user: AuthUser | None = None,
    success: bool,
    failure_reason: str | None = None,
) -> None:
    db.add(AuthLoginLog(
        identifier=identifier,
        employee_code=user.employee_code if user else None,
        ip_address=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=success,
        failure_reason=failure_reason,
    ))


async def _is_rate_limited(db: AsyncSession, *, identifier: str, ip_address: str) -> bool:
    window_start = datetime.now(timezone.utc) - timedelta(minutes=15)
    identifier_failures = (
        await db.execute(
            select(func.count())
            .select_from(AuthLoginLog)
            .where(
                AuthLoginLog.identifier == identifier,
                AuthLoginLog.success == False,
                AuthLoginLog.created_at >= window_start,
            )
        )
    ).scalar_one()
    ip_failures = (
        await db.execute(
            select(func.count())
            .select_from(AuthLoginLog)
            .where(
                AuthLoginLog.ip_address == ip_address,
                AuthLoginLog.success == False,
                AuthLoginLog.created_at >= window_start,
            )
        )
    ).scalar_one()
    # Office NAT: many employees share one external IP. Keep tight per-identifier
    # threshold (5) to block brute-force on a single user, but loosen the per-IP
    # threshold (20) so one user's mistakes don't lock out the whole office.
    return identifier_failures >= 5 or (bool(ip_address) and ip_failures >= 20)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    identifier = _sanitize_identifier(body.email)
    ip_address = _client_ip(request)
    if await _is_rate_limited(db, identifier=identifier, ip_address=ip_address):
        await write_login_log(db, request=request, identifier=identifier, success=False, failure_reason="rate_limited")
        await write_audit(db, "LOGIN", identifier, False, "Rate limited")
        await db.commit()
        raise HTTPException(status_code=429, detail="Too many failed login attempts. Please try again later.")

    all_users = (await db.execute(select(AuthUser).where(AuthUser.is_active == True))).scalars().all()
    user = (
        next((u for u in all_users if (u.email or "").lower() == identifier), None)
        or next((u for u in all_users if u.employee_code.lower() == identifier), None)
    )

    if not user:
        await write_login_log(db, request=request, identifier=identifier, success=False, failure_reason="user_not_found")
        await write_audit(db, "LOGIN", identifier, False, "User not found")
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        await write_login_log(db, request=request, identifier=identifier, user=user, success=False, failure_reason="account_locked")
        await write_audit(db, "LOGIN", identifier, False, "Account locked")
        await db.commit()
        raise HTTPException(status_code=423, detail=f"Account locked until {user.locked_until.isoformat()}")

    if not verify_password(body.password, user.password_hash):
        user.failed_login_count = (user.failed_login_count or 0) + 1
        if user.failed_login_count >= 5:
            user.locked_until = now + timedelta(minutes=15)
        await write_login_log(db, request=request, identifier=identifier, user=user, success=False, failure_reason="invalid_password")
        await write_audit(db, "LOGIN", user.employee_code, False, "Invalid password")
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = now
    await write_login_log(db, request=request, identifier=identifier, user=user, success=True)
    await write_audit(db, "LOGIN", user.employee_code, True)
    await db.commit()

    emp = (await db.execute(select(Employee).where(Employee.employee_code == user.employee_code))).scalar_one_or_none()
    profile = _user_profile(user, emp)
    token = create_access_token({"sub": user.employee_code, "token_version": user.token_version, **profile})
    return {"access_token": token, "token_type": "bearer", "user": profile}


@router.get("/me")
async def me(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    employee_code = payload.get("sub")
    user = (
        await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_profile(user)


@router.get("/permissions")
async def permissions(payload: dict = Depends(get_current_user)):
    role = payload.get("role") or "EMPLOYEE"
    return {
        "role": role,
        "role_name": ROLE_LABELS.get(role, role.replace("_", " ").title()),
        "scopes": sorted(ROLE_SCOPES.get(role, set())),
        "permission_matrix": ROLE_SCOPES,
    }


@router.get("/users")
async def list_users(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    rows = (await db.execute(select(AuthUser).order_by(AuthUser.employee_code))).scalars().all()
    return {"data": [_user_profile(user) | {"isActive": user.is_active, "failedLoginCount": user.failed_login_count} for user in rows], "total": len(rows)}


@router.get("/email/config")
async def email_config_status(payload: dict = Depends(get_current_user)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    cfg = smtp_config()
    return {
        "configured": is_smtp_configured(),
        "provider": cfg["provider"],
        "host": cfg["host"] or None,
        "port": cfg["port"],
        "user": cfg["user"] or None,
        "from": cfg["from"] or None,
        "tls": cfg["tls"],
        "missing": [
            name for name, value in {
                "SMTP_HOST": cfg["host"],
                "SMTP_USER": cfg["user"],
                "SMTP_PASSWORD": cfg["password"],
                "SMTP_FROM": cfg["from"],
            }.items() if not value
        ],
    }


@router.get("/email/outbox")
async def email_outbox(payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    rows = (await db.execute(select(EmailOutbox).order_by(EmailOutbox.created_at.desc()).limit(50))).scalars().all()
    return {
        "data": [
            {
                "id": row.id,
                "recipient": row.recipient,
                "subject": row.subject,
                "status": row.status,
                "provider": row.provider,
                "error_code": row.error_code,
                "error_message": row.error_message,
                "attempts": row.attempts,
                "sent_at": row.sent_at.isoformat() if row.sent_at else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ],
        "total": len(rows),
    }


@router.post("/email/test")
async def test_email(body: EmailTestRequest, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    result = await queue_and_send_email(
        db,
        str(body.recipient),
        "ACE System SMTP Test",
        f"SMTP test from ACE System.\n\nApp URL: {app_base_url()}",
        f"<p>SMTP test from <b>ACE System</b>.</p><p>App URL: {app_base_url()}</p>",
    )
    await db.commit()
    return {
        "success": result.ok,
        "status": result.status,
        "outbox_id": result.outbox_id,
        "error_code": result.error_code,
        "error_message": result.error_message,
    }


class SendWelcomeRequest(BaseModel):
    employee_codes: list[str] | None = None  # None = send to all eligible
    initial_password: str = "ACE1234"


@router.post("/send-welcome")
async def send_welcome_emails(body: SendWelcomeRequest, request: Request, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Safety guard: this endpoint resets each recipient's password. Refuse a blanket
    # call with no employee_codes so an empty/accidental request can't reset everyone.
    if not body.employee_codes:
        raise HTTPException(status_code=400, detail="employee_codes is required — refusing to reset all users at once.")

    from app.services.email_service import welcome_email

    query = select(AuthUser).where(AuthUser.is_active == True, AuthUser.email.isnot(None), AuthUser.email != "")
    if body.employee_codes:
        query = query.where(AuthUser.employee_code.in_(body.employee_codes))

    users = (await db.execute(query)).scalars().all()

    results = []
    for user in users:
        # Make the emailed credentials actually valid: reset the account to the
        # initial password, force a change on first login, clear any lockout, and
        # bump token_version so any old sessions are revoked.
        user.password_hash = hash_password(body.initial_password)
        user.must_change_password = True
        user.password_changed_at = datetime.now(timezone.utc)
        user.token_version = (user.token_version or 1) + 1
        user.failed_login_count = 0
        user.locked_until = None

        full_name = f"{user.first_name} {user.last_name}".strip()
        subject, body_text, body_html = welcome_email(
            employee_code=user.employee_code,
            full_name=full_name,
            password=body.initial_password,
            email=user.email or "",
        )
        result = await queue_and_send_email(db, user.email, subject, body_text, body_html)
        employee = (await db.execute(select(Employee).where(Employee.employee_code == user.employee_code))).scalar_one_or_none()
        await write_audit_log(
            db,
            action="welcome_email_sent" if result.status == "SENT" else "welcome_email_failed",
            entity_type="email",
            entity_id=result.outbox_id,
            employee_id=employee.id if employee else None,
            payload=payload,
            new_value={
                "employee_code": user.employee_code,
                "email": user.email,
                "status": result.status,
                "error_code": result.error_code,
                "error_message": result.error_message,
            },
            changed_fields=["status", "email"],
            request=request,
            source="Auth API",
        )
        results.append({
            "employee_code": user.employee_code,
            "name": full_name,
            "email": user.email,
            "status": result.status,
            "error_code": result.error_code,
            "error": result.error_message,
        })

    await db.commit()
    sent = sum(1 for r in results if r["status"] == "SENT")
    failed = [r for r in results if r["status"] != "SENT"]
    return {"sent": sent, "total": len(results), "failed": failed, "results": results}


@router.post("/users", status_code=201)
async def create_user(body: UserCreateRequest, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    _require_password_policy(body.password, email=str(body.email) if body.email else None, employee_code=body.employee_code)
    exists = (await db.execute(select(AuthUser).where(AuthUser.employee_code == body.employee_code))).scalar_one_or_none()
    if exists:
        raise HTTPException(400, "Employee code already has login account.")
    row = AuthUser(
        employee_code=body.employee_code,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        department=body.department,
        team=body.team,
        position_code=body.position_code,
        position_name=body.position_name,
        role=body.role,
        clock_type=body.clock_type,
        gps_required=body.gps_required,
        photo_required=body.photo_required,
        must_change_password=body.must_change_password,
        password_changed_at=datetime.now(timezone.utc),
        created_by=payload.get("id"),
    )
    db.add(row)
    await write_audit(db, "CREATE_USER", body.employee_code, True, actor_employee_code=payload.get("sub"))
    await db.commit()
    await db.refresh(row)
    return _user_profile(row)


@router.post("/change-password")
async def change_password(body: PasswordChangeRequest, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == payload.get("sub")))).scalar_one_or_none()
    if not user or not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    _require_password_policy(body.new_password, email=user.email, employee_code=user.employee_code)
    user.password_hash = hash_password(body.new_password)
    user.must_change_password = False
    user.password_changed_at = datetime.now(timezone.utc)
    user.token_version = (user.token_version or 1) + 1
    await write_audit(db, "CHANGE_PASSWORD", user.employee_code, True, actor_employee_code=user.employee_code)
    await db.commit()
    return {"success": True}


@router.post("/users/{employee_code}/reset-password")
async def reset_password(employee_code: str, body: PasswordResetRequest, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    _require_password_policy(body.new_password, email=user.email, employee_code=user.employee_code)
    user.password_hash = hash_password(body.new_password)
    user.must_change_password = body.must_change_password
    user.failed_login_count = 0
    user.locked_until = None
    user.password_changed_at = datetime.now(timezone.utc)
    user.token_version = (user.token_version or 1) + 1
    await write_audit(db, "RESET_PASSWORD", employee_code, True, actor_employee_code=payload.get("sub"))
    await db.commit()
    return {"success": True}


@router.post("/users/{employee_code}/force-logout")
async def force_logout(employee_code: str, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    user = (await db.execute(select(AuthUser).where(AuthUser.employee_code == employee_code))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.token_version = (user.token_version or 1) + 1
    await write_audit(db, "FORCE_LOGOUT", employee_code, True, actor_employee_code=payload.get("sub"))
    await db.commit()
    return {"success": True}
