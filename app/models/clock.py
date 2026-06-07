from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ClockSite(Base):
    __tablename__ = "clock_sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    site_name: Mapped[str | None] = mapped_column(String(200))
    customer: Mapped[str | None] = mapped_column(String(50))
    project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    gps_radius_m: Mapped[int] = mapped_column(Integer, default=500)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClockSession(Base):
    __tablename__ = "clock_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, index=True)
    clock_type: Mapped[str] = mapped_column(String(20), default="DAILY")  # PER_SITE | DAILY
    work_date: Mapped[date] = mapped_column(Date, index=True)

    # Site snapshot (PER_SITE only)
    site_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("clock_sites.id"), nullable=True)
    site_code: Mapped[str | None] = mapped_column(String(50))
    site_name: Mapped[str | None] = mapped_column(String(200))

    # Clock In
    clock_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lat_in: Mapped[float | None] = mapped_column(Float)
    lng_in: Mapped[float | None] = mapped_column(Float)
    photo_in: Mapped[str | None] = mapped_column(Text)

    # Clock Out
    clock_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lat_out: Mapped[float | None] = mapped_column(Float)
    lng_out: Mapped[float | None] = mapped_column(Float)
    photo_out: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # ACTIVE | CLOCK_IN | CLOSED
    outcome: Mapped[str | None] = mapped_column(String(20), nullable=True)  # COMPLETE | STOP | ISSUE

    # Set when the employee taps "Share" on the clock summary (intent to send to LINE).
    shared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Geofence SNAPSHOT taken at clock-in time, so "was the person on-site?" is frozen
    # to the office/site location as it was THAT day — moving an office later does not
    # rewrite history. NULL on legacy rows → today-map falls back to live computation.
    geofence_source: Mapped[str | None] = mapped_column(String(10), nullable=True)  # site | office
    geofence_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    geofence_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    geofence_radius_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_in_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    on_site_in: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClockManualCheck(Base):
    """Admin-entered daily compliance markers, used to override / supplement
    auto-captured clock data when an employee couldn't log digitally."""
    __tablename__ = "clock_manual_check"
    __table_args__ = (
        UniqueConstraint("employee_code", "work_date", name="uq_clock_manual_check_emp_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), index=True)
    work_date: Mapped[date] = mapped_column(Date, index=True)

    send_to_line: Mapped[bool] = mapped_column(Boolean, default=False)
    location_work: Mapped[bool] = mapped_column(Boolean, default=False)
    status_clock: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[str | None] = mapped_column(Text)
    admin_code: Mapped[str | None] = mapped_column(String(30))
    admin_name: Mapped[str | None] = mapped_column(String(120))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
