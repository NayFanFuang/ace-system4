"""E2E — Plan DTE → ClockApp → SSV Pre-Site + PAC Pre-Site

Assigns 1 SSV + 1 PAC PO to Wipada (ACECS434), simulates clock-in/out for both,
then verifies both Pre-Site views show updated tracking.

Run: docker exec ace-system-backend python -m tests.e2e_ssv_pac_flow
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete, and_

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.employee import ProjectPO
from app.models.presite_tracking import DtePresiteTracking, DtePresiteHistory
from app.routers.presite_monitor import (
    auto_link_tracking_on_clockin,
    auto_promote_to_presite,
)

DTE_CODE = "ACECS434"
DTE_NAME = "Wipada Srisurad"

SSV_PO_ID = 744          # we already assigned this in earlier test
SSV_SITE_CODE = "CBRA517"

PAC_PO_ID = 1085         # 1051HG2696155-122 cluster KKIWM_S02S03S04_NR2600_ER
PAC_SITE_CODE = "KKIWM"


async def assign(db, po_id, site_code):
    """Set DTE assignment + ensure site_code."""
    po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one_or_none()
    assert po, f"PO {po_id} not found"
    po.planned_dte_codes = DTE_CODE
    po.planned_dte_names = DTE_NAME
    po.site_code = site_code
    po.workflow_status = "PLANNED"
    return po


async def _lookup_tracking(db, po):
    """Find tracking for a PO under the new model:
       SSV: tracking.po_id = po.id
       PAC: tracking.cluster_key = po.cluster_site (1 cluster = 1 tracking)
    """
    from app.models.presite_tracking import DtePresiteTracking
    if (po.work_type or "").upper() == "PAC":
        return (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == po.cluster_site)
        )).scalar_one_or_none()
    return (await db.execute(
        select(DtePresiteTracking).where(DtePresiteTracking.po_id == po.id)
    )).scalar_one_or_none()


async def clear_test_data(db):
    """Remove prior test artifacts so we get clean state."""
    from sqlalchemy import select as _sel
    from app.models.employee import ProjectPO as _PO
    for po_id in (SSV_PO_ID, PAC_PO_ID):
        po = (await db.execute(_sel(_PO).where(_PO.id == po_id))).scalar_one_or_none()
        if not po:
            continue
        # delete tracking matching this PO (SSV by po_id, PAC by cluster_key)
        if (po.work_type or "").upper() == "PAC":
            ts = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == po.cluster_site))).scalars().all()
        else:
            ts = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id))).scalars().all()
        for t in ts:
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == t.id))
            await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.id == t.id))
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code.in_([SSV_SITE_CODE, PAC_SITE_CODE]))
    ))
    await db.commit()


async def simulate_clock(db, work_type, po_id, site_code, lat, lng):
    """Simulate clock-in + clock-out and run hooks. Return tracking row."""
    print(f"\n━━━ {work_type} flow: PO {po_id} at {site_code} ━━━")
    po = await assign(db, po_id, site_code)
    await db.flush()

    # Clock In
    now_in = datetime.now(timezone.utc) - timedelta(hours=4)
    session = ClockSession(
        employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
        site_code=site_code, site_name=f"{site_code} (test {work_type})",
        clock_in_at=now_in, lat_in=lat, lng_in=lng, status="ACTIVE",
    )
    db.add(session)
    await db.flush()
    print(f"  ▶ Clock-in session #{session.id} at {now_in.strftime('%H:%M')}")

    linked = await auto_link_tracking_on_clockin(db, session)
    await db.commit()
    print(f"  ✓ auto_link_tracking_on_clockin → linked={linked}")

    tracking = await _lookup_tracking(db, po)
    assert tracking, f"❌ tracking row not created for {work_type}"
    print(f"  ↳ tracking #{tracking.id} stage={tracking.current_stage} work_type={tracking.work_type}")
    assert tracking.current_stage == "DT_STARTED"
    assert tracking.work_type == work_type, f"❌ work_type mismatch: expected {work_type}, got {tracking.work_type}"
    print(f"  ✅ STAGE = DT_STARTED, work_type = {work_type}")

    # Clock Out + COMPLETE
    now_out = datetime.now(timezone.utc)
    session.clock_out_at = now_out
    session.lat_out = lat; session.lng_out = lng
    session.outcome = "COMPLETE"; session.status = "CLOSED"
    await db.flush()
    promoted = await auto_promote_to_presite(db, session, "COMPLETE")
    await db.commit()
    print(f"  ✓ auto_promote_to_presite → promoted={promoted}")

    await db.refresh(tracking)
    assert tracking.current_stage == "DT_DONE"
    print(f"  ✅ STAGE = DT_DONE, dt_done_at={tracking.dt_done_at.strftime('%H:%M')}")
    return tracking


async def main():
    async with SessionLocal() as db:
        await clear_test_data(db)
        print(f"🧹 Cleared prior test data for {DTE_CODE}")

        # Step 1: SSV flow
        ssv_tracking = await simulate_clock(db, "SSV", SSV_PO_ID, SSV_SITE_CODE, 13.044961, 101.102031)

        # Step 2: PAC flow
        pac_tracking = await simulate_clock(db, "PAC", PAC_PO_ID, PAC_SITE_CODE, 13.4, 100.9)

        # Step 3: Verify API would return them in correct views
        print("\n━━━ Pre-Site Monitor view verification ━━━")
        ssv_rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.work_type == "SSV"))).scalars().all()
        pac_rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.work_type == "PAC"))).scalars().all()
        print(f"  • SSV Pre-Site rows: {len(ssv_rows)} (incl. new #{ssv_tracking.id})")
        print(f"  • PAC Pre-Site rows: {len(pac_rows)} (incl. new #{pac_tracking.id})")

        # Show full history
        print("\n📜 Combined history:")
        all_hist = (await db.execute(
            select(DtePresiteHistory)
            .where(DtePresiteHistory.tracking_id.in_([ssv_tracking.id, pac_tracking.id]))
            .order_by(DtePresiteHistory.tracking_id, DtePresiteHistory.at)
        )).scalars().all()
        for h in all_hist:
            tag = 'SSV' if h.tracking_id == ssv_tracking.id else 'PAC'
            print(f"  [{tag}] [{h.action:18}] {h.stage:12} by {h.actor_code} — {h.notes}")

        print("\n🎉 E2E PASSED — SSV + PAC both auto-promoted correctly")


if __name__ == "__main__":
    asyncio.run(main())
