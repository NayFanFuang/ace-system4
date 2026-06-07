-- 2026-05-28: Clear "ghost" planned_dte_codes on POs that were never properly mapped.
-- Symptoms:
--   - planned_dte_codes set to deprecated/non-PER_SITE DTE codes
--     (ACE056=Peerapol PM, ACECS258/384/406 = ex-DTE)
--   - site_code is NULL or ''
--   - workflow_status = 'PENDING_SITE_MAP' (never moved past mapping)
--   - planned_at IS NULL (never went through the new Plan endpoint)
--
-- This was confusing the Plan Board into showing 101 SSV+PAC items vs SSV Pre-Site's 1 real row.
-- Safe to clear — these never made it into the presite_tracking workflow.

BEGIN;

-- Snapshot before for audit (count + sample)
\echo '── BEFORE ──'
SELECT 'ghost' AS kind, COUNT(*) FROM project_pos
WHERE planned_dte_codes IS NOT NULL
  AND (site_code IS NULL OR site_code = '')
  AND workflow_status = 'PENDING_SITE_MAP'
  AND planned_dte_codes NOT IN ('ACECS432','ACECS433','ACECS434','ACECS435','ACECS436');

-- Clear plan fields on ghost rows
UPDATE project_pos
SET
  planned_dte_codes     = NULL,
  planned_dte_names     = NULL,
  planned_start_date    = NULL,
  planned_end_date      = NULL,
  planned_duration_days = NULL,
  planned_at            = NULL
WHERE planned_dte_codes IS NOT NULL
  AND (site_code IS NULL OR site_code = '')
  AND workflow_status = 'PENDING_SITE_MAP'
  AND planned_dte_codes NOT IN ('ACECS432','ACECS433','ACECS434','ACECS435','ACECS436');

COMMIT;

\echo '── AFTER ──'
SELECT 'still_planned' AS kind, COUNT(*) FROM project_pos
WHERE planned_dte_codes IS NOT NULL;

SELECT id, work_type, site_code, cluster_site, workflow_status, planned_dte_codes, planned_start_date
FROM project_pos
WHERE planned_dte_codes IS NOT NULL
ORDER BY work_type, id;
