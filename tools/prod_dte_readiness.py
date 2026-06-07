"""Prod readiness check for DTE Per-Site go-live.
Extracts SSH creds from deploy.py via AST (no execution, never prints password),
then queries the production DB through `docker exec ace-system-postgres psql`.
"""
import ast
import os
import paramiko

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "deploy.py"), "r", encoding="utf-8") as f:
    tree = ast.parse(f.read())
creds = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        name = node.targets[0].id
        if name in ("HOST", "PORT", "USER", "PASSWORD") and isinstance(node.value, ast.Constant):
            creds[name] = node.value.value

SQL = r"""
\echo '=== Q1: active DTE Per-Site accounts ==='
SELECT
  (SELECT COUNT(*) FROM auth_users WHERE position_code='DTE' AND clock_type='PER_SITE') AS authuser_dte_persite,
  (SELECT COUNT(DISTINCT employee_code) FROM project_assignments_live
     WHERE role_in_project='DTE' AND clock_type='PER_SITE' AND is_active) AS assigned_dte_persite;

\echo '=== Q2: DTEs that HAVE >=1 planned site (PLANNED/IN_PROGRESS/LEADER_APPROVED) ==='
SELECT COUNT(DISTINCT planned_dte_codes) AS dtes_with_plan
FROM project_pos
WHERE planned_dte_codes IS NOT NULL AND planned_dte_codes <> ''
  AND workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED');

\echo '=== Q3: planned site-roots vs clock_site + coords coverage ==='
WITH planned AS (
  SELECT DISTINCT upper(split_part(cluster_site,'_',1)) AS root
  FROM project_pos
  WHERE planned_dte_codes IS NOT NULL AND planned_dte_codes <> ''
    AND workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED')
    AND cluster_site IS NOT NULL AND cluster_site <> ''
)
SELECT COUNT(*) AS planned_roots,
       COUNT(cs.id) AS have_clocksite,
       COUNT(cs.lat) AS have_coords,
       COUNT(*) - COUNT(cs.lat) AS missing_coords
FROM planned p
LEFT JOIN clock_sites cs ON upper(cs.site_code) = p.root;

\echo '=== Q4: DTE Per-Site accounts that would be STRANDED (no planned site) ==='
SELECT au.employee_code, COALESCE(e.full_name,'?') AS name
FROM auth_users au
LEFT JOIN employees e ON e.employee_code = au.employee_code
WHERE au.position_code='DTE' AND au.clock_type='PER_SITE'
  AND au.employee_code NOT IN (
    SELECT DISTINCT planned_dte_codes FROM project_pos
    WHERE planned_dte_codes IS NOT NULL AND planned_dte_codes <> ''
      AND workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED')
  )
ORDER BY au.employee_code;

\echo '=== Q5: planned roots that LACK coords (GPS radius will not enforce) ==='
WITH planned AS (
  SELECT DISTINCT upper(split_part(cluster_site,'_',1)) AS root
  FROM project_pos
  WHERE planned_dte_codes IS NOT NULL AND planned_dte_codes <> ''
    AND workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED')
    AND cluster_site IS NOT NULL AND cluster_site <> ''
)
SELECT p.root, (cs.id IS NOT NULL) AS has_clocksite, cs.lat, cs.lng
FROM planned p
LEFT JOIN clock_sites cs ON upper(cs.site_code) = p.root
WHERE cs.id IS NULL OR cs.lat IS NULL
ORDER BY p.root;
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(creds["HOST"], port=creds["PORT"], username=creds["USER"],
            password=creds["PASSWORD"], timeout=30)
# Pipe SQL via stdin to psql inside the prod postgres container
cmd = "docker exec -i ace-system-postgres psql -U ace_user -d ace_system -v ON_ERROR_STOP=0 -f -"
stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write(SQL)
stdin.channel.shutdown_write()
out = stdout.read().decode()
err = stderr.read().decode()
ssh.close()
print(out)
if err.strip():
    print("--- stderr ---")
    print(err)
