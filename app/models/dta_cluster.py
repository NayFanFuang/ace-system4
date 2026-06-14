"""DTA Cluster lifecycle — cluster-level Pre-Site (PAC) progress.

Source of truth is the "Cluster Level" sheet of the TRUE-MERGE EAS Master Progress
Report, imported via scripts/import_dta_clusters.py (keyed by rf_cluster_name).
Coordinates are joined from project_sites. PA-loop rounds live in dta_cluster_rounds,
which also reserves columns for DTE/PAC test scheduling (filled later).
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# 11-milestone lifecycle (kept in sync with the frontend MILESTONES array)
MILESTONES = [
    (1, "site_onair", "Site OnAir"),
    (2, "cluster_ready", "Cluster Ready"),
    (3, "dt_gen", "DT Route Gen"),
    (4, "dt_approved", "DT Route Appr"),
    (5, "init_test", "Initial Test"),
    (6, "pa_open", "PA Open Discuss (40%)"),
    (7, "pa_loop", "PA Loop — Tuning & Discuss R1-4"),
    (8, "tuning_closed", "Tuning Closed"),
    (9, "pac_report", "PAC Report"),
    (10, "pac_submit", "PAC Submit"),
    (11, "pac_approved", "PAC Approved (60%)"),
]
DONE_PHASE = 11


class DtaCluster(Base):
    __tablename__ = "dta_clusters"

    rf_cluster_name: Mapped[str] = mapped_column(String(200), primary_key=True)  # EAS0047-SSOA-2
    dta_name: Mapped[str | None] = mapped_column(String(200), index=True)         # FAC/TUNING owner (sheet col 6)
    # owner provenance: 'EXCEL' = imported from sheet, 'MANUAL' = assigned in-app (ETL must not overwrite)
    owner_source: Mapped[str] = mapped_column(String(10), default="EXCEL")
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    assigned_by: Mapped[str | None] = mapped_column(String(120))
    # employee_code of the assignee (set when /dta/assign resolves the name to a login).
    # Lets the self-service page scope "my clusters" robustly, beyond free-text dta_name match.
    assigned_employee_code: Mapped[str | None] = mapped_column(String(40), index=True)
    # progress provenance — INDEPENDENT of owner_source. 'EXCEL' = milestones/status/rounds owned
    # by the sheet ETL; 'MANUAL' = a DTA edited progress in-app, so the ETL must stop overwriting
    # progress (milestones/status/phase/round/rounds) for this cluster (still syncs geo + PO).
    progress_source: Mapped[str] = mapped_column(String(10), default="EXCEL")
    progress_edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    progress_edited_by: Mapped[str | None] = mapped_column(String(120))
    # handoff signal — set when DTE finishes (ACE_APPROVED) a site of this cluster.
    # Separate from the milestone columns so the Excel ETL never touches it. First
    # "system-native" milestone on the road to retiring the spreadsheet.
    dte_ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dte_ready_by: Mapped[str | None] = mapped_column(String(120))
    target_month: Mapped[str | None] = mapped_column(String(10))
    status: Mapped[str | None] = mapped_column(String(120))                       # PAC_Simulate_Status
    current_phase: Mapped[int] = mapped_column(Integer, default=1)
    health: Mapped[str | None] = mapped_column(String(10))                        # green | amber | red
    site_count: Mapped[int] = mapped_column(Integer, default=0)
    readiness: Mapped[float | None] = mapped_column(Float)
    pa_round: Mapped[int] = mapped_column(Integer, default=0)
    age_total: Mapped[int | None] = mapped_column(Integer)
    age_at_phase: Mapped[int | None] = mapped_column(Integer)

    # milestone actual dates
    site_onair: Mapped[date | None] = mapped_column(Date)
    cluster_ready: Mapped[date | None] = mapped_column(Date)
    dt_gen: Mapped[date | None] = mapped_column(Date)
    dt_approved: Mapped[date | None] = mapped_column(Date)
    init_test: Mapped[date | None] = mapped_column(Date)
    pa_open: Mapped[date | None] = mapped_column(Date)
    tuning_closed: Mapped[date | None] = mapped_column(Date)
    pac_report: Mapped[date | None] = mapped_column(Date)
    pac_submit: Mapped[date | None] = mapped_column(Date)
    pac_approved: Mapped[date | None] = mapped_column(Date)

    # plan / payment-trigger dates
    plan_pa_open: Mapped[date | None] = mapped_column(Date)
    plan_pa_closed: Mapped[date | None] = mapped_column(Date)
    plan_pac_approved: Mapped[date | None] = mapped_column(Date)

    # geo (centroid from project_sites)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)

    po_number: Mapped[str | None] = mapped_column(String(80))   # reserved: link real PAC PO later
    source: Mapped[str] = mapped_column(String(20), default="EXCEL")
    as_of_date: Mapped[date | None] = mapped_column(Date)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # DTA payment (cost/AP side) — added 2026-06-14. The cluster owner is paid a
    # fixed per-cluster rate once PAC Approved (current_phase >= 11). Frozen
    # snapshot locks the amount at mark-paid. Distinct from billing (revenue/AR).
    dta_paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dta_paid_by: Mapped[str | None] = mapped_column(String(120))
    dta_payment_ref: Mapped[str | None] = mapped_column(String(120))
    dta_paid_amount: Mapped[float | None] = mapped_column(Float)
    dta_paid_category: Mapped[str | None] = mapped_column(String(40))
    dta_paid_site_count: Mapped[int | None] = mapped_column(Integer)

    rounds: Mapped[list["DtaClusterRound"]] = relationship(
        back_populates="cluster", cascade="all, delete-orphan", order_by="DtaClusterRound.round_no",
    )


class DtaClusterRound(Base):
    __tablename__ = "dta_cluster_rounds"
    __table_args__ = (UniqueConstraint("rf_cluster_name", "round_no", name="uq_dta_round"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rf_cluster_name: Mapped[str] = mapped_column(
        String(200), ForeignKey("dta_clusters.rf_cluster_name", ondelete="CASCADE"), index=True,
    )
    round_no: Mapped[int] = mapped_column(Integer)

    # PA loop actuals (from sheet)
    cr_date: Mapped[date | None] = mapped_column(Date)
    tuning_done: Mapped[date | None] = mapped_column(Date)
    compare_done: Mapped[date | None] = mapped_column(Date)
    discuss_date: Mapped[date | None] = mapped_column(Date)
    pa_closed: Mapped[int | None] = mapped_column(Integer)
    pa_added: Mapped[int | None] = mapped_column(Integer)

    # reserved: DTE/PAC test scheduling (filled when the team provides the data)
    test_plan_start: Mapped[date | None] = mapped_column(Date)
    test_plan_done: Mapped[date | None] = mapped_column(Date)
    test_actual_start: Mapped[date | None] = mapped_column(Date)
    test_actual_done: Mapped[date | None] = mapped_column(Date)
    test_engineer: Mapped[str | None] = mapped_column(String(200))

    cluster: Mapped["DtaCluster"] = relationship(back_populates="rounds")
