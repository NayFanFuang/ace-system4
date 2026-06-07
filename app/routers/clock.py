import base64
import logging
import os
import re
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from math import asin, cos, floor, radians, sin, sqrt

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.database import get_db
from app.deps import (
    get_current_user,
    require_monitor_user,
    require_self_or_admin,
    require_role,
)

_MANUAL_CHECK_WRITE_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN", "PROJECT_ADMIN"}
# Per-user allowlist for Clock Monitor admin tools (Manual Check + Work Locations),
# in addition to _MANUAL_CHECK_WRITE_ROLES. Use when one EMPLOYEE-role person needs
# targeted admin access without promoting them to a broader role.
# AE106 — Tipparat Buntaweelert (RF Project Admin position)
_MANUAL_CHECK_EXTRA_USERS = {"AE106"}


async def require_manual_check_admin(payload: dict = Depends(get_current_user)) -> dict:
    if payload.get("role") in _MANUAL_CHECK_WRITE_ROLES:
        return payload
    code = payload.get("employee_code") or payload.get("sub")
    if code in _MANUAL_CHECK_EXTRA_USERS:
        return payload
    raise HTTPException(status_code=403, detail="Not allowed")
from app.models.auth_user import AuthUser
from app.models.clock import ClockManualCheck, ClockSession, ClockSite
from app.models.employee import Employee, ProjectAssignment, ProjectPO, ProjectSite

router = APIRouter(prefix="/api/clock", tags=["Clock"])

# Workflow statuses that should NOT be overwritten by clock activity
# (anything past WORK_DONE — leader review, approval, billing)
_FROZEN_WF = {
    "LEADER_CHECKING", "LEADER_APPROVED", "APPROVED", "CLOSED",
    "PENDING_PAYMENT", "PENDING_BILLING", "DTE_PAID", "HW_BILLED",
    "REJECTED",
}


_SITE_CODE_RE = re.compile(r'^[A-Z0-9]', re.IGNORECASE)


def _extract_site_key(site_code: str) -> str | None:
    """Extract the primary site key from a site_code string.
    Expected format: 'SITE-CARRIER-REGION-XXXX' (first segment before '_' or full code).
    Returns None if format is invalid."""
    if not site_code or not _SITE_CODE_RE.match(site_code):
        return None
    return site_code.split("_")[0].upper()


async def _sync_pos_on_clock_in(db: AsyncSession, employee_code: str, site_code: str) -> int:
    """Mark project_pos rows IN_PROGRESS when DTE clocks in at a planned site.
    Returns number of rows updated."""
    if not employee_code or not site_code:
        return 0
    site_key = _extract_site_key(site_code)
    if not site_key:
        logger.warning("_sync_pos_on_clock_in: invalid site_code format %r for %s — skipping PO sync", site_code, employee_code)
        return 0
    rows = (await db.execute(
        select(ProjectPO).where(
            ProjectPO.planned_dte_codes == employee_code,
            func.upper(func.split_part(ProjectPO.cluster_site, "_", 1)) == site_key,
        )
    )).scalars().all()
    if not rows:
        logger.debug("_sync_pos_on_clock_in: no matching POs for employee=%s site_key=%s", employee_code, site_key)
    updated = 0
    now = datetime.now(timezone.utc)
    for r in rows:
        wf = (r.workflow_status or "").upper()
        if wf in _FROZEN_WF:
            logger.debug("_sync_pos_on_clock_in: PO %s is frozen (status=%s), skipping", r.id, wf)
            continue
        if not r.work_started_at:
            r.work_started_at = now
        if wf in {"", "PLANNED", "SITE_MAPPED", "AUTO_MAPPED"}:
            r.workflow_status = "IN_PROGRESS"
            updated += 1
    if updated:
        logger.info("_sync_pos_on_clock_in: %d PO(s) set IN_PROGRESS for employee=%s site=%s", updated, employee_code, site_key)
    return updated


async def _sync_pos_on_clock_out(db: AsyncSession, employee_code: str, site_code: str, outcome: str) -> int:
    """Mark project_pos rows WORK_DONE (or keep IN_PROGRESS) when DTE clocks out at a site.
    outcome: COMPLETE | ISSUE | STOP
    Returns number of rows updated."""
    if not employee_code or not site_code:
        return 0
    site_key = _extract_site_key(site_code)
    if not site_key:
        logger.warning("_sync_pos_on_clock_out: invalid site_code format %r for %s — skipping PO sync", site_code, employee_code)
        return 0
    rows = (await db.execute(
        select(ProjectPO).where(
            ProjectPO.planned_dte_codes == employee_code,
            func.upper(func.split_part(ProjectPO.cluster_site, "_", 1)) == site_key,
        )
    )).scalars().all()
    if not rows:
        logger.debug("_sync_pos_on_clock_out: no matching POs for employee=%s site_key=%s", employee_code, site_key)
    updated = 0
    now = datetime.now(timezone.utc)
    outcome = (outcome or "COMPLETE").upper()
    for r in rows:
        wf = (r.workflow_status or "").upper()
        if wf in _FROZEN_WF:
            logger.debug("_sync_pos_on_clock_out: PO %s is frozen (status=%s), skipping", r.id, wf)
            continue
        if outcome in {"COMPLETE", "ISSUE"}:
            r.work_done_at = now
            r.workflow_status = "WORK_DONE"
            if outcome == "ISSUE":
                # Persist the issue note so leader can see; don't overwrite existing
                if not r.hold_reason:
                    r.hold_reason = f"DTE reported ISSUE at clock-out ({now.date().isoformat()})"
            updated += 1
        elif outcome == "STOP":
            # Pause: stay in IN_PROGRESS, don't set work_done_at
            if wf not in {"IN_PROGRESS"}:
                r.workflow_status = "IN_PROGRESS"
                updated += 1
    if updated:
        logger.info("_sync_pos_on_clock_out: %d PO(s) updated (outcome=%s) for employee=%s site=%s", updated, outcome, employee_code, site_key)
    return updated

PHOTO_DIR = "/app/photos/clock"


def _save_photo(photo_base64: str, employee_code: str, direction: str) -> str:
    """Decode base64 photo, save as .jpg, return relative path."""
    os.makedirs(PHOTO_DIR, exist_ok=True)
    # Strip data URL prefix if present
    if "," in photo_base64:
        photo_base64 = photo_base64.split(",", 1)[1]
    data = base64.b64decode(photo_base64)
    now = datetime.now(timezone.utc)
    filename = f"{employee_code}_{direction}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(data)
    return f"/photos/clock/{filename}"


# ── Seed data ─────────────────────────────────────────────────────────────────

SEED_SITES = [
    {"site_code": "SITE-AIS-BKK-0421", "site_name": "Sukhumvit 21",      "customer": "AIS",  "lat": 13.7433, "lng": 100.5588, "gps_radius_m": 500},
    {"site_code": "SITE-AIS-BKK-0422", "site_name": "Asok BTS Area",     "customer": "AIS",  "lat": 13.7456, "lng": 100.5602, "gps_radius_m": 300},
    {"site_code": "SITE-TRUE-NNT-0118","site_name": "Nonthaburi Tower",   "customer": "TRUE", "lat": 13.8591, "lng": 100.5134, "gps_radius_m": 500},
    {"site_code": "SITE-AIS-RYG-0055", "site_name": "Rangsit Tower",      "customer": "AIS",  "lat": 14.0233, "lng": 100.6177, "gps_radius_m": 400},
    {"site_code": "SITE-DTAC-BKK-0201","site_name": "Silom Center",       "customer": "DTAC", "lat": 13.7234, "lng": 100.5260, "gps_radius_m": 400},
    {"site_code": "SITE-NT-CNX-0031",  "site_name": "Chiangmai NT Tower", "customer": "NT",   "lat": 18.7883, "lng": 98.9853,  "gps_radius_m": 600},
]


async def seed_clock_sites(db: AsyncSession) -> None:
    await ensure_clock_schema(db)
    has = (await db.execute(select(func.count()).select_from(ClockSite))).scalar_one()
    if has:
        return
    for s in SEED_SITES:
        db.add(ClockSite(**s))
    await db.commit()


async def ensure_clock_schema(db: AsyncSession) -> None:
    await db.execute(text("alter table clock_sessions alter column photo_in type text"))
    await db.execute(text("alter table clock_sessions alter column photo_out type text"))
    await db.commit()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ClockInRequest(BaseModel):
    employee_code: str
    user_id: int | None = None
    clock_type: str = "DAILY"          # PER_SITE | DAILY
    site_id: int | None = None
    lat: float | None = None
    lng: float | None = None
    photo_base64: str | None = None


class ClockOutRequest(BaseModel):
    lat: float | None = None
    lng: float | None = None
    photo_base64: str | None = None
    outcome: str = "COMPLETE"  # COMPLETE | STOP | ISSUE


# ── Helpers ───────────────────────────────────────────────────────────────────

def _session_dict(s: ClockSession) -> dict:
    return {
        "id": s.id,
        "employee_code": s.employee_code,
        "clock_type": s.clock_type,
        "work_date": s.work_date.isoformat(),
        "site_id": s.site_id,
        "site_code": s.site_code,
        "site_name": s.site_name,
        "clock_in_at": s.clock_in_at.isoformat() if s.clock_in_at else None,
        "clock_out_at": s.clock_out_at.isoformat() if s.clock_out_at else None,
        "lat_in": s.lat_in,
        "lng_in": s.lng_in,
        "photo_in": s.photo_in,
        "lat_out": s.lat_out,
        "lng_out": s.lng_out,
        "photo_out": s.photo_out,
        "status": s.status,
        "outcome": s.outcome,
    }


def _assert_employee_clock_access(payload: dict, employee_code: str) -> None:
    require_self_or_admin(payload, employee_code)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sites")
async def list_sites(
    customer: str = "",
    project_code: str = "",
    employee_code: str = "",
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if employee_code:
        _assert_employee_clock_access(payload, employee_code)
    elif payload.get("role") not in {"SUPER_ADMIN", "HR_ADMIN", "PROJECT_ADMIN"}:
        raise HTTPException(403, "Not allowed")
    stmt = select(ClockSite).where(ClockSite.is_active == True)
    if customer:
        stmt = stmt.where(ClockSite.customer == customer)
    if project_code:
        stmt = stmt.where(ClockSite.project_code == project_code)
    if employee_code:
        assignments = (await db.execute(
            select(ProjectAssignment.project_code)
            .where(
                ProjectAssignment.employee_code == employee_code,
                ProjectAssignment.role_in_project == "DTE",
                ProjectAssignment.is_active == True,
            )
        )).scalars().all()
        if assignments:
            stmt = stmt.where(ClockSite.project_code.in_(assignments))
        else:
            emp = (await db.execute(select(Employee).where(Employee.employee_code == employee_code))).scalar_one_or_none()
            if emp and emp.project_code:
                stmt = stmt.where(ClockSite.project_code == emp.project_code)
            # else: no project filter → return all active sites for unassigned DTE
    rows = (await db.execute(stmt.order_by(ClockSite.site_code))).scalars().all()
    return {
        "data": [
            {
                "id": r.id,
                "siteCode": r.site_code,
                "siteName": r.site_name,
                "customer": r.customer,
                "projectCode": r.project_code,
                "lat": r.lat,
                "lng": r.lng,
                "gpsRadiusM": r.gps_radius_m,
            }
            for r in rows
        ]
    }


@router.get("/today")
async def today_sessions(
    employee_code: str,
    work_date: date | None = None,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_employee_clock_access(payload, employee_code)
    today = work_date or date.today()
    rows = (
        await db.execute(
            select(ClockSession)
            .where(ClockSession.employee_code == employee_code, ClockSession.work_date == today)
            .order_by(ClockSession.clock_in_at)
        )
    ).scalars().all()
    return {"sessions": [_session_dict(s) for s in rows]}


@router.post("/in", status_code=201)
async def clock_in(
    body: ClockInRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_employee_clock_access(payload, body.employee_code)
    today = date.today()
    is_day_clock_in = body.clock_type == "PER_SITE" and body.site_id is None
    active_session = (
        await db.execute(
            select(ClockSession).where(
                ClockSession.employee_code == body.employee_code,
                ClockSession.work_date == today,
                ClockSession.status == "ACTIVE",
            )
        )
    ).scalar_one_or_none()
    if active_session and body.clock_type == "DAILY":
        raise HTTPException(400, "Already has an active clock session.")

    has_session_today = (
        await db.execute(
            select(func.count())
            .select_from(ClockSession)
            .where(ClockSession.employee_code == body.employee_code, ClockSession.work_date == today)
        )
    ).scalar_one()
    if is_day_clock_in and has_session_today:
        raise HTTPException(400, "Already clocked in today.")
    # Policy: GPS is required for every clock-in (all clock_types)
    if body.lat is None or body.lng is None:
        raise HTTPException(400, "GPS location is required for every clock-in.")
    # Policy: selfie required for DAILY (in) and for DTE day-open only;
    # Start Site sub-sessions skip the selfie (identity already verified at day-open).
    requires_selfie = body.clock_type == "DAILY" or is_day_clock_in
    if requires_selfie and not body.photo_base64:
        raise HTTPException(400, "Selfie photo is required for this clock-in.")

    # Fetch site snapshot
    site_code = site_name = None
    site = None
    if body.site_id:
        site = (await db.execute(select(ClockSite).where(ClockSite.id == body.site_id))).scalar_one_or_none()
        if site:
            site_code = site.site_code
            site_name = site.site_name

    # ── Geofence SNAPSHOT (freeze the "on-site?" reference to this day's office/site) ──
    # PER_SITE → the linked ClockSite; DAILY → the employee's office (auth_users.work_*).
    # Stored on the session so moving an office/site later never rewrites history.
    geofence_source = geofence_lat = geofence_lng = geofence_radius = None
    if body.clock_type == "PER_SITE" and site and site.lat is not None and site.lng is not None:
        geofence_source = "site"
        geofence_lat, geofence_lng = site.lat, site.lng
        geofence_radius = site.gps_radius_m or 500
    elif body.clock_type != "PER_SITE":
        auth = (await db.execute(
            select(AuthUser).where(AuthUser.employee_code == body.employee_code)
        )).scalar_one_or_none()
        if auth and auth.work_lat is not None and auth.work_lng is not None:
            geofence_source = "office"
            geofence_lat, geofence_lng = auth.work_lat, auth.work_lng
            geofence_radius = auth.allowed_radius_m or 300

    distance_in = on_site_in = None
    if geofence_lat is not None and body.lat is not None and body.lng is not None:
        distance_in = _haversine_m(float(body.lat), float(body.lng), float(geofence_lat), float(geofence_lng))
        on_site_in = distance_in <= geofence_radius

    session = ClockSession(
        employee_code=body.employee_code,
        user_id=body.user_id,
        clock_type=body.clock_type,
        work_date=today,
        site_id=body.site_id,
        site_code=site_code,
        site_name=site_name,
        clock_in_at=datetime.now(timezone.utc),
        lat_in=body.lat,
        lng_in=body.lng,
        photo_in=_save_photo(body.photo_base64, body.employee_code, "in") if body.photo_base64 else None,
        status="CLOCK_IN" if is_day_clock_in else "ACTIVE",
        geofence_source=geofence_source,
        geofence_lat=geofence_lat,
        geofence_lng=geofence_lng,
        geofence_radius_m=geofence_radius,
        distance_in_m=round(distance_in, 1) if distance_in is not None else None,
        on_site_in=on_site_in,
    )
    db.add(session)

    # ── Sync project_pos: site-level PER_SITE clock-in → IN_PROGRESS ──
    pos_synced = 0
    presite_linked = 0
    if body.clock_type == "PER_SITE" and site_code and not is_day_clock_in:
        pos_synced = await _sync_pos_on_clock_in(db, body.employee_code, site_code)
        # ── Auto-link Pre-Site tracking row ──
        await db.flush()
        try:
            from app.routers.presite_monitor import auto_link_tracking_on_clockin
            presite_linked = await auto_link_tracking_on_clockin(db, session)
        except Exception as e:
            logger.warning("auto_link_tracking_on_clockin failed: %s", e)

    await db.commit()
    await db.refresh(session)
    return {"success": True, "sessionId": session.id, "timestamp": session.clock_in_at.isoformat(), "pos_synced": pos_synced, "presite_linked": presite_linked}


@router.post("/out/{session_id}")
async def clock_out(
    session_id: int,
    body: ClockOutRequest,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = (await db.execute(select(ClockSession).where(ClockSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found.")
    _assert_employee_clock_access(payload, session.employee_code)
    if session.clock_out_at:
        raise HTTPException(400, "Already clocked out.")

    # Policy: GPS is required for every clock-out
    if body.lat is None or body.lng is None:
        raise HTTPException(400, "GPS location is required for every clock-out.")
    # Policy: selfie required only for DAILY clock-out; DTE End Site skips it.
    if session.clock_type == "DAILY" and not body.photo_base64:
        raise HTTPException(400, "Selfie photo is required for clock-out.")

    outcome = (body.outcome or "COMPLETE").upper()
    if outcome == "COMPLETED":
        outcome = "COMPLETE"
    if outcome not in {"COMPLETE", "STOP", "ISSUE"}:
        raise HTTPException(400, "Outcome must be COMPLETE, STOP, or ISSUE.")

    session.clock_out_at = datetime.now(timezone.utc)
    session.lat_out = body.lat
    session.lng_out = body.lng
    session.photo_out = _save_photo(body.photo_base64, session.employee_code, "out") if body.photo_base64 else None
    session.outcome = outcome
    session.status = "CLOSED"

    # ── Sync project_pos: site-level clock-out → WORK_DONE (or IN_PROGRESS if STOP) ──
    pos_synced = 0
    presite_promoted = 0
    if session.clock_type == "PER_SITE" and session.site_code:
        pos_synced = await _sync_pos_on_clock_out(db, session.employee_code, session.site_code, outcome)
        # ── Auto-promote Pre-Site tracking + email alert on STOP/ISSUE ──
        try:
            from app.routers.presite_monitor import auto_promote_to_presite
            presite_promoted = await auto_promote_to_presite(db, session, outcome)
        except Exception as e:
            logger.warning("auto_promote_to_presite failed: %s", e)
        # Email PM on STOP/ISSUE
        if outcome in ("STOP", "ISSUE"):
            try:
                from app.services.email_service import queue_and_send_email
                pm_email = os.getenv("PRESITE_ALERT_EMAIL", "peerapol1430@gmail.com")
                subject = f"[Pre-Site Alert] {outcome} at {session.site_code} — DTE {session.employee_code}"
                body_text = (
                    f"Outcome: {outcome}\n"
                    f"Site: {session.site_code}\n"
                    f"DTE:  {session.employee_code}\n"
                    f"Clock in:  {session.clock_in_at}\n"
                    f"Clock out: {session.clock_out_at}\n"
                )
                await queue_and_send_email(db, pm_email, subject, body_text)
            except Exception as e:
                logger.warning("queue_and_send_email failed: %s", e)

    await db.commit()
    return {"success": True, "timestamp": session.clock_out_at.isoformat(), "outcome": outcome, "pos_synced": pos_synced, "presite_promoted": presite_promoted}


@router.post("/sessions/{session_id}/share")
async def mark_session_shared(
    session_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record that the employee tapped Share on the clock summary (intent to send to LINE).
    Idempotent — keeps the first share timestamp."""
    session = (await db.execute(
        select(ClockSession).where(ClockSession.id == session_id)
    )).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found.")
    _assert_employee_clock_access(payload, session.employee_code)
    if session.shared_at is None:
        session.shared_at = datetime.now(timezone.utc)
        await db.commit()
    return {"success": True, "sharedAt": session.shared_at.isoformat()}


@router.get("/history")
async def clock_history(
    employee_code: str,
    limit: int = 30,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _assert_employee_clock_access(payload, employee_code)
    rows = (
        await db.execute(
            select(ClockSession)
            .where(ClockSession.employee_code == employee_code)
            .order_by(ClockSession.clock_in_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    return {"sessions": [_session_dict(s) for s in rows]}


@router.get("/photos/{session_id}/{direction}")
async def get_clock_photo(
    session_id: int,
    direction: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Serve a clock-in or clock-out photo with authentication.
    direction: 'in' | 'out'
    """
    if direction not in {"in", "out"}:
        raise HTTPException(400, "direction must be 'in' or 'out'")
    session = (await db.execute(select(ClockSession).where(ClockSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found.")
    _assert_employee_clock_access(payload, session.employee_code)
    photo_path = session.photo_in if direction == "in" else session.photo_out
    if not photo_path:
        raise HTTPException(404, "Photo not available.")
    # photo_path is stored as "/photos/clock/filename.jpg" — resolve to filesystem path
    filename = os.path.basename(photo_path)
    filepath = os.path.join(PHOTO_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(404, "Photo file not found on disk.")
    return FileResponse(filepath, media_type="image/jpeg")


@router.get("/monitor/events")
async def monitor_events(
    date_from: date | None = None,
    date_to: date | None = None,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()
    start = date_from or today
    end   = date_to   or today

    stmt = (
        select(ClockSession, Employee, AuthUser)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .join(AuthUser, AuthUser.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= end)
        .order_by(ClockSession.clock_in_at)
    )
    rows = (await db.execute(stmt)).all()

    events = []
    for session, emp, user in rows:
        name    = (emp.full_name if emp else None) \
                  or (f"{user.first_name} {user.last_name}".strip() if user else None) \
                  or session.employee_code
        email   = (emp.email if emp else None) or (user.email if user else "") or ""
        # projectCode: use employee's project_code for DAILY, site_code for PER_SITE
        project = (emp.project_code if emp and session.clock_type == "DAILY" else None) \
                  or session.site_code \
                  or (emp.project_team if emp else "") or ""
        team    = (emp.project_team if emp else "") or (user.team if user else "") or ""
        role    = (emp.project_role if emp else "") or (user.position_code if user else "") or ""
        source  = role or team or "ACE"

        base = {
            "name": name, "email": email, "projectCode": project,
            "job": session.site_name or session.site_code or "",
            "source": source, "team": team, "role": role,
            "sessionId": session.id, "employeeCode": session.employee_code,
            "clockType": session.clock_type,
        }
        if session.clock_in_at:
            events.append({**base,
                "time": session.clock_in_at.isoformat(),
                "status": "Clock In" if session.clock_type == "DAILY" else "Start Work",
                "lat": session.lat_in, "lng": session.lng_in,
                "photo1": session.photo_in or "", "photo2": "", "mileage": "",
            })
        if session.clock_out_at:
            outcome_status = "Complete"
            if session.clock_type != "DAILY":
                outcome_status = {"COMPLETE": "Complete", "COMPLETED": "Complete", "STOP": "Stop", "ISSUE": "Issue"}.get(session.status, "Complete")
            events.append({**base,
                "time": session.clock_out_at.isoformat(),
                "status": "Clock Out" if session.clock_type == "DAILY" else outcome_status,
                "lat": session.lat_out, "lng": session.lng_out,
                "photo1": session.photo_out or "", "photo2": "", "mileage": "",
            })

    events.sort(key=lambda e: e["time"], reverse=True)
    return {"events": events, "count": len(events)}


@router.get("/monitor/roster")
async def monitor_roster(
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Active employees as roster entries for ClockMonitorPage."""
    employees = (
        await db.execute(select(Employee).where(Employee.status == "ACTIVE").order_by(Employee.full_name))
    ).scalars().all()
    return {
        "roster": [
            {
                "name": employee.full_name,
                "email": employee.email or "",
                "projectCode": employee.project_code or employee.project_team or employee.department or "",
                "position": employee.project_role or employee.position or "",
                "team": employee.project_team or "",
                "source": employee.project_team or "ACE",
                "employeeCode": employee.employee_code,
            }
            for employee in employees
        ]
    }


# ── Analytics helpers ──────────────────────────────────────────────────────────

TZ_BKK = timezone(timedelta(hours=7))


def _parse_iso_date(value: str | None) -> date | None:
    """Parse YYYY-MM-DD; return None on empty or invalid."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _team_of(emp: Employee | None) -> str:
    if emp is None:
        return ""
    return (emp.project_team or emp.department or "").upper()

def _team_matches(emp_team: str, filter_team: str) -> bool:
    t = filter_team.upper()
    if t == "ALL":
        return True
    return emp_team.upper() == t

def _sec_of_day(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    local = dt.astimezone(TZ_BKK)
    return local.hour * 3600 + local.minute * 60 + local.second

def _hms(sec: int | float | None) -> str:
    if sec is None or not isinstance(sec, (int, float)) or sec < 0:
        return ""
    sec = int(sec)
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h}:{m:02d}:{s:02d}"

def _score(send: int, loc: int, clock: int) -> float:
    return (send + loc + clock) / 3.0


# ── Monitor analytics endpoints ────────────────────────────────────────────────

@router.get("/monitor/compliance")
async def monitor_compliance(
    month: str | None = None,
    team: str = "ALL",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Day-by-day compliance aggregated across team for the given month."""
    today = datetime.now(TZ_BKK).date()
    m = month if month and len(month) == 7 else today.strftime("%Y-%m")
    y, mo = int(m[:4]), int(m[5:7])
    start = date(y, mo, 1)
    last_day = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= last_day)
    )
    rows = (await db.execute(stmt)).all()

    # day → {w, send, loc, clock, score, time_w}
    by_day: dict[int, dict] = defaultdict(lambda: {"w": 0, "send": 0, "loc": 0, "clock": 0, "score": 0, "time_w": 0})
    for session, emp in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        day = session.work_date.day
        send = 1 if session.clock_in_at else 0
        loc  = 1 if (session.lat_in is not None and session.lng_in is not None) else 0
        clock = 1 if session.clock_out_at else 0
        sc = _score(send, loc, clock)
        by_day[day]["w"]     += 1
        by_day[day]["send"]  += send
        by_day[day]["loc"]   += loc
        by_day[day]["clock"] += clock
        by_day[day]["score"] += sc
        if session.clock_in_at and session.clock_out_at:
            dur = (session.clock_out_at - session.clock_in_at).total_seconds()
            if 0 < dur < 86400:
                by_day[day]["time_w"] += dur

    result_rows = []
    for day in range(1, last_day.day + 1):
        b = by_day.get(day)
        if not b or b["w"] == 0:
            result_rows.append({"day": day, "headcount": 0, "sendPct": None, "locPct": None, "clockPct": None, "scorePct": None, "avgTotalTimeText": "", "avgTotalTimeSec": 0})
            continue
        w = b["w"]
        avg_sec = b["time_w"] / w if b["time_w"] else 0
        result_rows.append({
            "day": day,
            "headcount": w,
            "sendPct":  round(b["send"]  / w * 100, 1),
            "locPct":   round(b["loc"]   / w * 100, 1),
            "clockPct": round(b["clock"] / w * 100, 1),
            "scorePct": round(b["score"] / w * 100, 1),
            "avgTotalTimeText": _hms(avg_sec),
            "avgTotalTimeSec":  round(avg_sec),
        })

    valid = [r for r in result_rows if r["headcount"] > 0 and r["sendPct"] is not None]
    total_w = sum(r["headcount"] for r in valid)
    def wavg(key):
        return round(sum(r[key] * r["headcount"] for r in valid) / total_w, 1) if total_w else 0

    return {
        "meta": {"monthISO": m, "team": team, "source": "clock_sessions"},
        "rows": result_rows,
        "avg": {
            "totalHeadcount": total_w,
            "sendPct":  wavg("sendPct"),
            "locPct":   wavg("locPct"),
            "clockPct": wavg("clockPct"),
            "scorePct": wavg("scorePct"),
        },
    }


@router.get("/monitor/person-compliance")
async def monitor_person_compliance(
    month: str | None = None,
    employee_code: str = "",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-day compliance for a single employee."""
    today = datetime.now(TZ_BKK).date()
    m = month if month and len(month) == 7 else today.strftime("%Y-%m")
    y, mo = int(m[:4]), int(m[5:7])
    start = date(y, mo, 1)
    last_day = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)

    rows = (await db.execute(
        select(ClockSession)
        .where(
            ClockSession.employee_code == employee_code,
            ClockSession.work_date >= start,
            ClockSession.work_date <= last_day,
        )
        .order_by(ClockSession.work_date)
    )).scalars().all()

    # Keep latest session per day
    per_day: dict[int, ClockSession] = {}
    for s in rows:
        d = s.work_date.day
        if d not in per_day or (s.clock_in_at or datetime.min) > (per_day[d].clock_in_at or datetime.min):
            per_day[d] = s

    days = []
    cum_score = 0.0
    cum_workdays = 0
    for day in range(1, last_day.day + 1):
        s = per_day.get(day)
        day_iso = f"{m}-{day:02d}"
        send  = (1 if s and s.clock_in_at else 0)       if s else None
        loc   = (1 if s and s.lat_in is not None else 0) if s else None
        clock = (1 if s and s.clock_out_at else 0)      if s else None
        score = _score(send or 0, loc or 0, clock or 0) if s else 0
        if s:
            cum_score += score
            dow = date(y, mo, day).weekday()
            if dow != 6:  # not Sunday
                cum_workdays += 1
        ci_sec = _sec_of_day(s.clock_in_at)  if s else None
        co_sec = _sec_of_day(s.clock_out_at) if s else None
        tt_sec = None
        if s and s.clock_in_at and s.clock_out_at:
            tt_sec = int((s.clock_out_at - s.clock_in_at).total_seconds())
        days.append({
            "day": day, "dayISO": day_iso,
            "send": send, "loc": loc, "clock": clock,
            "score": round(score, 4),
            "cumScore": round(cum_score, 2), "cumWorkdays": cum_workdays,
            "ciSec": ci_sec, "coSec": co_sec, "ttSec": tt_sec,
        })

    return {"ok": True, "meta": {"monthISO": m, "employeeCode": employee_code}, "days": days}


@router.get("/monitor/time-summary")
async def monitor_time_summary(
    month: str | None = None,
    team: str = "ALL",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Start/Stop/TotalTime rankings for a month."""
    today = datetime.now(TZ_BKK).date()
    m = month if month and len(month) == 7 else today.strftime("%Y-%m")
    y, mo = int(m[:4]), int(m[5:7])
    start = date(y, mo, 1)
    last_day = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= last_day)
    )
    rows = (await db.execute(stmt)).all()

    people: dict[str, dict] = {}
    for session, emp in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        code = session.employee_code
        name = (emp.full_name if emp else None) or code
        proj = _team_of(emp) or ""
        if code not in people:
            people[code] = {"_id": code, "name": name, "team": proj, "start": [], "stop": [], "total": []}
        ci = _sec_of_day(session.clock_in_at)
        co = _sec_of_day(session.clock_out_at)
        if ci is not None:
            people[code]["start"].append(ci)
        if co is not None:
            people[code]["stop"].append(co)
        if ci is not None and co is not None and co > ci:
            people[code]["total"].append(co - ci)

    def agg(lst):
        if not lst:
            return {"min": None, "avg": None, "max": None}
        return {"min": min(lst), "avg": sum(lst) / len(lst), "max": max(lst)}

    start_work, stop_work, total_time = [], [], []
    for code, p in people.items():
        a_start = agg(p["start"])
        a_stop  = agg(p["stop"])
        a_total = agg(p["total"])
        base = {"_id": code, "name": p["name"], "project": p["team"]}
        start_work.append({**base, "minSec": a_start["min"], "avgSec": a_start["avg"], "maxSec": a_start["max"]})
        stop_work.append( {**base, "minSec": a_stop["min"],  "avgSec": a_stop["avg"],  "maxSec": a_stop["max"]})
        total_time.append({**base, "minSec": a_total["min"], "avgSec": a_total["avg"], "maxSec": a_total["max"]})

    def rank_by(lst, key, asc):
        scored = [(x, x[key]) for x in lst if x[key] is not None]
        scored.sort(key=lambda t: t[1], reverse=not asc)
        return {t[0]["_id"]: i + 1 for i, t in enumerate(scored)}

    r_start = rank_by(start_work, "avgSec", True)
    r_stop  = rank_by(stop_work,  "avgSec", False)
    r_total = rank_by(total_time, "avgSec", False)

    for x in start_work:
        x["rank"] = r_start.get(x["_id"], "")
        x["min"] = _hms(x.pop("minSec")); x["avg"] = _hms(x.pop("avgSec")); x["max"] = _hms(x.pop("maxSec"))
    for x in stop_work:
        x["rank"] = r_stop.get(x["_id"], "")
        x["min"] = _hms(x.pop("minSec")); x["avg"] = _hms(x.pop("avgSec")); x["max"] = _hms(x.pop("maxSec"))
    for x in total_time:
        x["rank"] = r_total.get(x["_id"], "")
        x["min"] = _hms(x.pop("minSec")); x["avg"] = _hms(x.pop("avgSec")); x["max"] = _hms(x.pop("maxSec"))

    start_work.sort(key=lambda x: x["rank"] if isinstance(x["rank"], int) else 9999)
    stop_work.sort( key=lambda x: x["rank"] if isinstance(x["rank"], int) else 9999)
    total_time.sort(key=lambda x: x["rank"] if isinstance(x["rank"], int) else 9999)

    return {"ok": True, "meta": {"monthISO": m, "team": team}, "startWork": start_work, "stopWork": stop_work, "totalTime": total_time}


@router.get("/monitor/person-summary")
async def monitor_person_summary(
    date_from: date | None = None,
    date_to:   date | None = None,
    month: str | None = None,
    team: str = "ALL",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-person aggregated compliance for a date range."""
    today = datetime.now(TZ_BKK).date()
    if date_from and date_to:
        start, end = date_from, date_to
    elif month and len(month) == 7:
        y, mo = int(month[:4]), int(month[5:7])
        start = date(y, mo, 1)
        end = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)
    else:
        start = end = today

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= end)
    )
    rows = (await db.execute(stmt)).all()

    # count workdays (Mon–Sat) in range
    range_workdays = sum(1 for n in range((end - start).days + 1) if (start + timedelta(n)).weekday() != 6)

    per_person: dict[str, dict] = {}
    for session, emp in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        code = session.employee_code
        name = (emp.full_name if emp else None) or code
        proj = _team_of(emp) or ""
        if code not in per_person:
            per_person[code] = {"name": name, "project": proj, "date_set": set(), "send_days": set(), "loc_days": set(), "clock_days": set(), "total_sec": 0}
        p = per_person[code]
        dk = session.work_date.isoformat()
        p["date_set"].add(dk)
        if session.clock_in_at:
            p["send_days"].add(dk)
        if session.lat_in is not None and session.lng_in is not None:
            p["loc_days"].add(dk)
        if session.clock_out_at:
            p["clock_days"].add(dk)
        if session.clock_in_at and session.clock_out_at:
            dur = (session.clock_out_at - session.clock_in_at).total_seconds()
            if 0 < dur < 86400:
                p["total_sec"] += dur

    wd = range_workdays or 1
    result = []
    for code, p in per_person.items():
        days = len(p["date_set"])
        denom = days or 1
        send_pct  = len(p["send_days"])  / denom
        loc_pct   = len(p["loc_days"])   / denom
        clock_pct = len(p["clock_days"]) / denom
        score_pct = (send_pct + loc_pct + clock_pct) / 3
        sec = p["total_sec"]
        h = int(sec // 3600); mm = int((sec % 3600) // 60); ss = int(sec % 60)
        total_time = f"{h:02d}:{mm:02d}:{ss:02d}" if sec > 0 else "—"
        result.append({
            "employeeCode": code,
            "name": p["name"],
            "project": p["project"],
            "days": days,
            "sendPct":  round(send_pct  * 100, 1),
            "locPct":   round(loc_pct   * 100, 1),
            "clockPct": round(clock_pct * 100, 1),
            "scorePct": round(score_pct * 100, 1),
            "totalTime": total_time,
        })

    result.sort(key=lambda x: (x["project"], x["name"]))
    return {"ok": True, "meta": {"from": start.isoformat(), "to": end.isoformat(), "team": team, "rangeWorkdays": range_workdays}, "rows": result}


@router.get("/monitor/headcount")
async def monitor_headcount(
    months: int = 12,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Distinct employees per month grouped by project_team."""
    months = max(1, min(36, months))
    today = datetime.now(TZ_BKK).date()
    end_month = today.replace(day=1)
    start_month = (end_month - timedelta(days=months * 31)).replace(day=1)

    stmt = (
        select(
            func.to_char(ClockSession.work_date, "YYYY-MM").label("month"),
            Employee.project_team,
            func.count(func.distinct(ClockSession.employee_code)).label("cnt"),
        )
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(
            ClockSession.work_date >= start_month,
            ClockSession.work_date <= today,
            ClockSession.clock_in_at.isnot(None),
        )
        .group_by(text("1"), Employee.project_team)
        .order_by(text("1"))
    )
    rows = (await db.execute(stmt)).all()

    by_month: dict[str, dict] = defaultdict(lambda: {"RF": 0, "TE": 0, "DTE": 0, "NPM": 0})
    for month_str, proj_team, cnt in rows:
        team_key = (proj_team or "").upper()
        if team_key in ("RF", "TE", "DTE"):
            by_month[month_str][team_key] += cnt
        else:
            by_month[month_str]["NPM"] += cnt

    all_months = sorted(by_month.keys())[-months:]
    result = [{"month": m, **by_month[m], "total": sum(by_month[m].values())} for m in all_months]
    return {"ok": True, "months": result, "meta": {"lastNMonths": months}}


@router.get("/monitor/today-executive")
async def monitor_today_executive(
    team: str = "ALL",
    date_iso: str | None = None,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Latest clock-in per person on the given date (default: today), with GPS."""
    target = _parse_iso_date(date_iso) or datetime.now(TZ_BKK).date()
    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(
            ClockSession.work_date == target,
            ClockSession.clock_in_at.isnot(None),
        )
        .order_by(ClockSession.clock_in_at)
    )
    rows = (await db.execute(stmt)).all()

    latest: dict[str, dict] = {}
    for session, emp in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        code = session.employee_code
        name = (emp.full_name if emp else None) or code
        proj = _team_of(emp) or session.site_code or ""
        entry = {
            "employeeCode": code,
            "name": name,
            "projectCode": proj,
            "job": session.site_name or session.site_code or "",
            "timeISO": session.clock_in_at.isoformat() if session.clock_in_at else None,
            "lat": session.lat_in,
            "lng": session.lng_in,
        }
        # keep latest
        prev = latest.get(code)
        if not prev or (session.clock_in_at or datetime.min) > datetime.fromisoformat(prev["timeISO"] or "1970-01-01"):
            latest[code] = entry

    result = sorted(latest.values(), key=lambda x: x["timeISO"] or "", reverse=True)
    return {"ok": True, "list": result, "meta": {"dateISO": target.isoformat(), "team": team, "totalStarted": len(result)}}


@router.get("/monitor/month-sessions")
async def monitor_month_sessions(
    month: str | None = None,
    team: str = "ALL",
    employee_code: str = "",
    offset: int = 0,
    limit: int = 100,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Paged sessions for a month (start+end in one row)."""
    today = datetime.now(TZ_BKK).date()
    m = month if month and len(month) == 7 else today.strftime("%Y-%m")
    y, mo = int(m[:4]), int(m[5:7])
    start = date(y, mo, 1)
    last_day = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)
    limit = min(300, max(1, limit))

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= last_day)
        .order_by(ClockSession.work_date.desc(), ClockSession.clock_in_at.desc())
    )
    if employee_code:
        stmt = stmt.where(ClockSession.employee_code == employee_code)
    all_rows = (await db.execute(stmt)).all()

    result = []
    for session, emp in all_rows:
        if not _team_matches(_team_of(emp), team):
            continue
        name = (emp.full_name if emp else None) or session.employee_code
        proj = _team_of(emp) or ""
        dur = None
        if session.clock_in_at and session.clock_out_at:
            dur = int((session.clock_out_at - session.clock_in_at).total_seconds())
        result.append({
            "date": session.work_date.isoformat(),
            "project": proj,
            "name": name,
            "employeeCode": session.employee_code,
            "clockIn":  session.clock_in_at.astimezone(TZ_BKK).strftime("%H:%M:%S") if session.clock_in_at else "",
            "clockOut": session.clock_out_at.astimezone(TZ_BKK).strftime("%H:%M:%S") if session.clock_out_at else "",
            "totalTime": _hms(dur) if dur else "",
            "job": session.site_name or session.site_code or "",
        })

    page = result[offset: offset + limit]
    return {"ok": True, "month": m, "rows": page, "nextOffset": offset + len(page), "done": offset + len(page) >= len(result), "total": len(result)}


WORK_START_HOUR = 8
WORK_START_MIN  = 30
WORK_END_HOUR   = 17
WORK_END_MIN    = 0
LATE_GRACE_MIN  = 15  # >15 นาที = สาย


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in metres."""
    R = 6371000.0
    p1 = radians(lat1); p2 = radians(lat2)
    dp = radians(lat2 - lat1); dl = radians(lng2 - lng1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * R * asin(sqrt(a))


@router.get("/monitor/today-map")
async def monitor_today_map(
    team: str = "ALL",
    date_iso: str | None = None,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Clock-in points + geofence info per person for the given date (default: today).

    Status (geofence verification of "Location Work"):
    - on_site: GPS within the geofence (site radius for PER_SITE, office radius for DAILY)
    - off_site: GPS present, geofence known, but outside radius
    - no_site: no geofence to check against (DAILY without a work location, or unknown site)
    - no_gps: no lat/lng captured

    For PER_SITE clock-ins the geofence is the linked ClockSite. For DAILY clock-ins
    (no site) it falls back to the user's office geofence in auth_users.work_lat/lng/radius.
    `locationSource` is 'site' | 'office' | null.
    """
    target = _parse_iso_date(date_iso) or datetime.now(TZ_BKK).date()

    stmt = (
        select(ClockSession, Employee, ClockSite, AuthUser)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .join(ClockSite, ClockSite.site_code == ClockSession.site_code, isouter=True)
        .join(AuthUser, AuthUser.employee_code == ClockSession.employee_code, isouter=True)
        .where(
            ClockSession.work_date == target,
            ClockSession.clock_in_at.isnot(None),
        )
        .order_by(ClockSession.clock_in_at)
    )
    rows = (await db.execute(stmt)).all()

    # keep latest clock-in per employee
    latest: dict[str, dict] = {}
    sites_used: dict[str, dict] = {}
    on_site = off_site = no_site = no_gps = 0

    for session, emp, site, auth in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        code = session.employee_code
        name = (emp.full_name if emp else None) or code
        proj = _team_of(emp) or session.site_code or ""

        lat_in = session.lat_in
        lng_in = session.lng_in
        site_lat = site.lat if site else None
        site_lng = site.lng if site else None
        site_radius = (site.gps_radius_m if site else None) or 500

        # Office geofence fallback (DAILY) from auth_users
        office_lat = auth.work_lat if auth else None
        office_lng = auth.work_lng if auth else None
        office_radius = (auth.allowed_radius_m if auth else None) or 300

        distance_m = None
        status = "no_gps"
        location_source = None
        expected_lat = expected_lng = expected_radius = None

        if session.geofence_source is not None and session.distance_in_m is not None:
            # FROZEN snapshot from clock-in time — immune to later office/site moves.
            distance_m = session.distance_in_m
            status = "on_site" if session.on_site_in else "off_site"
            location_source = session.geofence_source
            expected_lat = session.geofence_lat
            expected_lng = session.geofence_lng
            expected_radius = session.geofence_radius_m
        elif lat_in is None or lng_in is None:
            status = "no_gps"
        elif site_lat is not None and site_lng is not None:
            # Legacy fallback (no snapshot): live computation against current site.
            distance_m = _haversine_m(float(lat_in), float(lng_in), float(site_lat), float(site_lng))
            status = "on_site" if distance_m <= site_radius else "off_site"
            location_source = "site"
            expected_lat, expected_lng, expected_radius = site_lat, site_lng, site_radius
        elif office_lat is not None and office_lng is not None:
            # Legacy fallback (no snapshot): live computation against current office.
            distance_m = _haversine_m(float(lat_in), float(lng_in), float(office_lat), float(office_lng))
            status = "on_site" if distance_m <= office_radius else "off_site"
            location_source = "office"
            expected_lat, expected_lng, expected_radius = office_lat, office_lng, office_radius
        else:
            status = "no_site"

        entry = {
            "employeeCode": code,
            "name": name,
            "projectCode": proj,
            "position": (emp.project_role or emp.position or "") if emp else "",
            "siteCode": session.site_code or "",
            "siteName": (site.site_name if site else None) or session.site_name or "",
            "locationSource": location_source,
            "locationName": (
                (site.site_name if site else None)
                if location_source == "site"
                else (auth.work_location_name if (auth and location_source == "office") else None)
            ),
            "timeISO": session.clock_in_at.isoformat() if session.clock_in_at else None,
            "clockOutISO": session.clock_out_at.isoformat() if session.clock_out_at else None,
            "lat": lat_in,
            "lng": lng_in,
            "expectedLat": expected_lat,
            "expectedLng": expected_lng,
            "expectedRadiusM": expected_radius,
            "distanceM": round(distance_m, 1) if distance_m is not None else None,
            "status": status,
            "photoIn": session.photo_in or "",
            "photoOut": session.photo_out or "",
            "sharedToLine": session.shared_at is not None,
            "sharedAtISO": session.shared_at.isoformat() if session.shared_at else None,
            "clockType": session.clock_type,
        }
        prev = latest.get(code)
        if not prev or (session.clock_in_at or datetime.min) > datetime.fromisoformat(prev["timeISO"] or "1970-01-01"):
            latest[code] = entry

        if site and site.lat is not None and site.lng is not None and site.site_code not in sites_used:
            sites_used[site.site_code] = {
                "siteCode": site.site_code,
                "siteName": site.site_name or "",
                "projectCode": site.project_code or "",
                "lat": site.lat,
                "lng": site.lng,
                "radiusM": site.gps_radius_m or 500,
            }

    for entry in latest.values():
        s = entry["status"]
        if s == "on_site":   on_site += 1
        elif s == "off_site": off_site += 1
        elif s == "no_site":  no_site += 1
        else:                 no_gps += 1

    people = sorted(latest.values(), key=lambda x: x["timeISO"] or "", reverse=True)
    return {
        "ok": True,
        "meta": {
            "dateISO": target.isoformat(),
            "team": team,
            "totalPeople": len(people),
            "onSite": on_site,
            "offSite": off_site,
            "noSite": no_site,
            "noGPS": no_gps,
        },
        "people": people,
        "sites": list(sites_used.values()),
    }


@router.get("/monitor/attendance-tracker")
async def attendance_tracker(
    month: str | None = None,
    team: str = "ALL",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Late arrival / early leave / working days vs calendar / punctuality trend."""
    today = datetime.now(TZ_BKK).date()
    m = month if month and len(month) == 7 else today.strftime("%Y-%m")
    y, mo = int(m[:4]), int(m[5:7])
    start = date(y, mo, 1)
    last_day = (date(y, mo + 1, 1) - timedelta(days=1)) if mo < 12 else date(y, 12, 31)
    calendar_workdays = sum(1 for n in range((last_day - start).days + 1)
                             if (start + timedelta(n)).weekday() != 6)
    work_start_min = WORK_START_HOUR * 60 + WORK_START_MIN
    work_end_min   = WORK_END_HOUR   * 60 + WORK_END_MIN

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= last_day)
        .order_by(ClockSession.work_date, ClockSession.clock_in_at)
    )
    rows = (await db.execute(stmt)).all()

    # per-person aggregation
    per: dict[str, dict] = {}
    daily_late: dict[int, list[int]] = defaultdict(list)  # day → list of late_min (>=0)

    for session, emp in rows:
        if not _team_matches(_team_of(emp), team):
            continue
        if not session.clock_in_at:
            continue
        code = session.employee_code
        name = (emp.full_name if emp else None) or code
        proj = _team_of(emp) or ""

        in_local  = session.clock_in_at.astimezone(TZ_BKK)
        out_local = session.clock_out_at.astimezone(TZ_BKK) if session.clock_out_at else None
        in_min  = in_local.hour * 60 + in_local.minute
        out_min = (out_local.hour * 60 + out_local.minute) if out_local else None
        late_m  = max(0, in_min - work_start_min)
        early_m = max(0, work_end_min - out_min) if out_min is not None else 0
        is_late  = (in_min - work_start_min) > LATE_GRACE_MIN
        is_early = (out_min is not None and out_min < work_end_min)

        p = per.setdefault(code, {
            "code": code, "name": name, "project": proj,
            "work_dates": set(), "in_mins": [], "out_mins": [],
            "late_minutes_sum": 0, "late_days": 0,
            "early_leave_days": 0, "early_min_sum": 0,
            "total_seconds": 0,
        })
        p["work_dates"].add(session.work_date.isoformat())
        p["in_mins"].append(in_min)
        if out_min is not None:
            p["out_mins"].append(out_min)
        if is_late:
            p["late_days"] += 1
            p["late_minutes_sum"] += late_m
        if is_early:
            p["early_leave_days"] += 1
            p["early_min_sum"] += early_m
        if out_local:
            dur = (out_local - in_local).total_seconds()
            if 0 < dur < 86400:
                p["total_seconds"] += dur
        # trend by day-of-month (avg late across team)
        daily_late[session.work_date.day].append(late_m)

    def hhmm(minutes_avg):
        if not minutes_avg:
            return "—"
        m = int(round(minutes_avg))
        return f"{m // 60:02d}:{m % 60:02d}"

    people = []
    for code, p in per.items():
        wd = len(p["work_dates"])
        avg_in  = sum(p["in_mins"])  / len(p["in_mins"])  if p["in_mins"]  else None
        avg_out = sum(p["out_mins"]) / len(p["out_mins"]) if p["out_mins"] else None
        avg_late_per_late_day = round(p["late_minutes_sum"] / p["late_days"], 1) if p["late_days"] else 0
        total_h = round(p["total_seconds"] / 3600, 1)
        attendance_pct = round(wd / calendar_workdays * 100, 1) if calendar_workdays else 0
        people.append({
            "employeeCode": code,
            "name": p["name"],
            "project": p["project"],
            "workingDays": wd,
            "calendarWorkdays": calendar_workdays,
            "attendancePct": attendance_pct,
            "lateDays": p["late_days"],
            "earlyLeaveDays": p["early_leave_days"],
            "avgLatePerLateDay": avg_late_per_late_day,
            "totalLateMin": p["late_minutes_sum"],
            "avgClockIn":  hhmm(avg_in),
            "avgClockOut": hhmm(avg_out),
            "totalHours": total_h,
        })
    people.sort(key=lambda x: (-x["lateDays"], -x["totalLateMin"], x["name"]))

    # trend: avg late minutes per day-of-month (averaged across team)
    trend = []
    for d in range(1, last_day.day + 1):
        bucket = daily_late.get(d, [])
        # workday only (Mon-Sat) — show null on Sunday
        is_sunday = (date(y, mo, d).weekday() == 6)
        if is_sunday:
            trend.append({"day": d, "avgLateMin": None, "lateCount": 0, "totalCount": 0, "sunday": True})
        else:
            avg_l = round(sum(bucket) / len(bucket), 1) if bucket else 0
            late_n = sum(1 for x in bucket if x > LATE_GRACE_MIN)
            trend.append({"day": d, "avgLateMin": avg_l, "lateCount": late_n, "totalCount": len(bucket), "sunday": False})

    summary = {
        "month": m,
        "team": team,
        "calendarWorkdays": calendar_workdays,
        "workStart": f"{WORK_START_HOUR:02d}:{WORK_START_MIN:02d}",
        "workEnd":   f"{WORK_END_HOUR:02d}:{WORK_END_MIN:02d}",
        "lateGraceMin": LATE_GRACE_MIN,
        "people": len(people),
        "totalLateDays": sum(p["lateDays"] for p in people),
        "totalEarlyLeaveDays": sum(p["earlyLeaveDays"] for p in people),
        "avgAttendancePct": round(sum(p["attendancePct"] for p in people) / len(people), 1) if people else 0,
    }
    return {"ok": True, "summary": summary, "people": people, "trend": trend}


@router.get("/monitor/movement")
async def monitor_movement(
    date_iso: str | None = None,
    team: str = "ALL",
    employee_code: str = "",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Per-person trail, time-at-site, travel time, sites visited for a single date."""
    today = datetime.now(TZ_BKK).date()
    target = date.fromisoformat(date_iso) if date_iso else today

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date == target,
               ClockSession.clock_in_at.isnot(None))
        .order_by(ClockSession.employee_code, ClockSession.clock_in_at)
    )
    if employee_code:
        stmt = stmt.where(ClockSession.employee_code == employee_code)
    rows = (await db.execute(stmt)).all()

    # group by employee
    bucket: dict[str, list] = defaultdict(list)
    emp_info: dict[str, dict] = {}
    for s, e in rows:
        if not _team_matches(_team_of(e), team):
            continue
        bucket[s.employee_code].append(s)
        if s.employee_code not in emp_info:
            emp_info[s.employee_code] = {
                "name": (e.full_name if e else None) or s.employee_code,
                "project": _team_of(e) or "",
            }

    people = []
    for code, sessions in bucket.items():
        sessions.sort(key=lambda s: s.clock_in_at)
        trail = []
        sites = set()
        total_at_site_sec = 0
        travel_sec = 0
        total_dist_m = 0.0
        prev_out_time = None
        prev_out_pt   = None

        for s in sessions:
            in_local = s.clock_in_at.astimezone(TZ_BKK) if s.clock_in_at else None
            out_local = s.clock_out_at.astimezone(TZ_BKK) if s.clock_out_at else None
            if s.site_code:
                sites.add(s.site_code)
            if in_local and out_local:
                dur = (out_local - in_local).total_seconds()
                if 0 < dur < 86400:
                    total_at_site_sec += dur
            # travel: gap from previous clock_out to this clock_in
            if prev_out_time and in_local:
                gap = (in_local - prev_out_time).total_seconds()
                if 0 < gap < 14400:  # cap at 4h
                    travel_sec += gap
            # distance: previous out point to this in point
            if prev_out_pt and s.lat_in is not None and s.lng_in is not None:
                total_dist_m += _haversine_m(prev_out_pt[0], prev_out_pt[1],
                                             float(s.lat_in), float(s.lng_in))
            # build trail
            if s.lat_in is not None and s.lng_in is not None:
                trail.append({
                    "type": "in", "time": in_local.isoformat() if in_local else None,
                    "lat": s.lat_in, "lng": s.lng_in,
                    "siteCode": s.site_code or "", "siteName": s.site_name or "",
                })
            if s.lat_out is not None and s.lng_out is not None:
                trail.append({
                    "type": "out", "time": out_local.isoformat() if out_local else None,
                    "lat": s.lat_out, "lng": s.lng_out,
                    "siteCode": s.site_code or "", "siteName": s.site_name or "",
                })
            if out_local and s.lat_out is not None and s.lng_out is not None:
                prev_out_time = out_local
                prev_out_pt = (float(s.lat_out), float(s.lng_out))

        people.append({
            "employeeCode": code,
            "name": emp_info[code]["name"],
            "project": emp_info[code]["project"],
            "sitesVisited": len(sites),
            "siteCodes": sorted(sites),
            "timeAtSiteSec": int(total_at_site_sec),
            "timeAtSiteText": _hms(total_at_site_sec),
            "travelSec": int(travel_sec),
            "travelText": _hms(travel_sec),
            "distanceKm": round(total_dist_m / 1000, 2),
            "trail": trail,
            "sessionCount": len(sessions),
        })

    people.sort(key=lambda x: (-x["sitesVisited"], -x["timeAtSiteSec"], x["name"]))

    return {
        "ok": True,
        "meta": {
            "dateISO": target.isoformat(),
            "team": team,
            "people": len(people),
            "totalSites": sum(p["sitesVisited"] for p in people),
            "totalDistanceKm": round(sum(p["distanceKm"] for p in people), 2),
        },
        "people": people,
    }


@router.get("/monitor/coverage")
async def monitor_coverage(
    days: int = 30,
    employee_code: str = "",
    team: str = "ALL",
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Heatmap-friendly clock-in points across N days. Capped at 5000 points."""
    days = max(1, min(365, days))
    today = datetime.now(TZ_BKK).date()
    start = today - timedelta(days=days - 1)

    stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date >= start, ClockSession.work_date <= today,
               ClockSession.lat_in.isnot(None), ClockSession.lng_in.isnot(None))
    )
    if employee_code:
        stmt = stmt.where(ClockSession.employee_code == employee_code)
    rows = (await db.execute(stmt)).all()

    # bucket points by 4-decimal-place lat/lng grid (~11m) to dedupe + add weight
    buckets: dict[tuple, dict] = {}
    for s, e in rows:
        if not _team_matches(_team_of(e), team):
            continue
        key = (round(float(s.lat_in), 4), round(float(s.lng_in), 4))
        b = buckets.setdefault(key, {"lat": key[0], "lng": key[1], "weight": 0})
        b["weight"] += 1

    points = sorted(buckets.values(), key=lambda x: -x["weight"])[:5000]
    return {
        "ok": True,
        "meta": {"days": days, "from": start.isoformat(), "to": today.isoformat(),
                 "employeeCode": employee_code or None, "team": team,
                 "totalPoints": len(points), "totalClockIns": sum(p["weight"] for p in points)},
        "points": points,
    }


@router.get("/monitor/departments")
async def monitor_departments(
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Distinct departments (project_team) for filter dropdowns.
    Only teams with ≥1 ACTIVE employee. Priority: DTE/RF/TE first (if present), rest alphabetical."""
    rows = (await db.execute(
        select(Employee.project_team, func.count(Employee.id))
        .where(Employee.status == "ACTIVE")
        .group_by(Employee.project_team)
    )).all()

    counts = {(team or "").strip(): n for team, n in rows if (team or "").strip()}

    priority = ["DTE", "RF", "TE"]
    seen = set()
    ordered = []
    for p in priority:
        if counts.get(p):
            ordered.append({"value": p, "label": p, "count": counts[p]})
            seen.add(p)
    for team in sorted(counts.keys()):
        if team in seen:
            continue
        ordered.append({"value": team, "label": team, "count": counts[team]})

    return {"ok": True, "departments": ordered}


@router.get("/monitor/latest-date")
async def monitor_latest_date(
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Latest calendar date that has at least one clock_in row.
    Used by the frontend to auto-jump the date/month pickers on first load
    so the page doesn't land on an empty day."""
    today = date.today()
    row = (await db.execute(
        select(func.max(func.date(ClockSession.clock_in_at)))
        .where(ClockSession.clock_in_at.is_not(None))
    )).first()
    latest = row[0] if row else None
    return {
        "ok": True,
        "latestDate": latest.isoformat() if latest else None,
        "today": today.isoformat(),
        "hasData": latest is not None,
    }


# ── Admin Manual Compliance Entry ──────────────────────────────────────────────
# Admins (SUPER/SYSTEM/HR/PROJECT) can manually mark the 3 daily compliance
# checks (send_to_line / location_work / status_clock) for a person on a date.
# Stored separately from clock_sessions — does not modify the audit-trail of
# auto-captured data; consumed in addition to it.

class ManualCheckBody(BaseModel):
    employee_code: str
    work_date: str  # YYYY-MM-DD
    send_to_line: bool = False
    location_work: bool = False
    status_clock: bool = False
    notes: str | None = None


@router.post("/monitor/manual-check")
async def monitor_manual_check_upsert(
    body: ManualCheckBody,
    payload: dict = Depends(require_manual_check_admin),
    db: AsyncSession = Depends(get_db),
):
    target = _parse_iso_date(body.work_date)
    if not target:
        raise HTTPException(status_code=400, detail="work_date must be YYYY-MM-DD")
    emp_code = body.employee_code.strip()
    if not emp_code:
        raise HTTPException(status_code=400, detail="employee_code is required")

    existing = (await db.execute(
        select(ClockManualCheck).where(
            ClockManualCheck.employee_code == emp_code,
            ClockManualCheck.work_date == target,
        )
    )).scalar_one_or_none()

    admin_code = (payload.get("employee_code") or payload.get("sub") or "").strip() or None
    admin_name = (payload.get("name") or payload.get("full_name") or "").strip() or None

    if existing:
        existing.send_to_line = body.send_to_line
        existing.location_work = body.location_work
        existing.status_clock = body.status_clock
        existing.notes = (body.notes or "").strip() or None
        existing.admin_code = admin_code
        existing.admin_name = admin_name
        row = existing
    else:
        row = ClockManualCheck(
            employee_code=emp_code,
            work_date=target,
            send_to_line=body.send_to_line,
            location_work=body.location_work,
            status_clock=body.status_clock,
            notes=(body.notes or "").strip() or None,
            admin_code=admin_code,
            admin_name=admin_name,
        )
        db.add(row)

    await db.commit()
    await db.refresh(row)
    return {
        "ok": True,
        "entry": _serialize_manual_check(row),
    }


@router.get("/monitor/manual-check")
async def monitor_manual_check_list(
    date_iso: str | None = None,
    employee_code: str | None = None,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """List manual compliance entries. Both filters optional; without filters
    returns the latest 200 entries (newest first) for an audit view."""
    stmt = select(ClockManualCheck, Employee).join(
        Employee, Employee.employee_code == ClockManualCheck.employee_code, isouter=True
    )
    target = _parse_iso_date(date_iso)
    if target:
        stmt = stmt.where(ClockManualCheck.work_date == target)
    if employee_code:
        stmt = stmt.where(ClockManualCheck.employee_code == employee_code.strip())
    stmt = stmt.order_by(ClockManualCheck.updated_at.desc()).limit(200)
    rows = (await db.execute(stmt)).all()
    entries = []
    for entry, emp in rows:
        item = _serialize_manual_check(entry)
        item["name"] = (emp.full_name if emp else None) or entry.employee_code
        item["projectCode"] = _team_of(emp) if emp else ""
        entries.append(item)
    return {"ok": True, "entries": entries, "count": len(entries)}


@router.delete("/monitor/manual-check/{entry_id}")
async def monitor_manual_check_delete(
    entry_id: int,
    payload: dict = Depends(require_manual_check_admin),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(
        select(ClockManualCheck).where(ClockManualCheck.id == entry_id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(row)
    await db.commit()
    return {"ok": True, "deletedId": entry_id}


def _serialize_manual_check(row: ClockManualCheck) -> dict:
    return {
        "id": row.id,
        "employeeCode": row.employee_code,
        "workDate": row.work_date.isoformat(),
        "sendToLine": row.send_to_line,
        "locationWork": row.location_work,
        "statusClock": row.status_clock,
        "notes": row.notes,
        "adminCode": row.admin_code,
        "adminName": row.admin_name,
        "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
    }


# ── Admin Work Locations ───────────────────────────────────────────────────────
# Manage per-user DAILY clock-in work location (auth_users.work_lat/lng/name/radius).
# Used by ClockApp.jsx geofence enforcement for non-PER_SITE roles.
# Supports single edit and bulk group assignment.

class WorkLocationBody(BaseModel):
    work_lat: float | None = None
    work_lng: float | None = None
    work_location_name: str | None = None
    allowed_radius_m: int | None = None


class WorkLocationBulkBody(BaseModel):
    employee_codes: list[str]
    work_lat: float | None = None
    work_lng: float | None = None
    work_location_name: str | None = None
    allowed_radius_m: int | None = None


@router.get("/monitor/work-locations")
async def monitor_work_locations_list(
    team: str = "ALL",
    payload: dict = Depends(require_manual_check_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all auth users with their work_lat/lng/radius/name + matching employee info."""
    rows = (await db.execute(
        select(AuthUser, Employee)
        .join(Employee, Employee.employee_code == AuthUser.employee_code, isouter=True)
        .where(AuthUser.is_active == True)  # noqa: E712
        .order_by(AuthUser.employee_code)
    )).all()
    out = []
    for u, emp in rows:
        proj_team = _team_of(emp) if emp else (u.team or "")
        if not _team_matches(proj_team, team):
            continue
        name = (emp.full_name if emp else None) or f"{u.first_name} {u.last_name}".strip() or u.employee_code
        out.append({
            "employeeCode": u.employee_code,
            "name": name,
            "projectTeam": proj_team,
            "clockType": u.clock_type,
            "role": u.role,
            "positionCode": u.position_code,
            "position": (emp.position if emp else None) or u.position_name or "",
            "contractType": (emp.contract_type if emp else None) or "",
            "workLat": u.work_lat,
            "workLng": u.work_lng,
            "workLocationName": u.work_location_name,
            "allowedRadiusM": u.allowed_radius_m,
            "hasLocation": u.work_lat is not None and u.work_lng is not None,
            "updatedAt": u.updated_at.isoformat() if u.updated_at else None,
        })
    return {"ok": True, "users": out, "count": len(out)}


@router.patch("/monitor/work-locations/{employee_code}")
async def monitor_work_location_update(
    employee_code: str,
    body: WorkLocationBody,
    payload: dict = Depends(require_manual_check_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update one user's work location. Pass null to clear lat/lng/name."""
    user = (await db.execute(
        select(AuthUser).where(AuthUser.employee_code == employee_code)
    )).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.work_lat = body.work_lat
    user.work_lng = body.work_lng
    user.work_location_name = (body.work_location_name or "").strip() or None
    if body.allowed_radius_m is not None:
        user.allowed_radius_m = max(0, int(body.allowed_radius_m))
    await db.commit()
    await db.refresh(user)
    return {
        "ok": True,
        "user": {
            "employeeCode": user.employee_code,
            "workLat": user.work_lat,
            "workLng": user.work_lng,
            "workLocationName": user.work_location_name,
            "allowedRadiusM": user.allowed_radius_m,
        },
    }


@router.post("/monitor/work-locations/bulk")
async def monitor_work_location_bulk(
    body: WorkLocationBulkBody,
    payload: dict = Depends(require_manual_check_admin),
    db: AsyncSession = Depends(get_db),
):
    """Apply the same work location to a group of employees. Pass an empty list to no-op.
    Pass null lat/lng to clear (e.g. revoke an assignment for a group)."""
    codes = [c.strip() for c in (body.employee_codes or []) if c and c.strip()]
    if not codes:
        return {"ok": True, "updated": 0, "skipped": 0, "missing": []}

    users = (await db.execute(
        select(AuthUser).where(AuthUser.employee_code.in_(codes))
    )).scalars().all()
    found_codes = {u.employee_code for u in users}
    missing = [c for c in codes if c not in found_codes]

    location_name = (body.work_location_name or "").strip() or None
    radius = max(0, int(body.allowed_radius_m)) if body.allowed_radius_m is not None else None

    updated = 0
    for user in users:
        user.work_lat = body.work_lat
        user.work_lng = body.work_lng
        user.work_location_name = location_name
        if radius is not None:
            user.allowed_radius_m = radius
        updated += 1

    await db.commit()
    return {
        "ok": True,
        "updated": updated,
        "skipped": len(codes) - updated,
        "missing": missing,
    }


@router.get("/monitor/admin-attention")
async def monitor_admin_attention(
    team: str = "ALL",
    date_iso: str | None = None,
    payload: dict = Depends(require_monitor_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin daily attention list (defaults to today):
    - notClockedInToday: active employees with no clock-in on the target date
    - incompleteYesterday: previous day's sessions missing clock-out and/or GPS
    """
    today = _parse_iso_date(date_iso) or datetime.now(TZ_BKK).date()
    yesterday = today - timedelta(days=1)

    employees = (
        await db.execute(select(Employee).where(Employee.status == "ACTIVE").order_by(Employee.full_name))
    ).scalars().all()

    today_sessions = (
        await db.execute(
            select(ClockSession).where(
                ClockSession.work_date == today,
                ClockSession.clock_in_at.isnot(None),
            )
        )
    ).scalars().all()
    clocked_in_codes = {s.employee_code for s in today_sessions}

    not_clocked_in = []
    for emp in employees:
        if not _team_matches(_team_of(emp), team):
            continue
        if emp.employee_code in clocked_in_codes:
            continue
        not_clocked_in.append({
            "employeeCode": emp.employee_code,
            "name": emp.full_name or emp.employee_code,
            "project": _team_of(emp) or "",
            "position": emp.project_role or emp.position or "",
            "email": emp.email or "",
        })

    y_stmt = (
        select(ClockSession, Employee)
        .join(Employee, Employee.employee_code == ClockSession.employee_code, isouter=True)
        .where(ClockSession.work_date == yesterday)
        .order_by(ClockSession.clock_in_at)
    )
    y_rows = (await db.execute(y_stmt)).all()

    incomplete_yesterday = []
    for session, emp in y_rows:
        if not _team_matches(_team_of(emp), team):
            continue
        issues = []
        if not session.clock_in_at:
            issues.append("No clock-in")
        if not session.clock_out_at:
            issues.append("No clock-out")
        if session.lat_in is None or session.lng_in is None:
            issues.append("No GPS")
        if not issues:
            continue
        name = (emp.full_name if emp else None) or session.employee_code
        incomplete_yesterday.append({
            "sessionId": session.id,
            "employeeCode": session.employee_code,
            "name": name,
            "project": _team_of(emp) or "",
            "position": (emp.project_role or emp.position or "") if emp else "",
            "clockIn":  session.clock_in_at.astimezone(TZ_BKK).strftime("%H:%M:%S") if session.clock_in_at else "",
            "clockOut": session.clock_out_at.astimezone(TZ_BKK).strftime("%H:%M:%S") if session.clock_out_at else "",
            "hasGPS": session.lat_in is not None and session.lng_in is not None,
            "site": session.site_name or session.site_code or "",
            "issues": issues,
        })

    incomplete_yesterday.sort(key=lambda r: (r["project"], r["name"]))
    not_clocked_in.sort(key=lambda r: (r["project"], r["name"]))

    return {
        "ok": True,
        "meta": {
            "today": today.isoformat(),
            "yesterday": yesterday.isoformat(),
            "team": team,
            "activeHeadcount": sum(1 for e in employees if _team_matches(_team_of(e), team)),
        },
        "notClockedInToday": not_clocked_in,
        "incompleteYesterday": incomplete_yesterday,
    }


# ── Admin: auto-close stuck sessions ──────────────────────────────────────────
# Manual trigger for the nightly autoclose job. Also runs automatically at 01:00
# BKK via app.services.clock_autoclose.nightly_autoclose_loop (registered in
# app.main on startup). Sessions are closed at work_date + 18:00 BKK with
# outcome='AUTO_CLOSE' so they're identifiable in reports.
_AUTOCLOSE_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}


@router.post("/monitor/auto-close-stuck")
async def monitor_auto_close_stuck(payload: dict = Depends(get_current_user)):
    """Close every ACTIVE session whose work_date < today (BKK).
    Idempotent: re-running closes only newly-stuck sessions.
    """
    if payload.get("role") not in _AUTOCLOSE_ROLES:
        raise HTTPException(status_code=403, detail="Not allowed")
    from app.services.clock_autoclose import auto_close_stuck_sessions
    result = await auto_close_stuck_sessions()
    return {"ok": True, **result}
