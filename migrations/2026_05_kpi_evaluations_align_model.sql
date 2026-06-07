-- Align prod kpi_evaluations with current SQLAlchemy model (app/models/kpi.py).
-- Prod's table predates the soft-delete + SELF/PM rater split, so create_all (which
-- never ALTERs existing tables) left it missing 4 columns and using the old 3-col
-- unique constraint. This blocks: (a) loading data that has both SELF and PM rows for
-- the same (employee, period, item), and (b) the self-assessment upsert in kpi_self.py.
--
-- Safe to run repeatedly (IF [NOT] EXISTS guards). Run on an EMPTY table ideally.
--   docker exec -i ace-system-postgres psql -U ace_user -d ace_system -v ON_ERROR_STOP=1 -1 -f <thisfile>

-- Widen columns that prod created too narrow (older model). All widenings are safe.
-- eval_id holds 36-char UUIDs; source_updated_at holds ~32-char ISO timestamps.
ALTER TABLE kpi_evaluations   ALTER COLUMN eval_id           TYPE VARCHAR(60);
ALTER TABLE kpi_evaluations   ALTER COLUMN source_updated_at TYPE VARCHAR(40);
ALTER TABLE kpi_items         ALTER COLUMN source_updated_at TYPE VARCHAR(40);
ALTER TABLE kpi_period_items  ALTER COLUMN source_updated_at TYPE VARCHAR(40);

ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS rater_type   VARCHAR(10) NOT NULL DEFAULT 'PM';
ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMP;
ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS deleted_by   VARCHAR(40);
ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Replace the old 3-column unique with the model's 4-column unique (adds rater_type).
ALTER TABLE kpi_evaluations DROP CONSTRAINT IF EXISTS uq_kpi_eval_emp_period_item;
ALTER TABLE kpi_evaluations DROP CONSTRAINT IF EXISTS uq_kpi_eval_emp_period_item_rater;
ALTER TABLE kpi_evaluations ADD  CONSTRAINT uq_kpi_eval_emp_period_item_rater
    UNIQUE (employee_name, period, item_id, rater_type);

-- Indexes the model declares (index=True) — create_all would have made these.
CREATE INDEX IF NOT EXISTS ix_kpi_evaluations_rater_type ON kpi_evaluations (rater_type);
CREATE INDEX IF NOT EXISTS ix_kpi_evaluations_deleted_at ON kpi_evaluations (deleted_at);
