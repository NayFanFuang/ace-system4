"""Nightly auto-close of stuck clock sessions.

Policy: Any ACTIVE session whose work_date is BEFORE today's Bangkok date
is auto-closed at end of its own work_date (18:00 BKK). If clock_in_at is
already past that cutoff (rare — late-evening clock-in), close at +1 hour
to avoid negative durations.

The closed sessions are marked with status='CLOSED', outcome='AUTO_CLOSE'
so they remain identifiable in reports and can be hand-corrected later if
the employee provides their actual clock-out time.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.database import SessionLocal
from app.models.clock import ClockSession

logger = logging.getLogger(__name__)

BKK = ZoneInfo("Asia/Bangkok")
END_OF_WORKDAY_HOUR = 18  # 18:00 BKK
MIN_DURATION_HOURS = 1     # Floor for edge-case late clock-ins


async def auto_close_stuck_sessions() -> dict:
    """Close every ACTIVE session whose work_date < today (Bangkok).

    Returns a summary dict with counts + the list of affected session ids.
    Safe to call repeatedly — idempotent (each call only finds sessions
    that are still ACTIVE; once closed they stop matching).
    """
    today_bkk = datetime.now(BKK).date()

    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(ClockSession).where(
                    ClockSession.status == "ACTIVE",
                    ClockSession.work_date < today_bkk,
                )
            )
        ).scalars().all()

        closed_ids: list[int] = []
        for s in rows:
            end_of_workday_bkk = datetime.combine(
                s.work_date, time(END_OF_WORKDAY_HOUR, 0), tzinfo=BKK
            )
            # If clock-in is already past 18:00, give it MIN_DURATION_HOURS
            # so we never write a negative duration.
            if s.clock_in_at and s.clock_in_at > end_of_workday_bkk:
                target = s.clock_in_at + timedelta(hours=MIN_DURATION_HOURS)
            else:
                target = end_of_workday_bkk
            s.clock_out_at = target.astimezone(timezone.utc)
            s.status = "CLOSED"
            s.outcome = "AUTO_CLOSE"
            closed_ids.append(s.id)

        await db.commit()

    print(
        f"[autoclose] closed {len(closed_ids)} sessions "
        f"(today_bkk={today_bkk}, ids={closed_ids[:20]})",
        flush=True,
    )
    return {
        "closed_count": len(closed_ids),
        "closed_ids": closed_ids,
        "today_bkk": today_bkk.isoformat(),
    }


async def nightly_autoclose_loop() -> None:
    """Background task: wake at 01:00 BKK every day and close stuck sessions.

    Started from app.main.startup via asyncio.create_task. Loops forever;
    survives transient errors by sleeping 60s and trying again.
    """
    print("[autoclose] nightly loop started", flush=True)
    while True:
        try:
            now_bkk = datetime.now(BKK)
            target = datetime.combine(now_bkk.date(), time(1, 0), tzinfo=BKK)
            if now_bkk >= target:
                target = target + timedelta(days=1)
            wait_sec = (target - now_bkk).total_seconds()
            print(
                f"[autoclose] next run at {target.isoformat()} BKK "
                f"(sleeping {wait_sec:.0f} sec)",
                flush=True,
            )
            await asyncio.sleep(wait_sec)

            result = await auto_close_stuck_sessions()
            print(f"[autoclose] closed {result['closed_count']} sessions", flush=True)
        except asyncio.CancelledError:
            print("[autoclose] cancelled", flush=True)
            raise
        except Exception as e:  # noqa: BLE001 — keep loop alive on any error
            import traceback
            print(f"[autoclose] error: {e}\n{traceback.format_exc()}", flush=True)
            await asyncio.sleep(60)
