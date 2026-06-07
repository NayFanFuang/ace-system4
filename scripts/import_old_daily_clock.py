"""Import legacy DAILY clock export (OldClockData_DAILY_.xlsx) into:
  - clock_sessions      (clock-in/out, clock_type=DAILY)
  - clock_manual_check  (Status Clock / Send to Line / Location Work flags)

Only rows whose person matches a real employee (by company email, personal
email, or full name) are imported. Unmatched people (Huawei subs / foreign
labour not in the employees table) are SKIPPED.

Idempotent:
  - sessions dedup by (employee_code, work_date, clock_in_at)
  - manual_check upsert by (employee_code, work_date)

Run inside backend container:
  python /app/scripts/import_old_daily_clock.py --dry-run /app/OldClockData_DAILY_.xlsx
  python /app/scripts/import_old_daily_clock.py           /app/OldClockData_DAILY_.xlsx
"""
from __future__ import annotations

import argparse
import asyncio
import re
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

import openpyxl
from sqlalchemy import select

sys.path.insert(0, "/app")
from app.database import SessionLocal
from app.models.clock import ClockManualCheck, ClockSession
from app.models.employee import Employee

TZ_BKK = timezone(timedelta(hours=7))


# ─── helpers ──────────────────────────────────────────────────────────────────

def norm_name(raw: str | None) -> str:
    s = re.sub(r"^(Mr\.|Ms\.|Mrs\.|Miss\.|Dr\.)\s*", "", (raw or "").strip(), flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", s).lower().strip()


def parse_latlong(s):
    if not s:
        return None, None
    try:
        a, b = str(s).split(",")
        return float(a.strip()), float(b.strip())
    except Exception:
        return None, None


def drive_direct_url(view_url):
    """https://drive.google.com/file/d/<id>/view → uc?export=download&id=<id>"""
    if not view_url:
        return None
    m = re.search(r"/d/([A-Za-z0-9_-]+)", str(view_url))
    if not m:
        return str(view_url)
    return f"https://drive.google.com/uc?export=download&id={m.group(1)}"


def as_time(v):
    if v is None:
        return None
    if isinstance(v, time):
        return v
    if isinstance(v, datetime):
        return v.time()
    # string "HH:MM:SS" or "HH:MM"
    s = str(v).strip()
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(s, fmt).time()
        except ValueError:
            continue
    return None


def as_date(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v).strip()[:10]
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None


def truthy(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    return str(v).strip().lower() in ("true", "1", "yes", "y")


# ─── employee lookup ──────────────────────────────────────────────────────────

async def build_lookup(db):
    rows = (await db.execute(select(Employee))).scalars().all()
    by_email, by_pemail, by_name = {}, {}, {}
    for r in rows:
        if r.email:
            by_email[r.email.lower().strip()] = r.employee_code
        if getattr(r, "personal_email", None):
            by_pemail[r.personal_email.lower().strip()] = r.employee_code
        if r.full_name:
            by_name[norm_name(r.full_name)] = r.employee_code
    return by_email, by_pemail, by_name


def match_code(email, name, lk):
    by_email, by_pemail, by_name = lk
    e = (email or "").lower().strip()
    if e and e in by_email:
        return by_email[e], "email"
    if e and e in by_pemail:
        return by_pemail[e], "pemail"
    n = norm_name(name)
    if n and n in by_name:
        return by_name[n], "name"
    return None, None


# ─── main ─────────────────────────────────────────────────────────────────────

async def main(xlsx_path: str, dry_run: bool, only_code: str | None = None):
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb["Sheet1"]
    it = ws.iter_rows(min_row=1, values_only=True)
    header = next(it)
    H = {h: i for i, h in enumerate(header)}

    async with SessionLocal() as db:
        lk = await build_lookup(db)

        # Preload existing keys for idempotency
        existing_sessions = set()
        for code, wd, cin in (await db.execute(
            select(ClockSession.employee_code, ClockSession.work_date, ClockSession.clock_in_at)
        )).all():
            existing_sessions.add((code, wd, cin))
        existing_mc = {}
        for mc in (await db.execute(select(ClockManualCheck))).scalars().all():
            existing_mc[(mc.employee_code, mc.work_date)] = mc

        stats = {
            "rows": 0, "skipped_unmatched": 0, "skipped_nodate": 0,
            "sessions_new": 0, "sessions_dup": 0,
            "mc_new": 0, "mc_updated": 0,
            "matched_people": set(), "unmatched_people": set(),
            "match_email": 0, "match_pemail": 0, "match_name": 0,
        }
        new_sessions = []
        new_mc_keys = set()  # track within-run dedup for manual_check

        for r in it:
            email = r[H["Email"]]
            name = r[H["Name"]]
            if email is None and name is None:
                continue
            stats["rows"] += 1

            code, how = match_code(email, name, lk)
            if not code:
                stats["skipped_unmatched"] += 1
                stats["unmatched_people"].add((email or "").lower() or norm_name(name))
                continue
            if only_code and code != only_code:
                continue
            stats["matched_people"].add(code)
            stats[f"match_{how}"] += 1

            wd = as_date(r[H["Date"]])
            if not wd:
                stats["skipped_nodate"] += 1
                continue

            # ── clock session (only if there's a clock-in) ──
            tin = as_time(r[H["Clock In"]])
            if tin:
                cin = datetime.combine(wd, tin, tzinfo=TZ_BKK)
                tout = as_time(r[H["Clock Out"]])
                cout = None
                outcome = None
                if tout:
                    cout = datetime.combine(wd, tout, tzinfo=TZ_BKK)
                    if cout < cin:  # overnight
                        cout += timedelta(days=1)
                    outcome = "COMPLETE"
                else:
                    # Historical row with no clock-out — never going to get one.
                    # Close it at 18:00 BKK (or clock_in + 1h if clocked in later)
                    # so it does NOT sit ACTIVE and trigger the nightly auto-close.
                    eod = datetime.combine(wd, time(18, 0), tzinfo=TZ_BKK)
                    cout = eod if eod > cin else cin + timedelta(hours=1)
                    outcome = "AUTO_CLOSE"
                key = (code, wd, cin)
                if key in existing_sessions:
                    stats["sessions_dup"] += 1
                else:
                    existing_sessions.add(key)
                    lat_in, lng_in = parse_latlong(r[H["LatLong_In"]])
                    lat_out, lng_out = parse_latlong(r[H["LatLong_Out"]])
                    sess = ClockSession(
                        employee_code=code,
                        clock_type="DAILY",
                        work_date=wd,
                        clock_in_at=cin,
                        clock_out_at=cout,
                        lat_in=lat_in, lng_in=lng_in,
                        lat_out=lat_out, lng_out=lng_out,
                        photo_in=drive_direct_url(r[H["Image URL_In"]]),
                        photo_out=drive_direct_url(r[H["Image URL_Out"]]),
                        status="CLOSED",
                        outcome=outcome,
                    )
                    new_sessions.append(sess)
                    stats["sessions_new"] += 1
                    if not dry_run:
                        db.add(sess)

            # ── manual check flags ──
            sc = truthy(r[H["Status Clock"]])
            stl = truthy(r[H["Send to Line"]])
            lw = truthy(r[H["Location Work"]])
            if sc is not None or stl is not None or lw is not None:
                mckey = (code, wd)
                existing = existing_mc.get(mckey)
                if existing is not None:
                    if not dry_run:
                        existing.status_clock = bool(sc) if sc is not None else existing.status_clock
                        existing.send_to_line = bool(stl) if stl is not None else existing.send_to_line
                        existing.location_work = bool(lw) if lw is not None else existing.location_work
                    stats["mc_updated"] += 1
                elif mckey not in new_mc_keys:
                    new_mc_keys.add(mckey)
                    stats["mc_new"] += 1
                    if not dry_run:
                        db.add(ClockManualCheck(
                            employee_code=code, work_date=wd,
                            status_clock=bool(sc) if sc is not None else False,
                            send_to_line=bool(stl) if stl is not None else False,
                            location_work=bool(lw) if lw is not None else False,
                            admin_code="IMPORT", admin_name="Legacy Import",
                        ))

        if not dry_run:
            await db.commit()

        wb.close()

        # ── report ──
        print("=" * 60)
        print("DRY RUN — nothing committed" if dry_run else "COMMITTED to database")
        print("=" * 60)
        print(f"Rows processed:         {stats['rows']}")
        print(f"Matched people:         {len(stats['matched_people'])}")
        print(f"  by email:             {stats['match_email']}")
        print(f"  by personal_email:    {stats['match_pemail']}")
        print(f"  by name:              {stats['match_name']}")
        print(f"Skipped (unmatched):    {stats['skipped_unmatched']}  ({len(stats['unmatched_people'])} people)")
        print(f"Skipped (no date):      {stats['skipped_nodate']}")
        print("-" * 60)
        print(f"clock_sessions NEW:     {stats['sessions_new']}")
        print(f"clock_sessions dup:     {stats['sessions_dup']}")
        print(f"manual_check NEW:       {stats['mc_new']}")
        print(f"manual_check updated:   {stats['mc_updated']}")
        print("=" * 60)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx", help="Path to OldClockData_DAILY_.xlsx")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", help="Import only this employee_code (e.g. ACE056)")
    args = ap.parse_args()
    asyncio.run(main(args.xlsx, args.dry_run, args.only))
