"""E2E Full Chain — PO Import → Plan DTE → ClockApp → Pre-Site Monitor

Walks the complete Pre-Site lifecycle from raw Excel upload to ACE_APPROVED:

  ① /finance/po-import      → POST /api/project-pos/import-hw      → project_pos
  ② /project/rf-monitor     → assign DTE + site_code               → planned_dte_codes
  ③ /ClockApp               → POST /api/clock/in + /api/clock/out  → clock_sessions + auto-seed tracking
  ④ /project/presite-monitor→ POST /api/presite/tracking/{id}/advance → DT_DONE → REPORT_DONE → ACE_APPROVED

Run: docker exec ace-system-backend python -m tests.e2e_full_chain
"""
import asyncio
import io
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

import openpyxl
from sqlalchemy import select, delete, and_, or_

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

# Test PO identifiers (won't collide with real data)
TEST_PO_NUMBER = "1051HG-E2E-CHAIN-001"
TEST_PO_LINE   = "999001"
TEST_HW_ID     = "999000000000000000001"
TEST_SITE_CODE = "EAS9999-SSOA-CHAIN"  # full cluster site name (Site Code in HW)


# ───────── HTTP helper ─────────
def http(method, path, token=None, body=None, raw_body=None, content_type="application/json"):
    url = f"{API_BASE}{path}"
    if raw_body is not None:
        data = raw_body
        headers = {"Content-Type": content_type}
    elif body is not None:
        data = json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
    else:
        data = None
        headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            txt = r.read().decode()
            return {"status": r.status, "json": json.loads(txt) if txt else None}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "json": json.loads(e.read().decode() or "{}")}


def login(email, password):
    r = http("POST", "/api/auth/login", body={"email": email, "password": password})
    assert r["status"] == 200, f"login failed: {r}"
    return r["json"]["access_token"]


def build_multipart(filename, file_bytes):
    """Minimal multipart/form-data body for one file field 'file'."""
    boundary = "----E2EBoundary8675309"
    crlf = "\r\n"
    parts = [
        f"--{boundary}",
        f'Content-Disposition: form-data; name="file"; filename="{filename}"',
        "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "",
        file_bytes.decode("latin-1"),  # binary in latin-1 round-trips bytes
        f"--{boundary}--",
        "",
    ]
    body = crlf.join(parts).encode("latin-1")
    return body, f"multipart/form-data; boundary={boundary}"


def build_test_excel():
    """Build a 1-row HW-format Excel that import-hw will accept."""
    wb = openpyxl.Workbook()
    ws = wb.active
    headers = [
        "Project Code", "Site Code", "PO NO.", "PO Line NO.", "PO Status",
        "Site ID", "Item Description", "Line Amount", "Payment Terms",
        "Acceptance Date", "ID",
    ]
    ws.append(headers)
    ws.append([
        "HWT2304",
        TEST_SITE_CODE,
        TEST_PO_NUMBER,
        TEST_PO_LINE,
        "OPEN",
        "EAS9999",
        "B_Cluster DT Optimization for 8 layer test (E2E chain)",
        100000.0,
        "AC1 (30%) AC2 (70%)",
        "2026-05-21",
        TEST_HW_ID,
    ])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ───────── Test data cleanup ─────────
async def reset(db):
    # 1. delete PAC tracking by cluster_key (PAC tracking has po_id=NULL)
    pac_trackings = (await db.execute(
        select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == TEST_SITE_CODE)
    )).scalars().all()
    for t in pac_trackings:
        await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == t.id))
        await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == t.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.id == t.id))
    # 2. delete SSV tracking by po_id, then delete POs
    pos = (await db.execute(
        select(ProjectPO).where(or_(
            ProjectPO.po_number == TEST_PO_NUMBER,
            ProjectPO.hw_id == TEST_HW_ID,
        ))
    )).scalars().all()
    for po in pos:
        rows = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id == po.id)
        )).scalars().all()
        for r in rows:
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == r.id))
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == r.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.po_id == po.id))
        await db.execute(delete(ProjectPO).where(ProjectPO.id == po.id))
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code == TEST_SITE_CODE)
    ))
    await db.commit()


# ───────── Main ─────────
async def main():
    print(f"\n👤 Test DTE: {DTE_NAME} ({DTE_CODE})")
    print(f"📦 Test PO:  {TEST_PO_NUMBER}/{TEST_PO_LINE}  site={TEST_SITE_CODE}")

    async with SessionLocal() as db:
        await reset(db)
        print("🧹 Reset prior test artifacts")

    # ═══════════════════════════════════════════════════════════════
    # STEP ①: PO Import (finance/po-import)
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ① PO Import via /api/project-pos/import-hw ━━━")
    token = login("ADMIN", "admin1234")
    xlsx_bytes = build_test_excel()
    body, ctype = build_multipart("test_po.xlsx", xlsx_bytes)
    r = http("POST", "/api/project-pos/import-hw", token=token, raw_body=body, content_type=ctype)
    assert r["status"] == 200, f"import-hw failed: {r}"
    result = r["json"]
    print(f"  ✓ Import result: imported={result.get('imported', 0)} updated={result.get('updated', 0)} skipped={result.get('skipped', 0)} errors={result.get('errors', 0)}")
    assert result.get("imported", 0) == 1, f"expected exactly 1 PO imported, got {result}"
    imp = result["imported_rows"][0]
    print(f"  ✓ Imported PO: {imp['po_number']}/{imp['po_line']} work_type={imp['work_type']} ace_project={imp.get('ace_project_code')}")

    # Verify DB state
    async with SessionLocal() as db:
        po = (await db.execute(select(ProjectPO).where(ProjectPO.po_number == TEST_PO_NUMBER))).scalar_one_or_none()
        assert po, "PO not found in project_pos table"
        assert po.work_type == "PAC", f"expected PAC (SSOA cluster), got {po.work_type}"  # SSOA → PAC
        assert po.ace_project_code == "HWT2304"
        po_id = po.id
        print(f"  ✓ DB: project_pos row #{po_id} work_type=PAC ace_project=HWT2304 workflow_status={po.workflow_status}")

    # ═══════════════════════════════════════════════════════════════
    # STEP ②: Plan DTE (rf-monitor — simulated via direct DB update)
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ② Plan DTE — assign Chatchai + set Day 0 (Full On-Air) ━━━")
    async with SessionLocal() as db:
        po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one()
        po.site_code = TEST_SITE_CODE       # required for auto_link
        po.planned_dte_codes = DTE_CODE
        po.planned_dte_names = DTE_NAME
        po.workflow_status = "LEADER_APPROVED"
        po.approved_at = datetime.now(timezone.utc) - timedelta(hours=10)  # Day 0
        await db.commit()
        print(f"  ✓ PO #{po_id} planned to {DTE_NAME} ({DTE_CODE})")
        print(f"  ✓ workflow_status=LEADER_APPROVED, approved_at={po.approved_at.strftime('%Y-%m-%d %H:%M')}")

    # ═══════════════════════════════════════════════════════════════
    # STEP ③: ClockApp clock-in + clock-out (DTE on site)
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ③ ClockApp PER_SITE clock-in/out ━━━")
    async with SessionLocal() as db:
        # 3a. Clock-in
        now_in = datetime.now(timezone.utc) - timedelta(hours=5)
        session = ClockSession(
            employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
            site_code=TEST_SITE_CODE, site_name=TEST_SITE_CODE,
            clock_in_at=now_in, lat_in=13.0, lng_in=101.0, status="ACTIVE",
        )
        db.add(session)
        await db.flush()
        linked = await auto_link_tracking_on_clockin(db, session)
        await db.commit()
        print(f"  ✓ Clock-in session #{session.id} → auto_link linked={linked}")
        assert linked == 1, "auto_link must link exactly 1 PO"

        # PAC tracking is cluster-level: po_id is NULL, lookup by cluster_key
        tracking = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.cluster_key == TEST_SITE_CODE)
        )).scalar_one_or_none()
        assert tracking, "PAC cluster tracking row must be auto-seeded"
        assert tracking.current_stage == "DT_STARTED"
        assert tracking.work_type == "PAC"
        assert tracking.po_id is None, "PAC tracking should have po_id=NULL (cluster-level)"
        print(f"  ✓ PAC cluster tracking #{tracking.id} stage=DT_STARTED cluster_key={tracking.cluster_key}")
        tracking_id = tracking.id

        sessions = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        )).scalars().all()
        assert len(sessions) == 1 and sessions[0].status == "IN_PROGRESS"
        print(f"  ✓ Session round 1 IN_PROGRESS started_at={sessions[0].started_at.strftime('%H:%M')}")

        # 3b. Clock-out COMPLETE
        session.clock_out_at = now_in + timedelta(hours=4)
        session.lat_out = 13.0; session.lng_out = 101.0
        session.outcome = "COMPLETE"; session.status = "CLOSED"
        await db.flush()
        promoted = await auto_promote_to_presite(db, session, "COMPLETE")
        await db.commit()
        print(f"  ✓ Clock-out COMPLETE → auto_promote promoted={promoted}")

        tracking = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        assert tracking.current_stage == "DT_DONE"
        sessions = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        )).scalars().all()
        assert sessions[0].ended_at is not None
        print(f"  ✓ Tracking → DT_DONE, round 1 ended_at={sessions[0].ended_at.strftime('%H:%M')}, status={sessions[0].status}")

    # ═══════════════════════════════════════════════════════════════
    # STEP ④: Pre-Site Monitor — verify visible + advance via API
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ④ Pre-Site Monitor: API visibility + advance ━━━")
    # 4a. List
    r = http("GET", "/api/presite/tracking", token=token)
    assert r["status"] == 200
    rows = r["json"]["data"]
    test_row = next((x for x in rows if x["id"] == tracking_id), None)
    assert test_row, "test tracking row missing from API"
    assert test_row["work_type"] == "PAC"
    assert test_row["current_stage"] == "DT_DONE"
    assert len(test_row["sessions"]) == 1
    print(f"  ✓ API /tracking returns tracking #{tracking_id} stage=DT_DONE sessions={len(test_row['sessions'])}")

    # 4b. report-done
    r = http("POST", f"/api/presite/tracking/{tracking_id}/advance", token=token,
             body={"action": "report-done", "notes": "E2E chain report"})
    assert r["status"] == 200, r
    assert r["json"]["current_stage"] == "REPORT_DONE"
    print(f"  ✓ POST advance report-done → stage=REPORT_DONE")

    # 4c. check-pass
    r = http("POST", f"/api/presite/tracking/{tracking_id}/advance", token=token,
             body={"action": "check-pass", "notes": "All layers verified"})
    assert r["status"] == 200, r
    assert r["json"]["current_stage"] == "ACE_APPROVED"
    print(f"  ✓ POST advance check-pass → stage=ACE_APPROVED (completed_at set)")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑤: Cross-page consistency snapshot
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ⑤ Cross-table consistency check ━━━")
    async with SessionLocal() as db:
        po = (await db.execute(select(ProjectPO).where(ProjectPO.id == po_id))).scalar_one()
        cs = (await db.execute(
            select(ClockSession).where(ClockSession.employee_code == DTE_CODE).order_by(ClockSession.id.desc()).limit(1)
        )).scalar_one()
        tr = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tracking_id))).scalar_one()
        sess = (await db.execute(
            select(DtePresiteSession).where(DtePresiteSession.tracking_id == tracking_id)
        )).scalars().all()
        hist = (await db.execute(
            select(DtePresiteHistory).where(DtePresiteHistory.tracking_id == tracking_id)
            .order_by(DtePresiteHistory.at)
        )).scalars().all()

        print(f"  📦 project_pos #{po.id}    {po.po_number}/{po.po_line}  work={po.work_type}  status={po.workflow_status}")
        cs_outcome = getattr(cs, "outcome", None)
        print(f"  ⏱  clock_sessions #{cs.id}  type={cs.clock_type}  outcome={cs_outcome}  status={cs.status}  site={cs.site_code}")
        print(f"  🎯 dte_presite_tracking #{tr.id}  stage={tr.current_stage}  completed_at={tr.completed_at and 'set' or 'null'}")
        for s in sess:
            print(f"     round {s.round_number}: status={s.status}  check={s.check_result}  by={s.check_by}")
        print(f"  📜 history events ({len(hist)}):")
        for h in hist:
            print(f"     • {h.action:18}  {h.stage:12}  by {h.actor_code}")

        # Assertions: full chain integrity
        # PAC: cluster-level tracking, po_id=NULL, link via cluster_key
        if tr.work_type == "PAC":
            assert tr.cluster_key == po.cluster_site, "PAC tracking must link via cluster_key"
        else:
            assert tr.po_id == po.id, "SSV tracking must link back to PO"
        assert tr.current_stage == "ACE_APPROVED", "lifecycle must reach ACE_APPROVED"
        assert tr.completed_at is not None
        assert len(sess) == 1 and sess[0].check_result == "PASS"
        # Expected history: auto-seed, pac-round-1-start, pac-round-1-end, report-done, check-pass
        actions = [h.action for h in hist]
        for expected in ("auto-seed", "report-done", "check-pass"):
            assert expected in actions, f"missing history event: {expected}"
        print(f"  ✓ all chain assertions passed")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑥: Cleanup
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ STEP ⑥ Cleanup ━━━")
    async with SessionLocal() as db:
        await reset(db)
    print("  ✓ Test artifacts removed")

    print("\n🎉 E2E FULL CHAIN PASSED")
    print(f"   ① PO Import   → 1 PO inserted via Excel upload")
    print(f"   ② Plan DTE    → assigned to {DTE_NAME}")
    print(f"   ③ Clock-in    → tracking auto-seeded (PAC)")
    print(f"   ④ Clock-out   → COMPLETE → DT_DONE")
    print(f"   ⑤ Report Done → REPORT_DONE via API")
    print(f"   ⑥ Check Pass  → ACE_APPROVED (full lifecycle verified)")


if __name__ == "__main__":
    asyncio.run(main())
