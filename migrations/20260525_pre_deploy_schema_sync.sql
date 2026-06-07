-- Migration: 20260525_pre_deploy_schema_sync
-- Purpose: Sync prod schema with local models before deploying
--          ClockApp / ACE Clock Monitor / HR Employees code updates.
--
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS) so re-running
-- this file is safe. No data is deleted or modified — only ALTER ... ADD.
--
-- Apply before restarting backend container, e.g.:
--   docker exec -i ace-system-postgres psql -U ace_user -d ace_system \
--     < /tmp/20260525_pre_deploy_schema_sync.sql

BEGIN;

-- ─── 1. employees: contract tracking + GPS base position ─────────────────────
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS contract_start_date      DATE,
    ADD COLUMN IF NOT EXISTS contract_end_date        DATE,
    ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER,
    ADD COLUMN IF NOT EXISTS base_lat                 DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS base_lng                 DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS ix_employees_contract_end_date
    ON employees (contract_end_date);

-- ─── 2. clock_sessions: outcome column (separates state from work outcome) ───
-- (Subset of 20260518_clock_outcome_indexes.sql — re-applied here for safety)
ALTER TABLE clock_sessions
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(20) NULL;

-- Backfill: where session is closed and old status held the outcome
UPDATE clock_sessions
SET outcome = status
WHERE clock_out_at IS NOT NULL
  AND status IN ('COMPLETE', 'COMPLETED', 'STOP', 'ISSUE')
  AND outcome IS NULL;

UPDATE clock_sessions SET outcome = 'COMPLETE' WHERE outcome = 'COMPLETED';

UPDATE clock_sessions
SET status = 'CLOSED'
WHERE clock_out_at IS NOT NULL
  AND status IN ('COMPLETE', 'COMPLETED', 'STOP', 'ISSUE');

CREATE INDEX IF NOT EXISTS ix_clock_sessions_site_code
    ON clock_sessions (site_code);
CREATE INDEX IF NOT EXISTS ix_clock_sessions_clock_in_at
    ON clock_sessions (clock_in_at DESC);

-- ─── 3. project_pos: 24 new columns referenced by employees.py / clock.py ───
ALTER TABLE project_pos
    ADD COLUMN IF NOT EXISTS ace_project_code         VARCHAR(30),
    ADD COLUMN IF NOT EXISTS hw_id                    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS hw_status_changed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS planned_dte_codes        TEXT,
    ADD COLUMN IF NOT EXISTS planned_dte_names        TEXT,
    ADD COLUMN IF NOT EXISTS planned_start_date       DATE,
    ADD COLUMN IF NOT EXISTS planned_end_date         DATE,
    ADD COLUMN IF NOT EXISTS planned_at               TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS work_started_at          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS work_done_at             TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS leader_code              VARCHAR(30),
    ADD COLUMN IF NOT EXISTS leader_checked_at        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS leader_note              TEXT,
    ADD COLUMN IF NOT EXISTS hw_evidence_url          VARCHAR(500),
    ADD COLUMN IF NOT EXISTS hw_evidence_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dte_paid_at              TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dte_paid_by              VARCHAR(120),
    ADD COLUMN IF NOT EXISTS hw_billed_at             TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hw_billed_by             VARCHAR(120),
    ADD COLUMN IF NOT EXISTS hw_invoice_no            VARCHAR(80),
    ADD COLUMN IF NOT EXISTS line_amount              NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS payment_terms            VARCHAR(20),
    ADD COLUMN IF NOT EXISTS hw_po_status             VARCHAR(20),
    ADD COLUMN IF NOT EXISTS hw_data                  JSON;

CREATE INDEX IF NOT EXISTS ix_project_pos_ace_project_code
    ON project_pos (ace_project_code);
CREATE INDEX IF NOT EXISTS ix_project_pos_hw_id
    ON project_pos (hw_id);
CREATE INDEX IF NOT EXISTS ix_project_pos_leader_code
    ON project_pos (leader_code);
CREATE INDEX IF NOT EXISTS ix_project_pos_planned_dte_codes
    ON project_pos (planned_dte_codes);
CREATE INDEX IF NOT EXISTS ix_project_pos_cluster_site
    ON project_pos (cluster_site);

COMMIT;

-- ─── Verification (read-only, for human eyeballing post-apply) ──────────────
\echo '── employees new columns ──'
SELECT column_name FROM information_schema.columns
WHERE table_name='employees'
  AND column_name IN ('contract_start_date','contract_end_date',
                      'contract_duration_months','base_lat','base_lng')
ORDER BY column_name;

\echo '── clock_sessions outcome ──'
SELECT column_name FROM information_schema.columns
WHERE table_name='clock_sessions' AND column_name='outcome';

\echo '── project_pos new column count (expected 24) ──'
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name='project_pos'
  AND column_name IN ('ace_project_code','hw_id','hw_status_changed_at',
    'planned_dte_codes','planned_dte_names','planned_start_date',
    'planned_end_date','planned_at','work_started_at','work_done_at',
    'leader_code','leader_checked_at','leader_note','hw_evidence_url',
    'hw_evidence_confirmed_at','dte_paid_at','dte_paid_by','hw_billed_at',
    'hw_billed_by','hw_invoice_no','line_amount','payment_terms',
    'hw_po_status','hw_data');

\echo '── row counts unchanged (no data touched) ──'
SELECT 'clock_sessions' AS tbl, COUNT(*) FROM clock_sessions
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'project_pos', COUNT(*) FROM project_pos;
