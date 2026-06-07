-- Demo clock-in sessions to showcase Map Live, Admin Attention, Today Executive panels
-- Today = 2026-05-17, Yesterday = 2026-05-16

-- Clear any prior demo for these dates
DELETE FROM clock_sessions WHERE work_date IN ('2026-05-17', '2026-05-16') AND employee_code IN (
  'ACE056','ACE125','ACE292','ACE690','ACECS002','ACECS258','ACECS384',
  'ACE693','ACE174','ACE685'
);

-- ── TODAY (2026-05-17) ───────────────────────────────────────────────
-- 1) ON-SITE complete — CBR0249 (12.909722, 100.916111)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACE056', 'PER_SITE', '2026-05-17', 'CBR0249', 'CBR0249 - Pattaya N',
  '2026-05-17 08:15:00+07', 12.909800, 100.916200,
  '2026-05-17 17:32:00+07', 12.909750, 100.916180, 'COMPLETED');

-- 2) ON-SITE complete — CBR0268 (13.149471, 100.808287)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACE125', 'PER_SITE', '2026-05-17', 'CBR0268', 'CBR0268 - Sriracha',
  '2026-05-17 08:05:00+07', 13.149500, 100.808300,
  '2026-05-17 17:45:00+07', 13.149520, 100.808280, 'COMPLETED');

-- 3) OFF-SITE complete — CBR0685 (12.903731, 100.901981) but clocked in 5km away
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACE292', 'PER_SITE', '2026-05-17', 'CBR0685', 'CBR0685 - Bangsaray',
  '2026-05-17 09:40:00+07', 12.945000, 100.875000,
  '2026-05-17 16:20:00+07', 12.945100, 100.875050, 'COMPLETED');

-- 4) ON-SITE still active — CBR1611 (12.907081, 100.909251)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, status)
VALUES ('ACE690', 'PER_SITE', '2026-05-17', 'CBR1611', 'CBR1611 - Naklua',
  '2026-05-17 08:20:00+07', 12.907150, 100.909300, 'ACTIVE');

-- 5) NO-GPS — clocked in but no lat/lng captured (suspicious)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, status)
VALUES ('ACECS002', 'PER_SITE', '2026-05-17', 'CBR2012', 'CBR2012',
  '2026-05-17 08:55:00+07', NULL, NULL, 'ACTIVE');

-- 6) OFF-SITE far — CBR2031 but clocked in 80km away (Bangkok)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACECS258', 'PER_SITE', '2026-05-17', 'CBR2031', 'CBR2031',
  '2026-05-17 08:30:00+07', 13.756300, 100.501800,
  '2026-05-17 17:00:00+07', 13.756300, 100.501800, 'COMPLETED');

-- 7) ON-SITE complete — CBR5841 (12.925934, 100.884765)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACECS384', 'PER_SITE', '2026-05-17', 'CBR5841', 'CBR5841 - Jomtien',
  '2026-05-17 07:55:00+07', 12.926000, 100.884800,
  '2026-05-17 17:10:00+07', 12.925950, 100.884750, 'COMPLETED');

-- 8) NO-SITE (DAILY clock at office, AI team)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACE693', 'DAILY', '2026-05-17',
  '2026-05-17 09:00:00+07', 13.736700, 100.523000,
  '2026-05-17 18:05:00+07', 13.736700, 100.523000, 'COMPLETED');

-- 9) NO-SITE Finance, still active
INSERT INTO clock_sessions (employee_code, clock_type, work_date, clock_in_at, lat_in, lng_in, status)
VALUES ('ACE174', 'DAILY', '2026-05-17',
  '2026-05-17 08:45:00+07', 13.737000, 100.523500, 'ACTIVE');

-- 10) NO-SITE HR — active, no clock-out yet (will be flagged tomorrow if not closed)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, clock_in_at, lat_in, lng_in, status)
VALUES ('ACE685', 'DAILY', '2026-05-17',
  '2026-05-17 08:35:00+07', 13.737200, 100.523200, 'ACTIVE');


-- ── YESTERDAY (2026-05-16) for Admin Attention demo ──────────────────
-- A) Missing clock-out
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, status)
VALUES ('ACE056', 'PER_SITE', '2026-05-16', 'CBR0249', 'CBR0249',
  '2026-05-16 08:10:00+07', 12.909800, 100.916200, 'ACTIVE');

-- B) Missing GPS
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, status)
VALUES ('ACE125', 'PER_SITE', '2026-05-16', 'CBR0268', 'CBR0268',
  '2026-05-16 08:05:00+07', NULL, NULL,
  '2026-05-16 17:30:00+07', 'COMPLETED');

-- C) Complete (control — won't appear in incomplete list)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, site_name, clock_in_at, lat_in, lng_in, clock_out_at, lat_out, lng_out, status)
VALUES ('ACE292', 'PER_SITE', '2026-05-16', 'CBR0685', 'CBR0685',
  '2026-05-16 08:00:00+07', 12.903800, 100.902000,
  '2026-05-16 17:00:00+07', 12.903800, 100.902000, 'COMPLETED');

-- D) Missing both clock-out AND GPS (worst case)
INSERT INTO clock_sessions (employee_code, clock_type, work_date, site_code, clock_in_at, lat_in, lng_in, status)
VALUES ('ACECS002', 'PER_SITE', '2026-05-16', 'CBR2012',
  '2026-05-16 09:15:00+07', NULL, NULL, 'ACTIVE');

SELECT 'Today sessions:' AS info, COUNT(*) FROM clock_sessions WHERE work_date = '2026-05-17';
SELECT 'Yesterday sessions:' AS info, COUNT(*) FROM clock_sessions WHERE work_date = '2026-05-16';
