-- PO Phase 2 Migration: Plan DTE / Leader Review / Finance Pay+Bill columns

ALTER TABLE project_pos
  ADD COLUMN IF NOT EXISTS planned_dte_codes      TEXT,
  ADD COLUMN IF NOT EXISTS planned_dte_names      TEXT,
  ADD COLUMN IF NOT EXISTS planned_start_date     DATE,
  ADD COLUMN IF NOT EXISTS planned_end_date       DATE,
  ADD COLUMN IF NOT EXISTS planned_at             TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS work_started_at        TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS work_done_at           TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS leader_code            VARCHAR(30),
  ADD COLUMN IF NOT EXISTS leader_checked_at      TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS leader_note            TEXT,
  ADD COLUMN IF NOT EXISTS hw_evidence_url        VARCHAR(500),
  ADD COLUMN IF NOT EXISTS hw_evidence_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dte_paid_at            TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dte_paid_by            VARCHAR(120),
  ADD COLUMN IF NOT EXISTS hw_billed_at           TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS hw_billed_by           VARCHAR(120),
  ADD COLUMN IF NOT EXISTS hw_invoice_no          VARCHAR(80),
  ADD COLUMN IF NOT EXISTS source                 VARCHAR(30);

CREATE INDEX IF NOT EXISTS ix_project_pos_leader_code     ON project_pos (leader_code);
CREATE INDEX IF NOT EXISTS ix_project_pos_planned_start   ON project_pos (planned_start_date);

SELECT column_name FROM information_schema.columns
WHERE table_name = 'project_pos' ORDER BY ordinal_position;
