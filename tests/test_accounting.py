"""
Unit tests for the accounting (Payment Voucher) ledger service.

Two layers:
  1. Pure-logic tests — no DB, no OCR deps. Run anywhere with just pytest.
  2. DB-backed async tests — use an in-memory SQLite engine fixture (needs
     pytest-asyncio + aiosqlite). They cover create / running-number / dedup /
     status-machine / monthly VAT split end to end.

Run:  pytest tests/test_accounting.py
"""

import datetime
from decimal import Decimal

import pytest

from app.services import accounting


# ---------------------------------------------------------------------------
# 1) Pure-logic tests (no DB)
# ---------------------------------------------------------------------------

def test_q2_rounds_half_up_to_two_dp():
    assert accounting.q2("1.005") == Decimal("1.01")
    assert accounting.q2(2.5) == Decimal("2.50")
    assert accounting.q2(None) == Decimal("0.00")


def test_decimal_math_has_no_float_drift():
    # 0.1 + 0.2 must be exactly 0.30 in money terms (the classic float trap)
    total = accounting.q2(accounting.D("0.1") + accounting.D("0.2"))
    assert total == Decimal("0.30")


def test_content_hash_is_order_independent():
    lines_a = [{"identifier": "0812345678", "period": "P1", "amount": 100},
               {"identifier": "0823456789", "period": "P2", "amount": 200}]
    lines_b = list(reversed(lines_a))
    h1 = accounting.content_hash(vendor="AIS", bill_type="telecom", lines=lines_a)
    h2 = accounting.content_hash(vendor="AIS", bill_type="telecom", lines=lines_b)
    assert h1 == h2 and len(h1) == 64


def test_content_hash_changes_with_amount():
    base = [{"identifier": "0812345678", "period": "P1", "amount": 100}]
    diff = [{"identifier": "0812345678", "period": "P1", "amount": 100.01}]
    assert accounting.content_hash(vendor="AIS", bill_type="telecom", lines=base) \
        != accounting.content_hash(vendor="AIS", bill_type="telecom", lines=diff)


def test_validate_transition_happy_paths():
    assert accounting.validate_transition("DRAFT", "approve") == "APPROVED"
    assert accounting.validate_transition("APPROVED", "pay") == "PAID"
    assert accounting.validate_transition("APPROVED", "revert") == "DRAFT"


def test_validate_transition_rejects_wrong_state():
    with pytest.raises(ValueError):
        accounting.validate_transition("DRAFT", "pay")          # ยังไม่อนุมัติ
    with pytest.raises(ValueError):
        accounting.validate_transition("PAID", "approve")       # จ่ายแล้ว
    with pytest.raises(ValueError):
        accounting.validate_transition("DRAFT", "frobnicate")   # action มั่ว


def test_period_month_parses_form_date_and_falls_back():
    assert accounting._period_month("14-Jun-2026", []) == "2026-06"
    assert accounting._period_month("", [{"period": "01/03/2026-31/03/2026"}]) == "2026-03"
    # ไม่มีข้อมูล -> เดือนปัจจุบัน (รูปแบบ YYYY-MM)
    fallback = accounting._period_month("", [])
    assert len(fallback) == 7 and fallback[4] == "-"


def test_default_due_date_adds_credit_term():
    due = accounting._default_due_date("14-Jun-2026", "2026-06")
    assert due == datetime.date(2026, 6, 14) + datetime.timedelta(
        days=accounting.DEFAULT_CREDIT_DAYS)


def test_aging_buckets():
    today = datetime.date(2026, 6, 14)
    A = lambda d: accounting.aging_of(d, "APPROVED", today)
    assert A(datetime.date(2026, 6, 20)) == (-6, "not_due")     # ยังไม่ถึงกำหนด
    assert A(datetime.date(2026, 6, 1))[1] == "d1_30"           # เลย 13 วัน
    assert A(datetime.date(2026, 5, 1))[1] == "d31_60"          # เลย 44 วัน
    assert A(datetime.date(2026, 3, 1))[1] == "d90_plus"        # เลย >90 วัน
    assert A(None) == (None, "no_due_date")
    # ใบที่จ่ายแล้วไม่นับ aging
    assert accounting.aging_of(datetime.date(2026, 1, 1), "PAID", today) == (None, None)


def test_parse_iso_date():
    assert accounting.parse_iso_date("2026-06-14") == datetime.date(2026, 6, 14)
    assert accounting.parse_iso_date("") is None
    assert accounting.parse_iso_date("not-a-date") is None


# ---------------------------------------------------------------------------
# 2) DB-backed async tests (in-memory SQLite)
# ---------------------------------------------------------------------------

aiosqlite = pytest.importorskip("aiosqlite")
pytest_asyncio = pytest.importorskip("pytest_asyncio")

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.database import Base  # noqa: E402
import app.models.payment_voucher  # noqa: E402,F401 — register tables


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


def _line(amount, vat, ident="0812345678", desc="Service"):
    # desc ระบุไว้ครบ เพื่อเลี่ยง lazy import ของ bill_reader (OCR deps)
    return {"identifier": ident, "period": "01/06/2026-30/06/2026",
            "amount": amount, "vat": vat, "desc": desc}


@pytest.mark.asyncio
async def test_create_assigns_running_doc_no_and_totals(db):
    pv = await accounting.create_voucher(
        db, lines=[_line(100, 7), _line(200, 14, ident="0899999999")],
        header={"date": "14-Jun-2026", "project": "P"}, vendor="AIS",
        bill_type="telecom", filename="bill.pdf", created_by="HR-001")
    assert pv.doc_no == "PV-2026-0001"
    assert pv.status == "DRAFT"
    assert pv.amount_total == Decimal("300.00")
    assert pv.vat_total == Decimal("21.00")
    # WHT 3% ของ telecom: 3 + 6 = 9 ; net = 300 + 21 - 9 = 312
    assert pv.wht_total == Decimal("9.00")
    assert pv.net_total == Decimal("312.00")
    assert len(pv.lines) == 2


@pytest.mark.asyncio
async def test_running_number_increments_within_year(db):
    a = await accounting.create_voucher(
        db, lines=[_line(100, 7)], header={"date": "14-Jun-2026"}, vendor="AIS",
        bill_type="telecom", filename="a.pdf", created_by="HR-001")
    b = await accounting.create_voucher(
        db, lines=[_line(100, 7, ident="0700000000")], header={"date": "15-Jun-2026"},
        vendor="AIS", bill_type="telecom", filename="b.pdf", created_by="HR-001")
    assert a.doc_no == "PV-2026-0001"
    assert b.doc_no == "PV-2026-0002"


@pytest.mark.asyncio
async def test_duplicate_detection(db):
    lines = [_line(100, 7)]
    await accounting.create_voucher(
        db, lines=lines, header={"date": "14-Jun-2026"}, vendor="AIS",
        bill_type="telecom", filename="a.pdf", created_by="HR-001")
    chash = accounting.content_hash(vendor="AIS", bill_type="telecom", lines=lines)
    dup = await accounting.find_duplicate(db, chash)
    assert dup is not None and dup.doc_no == "PV-2026-0001"
    # เนื้อหาต่างกัน -> ไม่ถือว่าซ้ำ
    other = accounting.content_hash(
        vendor="True", bill_type="telecom", lines=[_line(999, 7)])
    assert await accounting.find_duplicate(db, other) is None


@pytest.mark.asyncio
async def test_status_machine_and_summary_vat_split(db):
    pv = await accounting.create_voucher(
        db, lines=[_line(100, 7)], header={"date": "14-Jun-2026"}, vendor="AIS",
        bill_type="telecom", filename="a.pdf", created_by="HR-001")

    # DRAFT ยังไม่นับเป็น actual
    summ = await accounting.monthly_summary(db)
    assert summ["total_expense_actual"] == 0.0

    pv = await accounting.transition(db, pv, action="approve", actor="DIR-1")
    assert pv.status == "APPROVED" and pv.approved_by == "DIR-1"

    with pytest.raises(ValueError):                       # อนุมัติซ้ำไม่ได้
        await accounting.transition(db, pv, action="approve", actor="DIR-1")

    pv = await accounting.transition(db, pv, action="pay", actor="ACC-1",
                                     payment_ref="CHQ-001")
    assert pv.status == "PAID" and pv.payment_ref == "CHQ-001"

    summ = await accounting.monthly_summary(db)
    month = summ["months"][0]
    assert month["month"] == "2026-06"
    assert month["expense_actual"] == 100.0     # base ก่อน VAT = ค่าใช้จ่าย
    assert month["input_vat"] == 7.0            # VAT แยกเป็นภาษีซื้อ
    assert month["net_paid"] == 104.0           # 100 + 7 - 3(WHT)
    assert summ["total_expense_actual"] == 100.0


@pytest.mark.asyncio
async def test_aging_summary_counts_only_approved_unpaid(db):
    # ใบ approved ที่เลยกำหนดมานาน
    overdue = await accounting.create_voucher(
        db, lines=[_line(100, 7)], header={"date": "14-Jun-2026"}, vendor="AIS",
        bill_type="telecom", filename="a.pdf", created_by="HR-001")
    await accounting.set_due_date(db, overdue, datetime.date(2020, 1, 1))
    overdue = await accounting.get_voucher(db, overdue.id)
    await accounting.transition(db, overdue, action="approve", actor="DIR-1")

    # ใบ approved+paid ไม่นับใน aging
    paid = await accounting.create_voucher(
        db, lines=[_line(50, 3.5, ident="0700000000")], header={"date": "14-Jun-2026"},
        vendor="True", bill_type="telecom", filename="b.pdf", created_by="HR-001")
    paid = await accounting.get_voucher(db, paid.id)
    await accounting.transition(db, paid, action="approve", actor="DIR-1")
    paid = await accounting.get_voucher(db, paid.id)
    await accounting.transition(db, paid, action="pay", actor="ACC-1")

    aging = await accounting.aging_summary(db, today=datetime.date(2026, 6, 14))
    by = {b["key"]: b for b in aging["buckets"]}
    # outstanding = ยอดจ่ายสุทธิ (net) ที่ค้าง: 100 + 7(VAT) - 3(WHT) = 104
    assert by["d90_plus"]["count"] == 1
    assert by["d90_plus"]["amount"] == 104.0
    assert aging["total_outstanding"] == 104.0   # เฉพาะใบ approved-unpaid
    assert aging["overdue_amount"] == 104.0
