-- 2026-05-29: DTE report upload (.rar) on dte_presite_tracking
-- DTE Per-Site uploads a .rar matching the site they tested. PM downloads from
-- the SSV/PAC Pre-Site "Report" column.

BEGIN;

ALTER TABLE dte_presite_tracking
  ADD COLUMN IF NOT EXISTS report_file_path   TEXT,
  ADD COLUMN IF NOT EXISTS report_filename    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS report_file_size   BIGINT,
  ADD COLUMN IF NOT EXISTS report_uploaded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS report_uploaded_by VARCHAR(120),
  ADD COLUMN IF NOT EXISTS report_version     INTEGER DEFAULT 0;

COMMIT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dte_presite_tracking'
  AND column_name LIKE 'report_%'
ORDER BY column_name;
