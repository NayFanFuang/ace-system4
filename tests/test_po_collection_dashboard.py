"""Runnable tests for the PO Collection Tracking dashboard.

Covers the derived-state helpers, the aggregation endpoint (against an
in-memory SQLite DB seeded with representative POs + a billing-plan target),
the month-range filter, per-project rollup, and the finance quick-actions.

Run:  DATABASE_URL=sqlite+aiosqlite:///:memory: python tests/test_po_collection_dashboard.py
(or via pytest — each test_* function is independent.)
"""
import asyncio
import os
from datetime import date, datetime, timezone
from types import SimpleNamespace

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.database import Base  # noqa: E402
from app.models.billing_plan import BillingPlan  # noqa: E402
from app.models.employee import ProjectPO  # noqa: E402
from app.routers import employees as emp  # noqa: E402

DT = datetime(2026, 5, 10, tzinfo=timezone.utc)


def _ns(**kw):
    base = dict(workflow_status="NEW", hw_billed_at=None, ac1_billed_at=None, ac2_billed_at=None,
                dte_paid_at=None, payment_terms=None, ac1_plan_month=None, ac2_plan_month=None,
                on_air=None)
    base.update(kw)
    return SimpleNamespace(**base)


def test_billing_state():
    assert emp._po_billing_state(_ns(workflow_status="REJECTED")) == "REJECTED"
    assert emp._po_billing_state(_ns(hw_billed_at=DT)) == "BILLED"
    assert emp._po_billing_state(_ns(workflow_status="CLOSED")) == "BILLED"
    assert emp._po_billing_state(_ns(ac1_billed_at=DT, ac2_billed_at=DT)) == "BILLED"
    assert emp._po_billing_state(_ns(ac1_billed_at=DT)) == "PARTIAL"
    assert emp._po_billing_state(_ns()) == "NOT_BILLED"
    # Rejected wins even if a milestone was billed earlier
    assert emp._po_billing_state(_ns(workflow_status="REJECTED", ac1_billed_at=DT)) == "REJECTED"


def test_dte_pay_state():
    assert emp._po_dte_pay_state(_ns(workflow_status="REJECTED")) == "N/A"
    assert emp._po_dte_pay_state(_ns(dte_paid_at=DT)) == "PAID"
    assert emp._po_dte_pay_state(_ns(workflow_status="CLOSED")) == "PAID"
    assert emp._po_dte_pay_state(_ns()) == "UNPAID"


def test_phase():
    assert emp._po_phase("PENDING_BILLING") == "CLOSE_OUT"
    assert emp._po_phase("NEED_REVIEW") == "FINANCE_REVIEW"
    assert emp._po_phase("PENDING_SITE_MAP") == "PROJECT_PLAN"
    assert emp._po_phase("REJECTED") == "REJECTED"
    assert emp._po_phase("ON_HOLD") == "HOLD"
    assert emp._po_phase(None) == "FINANCE_REVIEW"


def test_months():
    assert emp._po_months(_ns()) == set()
    assert emp._po_months(_ns(ac1_plan_month="2026-04")) == {"2026-04"}
    got = emp._po_months(_ns(hw_billed_at=DT, on_air=date(2026, 3, 1), ac2_plan_month="2026-06"))
    assert got == {"2026-05", "2026-03", "2026-06"}


async def _seeded_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: Base.metadata.create_all(
            c, tables=[ProjectPO.__table__, BillingPlan.__table__]))
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as s:
        s.add_all([
            # A: fully billed + DTE paid
            ProjectPO(po_number="POA", ace_project_code="HWT2304", work_type="SSV", vendor="HW",
                      line_amount=1000, workflow_status="CLOSED", hw_billed_at=DT, dte_paid_at=DT),
            # B: partial (AC1 only) + DTE unpaid
            ProjectPO(po_number="POB", ace_project_code="HWT2304", work_type="SSV", vendor="HW",
                      line_amount=2000, workflow_status="PENDING_BILLING", ac1_billed_at=DT,
                      payment_terms="30/70"),
            # C: not billed + DTE unpaid
            ProjectPO(po_number="POC", ace_project_code="HWT2304", work_type="PAC", vendor="HW",
                      line_amount=3000, workflow_status="NEED_REVIEW"),
            # D: rejected (DTE N/A)
            ProjectPO(po_number="POD", ace_project_code="HWT2604", work_type="SSV", vendor="HW",
                      line_amount=5000, workflow_status="REJECTED"),
        ])
        s.add(BillingPlan(ace_project_code="HWT2304", vendor="HW", month="2026-05", planned_amount=10000))
        await s.commit()
        return engine, Session


async def _call(session, **over):
    kw = dict(ace_project_code="", work_type="", vendor="", owner_role="", billing_state="",
              dte_pay_state="", aging_min=0, month_from="", month_to="",
              payload={"role": "ACCOUNTING", "employee_code": "T1"}, db=session)
    kw.update(over)
    return await emp.project_po_collection_dashboard(**kw)


async def test_dashboard_summary():
    engine, Session = await _seeded_session()
    async with Session() as s:
        out = await _call(s)
    summ = out["summary"]
    assert summ["total"] == 4 and summ["total_value"] == 11000
    assert summ["billed"] == 1 and summ["billed_value"] == 1000
    assert summ["partial"] == 1 and summ["partial_value"] == 2000
    assert summ["not_billed"] == 1 and summ["not_billed_value"] == 3000
    assert summ["rejected"] == 1 and summ["rejected_value"] == 5000
    assert summ["outstanding_value"] == 5000
    assert summ["dte_paid"] == 1 and summ["dte_unpaid"] == 2
    # collectable = 11000 - 5000 = 6000 → 1000/6000 = 16.7%
    assert summ["collection_rate"] == 16.7
    assert summ["total_plan"] == 10000 and summ["plan_collection_rate"] == 10.0
    await engine.dispose()


async def test_dashboard_project_rollup():
    engine, Session = await _seeded_session()
    async with Session() as s:
        out = await _call(s)
    roll = {r["ace_project_code"]: r for r in out["project_rollup"]}
    assert roll["HWT2304"]["total"] == 6000
    assert roll["HWT2304"]["billed"] == 1000
    assert roll["HWT2304"]["outstanding"] == 5000
    assert roll["HWT2304"]["rejected"] == 0
    assert roll["HWT2304"]["plan"] == 10000
    assert roll["HWT2604"]["rejected"] == 5000 and roll["HWT2604"]["total"] == 5000
    await engine.dispose()


async def test_dashboard_filters():
    engine, Session = await _seeded_session()
    async with Session() as s:
        only_partial = await _call(s, billing_state="PARTIAL")
        assert only_partial["total"] == 1 and only_partial["data"][0]["po_number"] == "POB"

        only_2304 = await _call(s, ace_project_code="HWT2304")
        assert only_2304["total"] == 3

        unpaid = await _call(s, dte_pay_state="UNPAID")
        assert unpaid["total"] == 2

        # Month filter: only POs touching 2026-05 (A billed, B billed, C none, D none)
        may = await _call(s, month_from="2026-05", month_to="2026-05")
        assert {r["po_number"] for r in may["data"]} == {"POA", "POB"}
    await engine.dispose()


async def test_collection_action():
    engine, Session = await _seeded_session()
    orig = emp.write_audit_log

    async def _noop(*a, **k):
        return None
    emp.write_audit_log = _noop
    try:
        async with Session() as s:
            # Find POC (not billed) and bill AC1
            poc = (await _call(s, billing_state="NOT_BILLED"))["data"][0]
            res = await emp.po_collection_action(
                poc["id"], body=SimpleNamespace(action="bill_ac1", invoice_no="INV-1", payment_ref=None),
                request=None, payload={"role": "ACCOUNTING", "employee_code": "T1"}, db=s)
            assert res["ac1_invoice_no"] == "INV-1"
            assert res["ac1_billed_at"] is not None
            # No AC2 term → hw_billed_at should now be set (fully billed)
            assert res["billing_state"] == "BILLED"

            # Mark DTE paid
            res2 = await emp.po_collection_action(
                poc["id"], body=SimpleNamespace(action="mark_dte_paid", invoice_no=None, payment_ref="PAY-9"),
                request=None, payload={"role": "ACCOUNTING", "employee_code": "T1"}, db=s)
            assert res2["dte_pay_state"] == "PAID" and res2["dte_paid_at"] is not None

            # Undo DTE
            res3 = await emp.po_collection_action(
                poc["id"], body=SimpleNamespace(action="unmark_dte_paid", invoice_no=None, payment_ref=None),
                request=None, payload={"role": "ACCOUNTING", "employee_code": "T1"}, db=s)
            assert res3["dte_pay_state"] == "UNPAID"
    finally:
        emp.write_audit_log = orig
    await engine.dispose()


def _run():
    passed = 0
    sync_tests = [test_billing_state, test_dte_pay_state, test_phase, test_months]
    async_tests = [test_dashboard_summary, test_dashboard_project_rollup,
                   test_dashboard_filters, test_collection_action]
    for t in sync_tests:
        t(); passed += 1; print(f"  PASS  {t.__name__}")
    for t in async_tests:
        asyncio.run(t()); passed += 1; print(f"  PASS  {t.__name__}")
    print(f"\nAll {passed} tests passed ✅")


if __name__ == "__main__":
    _run()
