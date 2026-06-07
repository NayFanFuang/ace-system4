import re
import uuid
from datetime import date as date_cls
from datetime import timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import SUPER_ADMIN_ROLES, get_current_user
from app.models.employee import Employee
from app.models.meeting_room import MeetingRoom, RoomBooking
from app.services.calendar_invite import booking_invite_email, build_booking_ics
from app.services.email_service import from_address, queue_and_send_email

router = APIRouter(prefix="/api", tags=["MeetingRoom"])

# Roles allowed to manage the room catalog (create/edit/delete rooms).
ROOM_ADMIN_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")

ROOM_IMG_DIR = Path("/app/photos/meeting_rooms")
ROOM_IMG_DIR.mkdir(parents=True, exist_ok=True)


def _emp(payload: dict) -> tuple[str, str | None]:
    code = payload.get("employee_code") or payload.get("sub")
    if not code:
        raise HTTPException(status_code=401, detail="Missing employee context")
    return code, payload.get("name") or payload.get("full_name")


def _is_admin(payload: dict) -> bool:
    return payload.get("role") in ROOM_ADMIN_ROLES


def _validate_time(label: str, value: str) -> str:
    if not _TIME_RE.match(value or ""):
        raise HTTPException(status_code=400, detail=f"{label} must be HH:MM (24h)")
    return value


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class RoomIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str | None = Field(default=None, max_length=200)
    capacity: int | None = Field(default=None, ge=0, le=10000)
    color: str | None = Field(default=None, max_length=20)
    image_url: str | None = Field(default=None, max_length=300)
    is_active: bool = True


class BookingIn(BaseModel):
    room_id: int
    booking_date: date_cls
    start_time: str
    end_time: str
    title: str = Field(min_length=1, max_length=200)
    attendees: int | None = Field(default=None, ge=0, le=10000)
    # Employee codes linked as attendees; names are resolved server-side.
    attendee_codes: list[str] | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    send_invite: bool = True
    # Recurrence: create the same booking on N consecutive days/weeks/months.
    repeat: str = Field(default="none", pattern="^(none|daily|weekly|monthly)$")
    repeat_count: int = Field(default=1, ge=1, le=26)


class BookingPatchIn(BaseModel):
    room_id: int | None = None
    booking_date: date_cls | None = None
    start_time: str | None = None
    end_time: str | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    attendee_codes: list[str] | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    send_invite: bool = True


def _room_dict(r: MeetingRoom) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "location": r.location,
        "capacity": r.capacity,
        "color": r.color,
        "image_url": r.image_url,
        "is_active": r.is_active,
    }


def _add_months(d: date_cls, n: int) -> date_cls:
    """Add n months, clamping the day to the last valid day of the target month."""
    import calendar

    month_index = d.month - 1 + n
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date_cls(year, month, day)


def _recurrence_dates(start: date_cls, repeat: str, count: int) -> list[date_cls]:
    """Expand a recurrence rule into concrete dates (first occurrence = start)."""
    count = max(1, min(count, 26))
    if repeat == "none" or count == 1:
        return [start]
    out = [start]
    for i in range(1, count):
        if repeat == "daily":
            out.append(start + timedelta(days=i))
        elif repeat == "weekly":
            out.append(start + timedelta(weeks=i))
        elif repeat == "monthly":
            out.append(_add_months(start, i))
        else:
            break
    return out


def _norm_title(title: str | None) -> str:
    """Normalize a meeting title for grouping (trim, collapse spaces, casefold)."""
    return re.sub(r"\s+", " ", (title or "").strip()).casefold()


async def _occurrence_map(db: AsyncSession) -> dict[int, tuple[int, int]]:
    """Map booking_id → (occurrence_no, series_total) by same-title chronological rank.

    Counts ACTIVE bookings only, ordered by (date, start, id), so the first-ever
    meeting of a topic is ครั้งที่ 1.
    """
    rows = (
        await db.execute(
            select(RoomBooking)
            .where(RoomBooking.status == "ACTIVE")
            .order_by(RoomBooking.booking_date, RoomBooking.start_time, RoomBooking.id)
        )
    ).scalars().all()
    groups: dict[str, list[RoomBooking]] = {}
    for b in rows:
        groups.setdefault(_norm_title(b.title), []).append(b)
    out: dict[int, tuple[int, int]] = {}
    for lst in groups.values():
        total = len(lst)
        for i, b in enumerate(lst, start=1):
            out[b.id] = (i, total)
    return out


def _booking_dict(b: RoomBooking) -> dict:
    return {
        "id": b.id,
        "room_id": b.room_id,
        "booking_date": b.booking_date.isoformat(),
        "start_time": b.start_time,
        "end_time": b.end_time,
        "title": b.title,
        "booked_by": b.booked_by,
        "booked_by_name": b.booked_by_name,
        "attendees": b.attendees,
        "attendee_list": b.attendee_list or [],
        "notes": b.notes,
        "status": b.status,
    }


# ---------------------------------------------------------------------------
# Rooms
# ---------------------------------------------------------------------------
@router.get("/meeting-rooms")
async def list_rooms(
    include_inactive: bool = Query(False),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MeetingRoom).order_by(MeetingRoom.name)
    if not include_inactive:
        stmt = stmt.where(MeetingRoom.is_active.is_(True))
    rows = (await db.execute(stmt)).scalars().all()
    return {"rooms": [_room_dict(r) for r in rows], "can_manage": _is_admin(payload)}


@router.post("/meeting-rooms")
async def create_room(
    body: RoomIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _is_admin(payload):
        raise HTTPException(status_code=403, detail="Not allowed to manage rooms")
    name = body.name.strip()
    exists = (await db.execute(select(MeetingRoom).where(MeetingRoom.name == name))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Room name already exists")
    room = MeetingRoom(
        name=name,
        location=(body.location or "").strip() or None,
        capacity=body.capacity,
        color=(body.color or "").strip() or None,
        image_url=(body.image_url or "").strip() or None,
        is_active=body.is_active,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)


@router.patch("/meeting-rooms/{room_id}")
async def update_room(
    room_id: int,
    body: RoomIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _is_admin(payload):
        raise HTTPException(status_code=403, detail="Not allowed to manage rooms")
    room = (await db.execute(select(MeetingRoom).where(MeetingRoom.id == room_id))).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.name = body.name.strip()
    room.location = (body.location or "").strip() or None
    room.capacity = body.capacity
    room.color = (body.color or "").strip() or None
    room.image_url = (body.image_url or "").strip() or None
    room.is_active = body.is_active
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)


@router.post("/meeting-rooms/{room_id}/image")
async def upload_room_image(
    room_id: int,
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _is_admin(payload):
        raise HTTPException(status_code=403, detail="Not allowed to manage rooms")
    room = (await db.execute(select(MeetingRoom).where(MeetingRoom.id == room_id))).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()
    safe_name = f"room_{room_id}_{uuid.uuid4().hex[:8]}.{ext}"
    (ROOM_IMG_DIR / safe_name).write_bytes(content)
    file_url = f"/photos/meeting_rooms/{safe_name}"
    room.image_url = file_url
    await db.commit()
    return {"image_url": file_url}


@router.delete("/meeting-rooms/{room_id}")
async def delete_room(
    room_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _is_admin(payload):
        raise HTTPException(status_code=403, detail="Not allowed to manage rooms")
    room = (await db.execute(select(MeetingRoom).where(MeetingRoom.id == room_id))).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    # Soft delete — preserve historical bookings.
    room.is_active = False
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Attendee directory — lightweight employee lookup for the booking picker.
# Available to ANY authenticated user (the full /employees list is gated to
# project/HR roles), exposing only code + name + department + position.
# ---------------------------------------------------------------------------
@router.get("/meeting-attendees")
async def list_attendees(
    search: str = Query("", max_length=120),
    limit: int = Query(20, ge=1, le=100),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _emp(payload)  # require a valid employee context
    stmt = select(Employee).where(Employee.status == "ACTIVE")
    q = search.strip()
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Employee.full_name.ilike(like), Employee.employee_code.ilike(like))
        )
    rows = (await db.execute(stmt.order_by(Employee.full_name).limit(limit))).scalars().all()
    return {
        "employees": [
            {
                "code": e.employee_code,
                "name": e.full_name,
                "department": e.department,
                "position": e.position,
            }
            for e in rows
        ]
    }


async def _resolve_attendees(db: AsyncSession, codes: list[str] | None) -> list[dict]:
    """Map employee_codes → [{code, name}], preserving input order, skipping unknowns."""
    if not codes:
        return []
    # De-dupe while keeping order.
    seen: set[str] = set()
    ordered = [c for c in codes if c and not (c in seen or seen.add(c))]
    if not ordered:
        return []
    rows = (
        await db.execute(select(Employee).where(Employee.employee_code.in_(ordered)))
    ).scalars().all()
    by_code = {e.employee_code: e.full_name for e in rows}
    return [{"code": c, "name": by_code[c]} for c in ordered if c in by_code]


async def _invite_parties(
    db: AsyncSession, organizer_code: str, organizer_name: str | None, attendee_codes: list[str]
) -> tuple[dict, list[dict]]:
    """Resolve organizer + attendee {name, email} for the calendar invite."""
    codes = list({c for c in ([organizer_code] + list(attendee_codes or [])) if c})
    rows = (
        (await db.execute(select(Employee).where(Employee.employee_code.in_(codes)))).scalars().all()
        if codes
        else []
    )
    by_code = {e.employee_code: e for e in rows}
    org = by_code.get(organizer_code)
    organizer = {
        "name": (org.full_name if org else organizer_name) or organizer_code,
        "email": ((org.email if org else "") or "").strip(),
    }
    attendees: list[dict] = []
    for c in attendee_codes or []:
        e = by_code.get(c)
        if e and (e.email or "").strip():
            attendees.append({"name": e.full_name, "email": e.email.strip()})
    return organizer, attendees


def _collect_emails(organizer: dict, attendees: list[dict]) -> list[str]:
    """Organizer first, then attendees; de-duped (case-insensitive), blanks dropped."""
    ordered: list[str] = []
    seen: set[str] = set()
    for em in [organizer.get("email", "")] + [a.get("email", "") for a in attendees]:
        key = (em or "").lower()
        if em and key not in seen:
            seen.add(key)
            ordered.append(em)
    return ordered


async def _dispatch_invite(
    db: AsyncSession,
    booking: RoomBooking,
    room: MeetingRoom | None,
    organizer: dict,
    ics_attendees: list[dict],
    recipients: list[str],
    method: str,
    sequence: int,
) -> None:
    """Build the .ics + email and queue it to the given recipients (recipients[0]=To, rest=Cc)."""
    if not recipients:
        return
    room_name = room.name if room else f"Room #{booking.room_id}"
    room_location = room.location if room else None
    cancelled = method.upper() == "CANCEL"

    ics = build_booking_ics(
        booking_id=booking.id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        title=booking.title,
        room_name=room_name,
        room_location=room_location,
        organizer_name=organizer["name"],
        organizer_email=organizer["email"] or recipients[0],
        attendees=ics_attendees,
        notes=booking.notes,
        method=method.upper(),
        sequence=sequence,
    )
    subject, text, html = booking_invite_email(
        title=booking.title,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        room_name=room_name,
        room_location=room_location,
        organizer_name=organizer["name"],
        attendees=ics_attendees,
        notes=booking.notes,
        cancelled=cancelled,
    )
    await queue_and_send_email(
        db,
        recipient=recipients[0],
        subject=subject,
        body_text=text,
        body_html=html,
        cc=recipients[1:],
        ics_content=ics,
        ics_method=method.upper(),
        ics_filename="invite.ics",
    )


def _organizer_and_recipients(booker: dict, attendees: list[dict]) -> tuple[dict, list[dict]]:
    """Organizer = the system sending mailbox (so it matches the email From, which
    Exchange/Outlook require to let recipients Accept). The booker and linked
    attendees all become ATTENDEEs/recipients — anyone who isn't the system
    mailbox can then respond to the invite.
    """
    sys_email = (from_address() or "").strip()
    organizer = {"name": booker.get("name") or "ACE System", "email": sys_email}
    ics_attendees: list[dict] = []
    seen: set[str] = set()
    for a in [booker, *attendees]:
        e = (a.get("email") or "").strip()
        if not e or e.lower() == sys_email.lower() or e.lower() in seen:
            continue
        seen.add(e.lower())
        ics_attendees.append({"name": a.get("name") or e, "email": e})
    return organizer, ics_attendees


async def _send_booking_invite(
    db: AsyncSession,
    booking: RoomBooking,
    room: MeetingRoom | None,
    organizer_code: str,
    organizer_name: str | None,
    method: str,
) -> None:
    """Best-effort REQUEST (create) / CANCEL (cancel) to booker + all attendees.

    Never raises — a booking action must not fail because email/calendar failed.
    Uses booking.invite_sequence (caller bumps it before cancel/edit).
    """
    try:
        codes = [a.get("code") for a in (booking.attendee_list or []) if a.get("code")]
        booker, attendees = await _invite_parties(db, organizer_code, organizer_name, codes)
        organizer, ics_attendees = _organizer_and_recipients(booker, attendees)
        recipients = [a["email"] for a in ics_attendees]
        if not recipients:
            return
        await _dispatch_invite(db, booking, room, organizer, ics_attendees, recipients, method, booking.invite_sequence or 0)
        await db.commit()
    except Exception:
        await db.rollback()


async def _send_update_invite(
    db: AsyncSession,
    booking: RoomBooking,
    room: MeetingRoom | None,
    organizer_code: str,
    organizer_name: str | None,
    old_codes: list[str],
) -> None:
    """Best-effort: REQUEST (update) to current parties + CANCEL to dropped attendees."""
    try:
        new_codes = [a.get("code") for a in (booking.attendee_list or []) if a.get("code")]
        booker, new_attendees = await _invite_parties(db, organizer_code, organizer_name, new_codes)
        _, old_attendees = await _invite_parties(db, organizer_code, organizer_name, old_codes)

        organizer, new_ics = _organizer_and_recipients(booker, new_attendees)
        _, old_ics = _organizer_and_recipients(booker, old_attendees)

        seq = booking.invite_sequence or 0
        new_emails = {a["email"].lower() for a in new_ics}
        removed = [a["email"] for a in old_ics if a["email"].lower() not in new_emails]

        recipients = [a["email"] for a in new_ics]
        if recipients:
            await _dispatch_invite(db, booking, room, organizer, new_ics, recipients, "REQUEST", seq)
        if removed:
            await _dispatch_invite(db, booking, room, organizer, new_ics, removed, "CANCEL", seq)
        await db.commit()
    except Exception:
        await db.rollback()


# ---------------------------------------------------------------------------
# Public kiosk endpoints (NO AUTH) — for door-mounted room display screens.
# Exposes only minimal, non-sensitive fields (room + today's schedule).
# ---------------------------------------------------------------------------
@router.get("/public/rooms")
async def public_rooms(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(MeetingRoom).where(MeetingRoom.is_active.is_(True)).order_by(MeetingRoom.name)
        )
    ).scalars().all()
    return {"rooms": [_room_dict(r) for r in rows]}


@router.get("/public/room-display")
async def public_room_display(
    room_id: int = Query(...),
    date: date_cls | None = Query(None, description="Day to show; defaults to server today"),
    db: AsyncSession = Depends(get_db),
):
    room = (
        await db.execute(
            select(MeetingRoom).where(
                and_(MeetingRoom.id == room_id, MeetingRoom.is_active.is_(True))
            )
        )
    ).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    day = date or date_cls.today()
    rows = (
        await db.execute(
            select(RoomBooking)
            .where(
                and_(
                    RoomBooking.room_id == room_id,
                    RoomBooking.booking_date == day,
                    RoomBooking.status == "ACTIVE",
                )
            )
            .order_by(RoomBooking.start_time)
        )
    ).scalars().all()
    return {
        "room": _room_dict(room),
        "date": day.isoformat(),
        "bookings": [
            {
                "start_time": b.start_time,
                "end_time": b.end_time,
                "title": b.title,
                "booked_by_name": b.booked_by_name,
            }
            for b in rows
        ],
    }


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------
@router.get("/room-bookings")
async def list_bookings(
    date: date_cls = Query(..., description="Day to list (YYYY-MM-DD)"),
    room_id: int | None = Query(None),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(RoomBooking)
        .where(and_(RoomBooking.booking_date == date, RoomBooking.status == "ACTIVE"))
        .order_by(RoomBooking.start_time)
    )
    if room_id is not None:
        stmt = stmt.where(RoomBooking.room_id == room_id)
    rows = (await db.execute(stmt)).scalars().all()
    me, _ = _emp(payload)
    occ = await _occurrence_map(db)
    return {
        "bookings": [
            {
                **_booking_dict(b),
                "is_mine": b.booked_by == me,
                "occurrence": occ.get(b.id, (None, None))[0],
                "series_total": occ.get(b.id, (None, None))[1],
            }
            for b in rows
        ],
        "is_admin": _is_admin(payload),
    }


@router.get("/room-bookings/range")
async def list_bookings_range(
    date_from: date_cls = Query(..., description="Range start (YYYY-MM-DD)"),
    date_to: date_cls = Query(..., description="Range end inclusive (YYYY-MM-DD)"),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ACTIVE bookings across a date range (e.g. a week) for the week/multi-day view."""
    me, _ = _emp(payload)
    if (date_to - date_from).days > 60:
        raise HTTPException(status_code=400, detail="Range too large (max 60 days)")
    rows = (
        await db.execute(
            select(RoomBooking)
            .where(
                and_(
                    RoomBooking.booking_date >= date_from,
                    RoomBooking.booking_date <= date_to,
                    RoomBooking.status == "ACTIVE",
                )
            )
            .order_by(RoomBooking.booking_date, RoomBooking.start_time)
        )
    ).scalars().all()
    occ = await _occurrence_map(db)
    return {
        "bookings": [
            {
                **_booking_dict(b),
                "is_mine": b.booked_by == me,
                "occurrence": occ.get(b.id, (None, None))[0],
                "series_total": occ.get(b.id, (None, None))[1],
            }
            for b in rows
        ],
    }


@router.get("/room-bookings/summary")
async def bookings_summary(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Group ACTIVE bookings by topic → how many times met + first/last date."""
    _emp(payload)
    rows = (
        await db.execute(
            select(RoomBooking)
            .where(RoomBooking.status == "ACTIVE")
            .order_by(RoomBooking.booking_date, RoomBooking.start_time, RoomBooking.id)
        )
    ).scalars().all()
    groups: dict[str, dict] = {}
    for b in rows:
        g = groups.setdefault(
            _norm_title(b.title),
            {"title": b.title, "count": 0, "first_date": None, "last_date": None},
        )
        g["count"] += 1
        g["title"] = b.title  # rows are ascending → keep most-recent casing
        d = b.booking_date.isoformat()
        g["first_date"] = g["first_date"] or d
        g["last_date"] = d
        # Latest occurrence's details → used by "Book again" to reuse topic + people.
        g["last_room_id"] = b.room_id
        g["last_start"] = b.start_time
        g["last_end"] = b.end_time
        g["last_attendees"] = b.attendee_list or []
        g["last_notes"] = b.notes
    topics = sorted(groups.values(), key=lambda x: (x["last_date"] or "", x["count"]), reverse=True)
    for t in topics:
        t["next_occurrence"] = t["count"] + 1
    return {"topics": topics}


@router.get("/room-bookings/series")
async def bookings_series(
    title: str = Query("", max_length=200),
    exclude_id: int | None = Query(None),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """How many times a topic has been booked → for the 'ครั้งที่ N' preview."""
    _emp(payload)
    norm = _norm_title(title)
    if not norm:
        return {"count": 0, "next": 1, "last_date": None}
    rows = (
        await db.execute(
            select(RoomBooking)
            .where(RoomBooking.status == "ACTIVE")
            .order_by(RoomBooking.booking_date, RoomBooking.start_time, RoomBooking.id)
        )
    ).scalars().all()
    matched = [b for b in rows if _norm_title(b.title) == norm and b.id != exclude_id]
    last = matched[-1].booking_date.isoformat() if matched else None
    return {"count": len(matched), "next": len(matched) + 1, "last_date": last}


@router.post("/room-bookings")
async def create_booking(
    body: BookingIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, name = _emp(payload)
    start = _validate_time("start_time", body.start_time)
    end = _validate_time("end_time", body.end_time)
    if start >= end:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    room = (
        await db.execute(
            select(MeetingRoom).where(
                and_(MeetingRoom.id == body.room_id, MeetingRoom.is_active.is_(True))
            )
        )
    ).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or inactive")

    # Expand recurrence into concrete dates (first = the chosen date).
    dates = _recurrence_dates(body.booking_date, body.repeat, body.repeat_count)

    # Conflict guard for EVERY occurrence — abort the whole series if any clashes.
    for d in dates:
        overlap = (
            await db.execute(
                select(RoomBooking).where(
                    and_(
                        RoomBooking.room_id == body.room_id,
                        RoomBooking.booking_date == d,
                        RoomBooking.status == "ACTIVE",
                        RoomBooking.start_time < end,
                        RoomBooking.end_time > start,
                    )
                )
            )
        ).scalars().first()
        if overlap:
            on = f" on {d.isoformat()}" if len(dates) > 1 else ""
            raise HTTPException(
                status_code=409,
                detail=f"Time conflicts with an existing booking{on}: {overlap.title} ({overlap.start_time}–{overlap.end_time})",
            )

    attendee_list = await _resolve_attendees(db, body.attendee_codes)
    # Derive the count from linked attendees when present; otherwise use the
    # manually-entered number.
    attendees_count = len(attendee_list) if attendee_list else body.attendees

    bookings: list[RoomBooking] = []
    for d in dates:
        b = RoomBooking(
            room_id=body.room_id,
            booking_date=d,
            start_time=start,
            end_time=end,
            title=body.title.strip(),
            booked_by=code,
            booked_by_name=name,
            attendees=attendees_count,
            attendee_list=attendee_list or None,
            notes=(body.notes or "").strip() or None,
            status="ACTIVE",
        )
        db.add(b)
        bookings.append(b)
    try:
        await db.commit()
    except IntegrityError:
        # DB exclusion constraint caught a concurrent overlap the pre-check missed.
        await db.rollback()
        raise HTTPException(status_code=409, detail="Time was just booked by someone else. Please pick another slot.")
    for b in bookings:
        await db.refresh(b)

    # Email an Outlook/Google calendar invite for each occurrence.
    if body.send_invite:
        for b in bookings:
            await _send_booking_invite(db, b, room, code, name, method="REQUEST")

    return {**_booking_dict(bookings[0]), "created_count": len(bookings)}


@router.patch("/room-bookings/{booking_id}")
async def update_booking(
    booking_id: int,
    body: BookingPatchIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, name = _emp(payload)
    booking = (
        await db.execute(select(RoomBooking).where(RoomBooking.id == booking_id))
    ).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booked_by != code and not _is_admin(payload):
        raise HTTPException(status_code=403, detail="แก้ไขได้เฉพาะการจองของตัวเอง")
    if booking.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="การจองนี้ถูกยกเลิกแล้ว")

    # Resolve the post-edit values (fall back to current values when omitted).
    new_room_id = body.room_id if body.room_id is not None else booking.room_id
    new_date = body.booking_date or booking.booking_date
    start = _validate_time("start_time", body.start_time) if body.start_time else booking.start_time
    end = _validate_time("end_time", body.end_time) if body.end_time else booking.end_time
    if start >= end:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    room = (
        await db.execute(
            select(MeetingRoom).where(
                and_(MeetingRoom.id == new_room_id, MeetingRoom.is_active.is_(True))
            )
        )
    ).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or inactive")

    # Conflict guard — same room/date overlap, excluding this booking itself.
    overlap = (
        await db.execute(
            select(RoomBooking).where(
                and_(
                    RoomBooking.room_id == new_room_id,
                    RoomBooking.booking_date == new_date,
                    RoomBooking.status == "ACTIVE",
                    RoomBooking.id != booking.id,
                    RoomBooking.start_time < end,
                    RoomBooking.end_time > start,
                )
            )
        )
    ).scalars().first()
    if overlap:
        raise HTTPException(
            status_code=409,
            detail=f"เวลาชนกับการจองที่มีอยู่: {overlap.title} ({overlap.start_time}–{overlap.end_time})",
        )

    old_codes = [a.get("code") for a in (booking.attendee_list or []) if a.get("code")]

    booking.room_id = new_room_id
    booking.booking_date = new_date
    booking.start_time = start
    booking.end_time = end
    if body.title is not None:
        booking.title = body.title.strip()
    if body.attendee_codes is not None:
        attendee_list = await _resolve_attendees(db, body.attendee_codes)
        booking.attendee_list = attendee_list or None
        booking.attendees = len(attendee_list) if attendee_list else None
    if body.notes is not None:
        booking.notes = body.notes.strip() or None
    booking.invite_sequence = (booking.invite_sequence or 0) + 1
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Time was just booked by someone else. Please pick another slot.")
    await db.refresh(booking)

    # Send an updated invite (and retract to dropped attendees).
    if body.send_invite:
        await _send_update_invite(db, booking, room, code, name, old_codes)
    return _booking_dict(booking)


@router.delete("/room-bookings/{booking_id}")
async def cancel_booking(
    booking_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, _ = _emp(payload)
    booking = (
        await db.execute(select(RoomBooking).where(RoomBooking.id == booking_id))
    ).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.booked_by != code and not _is_admin(payload):
        raise HTTPException(status_code=403, detail="ยกเลิกได้เฉพาะการจองของตัวเอง")
    booking.status = "CANCELLED"
    booking.invite_sequence = (booking.invite_sequence or 0) + 1
    await db.commit()

    # Notify organizer + attendees so the event drops off their calendars.
    room = (
        await db.execute(select(MeetingRoom).where(MeetingRoom.id == booking.room_id))
    ).scalar_one_or_none()
    await _send_booking_invite(db, booking, room, booking.booked_by, booking.booked_by_name, method="CANCEL")
    return {"ok": True}


async def seed_meeting_rooms(db: AsyncSession) -> None:
    """Seed a couple of default rooms on first boot (idempotent)."""
    existing = (await db.execute(select(MeetingRoom.id))).first()
    if existing:
        return
    defaults = [
        MeetingRoom(name="Meeting Room 1", location="ชั้น 1", capacity=8, color="#2563eb"),
        MeetingRoom(name="Meeting Room 2", location="ชั้น 2", capacity=12, color="#16a34a"),
        MeetingRoom(name="ห้องประชุมใหญ่", location="ชั้น 3", capacity=30, color="#9333ea"),
    ]
    db.add_all(defaults)
    await db.commit()
