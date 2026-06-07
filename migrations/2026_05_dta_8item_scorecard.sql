-- DTA 2026-05 scorecard: assign an 8-item KPI set to 16 specific Drive Test Analysis Engineers.
-- Catalog topics created INACTIVE so they don't pollute the position fallback of other DTA staff.
-- period_items are derived from employees by employee_code (robust against name-spelling drift),
-- storing employee_name = UPPER(full_name) to match how the Self/Eval pages look them up.
-- Idempotent. Run: psql ... -v ON_ERROR_STOP=1 -1 -f <thisfile>

-- 1) Catalog topics (inactive)
INSERT INTO kpi_items (item_id, position, main_evaluate, evaluate_item, weight, target, active, source_updated_at) VALUES
  ('KPI-DTA-01','Drive Test Analysis Engineer','Clock in-out and Completion Time','Clock In-Out timestamp',15,26,false,'2026-05 DTA set'),
  ('KPI-DTA-02','Drive Test Analysis Engineer','Complainted','Internal Complain',5,100,false,'2026-05 DTA set'),
  ('KPI-DTA-03','Drive Test Analysis Engineer','Complainted','External Complain',5,100,false,'2026-05 DTA set'),
  ('KPI-DTA-04','Drive Test Analysis Engineer','Monpower Score','Problem solve/Decision making',5,100,false,'2026-05 DTA set'),
  ('KPI-DTA-05','Drive Test Analysis Engineer','Monpower Score','Technical Skill',5,100,false,'2026-05 DTA set'),
  ('KPI-DTA-06','Drive Test Analysis Engineer','Task Completion Time & Problem Resolution Time','Task completed with SLA',30,100,false,'2026-05 DTA set'),
  ('KPI-DTA-07','Drive Test Analysis Engineer','Task On Time Delivery','Delivery with SLA',30,100,false,'2026-05 DTA set'),
  ('KPI-DTA-08','Drive Test Analysis Engineer','Response','Special Support',5,100,false,'2026-05 DTA set')
ON CONFLICT (item_id) DO UPDATE SET
  position=EXCLUDED.position, main_evaluate=EXCLUDED.main_evaluate, evaluate_item=EXCLUDED.evaluate_item,
  weight=EXCLUDED.weight, target=EXCLUDED.target, active=EXCLUDED.active, source_updated_at=EXCLUDED.source_updated_at;

-- 2) Assign to the 16 employees for 2026-05 (16 x 8 = 128 rows), by employee_code
INSERT INTO kpi_period_items (period, employee_name, position, item_id, weight, active, source_updated_at)
SELECT '2026-05', upper(e.full_name), e.position, i.item_id, i.weight, true, '2026-05 DTA set'
FROM employees e
CROSS JOIN (VALUES
  ('KPI-DTA-01',15),('KPI-DTA-02',5),('KPI-DTA-03',5),('KPI-DTA-04',5),
  ('KPI-DTA-05',5),('KPI-DTA-06',30),('KPI-DTA-07',30),('KPI-DTA-08',5)
) AS i(item_id, weight)
WHERE e.employee_code IN (
  'ACE125','AECS359','ACECS393','ACECS386','ACECS401','ACECS394','ACECS388','AECS343',
  'ACECS403','ACECS408','ACECS392','ACECS396','ACECS390','ACECS404','ACECS389','ACECS395'
)
ON CONFLICT (period, employee_name, item_id) DO UPDATE SET
  weight=EXCLUDED.weight, active=true, position=EXCLUDED.position, source_updated_at=EXCLUDED.source_updated_at;
