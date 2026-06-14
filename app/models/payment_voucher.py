from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PaymentVoucher(Base):
    """หัวใบสำคัญจ่าย (Payment Voucher) ที่บันทึกเข้าระบบบัญชีจาก Bill Reader

    เดิม Bill Reader แค่ดาวน์โหลด Excel แล้วจบ — ตารางนี้คือ "ระบบบัญชี" ที่บิล
    ซึ่ง scan แล้วถูกบันทึกไว้เป็น record จริง ติดตามสถานะ และรวมยอดเป็นค่าใช้จ่าย
    จริง (Actual Expense) ป้อนเข้าหน้า Revenue & Expense ได้

    วงจรสถานะ:  DRAFT (ร่าง) → APPROVED (อนุมัติ) → PAID (จ่ายแล้ว)
    """
    __tablename__ = "payment_vouchers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pv_no: Mapped[str] = mapped_column(String(60), index=True, default="")
    item: Mapped[str] = mapped_column(String(30), default="")
    pv_date: Mapped[str] = mapped_column(String(30), default="")            # DD-Mon-YYYY ตามฟอร์ม
    period_month: Mapped[str] = mapped_column(String(7), index=True, default="")  # YYYY-MM (ใช้สรุปรายเดือน)
    bill_type: Mapped[str] = mapped_column(String(30), index=True, default="")
    vendor: Mapped[str] = mapped_column(String(255), default="")
    project: Mapped[str] = mapped_column(String(255), default="")
    requester: Mapped[str] = mapped_column(String(255), default="")         # Name (ผู้ขอเบิก)
    issued_by: Mapped[str] = mapped_column(String(255), default="")         # Issued (ผู้จัดทำ)
    status: Mapped[str] = mapped_column(String(20), index=True, default="DRAFT")
    amount_total: Mapped[float] = mapped_column(Float, default=0.0)
    vat_total: Mapped[float] = mapped_column(Float, default=0.0)
    wht_total: Mapped[float] = mapped_column(Float, default=0.0)
    net_total: Mapped[float] = mapped_column(Float, default=0.0)
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
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    vat: Mapped[float] = mapped_column(Float, default=0.0)
    wht: Mapped[float] = mapped_column(Float, default=0.0)
    net: Mapped[float] = mapped_column(Float, default=0.0)

    voucher: Mapped["PaymentVoucher"] = relationship(back_populates="lines")
