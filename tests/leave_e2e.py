"""End-to-end test harness for the Leave system.

Runs against the real DB in email dry-run mode, drives the router functions
directly with an admin payload, and prints [PASS]/[FAIL] per checklist item
(see docs/LEAVE_E2E_CHECKLIST.md). Self-cleaning.

    docker cp tests/leave_e2e.py ace-system-backend:/app/leave_e2e.py
    docker exec -e EMAIL_DRY_RUN=1 ace-system-backend python /app/leave_e2e.py
"""
import asyncio, os
os.environ["EMAIL_DRY_RUN"] = "1"
from datetime import date
from sqlalchemy import select, delete
from app.database import SessionLocal
from app.models.leave import LeaveRequest
from app.models.settings import SystemSetting
from app.models.email import EmailOutbox
from app.routers import leave as L
from app.services.leave_tokens import create_leave_token

EMP = "E2E_LEAVE"
ADMIN = {"role": "SUPER_ADMIN", "sub": "ADMIN", "employee_code": "ADMIN"}
MON = {"role": "HR_ADMIN", "sub": "HR-001", "employee_code": "HR-001"}

RESULTS = []
def check(cid, cond, detail=""):
    RESULTS.append((cid, bool(cond)))
    print(f"  [{'PASS' if cond else 'FAIL'}] {cid}: {detail}")


async def set_mode(db, mode):
    row = (await db.execute(select(SystemSetting).where(SystemSetting.key == "leave_chain_mode"))).scalar_one_or_none()
    if row: row.value = mode
    else: db.add(SystemSetting(key="leave_chain_mode", value=mode, label="Leave Approval Chain Mode"))
    await db.commit()

async def max_email_id(db):
    return (await db.execute(select(EmailOutbox.id).order_by(EmailOutbox.id.desc()).limit(1))).scalar() or 0

async def emails_since(db, since):
    rows = (await db.execute(select(EmailOutbox).where(EmailOutbox.id > since).order_by(EmailOutbox.id))).scalars().all()
    return [(r.recipient, r.subject) for r in rows]

async def mk(db, status, leave_type="Annual Leave", start=date(2026, 6, 15), end=date(2026, 6, 16), days=2.0, **kw):
    lv = LeaveRequest(employee_code=EMP, employee_name="E2E Tester", leave_type=leave_type,
                      session_type="Full Day", start_date=start, end_date=end, days=days,
                      reason="e2e", status=status, **kw)
    db.add(lv); await db.commit(); await db.refresh(lv)
    return lv

async def cleanup(db):
    await db.execute(delete(LeaveRequest).where(LeaveRequest.employee_code == EMP))
    await db.commit()


async def main():
    async with SessionLocal() as db:
        await cleanup(db)
        await set_mode(db, "SHORT")

        # ── A. SHORT chain (Annual) ────────────────────────────────────────
        print("\nA. SHORT chain (Annual)")
        e0 = await max_email_id(db)
        body = L.LeaveSubmitRequest(employee_code=EMP, employee_name="E2E Tester",
                                    leave_type="Annual Leave", start_date="2026-06-15",
                                    end_date="2026-06-16", days=2.0)
        r = await L.submit_leave(body, ADMIN, db)
        lid = r["leave"]["id"]
        lv = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == lid))).scalar_one()
        check("A1", lv.status == "PENDING_PM" and len(await emails_since(db, e0)) >= 1, f"status={lv.status}")
        await L.pm_approve(lid, L.StepActionRequest(actor_code="PM-001"), ADMIN, db); await db.refresh(lv)
        check("A2", lv.status == "PENDING_DC", f"status={lv.status}")
        await L.dc_approve(lid, L.StepActionRequest(actor_code="HR-001"), ADMIN, db); await db.refresh(lv)
        check("A3", lv.status == "APPROVED", f"status={lv.status}")

        # ── B. FULL chain ──────────────────────────────────────────────────
        print("\nB. FULL chain (Annual)")
        await set_mode(db, "FULL")
        check("B1", await L._chain_mode(db) == "FULL", "chain-mode=FULL")
        lv = await mk(db, "PENDING_PM")
        e0 = await max_email_id(db)
        await L.pm_approve(lv.id, L.StepActionRequest(actor_code="PM-001"), ADMIN, db); await db.refresh(lv)
        check("B2", lv.status == "PENDING_SPM", f"status={lv.status}")
        spm_emails = await emails_since(db, e0)
        await L.spm_approve(lv.id, L.StepActionRequest(actor_code="PM-001"), ADMIN, db); await db.refresh(lv)
        check("B3", lv.status == "PENDING_DC" and bool(lv.spm_approved_by), f"status={lv.status} spm_by={lv.spm_approved_by}")
        await L.dc_approve(lv.id, L.StepActionRequest(actor_code="HR-001"), ADMIN, db); await db.refresh(lv)
        check("B4", lv.status == "APPROVED", f"status={lv.status}")
        await set_mode(db, "SHORT")

        # ── C. Personal short-circuit ──────────────────────────────────────
        print("\nC. Personal")
        lv = await mk(db, "PENDING_PM", leave_type="Personal Leave", days=1.0)
        await L.pm_approve(lv.id, L.StepActionRequest(actor_code="PM-001"), ADMIN, db); await db.refresh(lv)
        check("C1", lv.status == "APPROVED", f"status={lv.status}")

        # ── D. Sick ────────────────────────────────────────────────────────
        print("\nD. Sick")
        body = L.LeaveSubmitRequest(employee_code=EMP, employee_name="E2E Tester",
                                    leave_type="Sick Leave", start_date="2026-06-20",
                                    end_date="2026-06-20", days=1.0)
        r = await L.submit_leave(body, ADMIN, db)
        lv = (await db.execute(select(LeaveRequest).where(LeaveRequest.id == r["leave"]["id"]))).scalar_one()
        check("D1", lv.status == "PENDING_HR", f"status={lv.status}")
        await L.hr_acknowledge(lv.id, L.StepActionRequest(actor_code="HR-001"), ADMIN, db); await db.refresh(lv)
        check("D2", lv.status == "APPROVED", f"status={lv.status}")

        # ── E. Rejects ─────────────────────────────────────────────────────
        print("\nE. Rejects")
        lv = await mk(db, "PENDING_PM")
        await L.pm_reject(lv.id, L.StepActionRequest(actor_code="PM-001", reject_reason="no"), ADMIN, db); await db.refresh(lv)
        check("E1", lv.status == "REJECTED" and lv.reject_at_step == "PM" and lv.reject_reason == "no", f"step={lv.reject_at_step}")
        lv = await mk(db, "PENDING_SPM", pm_approved_by="PM-001")
        await L.spm_reject(lv.id, L.StepActionRequest(actor_code="PM-001", reject_reason="no"), ADMIN, db); await db.refresh(lv)
        check("E2", lv.status == "REJECTED" and lv.reject_at_step == "SPM", f"step={lv.reject_at_step}")
        lv = await mk(db, "PENDING_DC", pm_approved_by="PM-001")
        await L.dc_reject(lv.id, L.StepActionRequest(actor_code="HR-001", reject_reason="no"), ADMIN, db); await db.refresh(lv)
        check("E3", lv.status == "REJECTED" and lv.reject_at_step in ("DC", "PD"), f"step={lv.reject_at_step}")

        # ── F. Cancel at PENDING_SPM ───────────────────────────────────────
        print("\nF. Cancel")
        lv = await mk(db, "PENDING_SPM", pm_approved_by="PM-001")
        await L.cancel_leave(lv.id, EMP, ADMIN, db); await db.refresh(lv)
        check("F1", lv.status == "CANCELLED", f"status={lv.status}")

        # ── G. By-token (spm step) ─────────────────────────────────────────
        print("\nG. By-token")
        lv = await mk(db, "PENDING_SPM", pm_approved_by="PM-001")
        tok = create_leave_token(lv.id, "PM-001", "spm")
        info = await L.get_leave_by_token(tok, db)
        check("G1", info["can_act"] and info["expected_status"] == "PENDING_SPM", f"can_act={info['can_act']}")
        res = await L.act_leave_by_token(tok, L.TokenActionRequest(action="approve"), db); await db.refresh(lv)
        check("G2", res["result"] == "approved" and lv.status == "PENDING_DC", f"status={lv.status}")
        replay_blocked = False
        try:
            await L.act_leave_by_token(tok, L.TokenActionRequest(action="approve"), db)
        except Exception as ex:
            replay_blocked = getattr(ex, "status_code", None) == 400
        check("G3", replay_blocked, "replay correctly rejected (400)")

        # ── H. Email stats ─────────────────────────────────────────────────
        print("\nH. Email statistics")
        await cleanup(db)  # deterministic history: only the rows seeded below
        for sd, ed, t, d in [(date(2026,1,12),date(2026,1,12),"Annual Leave",1.0),
                             (date(2026,3,9),date(2026,3,10),"Annual Leave",2.0),
                             (date(2026,5,20),date(2026,5,20),"Personal Leave",1.0)]:
            await mk(db, "APPROVED", leave_type=t, start=sd, end=ed, days=d)
        cur = await mk(db, "PENDING_SPM", start=date(2026,6,15), end=date(2026,6,16), days=2.0, pm_approved_by="PM-001")
        stats = await L._leave_stats(db, cur)
        check("H1", len(stats["last_6_months"]) == 6, f"months={len(stats['last_6_months'])}")
        check("H2", stats["last_leave"] and stats["last_leave"]["start_date"] == "2026-05-20", f"last={stats['last_leave']}")
        check("H3", bool(stats["remaining_after_request_text"]), f"remaining={stats['remaining_after_request_text']}")

        # ── I. Dashboard + calendar ────────────────────────────────────────
        print("\nI. Dashboard")
        dash = await L.leave_dashboard(year=2026, payload=MON, db=db)
        check("I1", all(k in dash for k in ("summary", "monthlyTrend", "byDepartment", "executive"))
                    and len(dash["monthlyTrend"]) == 12, f"trend_months={len(dash['monthlyTrend'])}")
        cal = await L.leave_calendar(month="2026-06", department=None, payload=MON, db=db)
        check("I2", "days" in cal and "departments" in cal and cal["daysInMonth"] == 30, f"daysInMonth={cal['daysInMonth']}")

        # ── J. pending-for-me (PROJECT_ADMIN sees PENDING_SPM) ─────────────
        print("\nJ. Approval inbox")
        pend = await L.pending_for_me(employee_code="PM-001", payload=ADMIN, db=db)
        spm_visible = any(p["status"] == "PENDING_SPM" for p in pend["pending"])
        check("J1", spm_visible, f"PENDING_SPM visible to PROJECT_ADMIN={spm_visible}")

        # ── K. Per-recipient link vs CC split ──────────────────────────────
        print("\nK. Audit — per-recipient links")
        await set_mode(db, "FULL")
        lv = await mk(db, "PENDING_PM")
        e0 = await max_email_id(db)
        await L.pm_approve(lv.id, L.StepActionRequest(actor_code="PM-001"), ADMIN, db)
        sent = await emails_since(db, e0)
        has_to = any(not s.startswith("[CC]") for _, s in sent)
        has_cc = any(s.startswith("[CC]") for _, s in sent)
        check("K1", has_to and has_cc, f"TO={has_to} CC={has_cc} ({len(sent)} mails)")
        await set_mode(db, "SHORT")

        await cleanup(db)
        await set_mode(db, "SHORT")

    passed = sum(1 for _, ok in RESULTS if ok)
    total = len(RESULTS)
    print(f"\n{'='*46}\n  RESULT: {passed}/{total} passed"
          + ("" if passed == total else "  ❌ FAILURES: " + ", ".join(c for c, ok in RESULTS if not ok)))
    print("="*46)


asyncio.run(main())
