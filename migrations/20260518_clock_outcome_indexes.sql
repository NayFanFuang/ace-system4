-- Migration: 20260518_clock_outcome_indexes
-- 1. Add outcome column to clock_sessions (separates session state from work outcome)
-- 2. Backfill outcome from legacy status values
-- 3. Reset status to canonical values (ACTIVE | CLOCK_IN | CLOSED)
-- 4. Add missing performance indexes

-- ── 1. Add outcome column ────────────────────────────────────────────────────
ALTER TABLE clock_sessions
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(20) NULL;

-- ── 2. Backfill: rows where clock_out_at IS NOT NULL and status was the outcome
UPDATE clock_sessions
SET outcome = status
WHERE clock_out_at IS NOT NULL
  AND status IN ('COMPLETE', 'COMPLETED', 'STOP', 'ISSUE')
  AND outcome IS NULL;

-- Normalize legacy COMPLETED → COMPLETE
UPDATE clock_sessions
SET outcome = 'COMPLETE'
WHERE outcome = 'COMPLETED';

-- ── 3. Reset status to CLOSED for all completed sessions
UPDATE clock_sessions
SET status = 'CLOSED'
WHERE clock_out_at IS NOT NULL
  AND status IN ('COMPLETE', 'COMPLETED', 'STOP', 'ISSUE');

-- ── 4. Missing performance indexes ──────────────────────────────────────────
-- Used in PER_SITE site-level filtering and clock history queries
CREATE INDEX IF NOT EXISTS ix_clock_sessions_site_code
    ON clock_sessions (site_code);

-- Used in monitor time-series queries (ORDER BY clock_in_at DESC)
CREATE INDEX IF NOT EXISTS ix_clock_sessions_clock_in_at
    ON clock_sessions (clock_in_at DESC);

-- Used in PO sync: planned_dte_codes = employee_code (full-value match)
CREATE INDEX IF NOT EXISTS ix_project_pos_planned_dte_codes
    ON project_pos (planned_dte_codes);

-- Used in PO sync: split_part(cluster_site, '_', 1) — partial functional index
-- Note: exact functional index requires same expression as the query
CREATE INDEX IF NOT EXISTS ix_project_pos_cluster_site
    ON project_pos (cluster_site);
