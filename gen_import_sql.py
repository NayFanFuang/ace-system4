import openpyxl, datetime, re, os

XLSX_PATH = r"C:\GoogleAppScript\0_NewServer\Employee2.xlsx"
OUT_SQL   = r"C:\GoogleAppScript\0_NewServer\ACE_System4\import_emp.sql"

def parse_name(name_str):
    if not name_str: return '', '', ''
    s = re.sub(r'^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*', '', str(name_str).strip())
    parts = s.split()
    return (parts[0], ' '.join(parts[1:]), s) if len(parts) >= 2 else (s, '', s)

def parse_date(val):
    if not val: return None
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.date() if isinstance(val, datetime.datetime) else val
    s = str(val).strip()
    if s.lower() in ('owner', 'none', ''): return None
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y'):
        try: return datetime.datetime.strptime(s, fmt).date()
        except: pass
    return None

DEPT_MAP = {
    'executive office': 'Executive', 'hr': 'HR', 'accounting': 'Accounting',
    'project management': 'Project', 'computer vision (ai)': 'AI', 'business development': 'BD',
}
SECTION_TEAM = {
    'rf project': 'RF', 'te project': 'TE', 'enterprise project': 'Enterprise',
    'project management': 'PM', 'head office': 'HQ', 'administrative': 'HQ',
    'human resources': 'HR', 'accounting and finance': 'Finance', 'purchasing': 'HQ',
    'computer vision (ai)': 'AI', 'business development': 'BD',
}

def first_of(raw):
    if not raw or str(raw).strip().lower() in ('none', ''): return None
    return [x.strip() for x in str(raw).replace(';', ',').split(',')][0]

def q(v, maxlen=None):
    if v is None: return 'NULL'
    s = str(v)
    if maxlen and len(s) > maxlen: s = s[:maxlen]
    return "'" + s.replace("'", "''") + "'"

wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
rows = list(wb.active.iter_rows(values_only=True))
data = [r for r in rows[1:] if r[4] and str(r[4]).strip().upper() not in ('NONE', '')]

sqls = ["BEGIN;"]
for r in data:
    no,name,thai,nick,eid,join,yr,dept,sect,pos,func_,proj,co,start,end,stat16,contact,email_p,email_c,stat20 = r[:20]
    code  = str(eid).strip()
    fn,ln,full = parse_name(name)
    pref  = str(nick).strip() if nick and str(nick).lower() != 'none' else None
    hire  = parse_date(join) or parse_date(start)
    ec    = first_of(email_c)
    ep    = first_of(email_p)
    mail  = ec or ep
    phone = first_of(contact)
    dept_n = DEPT_MAP.get(str(dept or '').lower().strip(), 'Project')
    team   = SECTION_TEAM.get(str(sect or '').lower().strip(), 'RF')
    pos_s  = str(pos or '').strip() or None
    func_s = str(func_ or '').strip() or None
    pc     = str(proj or '').strip() if proj and str(proj).lower() != 'none' else None
    s20    = str(stat20 or '').lower()
    ct     = 'FULL_TIME' if 'permanent' in s20 else 'CONTRACT'

    sqls.append(
        f"INSERT INTO employees (employee_code,email,personal_email,full_name,first_name,last_name,"
        f"preferred_name,phone,department,section_name,project_team,position,job_title,job_level,"
        f"project_code,project_name,cost_center,status,employment_type,contract_type,hire_date,source)\n"
        f"VALUES ({q(code,30)},{q(mail,150)},{q(ep if ep!=mail else None,150)},{q(full,150)},"
        f"{q(fn,80)},{q(ln,80)},{q(pref,80)},{q(phone,40)},{q(dept_n,50)},"
        f"{q(str(sect or '').strip()[:80] if sect else None)},{q(team,30)},{q(pos_s,100)},"
        f"{q(pos_s,120)},{q(func_s,50)},{q(pc,50)},{q(pc,250)},{q(co,80)},"
        f"'ACTIVE','FULL_TIME' ,{q(ct,40)},{q(str(hire) if hire else None)},'Employee2.xlsx')\n"
        f"ON CONFLICT (employee_code) DO UPDATE SET\n"
        f"  email=EXCLUDED.email,full_name=EXCLUDED.full_name,first_name=EXCLUDED.first_name,\n"
        f"  last_name=EXCLUDED.last_name,preferred_name=EXCLUDED.preferred_name,phone=EXCLUDED.phone,\n"
        f"  department=EXCLUDED.department,section_name=EXCLUDED.section_name,project_team=EXCLUDED.project_team,\n"
        f"  position=EXCLUDED.position,job_title=EXCLUDED.job_title,job_level=EXCLUDED.job_level,\n"
        f"  project_code=EXCLUDED.project_code,cost_center=EXCLUDED.cost_center,\n"
        f"  status='ACTIVE',employment_type=EXCLUDED.employment_type,contract_type=EXCLUDED.contract_type,\n"
        f"  hire_date=EXCLUDED.hire_date,source='Employee2.xlsx',updated_at=NOW();"
    )

sqls.append("UPDATE employees SET status='INACTIVE' WHERE source != 'Employee2.xlsx';")
sqls.append("COMMIT;")
sqls.append("SELECT source, COUNT(*) FROM employees GROUP BY source ORDER BY source;")
sqls.append("SELECT status, COUNT(*) FROM employees GROUP BY status;")

sql = '\n'.join(sqls)
with open(OUT_SQL, 'w', encoding='utf-8') as f:
    f.write(sql)
print(f"Generated {len(data)} upserts → {OUT_SQL} ({len(sql)} bytes)")
