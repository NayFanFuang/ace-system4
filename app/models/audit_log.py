from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[str | None] = mapped_column(String(80), index=True)
    employee_id: Mapped[int | None] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    action_label: Mapped[str] = mapped_column(String(180))
    changed_by_user_id: Mapped[int | None] = mapped_column(Integer, index=True)
    changed_by_name: Mapped[str | None] = mapped_column(String(180))
    changed_by_email: Mapped[str | None] = mapped_column(String(180))
    old_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict | None] = mapped_column(JSON)
    changed_fields: Mapped[list | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(80), index=True)
    user_agent: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(80), default="HR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
