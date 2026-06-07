"""Capture unhandled exceptions into system_error_logs for the System Monitor.

Logging must never break the request/response cycle — every failure here is swallowed.
"""
import traceback as _tb

from app.database import SessionLocal
from app.models.system_error import SystemErrorLog
from app.services.auth_service import decode_access_token


def _employee_from_request(request) -> str | None:
    auth = request.headers.get("authorization") or ""
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except Exception:
        return None
    return payload.get("sub") or payload.get("employee_code") or payload.get("employeeCode")


async def log_system_error(request, exc: BaseException, status_code: int = 500) -> None:
    try:
        tb_text = "".join(_tb.format_exception(type(exc), exc, exc.__traceback__))[:8000]
        async with SessionLocal() as db:
            db.add(
                SystemErrorLog(
                    method=request.method,
                    path=str(request.url.path)[:300],
                    status_code=status_code,
                    error_type=type(exc).__name__[:120],
                    error_message=str(exc)[:2000],
                    traceback=tb_text,
                    employee_code=_employee_from_request(request),
                    ip_address=(request.client.host if request.client else None),
                    user_agent=(request.headers.get("user-agent") or "")[:1000],
                )
            )
            await db.commit()
    except Exception:
        # Never let error logging itself raise.
        pass
