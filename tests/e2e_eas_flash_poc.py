"""E2E — EAS-FLASH-POC end-to-end (Plan → ClockApp → Billing)

Demonstrates full PAC cluster lifecycle for the 10-DU cluster EAS-FLASH-POC:

  ① /api/presite/cluster-plan   → assign Chatchai to cluster (10 POs fanout)
  ② Clock-in at CLUSTER NAME    → 1 cluster tracking, 1 session IN_PROGRESS
  ③ Clock-out COMPLETE          → DT_DONE (1 clock-cycle covers all 10 DUs)
  ④ advance report-done         → REPORT_DONE
  ⑤ advance check-pass          → ACE_APPROVED
  ⑥ /billing-pos verifies       → 10 billing items ready for handoff

Run: docker exec ace-system-backend python -m tests.e2e_eas_flash_poc
"""
import asyncio
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete, and_

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.employee import ProjectPO
from app.models.presite_tracking import (
    DtePresiteTracking, DtePresiteHistory, DtePresiteSession,
)
from app.routers.presite_monitor import (
    auto_link_tracking_on_clockin,
    auto_promote_to_presite,
)

API_BASE = "http://localhost:8000"
DTE_CODE = "ACECS435"
DTE_NAME = "Chatchai Lerdlopthatri"
CLUSTER  = "EAS-FLASH-POC"


def http(method, path, token=None, body=None):
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            txt = r.read().decode()
            return {"status": r.status, "json": json.loads(txt) if txt else None}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "json": json.loads(e.read().decode() or "{}")}


def login():
    r = http("POST", "/api/auth/login", body={"email": "ADMIN", "password": "admin1234"})
    return r["json"]["access_token"]


async def reset(db):
    """Clean prior state of this cluster."""
    # 1. Clear cluster tracking + sessions + history
    trackings = (await db.execute(
        select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == CLUSTER)
    )).scalars().all()
    for t in trackings:
        await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == t.id))
        await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == t.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.id == t.id))
    # 2. Un-plan POs
    pos = (await db.execute(
        select(ProjectPO).where(
            ProjectPO.cluster_site == CLUSTER,
            ProjectPO.work_type == "PAC",
        )
    )).scalars().all()
    for po in pos:
        po.planned_dte_codes = None
        po.planned_dte_names = None
        po.workflow_status = "AUTO_MAPPED"
        po.approved_at = None
    # 3. Clear clock sessions
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code == CLUSTER)
    ))
    await db.commit()


async def main():
    print(f"\n👤 DTE  : {DTE_NAME} ({DTE_CODE})")
    print(f"📡 CLUSTER: {CLUSTER}")

    async with SessionLocal() as db:
        await reset(db)
        print("🧹 Reset prior state\n")

    token = login()

    # ═══════════════════════════════════════════════════════════════
    # STEP ① Plan DTE cluster-level (new API)
    # ═══════════════════════════════════════════════════════════════
    print("━━━ ① POST /api/presite/cluster-plan ━━━")
    r = http("POST", "/api/presite/cluster-plan", token=token, body={
        "cluster_key": CLUSTER,
        "dte_code": DTE_CODE,
        "dte_name": DTE_NAME,
    })
    assert r["status"] == 200, f"cluster-plan failed: {r}"
    result = r["json"]
    print(f"  ✓ pos_updated   = {result['pos_updated']}")
    print(f"  ✓ tracking_id   = {result['tracking_id']}")
    print(f"  ✓ tracking_stage= {result['tracking_stage']}")
    tracking_id = result["tracking_id"]
    assert result["pos_updated"] == 10, f"expected 10 POs assigned, got {result['pos_updated']}"
    assert result["tracking_stage"] == "FULL_ONAIR"

    # ═══════════════════════════════════════════════════════════════
    # STEP ② Clock-in at CLUSTER NAME (not per-DU)
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ② ClockApp PER_SITE clock-in at '{CLUSTER}' ━━━")
    async with SessionLocal() as db:
        now_in = datetime.now(timezone.utc) - timedelta(hours=5)
        session = ClockSession(
            employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
            site_code=CLUSTER, site_name=CLUSTER,
            clock_in_at=now_in, lat_in=13.0, lng_in=101.0, status="ACTIVE",
        )
        db.add(session)
        await db.flush()
        linked = await auto_link_tracking_on_clockin(db, session)
        await db.commit()
        print(f"  ✓ Clock-in session #{session.id}, auto_link linked={linked} (deduplicated to 1 cluster)")

        t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        assert t.current_stage == "DT_STARTED"
        sessions = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        )).scalars().all()
        assert len(sessions) == 1 and sessions[0].status == "IN_PROGRESS"
        print(f"  ✓ Cluster tracking #{tracking_id} stage=DT_STARTED, 1 session IN_PROGRESS")

        # ═══════════════════════════════════════════════════════════
        # STEP ③ Clock-out COMPLETE (1 cycle covers all DUs)
        # ═══════════════════════════════════════════════════════════
        print(f"\n━━━ ③ Clock-out COMPLETE (covers all 10 DUs) ━━━")
        session.clock_out_at = now_in + timedelta(hours=4)
        session.lat_out = 13.0; session.lng_out = 101.0
        session.outcome = "COMPLETE"; session.status = "CLOSED"
        await db.flush()
        promoted = await auto_promote_to_presite(db, session, "COMPLETE")
        await db.commit()

        t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        sessions = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        )).scalars().all()
        assert t.current_stage == "DT_DONE"
        assert sessions[0].status == "DONE" and sessions[0].ended_at is not None
        print(f"  ✓ Cluster tracking → stage=DT_DONE")
        print(f"  ✓ Session round 1: status=DONE, ended_at set")

    # ═══════════════════════════════════════════════════════════════
    # STEP ④ Report Done via API
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ④ POST advance report-done ━━━")
    r = http("POST", f"/api/presite/tracking/{tracking_id}/advance", token=token,
             body={"action": "report-done", "notes": "PAC cluster report submitted"})
    assert r["status"] == 200 and r["json"]["current_stage"] == "REPORT_DONE"
    print(f"  ✓ stage = REPORT_DONE")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑤ Check Pass via API
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑤ POST advance check-pass ━━━")
    r = http("POST", f"/api/presite/tracking/{tracking_id}/advance", token=token,
             body={"action": "check-pass", "notes": "All 10 DUs verified OK"})
    assert r["status"] == 200 and r["json"]["current_stage"] == "ACE_APPROVED"
    print(f"  ✓ stage = ACE_APPROVED (completed_at set)")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑥ Billing handoff verification
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑥ GET /billing-pos — billing handoff ━━━")
    r = http("GET", f"/api/presite/tracking/{tracking_id}/billing-pos", token=token)
    pos = r["json"]["data"]
    print(f"  ✓ {len(pos)} billing items ready for handoff:")
    print()
    print(f"     {'PO ID':>6}  {'DU':<10} {'HW ID':<22} {'Amount':>11}  {'Terms':<6}")
    print(f"     {'─'*6}  {'─'*10} {'─'*22} {'─'*11}  {'─'*6}")
    total = 0.0
    for p in pos:
        amt = p.get("line_amount")
        if amt: total += float(amt)
        print(f"     {p['po_id']:>6}  {p['du_id']:<10} {(p.get('hw_id') or '—'):<22} {(f'{float(amt):,.0f}' if amt else '—'):>11}  {(p.get('payment_terms') or '—'):<6}")
    print(f"     {'─'*6}  {'─'*10} {'─'*22} {'─'*11}")
    print(f"     {'TOTAL':>33} {(f'฿{total:,.0f}' if total else '—'):>11}")
    assert len(pos) == 10, "expected 10 billing POs"

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑦ Tracking summary
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑦ Final tracking summary ━━━")
    async with SessionLocal() as db:
        t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        hist = (await db.execute(
            select(DtePresiteHistory).where(DtePresiteHistory.tracking_id == tracking_id)
            .order_by(DtePresiteHistory.at)
        )).scalars().all()
        print(f"  🎯 tracking #{t.id}  work_type={t.work_type}  cluster_key={t.cluster_key}")
        print(f"     stage={t.current_stage}  completed_at={t.completed_at and 'set' or 'null'}")
        print(f"     full_onair_at={t.full_onair_at.strftime('%Y-%m-%d %H:%M') if t.full_onair_at else '—'}")
        print(f"     dt_started_at={t.dt_started_at.strftime('%H:%M') if t.dt_started_at else '—'}  dt_done_at={t.dt_done_at.strftime('%H:%M') if t.dt_done_at else '—'}")
        print(f"  📜 History ({len(hist)} events):")
        for h in hist:
            print(f"     • {h.action:24} {h.stage:14} by {h.actor_code}")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑧ Cleanup
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑧ Cleanup ━━━")
    async with SessionLocal() as db:
        await reset(db)
    print(f"  ✓ artifacts removed\n")

    print("🎉 EAS-FLASH-POC E2E PASSED")
    print("   1 cluster plan ‹fanout›  10 POs assigned  1 tracking row")
    print("   1 clock-in/out cycle ‹covers› 10 DUs  →  DT_DONE")
    print("   2 API advances ‹report→pass›  →  ACE_APPROVED")
    print("   10 child POs returned by /billing-pos for accounting handoff")


if __name__ == "__main__":
    asyncio.run(main())
