-- Demo seed for Pre-Site Monitor — covers every stage + SLA scenarios
-- Idempotent: clears DEMO rows first

DELETE FROM dte_presite_history WHERE tracking_id IN (
  SELECT id FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%'
);
DELETE FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%';

INSERT INTO dte_presite_tracking
  (ace_project_code, site_code, po_id, po_number, po_line,
   assigned_dte_code, assigned_dte_name, full_onair_at,
   dt_done_at, dt_done_by, report_done_at, report_done_by,
   check_at, check_by, check_result, check_notes, rework_count,
   ace_submit_at, ace_submit_by, ace_report_url,
   tl_review_at, tl_review_by, pm_review_at, pm_review_by,
   ace_approve_at, ace_approve_by, current_stage, completed_at)
VALUES
-- 1. Just started (FULL_ONAIR, today)
('HWT2304', 'DEMO-BKK-001', NULL, 'DEMO-PO-001', '1',
 'ACE056', 'Peerapol Piamsri', NOW(),
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'FULL_ONAIR', NULL),

-- 2. DT Done (Day 1)
('HWT2304', 'DEMO-BKK-002', NULL, 'DEMO-PO-002', '1',
 'ACECS258', 'Somchai Worapong', NOW() - INTERVAL '1 day',
 NOW() - INTERVAL '4 hours', 'ACECS258', NULL, NULL, NULL, NULL, NULL, NULL, 0,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'DT_DONE', NULL),

-- 3. Report Done — waiting for TL check
('HWT2304', 'DEMO-CNX-003', NULL, 'DEMO-PO-003', '2',
 'ACE056', 'Peerapol Piamsri', NOW() - INTERVAL '2 days',
 NOW() - INTERVAL '36 hours', 'ACE056',
 NOW() - INTERVAL '6 hours', 'ACE056',
 NULL, NULL, NULL, NULL, 0,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'REPORT_DONE', NULL),

-- 4. Check PASS — ready for DTE to submit ACE
('HWT2304', 'DEMO-CNX-004', NULL, 'DEMO-PO-004', '1',
 'ACECS258', 'Somchai Worapong', NOW() - INTERVAL '2 days',
 NOW() - INTERVAL '40 hours', 'ACECS258',
 NOW() - INTERVAL '12 hours', 'ACECS258',
 NOW() - INTERVAL '2 hours', 'PM-001', 'PASS', 'Looks good, KPIs match', 0,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'CHECKING', NULL),

-- 5. Check FAIL (rework loop, count=2)
('HWT2304', 'DEMO-HKT-005', NULL, 'DEMO-PO-005', '1',
 'ACE056', 'Peerapol Piamsri', NOW() - INTERVAL '4 days',
 NOW() - INTERVAL '72 hours', 'ACE056',
 NOW() - INTERVAL '24 hours', 'ACE056',
 NOW() - INTERVAL '3 hours', 'PM-001', 'FAIL',
 'KPI table missing 5G NR throughput. Please redo measurement and update.', 2,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'CHECKING', NULL),

-- 6. ACE Submitted (waiting TL review)
('HWT2304', 'DEMO-UDN-006', NULL, 'DEMO-PO-006', '1',
 'ACECS258', 'Somchai Worapong', NOW() - INTERVAL '3 days',
 NOW() - INTERVAL '60 hours', 'ACECS258',
 NOW() - INTERVAL '36 hours', 'ACECS258',
 NOW() - INTERVAL '24 hours', 'PM-001', 'PASS', 'Approved on first try', 0,
 NOW() - INTERVAL '8 hours', 'ACECS258', 'https://ace.example.com/reports/UDN-006', NULL, NULL, NULL, NULL, NULL, NULL,
 'ACE_SUBMITTED', NULL),

-- 7. TL Reviewed (waiting PM)
('HWT2304', 'DEMO-NMA-007', NULL, 'DEMO-PO-007', '1',
 'ACE056', 'Peerapol Piamsri', NOW() - INTERVAL '2 days',
 NOW() - INTERVAL '40 hours', 'ACE056',
 NOW() - INTERVAL '28 hours', 'ACE056',
 NOW() - INTERVAL '20 hours', 'PM-001', 'PASS', 'OK', 0,
 NOW() - INTERVAL '12 hours', 'ACE056', 'https://ace.example.com/reports/NMA-007',
 NOW() - INTERVAL '6 hours', 'PM-001', NULL, NULL, NULL, NULL,
 'TL_REVIEWED', NULL),

-- 8. PM Reviewed (waiting final approve)
('HWT2304', 'DEMO-PYO-008', NULL, 'DEMO-PO-008', '1',
 'ACECS258', 'Somchai Worapong', NOW() - INTERVAL '3 days',
 NOW() - INTERVAL '50 hours', 'ACECS258',
 NOW() - INTERVAL '38 hours', 'ACECS258',
 NOW() - INTERVAL '30 hours', 'PM-001', 'PASS', '', 0,
 NOW() - INTERVAL '20 hours', 'ACECS258', 'https://ace.example.com/reports/PYO-008',
 NOW() - INTERVAL '10 hours', 'PM-001',
 NOW() - INTERVAL '3 hours', 'PM-001', NULL, NULL,
 'PM_REVIEWED', NULL),

-- 9. Completed (within SLA — 2.5 days)
('HWT2304', 'DEMO-RYG-009', NULL, 'DEMO-PO-009', '1',
 'ACE056', 'Peerapol Piamsri', NOW() - INTERVAL '5 days',
 NOW() - INTERVAL '4 days 12 hours', 'ACE056',
 NOW() - INTERVAL '4 days', 'ACE056',
 NOW() - INTERVAL '3 days 12 hours', 'PM-001', 'PASS', '', 0,
 NOW() - INTERVAL '3 days', 'ACE056', 'https://ace.example.com/reports/RYG-009',
 NOW() - INTERVAL '2 days', 'PM-001',
 NOW() - INTERVAL '1 day 12 hours', 'PM-001',
 NOW() - INTERVAL '1 day', 'PM-001',
 'ACE_APPROVED', NOW() - INTERVAL '1 day'),

-- 10. SLA BREACH — 5 days, still in CHECKING with FAIL
('HWT2304', 'DEMO-LEI-010', NULL, 'DEMO-PO-010', '1',
 'ACECS258', 'Somchai Worapong', NOW() - INTERVAL '5 days',
 NOW() - INTERVAL '4 days', 'ACECS258',
 NOW() - INTERVAL '3 days', 'ACECS258',
 NOW() - INTERVAL '12 hours', 'PM-001', 'FAIL',
 'Site coordinates wrong, need re-measure. SLA breached.', 1,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 'CHECKING', NULL);

-- Add some history entries for the more advanced rows
INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'FULL_ONAIR', 'auto-seed', 'SYSTEM', 'Auto-seed from Pipeline',
       'Seeded from PO ' || po_number, full_onair_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%';

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'DT_DONE', 'dt-done', dt_done_by, assigned_dte_name, NULL, dt_done_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND dt_done_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'REPORT_DONE', 'report-done', report_done_by, assigned_dte_name, NULL, report_done_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND report_done_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'CHECKING',
       CASE WHEN check_result='PASS' THEN 'check-pass' ELSE 'check-fail' END,
       check_by, check_by, check_notes, check_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND check_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'ACE_SUBMITTED', 'submit-ace', ace_submit_by, assigned_dte_name,
       'ACE URL: ' || ace_report_url, ace_submit_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND ace_submit_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'TL_REVIEWED', 'tl-review', tl_review_by, tl_review_by, NULL, tl_review_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND tl_review_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'PM_REVIEWED', 'pm-review', pm_review_by, pm_review_by, NULL, pm_review_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND pm_review_at IS NOT NULL;

INSERT INTO dte_presite_history (tracking_id, stage, action, actor_code, actor_name, notes, at)
SELECT id, 'ACE_APPROVED', 'ace-approve', ace_approve_by, ace_approve_by,
       'Final approval — workflow complete', ace_approve_at
FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' AND ace_approve_at IS NOT NULL;

SELECT current_stage, COUNT(*) FROM dte_presite_tracking WHERE site_code LIKE 'DEMO%' GROUP BY current_stage;
