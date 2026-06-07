"""
Sync presite_tracking + presite_sessions + presite_history from PROD → LOCAL.
Uses paramiko to dump the 3 tables on prod, transfers SQL, then loads into local docker.

Run from project root:  python scripts/sync_presite_from_prod.py
"""
import io
import os
import subprocess
import sys
from datetime import datetime

import paramiko

HOST = "203.159.92.191"
PORT = 22020
USER = "pn_deploy"
PASSWORD = "Pn2026Aa!"  # do not log

PROD_PG_CONTAINER = "ace-system-postgres"
LOCAL_PG_CONTAINER = "ace-system-postgres"
PG_USER = "ace_user"
PG_DB = "ace_system"

TABLES = ["dte_presite_tracking", "dte_presite_sessions", "dte_presite_history"]


def run_local(cmd_list, **kwargs):
    return subprocess.run(cmd_list, check=True, capture_output=True, text=True, **kwargs)


def main():
    print(f"[1/4] Connecting to prod {HOST}:{PORT} ...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD)
    print("  ✓ Connected")

    # Build pg_dump command. Save to file on prod, then SFTP it back —
    # this avoids login-banner stdout pollution that breaks streaming.
    table_args = " ".join(f"-t {t}" for t in TABLES)
    remote_tmp = "/tmp/presite_sync.sql"
    dump_cmd = (
        f"docker exec {PROD_PG_CONTAINER} pg_dump -U {PG_USER} -d {PG_DB} "
        f"--data-only --inserts {table_args} > {remote_tmp} && wc -c {remote_tmp}"
    )

    print(f"[2/4] Dumping prod tables to {remote_tmp} ...")
    stdin, stdout, stderr = client.exec_command(dump_cmd, get_pty=False)
    out = stdout.read().decode("utf-8")
    err = stderr.read().decode("utf-8")
    if "pg_dump:" in err and "error" in err.lower():
        print(f"  ✗ pg_dump error: {err}")
        sys.exit(1)
    print(f"  ✓ {out.strip().splitlines()[-1] if out.strip() else 'dump complete'}")

    # SFTP it back
    print("  Transferring via SFTP ...")
    sftp = client.open_sftp()
    with sftp.file(remote_tmp, "r") as remote_f:
        sql = remote_f.read().decode("utf-8")
    sftp.remove(remote_tmp)
    sftp.close()
    client.close()
    # Empty dump (no INSERT/COPY) is valid — just means prod has 0 rows
    has_data = "INSERT INTO" in sql or "COPY" in sql
    if not has_data:
        print(f"  ⚠ Dump is header-only — prod has 0 rows in these tables")
    print(f"  ✓ Got {len(sql):,} bytes")

    # Write SQL locally for inspection / re-use
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    local_sql_path = os.path.join("backups", f"prod_presite_{ts}.sql")
    os.makedirs("backups", exist_ok=True)
    with open(local_sql_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(sql)
    print(f"  ✓ Saved to {local_sql_path}")

    # Counts in the SQL
    insert_count = sql.count("INSERT INTO")
    print(f"  ↳ {insert_count} INSERT statements found")

    print("[3/4] Clearing LOCAL tables (TRUNCATE CASCADE) ...")
    # IMPORTANT: We're replacing local data — the user explicitly asked for this.
    truncate_sql = (
        "TRUNCATE TABLE dte_presite_history, dte_presite_sessions, dte_presite_tracking RESTART IDENTITY CASCADE;"
    )
    proc = subprocess.run(
        ["docker", "exec", "-i", LOCAL_PG_CONTAINER, "psql", "-U", PG_USER, "-d", PG_DB, "-c", truncate_sql],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print(f"  ✗ TRUNCATE failed: {proc.stderr}")
        sys.exit(1)
    print(f"  ✓ {proc.stdout.strip()}")

    print("[4/4] Loading dump into LOCAL ...")
    proc = subprocess.run(
        ["docker", "exec", "-i", LOCAL_PG_CONTAINER, "psql", "-U", PG_USER, "-d", PG_DB],
        input=sql, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print(f"  ✗ Load failed: {proc.stderr}")
        sys.exit(1)
    print(f"  ✓ Loaded successfully")

    # Final count
    proc = subprocess.run(
        ["docker", "exec", "-i", LOCAL_PG_CONTAINER, "psql", "-U", PG_USER, "-d", PG_DB, "-c",
         "SELECT 'tracking' AS t, COUNT(*) FROM dte_presite_tracking "
         "UNION ALL SELECT 'sessions', COUNT(*) FROM dte_presite_sessions "
         "UNION ALL SELECT 'history', COUNT(*) FROM dte_presite_history;"],
        capture_output=True, text=True,
    )
    print("\n=== Final counts (LOCAL after sync) ===")
    print(proc.stdout)


if __name__ == "__main__":
    main()
