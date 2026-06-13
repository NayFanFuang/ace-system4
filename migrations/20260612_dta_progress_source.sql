-- DTA self-service progress provenance + assignee identity link.
-- Idempotent; safe to re-run. Apply manually on prod (create_all does NOT ALTER existing tables):
--   docker exec -i ace-system-postgres psql -U ace_user -d ace_system < migrations/20260612_dta_progress_source.sql
--
-- progress_source is SEPARATE from owner_source: when a DTA edits progress in-app it becomes
-- 'MANUAL' and the Excel ETL stops overwriting that cluster's milestones/status/phase/rounds
-- (geo + po_number keep syncing).
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS progress_source VARCHAR(10) DEFAULT 'EXCEL';
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS progress_edited_at TIMESTAMPTZ;
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS progress_edited_by VARCHAR(120);
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS assigned_employee_code VARCHAR(40);
UPDATE dta_clusters SET progress_source = 'EXCEL' WHERE progress_source IS NULL;
CREATE INDEX IF NOT EXISTS ix_dta_clusters_assigned_emp ON dta_clusters (assigned_employee_code);
