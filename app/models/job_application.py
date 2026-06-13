from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class JobApplication(Base):
    """A job application submitted through the public /apply form.

    Access to the form is gated by a signed invite token (see
    app/services/application_tokens.py) so only invited candidates can submit.
    The full form payload is stored as a JSON string in `data`.
    """

    __tablename__ = "job_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Quick-look columns (also kept inside `data` JSON)
    position: Mapped[str | None] = mapped_column(String(200), index=True)
    full_name: Mapped[str | None] = mapped_column(String(200), index=True)
    email: Mapped[str | None] = mapped_column(String(200), index=True)
    phone: Mapped[str | None] = mapped_column(String(60))
    expected_salary: Mapped[str | None] = mapped_column(String(60))

    # NEW | REVIEWED | SHORTLISTED | REJECTED | HIRED
    status: Mapped[str] = mapped_column(String(20), default="NEW", index=True)

    # Whole form as JSON string
    data: Mapped[str] = mapped_column(Text)

    # Invite provenance (who the link was issued to / by)
    invited_name: Mapped[str | None] = mapped_column(String(200))
    invited_email: Mapped[str | None] = mapped_column(String(200))
    invited_by: Mapped[str | None] = mapped_column(String(30))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
