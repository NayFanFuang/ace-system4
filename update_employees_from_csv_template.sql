-- Usage on production:
-- 1) Copy edited CSV into the backend/postgres environment.
-- 2) Import it into temp table employee_import with \copy.
-- 3) Review the preview queries.
-- 4) Run the UPDATE inside the transaction.
--
-- Key rule: employee_code is the stable key. Do not change employee_code unless
-- you also want to create a separate migration for renaming employee codes.

BEGIN;

CREATE TEMP TABLE employee_import (
  id integer,
  employee_code varchar(30),
  email varchar(150),
  full_name varchar(150),
  first_name varchar(80),
  last_name varchar(80),
  preferred_name varchar(80),
  personal_email varchar(150),
  phone varchar(40),
  work_phone varchar(40),
  department varchar(50),
  job_title varchar(120),
  job_level varchar(50),
  manager_name varchar(150),
  manager_code varchar(30),
  cost_center varchar(80),
  work_location varchar(150),
  project_team varchar(30),
  section_name varchar(80),
  project_role varchar(100),
  project_code varchar(50),
  project_name varchar(250),
  position varchar(100),
  status varchar(20),
  employment_type varchar(40),
  contract_type varchar(40),
  hire_date date,
  probation_end_date date,
  termination_date date,
  date_of_birth date,
  gender varchar(20),
  nationality varchar(80),
  id_card_no varchar(40),
  address text,
  emergency_contact_name varchar(150),
  emergency_contact_relation varchar(80),
  emergency_contact_phone varchar(40),
  bank_name varchar(100),
  bank_account_no varchar(60),
  bank_account_name varchar(150),
  photo_url varchar(300),
  notes text,
  source varchar(30),
  created_at timestamptz,
  updated_at timestamptz
);

-- Replace path with uploaded edited CSV path.
-- \copy employee_import FROM '/path/to/production_employees_full_edit_20315992191.csv' WITH CSV HEADER

-- Preview missing keys before update. This should be 0 unless adding new people.
SELECT i.employee_code
FROM employee_import i
LEFT JOIN employees e ON e.employee_code = i.employee_code
WHERE e.employee_code IS NULL
ORDER BY i.employee_code;

-- Preview rows that will be updated.
SELECT COUNT(*) AS matched_rows
FROM employee_import i
JOIN employees e ON e.employee_code = i.employee_code;

UPDATE employees e
SET
  email = i.email,
  full_name = i.full_name,
  first_name = i.first_name,
  last_name = i.last_name,
  preferred_name = i.preferred_name,
  personal_email = i.personal_email,
  phone = i.phone,
  work_phone = i.work_phone,
  department = i.department,
  job_title = i.job_title,
  job_level = i.job_level,
  manager_name = i.manager_name,
  manager_code = i.manager_code,
  cost_center = i.cost_center,
  work_location = i.work_location,
  project_team = i.project_team,
  section_name = i.section_name,
  project_role = i.project_role,
  project_code = i.project_code,
  project_name = i.project_name,
  position = i.position,
  status = i.status,
  employment_type = i.employment_type,
  contract_type = i.contract_type,
  hire_date = i.hire_date,
  probation_end_date = i.probation_end_date,
  termination_date = i.termination_date,
  date_of_birth = i.date_of_birth,
  gender = i.gender,
  nationality = i.nationality,
  id_card_no = i.id_card_no,
  address = i.address,
  emergency_contact_name = i.emergency_contact_name,
  emergency_contact_relation = i.emergency_contact_relation,
  emergency_contact_phone = i.emergency_contact_phone,
  bank_name = i.bank_name,
  bank_account_no = i.bank_account_no,
  bank_account_name = i.bank_account_name,
  photo_url = i.photo_url,
  notes = i.notes,
  source = COALESCE(NULLIF(i.source, ''), e.source),
  updated_at = NOW()
FROM employee_import i
WHERE e.employee_code = i.employee_code;

-- COMMIT when reviewed. ROLLBACK to cancel.
-- COMMIT;
ROLLBACK;
