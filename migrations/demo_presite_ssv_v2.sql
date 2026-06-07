-- Clear all existing demo tracking + seed 30 real SSV rows
-- Pulls from real project_pos + project_sites
-- Spread stages: 5 FULL_ONAIR, 5 DT_STARTED, 5 DT_DONE, 5 REPORT_DONE, 5 CHECKING(FAIL+PASS), 5 ACE_APPROVED

DELETE FROM dte_presite_history;
DELETE FROM dte_presite_tracking;

-- Pool of real DTE codes (with auth accounts, position=DTE)
-- ACECS258, ACECS384, ACECS397, ACECS398, ACECS399, ACECS400, ACECS406, ACECS407,
-- ACECS410, ACECS412, ACECS413, ACECS419, ACECS432, ACECS433, ACECS434, ACECS435, ACECS436

WITH picked AS (
  SELECT
    p.id, p.po_number, p.po_line, p.cluster_site, p.item_dis, p.ace_project_code,
    -- fallback site_code from cluster_site prefix
    COALESCE(NULLIF(p.site_code, ''), split_part(p.cluster_site, '_', 1)) AS site_code_resolved,
    -- DTE rotation by index
    (ARRAY['ACECS434','ACECS432','ACECS433','ACECS435','ACECS436','ACECS384','ACECS406'])[((row_number() OVER (ORDER BY p.id) - 1) % 7) + 1] AS dte_code,
    (ARRAY['Wipada Srisurad','Suraphop Kampakdee','Natthaphong Khaokaen','Chatchai Lerdlopthatri','Danai Chaiyasit','Thanawut Kuwangkadilok','Payonrat Phothiwat'])[((row_number() OVER (ORDER BY p.id) - 1) % 7) + 1] AS dte_name,
    row_number() OVER (ORDER BY p.id) AS rn
  FROM project_pos p
  WHERE p.work_type = 'SSV'
    AND (p.cluster_site IS NOT NULL OR (p.site_code IS NOT NULL AND p.site_code != ''))
  ORDER BY p.id
  LIMIT 30
)
INSERT INTO dte_presite_tracking
  (ace_project_code, site_code, po_id, po_number, po_line,
   assigned_dte_code, assigned_dte_name,
   work_type, rf_cluster_name, layers,
   full_onair_at, dt_started_at, dt_started_by, dt_done_at, dt_done_by,
   report_done_at, report_done_by,
   check_at, check_by, check_result, check_notes, rework_count,
   site_status,
   current_stage, completed_at, ace_approve_at, ace_approve_by)
SELECT
  picked.ace_project_code,
  picked.site_code_resolved,
  picked.id, picked.po_number, picked.po_line,
  picked.dte_code, picked.dte_name,
  'SSV',
  s.rf_cluster_name,
  -- Parse layers from item_dis
  (SELECT (regexp_matches(picked.item_dis, 'for\s+\d+~(\d+)\s+layer', 'i'))[1]::int
   UNION ALL
   SELECT (regexp_matches(picked.item_dis, 'for\s+(\d+)\s+layer', 'i'))[1]::int
   LIMIT 1),
  -- Stages spread (5 each across 6 categories)
  NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)),   -- full_onair_at: spread 0-6 days ago
  CASE WHEN (picked.rn - 1) / 5 >= 1 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '4 hours' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 1 THEN picked.dte_code ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 2 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '7 hours 20 minutes' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 2 THEN picked.dte_code ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 3 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '12 hours' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 3 THEN picked.dte_code ELSE NULL END,
  -- check_at + result
  CASE WHEN (picked.rn - 1) / 5 >= 4 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '18 hours' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 >= 4 THEN 'PM-001' ELSE NULL END,
  CASE
    WHEN (picked.rn - 1) / 5 = 4 AND picked.rn % 5 IN (0, 1) THEN 'FAIL'
    WHEN (picked.rn - 1) / 5 = 5 THEN 'PASS'
    WHEN (picked.rn - 1) / 5 = 4 THEN 'PASS'
    ELSE NULL
  END,
  CASE
    WHEN (picked.rn - 1) / 5 = 4 AND picked.rn % 5 IN (0, 1) THEN 'KPI table incomplete, redo measurement'
    ELSE NULL
  END,
  CASE WHEN (picked.rn - 1) / 5 = 4 AND picked.rn % 5 IN (0, 1) THEN 1 ELSE 0 END,
  -- site_status rotation
  (ARRAY['OK','CROSS','ALARM','WAIT_SITE_ACCESS','OK','OK'])[(picked.rn % 6) + 1],
  -- current_stage
  CASE (picked.rn - 1) / 5
    WHEN 0 THEN 'FULL_ONAIR'
    WHEN 1 THEN 'DT_STARTED'
    WHEN 2 THEN 'DT_DONE'
    WHEN 3 THEN 'REPORT_DONE'
    WHEN 4 THEN 'CHECKING'
    WHEN 5 THEN 'ACE_APPROVED'
  END,
  CASE WHEN (picked.rn - 1) / 5 = 5 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '20 hours' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 = 5 THEN NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 5)) + INTERVAL '20 hours' ELSE NULL END,
  CASE WHEN (picked.rn - 1) / 5 = 5 THEN 'PM-001' ELSE NULL END
FROM picked
LEFT JOIN project_sites s ON s.site_code = picked.site_code_resolved;

-- Add history seed rows so audit trail shows real activity
INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'FULL_ONAIR', 'auto-seed', 'SYSTEM', 'Auto-seed', 'Seeded from PO ' || po_number, full_onair_at
FROM dte_presite_tracking;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'DT_STARTED', 'auto-clock-in', dt_started_by, dt_started_by, 'Auto-linked from Clock App', dt_started_at
FROM dte_presite_tracking WHERE dt_started_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'DT_DONE', 'auto-promote', dt_done_by, dt_done_by, 'Auto-promoted (outcome=COMPLETE)', dt_done_at
FROM dte_presite_tracking WHERE dt_done_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'REPORT_DONE', 'report-done', report_done_by, report_done_by, NULL, report_done_at
FROM dte_presite_tracking WHERE report_done_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'CHECKING',
       CASE WHEN check_result='PASS' THEN 'check-pass' ELSE 'check-fail' END,
       check_by, check_by, check_notes, check_at
FROM dte_presite_tracking WHERE check_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'ACE_APPROVED', 'ace-approve', ace_approve_by, ace_approve_by, 'Workflow complete', ace_approve_at
FROM dte_presite_tracking WHERE ace_approve_at IS NOT NULL;

SELECT current_stage, COUNT(*), array_agg(DISTINCT site_status) AS site_statuses
FROM dte_presite_tracking GROUP BY current_stage ORDER BY 1;
