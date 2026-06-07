from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Computed, Date, DateTime, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import INT4RANGE, ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MeetingRoom(Base):
    """A bookable meeting room (catalog)."""

    __tablename__ = "meeting_rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)  # UI badge color
    image_url: Mapped[str | None] = mapped_column(String(300), nullable=True)  # /photos/meeting_rooms/...
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RoomBooking(Base):
    """A single meeting-room reservation.

    Times are stored as zero-padded "HH:MM" strings against a calendar date so
    conflict detection is a pure string comparison and free of timezone pitfalls
    (the whole company is Asia/Bangkok). Overlap rule:
        existing.start_time < new.end_time AND existing.end_time > new.start_time
    """

    __tablename__ = "room_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, index=True)
    booking_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[str] = mapped_column(String(5))  # "09:00"
    end_time: Mapped[str] = mapped_column(String(5))    # "10:30"
    title: Mapped[str] = mapped_column(String(200))
    booked_by: Mapped[str] = mapped_column(String(30), index=True)  # employee_code
    booked_by_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    attendees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Linked attendees from the Employees directory: list of {"code", "name"}.
    attendee_list: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE", index=True)
    # iCalendar SEQUENCE — bumped on every edit/cancel so Outlook recognizes updates.
    invite_sequence: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # DB-computed [start_minute, end_minute) range — feeds the exclusion constraint
    # below so two ACTIVE bookings on the same room/date can never overlap, even
    # under concurrent requests. Half-open [) ⇒ adjacent meetings are allowed.
    time_range = mapped_column(
        INT4RANGE,
        Computed(
            "int4range("
            "split_part(start_time, ':', 1)::int * 60 + split_part(start_time, ':', 2)::int, "
            "split_part(end_time, ':', 1)::int * 60 + split_part(end_time, ':', 2)::int)",
            persisted=True,
        ),
        nullable=True,
    )

    __table_args__ = (
        ExcludeConstraint(
            ("room_id", "="),
            ("booking_date", "="),
            ("time_range", "&&"),
            using="gist",
            where=text("status = 'ACTIVE'"),
            name="no_room_overlap",
        ),
    )
