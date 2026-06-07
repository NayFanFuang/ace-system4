from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DataImport(Base):
    """Audit log for master-data file uploads (PO / ISDP / MasterDB).

    Used to surface 'last upload' timestamps and impact counts on the
    /projects/manage > Master Data tab so admins can see at a glance which
    feeds are fresh and which are stale or missing.
    """
    __tablename__ = "data_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # 'PO' | 'ISDP' | 'MASTERDB'
    file_type: Mapped[str] = mapped_column(String(40), index=True)
    file_name: Mapped[str | None] = mapped_column(String(300))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    inserted: Mapped[int] = mapped_column(Integer, default=0)
    updated: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(40), default="SUCCESS")
    note: Mapped[str | None] = mapped_column(Text)
    uploaded_by_code: Mapped[str | None] = mapped_column(String(40), index=True)
    uploaded_by_name: Mapped[str | None] = mapped_column(String(180))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
