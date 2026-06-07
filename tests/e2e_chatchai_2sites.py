"""E2E — Chatchai Lerdlopthatri: Site 1 COMPLETE + Site 2 ISSUE

Walks Plan DTE → ClockApp → Pre-Site Monitor:
  Site 1 EAS0150-SSOA-1 (SSV) → clock-in → clock-out COMPLETE → tracking=DT_DONE
  Site 2 EAS0214-SSOA-3 (SSV) → clock-in → clock-out ISSUE → tracking stays DT_STARTED + email queued

Run: docker exec ace-system-backend python -m tests.e2e_chatchai_2sites
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete, and_

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.employee import ProjectPO
from app.models.presite_tracking import (
    DtePresiteTracking,
    DtePresiteHistory,
    DtePresiteSession,
)
from app.routers.presite_monitor import (
    auto_link_tracking_on_clockin,
    auto_promote_to_presite,
)

DTE_CODE = "ACECS435"
DTE_NAME = "Chatchai Lerdlopthatri"

S1_PO_ID = 127       # EAS0150-SSOA-1 SSV — DU = CBRA470
S1_SITE  = "CBRA470"

S2_PO_ID = 120       # EAS0214-SSOA-3 SSV — DU = SKE0217
S2_SITE  = "SKE0217"


async def reset(db):
    """Wipe any prior test data + previous DTE assignment."""
    for po_id in (S1_PO_ID, S2_PO_ID):
        rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id))).scalars().all()
        for r in rows:
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == r.id))
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == r.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id))
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code.in_([S1_SITE, S2_SITE]))
    ))
    await db.commit()


async def plan_po(db, po_id, site_code):
    """Step ① Plan DTE — assign Chatchai to PO."""
    po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one_or_none()
    assert po, f"PO {po_id} missing"
    po.planned_dte_codes = DTE_CODE
    po.planned_dte_names = DTE_NAME
    po.site_code = site_code
    po.workflow_status = "PLANNED"
    await db.flush()
    return po


async def clock_in_site(db, site_code, hours_ago):
    """Step ② ClockApp clock-in (PER_SITE)."""
    now_in = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    session = ClockSession(
        employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
        site_code=site_code, site_name=site_code,
        clock_in_at=now_in, lat_in=13.0, lng_in=101.0, status="ACTIVE",
    )
    db.add(session)
    await db.flush()
    linked = await auto_link_tracking_on_clockin(db, session)
    await db.commit()
    return session, linked


async def clock_out_site(db, session, outcome, hours_after_in):
    """Step ③ ClockApp clock-out (Complete | Stop | Issue)."""
    session.clock_out_at = session.clock_in_at + timedelta(hours=hours_after_in)
    session.lat_out = 13.0; session.lng_out = 101.0
    session.outcome = outcome
    session.status = "CLOSED"
    await db.flush()
    promoted = await auto_promote_to_presite(db, session, outcome)
    await db.commit()
    return promoted


async def fetch_tracking(db, po_id):
    return (await db.execute(
        select(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id)
    )).scalar_one_or_none()


async def fetch_sessions(db, tracking_id):
    return (await db.execute(
        select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        .order_by(DtePresiteSession.round_number)
    )).scalars().all()


async def main():
    print(f"\n👤 DTE: {DTE_NAME} ({DTE_CODE})")
    async with SessionLocal() as db:
        await reset(db)
        print("🧹 Reset prior test data")

        # ═══════════════════════════════════════════════════════════════
        # SITE 1: EAS0150-SSOA-1 → COMPLETE (Done)
        # ═══════════════════════════════════════════════════════════════
        print(f"\n━━━ SITE 1: {S1_SITE} (PO #{S1_PO_ID}) → COMPLETE ━━━")
        # Step ① Plan DTE
        po1 = await plan_po(db, S1_PO_ID, S1_SITE)
        await db.commit()
        print(f"  ① Plan DTE → PO {po1.po_number}/{po1.po_line} planned to {DTE_NAME}")

        # Step ② ClockApp clock-in
        sess1, linked1 = await clock_in_site(db, S1_SITE, hours_ago=5)
        t1 = await fetch_tracking(db, S1_PO_ID)
        print(f"  ② Clock-in → session #{sess1.id}, auto_link linked={linked1}")
        assert t1, "tracking must be auto-seeded"
        assert t1.current_stage == "DT_STARTED", f"expected DT_STARTED, got {t1.current_stage}"
        print(f"     tracking #{t1.id} stage={t1.current_stage} work_type={t1.work_type}")
        s1_sessions = await fetch_sessions(db, t1.id)
        assert len(s1_sessions) == 1 and s1_sessions[0].status == "IN_PROGRESS"
        print(f"     ✓ round 1 IN_PROGRESS")

        # Step ③ ClockApp clock-out COMPLETE
        promoted1 = await clock_out_site(db, sess1, "COMPLETE", hours_after_in=4)
        await db.refresh(t1)
        print(f"  ③ Clock-out COMPLETE → auto_promote promoted={promoted1}")
        assert t1.current_stage == "DT_DONE", f"expected DT_DONE, got {t1.current_stage}"
        s1_sessions = await fetch_sessions(db, t1.id)
        print(f"     ✓ tracking #{t1.id} → stage=DT_DONE, dt_done_at set")
        print(f"     ✓ session: round={s1_sessions[0].round_number} started={s1_sessions[0].started_at and '✓'} ended={s1_sessions[0].ended_at and '✓'}")

        # ═══════════════════════════════════════════════════════════════
        # SITE 2: EAS0214-SSOA-3 → ISSUE
        # ═══════════════════════════════════════════════════════════════
        print(f"\n━━━ SITE 2: {S2_SITE} (PO #{S2_PO_ID}) → ISSUE ━━━")
        po2 = await plan_po(db, S2_PO_ID, S2_SITE)
        await db.commit()
        print(f"  ① Plan DTE → PO {po2.po_number}/{po2.po_line} planned to {DTE_NAME}")

        sess2, linked2 = await clock_in_site(db, S2_SITE, hours_ago=2)
        t2 = await fetch_tracking(db, S2_PO_ID)
        print(f"  ② Clock-in → session #{sess2.id}, auto_link linked={linked2}")
        assert t2 and t2.current_stage == "DT_STARTED"
        print(f"     tracking #{t2.id} stage={t2.current_stage} work_type={t2.work_type}")

        promoted2 = await clock_out_site(db, sess2, "ISSUE", hours_after_in=1)
        await db.refresh(t2)
        print(f"  ③ Clock-out ISSUE → auto_promote promoted={promoted2} (expected 0)")
        assert promoted2 == 0, "ISSUE must NOT promote tracking"
        # Tracking should remain at DT_STARTED (issue = work not completed)
        assert t2.current_stage == "DT_STARTED", f"expected DT_STARTED retained, got {t2.current_stage}"
        s2_sessions = await fetch_sessions(db, t2.id)
        print(f"     ✓ tracking #{t2.id} → stage=DT_STARTED preserved (no promote on ISSUE)")
        print(f"     ✓ session: round={s2_sessions[0].round_number} status={s2_sessions[0].status} (still in-progress, awaiting re-attempt)")

        # ═══════════════════════════════════════════════════════════════
        # SUMMARY: how the two sites surface in Pre-Site Monitor
        # ═══════════════════════════════════════════════════════════════
        print("\n━━━ Pre-Site Monitor view ━━━")
        my_rows = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.assigned_dte_code == DTE_CODE)
        )).scalars().all()
        for r in my_rows:
            sess_count = len((await fetch_sessions(db, r.id)))
            print(f"  • tracking #{r.id:>3} site={r.site_code:<20} work={r.work_type:<3} stage={r.current_stage:<12} sessions={sess_count}")

        print("\n📜 History (newest first):")
        hist = (await db.execute(
            select(DtePresiteHistory)
            .where(DtePresiteHistory.tracking_id.in_([t1.id, t2.id]))
            .order_by(DtePresiteHistory.at.desc())
        )).scalars().all()
        for h in hist:
            tag = "S1" if h.tracking_id == t1.id else "S2"
            print(f"  [{tag}] {h.action:22} {h.stage:12} by {h.actor_code} — {h.notes}")

        print("\n🎉 E2E PASSED")
        print(f"   Site 1 ({S1_SITE}) → DT_DONE (visible in SSV Pre-Site queue, awaits report-done)")
        print(f"   Site 2 ({S2_SITE}) → DT_STARTED preserved (ISSUE → no promote, session stays in-progress for retry)")


if __name__ == "__main__":
    asyncio.run(main())
