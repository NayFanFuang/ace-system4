-- 2026-05-29: DTE payment status on dte_presite_tracking
-- Finance/PM marks a site's DTE income as paid. DTE sees paid/unpaid (read-only).

BEGIN;

ALTER TABLE dte_presite_tracking
  ADD COLUMN IF NOT EXISTS dte_paid_at      TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dte_paid_by      VARCHAR(120),
  ADD COLUMN IF NOT EXISTS dte_payment_ref  VARCHAR(120);

COMMIT;

SELECT column_name FROM information_schema.columns
WHERE table_name='dte_presite_tracking' AND column_name LIKE 'dte_paid%' OR column_name='dte_payment_ref'
ORDER BY column_name;
