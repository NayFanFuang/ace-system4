-- Backfill dta_clusters.assigned_employee_code by matching the sheet's team-code owner
-- (e.g. "TH_Natdanai") to an auth_users login: strip the 2-letter country prefix (TH_/KH_/PH_…)
-- and match the remainder to first_name OR full name. Only UNAMBIGUOUS matches (exactly 1 login)
-- are linked — ambiguous (e.g. TH_Yodsawee → 2 accounts) and foreign teams (KH_/PH_, no login) are
-- left NULL for manual assignment. Idempotent: only fills rows where assigned_employee_code IS NULL.
UPDATE dta_clusters d
SET assigned_employee_code = m.employee_code
FROM (
  SELECT n.dta_name, MIN(a.employee_code) AS employee_code, count(DISTINCT a.employee_code) AS n
  FROM (
    SELECT DISTINCT dta_name, regexp_replace(dta_name, '^[A-Z]{2}_', '') AS stripped
    FROM dta_clusters WHERE dta_name IS NOT NULL
  ) n
  JOIN auth_users a
    ON a.is_active
   AND (lower(a.first_name) = lower(n.stripped)
        OR lower(a.first_name || ' ' || a.last_name) = lower(n.stripped))
  GROUP BY n.dta_name
  HAVING count(DISTINCT a.employee_code) = 1
) m
WHERE d.dta_name = m.dta_name
  AND d.assigned_employee_code IS NULL;
