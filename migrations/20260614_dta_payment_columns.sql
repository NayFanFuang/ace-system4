-- DTA payment status + frozen income snapshot (mirrors DTE payment columns).
-- DTA (drive-test analyst) is paid a fixed per-cluster rate on PAC work.
-- Apply manually: docker exec -i ace-system-postgres psql -U ace_user -d ace_system -f - < this.sql
ALTER TABLE dte_presite_tracking
    ADD COLUMN IF NOT EXISTS dta_paid_at        TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS dta_paid_by        VARCHAR(120),
    ADD COLUMN IF NOT EXISTS dta_payment_ref    VARCHAR(120),
    ADD COLUMN IF NOT EXISTS dta_paid_amount    NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS dta_paid_category  VARCHAR(40),
    ADD COLUMN IF NOT EXISTS dta_paid_site_count INTEGER;
