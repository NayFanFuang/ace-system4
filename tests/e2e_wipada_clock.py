"""E2E test — Wipada Srisurad (ACECS434) PER_SITE clock-in → Pre-Site auto-promote.

Simulates clock-in/out via direct DB writes + invokes the integration hooks.
Run inside backend container:
    docker exec ace-system-backend python -m tests.e2e_wipada_clock
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.employee import ProjectPO
from app.models.presite_tracking import DtePresiteTracking, DtePresiteHistory
from app.routers.presite_monitor import (
    auto_link_tracking_on_clockin,
    auto_promote_to_presite,
)

DTE_CODE = "ACECS434"
SITE_CODE = "CBRA517"


async def main():
    async with SessionLocal() as db:
        # ── Step 1: confirm PO assignment ──
        po = (await db.execute(
            select(ProjectPO).where(ProjectPO.id == 744)
        )).scalar_one_or_none()
        assert po, "PO 744 not found"
        print(f"✓ PO 744 assigned to {po.planned_dte_codes} at site {po.site_code} (cluster {po.cluster_site})")

        # ── Step 2: simulate Clock-In ──
        now_in = datetime.now(timezone.utc) - timedelta(hours=3)
        session = ClockSession(
            employee_code=DTE_CODE,
            clock_type="PER_SITE",
            work_date=now_in.date(),
            site_code=SITE_CODE,
            site_name="CBRA517 (test)",
            clock_in_at=now_in,
            lat_in=13.044961, lng_in=101.102031,
            status="ACTIVE",
        )
        db.add(session)
        await db.flush()
        print(f"✓ Clock-in session #{session.id} at {now_in.isoformat()}")

        # ── Step 3: invoke auto-link hook (mimics clock.py:clock_in) ──
        linked = await auto_link_tracking_on_clockin(db, session)
        await db.commit()
        print(f"✓ auto_link_tracking_on_clockin returned linked={linked}")

        # ── Verify tracking row exists at DT_STARTED ──
        tracking = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.assigned_dte_code == DTE_CODE)
        )).scalar_one_or_none()
        assert tracking, "❌ tracking row not created"
        print(f"  ↳ tracking #{tracking.id} stage={tracking.current_stage} dt_started_at={tracking.dt_started_at}")
        assert tracking.current_stage == "DT_STARTED", f"❌ expected DT_STARTED got {tracking.current_stage}"
        assert tracking.dt_started_at is not None, "❌ dt_started_at not set"
        print("✅ STAGE = DT_STARTED")

        # ── Step 4: simulate Clock-Out + outcome=COMPLETE ──
        now_out = datetime.now(timezone.utc)
        session.clock_out_at = now_out
        session.lat_out = 13.044961; session.lng_out = 101.102031
        session.outcome = "COMPLETE"
        session.status = "CLOSED"
        await db.flush()
        print(f"✓ Clock-out at {now_out.isoformat()} outcome=COMPLETE")

        # ── Step 5: invoke auto-promote hook ──
        promoted = await auto_promote_to_presite(db, session, "COMPLETE")
        await db.commit()
        print(f"✓ auto_promote_to_presite returned promoted={promoted}")

        await db.refresh(tracking)
        print(f"  ↳ tracking #{tracking.id} stage={tracking.current_stage} dt_done_at={tracking.dt_done_at}")
        assert tracking.current_stage == "DT_DONE", f"❌ expected DT_DONE got {tracking.current_stage}"
        assert tracking.dt_done_at is not None, "❌ dt_done_at not set"
        print("✅ STAGE = DT_DONE")

        # ── Verify history audit trail ──
        history = (await db.execute(
            select(DtePresiteHistory)
            .where(DtePresiteHistory.tracking_id == tracking.id)
            .order_by(DtePresiteHistory.id)
        )).scalars().all()
        print(f"\n📜 History ({len(history)} entries):")
        for h in history:
            print(f"  • [{h.action}] {h.stage} by {h.actor_code} — {h.notes}")

        print("\n🎉 E2E PASSED — Plan DTE → ClockApp → Pre-Site auto-promote works!")


if __name__ == "__main__":
    asyncio.run(main())
