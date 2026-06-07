"""Show each DTE Per-Site account and whether it has a planned site (prod)."""
import ast, os, paramiko
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, "deploy.py"), encoding="utf-8") as f:
    tree = ast.parse(f.read())
c = {}
for n in tree.body:
    if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name) and n.targets[0].id in ("HOST","PORT","USER","PASSWORD") and isinstance(n.value, ast.Constant):
        c[n.targets[0].id] = n.value.value

SQL = r"""
\echo '=== Each DTE Per-Site: plan status + which site ==='
SELECT au.employee_code,
       COALESCE(e.full_name,'?') AS name,
       COALESCE((
         SELECT string_agg(DISTINCT p.cluster_site || ' [' || p.work_type || '/' || p.workflow_status || ']', ', ')
         FROM project_pos p
         WHERE p.planned_dte_codes = au.employee_code
           AND p.workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED')
       ), '— none —') AS planned_sites
FROM auth_users au
LEFT JOIN employees e ON e.employee_code = au.employee_code
WHERE au.position_code='DTE' AND au.clock_type='PER_SITE'
ORDER BY au.employee_code;

\echo '=== ACECS434 (Wipada) — is she DTE Per-Site on prod? plan status ==='
SELECT au.employee_code, au.position_code, au.clock_type,
       (SELECT COUNT(*) FROM project_pos p WHERE p.planned_dte_codes='ACECS434'
          AND p.workflow_status IN ('PLANNED','IN_PROGRESS','LEADER_APPROVED')) AS planned_count
FROM auth_users au WHERE au.employee_code='ACECS434';
"""
ssh = paramiko.SSHClient(); ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(c["HOST"], port=c["PORT"], username=c["USER"], password=c["PASSWORD"], timeout=30)
i,o,e = ssh.exec_command("docker exec -i ace-system-postgres psql -U ace_user -d ace_system -f -")
i.write(SQL); i.channel.shutdown_write()
print(o.read().decode()); ssh.close()
