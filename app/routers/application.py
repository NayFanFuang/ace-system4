"""Job-application form — invite links + public submit + HR review.

Flow:
  HR  → POST /api/applications/invite   (issue a signed invite link per candidate)
  CAND→ GET  /api/applications/validate (open /apply?t=token, link is checked)
  CAND→ POST /api/applications/submit   (submit the filled form, token required)
  HR  → GET  /api/applications          (review submitted applications)
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from jose import JWTError
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_optional_user, require_hr_user
from app.models.auth_user import AuthUser
from app.models.job_application import JobApplication
from app.services.application_tokens import (
    APPLICATION_TOKEN_EXPIRE_DAYS,
    create_application_token,
    decode_application_token,
    application_url,
)
from app.services.email_service import queue_and_send_email

router = APIRouter(prefix="/api/applications", tags=["applications"])

HR_NOTIFY_ROLES = ("HR_ADMIN", "HR", "SUPER_ADMIN", "SYSTEM_ADMIN")

# Applicant attachments (CV/resume/transcript). NOT under /app/photos — that dir
# is served publicly by StaticFiles; these are PII and only reachable via the
# authed download endpoint below.
UPLOAD_DIR = "/app/app_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
MAX_UPLOAD_MB = 10


def _ref_no(row: JobApplication) -> str:
    year = row.created_at.year if row.created_at else datetime.now(timezone.utc).year
    return f"APP-{year}-{row.id:05d}"


# ---------------------------------------------------------------- schemas
class InviteBody(BaseModel):
    name: str = ""
    email: str = ""
    expiresDays: int = Field(default=APPLICATION_TOKEN_EXPIRE_DAYS, ge=1, le=120)
    sendEmail: bool = False
    company: str = ""


class SubmitBody(BaseModel):
    token: str
    data: dict


class StatusBody(BaseModel):
    status: str


# ---------------------------------------------------------------- helpers
async def _hr_notify_emails(db: AsyncSession) -> list[str]:
    rows = (await db.execute(
        select(AuthUser.email).where(
            AuthUser.role.in_(HR_NOTIFY_ROLES),
            AuthUser.is_active == True,  # noqa: E712
            AuthUser.email.isnot(None),
        )
    )).scalars().all()
    return sorted({e for e in rows if e})


def _data(row: JobApplication) -> dict:
    try:
        return json.loads(row.data) or {}
    except Exception:
        return {}


def _attachments(row: JobApplication) -> list:
    return _data(row).get("attachments") or []


def _summary(row: JobApplication) -> dict:
    return {
        "id": row.id,
        "refNo": _ref_no(row),
        "company": (_data(row).get("company") or ""),
        "position": row.position,
        "fullName": row.full_name,
        "email": row.email,
        "phone": row.phone,
        "expectedSalary": row.expected_salary,
        "status": row.status,
        "invitedBy": row.invited_by,
        "attachmentCount": len(_attachments(row)),
        "createdAt": row.created_at.isoformat() if row.created_at else None,
    }


# ---------------------------------------------------------------- HR: issue invite
@router.post("/invite")
async def create_invite(
    body: InviteBody,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(require_hr_user),
):
    invited_by = payload.get("employee_code") or payload.get("sub") or ""
    token = create_application_token(
        name=body.name, email=body.email, invited_by=invited_by,
        company=body.company, expires_days=body.expiresDays,
    )
    url = application_url(token)
    claims = decode_application_token(token)
    expires_at = datetime.fromtimestamp(claims["exp"], tz=timezone.utc).isoformat()

    emailed = False
    if body.sendEmail and body.email.strip():
        subject = "ACE — เชิญกรอกใบสมัครงาน / Job Application Invitation"
        greeting = f"คุณ{body.name.strip()}" if body.name.strip() else "ผู้สมัคร"
        body_text = (
            f"เรียน {greeting},\n\n"
            "บริษัทขอเชิญท่านกรอกใบสมัครงานออนไลน์ผ่านลิงก์ด้านล่าง "
            "(เปิดได้ทั้งคอมพิวเตอร์และมือถือ):\n"
            f"{url}\n\n"
            f"ลิงก์นี้จะหมดอายุใน {body.expiresDays} วัน\n\n"
            "--- \n\n"
            f"Dear {body.name.strip() or 'Applicant'},\n\n"
            "You are invited to complete our online job application form "
            "(works on desktop and mobile):\n"
            f"{url}\n\n"
            f"This link expires in {body.expiresDays} day(s).\n\n"
            "ACE Recruitment"
        )
        body_html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;line-height:1.6;color:#101828">
          <div style="background:#2447d8;padding:22px 26px;border-radius:10px 10px 0 0">
            <h2 style="margin:0;color:#fff;font-size:19px">ACE Recruitment</h2>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px">เชิญกรอกใบสมัครงาน &middot; Job Application Invitation</p>
          </div>
          <div style="background:#fff;padding:24px 26px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">
            <p style="margin:0 0 6px;font-size:14px">เรียน <b>{greeting}</b></p>
            <p style="margin:0 0 16px;font-size:13px;color:#475569">กรุณากดปุ่มด้านล่างเพื่อกรอกใบสมัครงานออนไลน์ (เปิดได้ทั้งคอมและมือถือ)</p>
            <p style="margin:18px 0;text-align:center">
              <a href="{url}" style="display:inline-block;background:#2447d8;color:#fff;padding:13px 34px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
                &#x1F4DD; กรอกใบสมัคร / Open Application Form
              </a>
            </p>
            <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;text-align:center">ลิงก์หมดอายุใน {body.expiresDays} วัน &middot; expires in {body.expiresDays} day(s)</p>
          </div>
        </div>
        """
        try:
            await queue_and_send_email(db, body.email.strip(), subject, body_text, body_html)
            await db.commit()
            emailed = True
        except Exception:  # email is best-effort, never block link creation
            await db.rollback()

    return {"url": url, "token": token, "expiresAt": expires_at, "emailed": emailed}


# ---------------------------------------------------------------- public: validate link
@router.get("/validate")
async def validate_invite(t: str = Query(default="")):
    if not t:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing invite token")
    try:
        claims = decode_application_token(t)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired link")
    return {"valid": True, "name": claims.get("name", ""), "email": claims.get("email", ""), "company": claims.get("company", "")}


# ---------------------------------------------------------------- public: ID-card OCR
@router.post("/ocr-idcard")
async def ocr_idcard(
    token: str = Form(default=""),
    file: UploadFile = File(...),
    payload: dict | None = Depends(get_optional_user),
):
    # Authorized if either: a logged-in HR user (scanning on behalf) OR a valid
    # applicant invite token.
    authorized = bool(payload and payload.get("role") in HR_NOTIFY_ROLES)
    if not authorized:
        try:
            decode_application_token(token)
            authorized = True
        except JWTError:
            authorized = False
    if not authorized:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired link")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 12MB)")
    try:
        from app.services.idcard_ocr import extract_idcard
        return extract_idcard(data)
    except Exception as exc:  # OCR failure shouldn't 500 the form
        raise HTTPException(status_code=422, detail=f"OCR failed: {exc}")


# ---------------------------------------------------------------- attachments (CV/resume)
@router.post("/upload")
async def upload_attachment(
    token: str = Form(default=""),
    file: UploadFile = File(...),
    payload: dict | None = Depends(get_optional_user),
):
    authorized = bool(payload and payload.get("role") in HR_NOTIFY_ROLES)
    if not authorized:
        try:
            decode_application_token(token)
            authorized = True
        except JWTError:
            authorized = False
    if not authorized:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired link")

    orig = (file.filename or "file").strip()
    ext = os.path.splitext(orig)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Allowed types: {', '.join(sorted(ALLOWED_EXT))}")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_MB}MB)")

    fid = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, fid), "wb") as fh:
        fh.write(data)
    return {"id": fid, "name": orig[:200], "size": len(data)}


@router.get("/file/{file_id}")
async def download_attachment(
    file_id: str,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(require_hr_user),
):
    # Strict allowlist on the id to prevent path traversal.
    if not re.fullmatch(r"[0-9a-f]{32}\.[a-z0-9]{1,5}", file_id):
        raise HTTPException(status_code=400, detail="Invalid file id")
    path = os.path.join(UPLOAD_DIR, file_id)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=file_id)


# ---------------------------------------------------------------- public: submit
@router.post("/submit")
async def submit_application(body: SubmitBody, db: AsyncSession = Depends(get_db)):
    try:
        claims = decode_application_token(body.token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired link")

    data = body.data or {}
    full_name = (data.get("fullName") or claims.get("name") or "").strip()
    position = (data.get("position") or "").strip()
    if not full_name or not position:
        raise HTTPException(status_code=400, detail="Position and Name are required")
    if not data.get("pdpaConsent"):
        raise HTTPException(status_code=400, detail="PDPA consent is required")

    row = JobApplication(
        position=position[:200],
        full_name=full_name[:200],
        email=(data.get("email") or claims.get("email") or "")[:200] or None,
        phone=(data.get("tel") or "")[:60] or None,
        expected_salary=(data.get("expectedSalary") or "")[:60] or None,
        status="NEW",
        data=json.dumps(data, ensure_ascii=False),
        invited_name=(claims.get("name") or "")[:200] or None,
        invited_email=(claims.get("email") or "")[:200] or None,
        invited_by=(claims.get("invited_by") or "")[:30] or None,
    )
    db.add(row)
    await db.flush()
    app_id = row.id

    # Notify HR — best-effort
    try:
        recipients = await _hr_notify_emails(db)
        if recipients:
            subject = f"[ACE] ใบสมัครใหม่: {full_name} — {position}"
            text = (
                f"มีใบสมัครงานใหม่เข้ามาในระบบ\n\n"
                f"ชื่อ-นามสกุล : {full_name}\n"
                f"ตำแหน่ง      : {position}\n"
                f"อีเมล        : {row.email or '-'}\n"
                f"โทร          : {row.phone or '-'}\n\n"
                f"ดูรายละเอียดได้ที่หน้า HR > ใบสมัครงาน (Application Form)\n"
            )
            html = (
                f'<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#101828">'
                f'<div style="background:#2447d8;padding:20px 24px;border-radius:10px 10px 0 0">'
                f'<h2 style="margin:0;color:#fff;font-size:18px">ใบสมัครงานใหม่ / New Application</h2></div>'
                f'<div style="background:#fff;padding:22px 24px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px;font-size:14px">'
                f'<p style="margin:0 0 4px"><b>{full_name}</b></p>'
                f'<p style="margin:0 0 4px;color:#475569">ตำแหน่ง: {position}</p>'
                f'<p style="margin:0 0 4px;color:#475569">อีเมล: {row.email or "-"} &middot; โทร: {row.phone or "-"}</p>'
                f'<p style="margin:14px 0 0;color:#94a3b8;font-size:12px">เปิดดูได้ที่ HR &gt; ใบสมัครงาน</p>'
                f'</div></div>'
            )
            for r in recipients:
                await queue_and_send_email(db, r, subject, text, html)
    except Exception:
        pass

    await db.commit()
    await db.refresh(row)
    return {"ok": True, "id": app_id, "refNo": _ref_no(row)}


# ---------------------------------------------------------------- HR: list / detail / status
@router.get("")
async def list_applications(
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(require_hr_user),
):
    rows = (await db.execute(
        select(JobApplication).order_by(JobApplication.created_at.desc())
    )).scalars().all()
    return {"items": [_summary(r) for r in rows], "total": len(rows)}


@router.get("/{app_id}")
async def get_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(require_hr_user),
):
    row = (await db.execute(select(JobApplication).where(JobApplication.id == app_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    out = _summary(row)
    try:
        out["data"] = json.loads(row.data) if row.data else {}
    except Exception:
        out["data"] = {}
    return out


@router.patch("/{app_id}/status")
async def set_status(
    app_id: int,
    body: StatusBody,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(require_hr_user),
):
    allowed = {"NEW", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {sorted(allowed)}")
    row = (await db.execute(select(JobApplication).where(JobApplication.id == app_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    row.status = body.status
    await db.commit()
    return {"ok": True, "id": app_id, "status": body.status}
