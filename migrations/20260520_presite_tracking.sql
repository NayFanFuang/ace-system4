-- Migration: 20260520_presite_tracking
-- Pre-Site Monitor — DTE per-site workflow tracking (Phase 1: Steps 1-6)
-- Auto-seeded from rf-monitor Pipeline when PO is marked done (LEADER_APPROVED).

CREATE TABLE IF NOT EXISTS dte_presite_tracking (
    id                  BIGSERIAL PRIMARY KEY,
    ace_project_code    VARCHAR(30),
    site_code           VARCHAR(50),
    po_id               BIGINT REFERENCES project_pos(id) ON DELETE CASCADE,
    po_number           VARCHAR(80),
    po_line             VARCHAR(30),
    assigned_dte_code   VARCHAR(120),
    assigned_dte_name   VARCHAR(200),
    full_onair_at       TIMESTAMPTZ,                   -- Day 0
    -- Step 1
    dt_done_at          TIMESTAMPTZ,
    dt_done_by          VARCHAR(120),
    -- Step 2
    report_done_at      TIMESTAMPTZ,
    report_done_by      VARCHAR(120),
    -- Step 3 + Pass/Fail
    check_at            TIMESTAMPTZ,
    check_by            VARCHAR(120),
    check_result        VARCHAR(10),                   -- PASS | FAIL
    check_notes         TEXT,
    rework_count        INT NOT NULL DEFAULT 0,
    -- Step 4
    ace_submit_at       TIMESTAMPTZ,
    ace_submit_by       VARCHAR(120),
    ace_report_url      VARCHAR(500),
    -- Step 5
    tl_review_at        TIMESTAMPTZ,
    tl_review_by        VARCHAR(120),
    pm_review_at        TIMESTAMPTZ,
    pm_review_by        VARCHAR(120),
    -- Step 6
    ace_approve_at      TIMESTAMPTZ,
    ace_approve_by      VARCHAR(120),
    -- Workflow state
    current_stage       VARCHAR(30) NOT NULL DEFAULT 'FULL_ONAIR',
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (po_id, site_code)
);

CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_project ON dte_presite_tracking (ace_project_code);
CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_stage   ON dte_presite_tracking (current_stage);
CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_dte     ON dte_presite_tracking (assigned_dte_code);
CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_site    ON dte_presite_tracking (site_code);
CREATE INDEX IF NOT EXISTS ix_dte_presite_tracking_onair   ON dte_presite_tracking (full_onair_at DESC);


CREATE TABLE IF NOT EXISTS dte_presite_history (
    id              BIGSERIAL PRIMARY KEY,
    tracking_id     BIGINT NOT NULL REFERENCES dte_presite_tracking(id) ON DELETE CASCADE,
    stage           VARCHAR(30),                       -- stage AFTER action
    action          VARCHAR(40) NOT NULL,              -- dt-done, report-done, check-pass, check-fail, submit-ace, tl-review, pm-review, ace-approve, undo-*
    actor_code      VARCHAR(120),
    actor_name      VARCHAR(200),
    notes           TEXT,
    at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dte_presite_history_tracking ON dte_presite_history (tracking_id, at DESC);
