-- Migration: add DT start time (separate from DT done)
ALTER TABLE dte_presite_tracking
    ADD COLUMN IF NOT EXISTS dt_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dt_started_by VARCHAR(120);
