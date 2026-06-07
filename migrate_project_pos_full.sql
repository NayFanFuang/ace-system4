-- Full migration: add missing columns to project_pos
-- These columns exist in the SQLAlchemy model but were never migrated to DB

ALTER TABLE project_pos
  ADD COLUMN IF NOT EXISTS workflow_status      VARCHAR(40)  NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS mapping_confidence   INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mapping_rule         VARCHAR(120),
  ADD COLUMN IF NOT EXISTS need_mapping_review  BOOLEAN      NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS current_owner_role   VARCHAR(40)  NOT NULL DEFAULT 'FINANCE',
  ADD COLUMN IF NOT EXISTS current_owner_user   VARCHAR(120),
  ADD COLUMN IF NOT EXISTS hold_reason          TEXT,
  ADD COLUMN IF NOT EXISTS expected_release_date DATE,
  ADD COLUMN IF NOT EXISTS finance_checked_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS sent_to_project_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS project_accepted_at  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_at          TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revision             INTEGER      NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS locked               BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_action_at       TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS source               VARCHAR(30);

-- Indexes
CREATE INDEX IF NOT EXISTS ix_project_pos_workflow_status    ON project_pos (workflow_status);
CREATE INDEX IF NOT EXISTS ix_project_pos_current_owner_role ON project_pos (current_owner_role);
CREATE INDEX IF NOT EXISTS ix_project_pos_need_mapping_review ON project_pos (need_mapping_review);
CREATE INDEX IF NOT EXISTS ix_project_pos_locked             ON project_pos (locked);

-- Update existing 2 rows to sensible defaults
UPDATE project_pos SET
  workflow_status     = 'PENDING_SITE_MAP',
  current_owner_role  = 'PROJECT',
  mapping_confidence  = 100,
  need_mapping_review = false,
  revision            = 1
WHERE workflow_status = 'NEW';

-- Confirm
SELECT column_name FROM information_schema.columns
WHERE table_name = 'project_pos' ORDER BY ordinal_position;
