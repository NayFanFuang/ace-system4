-- Create auth_users login row for AE021 — Natdanai Kullapat (Tui)
-- Why: employee row was inserted via raw SQL (20260602_add_employee_AE021.sql), so the
-- normal create_employee path that also inserts auth_users was skipped. Without an
-- auth_users row, the "Send Welcome Email" button (POST /api/auth/send-welcome) matches
-- zero rows and silently does nothing.
--
-- Field mapping mirrors create_employee_login (app/routers/employees.py:734):
--   department = Project, team = RF
--   position_code = DTA (from _role_from_employee — text contains "DTA")
--   position_name = Drive Test Analysis Engineer
--   role = EMPLOYEE (Project dept, default _auth_role_for_employee)
--   clock_type = DAILY, gps_required = true, photo_required = false
--     (DTA is NOT in _PER_SITE_ROLES, contract is Permanent not per-site)
--   must_change_password = true (forces change on first login)
--
-- password_hash is a valid bcrypt hash of "ACE1234" (the welcome-email default).
-- The Send Welcome flow will overwrite this hash with a fresh one on first send
-- — this initial value just needs to be a structurally valid bcrypt string.

INSERT INTO auth_users (
    employee_code,
    password_hash,
    first_name,
    last_name,
    email,
    department,
    team,
    position_code,
    position_name,
    clock_type,
    gps_required,
    photo_required,
    work_location_name,
    allowed_radius_m,
    role,
    must_change_password,
    failed_login_count,
    token_version,
    is_active
) VALUES (
    'AE021',
    '$2b$12$OaIkBB9lPf05n1gXHIIWQ.o2HSxDGCEVNrGBFQILfmKBM1QzKUY82',
    'Natdanai',
    'Kullapat',
    'Natdanai@airconnect-e.com',
    'Project',
    'RF',
    'DTA',
    'Drive Test Analysis Engineer',
    'DAILY',
    true,
    false,
    'HWT2601 : RF TRUE/HWT Flash EAS&BMA Project',
    300,
    'EMPLOYEE',
    true,
    0,
    1,
    true
)
ON CONFLICT (employee_code) DO NOTHING;

-- Sanity check
SELECT employee_code, email, role, department, team, position_code, clock_type,
       gps_required, photo_required, must_change_password, is_active
FROM auth_users WHERE employee_code = 'AE021';
