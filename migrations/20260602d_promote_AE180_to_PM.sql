-- Promote AE180 (Wathana Lamoon) from EMPLOYEE -> PM
--
-- Why: position is "Senior Project Manager" but auth_users.role was created as
-- EMPLOYEE (the default in _auth_role_for_employee() when department != HR and
-- no explicit system_role is passed). She needs PM to access /kpi/evaluation
-- to evaluate her team — ROLES.KPI in platformRoutes.js requires PM or higher.
--
-- token_version bump revokes her current JWT so the new role takes effect on
-- next login (otherwise she'd keep the old EMPLOYEE-scoped token until expiry).

UPDATE auth_users
SET role = 'PM',
    token_version = token_version + 1
WHERE employee_code = 'AE180';

-- Sanity check
SELECT employee_code, email, role, token_version
FROM auth_users WHERE employee_code = 'AE180';
