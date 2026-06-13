-- Disable the ACE-XLSX-* placeholder duplicate logins. Each has a real same-name account
-- (created during an xlsx import). Soft-disable via is_active=false: the login handler filters
-- is_active=true, so this blocks login and is fully reversible. Guarded so it ONLY disables an
-- ACE-XLSX account when a real (non-xlsx) same-name account exists. Idempotent. auth_users-only
-- (no dta_clusters dependency) so it is safe to run on prod regardless of feature state.
\echo '== ACE-XLSX accounts BEFORE =='
SELECT employee_code, first_name || ' ' || last_name AS name, is_active
FROM auth_users WHERE employee_code LIKE 'ACE-XLSX%' ORDER BY employee_code;

UPDATE auth_users x
SET is_active = false
WHERE x.employee_code LIKE 'ACE-XLSX%'
  AND x.is_active = true
  AND EXISTS (
    SELECT 1 FROM auth_users r
    WHERE r.employee_code <> x.employee_code
      AND r.employee_code NOT LIKE 'ACE-XLSX%'
      AND lower(r.first_name || ' ' || r.last_name) = lower(x.first_name || ' ' || x.last_name)
  );

\echo '== ACE-XLSX accounts AFTER (is_active should be f) =='
SELECT employee_code, is_active FROM auth_users WHERE employee_code LIKE 'ACE-XLSX%' ORDER BY employee_code;
