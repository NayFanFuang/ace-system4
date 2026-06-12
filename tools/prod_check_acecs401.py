"""Check ACECS401 work location on prod (auth_users + employees)."""
import os, sys, paramiko
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from deploy_env import load_deploy_creds
_cr = load_deploy_creds()
c = {"HOST": _cr["host"], "PORT": _cr["port"], "USER": _cr["user"], "PASSWORD": _cr["password"]}
SQL = r"""
\echo '=== ACECS401 auth_users work location ==='
SELECT employee_code, position_code, clock_type, work_location_name, work_lat, work_lng, allowed_radius_m
FROM auth_users WHERE employee_code='ACECS401';
\echo '=== ACECS401 employees.work_location field ==='
SELECT employee_code, full_name, position, department, project_team, work_location
FROM employees WHERE employee_code='ACECS401';
\echo '=== distinct work_location_name values across auth_users (what presets exist) ==='
SELECT work_location_name, COUNT(*) FROM auth_users WHERE work_location_name IS NOT NULL GROUP BY work_location_name ORDER BY 2 DESC;
\echo '=== who is already on AIS (to copy coords) ==='
SELECT employee_code, work_location_name, work_lat, work_lng, allowed_radius_m
FROM auth_users WHERE work_location_name ILIKE '%AIS%' LIMIT 5;
"""
ssh = paramiko.SSHClient(); ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(c["HOST"], port=c["PORT"], username=c["USER"], password=c["PASSWORD"], timeout=30)
i,o,e = ssh.exec_command("docker exec -i ace-system-postgres psql -U ace_user -d ace_system -f -")
i.write(SQL); i.channel.shutdown_write()
print(o.read().decode()); ssh.close()
