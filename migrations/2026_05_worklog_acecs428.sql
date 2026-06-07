-- Daily Work Log entries for Saranya Tonohueng (ACECS428), May 2026.
-- (Source table was labeled "Pattaraphitak Kunok" = Saranya Tonohueng.)
-- Blank days (1,3,4,10,17,24,31) omitted. Idempotent via ON CONFLICT (employee_code, work_date).
INSERT INTO daily_work_logs (employee_code, work_date, summary) VALUES
  ('ACECS428','2026-05-02','Prepare Return equipment'),
  ('ACECS428','2026-05-05','TRYST Event'),
  ('ACECS428','2026-05-06','KMCOC Event'),
  ('ACECS428','2026-05-07','DYMSS Remove sector'),
  ('ACECS428','2026-05-08','PSTHU Remove sector'),
  ('ACECS428','2026-05-09','Prepare Return equipment'),
  ('ACECS428','2026-05-11','YST01 Event'),
  ('ACECS428','2026-05-12','SLKSK Replace antenna'),
  ('ACECS428','2026-05-13','YST01 Remove site'),
  ('ACECS428','2026-05-14','TRYST Remove sector'),
  ('ACECS428','2026-05-15','SIMNM Remove sector'),
  ('ACECS428','2026-05-16','Prepare Return equipment'),
  ('ACECS428','2026-05-18','Delivery/Return equipment store'),
  ('ACECS428','2026-05-19','KMCOC Remove sector'),
  ('ACECS428','2026-05-20','KSN02 Remove site'),
  ('ACECS428','2026-05-21','KDWAM Remove sector'),
  ('ACECS428','2026-05-22','KSN03 Remove site'),
  ('ACECS428','2026-05-23','Prepare Return equipment'),
  ('ACECS428','2026-05-25','Delivery/Return equipment store'),
  ('ACECS428','2026-05-26','Delivery/Return equipment store'),
  ('ACECS428','2026-05-27','PNMPM Event'),
  ('ACECS428','2026-05-28','SWREP Event'),
  ('ACECS428','2026-05-29','KSN04 Event'),
  ('ACECS428','2026-05-30','Prepare Return equipment')
ON CONFLICT (employee_code, work_date) DO UPDATE SET summary=EXCLUDED.summary, updated_at=now();
