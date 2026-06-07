-- Migration: add real-data columns to dte_presite_tracking (SSV first; PAC sessions later)
-- Columns added so frontend can drop mock functions.

ALTER TABLE dte_presite_tracking
    ADD COLUMN IF NOT EXISTS work_type          VARCHAR(10),                -- SSV | PAC
    ADD COLUMN IF NOT EXISTS rf_cluster_name    VARCHAR(200),
    ADD COLUMN IF NOT EXISTS cluster_ready_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS site_status        VARCHAR(20),                -- CROSS | ALARM | WAIT_SITE_ACCESS | OK
    ADD COLUMN IF NOT EXISTS dta_code           VARCHAR(120),
    ADD COLUMN IF NOT EXISTS dta_name           VARCHAR(200),
    ADD COLUMN IF NOT EXISTS layers             INT;

CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_work_type ON dte_presite_tracking (work_type);
CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_cluster   ON dte_presite_tracking (rf_cluster_name);

-- ── Backfill existing rows ────────────────────────────────────────────────
-- work_type from joined PO
UPDATE dte_presite_tracking t
SET work_type = p.work_type
FROM project_pos p
WHERE t.po_id = p.id AND t.work_type IS NULL;

-- rf_cluster_name + cluster_ready_at from project_sites (via site_code)
UPDATE dte_presite_tracking t
SET rf_cluster_name  = s.rf_cluster_name,
    cluster_ready_at = CASE
        WHEN s.cluster_ready IS NOT NULL THEN s.cluster_ready::timestamptz
        ELSE t.cluster_ready_at
    END
FROM project_sites s
WHERE t.site_code = s.site_code
  AND (t.rf_cluster_name IS NULL OR t.cluster_ready_at IS NULL);

-- layers: parse "for N layer" or "for N~M layer" from PO item_dis
UPDATE dte_presite_tracking t
SET layers = COALESCE(
    NULLIF(substring(p.item_dis FROM 'for\s+(\d+)~(\d+)\s+layer')::int, 0),
    NULLIF(substring(p.item_dis FROM 'for\s+(\d+)\s+layer')::int, 0)
)
FROM project_pos p
WHERE t.po_id = p.id AND t.layers IS NULL AND p.item_dis IS NOT NULL;
