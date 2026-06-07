"""
Import 626 PO lines from poSystemSeed.js → project_pos table
Source: C:/GoogleAppScript/0_NewServer/POsystem/PO 2026.xlsx (already parsed into seed)

Mapping:
  systemProjectCode → project_code
  workType          → work_type (SSV | PAC)
  siteId            → du_id
  rfClusterName     → cluster_site
  itemDescription   → item_dis
  layers            → cluster_type
  fullOnAirDate     → on_air
  lat/lng           → lat_long
  workflow_status   = PENDING_SITE_MAP (project_code known, needs site mapping)
  po_target         = RF
"""
import json, io, paramiko

# ── Load seed ─────────────────────────────────────────────────────────────────
with open('po_seed.json', encoding='utf-8') as f:
    rows = json.load(f)
print(f"Loaded {len(rows)} rows from po_seed.json")

# ── SSH ───────────────────────────────────────────────────────────────────────
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('203.159.92.191', port=22020, username='pn_deploy', password='Pn2026Aa!', timeout=15)

def run(cmd):
    _, o, e = ssh.exec_command(cmd, timeout=120)
    out = o.read().decode(); err = e.read().decode()
    if out.strip(): print(out.rstrip())
    if err.strip() and not any(x in err for x in ['WARNING','notify','ip:','ifconfig','curl','line.me']):
        print('ERR:', err.rstrip())

# ── Build SQL ─────────────────────────────────────────────────────────────────
def q(v, maxlen=None):
    if v is None: return 'NULL'
    s = str(v).strip()
    if not s or s.lower() in ('none', 'n/a', 'na', '-'): return 'NULL'
    if maxlen: s = s[:maxlen]
    return "'" + s.replace("'", "''") + "'"

lines = [
    "-- Import 626 PO lines from PO 2026.xlsx seed",
    "BEGIN;",
    "",
    "-- Create HWT2604 if not exists",
    "INSERT INTO project_catalog (project_code, project_name, team, headcount)",
    "VALUES ('HWT2604', 'HWT2604 : RF TRUE/HWT Flash EAS&BMA Project', 'RF', 0)",
    "ON CONFLICT (project_code) DO NOTHING;",
    "",
]

inserted = 0
for r in rows:
    po_no       = r.get('poNo')
    proj_code   = r.get('systemProjectCode')
    work_type   = r.get('workType')
    du_id       = r.get('siteId')
    cluster     = r.get('rfClusterName')
    item_dis    = r.get('itemDescription')
    layers      = r.get('layers')
    on_air      = r.get('fullOnAirDate')
    lat         = r.get('latitude')
    lng         = r.get('longitude')
    lat_long    = f"{lat},{lng}" if lat and lng else None
    site_code   = r.get('siteCode')  # raw site code from seed

    seed_id = str(r.get('id', ''))[:30]   # unique Huawei row ID → stored in po_line
    if not po_no or not proj_code or not seed_id:
        continue

    lines.append(
        f"INSERT INTO project_pos "
        f"(po_target, project_code, po_number, po_line, du_id, item_dis, cluster_site, cluster_type, "
        f"lat_long, on_air, work_type, workflow_status, current_owner_role, "
        f"mapping_confidence, mapping_rule, need_mapping_review, last_action_at) "
        f"SELECT 'RF', {q(proj_code)}, {q(po_no,80)}, {q(seed_id,30)}, {q(du_id,80)}, {q(item_dis,200)}, "
        f"{q(cluster,200)}, {q(layers,150)}, {q(lat_long,80)}, "
        f"{q(on_air)}, {q(work_type,20)}, 'PENDING_SITE_MAP', 'PROJECT', "
        f"100, 'PO 2026.xlsx', false, NOW() "
        f"WHERE NOT EXISTS ("
        f"  SELECT 1 FROM project_pos WHERE po_line = {q(seed_id,30)} AND project_code = {q(proj_code)}"
        f");"
    )
    inserted += 1

lines += [
    "",
    "COMMIT;",
    "",
    "-- Summary",
    "SELECT project_code, work_type, COUNT(*) AS cnt",
    "FROM project_pos WHERE source = 'PO 2026.xlsx'",
    "GROUP BY project_code, work_type ORDER BY project_code, work_type;",
    "",
    "SELECT COUNT(*) AS total_po_lines FROM project_pos;",
]

sql = '\n'.join(lines)
print(f"Generated {inserted} INSERT statements")

# ── Upload & run ──────────────────────────────────────────────────────────────
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/home/pn_deploy/import_po.sql')
sftp.close()
print(f"Uploaded SQL ({len(sql):,} bytes)")

run('docker cp /home/pn_deploy/import_po.sql ace-system-postgres:/tmp/import_po.sql')
run('docker exec ace-system-postgres psql -U ace_user -d ace_system -f /tmp/import_po.sql')
run('rm /home/pn_deploy/import_po.sql')

ssh.close()
print("\nDone")
