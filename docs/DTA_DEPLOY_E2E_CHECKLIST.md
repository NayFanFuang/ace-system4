# DTA Self-Service — Prod Deploy + E2E Checklist

Feature: `/project/presite-monitor-dta/update` (DTA updates own clusters) + system-native
provenance + Owner(Assign) linking + ETL guard. All work is on branch
`clockapp-presite-plan-improvements` (committed + pushed). **Nothing is on prod yet** — prod has
no `dta_clusters` table or data.

Prod target: `203.159.92.191:22020`, `docker-compose.prod.yml`, container `ace-system-postgres`
(db `ace_system` / user `ace_user`). Deploy scripts SSH from the host.

---

## A. Pre-deploy (local — DONE)
- [x] Feature complete, E2E-verified local (list + editor + sites + map + assign flow)
- [x] Committed (`248cf41`, `66b2160`) + pushed to `origin/clockapp-presite-plan-improvements`
- [ ] Confirm local backend container is the latest (`grep -c dta/my-clusters` in container = 2)
- [ ] Decide data-population method for prod (see step B3 — **the hard part**)

## B. Deploy steps (run IN ORDER)

### B1. Backend code → creates the tables
```bash
python deploy.py          # ships app/ ; startup create_all builds dta_clusters + dta_cluster_rounds
```
- [ ] `docker logs ace-system-backend` shows clean startup (no errors)
- [ ] Tables exist: `docker exec ace-system-postgres psql -U ace_user -d ace_system -c "\dt dta_*"`
- Note: `create_all` builds `dta_clusters` from the model → it already includes `progress_source`,
  `progress_edited_at/by`, `assigned_employee_code` (so the ALTER migrations below are mostly no-ops,
  but run them anyway for older prod tables / idempotency).

### B2. Schema migrations (idempotent — safe even if columns exist)
```bash
python deploy_migration.py migrations/20260609_dta_owner_source.sql      # owner_source, dte_ready_*
python deploy_migration.py migrations/20260612_dta_progress_source.sql   # progress_source, assigned_employee_code
```
- [ ] both report success (psql rc=0)

### B3. Populate cluster data on prod ⚠️ (decision point)
Prod needs the 290 clusters + rounds. Two options:

**Option 1 — copy local data (recommended; avoids xlsx path/env issues on prod):**
```bash
# dump the 2 tables from LOCAL (already imported + owner-linked)
docker exec ace-system-postgres pg_dump -U ace_user -d ace_system -t dta_clusters -t dta_cluster_rounds --data-only --column-inserts > /tmp/dta_data.sql
# load onto prod (via deploy_migration or scp+psql)
python deploy_migration.py /tmp/dta_data.sql
```
- ⚠️ `assigned_employee_code` values (AE021, AE013…) must exist in **prod** `auth_users`. Verify prod
  has the same employee codes, else owner→login scoping won't match on prod.

**Option 2 — run the Excel import against prod** (needs the xlsx reachable + PG env → prod):
```bash
PGHOST=<prod> PGPORT=<port> python scripts/import_dta_clusters.py "<path-to-xlsx>"
```
- [ ] choose option; confirm `SELECT count(*) FROM dta_clusters` = ~290 on prod

### B4. Data migrations (AFTER data exists; order matters)
```bash
python deploy_migration.py migrations/20260613_disable_xlsx_dupes.sql    # FIRST — disables ACE-XLSX dup logins
python deploy_migration.py migrations/20260613_dta_owner_backfill.sql    # THEN — auto-links owners (is_active filter)
```
- [ ] disable runs before backfill (so ambiguous names like Yodsawee auto-resolve)
- [ ] `SELECT count(*) FILTER (WHERE assigned_employee_code IS NOT NULL) FROM dta_clusters` > 0

### B5. Frontend
```bash
python deploy_frontend.py
```
- [ ] prod site serves the new build (hard-refresh)

---

## C. E2E verification on prod (after deploy)

### Auth / scoping
- [ ] Login as a **real DTA** (e.g. AE021 Natdanai) → page loads, sees ONLY own clusters
- [ ] Admin (PM/SUPER) sees all clusters
- [ ] A non-owner DTA: `PUT /dta/clusters/{x}/progress` → **403**; `GET /dta/my-clusters` excludes others
- [ ] Disabled ACE-XLSX account → login **fails** (is_active=false)

### Cluster gating
- [ ] Only clusters WITH a Cluster Ready date appear in `/dta/my-clusters`

### Update flow (the core)
- [ ] Open a cluster → editor renders: guided stepper (zones, sequential lock), sites table + map, status (auto)
- [ ] "Mark today" a milestone → saves → `progress_source='MANUAL'`, phase/health recomputed, status auto-derived
- [ ] Add a PA-loop round → persists; Test Engineer shows "from DTE"
- [ ] Plan vs Actual chips show on PA Open / Tuning Closed / PAC Approved (on-time / late / overdue)

### Provenance guard (the key promise)
- [ ] Re-run the Excel import on prod → the MANUAL-edited cluster's progress + plan + rounds are **NOT overwritten**; EXCEL clusters refresh normally

### Owner (Assign) — the entry flow
- [ ] `/project/presite-monitor-dta` → Owner (Assign) → assign a team-code owner ("TH_Natdanai") → `assigned_employee_code` resolves to the login (AE021) → that DTA then sees the cluster

### Cross-system (single source)
- [ ] presite-monitor (DTE) PAC stages (PA Open/Closed/Report Submitted/Approved) mirror `dta_clusters` values (read-only)
- [ ] `POST /api/presite/dta/clusters` → **405** (in-app create intentionally removed)

---

## D. Rollback (if needed)
- Backend/frontend: redeploy the previous commit.
- Data: schema migrations are additive (no drop). To revert a cluster to sheet control:
  `UPDATE dta_clusters SET progress_source='EXCEL' WHERE rf_cluster_name='…';` then re-import.

## Gotchas
- `docker cp` may fail with an `app_uploads` mount error → use `docker exec -i … tee <path> < file`.
- Recompute logic is mirrored in JS (`frontend/DtaUpdatePage.jsx`) and Python
  (`app/services/dta_progress.py`) — keep them in sync.
