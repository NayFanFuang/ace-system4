"""E2E — PAC 5-round flow for Wipada (ACECS434)

Simulates 5 days of clock-in/out at the same PAC cluster site.
Verifies dte_presite_sessions table fills correctly and tracking → DT_DONE after round 5.
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete, and_

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.employee import ProjectPO
from app.models.presite_tracking import DtePresiteTracking, DtePresiteSession, DtePresiteHistory
from app.routers.presite_monitor import auto_link_tracking_on_clockin, auto_promote_to_presite

DTE_CODE = "ACECS434"
PAC_PO_ID = 1085
PAC_SITE_CODE = "KKIWM"


async def main():
    async with SessionLocal() as db:
        # Get PO + cluster_key (PAC tracking is cluster-level, identity = cluster_key)
        po = (await db.execute(select(ProjectPO).where(ProjectPO.id == PAC_PO_ID))).scalar_one_or_none()
        assert po, f"PO {PAC_PO_ID} not found"
        cluster_key = po.cluster_site

        # Clean prior test data (PAC tracking keyed by cluster_key, NOT po_id)
        rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == cluster_key))).scalars().all()
        for r in rows:
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == r.id))
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == r.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.cluster_key == cluster_key))
        await db.execute(delete(ClockSession).where(and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code == PAC_SITE_CODE)))

        # Ensure assignment
        po.planned_dte_codes = DTE_CODE; po.planned_dte_names = "Wipada Srisurad"
        po.site_code = PAC_SITE_CODE; po.workflow_status = "PLANNED"
        await db.commit()

        print(f"━━━ Simulating 5 PAC rounds at {PAC_SITE_CODE} ━━━\n")
        base_date = datetime.now(timezone.utc) - timedelta(days=6)

        tracking_id = None
        for round_no in range(1, 6):
            day_offset = round_no - 1
            now_in  = base_date + timedelta(days=day_offset, hours=8)
            now_out = base_date + timedelta(days=day_offset, hours=11, minutes=30)

            sess = ClockSession(
                employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
                site_code=PAC_SITE_CODE, site_name="KKIWM Cluster",
                clock_in_at=now_in, lat_in=13.4, lng_in=100.9, status="ACTIVE",
            )
            db.add(sess); await db.flush()
            print(f"Day {round_no}: Clock-in session #{sess.id} at {now_in.strftime('%m-%d %H:%M')}")

            linked = await auto_link_tracking_on_clockin(db, sess)
            await db.commit()

            tracking = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == cluster_key))).scalar_one_or_none()
            assert tracking, f"PAC cluster tracking missing for cluster_key={cluster_key}"
            tracking_id = tracking.id
            print(f"  ✓ auto-link → linked={linked}, tracking #{tracking.id} stage={tracking.current_stage}")

            # Clock-out COMPLETE
            sess.clock_out_at = now_out; sess.lat_out = 13.4; sess.lng_out = 100.9
            sess.outcome = "COMPLETE"; sess.status = "CLOSED"
            await db.flush()
            promoted = await auto_promote_to_presite(db, sess, "COMPLETE")
            await db.commit()

            sessions = (await db.execute(
                select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking.id).order_by(DtePresiteSession.round_number)
            )).scalars().all()
            done = [s.round_number for s in sessions if s.status == "DONE"]
            in_progress = [s.round_number for s in sessions if s.status == "IN_PROGRESS"]
            await db.refresh(tracking)
            print(f"  ✓ auto-promote → done rounds: {done}, in-progress: {in_progress}, tracking stage={tracking.current_stage}\n")

        # Final verification
        print("━━━ Final state ━━━")
        sessions = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id).order_by(DtePresiteSession.round_number)
        )).scalars().all()
        for s in sessions:
            print(f"  Round {s.round_number}: status={s.status:11} started={s.started_at.strftime('%m-%d %H:%M') if s.started_at else '—':12} ended={s.ended_at.strftime('%m-%d %H:%M') if s.ended_at else '—'}")
        tracking = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        assert tracking.current_stage == "DT_DONE", f"❌ expected DT_DONE, got {tracking.current_stage}"
        assert len(sessions) == 5 and all(s.status == "DONE" for s in sessions), "❌ not all 5 rounds DONE"
        print(f"\n✅ Tracking #{tracking_id} → DT_DONE after 5 rounds")
        print("🎉 PAC 5-round flow E2E PASSED")


if __name__ == "__main__":
    asyncio.run(main())
