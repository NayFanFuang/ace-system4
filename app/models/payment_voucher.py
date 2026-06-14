from datetime import datetime
from decimal import Decimal

from sqlalchemy import (DateTime, ForeignKey, Integer, Numeric, String, Text,
                        UniqueConstraint, func)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# จำนวนเงินใช้ Numeric(18,2) (Decimal) เสมอ — ห้ามใช้ Float ในงานบัญชี (rounding drift)
Money = Numeric(18, 2)


class PaymentVoucher(Base):
    """หัวใบสำคัญจ่าย (Payment Voucher) ที่บันทึกเข้าระบบบัญชีจาก Bill Reader

    เดิม Bill Reader แค่ดาวน์โหลด Excel แล้วจบ — ตารางนี้คือ "ระบบบัญชี" ที่บิล
    ซึ่ง scan แล้วถูกบันทึกไว้เป็น record จริง ติดตามสถานะ และรวมยอดเป็นค่าใช้จ่าย
    จริง (Actual Expense) ป้อนเข้าหน้า Revenue & Expense ได้

    วงจรสถานะ:  DRAFT (ร่าง) → APPROVED (อนุมัติ) → PAID (จ่ายแล้ว)

    เลขเอกสาร: doc_no เป็น running number ที่ระบบออกให้ (PV-YYYY-0001) การันตี unique
               ส่วน pv_no เป็นเลขอ้างอิงจากฟอร์ม/ไฟล์เดิม (อาจซ้ำ/ว่างได้)
    """
    __tablename__ = "payment_vouchers"
    __table_args__ = (
        UniqueConstraint("doc_no", name="uq_payment_vouchers_doc_no"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    doc_no: Mapped[str] = mapped_column(String(30), index=True, default="")     # running no. ของระบบ
    doc_year: Mapped[str] = mapped_column(String(4), index=True, default="")
    doc_seq: Mapped[int] = mapped_column(Integer, default=0)
    pv_no: Mapped[str] = mapped_column(String(60), index=True, default="")      # เลขอ้างอิงจากฟอร์ม
    item: Mapped[str] = mapped_column(String(30), default="")
    pv_date: Mapped[str] = mapped_column(String(30), default="")                # DD-Mon-YYYY ตามฟอร์ม
    period_month: Mapped[str] = mapped_column(String(7), index=True, default="")  # YYYY-MM (สรุปรายเดือน)
    bill_type: Mapped[str] = mapped_column(String(30), index=True, default="")
    vendor: Mapped[str] = mapped_column(String(255), default="")
    project: Mapped[str] = mapped_column(String(255), default="")
    requester: Mapped[str] = mapped_column(String(255), default="")            # Name (ผู้ขอเบิก)
    issued_by: Mapped[str] = mapped_column(String(255), default="")            # Issued (ผู้จัดทำ)
    status: Mapped[str] = mapped_column(String(20), index=True, default="DRAFT")
    content_hash: Mapped[str] = mapped_column(String(64), index=True, default="")  # กันบิลซ้ำ
    amount_total: Mapped[Decimal] = mapped_column(Money, default=0)            # ยอดก่อน VAT (ค่าใช้จ่ายจริง)
    vat_total: Mapped[Decimal] = mapped_column(Money, default=0)               # VAT 7% (ภาษีซื้อ)
    wht_total: Mapped[Decimal] = mapped_column(Money, default=0)               # หัก ณ ที่จ่าย
    net_total: Mapped[Decimal] = mapped_column(Money, default=0)               # ยอดจ่ายสุทธิ
    note: Mapped[str] = mapped_column(Text, default="")
    source_filename: Mapped[str] = mapped_column(String(255), default="")
    created_by: Mapped[str] = mapped_column(String(30), index=True, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    approved_by: Mapped[str | None] = mapped_column(String(30))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paid_by: Mapped[str | None] = mapped_column(String(30))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_ref: Mapped[str] = mapped_column(String(120), default="")

    lines: Mapped[list["PaymentVoucherLine"]] = relationship(
        back_populates="voucher", cascade="all, delete-orphan",
        order_by="PaymentVoucherLine.seq", lazy="selectin")


class PaymentVoucherLine(Base):
    """หนึ่งบรรทัดในใบสำคัญจ่าย = หนึ่งรายการ/หนึ่งเบอร์/หนึ่งงวด"""
    __tablename__ = "payment_voucher_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    voucher_id: Mapped[int] = mapped_column(
        ForeignKey("payment_vouchers.id", ondelete="CASCADE"), index=True)
    seq: Mapped[int] = mapped_column(Integer, default=0)
    identifier: Mapped[str] = mapped_column(String(60), default="")
    period: Mapped[str] = mapped_column(String(60), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    amount: Mapped[Decimal] = mapped_column(Money, default=0)
    vat: Mapped[Decimal] = mapped_column(Money, default=0)
    wht: Mapped[Decimal] = mapped_column(Money, default=0)
    net: Mapped[Decimal] = mapped_column(Money, default=0)

    voucher: Mapped["PaymentVoucher"] = relationship(back_populates="lines")
