-- Add SELF/PM rater dimension to KPI evaluations (dual evaluation).
-- Existing rows are treated as PM (manager/official).
ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS rater_type VARCHAR(10) DEFAULT 'PM';
UPDATE kpi_evaluations SET rater_type = 'PM' WHERE rater_type IS NULL;

ALTER TABLE kpi_evaluations DROP CONSTRAINT IF EXISTS uq_kpi_eval_emp_period_item;
ALTER TABLE kpi_evaluations
  ADD CONSTRAINT uq_kpi_eval_emp_period_item_rater
  UNIQUE (employee_name, period, item_id, rater_type);

CREATE INDEX IF NOT EXISTS ix_kpi_evaluations_rater_type ON kpi_evaluations (rater_type);
