-- 2026-05-28: SSV default duration → 0.3 day (quick check vs PAC's full-day cluster work)
-- Only backfill SSV rows that still have the migration default 1.0 — preserve any user-set values (e.g., 0.5)
BEGIN;

UPDATE project_pos
SET planned_duration_days = 0.3
WHERE work_type = 'SSV'
  AND planned_duration_days = 1.0;

COMMIT;

-- Verify
SELECT work_type, planned_duration_days, COUNT(*) AS n
FROM project_pos
WHERE work_type IN ('SSV','PAC') AND planned_duration_days IS NOT NULL
GROUP BY work_type, planned_duration_days
ORDER BY work_type, planned_duration_days;
