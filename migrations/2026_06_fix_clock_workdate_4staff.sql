-- Fix mis-assigned work_date for the 4 DTE/DTA staff: early-morning Bangkok clock-ins
-- (00:00-06:59 BKK = previous-day UTC) were tagged to the previous day. Re-assign work_date
-- to the Bangkok calendar date of clock-in. Scope: these 4 employees only. Backup first.
CREATE TABLE IF NOT EXISTS clock_workdate_bak_20260602 AS
SELECT id, employee_code, work_date AS old_work_date,
       (clock_in_at AT TIME ZONE 'Asia/Bangkok')::date AS new_work_date, clock_in_at
FROM clock_sessions
WHERE employee_code IN ('ACECS428','ACECS429','ACECS430','ACECS431')
  AND work_date <> (clock_in_at AT TIME ZONE 'Asia/Bangkok')::date;

UPDATE clock_sessions
SET work_date = (clock_in_at AT TIME ZONE 'Asia/Bangkok')::date
WHERE employee_code IN ('ACECS428','ACECS429','ACECS430','ACECS431')
  AND work_date <> (clock_in_at AT TIME ZONE 'Asia/Bangkok')::date;
