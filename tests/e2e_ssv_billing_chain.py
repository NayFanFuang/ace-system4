"""E2E — SSV Billing Chain: DU-level tracking + HW ID traceability

Goal: verify 1 SSV billable = 1 DU + 1 item_dis row, with full chain back to HW ID
for billing handoff. Specifically tests:

  ① Import 2 PO lines for SAME cluster (EAS9999-SSOA-CHAIN) but DIFFERENT DUs
     → 2 separate tracking rows (not collapsed into 1)
  ② Clock-in using DU code (not cluster) → correct tracking row matched
  ③ All billing fields populated: du_id, item_dis, hw_id, line_amount, payment_terms
  ④ API returns billing-ready data with HW ID for accounting handoff

Run: docker exec ace-system-backend python -m tests.e2e_ssv_billing_chain
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

# Same cluster, different DUs (=2 SSV billable items)
CLUSTER = "EAS9999-SSV-CHAIN"
PO_NUM_1 = "1051HG-E2E-BILL-001"
PO_NUM_2 = "1051HG-E2E-BILL-002"
PO_LINE_1 = "999100100100100100001"   # 21-digit HW ID style
PO_LINE_2 = "999100100100100100002"
DU_1 = "TESTDU777"
DU_2 = "TESTDU888"
HW_ID_1 = "999100100100100100001"
HW_ID_2 = "999100100100100100002"


# ───────── HTTP + multipart ─────────
def http(method, path, token=None, body=None, raw_body=None, content_type="application/json"):
    url = f"{API_BASE}{path}"
    if raw_body is not None:
        data, headers = raw_body, {"Content-Type": content_type}
    elif body is not None:
        data, headers = json.dumps(body).encode(), {"Content-Type": "application/json"}
    else:
        data, headers = None, {}
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
    return r["json"]["access_token"]


def build_multipart(filename, file_bytes):
    boundary = "----E2EBoundary999777"
    crlf = "\r\n"
    parts = [
        f"--{boundary}",
        f'Content-Disposition: form-data; name="file"; filename="{filename}"',
        "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "",
        file_bytes.decode("latin-1"),
        f"--{boundary}--",
        "",
    ]
    return crlf.join(parts).encode("latin-1"), f"multipart/form-data; boundary={boundary}"


def build_excel_2rows():
    """Build HW Excel with 2 SSV PO lines for SAME cluster but DIFFERENT DUs."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append([
        "Project Code", "Site Code", "PO NO.", "PO Line NO.", "PO Status",
        "Site ID", "Item Description", "Line Amount", "Payment Terms",
        "Acceptance Date", "ID",
    ])
    # Row 1: DU = TESTDU777, 2-layer test
    ws.append([
        "HWT2304", CLUSTER, PO_NUM_1, PO_LINE_1, "OPEN",
        DU_1,
        "B_Single Site Verification for 2 layer_2 sector for Macro site Scenario",
        50000.0,
        "AC1 (30%) AC2 (70%)",
        "2026-05-22", HW_ID_1,
    ])
    # Row 2: DU = TESTDU888, 3-layer test (different DU, different item_dis)
    ws.append([
        "HWT2304", CLUSTER, PO_NUM_2, PO_LINE_2, "OPEN",
        DU_2,
        "B_Single Site Verification for 3 layer_2 sector for Macro site Scenario",
        75000.0,
        "AC1 (30%) AC2 (70%)",
        "2026-05-22", HW_ID_2,
    ])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def reset(db):
    pos = (await db.execute(
        select(ProjectPO).where(or_(
            ProjectPO.po_number.in_([PO_NUM_1, PO_NUM_2]),
            ProjectPO.hw_id.in_([HW_ID_1, HW_ID_2]),
            ProjectPO.du_id.in_([DU_1, DU_2]),
        ))
    )).scalars().all()
    for po in pos:
        rows = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.po_id == po.id))).scalars().all()
        for r in rows:
            await db.execute(delete(DtePresiteHistory).where(DtePresiteHistory.tracking_id == r.id))
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == r.id))
        await db.execute(delete(DtePresiteTracking).where(DtePresiteTracking.po_id == po.id))
        await db.execute(delete(ProjectPO).where(ProjectPO.id == po.id))
    await db.execute(delete(ClockSession).where(
        and_(ClockSession.employee_code == DTE_CODE, ClockSession.site_code.in_([DU_1, DU_2, CLUSTER]))
    ))
    await db.commit()


async def main():
    print(f"\n👤 DTE: {DTE_NAME} ({DTE_CODE})")
    print(f"📦 Cluster: {CLUSTER}")
    print(f"   PO 1: {PO_NUM_1}/{PO_LINE_1}  DU={DU_1}  hw_id={HW_ID_1}")
    print(f"   PO 2: {PO_NUM_2}/{PO_LINE_2}  DU={DU_2}  hw_id={HW_ID_2}")

    async with SessionLocal() as db:
        await reset(db)
        print("🧹 Reset prior test artifacts")

    # ═══════════════════════════════════════════════════════════════
    # STEP ① Import 2 PO lines via HW Excel
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ ① Import 2 SSV PO lines via /api/project-pos/import-hw ━━━")
    token = login("ADMIN", "admin1234")
    xlsx = build_excel_2rows()
    body, ctype = build_multipart("ssv_2du.xlsx", xlsx)
    r = http("POST", "/api/project-pos/import-hw", token=token, raw_body=body, content_type=ctype)
    assert r["status"] == 200, r
    assert r["json"]["imported"] == 2, f"expected 2 imported, got {r['json']}"
    print(f"  ✓ Imported 2 PO lines")

    async with SessionLocal() as db:
        pos = (await db.execute(
            select(ProjectPO).where(ProjectPO.po_number.in_([PO_NUM_1, PO_NUM_2]))
            .order_by(ProjectPO.po_number)
        )).scalars().all()
        assert len(pos) == 2
        for po in pos:
            print(f"  ✓ PO #{po.id} {po.po_number} du={po.du_id} hw_id={po.hw_id} work_type={po.work_type}")
            assert po.hw_id, "hw_id must be populated on import"
            assert po.du_id, "du_id must be populated"

    # ═══════════════════════════════════════════════════════════════
    # STEP ② Plan DTE — assign both POs to Chatchai
    # ═══════════════════════════════════════════════════════════════
    print("\n━━━ ② Plan DTE: assign both POs to Chatchai ━━━")
    async with SessionLocal() as db:
        for po in pos:
            po_db = (await db.execute(select(ProjectPO).where(ProjectPO.id == po.id))).scalar_one()
            po_db.planned_dte_codes = DTE_CODE
            po_db.planned_dte_names = DTE_NAME
            po_db.site_code = po_db.cluster_site
            po_db.workflow_status = "LEADER_APPROVED"
            po_db.approved_at = datetime.now(timezone.utc) - timedelta(hours=8)
        await db.commit()
        print(f"  ✓ 2 POs assigned to {DTE_NAME}")

    # ═══════════════════════════════════════════════════════════════
    # STEP ③ ClockApp DU-level — DTE clocks into DU_1 only
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ③ ClockApp: DTE clocks into DU '{DU_1}' (not cluster) ━━━")
    async with SessionLocal() as db:
        now_in = datetime.now(timezone.utc) - timedelta(hours=5)
        session1 = ClockSession(
            employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in.date(),
            site_code=DU_1, site_name=DU_1,
            clock_in_at=now_in, lat_in=13.0, lng_in=101.0, status="ACTIVE",
        )
        db.add(session1)
        await db.flush()
        linked = await auto_link_tracking_on_clockin(db, session1)
        await db.commit()
        print(f"  ✓ Clock-in DU={DU_1} → auto_link linked={linked}")
        assert linked == 1, f"DU-exact match should link exactly 1 PO (got {linked})"

        # The matched tracking should be PO 1 (DU_1), NOT PO 2 (DU_2)
        trackings = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id.in_([p.id for p in pos]))
            .order_by(DtePresiteTracking.id)
        )).scalars().all()
        assert len(trackings) == 1, f"only 1 tracking should be seeded (the DU_1 one)"
        t1 = trackings[0]
        po1 = next(p for p in pos if p.po_number == PO_NUM_1)
        assert t1.po_id == po1.id, f"wrong PO matched! expected {po1.id}, got {t1.po_id}"
        assert t1.du_id == DU_1
        assert t1.hw_id == HW_ID_1
        assert t1.work_type == "SSV"
        print(f"  ✓ Tracking #{t1.id} matched ONLY PO {PO_NUM_1} (du={t1.du_id} hw_id={t1.hw_id})")

        # Clock out COMPLETE
        session1.clock_out_at = now_in + timedelta(hours=4)
        session1.lat_out = 13.0; session1.lng_out = 101.0
        session1.outcome = "COMPLETE"; session1.status = "CLOSED"
        await db.flush()
        await auto_promote_to_presite(db, session1, "COMPLETE")
        await db.commit()
        await db.refresh(t1)
        assert t1.current_stage == "DT_DONE"
        print(f"  ✓ Clock-out COMPLETE → DT_DONE")

    # ═══════════════════════════════════════════════════════════════
    # STEP ④ Now clock into DU_2 separately
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ④ ClockApp: DTE clocks into DU '{DU_2}' (second site) ━━━")
    async with SessionLocal() as db:
        now_in2 = datetime.now(timezone.utc) - timedelta(hours=2)
        session2 = ClockSession(
            employee_code=DTE_CODE, clock_type="PER_SITE", work_date=now_in2.date(),
            site_code=DU_2, site_name=DU_2,
            clock_in_at=now_in2, lat_in=13.0, lng_in=101.0, status="ACTIVE",
        )
        db.add(session2)
        await db.flush()
        await auto_link_tracking_on_clockin(db, session2)
        await db.commit()

        # Now there should be 2 separate tracking rows
        trackings = (await db.execute(
            select(DtePresiteTracking).where(DtePresiteTracking.po_id.in_([p.id for p in pos]))
            .order_by(DtePresiteTracking.id)
        )).scalars().all()
        assert len(trackings) == 2, f"expected 2 tracking rows (one per DU), got {len(trackings)}"
        t2 = next(t for t in trackings if t.du_id == DU_2)
        po2 = next(p for p in pos if p.po_number == PO_NUM_2)
        assert t2.po_id == po2.id
        assert t2.hw_id == HW_ID_2
        print(f"  ✓ Second tracking #{t2.id} for DU={t2.du_id} hw_id={t2.hw_id}")
        print(f"  ✓ Total: 2 separate tracking rows for 2 DUs in same cluster")

        # Complete PO 2
        session2.clock_out_at = now_in2 + timedelta(hours=2)
        session2.outcome = "COMPLETE"; session2.status = "CLOSED"
        await db.flush()
        await auto_promote_to_presite(db, session2, "COMPLETE")
        await db.commit()
        t1_id, t2_id = t1.id, t2.id

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑤ Advance both → ACE_APPROVED
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑤ Advance both trackings → REPORT_DONE → ACE_APPROVED ━━━")
    for tid in (t1_id, t2_id):
        r = http("POST", f"/api/presite/tracking/{tid}/advance", token=token,
                 body={"action": "report-done", "notes": "report done"})
        assert r["status"] == 200
        r = http("POST", f"/api/presite/tracking/{tid}/advance", token=token,
                 body={"action": "check-pass", "notes": "pass"})
        assert r["status"] == 200
        assert r["json"]["current_stage"] == "ACE_APPROVED"
        print(f"  ✓ Tracking #{tid} → ACE_APPROVED")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑥ Billing-Ready API: verify each row has full chain
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑥ Billing handoff verification via API ━━━")
    r = http("GET", "/api/presite/tracking", token=token)
    rows = r["json"]["data"]
    test_rows = [x for x in rows if x["id"] in (t1_id, t2_id)]
    assert len(test_rows) == 2
    for tr in sorted(test_rows, key=lambda x: x["id"]):
        print(f"\n  📋 Billing Record — tracking #{tr['id']}")
        print(f"     work_type      = {tr['work_type']}")
        print(f"     site (cluster) = {tr['site_code']}")
        print(f"     DU (du_id)     = {tr['du_id']}")
        print(f"     HW ID          = {tr['hw_id']}")
        print(f"     PO Number      = {tr['po_number']}")
        print(f"     PO Line        = {tr['po_line']}")
        print(f"     Line Amount    = {tr['line_amount']}")
        print(f"     Payment Terms  = {tr['payment_terms']}")
        print(f"     item_dis       = {(tr.get('item_dis') or '')[:70]}…")
        print(f"     stage          = {tr['current_stage']} (completed={tr['completed_at'] and 'yes' or 'no'})")
        # All billing fields must be populated
        for k in ("du_id", "hw_id", "po_number", "po_line", "line_amount", "payment_terms", "item_dis"):
            assert tr.get(k), f"billing field missing: {k}"
        assert tr["current_stage"] == "ACE_APPROVED"
        assert tr["completed_at"] is not None

    print(f"\n  ✓ Both trackings are billing-ready with full HW ID chain")

    # ═══════════════════════════════════════════════════════════════
    # STEP ⑦ Cleanup
    # ═══════════════════════════════════════════════════════════════
    print(f"\n━━━ ⑦ Cleanup ━━━")
    async with SessionLocal() as db:
        await reset(db)
    print(f"  ✓ Test artifacts removed")

    print(f"\n🎉 SSV BILLING CHAIN E2E PASSED")
    print(f"   1 Cluster ({CLUSTER}) → 2 DUs ({DU_1}, {DU_2}) → 2 tracking rows")
    print(f"   Each tracking links back to its own PO + HW ID for billing")


if __name__ == "__main__":
    asyncio.run(main())
