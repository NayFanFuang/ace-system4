"""Signed one-shot tokens for in-email leave approval links.

State-based replay protection: each token names a single leave_id + step.
After the step executes the leave's status moves on, so a re-clicked link
naturally fails at the status-guard check in the action endpoint — no
separate consumed-token table needed.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.services.auth_service import SECRET_KEY, ALGORITHM

LEAVE_TOKEN_EXPIRE_DAYS = int(os.getenv("LEAVE_TOKEN_EXPIRE_DAYS", "7"))
LEAVE_TOKEN_AUD = "leave-approval"
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")


def create_leave_token(
    leave_id: int,
    approver_code: str,
    step: str,
    *,
    expires_days: int | None = None,
) -> str:
    """Sign a JWT for one approver to act on one leave at one step.

    step is one of: "pm", "pd", "hr".
    """
    if step not in ("pm", "pd", "hr"):
        raise ValueError(f"Invalid step: {step!r}")
    now = datetime.now(timezone.utc)
    payload = {
        "leave_id": leave_id,
        "approver_code": approver_code,
        "step": step,
        "iat": now,
        "exp": now + timedelta(days=expires_days or LEAVE_TOKEN_EXPIRE_DAYS),
        "aud": LEAVE_TOKEN_AUD,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_leave_token(token: str) -> dict:
    """Return payload. Raises JWTError if invalid, expired, wrong audience, or
    missing required claims for a leave-approval token."""
    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        audience=LEAVE_TOKEN_AUD,
        options={"require_aud": True},
    )
    if payload.get("aud") != LEAVE_TOKEN_AUD:
        raise JWTError("Token audience does not match")
    for key in ("leave_id", "approver_code", "step"):
        if key not in payload:
            raise JWTError(f"Token missing required claim: {key}")
    return payload


def approval_url(token: str) -> str:
    return f"{APP_BASE_URL}/leave-approval/{token}"
