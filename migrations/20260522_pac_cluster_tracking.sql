-- Migration: PAC tracking shifts from per-PO to per-Cluster
-- ──────────────────────────────────────────────────────────────────────────────
-- Concept:
--   SSV: 1 PO = 1 DU + 1 item_dis = 1 tracking row    (clock-in by DU)
--   PAC: 1 Cluster = N POs (N DUs)    = 1 tracking row (clock-in by Cluster)
--
-- Changes:
--   1. Add column `cluster_key` (= rf_cluster_name for PAC)
--   2. Make `po_id` nullable (PAC tracking has no single PO)
--   3. Replace single-column unique on po_id with two partial unique indexes:
--        - SSV: UNIQUE (po_id) WHERE work_type='SSV'
--        - PAC: UNIQUE (cluster_key) WHERE work_type='PAC'
--   4. Cleanup existing PAC rows: dedupe → 1 per cluster, set cluster_key
-- ──────────────────────────────────────────────────────────────────────────────

-- Step 1: schema additions
ALTER TABLE dte_presite_tracking
  ADD COLUMN IF NOT EXISTS cluster_key VARCHAR(200);

ALTER TABLE dte_presite_tracking
  ALTER COLUMN po_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS ix_dte_presite_cluster_key
  ON dte_presite_tracking(cluster_key);

-- Step 2: backfill cluster_key for existing PAC rows (= rf_cluster_name)
UPDATE dte_presite_tracking
SET cluster_key = COALESCE(rf_cluster_name, site_code)
WHERE work_type = 'PAC' AND cluster_key IS NULL;

-- Step 3: dedupe existing PAC trackings (1 cluster could have 3+ per-PO rows now → keep most-advanced)
-- Stage priority order for "best to keep":
--   ACE_APPROVED > REPORT_DONE > CHECKING > DT_DONE > DT_STARTED > FULL_ONAIR
WITH ranked AS (
  SELECT id, cluster_key,
    ROW_NUMBER() OVER (
      PARTITION BY cluster_key
      ORDER BY CASE current_stage
        WHEN 'ACE_APPROVED' THEN 1
        WHEN 'REPORT_DONE'  THEN 2
        WHEN 'CHECKING'     THEN 3
        WHEN 'DT_DONE'      THEN 4
        WHEN 'DT_STARTED'   THEN 5
        WHEN 'FULL_ONAIR'   THEN 6
        ELSE 9 END,
        id DESC
    ) AS rk
  FROM dte_presite_tracking
  WHERE work_type = 'PAC'
),
to_drop AS (SELECT id FROM ranked WHERE rk > 1)
-- Reassign sessions and history to kept row before dropping duplicates
, kept AS (SELECT id, cluster_key FROM ranked WHERE rk = 1)
, drop_set AS (
  SELECT d.id AS drop_id, k.id AS keep_id, d.cluster_key
  FROM ranked d JOIN kept k ON k.cluster_key = d.cluster_key
  WHERE d.rk > 1
)
UPDATE dte_presite_sessions s
SET tracking_id = ds.keep_id
FROM drop_set ds
WHERE s.tracking_id = ds.drop_id;

WITH ranked AS (
  SELECT id, cluster_key,
    ROW_NUMBER() OVER (
      PARTITION BY cluster_key
      ORDER BY CASE current_stage
        WHEN 'ACE_APPROVED' THEN 1 WHEN 'REPORT_DONE' THEN 2
        WHEN 'CHECKING'     THEN 3 WHEN 'DT_DONE'     THEN 4
        WHEN 'DT_STARTED'   THEN 5 WHEN 'FULL_ONAIR'  THEN 6
        ELSE 9 END,
        id DESC
    ) AS rk
  FROM dte_presite_tracking
  WHERE work_type = 'PAC'
),
kept AS (SELECT id, cluster_key FROM ranked WHERE rk = 1),
drop_set AS (
  SELECT d.id AS drop_id, k.id AS keep_id
  FROM ranked d JOIN kept k ON k.cluster_key = d.cluster_key
  WHERE d.rk > 1
)
UPDATE dte_presite_history h
SET tracking_id = ds.keep_id
FROM drop_set ds
WHERE h.tracking_id = ds.drop_id;

-- Drop duplicate PAC rows (keep one per cluster)
WITH ranked AS (
  SELECT id, cluster_key,
    ROW_NUMBER() OVER (
      PARTITION BY cluster_key
      ORDER BY CASE current_stage
        WHEN 'ACE_APPROVED' THEN 1 WHEN 'REPORT_DONE' THEN 2
        WHEN 'CHECKING'     THEN 3 WHEN 'DT_DONE'     THEN 4
        WHEN 'DT_STARTED'   THEN 5 WHEN 'FULL_ONAIR'  THEN 6
        ELSE 9 END,
        id DESC
    ) AS rk
  FROM dte_presite_tracking
  WHERE work_type = 'PAC'
)
DELETE FROM dte_presite_tracking
WHERE id IN (SELECT id FROM ranked WHERE rk > 1);

-- Step 4: PAC rows now represent the cluster, not a single PO. Clear po_id (cluster has no single PO).
--         Keep du_id/item_dis NULL (cluster has no single DU).
UPDATE dte_presite_tracking
SET po_id = NULL,
    du_id = NULL,
    item_dis = NULL,
    site_code = cluster_key  -- so site_code shows the cluster name (consistent with auto_link match key)
WHERE work_type = 'PAC';

-- Step 5: drop old constraint + add partial unique indexes
ALTER TABLE dte_presite_tracking DROP CONSTRAINT IF EXISTS uq_dte_presite_po_id;
DROP INDEX IF EXISTS uq_dte_presite_po_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dte_presite_ssv_po
  ON dte_presite_tracking(po_id)
  WHERE work_type = 'SSV' AND po_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dte_presite_pac_cluster
  ON dte_presite_tracking(cluster_key)
  WHERE work_type = 'PAC' AND cluster_key IS NOT NULL;

-- Sanity
SELECT
  work_type,
  COUNT(*) AS rows,
  COUNT(DISTINCT po_id) AS distinct_po,
  COUNT(DISTINCT cluster_key) AS distinct_cluster
FROM dte_presite_tracking
GROUP BY work_type
ORDER BY work_type;
