"""Signed invite tokens for the public job-application form.

Only candidates holding a valid token (issued by HR) can open and submit the
/apply form. Tokens are stateless JWTs (aud="application-form") that carry the
invited candidate's name/email and an expiry, signed with the same SECRET_KEY
as the access-token signer — mirroring app/services/leave_tokens.py.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.services.auth_service import SECRET_KEY, ALGORITHM

APPLICATION_TOKEN_EXPIRE_DAYS = int(os.getenv("APPLICATION_TOKEN_EXPIRE_DAYS", "14"))
APPLICATION_TOKEN_AUD = "application-form"
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")


def create_application_token(
    *,
    name: str = "",
    email: str = "",
    invited_by: str = "",
    company: str = "",
    expires_days: int | None = None,
) -> str:
    """Sign a JWT inviting one candidate to fill in the application form."""
    now = datetime.now(timezone.utc)
    days = expires_days if expires_days and expires_days > 0 else APPLICATION_TOKEN_EXPIRE_DAYS
    payload = {
        "name": (name or "").strip(),
        "email": (email or "").strip(),
        "invited_by": (invited_by or "").strip(),
        "company": (company or "").strip(),
        "iat": now,
        "exp": now + timedelta(days=days),
        "aud": APPLICATION_TOKEN_AUD,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_application_token(token: str) -> dict:
    """Return payload. Raises JWTError if invalid, expired, or wrong audience."""
    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        audience=APPLICATION_TOKEN_AUD,
        options={"require_aud": True},
    )
    if payload.get("aud") != APPLICATION_TOKEN_AUD:
        raise JWTError("Token audience does not match")
    return payload


def application_url(token: str) -> str:
    return f"{APP_BASE_URL}/apply?t={token}"
