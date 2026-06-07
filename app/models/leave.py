from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Requester
    employee_code: Mapped[str] = mapped_column(String(30), index=True)
    employee_name: Mapped[str] = mapped_column(String(150))

    # Leave details
    leave_type: Mapped[str] = mapped_column(String(50))
    session_type: Mapped[str] = mapped_column(String(30), default="Full Day")
    start_date: Mapped[date] = mapped_column(Date, index=True)
    end_date: Mapped[date] = mapped_column(Date)
    days: Mapped[float] = mapped_column(Float, default=1.0)
    reason: Mapped[str | None] = mapped_column(Text)
    attachment_url: Mapped[str | None] = mapped_column(String(500))

    # Status: PENDING_PM | PENDING_DC | PENDING_HR | APPROVED | REJECTED | CANCELLED
    status: Mapped[str] = mapped_column(String(20), default="PENDING_PM", index=True)

    # Multi-step approval chain
    pm_approved_by: Mapped[str | None] = mapped_column(String(30))
    pm_approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    spm_approved_by: Mapped[str | None] = mapped_column(String(30))
    spm_approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dc_approved_by: Mapped[str | None] = mapped_column(String(30))
    dc_approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hr_acknowledged_by: Mapped[str | None] = mapped_column(String(30))
    hr_acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Which step rejected: PM | DC | HR
    reject_at_step: Mapped[str | None] = mapped_column(String(10))
    reject_reason: Mapped[str | None] = mapped_column(Text)

    # Legacy compat fields
    reviewed_by: Mapped[str | None] = mapped_column(String(30))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
