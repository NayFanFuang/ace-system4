"""
Generate SQL to create auth_users for all ACTIVE employees in Employee2.xlsx
that don't already have an account. Initial password: ACE1234 (must_change_password=true)

Run: python gen_auth_users_sql.py
Output: import_auth_users.sql
"""
import datetime
import re
import sys

try:
    import openpyxl
    import bcrypt as _bcrypt
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "bcrypt", "-q"])
    import openpyxl
    import bcrypt as _bcrypt

XLSX_PATH = r"C:\GoogleAppScript\0_NewServer\Employee2.xlsx"
OUT_SQL   = r"C:\GoogleAppScript\0_NewServer\ACE_System4\import_auth_users.sql"
INITIAL_PASSWORD = "ACE1234"

print(f"Hashing initial password '{INITIAL_PASSWORD}' ...")
PASSWORD_HASH = _bcrypt.hashpw(INITIAL_PASSWORD.encode(), _bcrypt.gensalt(rounds=12)).decode()
print(f"Hash: {PASSWORD_HASH[:30]}...")

DEPT_MAP = {
    "executive office": "Executive", "hr": "HR", "accounting": "Accounting",
    "project management": "Project", "computer vision (ai)": "AI", "business development": "BD",
}
SECTION_TEAM = {
    "rf project": "RF", "te project": "TE", "enterprise project": "Enterprise",
    "project management": "PM", "head office": "HQ", "administrative": "HQ",
    "human resources": "HR", "accounting and finance": "Finance", "purchasing": "HQ",
    "computer vision (ai)": "AI", "business development": "BD",
}

def parse_name(name_str):
    if not name_str: return "", "", ""
    s = re.sub(r"^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*", "", str(name_str).strip())
    parts = s.split()
    return (parts[0], " ".join(parts[1:]), s) if len(parts) >= 2 else (s, "", s)

def first_of(raw):
    if not raw or str(raw).strip().lower() in ("none", ""): return None
    return [x.strip() for x in str(raw).replace(";", ",").split(",")][0]

def q(v, maxlen=None):
    if v is None: return "NULL"
    s = str(v)
    if maxlen and len(s) > maxlen: s = s[:maxlen]
    return "'" + s.replace("'", "''") + "'"

wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
rows = list(wb.active.iter_rows(values_only=True))
data = [r for r in rows[1:] if r[4] and str(r[4]).strip().upper() not in ("NONE", "")]

print(f"Read {len(data)} employee rows from Excel")

sqls = [
    "-- Auto-generated auth_users import from Employee2.xlsx",
    f"-- Initial password: {INITIAL_PASSWORD} (must_change_password=true)",
    "-- Skips employees that already have an account (ON CONFLICT DO NOTHING)",
    "BEGIN;",
    "",
]

count = 0
skipped_no_email = 0
for r in data:
    no,name,thai,nick,eid,join,yr,dept,sect,pos,func_,proj,co,start,end,stat16,contact,email_p,email_c,stat20 = r[:20]
    code = str(eid).strip() if eid else None
    if not code: continue

    # Skip resigned/terminated
    stat_s = str(stat16 or "").lower()
    if "resign" in stat_s or "terminate" in stat_s:
        continue

    ec = first_of(email_c)
    ep = first_of(email_p)
    mail = ec or ep

    if not mail:
        skipped_no_email += 1
        continue

    fn, ln, full = parse_name(name)
    dept_n = DEPT_MAP.get(str(dept or "").lower().strip(), "Project")
    team = SECTION_TEAM.get(str(sect or "").lower().strip(), "RF")
    pos_s = str(pos or "").strip() or "Staff"
    pref = str(nick).strip() if nick and str(nick).lower() != "none" else None

    sqls.append(
        f"INSERT INTO auth_users (employee_code, password_hash, first_name, last_name, email, "
        f"department, team, position_code, position_name, role, clock_type, "
        f"gps_required, photo_required, allowed_radius_m, must_change_password, is_active, "
        f"failed_login_count, token_version)\n"
        f"VALUES ({q(code,30)}, {q(PASSWORD_HASH,200)}, {q(fn,80)}, {q(ln,80)}, {q(mail,150)}, "
        f"{q(dept_n,50)}, {q(team,50)}, 'OTHER', {q(pos_s,100)}, 'EMPLOYEE', 'DAILY', "
        f"false, false, 300, true, true, 0, 1)\n"
        f"ON CONFLICT (employee_code) DO NOTHING;"
    )
    count += 1

sqls += [
    "",
    "COMMIT;",
    "",
    "-- Summary",
    "SELECT COUNT(*) AS total_auth_users FROM auth_users;",
    "SELECT COUNT(*) AS active_employees FROM employees WHERE source='Employee2.xlsx' AND status='ACTIVE';",
    "SELECT e.employee_code, e.full_name, e.email",
    "FROM employees e",
    "LEFT JOIN auth_users a ON a.employee_code = e.employee_code",
    "WHERE e.source='Employee2.xlsx' AND e.status='ACTIVE' AND a.employee_code IS NULL",
    "ORDER BY e.employee_code;",
]

sql = "\n".join(sqls)
with open(OUT_SQL, "w", encoding="utf-8") as f:
    f.write(sql)

print(f"\n✓ Generated {count} INSERT statements → {OUT_SQL}")
print(f"  Skipped (no email): {skipped_no_email}")
print(f"  File size: {len(sql):,} bytes")
print(f"\nInitial password for all new accounts: {INITIAL_PASSWORD}")
print("Employees must change password on first login (must_change_password=true)")
