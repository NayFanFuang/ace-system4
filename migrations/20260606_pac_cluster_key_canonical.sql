-- 20260606_pac_cluster_key_canonical.sql
-- Phase 1 — switch PAC tracking cluster_key from raw cluster_site to canonical
-- RF Cluster Name (project_sites.rf_cluster_name). Matches the new lookup
-- order in seed_tracking_from_po (presite_monitor.py): cluster_site → du_id
-- → site_code. When a lookup yields a canonical name, the tracking row is
-- updated; otherwise it's left alone (cluster_site stays as the fallback key).
--
-- This is idempotent: re-running it is a no-op once cluster_key already equals
-- the canonical name. Safe to ship even with an empty dte_presite_tracking
-- table (currently 0 PAC rows) — guards future re-seeds.
--
-- Apply with: docker exec ace-system-postgres psql -U ace_user -d ace_system \
--               -f /path/to/this/file.sql

BEGIN;

-- Audit count BEFORE
SELECT
    'BEFORE' AS phase,
    COUNT(*) FILTER (WHERE work_type = 'PAC') AS pac_rows,
    COUNT(DISTINCT cluster_key) FILTER (WHERE work_type = 'PAC') AS distinct_cluster_keys
FROM dte_presite_tracking;

-- Resolve canonical RF Cluster Name per PAC tracking row by joining
-- project_sites via any of (cluster_key, site_code on the tracking row).
-- The COALESCE picks the first non-null rf_cluster_name across both lookups.
WITH resolved AS (
    SELECT
        t.id,
        t.cluster_key AS old_key,
        COALESCE(s1.rf_cluster_name, s2.rf_cluster_name) AS canonical_rf
    FROM dte_presite_tracking t
    LEFT JOIN project_sites s1 ON s1.site_code = t.cluster_key
    LEFT JOIN project_sites s2 ON s2.site_code = t.site_code
    WHERE t.work_type = 'PAC'
      AND COALESCE(s1.rf_cluster_name, s2.rf_cluster_name) IS NOT NULL
      AND COALESCE(s1.rf_cluster_name, s2.rf_cluster_name) <> t.cluster_key
)
UPDATE dte_presite_tracking AS t
SET cluster_key     = r.canonical_rf,
    site_code       = r.canonical_rf,  -- display name follows cluster identity for PAC
    rf_cluster_name = r.canonical_rf
FROM resolved r
WHERE t.id = r.id;

-- If two raw cluster_site rows resolve to the SAME canonical name, the UPDATE
-- above leaves duplicate (work_type='PAC', cluster_key=canonical) pairs. Merge
-- duplicates: keep the oldest tracking row, move history rows to it, delete
-- the rest. Skip safely if no duplicates exist.
WITH groups AS (
    SELECT
        cluster_key,
        MIN(id)                  AS keep_id,
        ARRAY_AGG(id ORDER BY id) AS all_ids
    FROM dte_presite_tracking
    WHERE work_type = 'PAC'
    GROUP BY cluster_key
    HAVING COUNT(*) > 1
),
to_drop AS (
    SELECT
        unnest(all_ids[2:array_length(all_ids, 1)]) AS drop_id,
        keep_id
    FROM groups
)
UPDATE dte_presite_history h
SET tracking_id = d.keep_id
FROM to_drop d
WHERE h.tracking_id = d.drop_id;

WITH groups AS (
    SELECT cluster_key, MIN(id) AS keep_id, ARRAY_AGG(id ORDER BY id) AS all_ids
    FROM dte_presite_tracking
    WHERE work_type = 'PAC'
    GROUP BY cluster_key
    HAVING COUNT(*) > 1
)
DELETE FROM dte_presite_tracking
WHERE id IN (
    SELECT unnest(all_ids[2:array_length(all_ids, 1)]) FROM groups
);

-- Audit count AFTER
SELECT
    'AFTER' AS phase,
    COUNT(*) FILTER (WHERE work_type = 'PAC') AS pac_rows,
    COUNT(DISTINCT cluster_key) FILTER (WHERE work_type = 'PAC') AS distinct_cluster_keys
FROM dte_presite_tracking;

COMMIT;
