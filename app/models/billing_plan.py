from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BillingPlan(Base):
    """Top-down revenue target — planned billing per (project, vendor, month).

    This is a manual forecast number, NOT tied to specific POs. Finance/PM sets
    a lump-sum target per project per month; the Billing page compares it against
    the bottom-up actual (POs marked billed) for the same project/month.
    """
    __tablename__ = "billing_plan"
    __table_args__ = (
        UniqueConstraint("ace_project_code", "vendor", "month", name="uq_billing_plan_proj_vendor_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ace_project_code: Mapped[str] = mapped_column(String(30), index=True)
    vendor: Mapped[str] = mapped_column(String(20), default="HW", index=True)   # HW | ERICSSON | NBTC
    month: Mapped[str] = mapped_column(String(7), index=True)                   # "YYYY-MM"
    planned_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    note: Mapped[str | None] = mapped_column(Text)
    updated_by: Mapped[str | None] = mapped_column(String(120))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
