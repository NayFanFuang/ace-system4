-- Demo seed for Job Assignment page — spread planned_start_date across 10-day window
-- Today = 2026-05-20. Window = Day -6 (2026-05-14) to Day +3 (2026-05-23).
-- Today is at position 7 (the 7th of 10 bars).

-- Reset DEMO planned dates first
UPDATE project_pos SET planned_start_date = NULL
WHERE planned_start_date BETWEEN '2026-05-14' AND '2026-05-23';

-- ── SSV plans per day ─────────────────────────────────────────────────────
-- Day -6 (May 14): 2 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 2)
UPDATE project_pos SET planned_start_date='2026-05-14', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

-- Day -5 (May 15): 3 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 3)
UPDATE project_pos SET planned_start_date='2026-05-15', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

-- Day -4 (May 16): 4 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 4)
UPDATE project_pos SET planned_start_date='2026-05-16', planned_dte_codes='ACECS258', planned_dte_names='Chirasak Wongphapa' FROM ids WHERE project_pos.id = ids.id;

-- Day -3 (May 17): 5 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 5)
UPDATE project_pos SET planned_start_date='2026-05-17', planned_dte_codes='ACE056', planned_dte_names='Peerapol Piamsri' FROM ids WHERE project_pos.id = ids.id;

-- Day -2 (May 18): 4 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 4)
UPDATE project_pos SET planned_start_date='2026-05-18', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

-- Day -1 (May 19): 6 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 6)
UPDATE project_pos SET planned_start_date='2026-05-19', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

-- Day 0 (May 20 TODAY): 7 SSV (peak)
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 7)
UPDATE project_pos SET planned_start_date='2026-05-20', planned_dte_codes='ACECS258', planned_dte_names='Chirasak Wongphapa' FROM ids WHERE project_pos.id = ids.id;

-- Day +1 (May 21): 5 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 5)
UPDATE project_pos SET planned_start_date='2026-05-21', planned_dte_codes='ACE056', planned_dte_names='Peerapol Piamsri' FROM ids WHERE project_pos.id = ids.id;

-- Day +2 (May 22): 3 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 3)
UPDATE project_pos SET planned_start_date='2026-05-22', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

-- Day +3 (May 23): 2 SSV
WITH ids AS (SELECT id FROM project_pos WHERE work_type='SSV' AND planned_start_date IS NULL ORDER BY id LIMIT 2)
UPDATE project_pos SET planned_start_date='2026-05-23', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

-- ── PAC plans per day ─────────────────────────────────────────────────────
WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 3)
UPDATE project_pos SET planned_start_date='2026-05-14', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 5)
UPDATE project_pos SET planned_start_date='2026-05-15', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 7)
UPDATE project_pos SET planned_start_date='2026-05-16', planned_dte_codes='ACECS258', planned_dte_names='Chirasak Wongphapa' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 8)
UPDATE project_pos SET planned_start_date='2026-05-17', planned_dte_codes='ACE056', planned_dte_names='Peerapol Piamsri' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 6)
UPDATE project_pos SET planned_start_date='2026-05-18', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 4)
UPDATE project_pos SET planned_start_date='2026-05-19', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

-- Day 0 (TODAY): 10 PAC (peak)
WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 10)
UPDATE project_pos SET planned_start_date='2026-05-20', planned_dte_codes='ACECS258', planned_dte_names='Chirasak Wongphapa' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 8)
UPDATE project_pos SET planned_start_date='2026-05-21', planned_dte_codes='ACE056', planned_dte_names='Peerapol Piamsri' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 6)
UPDATE project_pos SET planned_start_date='2026-05-22', planned_dte_codes='ACECS384', planned_dte_names='Thanawut Kuwangkadilok' FROM ids WHERE project_pos.id = ids.id;

WITH ids AS (SELECT id FROM project_pos WHERE work_type='PAC' AND planned_start_date IS NULL ORDER BY id LIMIT 4)
UPDATE project_pos SET planned_start_date='2026-05-23', planned_dte_codes='ACECS406', planned_dte_names='Payonrat Phothiwat' FROM ids WHERE project_pos.id = ids.id;

SELECT work_type, planned_start_date, COUNT(*)
FROM project_pos
WHERE planned_start_date BETWEEN '2026-05-14' AND '2026-05-23'
GROUP BY 1, 2 ORDER BY 2, 1;
