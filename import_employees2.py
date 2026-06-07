"""
Import/upsert all employees from Employee2.xlsx into the ACE System database.
Run: python import_employees2.py
Requires: openpyxl, psycopg2-binary
"""
import datetime
import re
import sys

try:
    import openpyxl
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Installing deps...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "psycopg2-binary", "-q"])
    import openpyxl
    import psycopg2

XLSX_PATH = r"C:\GoogleAppScript\0_NewServer\Employee2.xlsx"

DB = dict(host="localhost", port=5433, dbname="ace_system", user="ace_user", password="ace_password")

# ─── Mapping helpers ──────────────────────────────────────────────────────────

def parse_name(name_str):
    """'Mr.Atthapol Ruangboot' → (first, last, full)"""
    if not name_str:
        return "", "", ""
    name_str = str(name_str).strip()
    # remove title
    name_str = re.sub(r'^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*', '', name_str).strip()
    parts = name_str.split()
    if len(parts) >= 2:
        return parts[0], " ".join(parts[1:]), name_str
    return name_str, "", name_str


def parse_date(val):
    if not val:
        return None
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.date() if isinstance(val, datetime.datetime) else val
    s = str(val).strip()
    if s.lower() in ("owner", "none", ""):
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


DEPT_MAP = {
    "executive office": "Executive",
    "hr": "HR",
    "accounting": "Accounting",
    "project management": "Project",
    "computer vision (ai)": "AI",
    "business development": "BD",
}

SECTION_TEAM_MAP = {
    "rf project": "RF",
    "te project": "TE",
    "enterprise project": "Enterprise",
    "project management": "PM",
    "head office": "HQ",
    "administrative": "HQ",
    "human resources": "HR",
    "accounting and finance": "Finance",
    "purchasing": "HQ",
    "computer vision (ai)": "AI",
    "business development": "BD",
    "solar energy": "Solar",
}


def map_contract_type(emp_status_col20):
    s = str(emp_status_col20 or "").lower()
    if "permanent" in s:
        return "FULL_TIME"
    return "CONTRACT"


def map_employment_type(emp_status_col20):
    s = str(emp_status_col20 or "").lower()
    if "permanent" in s:
        return "FULL_TIME"
    return "CONTRACT"


def map_status(emp_status_col16, end_date):
    s = str(emp_status_col16 or "").lower()
    if "resign" in s or "terminate" in s:
        return "TERMINATED"
    if end_date and end_date < datetime.date.today():
        return "TERMINATED"
    return "ACTIVE"


def first_email(raw):
    """Take first email from comma-separated or None"""
    if not raw or str(raw).strip().lower() in ("none", ""):
        return None
    emails = [e.strip() for e in str(raw).replace(";", ",").split(",")]
    valid = [e for e in emails if "@" in e]
    return valid[0] if valid else None


def first_phone(raw):
    if not raw or str(raw).strip().lower() in ("none", ""):
        return None
    phones = [p.strip() for p in str(raw).replace(";", ",").split(",")]
    return phones[0] if phones else None


# ─── Read Excel ───────────────────────────────────────────────────────────────

wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
ws = wb.active
all_rows = list(ws.iter_rows(values_only=True))
header = all_rows[0]
data_rows = [r for r in all_rows[1:] if r[4] and str(r[4]).strip().upper() not in ("NONE", "")]

print(f"Read {len(data_rows)} employee rows from Excel")

employees = []
for r in data_rows:
    (no, name, thai_name, nick, emp_id, join_since, year_service,
     dept, section, position, function_, project, company,
     start, end, emp_status16, contact, email_personal, email_company, emp_status20) = r[:20]

    emp_code = str(emp_id).strip() if emp_id else None
    if not emp_code:
        continue

    first_name, last_name, full_name = parse_name(name)
    preferred = str(nick).strip() if nick and str(nick).lower() != "none" else None
    hire_date  = parse_date(join_since) or parse_date(start)
    end_date   = parse_date(end)
    dept_key   = str(dept or "").strip().lower()
    sect_key   = str(section or "").strip().lower()
    dept_norm  = DEPT_MAP.get(dept_key, "Project")
    team       = SECTION_TEAM_MAP.get(sect_key, "RF")
    position_s = str(position or "").strip() if position else None
    func_s     = str(function_ or "").strip() if function_ else None
    proj_code  = str(project or "").strip() if project and str(project).lower() != "none" else None
    company_s  = str(company or "").strip() if company else None
    phone      = first_phone(contact)
    e_company  = first_email(email_company)
    e_personal = first_email(email_personal)
    main_email = e_company or e_personal
    contract   = map_contract_type(emp_status20)
    emp_type   = map_employment_type(emp_status20)
    status     = map_status(emp_status16, end_date)
    source     = "Employee2.xlsx"

    employees.append({
        "employee_code": emp_code,
        "email": main_email,
        "personal_email": e_personal if e_personal != main_email else None,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "preferred_name": preferred,
        "phone": phone,
        "department": dept_norm,
        "section_name": str(section or "").strip() or None,
        "project_team": team,
        "position": position_s,
        "job_title": position_s,
        "job_level": func_s,
        "project_code": proj_code,
        "project_name": proj_code,
        "cost_center": company_s,
        "status": status,
        "employment_type": emp_type,
        "contract_type": contract,
        "hire_date": hire_date,
        "termination_date": end_date if status == "TERMINATED" else None,
        "source": source,
    })

print(f"Prepared {len(employees)} employees for upsert")

# ─── Upsert into DB ───────────────────────────────────────────────────────────

conn = psycopg2.connect(**DB)
cur = conn.cursor()

upsert_sql = """
INSERT INTO employees (
    employee_code, email, personal_email, full_name, first_name, last_name,
    preferred_name, phone, department, section_name, project_team, position,
    job_title, job_level, project_code, project_name, cost_center,
    status, employment_type, contract_type, hire_date, termination_date, source
) VALUES %s
ON CONFLICT (employee_code) DO UPDATE SET
    email            = EXCLUDED.email,
    personal_email   = EXCLUDED.personal_email,
    full_name        = EXCLUDED.full_name,
    first_name       = EXCLUDED.first_name,
    last_name        = EXCLUDED.last_name,
    preferred_name   = EXCLUDED.preferred_name,
    phone            = EXCLUDED.phone,
    department       = EXCLUDED.department,
    section_name     = EXCLUDED.section_name,
    project_team     = EXCLUDED.project_team,
    position         = EXCLUDED.position,
    job_title        = EXCLUDED.job_title,
    job_level        = EXCLUDED.job_level,
    project_code     = EXCLUDED.project_code,
    project_name     = EXCLUDED.project_name,
    cost_center      = EXCLUDED.cost_center,
    status           = EXCLUDED.status,
    employment_type  = EXCLUDED.employment_type,
    contract_type    = EXCLUDED.contract_type,
    hire_date        = EXCLUDED.hire_date,
    termination_date = EXCLUDED.termination_date,
    source           = EXCLUDED.source,
    updated_at       = NOW()
"""

limits = {
    "employee_code": 30, "email": 150, "personal_email": 150,
    "full_name": 150, "first_name": 80, "last_name": 80, "preferred_name": 80,
    "phone": 40, "department": 50, "section_name": 80, "project_team": 30,
    "position": 100, "job_title": 120, "job_level": 50,
    "project_code": 50, "project_name": 250, "cost_center": 80,
    "status": 20, "employment_type": 40, "contract_type": 40, "source": 30,
}
for e in employees:
    for field, max_len in limits.items():
        val = e.get(field)
        if val and len(str(val)) > max_len:
            print(f"  TOO LONG [{e['employee_code']}] {field}={repr(val)} ({len(str(val))} > {max_len})")
            e[field] = str(val)[:max_len]

rows = [
    (
        e["employee_code"], e["email"], e["personal_email"],
        e["full_name"], e["first_name"], e["last_name"], e["preferred_name"],
        e["phone"], e["department"], e["section_name"], e["project_team"],
        e["position"], e["job_title"], e["job_level"],
        e["project_code"], e["project_name"], e["cost_center"],
        e["status"], e["employment_type"], e["contract_type"],
        e["hire_date"], e["termination_date"], e["source"],
    )
    for e in employees
]

execute_values(cur, upsert_sql, rows)
conn.commit()

print(f"\n✓ Upserted {cur.rowcount} rows")

# ─── Show summary ─────────────────────────────────────────────────────────────
cur.execute("SELECT status, COUNT(*) FROM employees WHERE source='Employee2.xlsx' GROUP BY status ORDER BY status")
print("\nStatus breakdown (Employee2.xlsx):")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

cur.execute("SELECT department, COUNT(*) FROM employees WHERE source='Employee2.xlsx' GROUP BY department ORDER BY department")
print("\nDept breakdown:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

cur.execute("SELECT COUNT(*) FROM employees WHERE source='Employee2.xlsx'")
print(f"\nTotal in DB from Employee2.xlsx: {cur.fetchone()[0]}")

cur.close()
conn.close()
print("\nDone.")
