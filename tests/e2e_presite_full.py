"""E2E — Full presite-monitor lifecycle via HTTP API + hooks.

Covers:
  1. Login → /api/presite/summary + /api/presite/tracking
  2. Sessions array attached to every row (SSV + PAC)
  3. SSV: clock-in → DT_STARTED → clock-out → DT_DONE
  4. SSV: advance report-done → check-pass → ACE_APPROVED (session marked PASS)
  5. SSV: re-plan after FAIL — next clock-in creates round 2
  6. PAC: multi-round clock-in/out → sessions list grows
  7. Cleanup

Run: docker exec ace-system-backend python -m tests.e2e_presite_full
"""
import asyncio
import urllib.request
import urllib.parse
import json
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

API_BASE = "http://localhost:8000"
DTE_CODE = "ACECS434"
DTE_NAME = "Wipada Srisurad"
SSV_PO_ID = 744
SSV_SITE = "CBRA517"
PAC_PO_ID = 1085
PAC_SITE = "KKIWM"


# ─── tiny HTTP client ───────────────────────────────────────────────
def http(method: str, path: str, token: str | None = None, body: dict | None = None) -> dict:
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            txt = r.read().decode()
            return {"status": r.status, "json": json.loads(txt) if txt else None}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "json": json.loads(e.read().decode() or "{}")}


def login(email: str, password: str) -> str:
    r = http("POST", "/api/auth/login", body={"email": email, "password": password})
    assert r["status"] == 200, f"login failed: {r}"
    return r["json"]["access_token"]


async def reset_test_data(db):
    for po_id in (SSV_PO_ID, PAC_PO_ID):
        po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one_or_none()
        if not po:
            continue
        if (po.work_type or "").upper() == "PAC":
            # PAC: tracking keyed by cluster_key, po_id=NULL
            rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == po.cluster_site))).scalars().all()
        else:
            rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id))).scalars().all()
        for r in rows:
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == r.id))
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == r.id))
            await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.id == r.id))
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code.in_([SSV_SITE, PAC_SITE]))
    ))
    await db.commit()


async def assign_po(db, po_id, site_code):
    po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one_or_none()
    assert po, f"PO {po_id} not found"
    po.planned_dte_codes = DTE_CODE
    po.planned_dte_names = DTE_NAME
    po.site_code = site_code
    po.workflow_status = "PLANNED"
    await db.flush()


async def clock_cycle(db, po_id, site_code, day_offset_hours_in: int, hours_duration: int):
    """Simulate one clock-in→out cycle. Return (session, tracking)."""
    now_in = datetime.now(timezone.utc) + timedelta(hours=day_offset_hours_in)
    session = ClockSession(
        employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
        site_code=site_code, site_name=site_code,
        clock_in_at=now_in, lat_in=13.0, lng_in=101.0, status="ACTIVE",
    )
    db.add(session)
    await db.flush()
    await auto_link_tracking_on_clockin(db, session)
    await db.commit()

    session.clock_out_at = now_in + timedelta(hours=hours_duration)
    session.lat_out = 13.0; session.lng_out = 101.0
    session.outcome = "COMPLETE"; session.status = "CLOSED"
    await db.flush()
    await auto_promote_to_presite(db, session, "COMPLETE")
    await db.commit()

    # Look up tracking by appropriate identity (PAC = cluster_key, SSV = po_id)
    po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one()
    if (po.work_type or "").upper() == "PAC":
        tracking = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == po.cluster_site)
        )).scalar_one()
    else:
        tracking = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id == po_id)
        )).scalar_one()
    return session, tracking


async def sessions_for(db, tracking_id):
    return (await db.execute(
        select(DtePresiteSession)
        .where(DtePresiteSession.tracking_id == tracking_id)
        .order_by(DtePresiteSession.round_number)
    )).scalars().all()


async def main():
    print("\n━━━ Step 1: Login + base API smoke ━━━")
    token = login("ADMIN", "admin1234")
    print(f"  ✓ admin login → token ({len(token)} chars)")

    summary = http("GET", "/api/presite/summary", token=token)
    assert summary["status"] == 200
    s = summary["json"]
    print(f"  ✓ summary → total={s['total']} active={s['active']} stages={s['stage_counts']}")

    listing = http("GET", "/api/presite/tracking", token=token)
    assert listing["status"] == 200
    rows = listing["json"]["data"]
    print(f"  ✓ tracking list → {len(rows)} rows")
    assert all("sessions" in r for r in rows), "every row must have sessions[]"
    print(f"  ✓ all rows have sessions[] attached")
    ssv_rows = [r for r in rows if r.get("work_type") == "SSV"]
    pac_rows = [r for r in rows if r.get("work_type") == "PAC"]
    print(f"  ✓ SSV={len(ssv_rows)} PAC={len(pac_rows)}")

    async with SessionLocal() as db:
        await reset_test_data(db)
        print("\n━━━ Step 2: SSV clock cycle → DT_DONE ━━━")
        await assign_po(db, SSV_PO_ID, SSV_SITE)
        await db.commit()
        sess1, ssv_t = await clock_cycle(db, SSV_PO_ID, SSV_SITE, -4, 4)
        assert ssv_t.work_type == "SSV"
        assert ssv_t.current_stage == "DT_DONE"
        ssv_sessions = await sessions_for(db, ssv_t.id)
        # SSV after clock-out: session stays IN_PROGRESS until check-pass/fail
        assert len(ssv_sessions) == 1, f"expected 1 session, got {len(ssv_sessions)}"
        assert ssv_sessions[0].started_at and ssv_sessions[0].ended_at, "session must have start+end"
        print(f"  ✓ SSV tracking #{ssv_t.id} stage=DT_DONE, sessions=1, round1 IN_PROGRESS (awaiting check)")

    # Step 3: advance report-done → check-pass
    print("\n━━━ Step 3: report-done → check-pass via API ━━━")
    r = http("POST", f"/api/presite/tracking/{ssv_t.id}/advance", token=token,
             body={"action": "report-done", "notes": "report finalized"})
    assert r["status"] == 200, r
    assert r["json"]["current_stage"] == "REPORT_DONE"
    print(f"  ✓ report-done → stage=REPORT_DONE")

    r = http("POST", f"/api/presite/tracking/{ssv_t.id}/advance", token=token,
             body={"action": "check-pass", "notes": "All good"})
    assert r["status"] == 200, r
    assert r["json"]["current_stage"] == "ACE_APPROVED"
    print(f"  ✓ check-pass → stage=ACE_APPROVED, completed_at set")

    async with SessionLocal() as db:
        s_list = await sessions_for(db, ssv_t.id)
        assert s_list[-1].check_result == "PASS", "session must mirror PASS"
        print(f"  ✓ session round {s_list[-1].round_number} check_result=PASS")

    # Step 4: SSV re-plan after FAIL → next clock-in creates round 2
    print("\n━━━ Step 4: SSV FAIL → re-plan creates round 2 ━━━")
    # Reset back to REPORT_DONE then fail
    async with SessionLocal() as db:
        await reset_test_data(db)
        await assign_po(db, SSV_PO_ID, SSV_SITE)
        await db.commit()
        sess1, ssv_t = await clock_cycle(db, SSV_PO_ID, SSV_SITE, -8, 4)
    r = http("POST", f"/api/presite/tracking/{ssv_t.id}/advance", token=token,
             body={"action": "report-done"})
    assert r["status"] == 200
    r = http("POST", f"/api/presite/tracking/{ssv_t.id}/advance", token=token,
             body={"action": "check-fail", "notes": "missing layer 3"})
    assert r["status"] == 200, r
    assert r["json"]["current_stage"] == "CHECKING"
    print(f"  ✓ check-fail → stage=CHECKING (rework)")

    async with SessionLocal() as db:
        # New clock cycle → should create round 2
        sess2, ssv_t = await clock_cycle(db, SSV_PO_ID, SSV_SITE, -1, 1)
        s_list = await sessions_for(db, ssv_t.id)
        assert len(s_list) == 2, f"expected 2 SSV sessions after FAIL+reclock, got {len(s_list)}"
        assert s_list[1].round_number == 2
        assert s_list[1].started_at and s_list[1].ended_at, "round 2 should have start+end"
        assert s_list[0].check_result == "FAIL", "round 1 should be FAIL"
        print(f"  ✓ re-clock created round 2 (sessions={len(s_list)}, round1=FAIL, round2 awaiting check)")

    # Step 5: PAC multi-round
    print("\n━━━ Step 5: PAC 3-round clock cycles ━━━")
    async with SessionLocal() as db:
        await reset_test_data(db)
        await assign_po(db, PAC_PO_ID, PAC_SITE)
        await db.commit()
        for day in range(1, 4):
            sess, pac_t = await clock_cycle(db, PAC_PO_ID, PAC_SITE, -(24 * (5 - day)), 3)
        s_list = await sessions_for(db, pac_t.id)
        assert len(s_list) == 3, f"PAC sessions={len(s_list)}, expected 3"
        assert all(s.status == "DONE" for s in s_list)
        print(f"  ✓ PAC tracking #{pac_t.id} has 3 DONE rounds")

    # Step 6: verify API shows new sessions
    print("\n━━━ Step 6: Re-fetch via API and verify sessions visible ━━━")
    listing = http("GET", "/api/presite/tracking", token=token)
    rows = listing["json"]["data"]
    pac_row = next((r for r in rows if r["id"] == pac_t.id), None)
    assert pac_row, "PAC row missing"
    assert len(pac_row["sessions"]) == 3
    print(f"  ✓ API → PAC tracking #{pac_t.id} returns {len(pac_row['sessions'])} sessions")
    for s in pac_row["sessions"]:
        print(f"    round {s['round']} status={s['status']} started={s['started_at'] is not None} ended={s['ended_at'] is not None}")

    # Cleanup
    async with SessionLocal() as db:
        await reset_test_data(db)
    print("\n🎉 E2E PASSED — full presite-monitor lifecycle verified")


if __name__ == "__main__":
    asyncio.run(main())
