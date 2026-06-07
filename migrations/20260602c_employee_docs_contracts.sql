-- 2026-06-02: Create employee_documents and employee_contracts tables
-- These are referenced by raw SQL in app/routers/employees.py (not ORM models),
-- so Base.metadata.create_all does not create them. Must be applied manually on prod.
-- Schema copied from local DB (canonical source).

BEGIN;

CREATE TABLE IF NOT EXISTS employee_contracts (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(40) NOT NULL,
    employment_type VARCHAR(40),
    contract_type VARCHAR(60),
    duration_months INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    created_by VARCHAR(40),
    CONSTRAINT employee_contracts_employee_code_fkey
        FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emp_contracts_code   ON employee_contracts (employee_code);
CREATE INDEX IF NOT EXISTS idx_emp_contracts_status ON employee_contracts (status);

CREATE TABLE IF NOT EXISTS employee_documents (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(40) NOT NULL,
    doc_type VARCHAR(40) NOT NULL,
    file_name VARCHAR(250),
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(80),
    size_bytes INTEGER,
    notes TEXT,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    uploaded_by VARCHAR(40),
    CONSTRAINT employee_documents_employee_code_fkey
        FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emp_docs_code ON employee_documents (employee_code);
CREATE INDEX IF NOT EXISTS idx_emp_docs_type ON employee_documents (doc_type);

COMMIT;

-- Verify
SELECT
    to_regclass('public.employee_contracts')  AS contracts_table,
    to_regclass('public.employee_documents')  AS documents_table;
