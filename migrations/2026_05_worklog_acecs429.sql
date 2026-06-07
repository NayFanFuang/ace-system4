-- Daily Work Log entries for Anuwat Ramring (ACECS429), May 2026.
-- Blank days (1,3,4,17,24,31) omitted. Idempotent via ON CONFLICT (employee_code, work_date).
INSERT INTO daily_work_logs (employee_code, work_date, summary) VALUES
  ('ACECS429','2026-05-02','Prepare equipment'),
  ('ACECS429','2026-05-05','NUD Replace antenna'),
  ('ACECS429','2026-05-06','NHNUD Remove sector'),
  ('ACECS429','2026-05-07','Prepare equipment'),
  ('ACECS429','2026-05-08','Prepare equipment'),
  ('ACECS429','2026-05-09','Prepare equipment'),
  ('ACECS429','2026-05-10','Delivery/Return equipment store'),
  ('ACECS429','2026-05-11','KKN16 Event'),
  ('ACECS429','2026-05-12','KSN02 Event'),
  ('ACECS429','2026-05-13','KDWAM Adjust physical'),
  ('ACECS429','2026-05-14','KSN02 Event'),
  ('ACECS429','2026-05-15','KKN16 Event'),
  ('ACECS429','2026-05-16','Standby'),
  ('ACECS429','2026-05-18','Delivery/Return equipment store'),
  ('ACECS429','2026-05-19','Delivery/Return equipment store'),
  ('ACECS429','2026-05-20','Delivery/Return equipment store'),
  ('ACECS429','2026-05-21','NMA26 , NMA27 Event'),
  ('ACECS429','2026-05-22','NMA26 , NMA27 Event'),
  ('ACECS429','2026-05-23','NMA26 , NMA27 Event'),
  ('ACECS429','2026-05-25','Delivery/Return equipment store'),
  ('ACECS429','2026-05-26','Delivery/Return equipment store'),
  ('ACECS429','2026-05-27','PNPWS New sector'),
  ('ACECS429','2026-05-28','RET06 Event'),
  ('ACECS429','2026-05-29','Standby'),
  ('ACECS429','2026-05-30','Prepare equipment')
ON CONFLICT (employee_code, work_date) DO UPDATE SET summary=EXCLUDED.summary, updated_at=now();
