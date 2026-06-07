import urllib.request, json, uuid

BASE = "http://localhost:8000"
FILE = "/app/po_file2.xlsx"

# login
r = urllib.request.Request(f"{BASE}/api/auth/login",
    data=json.dumps({"email": "PM-001", "password": "project1234"}).encode(),
    headers={"Content-Type": "application/json"})
tok = json.loads(urllib.request.urlopen(r, timeout=10).read().decode())["access_token"]

# build multipart
with open(FILE, "rb") as f:
    content = f.read()
boundary = uuid.uuid4().hex
body = b""
body += f"--{boundary}\r\n".encode()
body += b'Content-Disposition: form-data; name="file"; filename="PURCHASE_ORDER_20260604110354.xlsx"\r\n'
body += b"Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n"
body += content
body += f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(f"{BASE}/api/project-pos/import-hw", data=body, method="POST",
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}",
             "Authorization": f"Bearer {tok}"})
try:
    resp = urllib.request.urlopen(req, timeout=60)
    out = json.loads(resp.read().decode())
    print("HTTP", resp.status)
    print("imported:", out.get("imported"), " updated:", out.get("updated"),
          " skipped:", out.get("skipped"), " errors:", out.get("errors"))
    if out.get("error_rows"):
        print("sample errors:", out["error_rows"][:3])
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:300])
