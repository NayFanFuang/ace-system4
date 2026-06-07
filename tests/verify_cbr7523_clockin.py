"""Focused verify — CBR7523 (PO 1279, empty site_code) clock-in attaches to the
plan-seeded tracking row (id from B fix), no duplicate, stage advances. Cleans up."""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete, and_
from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.presite_tracking import DtePresiteTracking, DtePresiteHistory, DtePresiteSession
from app.routers.presite_monitor import auto_link_tracking_on_clockin, auto_promote_to_presite

DTE = "ACECS434"
PO_ID = 1279
SITE = "CBR7523"  # cluster-root site code (what ClockApp sends as session.site_code)


async def main():
    async with SessionLocal() as db:
        before = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id == PO_ID)
        )).scalars().all()
        assert len(before) == 1, f"expected 1 seeded tracking, got {len(before)}"
        tid = before[0].id
        print(f"  ✓ plan-seeded tracking #{tid} stage={before[0].current_stage} (before clock-in)")

        now_in = datetime.now(timezone.utc)
        sess = ClockSession(
            employee_code=DTE, clock_type="PER_SITE", work_date=now_in.date(),
            site_code=SITE, site_name=SITE, clock_in_at=now_in,
            lat_in=12.967, lng_in=100.906, status="ACTIVE",
        )
        db.add(sess); await db.flush()
        await auto_link_tracking_on_clockin(db, sess)
        await db.commit()

        after_in = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id == PO_ID)
        )).scalars().all()
        assert len(after_in) == 1, f"DUPLICATE tracking! got {len(after_in)}"
        assert after_in[0].id == tid, "clock-in created a new tracking instead of attaching"
        print(f"  ✓ clock-in attached to SAME tracking #{tid} (no duplicate) stage={after_in[0].current_stage}")

        rounds = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tid)
            .order_by(DtePresiteSession.round_number)
        )).scalars().all()
        assert len(rounds) == 1 and rounds[0].started_at, "expected 1 started round"
        print(f"  ✓ session round {rounds[0].round_number} started, status={rounds[0].status}")

        # clock-out → DT_DONE
        sess.clock_out_at = now_in + timedelta(hours=3)
        sess.lat_out = 12.967; sess.lng_out = 100.906
        sess.outcome = "COMPLETE"; sess.status = "CLOSED"
        await db.flush()
        await auto_promote_to_presite(db, sess, "COMPLETE")
        await db.commit()
        t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tid))).scalar_one()
        print(f"  ✓ clock-out → stage={t.current_stage}")
        assert t.current_stage == "DT_DONE", f"expected DT_DONE, got {t.current_stage}"

        # ── cleanup: remove the test clock session + reset tracking to plan-seeded state ──
        await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == tid))
        await db.execute(delete(DtePresiteHistory).where(and_(
            DtePresiteHistory.tracking_id == tid,
            DtePresiteHistory.action != "auto-seed",
        )))
        await db.execute(delete(ClockSession).where(
            and_(ClockSession.employee_code == DTE, ClockSession.site_code == SITE)
        ))
        t.current_stage = "FULL_ONAIR"
        t.dt_started_at = None; t.dt_started_by = None; t.dt_done_at = None
        await db.commit()
        print(f"  ✓ cleanup done — tracking #{tid} reset to FULL_ONAIR, test clock session removed")

    print("\n🎉 CBR7523 clock-in verify PASSED — empty-site_code SSV PO seeds + attaches correctly")


if __name__ == "__main__":
    asyncio.run(main())
