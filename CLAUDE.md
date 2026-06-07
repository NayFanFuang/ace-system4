# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

FastAPI (async) + SQLAlchemy 2 + asyncpg + PostgreSQL 16 + React 18 + Vite 5 + Tailwind 4, all behind Docker Compose. JWT auth via `python-jose`, bcrypt via `passlib`.

## Containers (docker-compose.yml)

| Service | Container | Port | Notes |
|---|---|---|---|
| `postgres` | `ace-system-postgres` | 5433→5432 | user `ace_user` / db `ace_system` |
| `backend` | `ace-system-backend` | 8000 | uvicorn on `/app`, no host volume mount |
| `frontend` | `ace-system-frontend` | 127.0.0.1:5173 | `./frontend` mounted, Vite HMR with `usePolling: true` |

There is also an unrelated `ace-platform-postgres` on 5432 — do not confuse the two.

## Dev workflow — apply changes

Frontend edits land instantly via the mounted volume + Vite HMR. **No restart needed.**

Backend has no host volume, so a Python edit on the host does not appear in the container. Use:

```bash
docker cp app/routers/leave.py ace-system-backend:/app/app/routers/leave.py
docker restart ace-system-backend
```

For multi-file changes, copy each file then restart once. On startup the backend runs `Base.metadata.create_all` and the seed functions in `app/main.py:startup`, so schema/seed problems surface in `docker logs ace-system-backend`.

## Database access

```bash
docker exec ace-system-postgres psql -U ace_user -d ace_system -c "SELECT ..."
```

Schema lives in `app/models/*.py` (DeclarativeBase). There is no Alembic — schema is created from models, and any one-off SQL changes go in `migrations/*.sql` and must be applied manually (`docker exec ... psql -f`).

## Running tests

`tests/` contains pytest-style examples (`test_auth_hardening_examples.py`) but no `pytest.ini`, no fixtures, no CI. They are illustrative templates, not a working suite — wire up fixtures before relying on them.

## Production deploy

Two scripts ship to production over SSH/paramiko (credentials hardcoded — do not echo or print them):

- `python deploy.py` — backend (`app/`)
- `python deploy_frontend.py` — frontend (`frontend/` minus `node_modules`, `dist`)

Both target `203.159.92.191:22020` and use `docker-compose.prod.yml`.

## Backend architecture

`app/main.py` registers all routers and runs seed functions on startup. Routers:

- `auth.py` — login, JWT issue, password change, seed users (`SEED_USERS` lives here)
- `clock.py` — clock-in/out, sites, plus all `/monitor/*` analytics endpoints
- `employees.py` — HR CRUD + project assignments
- `leave.py` — multi-step leave approval (PM → PD → HR or HR-only for Sick), plus `by-token/*` for in-email links
- `kpi.py`, `admin.py`, `system_monitor.py`, `hr_data_quality.py` — domain endpoints

Auth/role pattern in `app/deps.py`:

- `get_current_user` — decodes JWT, returns payload dict
- `require_hr_user`, `require_monitor_user`, `require_super_admin`, etc. — role gates
- `require_self_or_admin(payload, employee_code)` — used on per-employee endpoints

Roles: `SUPER_ADMIN`, `SYSTEM_ADMIN`, `HR_ADMIN`, `HR_VIEWER`, `PROJECT_ADMIN`, `PM`, `DIRECTOR`, `ACCOUNTING`, `EMPLOYEE`. Scopes per role live in `ROLE_SCOPES` in `deps.py`.

## Frontend architecture

`frontend/src/main.jsx` is the single SPA entry. Routing is custom:

- `window.location.pathname` is matched against `ROUTE_DEFINITIONS` in `frontend/src/platformRoutes.js` — this is the **authoritative list of every page**, its `roles`, `group`, `comingSoon` flag, and `legacy` aliases. Adding a page = add an entry here + import the component in `main.jsx`'s `COMPONENTS` map.
- Each route declares `roles` and a `component` name; `canAccessRoute` enforces role gates
- All routes are wrapped in `AuthGate` which loads/persists user from `localStorage` key `ace_system_auth_user_v1`
- Frontend role buckets (`ROLES.OPS`, `ROLES.HR`, `ROLES.FINANCE`, etc.) live at the top of `platformRoutes.js` — reuse these, don't hand-list roles per route

**Bypass pattern**: public-facing pages (e.g. `/leave-approval/<token>`) are early-returned in `AppRouter` *before* `AuthGate` mounts. Add new public routes the same way.

**Page inventory** (≈30 pages across 9 groups — Overview, My Workspace, HR, Clock, Project, KPI, Finance, Reports, Executive, Admin, Support). Page components live flat at `frontend/` repo root as large single-file `.jsx` files (each 1–3k lines). Small placeholder pages (MyProfile, Workflow, Admin Users/Roles, HR Analytics, Document, Help, etc.) are bundled in `frontend/PlatformPages.jsx`. They use `apiFetch` from `frontend/src/apiFetch.js` which auto-attaches the JWT.

**No shared shell or UI kit**: there is no Layout component, no `<Button>`/`<Card>`/`<Modal>` library, no design tokens, no Context for auth — each page is self-contained and re-implements its own header, sidebar, table, modal styling inline with Tailwind. The only real shared infra is:

- `platformRoutes.js` — routes + role buckets
- `main.jsx` — AuthGate, Login, ForcePasswordChange, AccessDenied, COMPONENTS dispatch
- `apiFetch.js` — HTTP + JWT
- `dateFormat.js`, `exportUtils.js` — small utilities
- `styles.css` — Tailwind import + `.ace-login-*` classes (mostly login page); global look is otherwise undefined

That's why pages drift in look-and-feel. When introducing a shared component or layout, expect to refactor many pages in lockstep.

Vite proxies `/api` and `/photos` to `VITE_API_TARGET` (defaults to backend). When testing the frontend in a browser, hit it through `http://localhost:5173`, not the backend directly.

## Major frontend subsystems

Beyond Clock/HR/Project/Leave, three subsystems are easy to miss but non-trivial:

- **Worklog & Timesheet** (`DailyWorklogPage.jsx`) — per-day work summary for DAILY clock-type staff. Auto-saves on a 2s debounce (`PUT /api/worklog/me/{YYYY-MM-DD}`), pulls clock sessions for the day, supports signature upload (`PUT/DELETE /api/worklog/me/signature`), and exports a monthly PDF timesheet via `GET /api/worklog/me/export/timesheet`.
- **Finance** (`RevenueExpensePage.jsx`, `HWPOImportPage.jsx`, `DtePaymentsPage.jsx`) — multi-tab financial dashboard (Plan vs Actual, Project P&L) plus an Excel-upload pipeline that imports Huawei PO files, auto-classifies SSV/PAC work type, and routes through site-mapping/approval states.
- **KPI** (`KPIPage.jsx` evaluator + `SelfAssessmentPage.jsx` self) — period-scoped (YYYY-MM) evaluation grid against a per-position KPI library; score auto-derives as `MIN(actual/target, 1) × weight`; backend at `app/routers/kpi.py`.

## ClockApp specifics

`ClockApp.jsx` is **mobile-only by design** — on desktop it shows a blocking warning screen (camera + GPS required for clock-in). Dev override: append `?desktop=1` to the URL. It has a Role Switcher (DTE per-site / DTE_DAILY / TE / DTA / OTHER), each with different rules pulled from `/api/clock-permissions/{employeeCode}`. The per-role toggles (Enabled, GPS required, Photo required, Radius enforcement) are managed by admins at `/admin/users` and persisted via `/api/admin/clock-settings`.

The Live Wallboard (`ClockWallboardPage.jsx`) auto-refreshes every 30s and renders GPS markers on a Leaflet/OpenStreetMap canvas.

## Email + leave-approval link system

- `app/services/email_service.py` — `queue_and_send_email(db, to, subject, text, html, cc=)` writes to `email_outbox` and sends via SMTP (env `SMTP_*`)
- `app/services/leave_emails.py` — pure template functions returning `(subject, body_text, body_html)` for each leave state transition
- `app/services/leave_tokens.py` — signed JWT (aud=`leave-approval`, 7-day) for in-email approve/reject links, shares `SECRET_KEY` with the access-token signer
- `_notify_with_links` in `app/routers/leave.py` injects a per-recipient approval URL into outgoing notification emails. **Per-recipient is required for audit integrity** — never CC multiple recipients on a link email or any of them clicking will log as the TO recipient

Replay protection on `by-token` is status-based (PM token only valid while leave is `PENDING_PM`), so re-clicks naturally fail at the status guard — no consumed-token table.

## Leave approval state machine

`PENDING_PM → PENDING_DC → APPROVED` for Annual/Other, or `PENDING_PM → APPROVED` for Personal, or `PENDING_HR → APPROVED` for Sick. Approver routing uses `employees.manager_code` (direct manager) with fallback to `_emails_by_role(role)`. `_pd_emails` first looks for role in `(DC, DIRECTOR, PROJECT_DIRECTOR)` before falling back. See `app/routers/leave.py:_manager_emails`, `_pd_emails`, `_hr_emails`, `_boss_emails`.

The `BOSS_FULL_NAME = "Seng Bun Lay"` constant in `leave.py` is used to resolve the Managing Director's email for CC on non-sick approvals.

## Seed users (for local dev login)

| employee_code | password | role |
|---|---|---|
| `ADMIN` | `admin1234` | SUPER_ADMIN |
| `ACE056` | `ace1234` | EMPLOYEE (Peerapol Piamsri) |
| `HR-001` | `hr1234` | HR_ADMIN |
| `PM-001` | `project1234` | PROJECT_ADMIN |

Login takes either email or employee_code. Account locks for 15 min after 5 failed logins (`auth_users.failed_login_count`, `locked_until`).

## Misc gotchas

- `JWT_SECRET_KEY` is validated at startup — must be ≥32 chars and not a known-weak value, or the backend refuses to boot
- Photos written by clock-in flow live in `/app/photos/clock` (mounted from `./photos`)
- `_sync_backups/` holds historical frontend snapshots and should never be edited
- The HTML files at the repo root (`ace_complete_schema_erd.html`, etc.) are static ERD viewers, not part of the app
