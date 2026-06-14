import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from jose import JWTError

from app.database import Base, SessionLocal, check_database, engine
from app.models.auth_user import AuthAuditLog, AuthLoginLog, AuthUser  # noqa: F401 — registers table
from app.models.audit_log import AuditLog  # noqa: F401 — registers table
from app.models.clock import ClockSession, ClockSite  # noqa: F401 — registers tables
from app.models.email import EmailOutbox  # noqa: F401 — registers table
from app.models.employee import Employee, EmployeeRelocation, ProjectAssignment, ProjectCatalog, ProjectPO, ProjectSite  # noqa: F401
from app.models.kpi import KpiEvaluation, KpiItem, KpiPeriodItem  # noqa: F401 — registers tables
from app.models.leave import LeaveRequest  # noqa: F401 — registers table
from app.models.meeting_room import MeetingRoom, RoomBooking  # noqa: F401 — registers tables
from app.models.office_store import StockItem, StockMovement, StockRequest, StockRequestLine  # noqa: F401 — registers tables
from app.models.presite_tracking import DtePresiteHistory, DtePresiteSession, DtePresiteTracking  # noqa: F401 — registers tables
from app.models.system_error import SystemErrorLog  # noqa: F401 — registers table
from app.models.worklog import DailyWorkLog  # noqa: F401 — registers table
from app.models.bill_correction import BillCorrection  # noqa: F401 — registers table
from app.models.data_import import DataImport  # noqa: F401 — registers table
from app.models.billing_plan import BillingPlan  # noqa: F401 — registers table
from app.models.payment_voucher import PaymentVoucher, PaymentVoucherLine  # noqa: F401 — registers tables
from app.routers.auth import router as auth_router, seed_auth_users
from app.routers.clock import router as clock_router, seed_clock_sites
from app.routers.employees import router as employee_router, seed_employee_database, seed_project_operations
from app.routers.system_monitor import router as system_monitor_router
from app.routers.kpi import router as kpi_router
from app.routers.kpi_self import router as kpi_self_router
from app.routers.leave import router as leave_router
from app.routers.hr_data_quality import router as hr_data_quality_router
from app.routers.admin import router as admin_router
from app.routers.raw_data import router as raw_data_router
from app.routers.presite_monitor import router as presite_monitor_router
from app.routers.worklog import router as worklog_router
from app.routers.finance import router as finance_router
from app.routers.data_imports import router as data_imports_router
from app.routers.billing_plan import router as billing_plan_router
from app.routers.meeting_room import router as meeting_room_router, seed_meeting_rooms
from app.routers.office_store import router as office_store_router, seed_stock_items
from app.routers.virtual_office import router as virtual_office_router
from app.services.auth_service import validate_jwt_secret_strength, create_access_token, decode_access_token
from app.services.error_capture import log_system_error


app = FastAPI(title="ACE System API", version="0.1.0")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Refreshed-Token"],
)


@app.middleware("http")
async def sliding_session_refresh(request: Request, call_next):
    """Sliding (idle-timeout) session. On every authenticated request whose token is
    still valid, re-issue a fresh token (exp = now + JWT_EXPIRE_HOURS) and return it in
    the X-Refreshed-Token header. The client swaps in the new token, so continued
    activity keeps the session alive indefinitely, while >JWT_EXPIRE_HOURS of inactivity
    lets the token expire and forces a re-login. token_version is preserved, so admin
    password-reset/revocation still invalidates the session immediately.
    """
    response = await call_next(request)
    if response.status_code != 401:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            try:
                payload = decode_access_token(auth.split(" ", 1)[1].strip())
                for k in ("exp", "iat", "nbf"):
                    payload.pop(k, None)
                response.headers["X-Refreshed-Token"] = create_access_token(payload)
            except JWTError:
                pass
    return response


app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(clock_router)
app.include_router(system_monitor_router)
app.include_router(kpi_router)
app.include_router(kpi_self_router)
app.include_router(leave_router)
app.include_router(hr_data_quality_router)
app.include_router(admin_router)
app.include_router(raw_data_router)
app.include_router(presite_monitor_router)
app.include_router(worklog_router)
app.include_router(finance_router)
app.include_router(data_imports_router)
app.include_router(billing_plan_router)
app.include_router(meeting_room_router)
app.include_router(office_store_router)
app.include_router(virtual_office_router)


@app.exception_handler(Exception)
async def _capture_unhandled_exception(request: Request, exc: Exception):
    """Log every unhandled exception (a real 500) to system_error_logs, then return JSON.

    HTTPException (4xx and explicit raises) keeps Starlette's default handler, so only
    genuine server bugs land here — exactly the gap the error monitor is meant to surface.
    """
    await log_system_error(request, exc, status_code=500)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


PHOTO_DIR = "/app/photos/clock"
os.makedirs(PHOTO_DIR, exist_ok=True)
app.mount("/photos", StaticFiles(directory="/app/photos"), name="photos")


@app.on_event("startup")
async def startup() -> None:
    import asyncio
    from app.services.clock_autoclose import nightly_autoclose_loop

    validate_jwt_secret_strength()
    async with engine.begin() as conn:
        # Required by the room_bookings GiST exclusion constraint (no double-booking).
        from sqlalchemy import text as _sql_text
        await conn.execute(_sql_text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        await seed_auth_users(db)
        await seed_employee_database(db)
        await seed_clock_sites(db)
        await seed_project_operations(db)
        await seed_meeting_rooms(db)
        await seed_stock_items(db)
    # Nightly job: close ACTIVE sessions whose work_date < today (BKK) at 01:00 BKK.
    # Keep a handle on the task so it isn't garbage-collected.
    app.state.nightly_autoclose_task = asyncio.create_task(nightly_autoclose_loop())


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    return {"database": "ok" if await check_database() else "error"}
