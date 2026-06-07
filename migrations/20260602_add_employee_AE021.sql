-- Add employee AE021 — Natdanai Kullapat (Tui)
-- Source: HR profile sheet
-- Idempotent: ON CONFLICT DO NOTHING so the script is safe to re-run.

INSERT INTO employees (
    employee_code,
    email,
    personal_email,
    full_name,
    first_name,
    last_name,
    preferred_name,
    phone,
    department,
    section_name,
    project_team,
    project_role,
    position,
    job_title,
    job_level,
    project_code,
    project_name,
    cost_center,
    status,
    employment_type,
    contract_type,
    hire_date,
    date_of_birth,
    gender,
    nationality,
    id_card_no,
    address,
    source
) VALUES (
    'AE021',
    'Natdanai@airconnect-e.com',
    'Nutdany44@gmail.com',
    'Natdanai Kullapat',
    'Natdanai',
    'Kullapat',
    'Tui',
    '061-575-1180',
    'Project',
    'RF Project',
    'RF',
    'DTA',
    'Drive Test Analysis Engineer',
    'Drive Test Analysis Engineer',
    'DTA-L1',
    'HWT2601 : RF TRUE/HWT Flash EAS&BMA Project',
    'HWT2601 : RF TRUE/HWT Flash EAS&BMA Project',
    'AE',
    'ACTIVE',
    'FULL_TIME',
    'FULL_TIME',
    '2016-12-15',
    '1993-04-07',
    'Male',
    'Thai',
    '1309900902501',
    '28 Moo.20, Prasuk, Chum Phuang, Nakhon Ratchasima, 30270 Thailand',
    'HR'
)
ON CONFLICT (employee_code) DO NOTHING;

-- Live project assignment (matches what POST /employees does when department='Project')
INSERT INTO project_assignments_live (
    project_code,
    employee_code,
    role_in_project,
    clock_type,
    job_level,
    start_date,
    allocation_pct,
    is_active
) VALUES (
    'HWT2601 : RF TRUE/HWT Flash EAS&BMA Project',
    'AE021',
    'DTA',
    'DAILY',
    'L1',
    '2016-12-15',
    100,
    true
)
ON CONFLICT (project_code, employee_code, role_in_project) DO NOTHING;

-- Sanity check
SELECT employee_code, full_name, preferred_name, position, job_level, project_code, hire_date, status
FROM employees WHERE employee_code = 'AE021';
