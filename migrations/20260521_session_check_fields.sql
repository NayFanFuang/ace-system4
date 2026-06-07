-- Extend dte_presite_sessions with plan + check fields
-- So each session represents: plan → test (start/end) → check (pass/fail)
-- Used by both SSV and PAC (SSV typically 1 round, more if re-plan after FAIL)

ALTER TABLE dte_presite_sessions
    ADD COLUMN IF NOT EXISTS planned_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS planned_by     VARCHAR(120),
    ADD COLUMN IF NOT EXISTS check_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS check_by       VARCHAR(120),
    ADD COLUMN IF NOT EXISTS check_result   VARCHAR(10),       -- PASS | FAIL
    ADD COLUMN IF NOT EXISTS check_notes    TEXT;

-- Backfill: for SSV tracking rows that have existing data, create 1 session
INSERT INTO dte_presite_sessions
  (tracking_id, round_number, planned_at, planned_by,
   started_at, started_by, ended_at, ended_by,
   check_at, check_by, check_result, check_notes, status)
SELECT
  t.id, 1,
  t.full_onair_at, 'SYSTEM',
  t.dt_started_at, t.dt_started_by, t.dt_done_at, t.dt_done_by,
  t.check_at, t.check_by, t.check_result, t.check_notes,
  CASE
    WHEN t.check_at IS NOT NULL THEN 'DONE'
    WHEN t.dt_done_at IS NOT NULL THEN 'DONE'
    WHEN t.dt_started_at IS NOT NULL THEN 'IN_PROGRESS'
    ELSE 'PENDING'
  END
FROM dte_presite_tracking t
WHERE t.work_type = 'SSV'
  AND NOT EXISTS (SELECT 1 FROM dte_presite_sessions s WHERE s.tracking_id = t.id);

UPDATE dte_presite_tracking SET total_rounds = 1 WHERE work_type='SSV' AND total_rounds IS NULL;

SELECT tracking_id, COUNT(*) AS sessions FROM dte_presite_sessions GROUP BY tracking_id ORDER BY tracking_id LIMIT 5;
