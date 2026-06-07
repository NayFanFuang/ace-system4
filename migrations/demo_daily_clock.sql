-- Demo seed for Daily DT page — clock_sessions for today (2026-05-20)
DELETE FROM clock_sessions WHERE work_date = '2026-05-20' AND employee_code LIKE 'ACE%' AND site_code LIKE 'DEMO-DAILY-%';

-- Real DTE employees doing real PER_SITE sessions today
INSERT INTO clock_sessions
  (employee_code, clock_type, work_date, site_code, site_name,
   clock_in_at, clock_out_at, lat_in, lng_in, lat_out, lng_out,
   status, outcome)
VALUES
-- Completed sessions (Site Done)
('ACECS384', 'PER_SITE', '2026-05-20', 'SITE-AIS-BKK-0421', 'Sukhumvit 21',
 '2026-05-20 08:15:00+00', '2026-05-20 11:45:00+00', 13.7374, 100.5602, 13.7374, 100.5602,
 'CLOSED', 'COMPLETE'),
('ACECS406', 'PER_SITE', '2026-05-20', 'SITE-AIS-BKK-0422', 'Asok BTS Area',
 '2026-05-20 09:00:00+00', '2026-05-20 12:30:00+00', 13.7382, 100.5605, 13.7382, 100.5605,
 'CLOSED', 'COMPLETE'),
('ACECS404', 'PER_SITE', '2026-05-20', 'SITE-DTAC-BKK-0201', 'Silom Center',
 '2026-05-20 08:30:00+00', '2026-05-20 12:00:00+00', 13.7252, 100.5341, 13.7252, 100.5341,
 'CLOSED', 'COMPLETE'),
('AECS359',  'PER_SITE', '2026-05-20', 'SITE-NT-CNX-0031', 'Chiangmai NT Tower',
 '2026-05-20 07:30:00+00', '2026-05-20 11:00:00+00', 18.7883, 98.9853, 18.7883, 98.9853,
 'CLOSED', 'COMPLETE'),

-- Issue / Stop sessions
('ACECS384', 'PER_SITE', '2026-05-20', 'SITE-TRUE-NNT-0118', 'Nonthaburi Tower',
 '2026-05-20 13:00:00+00', '2026-05-20 14:15:00+00', 13.8625, 100.5142, 13.8625, 100.5142,
 'CLOSED', 'ISSUE'),
('ACECS406', 'PER_SITE', '2026-05-20', 'SITE-AIS-RYG-0055', 'Rangsit Tower',
 '2026-05-20 13:30:00+00', '2026-05-20 14:00:00+00', 13.9794, 100.6173, 13.9794, 100.6173,
 'CLOSED', 'STOP'),

-- In-progress sessions (no clock_out_at)
('ACECS404', 'PER_SITE', '2026-05-20', 'CBR0008', 'CBR0008 cluster',
 '2026-05-20 13:45:00+00', NULL, 13.7563, 100.5018, NULL, NULL,
 'ACTIVE', NULL),
('AECS359',  'PER_SITE', '2026-05-20', 'CBI0360', 'CBI0360 cluster',
 '2026-05-20 14:00:00+00', NULL, 13.7250, 100.4940, NULL, NULL,
 'ACTIVE', NULL),

-- Daily office clock-in (should appear in stats but not table)
('HR-001',   'DAILY', '2026-05-20', NULL, NULL,
 '2026-05-20 08:00:00+00', '2026-05-20 17:00:00+00', 13.7563, 100.5018, 13.7563, 100.5018,
 'CLOSED', 'COMPLETE'),
('ADMIN',    'DAILY', '2026-05-20', NULL, NULL,
 '2026-05-20 08:15:00+00', '2026-05-20 17:30:00+00', 13.7563, 100.5018, 13.7563, 100.5018,
 'CLOSED', 'COMPLETE');

SELECT clock_type, outcome, COUNT(*) FROM clock_sessions WHERE work_date='2026-05-20' GROUP BY clock_type, outcome ORDER BY 1,2;
