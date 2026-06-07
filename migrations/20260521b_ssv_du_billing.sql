-- Migration: SSV billing chain — track per (DU + item_dis) instead of per cluster_site
-- ──────────────────────────────────────────────────────────────────────────────
-- Context: SSV 1 billable item = 1 DU + 1 item_dis (on 1 PO line).
--          Previously tracking used (po_id, site_code) which collapsed multi-DU
--          clusters into single tracking rows. This migration:
--   1. Adds billing-relevant columns to dte_presite_tracking
--   2. Backfills project_pos.hw_id from hw_data->>'ID' (legacy data)
--   3. Backfills tracking rows from their PO
--   4. Switches unique constraint to po_id (1 PO line = 1 tracking row)
-- ──────────────────────────────────────────────────────────────────────────────

-- Step 1: Add billing-handoff columns to project_pos.hw_id (already exists)
--         and backfill from hw_data JSON
UPDATE project_pos
SET hw_id = hw_data->>'ID'
WHERE hw_id IS NULL AND hw_data->>'ID' IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_project_pos_hw_id ON project_pos(hw_id);

-- Step 2: Extend dte_presite_tracking with billing-handoff fields
ALTER TABLE dte_presite_tracking
  ADD COLUMN IF NOT EXISTS du_id           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS item_dis        TEXT,
  ADD COLUMN IF NOT EXISTS hw_id           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS line_amount     NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS payment_terms   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS billing_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_sent_by VARCHAR(120),
  ADD COLUMN IF NOT EXISTS billing_ref     VARCHAR(120);

CREATE INDEX IF NOT EXISTS ix_dte_presite_du_id  ON dte_presite_tracking(du_id);
CREATE INDEX IF NOT EXISTS ix_dte_presite_hw_id  ON dte_presite_tracking(hw_id);

-- Step 3: Backfill tracking → PO billing fields
UPDATE dte_presite_tracking t
SET du_id         = p.du_id,
    item_dis      = p.item_dis,
    hw_id         = COALESCE(p.hw_id, p.hw_data->>'ID'),
    line_amount   = p.line_amount,
    payment_terms = p.payment_terms
FROM project_pos p
WHERE t.po_id = p.id;

-- Step 4: Change UNIQUE constraint from (po_id, site_code) → (po_id)
--         Because 1 PO line = 1 billable unit = 1 tracking row.
ALTER TABLE dte_presite_tracking DROP CONSTRAINT IF EXISTS uq_dte_presite_po_site;
ALTER TABLE dte_presite_tracking ADD CONSTRAINT uq_dte_presite_po_id UNIQUE (po_id);

-- Sanity check: every SSV tracking should now have du_id + item_dis + hw_id populated
-- (PAC may have du_id=NULL since PAC = cluster level work)
SELECT
  work_type,
  COUNT(*) AS total,
  COUNT(du_id) AS with_du,
  COUNT(hw_id) AS with_hw_id,
  COUNT(line_amount) AS with_line_amount
FROM dte_presite_tracking
GROUP BY work_type
ORDER BY work_type;
