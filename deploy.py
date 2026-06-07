"""
Deploy ACE System 4 to production server.
Usage: python deploy.py
"""
import os, sys, tarfile, io, stat
import paramiko

HOST     = "203.159.92.191"
PORT     = 22020
USER     = "pn_deploy"
PASSWORD = "Pn2026Aa!"
REMOTE   = "/home/pn_deploy/ace_system4"
LOCAL    = r"C:\GoogleAppScript\0_NewServer\ACE_System4"

# Files/dirs to sync (exclude node_modules, __pycache__, photos, .env, import scripts)
EXCLUDES = {
    "node_modules", "__pycache__", ".git", "photos",
    "import_employees2.py", "deploy.py",
    "ACE and AE Employee Update_V190.xlsx",
    "ace_complete_schema_erd.html", "clock_v2_erd.html",
    "ace_hr_project.zip", "operations_full_database_erd_zoomable_v2.html",
    "operations_system_7_groups_html_executive.html",
    "migrations", "tests", "tools",
    ".chrome-clockapp-guide", ".chrome", ".playwright",
}

def should_include(path_parts):
    for part in path_parts:
        if part in EXCLUDES or part.endswith(".pyc"):
            return False
        # Skip Office lock files (e.g. "~$Whatever.xlsx") — they're locked + irrelevant to backend
        if part.startswith("~$"):
            return False
    return True

def make_tarball():
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for root, dirs, files in os.walk(LOCAL):
            # prune excluded dirs in-place (exact match + dynamic chrome/playwright profile dirs)
            dirs[:] = [d for d in dirs if d not in EXCLUDES and not d.startswith(".chrome") and not d.startswith(".playwright")]
            for fname in files:
                fpath = os.path.join(root, fname)
                rel   = os.path.relpath(fpath, LOCAL)
                parts = rel.replace("\\", "/").split("/")
                if not should_include(parts):
                    continue
                # skip .env (don't overwrite prod env)
                if rel in (".env",):
                    continue
                arcname = "ACE_System4/" + rel.replace("\\", "/")
                tar.add(fpath, arcname=arcname)
    buf.seek(0)
    return buf

print("=== ACE System 4 Deploy ===")
print(f"Target: {USER}@{HOST}:{PORT}  →  {REMOTE}")

# ─── Connect ──────────────────────────────────────────────────────────────────
print("\n[1/5] Connecting to server...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
print("      Connected ✓")

def run(cmd, sudo=False):
    if sudo:
        cmd = f"echo '{PASSWORD}' | sudo -S bash -c '{cmd}'"
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    rc  = stdout.channel.recv_exit_status()
    if out: print("     ", out)
    if err and rc != 0: print("  ERR:", err)
    return rc, out, err

# ─── Check docker-compose on server ───────────────────────────────────────────
print("\n[2/5] Checking server state...")
run("ls /home/pn_deploy/")
run("ls /home/pn_deploy/ace_system4/")
run("docker ps --format 'table {{.Names}}\\t{{.Status}}' 2>&1 || true")

# ─── Build tarball & upload ───────────────────────────────────────────────────
print("\n[3/5] Building tarball of changed files...")
tarball = make_tarball()
size_mb = len(tarball.getvalue()) / 1024 / 1024
print(f"      Archive size: {size_mb:.1f} MB")

sftp = ssh.open_sftp()
remote_tar = "/home/pn_deploy/ace_deploy.tar.gz"
print(f"      Uploading to {remote_tar}...")
sftp.putfo(tarball, remote_tar)
sftp.close()
print("      Upload ✓")

# ─── Extract & place files ────────────────────────────────────────────────────
print("\n[4/5] Extracting on server...")
# Extract into temp dir then copy to ace_system4
run("cd /home/pn_deploy && tar -xzf ace_deploy.tar.gz")
# Copy files from extracted ACE_System4/ into ace_system4/ (overwrite)
run("cp -rf /home/pn_deploy/ACE_System4/app /home/pn_deploy/ace_system4/")
run("cp -rf /home/pn_deploy/ACE_System4/frontend /home/pn_deploy/ace_system4/")
run("cp -f /home/pn_deploy/ACE_System4/Dockerfile /home/pn_deploy/ace_system4/")
run("cp -f /home/pn_deploy/ACE_System4/requirements.txt /home/pn_deploy/ace_system4/")
run("cp -f /home/pn_deploy/ACE_System4/docker-compose.prod.yml /home/pn_deploy/ace_system4/")
run("echo 'Files copied ✓'")
run(f"ls {REMOTE}/")

# ─── Docker rebuild & restart ─────────────────────────────────────────────────
print("\n[5/5] Rebuilding Docker containers (prod)...")
deploy_cmd = (
    f"cd {REMOTE} && "
    f"docker compose -f docker-compose.prod.yml up -d --build backend frontend 2>&1"
)
rc, out, err = run(deploy_cmd, sudo=True)
if rc != 0:
    print("  Retrying without sudo...")
    run(f"cd {REMOTE} && docker compose -f docker-compose.prod.yml up -d --build backend frontend 2>&1")

# ─── Health check ─────────────────────────────────────────────────────────────
print("\n[✓] Container status:")
run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")
print("\n[✓] Health check:")
run("curl -s http://localhost:8081/health || curl -s http://localhost:8000/health || echo 'waiting...'")

# ─── Cleanup ──────────────────────────────────────────────────────────────────
run("rm -rf /home/pn_deploy/ace_deploy.tar.gz /home/pn_deploy/ACE_System4")

ssh.close()
print("\n=== Deploy complete! ===")
print(f"    http://ace.airconnect-e.com:8081/ClockApp")
print(f"    http://ace.airconnect-e.com:8081/HREmployeePage")
print(f"    http://ace.airconnect-e.com:8081/SystemMonitorPage")
print(f"    http://ace.airconnect-e.com:8081/ClockMonitorPage")
