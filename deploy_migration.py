"""
Deploy a single SQL migration file to production and run it inside the
ace-system-postgres container.

Usage:
    python deploy_migration.py migrations/20260602_add_employee_AE021.sql
"""
import os
import sys
import posixpath
import paramiko
from deploy_env import load_deploy_creds

_creds   = load_deploy_creds()
HOST     = _creds["host"]
PORT     = _creds["port"]
USER     = _creds["user"]
PASSWORD = _creds["password"]
REMOTE_DIR = "/home/pn_deploy/ace_system4/migrations"
CONTAINER  = "ace-system-postgres"
PG_USER    = "ace_user"
PG_DB      = "ace_system"


def main(local_path: str) -> int:
    if not os.path.isfile(local_path):
        print(f"ERROR: file not found: {local_path}")
        return 2

    fname = os.path.basename(local_path)
    remote_path = posixpath.join(REMOTE_DIR, fname)
    container_path = f"/tmp/{fname}"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[1/4] Connecting to {HOST}:{PORT} ...")
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

    print(f"[2/4] Uploading {local_path} -> {remote_path}")
    sftp = ssh.open_sftp()
    try:
        sftp.mkdir(REMOTE_DIR)
    except IOError:
        pass  # already exists
    sftp.put(local_path, remote_path)
    sftp.close()

    print(f"[3/4] Copying into container {CONTAINER}:{container_path}")
    _, stdout, stderr = ssh.exec_command(
        f"docker cp {remote_path} {CONTAINER}:{container_path}"
    )
    rc = stdout.channel.recv_exit_status()
    err = stderr.read().decode()
    if rc != 0:
        print(f"docker cp failed (rc={rc}): {err}")
        ssh.close()
        return rc

    print(f"[4/4] Running psql -f {container_path}")
    cmd = (
        f"docker exec -e PGOPTIONS='--client-min-messages=warning' "
        f"{CONTAINER} psql -U {PG_USER} -d {PG_DB} -v ON_ERROR_STOP=1 "
        f"-f {container_path}"
    )
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    rc = stdout.channel.recv_exit_status()
    print("--- psql stdout ---")
    print(out)
    if err:
        print("--- psql stderr ---")
        print(err)
    ssh.close()
    print(f"Done (rc={rc}).")
    return rc


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python deploy_migration.py <path-to-sql-file>")
        sys.exit(64)
    sys.exit(main(sys.argv[1]))
