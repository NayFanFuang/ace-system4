-- DTA payment (cost/AP) on the cluster lifecycle. The cluster owner is paid a
-- fixed per-cluster rate once PAC Approved (current_phase >= 11). Frozen
-- snapshot locks the amount at mark-paid time. Distinct from billing (AR).
-- Apply: docker exec -i ace-system-postgres psql -U ace_user -d ace_system -f - < this.sql
ALTER TABLE dta_clusters
    ADD COLUMN IF NOT EXISTS dta_paid_at         TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS dta_paid_by         VARCHAR(120),
    ADD COLUMN IF NOT EXISTS dta_payment_ref     VARCHAR(120),
    ADD COLUMN IF NOT EXISTS dta_paid_amount     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS dta_paid_category   VARCHAR(40),
    ADD COLUMN IF NOT EXISTS dta_paid_site_count INTEGER;
