from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# Stage enum (string constants, kept in sync with frontend)
STAGE_FULL_ONAIR     = "FULL_ONAIR"
STAGE_DT_STARTED     = "DT_STARTED"
STAGE_DT_DONE        = "DT_DONE"
STAGE_REPORT_DONE    = "REPORT_DONE"
STAGE_CHECKING       = "CHECKING"        # check_result IS NULL after report_done OR failed (rework)
STAGE_ACE_SUBMITTED  = "ACE_SUBMITTED"
STAGE_TL_REVIEWED    = "TL_REVIEWED"
STAGE_PM_REVIEWED    = "PM_REVIEWED"
STAGE_ACE_APPROVED   = "ACE_APPROVED"

ALL_STAGES = [
    STAGE_FULL_ONAIR,
    STAGE_DT_STARTED,
    STAGE_DT_DONE,
    STAGE_REPORT_DONE,
    STAGE_CHECKING,
    STAGE_ACE_SUBMITTED,
    STAGE_TL_REVIEWED,
    STAGE_PM_REVIEWED,
    STAGE_ACE_APPROVED,
]


class DtePresiteTracking(Base):
    __tablename__ = "dte_presite_tracking"
    # SSV: 1 tracking = 1 PO line (= 1 DU + 1 item_dis), key = po_id
    # PAC: 1 tracking = 1 RF Cluster (= N POs underneath), key = cluster_key
    # Partial unique indexes enforce both (created in migration 20260522_pac_cluster_tracking.sql)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    ace_project_code: Mapped[str | None] = mapped_column(String(30), index=True)
    site_code: Mapped[str | None] = mapped_column(String(50), index=True)
    po_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("project_pos.id", ondelete="CASCADE"))
    # PAC cluster identity (= rf_cluster_name). NULL for SSV.
    cluster_key: Mapped[str | None] = mapped_column(String(200), index=True)
    po_number: Mapped[str | None] = mapped_column(String(80))
    po_line: Mapped[str | None] = mapped_column(String(30))
    assigned_dte_code: Mapped[str | None] = mapped_column(String(120), index=True)
    assigned_dte_name: Mapped[str | None] = mapped_column(String(200))

    # SSV/PAC metadata (added 2026-05-21 to replace frontend mock functions)
    work_type: Mapped[str | None] = mapped_column(String(10), index=True)         # SSV | PAC
    rf_cluster_name: Mapped[str | None] = mapped_column(String(200), index=True)

    # SSV billing handoff (added 2026-05-22): 1 SSV billable = 1 DU + 1 item_dis
    du_id: Mapped[str | None] = mapped_column(String(50), index=True)
    item_dis: Mapped[str | None] = mapped_column(Text)
    hw_id: Mapped[str | None] = mapped_column(String(50), index=True)             # HW unique 21-digit ID
    line_amount: Mapped[float | None] = mapped_column(Numeric(14, 2))
    payment_terms: Mapped[str | None] = mapped_column(String(20))                 # e.g. "30/70"
    billing_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    billing_sent_by: Mapped[str | None] = mapped_column(String(120))
    billing_ref: Mapped[str | None] = mapped_column(String(120))
    cluster_ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    site_status: Mapped[str | None] = mapped_column(String(20))                   # CROSS | ALARM | WAIT_SITE_ACCESS | OK
    dta_code: Mapped[str | None] = mapped_column(String(120))
    dta_name: Mapped[str | None] = mapped_column(String(200))
    layers: Mapped[int | None] = mapped_column(Integer)
    total_rounds: Mapped[int | None] = mapped_column(Integer)  # SSV starts 1; PAC starts 0 and grows per session added/clocked-in

    full_onair_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Step 1
    dt_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dt_started_by: Mapped[str | None] = mapped_column(String(120))
    dt_done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dt_done_by: Mapped[str | None] = mapped_column(String(120))
    # Step 2
    report_done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    report_done_by: Mapped[str | None] = mapped_column(String(120))
    # Step 3
    check_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    check_by: Mapped[str | None] = mapped_column(String(120))
    check_result: Mapped[str | None] = mapped_column(String(10))           # PASS | FAIL
    check_notes: Mapped[str | None] = mapped_column(Text)
    rework_count: Mapped[int] = mapped_column(Integer, default=0)
    # Step 4
    ace_submit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ace_submit_by: Mapped[str | None] = mapped_column(String(120))
    ace_report_url: Mapped[str | None] = mapped_column(String(500))
    # Step 5
    tl_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tl_review_by: Mapped[str | None] = mapped_column(String(120))
    pm_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    pm_review_by: Mapped[str | None] = mapped_column(String(120))
    # Step 6
    ace_approve_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ace_approve_by: Mapped[str | None] = mapped_column(String(120))

    # PAC late stages (added 2026-05-21)
    pa_open_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    pa_open_by: Mapped[str | None] = mapped_column(String(120))
    pa_closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    pa_closed_by: Mapped[str | None] = mapped_column(String(120))
    report_submit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    report_submit_by: Mapped[str | None] = mapped_column(String(120))
    report_approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    report_approved_by: Mapped[str | None] = mapped_column(String(120))

    # DTE report upload (.rar) — added 2026-05-29
    report_file_path: Mapped[str | None] = mapped_column(Text)              # server path under /app/reports
    report_filename: Mapped[str | None] = mapped_column(String(255))        # original filename
    report_file_size: Mapped[int | None] = mapped_column(BigInteger)        # bytes
    report_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    report_uploaded_by: Mapped[str | None] = mapped_column(String(120))     # DTE employee_code
    report_version: Mapped[int] = mapped_column(Integer, default=0)         # 0 = none, bumps each upload

    # DTE payment status — added 2026-05-29 (Finance/PM marks paid; DTE read-only)
    dte_paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dte_paid_by: Mapped[str | None] = mapped_column(String(120))
    dte_payment_ref: Mapped[str | None] = mapped_column(String(120))

    # Frozen income snapshot at mark-paid time — added 2026-06-14.
    # Income is recomputed live from dte_rates.py for unpaid rows, but once paid
    # the amount is locked here so later rate/cluster/item_dis changes can't drift
    # the reported "paid" total. NULL on unpaid rows.
    dte_paid_amount: Mapped[float | None] = mapped_column(Numeric(14, 2))
    dte_paid_income_dt: Mapped[float | None] = mapped_column(Numeric(14, 2))
    dte_paid_income_report: Mapped[float | None] = mapped_column(Numeric(14, 2))
    dte_paid_category: Mapped[str | None] = mapped_column(String(40))
    dte_paid_site_count: Mapped[int | None] = mapped_column(Integer)

    current_stage: Mapped[str] = mapped_column(String(30), default=STAGE_FULL_ONAIR, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DtePresiteSession(Base):
    """PAC has 5 DT rounds, each on a different day. One row per round per tracking."""
    __tablename__ = "dte_presite_sessions"
    __table_args__ = (UniqueConstraint("tracking_id", "round_number", name="uq_dte_presite_session"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tracking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dte_presite_tracking.id", ondelete="CASCADE"), index=True)
    round_number: Mapped[int] = mapped_column(Integer)
    planned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_by: Mapped[str | None] = mapped_column(String(120))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_by: Mapped[str | None] = mapped_column(String(120))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_by: Mapped[str | None] = mapped_column(String(120))
    check_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    check_by: Mapped[str | None] = mapped_column(String(120))
    check_result: Mapped[str | None] = mapped_column(String(10))   # PASS | FAIL
    check_notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")  # PENDING | IN_PROGRESS | DONE | SKIP
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DtePresiteHistory(Base):
    __tablename__ = "dte_presite_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tracking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dte_presite_tracking.id", ondelete="CASCADE"), index=True)
    stage: Mapped[str | None] = mapped_column(String(30))
    action: Mapped[str] = mapped_column(String(40))
    actor_code: Mapped[str | None] = mapped_column(String(120))
    actor_name: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
