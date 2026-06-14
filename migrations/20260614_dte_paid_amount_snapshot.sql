-- 2026-06-14: Snapshot DTE payment amount at mark-paid time.
-- Income is otherwise recomputed live from dte_rates.py on every finance query,
-- so a later rate change / cluster size change / item_dis edit silently shifts
-- the reported "paid" total away from what was actually disbursed. Freeze the
-- computed breakdown into the row when Finance marks it paid (audit integrity).
-- Safe to run more than once.

BEGIN;

ALTER TABLE dte_presite_tracking
  ADD COLUMN IF NOT EXISTS dte_paid_amount        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS dte_paid_income_dt     NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS dte_paid_income_report NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS dte_paid_category      VARCHAR(40),
  ADD COLUMN IF NOT EXISTS dte_paid_site_count    INTEGER;

COMMIT;

SELECT column_name FROM information_schema.columns
WHERE table_name='dte_presite_tracking' AND column_name LIKE 'dte_paid%'
ORDER BY column_name;
