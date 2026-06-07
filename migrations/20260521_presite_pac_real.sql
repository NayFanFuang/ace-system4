-- PAC migration: add late-stage timestamps + DTA columns + sessions table

-- ── 1. ALTER dte_presite_tracking ────────────────────────────────────────
ALTER TABLE dte_presite_tracking
    ADD COLUMN IF NOT EXISTS pa_open_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pa_open_by         VARCHAR(120),
    ADD COLUMN IF NOT EXISTS pa_closed_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pa_closed_by       VARCHAR(120),
    ADD COLUMN IF NOT EXISTS report_submit_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS report_submit_by   VARCHAR(120),
    ADD COLUMN IF NOT EXISTS report_approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS report_approved_by VARCHAR(120);

-- (dta_code, dta_name already added by earlier migration)

-- ── 2. PAC Sessions (5 rounds per tracking) ──────────────────────────────
CREATE TABLE IF NOT EXISTS dte_presite_sessions (
    id              BIGSERIAL PRIMARY KEY,
    tracking_id     BIGINT NOT NULL REFERENCES dte_presite_tracking(id) ON DELETE CASCADE,
    round_number    INT NOT NULL,                              -- 1..5
    started_at      TIMESTAMPTZ,
    started_by      VARCHAR(120),
    ended_at        TIMESTAMPTZ,
    ended_by        VARCHAR(120),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- PENDING | IN_PROGRESS | DONE | SKIP
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tracking_id, round_number)
);
CREATE INDEX IF NOT EXISTS ix_dte_presite_sessions_tracking ON dte_presite_sessions (tracking_id, round_number);
