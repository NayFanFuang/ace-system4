-- DEMO: DTE income showcase for ACECS435 (Chatchai)
-- Covers every SSV layer tier + PAC Cluster/SSOA, spread across Mar/Apr/May 2026
-- and different ISO weeks. site_code prefixed DEMO- for easy cleanup.
-- Re-runnable: deletes prior DEMO- rows first.

BEGIN;

DELETE FROM dte_presite_history WHERE tracking_id IN
  (SELECT id FROM dte_presite_tracking WHERE site_code LIKE 'DEMO-%');
DELETE FROM dte_presite_tracking WHERE site_code LIKE 'DEMO-%';

INSERT INTO dte_presite_tracking
  (ace_project_code, site_code, cluster_key, work_type, item_dis, layers,
   assigned_dte_code, assigned_dte_name, current_stage,
   full_onair_at, dt_started_at, dt_done_at, total_rounds, rework_count, created_at)
VALUES
-- ── March 2026 (weeks 10-13) ──
('HWT2304','DEMO-SSV13-MAR',NULL,'SSV','B_Single Site Verification for 1~3 layers_2 sectors_2 Operators with partial DT',3,
  'ACECS435','Chatchai Lerdlopthatri','ACE_APPROVED','2026-03-03 04:00:00+00','2026-03-04 04:00:00+00','2026-03-04 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSV47-MAR',NULL,'SSV','B_Single Site Verification for 4~7 layers_2 sectors_2 Operators with partial DT',7,
  'ACECS435','Chatchai Lerdlopthatri','ACE_APPROVED','2026-03-10 04:00:00+00','2026-03-11 04:00:00+00','2026-03-11 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSV8-MAR',NULL,'SSV','B_Single Site Verification for 8 or more than 8 layers_2 sectors_2 Operators with partial DT',8,
  'ACECS435','Chatchai Lerdlopthatri','REPORT_DONE','2026-03-18 04:00:00+00','2026-03-19 04:00:00+00','2026-03-19 06:00:00+00',1,0,now()),
('HWT2304','DEMO-CLU-MAR','DEMO-CLU-MAR_East R3','PAC','B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario',NULL,
  'ACECS435','Chatchai Lerdlopthatri','DT_DONE','2026-03-25 04:00:00+00','2026-03-26 04:00:00+00','2026-03-26 06:00:00+00',0,0,now()),

-- ── April 2026 (weeks 14-17) ──
('HWT2304','DEMO-SSV13-APR',NULL,'SSV','B_Single Site Verification for 1~3 layers_2 sectors_2 Operators with partial DT',3,
  'ACECS435','Chatchai Lerdlopthatri','ACE_APPROVED','2026-04-02 04:00:00+00','2026-04-03 04:00:00+00','2026-04-03 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSV47-APR',NULL,'SSV','B_Single Site Verification for 4~7 layers_2 sectors_2 Operators with partial DT',7,
  'ACECS435','Chatchai Lerdlopthatri','REPORT_DONE','2026-04-09 04:00:00+00','2026-04-10 04:00:00+00','2026-04-10 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSOA-APR','DEMO-SSOA-APR_East R3','PAC','B_SSOA DT Optimization for 6~7 layers',NULL,
  'ACECS435','Chatchai Lerdlopthatri','ACE_APPROVED','2026-04-16 04:00:00+00','2026-04-17 04:00:00+00','2026-04-17 06:00:00+00',0,0,now()),
('HWT2304','DEMO-SSV8-APR',NULL,'SSV','B_Single Site Verification for 10 or more than 10 layers_2 sectors_2 Operators with partial DT',10,
  'ACECS435','Chatchai Lerdlopthatri','DT_DONE','2026-04-23 04:00:00+00','2026-04-24 04:00:00+00','2026-04-24 06:00:00+00',1,0,now()),

-- ── May 2026 (weeks 19-22) ──
('HWT2304','DEMO-SSV13-MAY',NULL,'SSV','B_Single Site Verification for 1~3 layers_2 sectors_2 Operators with partial DT',3,
  'ACECS435','Chatchai Lerdlopthatri','REPORT_DONE','2026-05-05 04:00:00+00','2026-05-06 04:00:00+00','2026-05-06 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSV47-MAY',NULL,'SSV','B_Single Site Verification for 4~7 layers_2 sectors_2 Operators with partial DT',7,
  'ACECS435','Chatchai Lerdlopthatri','ACE_APPROVED','2026-05-12 04:00:00+00','2026-05-13 04:00:00+00','2026-05-13 06:00:00+00',1,0,now()),
('HWT2304','DEMO-SSV8-MAY',NULL,'SSV','B_Single Site Verification for 8 or more than 8 layers_2 sectors_2 Operators with partial DT',8,
  'ACECS435','Chatchai Lerdlopthatri','DT_DONE','2026-05-19 04:00:00+00','2026-05-20 04:00:00+00','2026-05-20 06:00:00+00',1,0,now()),
('HWT2304','DEMO-CLU-MAY','DEMO-CLU-MAY_East R3','PAC','B_Cluster DT Optimization for 1 band_3 or more than 3 sectors for macro site scenario',NULL,
  'ACECS435','Chatchai Lerdlopthatri','DT_DONE','2026-05-26 04:00:00+00','2026-05-27 04:00:00+00','2026-05-27 06:00:00+00',0,0,now()),
('HWT2304','DEMO-SSOA-MAY','DEMO-SSOA-MAY_East R3','PAC','B_SSOA DT Optimization for 1~3 layers',NULL,
  'ACECS435','Chatchai Lerdlopthatri','REPORT_DONE','2026-05-27 04:00:00+00','2026-05-28 04:00:00+00','2026-05-28 06:00:00+00',0,0,now());

COMMIT;

-- Verify
SELECT current_stage, work_type, COUNT(*),
       MIN(dt_done_at::date) AS first, MAX(dt_done_at::date) AS last
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO-%'
GROUP BY current_stage, work_type ORDER BY work_type, current_stage;
