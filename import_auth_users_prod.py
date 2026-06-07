"""
Upload import_auth_users.sql to production and run it in the postgres container.
"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('203.159.92.191', port=22020, username='pn_deploy', password='Pn2026Aa!', timeout=15)

def run(cmd, show_err=True):
    _, o, e = ssh.exec_command(cmd, timeout=120)
    out = o.read().decode(); err = e.read().decode()
    rc = o.channel.recv_exit_status()
    if out: print(out.rstrip())
    if err and err.strip() and show_err:
        print('ERR:', err.rstrip())
    return rc, out, err

LOCAL_SQL = r"C:\GoogleAppScript\0_NewServer\ACE_System4\import_auth_users.sql"
REMOTE_TMP = "/home/pn_deploy/import_auth_users.sql"

# Upload SQL
sftp = ssh.open_sftp()
sftp.put(LOCAL_SQL, REMOTE_TMP)
sftp.close()
print(f"Uploaded {LOCAL_SQL}")

# Find postgres container name
rc, out, _ = run('docker ps --format "{{.Names}}" | grep postgres')
container = out.strip().split('\n')[0].strip()
print(f"Postgres container: {container}")

# Copy SQL into container and run it
run(f"docker cp {REMOTE_TMP} {container}:/tmp/import_auth_users.sql")
rc, out, err = run(
    f"docker exec {container} psql -U ace_user -d ace_system -f /tmp/import_auth_users.sql"
)
print(f"Exit code: {rc}")

# Cleanup
run(f"rm {REMOTE_TMP}")
run(f"docker exec {container} rm /tmp/import_auth_users.sql")

ssh.close()
print("\nDone.")
