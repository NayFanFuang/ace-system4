from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class KpiItem(Base):
    __tablename__ = "kpi_items"
    __table_args__ = (UniqueConstraint("item_id", name="uq_kpi_item_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[str] = mapped_column(String(20), index=True)
    position: Mapped[str | None] = mapped_column(String(100), index=True)
    main_evaluate: Mapped[str | None] = mapped_column(String(150))
    evaluate_item: Mapped[str | None] = mapped_column(String(200))
    weight: Mapped[int] = mapped_column(Integer, default=0)
    target: Mapped[int] = mapped_column(Integer, default=100)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    source_updated_at: Mapped[str | None] = mapped_column(String(40))  # ISO timestamps are ~32 chars
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class KpiPeriodItem(Base):
    __tablename__ = "kpi_period_items"
    __table_args__ = (UniqueConstraint("period", "employee_name", "item_id", name="uq_kpi_period_emp_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period: Mapped[str] = mapped_column(String(7), index=True)       # YYYY-MM
    employee_name: Mapped[str] = mapped_column(String(150), index=True)
    position: Mapped[str | None] = mapped_column(String(100))
    item_id: Mapped[str] = mapped_column(String(20), index=True)
    weight: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    source_updated_at: Mapped[str | None] = mapped_column(String(40))  # ISO timestamps are ~32 chars
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class KpiEvaluation(Base):
    __tablename__ = "kpi_evaluations"
    __table_args__ = (
        UniqueConstraint("employee_name", "period", "item_id", "rater_type", name="uq_kpi_eval_emp_period_item_rater"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    eval_id: Mapped[str | None] = mapped_column(String(60), index=True)
    employee_name: Mapped[str] = mapped_column(String(150), index=True)
    employee_code: Mapped[str | None] = mapped_column(String(30), index=True)
    position: Mapped[str | None] = mapped_column(String(100))
    period: Mapped[str] = mapped_column(String(7), index=True)
    item_id: Mapped[str] = mapped_column(String(20), index=True)
    rater_type: Mapped[str] = mapped_column(String(10), default="PM", index=True)  # SELF | PM
    main_evaluate: Mapped[str | None] = mapped_column(String(150))
    evaluate_item: Mapped[str | None] = mapped_column(String(200))
    weight: Mapped[int] = mapped_column(Integer, default=0)
    target: Mapped[int] = mapped_column(Integer, default=100)
    actual: Mapped[float | None] = mapped_column(Float)
    score: Mapped[float | None] = mapped_column(Float)
    remark: Mapped[str | None] = mapped_column(Text)
    evaluated_by: Mapped[str | None] = mapped_column(String(30))
    source_updated_at: Mapped[str | None] = mapped_column(String(40))  # ISO timestamps are ~32 chars
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    deleted_by: Mapped[str | None] = mapped_column(String(40))
    delete_reason: Mapped[str | None] = mapped_column(Text)


class KpiPeriodLock(Base):
    """Finalize lock for one employee+period — blocks further PM edits until unlocked."""
    __tablename__ = "kpi_period_locks"
    __table_args__ = (UniqueConstraint("employee_name", "period", name="uq_kpi_lock_emp_period"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_name: Mapped[str] = mapped_column(String(150), index=True)
    period: Mapped[str] = mapped_column(String(7), index=True)
    locked_by: Mapped[str | None] = mapped_column(String(40))
    locked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
