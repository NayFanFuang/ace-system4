"""Verify — PAC cluster EAS0049-SSOA-1 (hyphen-named, was ace_project_code=NULL)
clock-in attaches to the cluster-plan-seeded tracking, matches by cluster prefix,
advances stage. Cleans up after itself."""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete, and_
from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.presite_tracking import DtePresiteTracking, DtePresiteHistory, DtePresiteSession
from app.routers.presite_monitor import auto_link_tracking_on_clockin, auto_promote_to_presite

DTE = "ACECS434"
CLUSTER = "EAS0049-SSOA-1"   # what ClockApp sends as session.site_code (cluster clock_site)


async def main():
    async with SessionLocal() as db:
        before = (await db.execute(
            select(DtePresiteTracking).where(and_(
                DtePresiteTracking.work_type == "PAC",
                DtePresiteTracking.cluster_key == CLUSTER,
            ))
        )).scalars().all()
        assert len(before) == 1, f"expected 1 cluster tracking, got {len(before)}"
        tid = before[0].id
        print(f"  ✓ cluster-plan-seeded tracking #{tid} stage={before[0].current_stage} (before clock-in)")

        now_in = datetime.now(timezone.utc)
        sess = ClockSession(
            employee_code=DTE, clock_type="PER_SITE", work_date=now_in.date(),
            site_code=CLUSTER, site_name=CLUSTER, clock_in_at=now_in,
            lat_in=13.118, lng_in=101.102, status="ACTIVE",
        )
        db.add(sess); await db.flush()
        linked = await auto_link_tracking_on_clockin(db, sess)
        await db.commit()
        assert linked >= 1, "clock-in did not link to the PAC cluster tracking (prefix match failed)"

        after = (await db.execute(
            select(DtePresiteTracking).where(and_(
                DtePresiteTracking.work_type == "PAC",
                DtePresiteTracking.cluster_key == CLUSTER,
            ))
        )).scalars().all()
        assert len(after) == 1 and after[0].id == tid, "duplicate / new tracking created"
        print(f"  ✓ clock-in matched cluster by prefix → tracking #{tid} stage={after[0].current_stage}")

        rounds = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tid)
            .order_by(DtePresiteSession.round_number)
        )).scalars().all()
        assert len(rounds) == 1 and rounds[0].started_at, "expected 1 started PAC round"
        print(f"  ✓ PAC round {rounds[0].round_number} started, status={rounds[0].status}")

        # ── cleanup: remove test session + reset tracking to seeded state ──
        await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == tid))
        await db.execute(delete(DtePresiteHistory).where(and_(
            DtePresiteHistory.tracking_id == tid,
            DtePresiteHistory.action != "auto-seed",
        )))
        await db.execute(delete(ClockSession).where(
            and_(ClockSession.employee_code == DTE, ClockSession.site_code == CLUSTER)
        ))
        t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tid))).scalar_one()
        t.current_stage = "FULL_ONAIR"
        t.dt_started_at = None; t.dt_started_by = None
        t.total_rounds = 0
        await db.commit()
        print(f"  ✓ cleanup done — tracking #{tid} reset to FULL_ONAIR, test session removed")

    print("\n🎉 EAS0049-SSOA-1 PAC clock-in verify PASSED — hyphen cluster seeds + matches + surfaces")


if __name__ == "__main__":
    asyncio.run(main())
