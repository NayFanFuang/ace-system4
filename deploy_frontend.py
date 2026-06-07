import paramiko, io, os, tarfile, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('203.159.92.191', port=22020, username='pn_deploy', password='Pn2026Aa!', timeout=15)

def run(cmd):
    _, o, e = ssh.exec_command(cmd, timeout=300)
    out = o.read().decode(); err = e.read().decode()
    rc = o.channel.recv_exit_status()
    if out: print(out.rstrip())
    if err and err.strip() and 'notify' not in err and 'WARNING' not in err:
        print('ERR:', err.rstrip())
    return rc

LOCAL    = r"C:\GoogleAppScript\0_NewServer\ACE_System4\frontend"
EXCLUDES = {"node_modules", "__pycache__", "dist", ".git"}

buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for root, dirs, files in os.walk(LOCAL):
        dirs[:] = [d for d in dirs if d not in EXCLUDES]
        for fname in files:
            fpath = os.path.join(root, fname)
            rel     = os.path.relpath(fpath, LOCAL)
            arcname = "frontend/" + rel.replace("\\", "/")
            tar.add(fpath, arcname=arcname)
buf.seek(0)
size_kb = len(buf.getvalue()) / 1024

sftp = ssh.open_sftp()
sftp.putfo(buf, "/home/pn_deploy/frontend.tar.gz")
sftp.close()
print(f"Uploaded {size_kb:.0f} KB")

run("cd /home/pn_deploy/ace_system4 && tar -xzf /home/pn_deploy/frontend.tar.gz")
print("Extracted")

run("cd /home/pn_deploy/ace_system4 && docker compose -f docker-compose.prod.yml up -d --build frontend 2>&1")

time.sleep(3)
run('docker ps --format "table {{.Names}}\t{{.Status}}"')
run("rm /home/pn_deploy/frontend.tar.gz")
ssh.close()
print("Done")
