-- Fix: DTE self-assessment data for the 8 DTE staff was saved under 2026-06 (page defaulted
-- to the current calendar month) but belongs to the 2026-05 round. Consolidate to 2026-05.
-- For staff who have BOTH months (overlap), 2026-05 is newer-or-equal, so we keep 2026-05 and
-- drop the 2026-06 duplicate; staff with only 2026-06 are moved to 2026-05.
-- Scope: rater_type=SELF, item_id LIKE 'KPI-DTE-%', the 8 DTE employees. Single transaction.

-- Backup the rows we touch (run-once; safe to re-run, keeps first snapshot)
CREATE TABLE IF NOT EXISTS kpi_eval_bak_dte_20260602 AS
SELECT * FROM kpi_evaluations
WHERE rater_type='SELF' AND period='2026-06' AND item_id LIKE 'KPI-DTE-%'
  AND upper(employee_name) IN (
    SELECT upper(full_name) FROM employees WHERE employee_code IN
    ('ACECS258','ACECS398','ACECS410','ACECS407','ACECS399','ACECS397','ACECS406','ACECS400'));

-- 1) Drop 2026-06 rows that already have a 2026-05 counterpart (keep the newer 2026-05)
DELETE FROM kpi_evaluations e
WHERE e.rater_type='SELF' AND e.period='2026-06' AND e.item_id LIKE 'KPI-DTE-%'
  AND upper(e.employee_name) IN (
    SELECT upper(full_name) FROM employees WHERE employee_code IN
    ('ACECS258','ACECS398','ACECS410','ACECS407','ACECS399','ACECS397','ACECS406','ACECS400'))
  AND EXISTS (
    SELECT 1 FROM kpi_evaluations e2
    WHERE e2.employee_name=e.employee_name AND e2.item_id=e.item_id
      AND e2.rater_type='SELF' AND e2.period='2026-05' AND e2.deleted_at IS NULL);

-- 2) Move remaining 2026-06 rows (no 2026-05 counterpart) to 2026-05
UPDATE kpi_evaluations e SET period='2026-05', updated_at=now()
WHERE e.rater_type='SELF' AND e.period='2026-06' AND e.item_id LIKE 'KPI-DTE-%'
  AND upper(e.employee_name) IN (
    SELECT upper(full_name) FROM employees WHERE employee_code IN
    ('ACECS258','ACECS398','ACECS410','ACECS407','ACECS399','ACECS397','ACECS406','ACECS400'));
