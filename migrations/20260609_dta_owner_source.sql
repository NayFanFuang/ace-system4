-- DTA cluster owner provenance + PO link.
-- Idempotent; safe to re-run. Apply on prod after deploying the model.
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS owner_source VARCHAR(10) DEFAULT 'EXCEL';
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS assigned_at  TIMESTAMPTZ;
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS assigned_by  VARCHAR(120);
UPDATE dta_clusters SET owner_source = 'EXCEL' WHERE owner_source IS NULL;

-- Phase C handoff: DTE-finished signal (separate from milestone cols; ETL never touches it)
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS dte_ready_at TIMESTAMPTZ;
ALTER TABLE dta_clusters ADD COLUMN IF NOT EXISTS dte_ready_by VARCHAR(120);
