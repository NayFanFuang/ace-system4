-- Daily Work Log entries for Sakraphi Champapho (ACECS430), May 2026.
-- Blank days in the source (1,3,4,10,17,24,31) are intentionally omitted.
-- Idempotent via ON CONFLICT (employee_code, work_date).
INSERT INTO daily_work_logs (employee_code, work_date, summary) VALUES
  ('ACECS430','2026-05-02','Prepare equipment'),
  ('ACECS430','2026-05-05','Delivery/Return equipment store'),
  ('ACECS430','2026-05-06','NSLKC Replace antenna'),
  ('ACECS430','2026-05-07','KSN03 Event'),
  ('ACECS430','2026-05-08','PTYNO Remove sector'),
  ('ACECS430','2026-05-09','PTYNS Remove sector'),
  ('ACECS430','2026-05-11','YWLGM Remove sector'),
  ('ACECS430','2026-05-12','BSMPK Remove sector'),
  ('ACECS430','2026-05-13','SNTRP Remove sector'),
  ('ACECS430','2026-05-14','YWNPK Remove sector'),
  ('ACECS430','2026-05-15','YPSSK Remove sector'),
  ('ACECS430','2026-05-16','Prepare equipment'),
  ('ACECS430','2026-05-18','Delivery/Return equipment store'),
  ('ACECS430','2026-05-19','Delivery/Return equipment store'),
  ('ACECS430','2026-05-20','Delivery/Return equipment store'),
  ('ACECS430','2026-05-21','NMA23 , NMA24 Event'),
  ('ACECS430','2026-05-22','NMA23 , NMA24 Event'),
  ('ACECS430','2026-05-23','Prepare equipment'),
  ('ACECS430','2026-05-25','NMA23 Remove site'),
  ('ACECS430','2026-05-26','NMA24 Remove site'),
  ('ACECS430','2026-05-27','NMA26 Remove site'),
  ('ACECS430','2026-05-28','NMA27 Remove site'),
  ('ACECS430','2026-05-29','SPSPY New sector'),
  ('ACECS430','2026-05-30','Prepare equipment')
ON CONFLICT (employee_code, work_date) DO UPDATE SET summary=EXCLUDED.summary, updated_at=now();
