from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(150), index=True)
    full_name: Mapped[str] = mapped_column(String(150), index=True)
    first_name: Mapped[str | None] = mapped_column(String(80), index=True)
    last_name: Mapped[str | None] = mapped_column(String(80), index=True)
    preferred_name: Mapped[str | None] = mapped_column(String(80))
    personal_email: Mapped[str | None] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(40))
    work_phone: Mapped[str | None] = mapped_column(String(40))
    department: Mapped[str] = mapped_column(String(50), default="Project", index=True)
    job_title: Mapped[str | None] = mapped_column(String(120))
    job_level: Mapped[str | None] = mapped_column(String(50))
    manager_name: Mapped[str | None] = mapped_column(String(150))
    manager_code: Mapped[str | None] = mapped_column(String(30), index=True)  # direct manager's employee_code
    cost_center: Mapped[str | None] = mapped_column(String(80))
    work_location: Mapped[str | None] = mapped_column(String(150))
    project_team: Mapped[str] = mapped_column(String(30), default="RF", index=True)
    section_name: Mapped[str | None] = mapped_column(String(80))   # full section name e.g. "RF Project"
    project_role: Mapped[str | None] = mapped_column(String(100))  # role code e.g. "DTE", "DTA", "OSS"
    project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    project_name: Mapped[str | None] = mapped_column(String(250))
    position: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", index=True)
    employment_type: Mapped[str | None] = mapped_column(String(40))
    contract_type: Mapped[str | None] = mapped_column(String(40))
    hire_date: Mapped[date | None] = mapped_column(Date)
    probation_end_date: Mapped[date | None] = mapped_column(Date)
    termination_date: Mapped[date | None] = mapped_column(Date)
    contract_start_date: Mapped[date | None] = mapped_column(Date)
    contract_end_date: Mapped[date | None] = mapped_column(Date, index=True)
    contract_duration_months: Mapped[int | None] = mapped_column(Integer)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(20))
    nationality: Mapped[str | None] = mapped_column(String(80))
    id_card_no: Mapped[str | None] = mapped_column(String(40))
    address: Mapped[str | None] = mapped_column(Text)
    base_lat: Mapped[float | None] = mapped_column(Float)
    base_lng: Mapped[float | None] = mapped_column(Float)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(150))
    emergency_contact_relation: Mapped[str | None] = mapped_column(String(80))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(40))
    bank_name: Mapped[str | None] = mapped_column(String(100))
    bank_account_no: Mapped[str | None] = mapped_column(String(60))
    bank_account_name: Mapped[str | None] = mapped_column(String(150))
    photo_url: Mapped[str | None] = mapped_column(String(300))
    notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(30), default="Employee.xlsx")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProjectCatalog(Base):
    __tablename__ = "project_catalog"
    __table_args__ = (UniqueConstraint("project_code", name="uq_project_catalog_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_code: Mapped[str] = mapped_column(String(50), index=True)
    project_name: Mapped[str] = mapped_column(String(250))
    team: Mapped[str] = mapped_column(String(30), index=True)
    headcount: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ProjectAssignment(Base):
    __tablename__ = "project_assignments_live"
    __table_args__ = (UniqueConstraint("project_code", "employee_code", "role_in_project", name="uq_live_project_assignment"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_code: Mapped[str] = mapped_column(String(50), index=True)
    employee_code: Mapped[str] = mapped_column(String(30), index=True)
    role_in_project: Mapped[str] = mapped_column(String(50), default="OTHER", index=True)
    clock_type: Mapped[str] = mapped_column(String(20), default="DAILY")  # DAILY | PER_SITE, Project-controlled for DTE
    job_level: Mapped[str | None] = mapped_column(String(20))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    allocation_pct: Mapped[int] = mapped_column(Integer, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProjectSite(Base):
    __tablename__ = "project_sites"
    __table_args__ = (UniqueConstraint("site_code", name="uq_project_site_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    site_code: Mapped[str] = mapped_column(String(50), index=True)
    site_name: Mapped[str | None] = mapped_column(String(200))
    customer: Mapped[str | None] = mapped_column(String(50), index=True)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    gps_radius_m: Mapped[int] = mapped_column(Integer, default=500)
    province: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    full_on_air: Mapped[date | None] = mapped_column(Date)
    cluster_ready: Mapped[date | None] = mapped_column(Date)
    rf_cluster_name: Mapped[str | None] = mapped_column(String(200))
    rf_cluster_owner: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ProjectPO(Base):
    __tablename__ = "project_pos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    po_target: Mapped[str] = mapped_column(String(20), default="RF", index=True)
    project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    po_number: Mapped[str] = mapped_column(String(80), index=True)
    po_line: Mapped[str | None] = mapped_column(String(30))
    du_id: Mapped[str | None] = mapped_column(String(80))
    item_dis: Mapped[str | None] = mapped_column(String(200))
    cluster_site: Mapped[str | None] = mapped_column(String(200))
    owner: Mapped[str | None] = mapped_column(String(150))
    lat_long: Mapped[str | None] = mapped_column(String(80))
    on_air: Mapped[date | None] = mapped_column(Date)
    cluster_type: Mapped[str | None] = mapped_column(String(150))
    work_type: Mapped[str | None] = mapped_column(String(20), index=True)  # SSV | PAC
    ace_project_code: Mapped[str | None] = mapped_column(String(30), index=True)  # HWT2304 | HWT2604
    hw_id: Mapped[str | None] = mapped_column(String(50), index=True)  # HW system unique ID
    vendor: Mapped[str | None] = mapped_column(String(20), index=True)  # HW | ERICSSON | NBTC
    hw_status_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hw_prev_status: Mapped[str | None] = mapped_column(String(40))      # status ก่อนเปลี่ยน (เช่น OPEN ก่อน → Cancelled)
    hw_first_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # รอบ import แรกที่เจอ PO นี้ (= NEW)
    site_code: Mapped[str | None] = mapped_column(String(50), index=True)  # mapped site
    workflow_status: Mapped[str] = mapped_column(String(40), default="NEW", index=True)
    mapping_confidence: Mapped[int] = mapped_column(Integer, default=0)
    mapping_rule: Mapped[str | None] = mapped_column(String(120))
    need_mapping_review: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    current_owner_role: Mapped[str] = mapped_column(String(40), default="FINANCE", index=True)
    current_owner_user: Mapped[str | None] = mapped_column(String(120))
    hold_reason: Mapped[str | None] = mapped_column(Text)
    expected_release_date: Mapped[date | None] = mapped_column(Date)
    finance_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_to_project_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    project_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revision: Mapped[int] = mapped_column(Integer, default=1)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_action_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Plan DTE
    planned_dte_codes: Mapped[str | None] = mapped_column(Text)
    planned_dte_names: Mapped[str | None] = mapped_column(Text)
    planned_start_date: Mapped[date | None] = mapped_column(Date)
    planned_end_date: Mapped[date | None] = mapped_column(Date)
    # Fractional-day planning: 0.3 = quick visit (~2.4h), 1.0 = full day, up to 7.0 = week-long cluster
    planned_duration_days: Mapped[float | None] = mapped_column(Numeric(3, 1))
    planned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    work_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    work_done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Leader Review
    leader_code: Mapped[str | None] = mapped_column(String(30), index=True)
    leader_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    leader_note: Mapped[str | None] = mapped_column(Text)
    # HW Evidence
    hw_evidence_url: Mapped[str | None] = mapped_column(String(500))
    hw_evidence_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Finance Pay DTE
    dte_paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dte_paid_by: Mapped[str | None] = mapped_column(String(120))
    # Finance Bill HW
    hw_billed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hw_billed_by: Mapped[str | None] = mapped_column(String(120))
    hw_invoice_no: Mapped[str | None] = mapped_column(String(80))
    line_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    payment_terms: Mapped[str | None] = mapped_column(String(20))
    # HW Billing plan & actual, split per AC milestone (AC1 = first invoice,
    # AC2 = second invoice for 70/30 terms). plan_month = "YYYY-MM" we forecast
    # to bill; billed_at = when actually invoiced; invoice_no = HW invoice ref.
    ac1_plan_month: Mapped[str | None] = mapped_column(String(7))
    ac1_billed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ac1_invoice_no: Mapped[str | None] = mapped_column(String(80))
    ac2_plan_month: Mapped[str | None] = mapped_column(String(7))
    ac2_billed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ac2_invoice_no: Mapped[str | None] = mapped_column(String(80))
    hw_po_status: Mapped[str | None] = mapped_column(String(20))
    hw_data: Mapped[dict | None] = mapped_column(JSON)
    source: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HWImportLog(Base):
    __tablename__ = "hw_import_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    file_name: Mapped[str | None] = mapped_column(String(200))
    file_size_kb: Mapped[float | None] = mapped_column(Float)
    imported: Mapped[int] = mapped_column(Integer, default=0)
    updated: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    imported_by: Mapped[str | None] = mapped_column(String(150))
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EmployeeRelocation(Base):
    __tablename__ = "employee_relocations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), index=True)
    full_name: Mapped[str | None] = mapped_column(String(150))
    from_project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    from_project_name: Mapped[str | None] = mapped_column(String(250))
    to_project_code: Mapped[str | None] = mapped_column(String(50), index=True)
    to_project_name: Mapped[str | None] = mapped_column(String(250))
    effective_date: Mapped[date] = mapped_column(Date, index=True)
    reason: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
