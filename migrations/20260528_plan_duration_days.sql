-- 2026-05-28: Add planned_duration_days to project_pos
-- Supports fractional-day planning (0.3 = half-day quick visit, 1.0 = full day, up to 7.0 = week-long cluster)
-- Used by new Plan Board (Multi-Stack Gantt) UI in PreSiteMonitorPage.

BEGIN;

-- 1. Add column (idempotent)
ALTER TABLE project_pos
  ADD COLUMN IF NOT EXISTS planned_duration_days NUMERIC(3,1);

-- 2. Add check constraint (only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_pos_planned_duration_days_range'
  ) THEN
    ALTER TABLE project_pos
      ADD CONSTRAINT project_pos_planned_duration_days_range
      CHECK (planned_duration_days IS NULL OR (planned_duration_days >= 0.3 AND planned_duration_days <= 7.0));
  END IF;
END$$;

-- 3. Backfill: rows that have planned_start_date + planned_end_date → compute duration
-- (end - start + 1) but cap at 7
UPDATE project_pos
SET planned_duration_days = LEAST(7.0, GREATEST(0.3, (planned_end_date - planned_start_date + 1)::NUMERIC(3,1)))
WHERE planned_start_date IS NOT NULL
  AND planned_end_date IS NOT NULL
  AND planned_duration_days IS NULL;

-- 4. Rows with only start_date (no end) → default 1.0 day
UPDATE project_pos
SET planned_duration_days = 1.0
WHERE planned_start_date IS NOT NULL
  AND planned_end_date IS NULL
  AND planned_duration_days IS NULL;

COMMIT;

-- Verify
SELECT
  COUNT(*) FILTER (WHERE planned_duration_days IS NOT NULL) AS with_duration,
  COUNT(*) FILTER (WHERE planned_duration_days IS NULL AND planned_dte_codes IS NOT NULL) AS planned_no_duration,
  MIN(planned_duration_days) AS min_dur,
  MAX(planned_duration_days) AS max_dur,
  AVG(planned_duration_days)::NUMERIC(3,1) AS avg_dur
FROM project_pos;
