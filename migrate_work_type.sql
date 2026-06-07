-- Add work_type column to project_pos
-- work_type: SSV (Site Survey) | PAC (Project Acceptance Certificate)

ALTER TABLE project_pos
  ADD COLUMN IF NOT EXISTS work_type VARCHAR(20);

CREATE INDEX IF NOT EXISTS ix_project_pos_work_type ON project_pos (work_type);

-- Summary
SELECT
  work_type,
  workflow_status,
  COUNT(*) AS cnt
FROM project_pos
GROUP BY work_type, workflow_status
ORDER BY work_type, workflow_status;
