"""E2E — Wipada (ACECS434) full lifecycle across 3 pages, both SSV + PAC.

Pages exercised:
  /ClockApp                  → clock-in / clock-out  (auto_link + auto_promote hooks)
  /project/report-upload     → POST /tracking/{id}/upload-report  (FTP stubbed — prod-safe)
  /project/presite-monitor   → GET /presite/tracking, POST /tracking/{id}/advance

Lifecycle per work type:
  FULL_ONAIR → (clock-in) DT_STARTED → (clock-out) DT_DONE
            → (report-upload) REPORT_DONE → (check-pass) ACE_APPROVED
  + SSV rework path: check-fail → CHECKING → re-clock round 2

Run: docker exec ace-system-backend python -m tests.e2e_wipada_full_lifecycle
Self-cleaning — resets both trackings to FULL_ONAIR and removes test data.
"""
import asyncio
import io
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete, and_
from starlette.datastructures import UploadFile, Headers

from app.database import SessionLocal
from app.models.clock import ClockSession
from app.models.presite_tracking import DtePresiteTracking, DtePresiteHistory, DtePresiteSession
import app.routers.presite_monitor as pm

API = "http://localhost:8000"
DTE = "ACECS434"
NAME = "Wipada Srisurad"

SSV = {"tid": None, "po_id": 1279, "site": "CBR7523",          "label": "SSV CBR7523_NewSite_East R3"}
PAC = {"tid": None, "po_id": 482,  "site": "EAS0049-SSOA-1",   "label": "PAC EAS0049-SSOA-1"}


# ── HTTP helper ─────────────────────────────────────────────────────
def http(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def login():
    s, j = http("POST", "/api/auth/login", body={"email": "ADMIN", "password": "admin1234"})
    assert s == 200, f"login failed {s} {j}"
    return j["access_token"]


# ── in-process clock cycle (ClockApp) ───────────────────────────────
async def clock_in(db, site, hours_ago=2):
    now_in = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    sess = ClockSession(
        employee_code=DTE, clock_type="PER_SITE", work_date=now_in.date(),
        site_code=site, site_name=site, clock_in_at=now_in,
        lat_in=13.0, lng_in=101.0, status="ACTIVE",
    )
    db.add(sess); await db.flush()
    linked = await pm.auto_link_tracking_on_clockin(db, sess)
    await db.commit()
    return sess, linked


async def clock_out(db, sess, hours=2):
    sess.clock_out_at = sess.clock_in_at + timedelta(hours=hours)
    sess.lat_out = 13.0; sess.lng_out = 101.0
    sess.outcome = "COMPLETE"; sess.status = "CLOSED"
    await db.flush()
    await pm.auto_promote_to_presite(db, sess, "COMPLETE")
    await db.commit()


async def tracking_for(db, po_id, work_type):
    if work_type == "PAC":
        po = (await db.execute(select(pm.ProjectPO).where(pm.ProjectPO.id == po_id))).scalar_one()
        return (await db.execute(select(DtePresiteTracking).where(
            DtePresiteTracking.cluster_key == po.cluster_site))).scalar_one()
    return (await db.execute(select(DtePresiteTracking).where(
        DtePresiteTracking.po_id == po_id))).scalar_one()


# ── in-process report-upload (/project/report-upload) with FTP stubbed ──
async def upload_report_inproc(db, tid):
    orig_cfg, orig_up = pm.ftp_service.is_configured, pm.ftp_service.upload_report_sync
    pm.ftp_service.is_configured = lambda: True
    pm.ftp_service.upload_report_sync = lambda tmp, dt_date, fname: f"/1_Logfile DT Day/_E2E/{fname}"
    try:
        content = b"Rar!\x1a\x07\x00" + b"E2E-TEST-REPORT" * 64  # fake .rar payload
        upload = UploadFile(
            file=io.BytesIO(content),
            filename="ace_e2e_report.rar",
            headers=Headers({"content-type": "application/x-rar-compressed"}),
        )
        payload = {"employee_code": DTE, "sub": DTE, "role": "EMPLOYEE", "name": NAME}
        return await pm.upload_report(tracking_id=tid, file=upload, payload=payload, db=db)
    finally:
        pm.ftp_service.is_configured = orig_cfg
        pm.ftp_service.upload_report_sync = orig_up


async def run_lifecycle(token, spec, rework=False):
    print(f"\n━━━ {spec['label']} ━━━")
    async with SessionLocal() as db:
        t = await tracking_for(db, spec["po_id"], "PAC" if "PAC" in spec["label"] else "SSV")
        spec["tid"] = t.id
        assert t.current_stage == "FULL_ONAIR", f"expected FULL_ONAIR start, got {t.current_stage}"
        print(f"  start: tracking #{t.id} stage=FULL_ONAIR")

        # /ClockApp — clock-in
        sess, linked = await clock_in(db, spec["site"])
        assert linked >= 1, "clock-in failed to link tracking"
        await db.refresh(t)
        assert t.current_stage == "DT_STARTED", f"got {t.current_stage}"
        print(f"  /ClockApp clock-in  → DT_STARTED (linked={linked})")

        # /ClockApp — clock-out
        await clock_out(db, sess)
        await db.refresh(t)
        assert t.current_stage == "DT_DONE", f"got {t.current_stage}"
        print(f"  /ClockApp clock-out → DT_DONE")

        # /project/report-upload
        res = await upload_report_inproc(db, t.id)
        await db.refresh(t)
        assert res["ok"] and res["version"] == 1, res
        assert t.current_stage == "REPORT_DONE", f"got {t.current_stage}"
        assert t.report_filename == "ace_e2e_report.rar" and t.report_file_size > 0
        print(f"  /report-upload upload → REPORT_DONE (v{res['version']}, {res['size']}B, owner=Wipada)")

    # /project/presite-monitor — board reflects REPORT_DONE
    s, j = http("GET", f"/api/presite/tracking?dte={DTE}", token=token)
    row = next((r for r in j["data"] if r["id"] == spec["tid"]), None)
    assert row and row["current_stage"] == "REPORT_DONE", row
    print(f"  /presite-monitor board shows stage=REPORT_DONE ✓")

    if rework:
        # check-fail → CHECKING, then re-clock = round 2
        s, j = http("POST", f"/api/presite/tracking/{spec['tid']}/advance", token=token,
                    body={"action": "check-fail", "notes": "E2E rework: missing layer"})
        assert s == 200 and j["current_stage"] == "CHECKING", (s, j)
        print(f"  /presite-monitor check-fail → CHECKING (rework)")
        async with SessionLocal() as db:
            t = await tracking_for(db, spec["po_id"], "SSV")
            sess2, _ = await clock_in(db, spec["site"], hours_ago=1)
            await clock_out(db, sess2, hours=1)
            rounds = (await db.execute(select(DtePresiteSession)
                      .where(DtePresiteSession.tracking_id == t.id)
                      .order_by(DtePresiteSession.round_number))).scalars().all()
            assert len(rounds) == 2 and rounds[0].check_result == "FAIL", \
                f"expected round1 FAIL + round2, got {[(r.round_number, r.check_result) for r in rounds]}"
            print(f"  /ClockApp re-clock → round 2 created (round1=FAIL)")
        # re-report then pass
        s, j = http("POST", f"/api/presite/tracking/{spec['tid']}/advance", token=token,
                    body={"action": "report-done", "notes": "re-report"})
        assert s == 200 and j["current_stage"] == "REPORT_DONE", (s, j)
        print(f"  /presite-monitor report-done (round 2) → REPORT_DONE")

    # check-pass → ACE_APPROVED
    s, j = http("POST", f"/api/presite/tracking/{spec['tid']}/advance", token=token,
                body={"action": "check-pass", "notes": "E2E approved"})
    assert s == 200 and j["current_stage"] == "ACE_APPROVED", (s, j)
    print(f"  /presite-monitor check-pass → ACE_APPROVED ✓")


async def cleanup(spec_list):
    async with SessionLocal() as db:
        for spec in spec_list:
            tid = spec["tid"]
            if not tid:
                continue
            await db.execute(delete(DtePresiteSession).where(DtePresiteSession.tracking_id == tid))
            await db.execute(delete(DtePresiteHistory).where(and_(
                DtePresiteHistory.tracking_id == tid,
                DtePresiteHistory.action != "auto-seed")))
            await db.execute(delete(ClockSession).where(and_(
                ClockSession.employee_code == DTE, ClockSession.site_code == spec["site"])))
            t = (await db.execute(select(DtePresiteTracking).where(DtePresiteTracking.id == tid))).scalar_one()
            t.current_stage = "FULL_ONAIR"
            for f in ("dt_started_at", "dt_started_by", "dt_done_at", "dt_done_by",
                      "report_done_at", "report_done_by", "report_file_path", "report_filename",
                      "report_file_size", "report_uploaded_at", "report_uploaded_by",
                      "check_at", "check_by", "check_result", "check_notes", "completed_at"):
                setattr(t, f, None)
            t.report_version = 0; t.rework_count = 0; t.total_rounds = 1 if "SSV" in spec["label"] else 0
        await db.commit()
    print("\n  ✓ cleanup — both trackings reset to FULL_ONAIR, test data removed")


async def main():
    token = login()
    print(f"✓ admin login ({len(token)} chars)")
    await run_lifecycle(token, SSV, rework=True)   # SSV: full + rework round 2
    await run_lifecycle(token, PAC, rework=False)  # PAC: straight-through
    await cleanup([SSV, PAC])
    print("\n🎉 E2E PASSED — Wipada SSV + PAC across /ClockApp, /report-upload, /presite-monitor")


if __name__ == "__main__":
    asyncio.run(main())
