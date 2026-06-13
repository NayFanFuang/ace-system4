# Leave System — E2E Checklist

Covers the full leave lifecycle: approval chains (SHORT + FULL/Senior-PM), email
notifications, in-email approval links, leave statistics in emails, and the HR
Leave Management dashboard.

Run the automated harness:

```bash
docker cp tests/leave_e2e.py ace-system-backend:/app/leave_e2e.py
docker exec -e EMAIL_DRY_RUN=1 ace-system-backend python /app/leave_e2e.py
```

It runs against the real DB in email **dry-run** mode (no SMTP send; outbox rows
written with status `DRY_RUN`), using a dedicated test employee, and cleans up
after itself. Each row below maps to a `[PASS]/[FAIL]` line in the output.

| # | Area | Test case | Expected |
|---|------|-----------|----------|
| A1 | SHORT chain | Submit Annual leave | status `PENDING_PM`, submit email queued |
| A2 | SHORT chain | PM approve | status `PENDING_DC`, PM-approved email to PD |
| A3 | SHORT chain | DC approve | status `APPROVED`, approved email to HR + Boss |
| B1 | FULL chain | Set chain-mode FULL | `_chain_mode` returns `FULL` |
| B2 | FULL chain | PM approve (FULL) | status `PENDING_SPM` (not PENDING_DC) |
| B3 | FULL chain | SPM approve | status `PENDING_DC`, Senior-PM-approved email to PD |
| B4 | FULL chain | DC approve | status `APPROVED` |
| C1 | Personal | Submit + PM approve | short-circuits straight to `APPROVED` |
| D1 | Sick | Submit Sick leave | initial status `PENDING_HR` |
| D2 | Sick | HR acknowledge | status `APPROVED` |
| E1 | Reject | PM reject | status `REJECTED`, reject_at_step `PM`, reason stored |
| E2 | Reject | SPM reject (FULL) | status `REJECTED`, reject_at_step `SPM` |
| E3 | Reject | DC reject | status `REJECTED`, reject_at_step `DC` |
| F1 | Cancel | Cancel while PENDING_SPM | status `CANCELLED` |
| G1 | By-token | GET token (spm step) | `can_act=true`, expected_status `PENDING_SPM` |
| G2 | By-token | POST approve via spm link | status `PENDING_DC` |
| G3 | By-token | Replay (re-click consumed link) | rejected with HTTP 400 (status guard) |
| H1 | Email stats | Rendered stats block | `last_6_months` has 6 months |
| H2 | Email stats | Most recent leave | `last_leave` resolved from prior approved leave |
| H3 | Email stats | Remaining balance | `remaining_after_request_text` present |
| I1 | Dashboard | `GET /dashboard` | summary + monthlyTrend(12) + byDepartment + executive |
| I2 | Dashboard | `GET /calendar` | per-day occupancy + departments list |
| J1 | Inbox | `pending-for-me` (PROJECT_ADMIN) | PENDING_SPM request visible to Senior PM role |
| K1 | Audit | Per-recipient links | TO gets signed link; CC gets `[CC]` no-link copy |

## Manual / UI checks (not automated)

- [ ] ClockApp → Leave tab: submit form, "My Leave Requests" shows Senior PM step in flow when FULL.
- [ ] ClockApp → Approvals tab: PENDING_SPM request shows Approve/Reject; maps to `spm-approve`/`spm-reject`.
- [ ] Email link page (`/leave-approval/<token>`): Senior PM step renders, Approve/Reject work.
- [ ] HR → Leave: KPI cards, monthly trend, on-leave-today, calendar (month nav + dept filter + day drill-down), by-department, executive summary all render.
