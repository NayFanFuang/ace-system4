-- Demo PAC tracking — 15 rows with real DTA assignments + 5 sessions each + late stages
-- Spread across 6 stage buckets

WITH picked AS (
  SELECT
    p.id, p.po_number, p.po_line, p.cluster_site, p.ace_project_code,
    COALESCE(NULLIF(p.site_code, ''), split_part(p.cluster_site, '_', 1)) AS site_code_resolved,
    -- DTE rotation (Subcontractor Per-Site only)
    (ARRAY['ACECS434','ACECS432','ACECS433','ACECS435','ACECS436'])[((row_number() OVER (ORDER BY p.id) - 1) % 5) + 1] AS dte_code,
    (ARRAY['Wipada Srisurad','Suraphop Kampakdee','Natthaphong Khaokaen','Chatchai Lerdlopthatri','Danai Chaiyasit'])[((row_number() OVER (ORDER BY p.id) - 1) % 5) + 1] AS dte_name,
    -- DTA rotation (real DTA codes from employees)
    (ARRAY['AECS359','ACECS404','ACECS388','ACECS389','ACECS390'])[((row_number() OVER (ORDER BY p.id) - 1) % 5) + 1] AS dta_code,
    (ARRAY['Chetsada Thauaonsang','Prasittipon Ployphum','Lin Saleepan','Sulimat Sonain','Phudit Chuadnuch'])[((row_number() OVER (ORDER BY p.id) - 1) % 5) + 1] AS dta_name,
    row_number() OVER (ORDER BY p.id) AS rn
  FROM project_pos p
  WHERE p.work_type = 'PAC'
    AND p.cluster_site IS NOT NULL
  ORDER BY p.id
  LIMIT 15
)
INSERT INTO dte_presite_tracking
  (ace_project_code, site_code, po_id, po_number, po_line,
   assigned_dte_code, assigned_dte_name,
   work_type, rf_cluster_name, cluster_ready_at,
   dta_code, dta_name,
   full_onair_at,
   pa_open_at, pa_open_by, pa_closed_at, pa_closed_by,
   report_submit_at, report_submit_by, report_approved_at, report_approved_by,
   current_stage)
SELECT
  picked.ace_project_code,
  picked.site_code_resolved,
  picked.id, picked.po_number, picked.po_line,
  picked.dte_code, picked.dte_name,
  'PAC',
  picked.cluster_site,                                  -- cluster_site as rf_cluster_name for now
  NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 3 + 8)),    -- cluster_ready 8-12 days ago (so all rounds in past)
  picked.dta_code, picked.dta_name,
  NOW() - (INTERVAL '1 day' * ((picked.rn - 1) / 3 + 8)),    -- full_onair = cluster_ready for PAC
  -- Late stages: spread 5 buckets (none / pa-open only / pa-closed / report-submit / all done)
  CASE WHEN ((picked.rn - 1) / 3) >= 1 THEN NOW() - INTERVAL '5 days' + (INTERVAL '1 hour' * picked.rn) ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 1 THEN picked.dta_code ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 2 THEN NOW() - INTERVAL '3 days' + (INTERVAL '1 hour' * picked.rn) ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 2 THEN picked.dta_code ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 3 THEN NOW() - INTERVAL '2 days' + (INTERVAL '1 hour' * picked.rn) ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 3 THEN picked.dte_code ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 4 THEN NOW() - INTERVAL '1 day' + (INTERVAL '1 hour' * picked.rn) ELSE NULL END,
  CASE WHEN ((picked.rn - 1) / 3) >= 4 THEN 'PM-001' ELSE NULL END,
  -- Stage: spread 5 categories of 3 each
  CASE (picked.rn - 1) / 3
    WHEN 0 THEN 'FULL_ONAIR'
    WHEN 1 THEN 'DT_DONE'
    WHEN 2 THEN 'REPORT_DONE'
    WHEN 3 THEN 'CHECKING'
    WHEN 4 THEN 'ACE_APPROVED'
  END
FROM picked;

-- Seed 5 sessions per PAC tracking row (round 1..5)
-- DONE count = (rn / 3) + 1 ... roughly aligning with stage progress
INSERT INTO dte_presite_sessions (tracking_id, round_number, started_at, started_by, ended_at, ended_by, status)
SELECT
  t.id,
  r AS round_number,
  CASE WHEN r <= LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2)
       THEN t.full_onair_at + (INTERVAL '1 day' * (r - 1)) + INTERVAL '8 hours'
       ELSE NULL END AS started_at,
  CASE WHEN r <= LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2)
       THEN t.assigned_dte_code ELSE NULL END AS started_by,
  CASE WHEN r <= LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2)
       THEN t.full_onair_at + (INTERVAL '1 day' * (r - 1)) + INTERVAL '11 hours 30 minutes'
       ELSE NULL END AS ended_at,
  CASE WHEN r <= LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2)
       THEN t.assigned_dte_code ELSE NULL END AS ended_by,
  CASE
    WHEN r <= LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2) THEN 'DONE'
    WHEN r = LEAST(5, ((row_number() OVER (ORDER BY t.id) - 1) % 5) + 2) + 1 THEN 'IN_PROGRESS'
    ELSE 'PENDING'
  END AS status
FROM dte_presite_tracking t
CROSS JOIN generate_series(1, 5) AS r
WHERE t.work_type = 'PAC';

-- Add some history entries
INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'FULL_ONAIR', 'auto-seed', 'SYSTEM', 'PAC Auto-seed', 'Seeded PAC tracking', full_onair_at
FROM dte_presite_tracking WHERE work_type='PAC';

SELECT work_type, current_stage, COUNT(*)
FROM dte_presite_tracking
GROUP BY 1, 2 ORDER BY 1, 2;
