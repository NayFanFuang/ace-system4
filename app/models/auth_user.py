from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))

    # Profile (returned in JWT payload)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str | None] = mapped_column(String(150))
    department: Mapped[str] = mapped_column(String(50), default="")
    team: Mapped[str | None] = mapped_column(String(50))

    # Position / Clock config
    position_code: Mapped[str] = mapped_column(String(30), default="OTHER")
    position_name: Mapped[str] = mapped_column(String(100), default="Staff")
    clock_type: Mapped[str] = mapped_column(String(20), default="DAILY")   # PER_SITE | DAILY
    gps_required: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_required: Mapped[bool] = mapped_column(Boolean, default=False)

    # Office / work location (for DAILY GPS check)
    work_lat: Mapped[float | None] = mapped_column(Float)
    work_lng: Mapped[float | None] = mapped_column(Float)
    work_location_name: Mapped[str | None] = mapped_column(String(100))
    allowed_radius_m: Mapped[int] = mapped_column(Integer, default=300)

    role: Mapped[str] = mapped_column(String(40), default="EMPLOYEE", index=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0)
    token_version: Mapped[int] = mapped_column(Integer, default=1)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuthAuditLog(Base):
    __tablename__ = "auth_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str | None] = mapped_column(String(30), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    detail: Mapped[str | None] = mapped_column(Text)
    actor_employee_code: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuthLoginLog(Base):
    __tablename__ = "auth_login_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identifier: Mapped[str] = mapped_column(String(150), index=True)
    employee_code: Mapped[str | None] = mapped_column(String(30), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(80), index=True)
    user_agent: Mapped[str | None] = mapped_column(Text)
    success: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    failure_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
