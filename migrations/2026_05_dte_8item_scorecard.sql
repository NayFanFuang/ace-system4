-- DTE 2026-05 scorecard: assign an 8-item KPI set to 8 specific Drive Test Engineers only.
-- The 8 catalog items are created INACTIVE so they do NOT pollute the position fallback of
-- the other ~10 DTE staff. The 8 employees get explicit kpi_period_items for 2026-05, so the
-- Self-Assessment + Evaluation pages show exactly these 8 items for them.
-- Idempotent (ON CONFLICT). Run with: psql ... -v ON_ERROR_STOP=1 -1 -f <thisfile>

-- 1) Catalog topics (inactive; period_items reference them by item_id)
INSERT INTO kpi_items (item_id, position, main_evaluate, evaluate_item, weight, target, active, source_updated_at) VALUES
  ('KPI-DTE-01','Drive Test Engineer','Clock in-out and Completion Time','Clock In-Out timestamp',15,26,false,'2026-05 DTE set'),
  ('KPI-DTE-02','Drive Test Engineer','Complainted','Internal Complain',5,100,false,'2026-05 DTE set'),
  ('KPI-DTE-03','Drive Test Engineer','Complainted','External Complain',5,100,false,'2026-05 DTE set'),
  ('KPI-DTE-04','Drive Test Engineer','Monpower Score','Immediate troubleshooting',5,100,false,'2026-05 DTE set'),
  ('KPI-DTE-05','Drive Test Engineer','Monpower Score','Special Support',5,100,false,'2026-05 DTE set'),
  ('KPI-DTE-06','Drive Test Engineer','Monpower Score','Technical Skill',5,100,false,'2026-05 DTE set'),
  ('KPI-DTE-07','Drive Test Engineer','Task Completion Time & Problem Resolution Time','Task completed with SLA',30,100,false,'2026-05 DTE set'),
  ('KPI-DTE-08','Drive Test Engineer','Task On Time Delivery','Delivery with SLA',30,100,false,'2026-05 DTE set')
ON CONFLICT (item_id) DO UPDATE SET
  position=EXCLUDED.position, main_evaluate=EXCLUDED.main_evaluate, evaluate_item=EXCLUDED.evaluate_item,
  weight=EXCLUDED.weight, target=EXCLUDED.target, active=EXCLUDED.active, source_updated_at=EXCLUDED.source_updated_at;

-- 2) Per-employee assignment for 2026-05 (8 employees x 8 items = 64 rows)
INSERT INTO kpi_period_items (period, employee_name, position, item_id, weight, active, source_updated_at)
SELECT '2026-05', e.name, 'Drive Test Engineer', i.item_id, i.weight, true, '2026-05 DTE set'
FROM (VALUES
  ('CHIRASAK WONGPHAPA'),('CHOKCHAI CHINNARACH'),('KITTIPHONG WONGSAKUL'),('PANUKON SONSINPONG'),
  ('PATHANIN NEAMPIBOON'),('PATSAKORN WITENJIT'),('PAYONRAT PHOTHIWAT'),('THANAPHONG TRIPHANITKUN')
) AS e(name)
CROSS JOIN (VALUES
  ('KPI-DTE-01',15),('KPI-DTE-02',5),('KPI-DTE-03',5),('KPI-DTE-04',5),
  ('KPI-DTE-05',5),('KPI-DTE-06',5),('KPI-DTE-07',30),('KPI-DTE-08',30)
) AS i(item_id, weight)
ON CONFLICT (period, employee_name, item_id) DO UPDATE SET
  weight=EXCLUDED.weight, active=true, position=EXCLUDED.position, source_updated_at=EXCLUDED.source_updated_at;
