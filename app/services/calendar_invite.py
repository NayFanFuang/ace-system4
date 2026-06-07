"""iCalendar (.ics) meeting-invite generation for meeting-room bookings.

We attach a `text/calendar` part (METHOD:REQUEST / CANCEL) to the notification
email so Outlook / Gmail / Apple Calendar treat it as a real meeting invite:
the recipient gets Accept/Decline and the event is added to their calendar.

Times are stored as "HH:MM" against a calendar date in Asia/Bangkok (UTC+7,
no DST). We emit DTSTART/DTEND as LOCAL time tagged with TZID=Asia/Bangkok and
ship a matching VTIMEZONE block — this is what Outlook needs to render the
event at the right slot in its calendar preview (plain UTC "…Z" times made the
preview pane scroll to midnight instead of the meeting time).
"""
from datetime import date as date_cls
from datetime import datetime, timezone

PRODID = "-//AirConnect Engineering//ACE System Meeting Room//EN"
TZID = "Asia/Bangkok"

# Fixed +07:00 offset (Thailand has no DST). A self-contained VTIMEZONE so every
# client resolves the local times identically.
VTIMEZONE = "\r\n".join([
    "BEGIN:VTIMEZONE",
    f"TZID:{TZID}",
    "X-LIC-LOCATION:Asia/Bangkok",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:+07",
    "END:STANDARD",
    "END:VTIMEZONE",
])


def booking_uid(booking_id: int) -> str:
    """Stable per-booking UID so updates / cancellations reference the same event."""
    return f"ace-room-booking-{booking_id}@ace-system"


def _local_stamp(d: date_cls, hhmm: str) -> str:
    """Local wall-clock stamp (no Z), paired with TZID=Asia/Bangkok."""
    h, m = (int(x) for x in hhmm.split(":"))
    return datetime(d.year, d.month, d.day, h, m).strftime("%Y%m%dT%H%M%S")


def _now_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _fold(line: str) -> str:
    """Fold a content line to ≤75 octets (RFC 5545), never splitting a UTF-8 char.

    Continuation lines start with a single space; they carry ≤74 octets so the
    space keeps the total ≤75.
    """
    if len(line.encode("utf-8")) <= 75:
        return line
    chunks: list[str] = []
    cur = ""
    cur_bytes = 0
    limit = 75
    for ch in line:
        cb = len(ch.encode("utf-8"))
        if cur_bytes + cb > limit:
            chunks.append(cur)
            cur, cur_bytes, limit = ch, cb, 74
        else:
            cur += ch
            cur_bytes += cb
    if cur:
        chunks.append(cur)
    return "\r\n ".join(chunks)


def _esc(text: str | None) -> str:
    """Escape per RFC 5545 (backslash, semicolon, comma, newline)."""
    if not text:
        return ""
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def build_booking_ics(
    *,
    booking_id: int,
    booking_date: date_cls,
    start_time: str,
    end_time: str,
    title: str,
    room_name: str,
    room_location: str | None,
    organizer_name: str | None,
    organizer_email: str,
    attendees: list[dict],          # [{"name", "email"}]
    notes: str | None = None,
    method: str = "REQUEST",        # "REQUEST" | "CANCEL"
    sequence: int = 0,
) -> str:
    """Return a complete VCALENDAR string for the booking."""
    cancelled = method == "CANCEL"
    location = room_name + (f" ({room_location})" if room_location else "")

    desc_parts = [f"Room: {room_name}"]
    if room_location:
        desc_parts.append(f"Location: {room_location}")
    if organizer_name:
        desc_parts.append(f"Organizer: {organizer_name}")
    if attendees:
        desc_parts.append("Attendees: " + ", ".join(a["name"] for a in attendees if a.get("name")))
    if notes:
        desc_parts.append(f"Notes: {notes}")
    description = "\\n".join(_esc(p) for p in desc_parts)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODID}",
        "CALSCALE:GREGORIAN",
        f"METHOD:{method}",
        VTIMEZONE,
        "BEGIN:VEVENT",
        f"UID:{booking_uid(booking_id)}",
        f"SEQUENCE:{sequence}",
        f"DTSTAMP:{_now_stamp()}",
        f"DTSTART;TZID={TZID}:{_local_stamp(booking_date, start_time)}",
        f"DTEND;TZID={TZID}:{_local_stamp(booking_date, end_time)}",
        f"SUMMARY:{_esc(title)}",
        f"LOCATION:{_esc(location)}",
        f"DESCRIPTION:{description}",
    ]

    org_cn = _esc(organizer_name or organizer_email)
    lines.append(f"ORGANIZER;CN={org_cn}:mailto:{organizer_email}")

    for a in attendees:
        email = (a.get("email") or "").strip()
        if not email:
            continue
        cn = _esc(a.get("name") or email)
        lines.append(
            f"ATTENDEE;CN={cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{email}"
        )

    lines.append("STATUS:CANCELLED" if cancelled else "STATUS:CONFIRMED")
    lines.append("TRANSP:OPAQUE")
    # Microsoft-specific hints so Outlook renders the slot as a Busy block in the
    # reading-pane calendar peek (without these the peek stays at midnight).
    busy = "FREE" if cancelled else "BUSY"
    lines.append(f"X-MICROSOFT-CDO-BUSYSTATUS:{busy}")
    lines.append(f"X-MICROSOFT-CDO-INTENDEDSTATUS:{busy}")
    lines.append("X-MICROSOFT-CDO-ALLDAYEVENT:FALSE")
    lines.append("X-MICROSOFT-CDO-IMPORTANCE:1")
    lines.append("X-MICROSOFT-DISALLOW-COUNTER:FALSE")
    lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")

    # Fold long lines to ≤75 octets per RFC 5545 (byte-safe so UTF-8 isn't split),
    # handling the multi-line VTIMEZONE block already embedded in `lines`.
    raw = "\r\n".join(lines)
    return "\r\n".join(_fold(line) for line in raw.split("\r\n")) + "\r\n"


def booking_invite_email(
    *,
    title: str,
    booking_date: date_cls,
    start_time: str,
    end_time: str,
    room_name: str,
    room_location: str | None,
    organizer_name: str | None,
    attendees: list[dict],
    notes: str | None = None,
    cancelled: bool = False,
) -> tuple[str, str, str]:
    """Return (subject, body_text, body_html) for the invite/cancellation email (English)."""
    try:
        date_full = booking_date.strftime("%A, %d %B %Y")   # Tuesday, 29 December 2026
        date_short = booking_date.strftime("%d %b %Y")        # 29 Dec 2026
    except Exception:
        date_full = date_short = str(booking_date)
    location = room_name + (f" · {room_location}" if room_location else "")
    time_range = f"{start_time} – {end_time}"
    names = ", ".join(a["name"] for a in attendees if a.get("name")) or "—"

    accent = "#dc2626" if cancelled else "#2447d8"
    eyebrow = "Meeting Cancelled" if cancelled else "Meeting Invitation"
    status_label = "Cancelled" if cancelled else "Confirmed"
    status_bg = "#fee2e2" if cancelled else "#dcfce7"
    status_fg = "#b91c1c" if cancelled else "#15803d"
    note = (
        "This meeting has been cancelled. Please remove it from your calendar."
        if cancelled
        else "This message includes a calendar file (.ics). In Outlook or Google "
        "Calendar you can Accept or Decline, and the event will be added to your "
        "calendar automatically."
    )

    subject = f"{'Meeting Cancelled' if cancelled else 'Meeting Invitation'}: {title} — {date_short} {start_time}-{end_time}"

    body_text = (
        f"{eyebrow.upper()}\n"
        f"{title}\n"
        f"Status: {status_label}\n\n"
        f"Date    : {date_full}\n"
        f"Time    : {time_range}\n"
        f"Room    : {location}\n"
        f"Organizer : {organizer_name or '—'}\n"
        f"Attendees : {names}\n"
        + (f"Notes   : {notes}\n" if notes else "")
        + f"\n{note}\n"
        + "\nACE System · AirConnect Engineering Co., Ltd."
    )

    detail_rows = [
        ("Room", location),
        ("Organizer", organizer_name or "—"),
        ("Attendees", names),
    ]
    if notes:
        detail_rows.append(("Notes", notes))
    rows = "".join(
        f"""<tr>
          <td style="padding:11px 18px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;vertical-align:top;border-top:1px solid #eef2f7">{label}</td>
          <td style="padding:11px 18px;color:#0f172a;font-size:14px;font-weight:600;border-top:1px solid #eef2f7">{value}</td>
        </tr>"""
        for label, value in detail_rows
    )

    body_html = f"""
    <div style="margin:0;padding:24px 12px;background:#eef2f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)">

        <!-- Header -->
        <div style="background-color:{accent};background-image:linear-gradient(135deg,{accent},#1d3bb8);padding:26px 30px">
          <div style="color:rgba(255,255,255,.78);font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">{eyebrow}</div>
          <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:8px;line-height:1.3">{title}</div>
          <span style="display:inline-block;margin-top:14px;background:{status_bg};color:{status_fg};font-size:11px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:4px 12px;border-radius:999px">{status_label}</span>
        </div>

        <!-- Date / time hero -->
        <div style="padding:24px 30px 6px">
          <div style="display:flex;align-items:baseline;gap:10px">
            <div style="font-size:20px;font-weight:800;color:#0f172a">{date_full}</div>
          </div>
          <div style="font-size:15px;font-weight:700;color:{accent};margin-top:4px">{time_range} <span style="color:#94a3b8;font-weight:600">(Asia/Bangkok)</span></div>
        </div>

        <!-- Details -->
        <div style="padding:14px 30px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #eef2f7;border-radius:10px;overflow:hidden">
            <tbody>{rows}</tbody>
          </table>
        </div>

        <!-- Note -->
        <div style="padding:18px 30px 26px">
          <div style="background:#f8fafc;border:1px solid #eef2f7;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.6;color:#475569">
            {note}
          </div>
        </div>

      </div>
      <div style="max-width:600px;margin:14px auto 0;text-align:center;color:#94a3b8;font-size:11px">
        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System
      </div>
    </div>
    """
    return subject, body_text, body_html
