from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StockItem(Base):
    """An item held in the office store (catalog + current on-hand quantity)."""

    __tablename__ = "stock_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    sku: Mapped[str | None] = mapped_column(String(60), nullable=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), default="ชิ้น", server_default="ชิ้น")
    quantity: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    min_qty: Mapped[int] = mapped_column(Integer, default=0, server_default="0")  # reorder level
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class StockRequest(Base):
    """A withdrawal (เบิก) request — header. Lines live in stock_request_lines.

    status: PENDING → APPROVED | REJECTED | CANCELLED.
    Stock is only deducted at APPROVED time (see router).
    """

    __tablename__ = "stock_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requested_by: Mapped[str] = mapped_column(String(30), index=True)
    requested_by_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", server_default="PENDING", index=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String(30), nullable=True)
    decided_by_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StockRequestLine(Base):
    """One item line inside a withdrawal request (item name/unit snapshotted)."""

    __tablename__ = "stock_request_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, index=True)
    item_id: Mapped[int] = mapped_column(Integer, index=True)
    item_name: Mapped[str] = mapped_column(String(160))
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    qty: Mapped[int] = mapped_column(Integer)


class StockMovement(Base):
    """Append-only ledger of every stock change (issue/adjust/receive)."""

    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer, index=True)
    delta: Mapped[int] = mapped_column(Integer)            # +receive / -issue
    balance_after: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(20))        # ISSUE / ADJUST / RECEIVE
    ref_request_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_by_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
