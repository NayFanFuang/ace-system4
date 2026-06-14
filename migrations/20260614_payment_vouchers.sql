-- Accounting ledger: บันทึกบิลที่ scan แล้วเข้าระบบบัญชี (Payment Voucher)
-- สถานะ: DRAFT (ร่าง) -> APPROVED (อนุมัติ) -> PAID (จ่ายแล้ว)
-- หมายเหตุ: backend สร้างตารางจาก models (Base.metadata.create_all) อยู่แล้ว
-- ไฟล์นี้ไว้ apply กับ prod ที่ schema ไม่ถูก recreate อัตโนมัติ

CREATE TABLE IF NOT EXISTS payment_vouchers (
    id              SERIAL PRIMARY KEY,
    pv_no           VARCHAR(60)   NOT NULL DEFAULT '',
    item            VARCHAR(30)   NOT NULL DEFAULT '',
    pv_date         VARCHAR(30)   NOT NULL DEFAULT '',
    period_month    VARCHAR(7)    NOT NULL DEFAULT '',
    bill_type       VARCHAR(30)   NOT NULL DEFAULT '',
    vendor          VARCHAR(255)  NOT NULL DEFAULT '',
    project         VARCHAR(255)  NOT NULL DEFAULT '',
    requester       VARCHAR(255)  NOT NULL DEFAULT '',
    issued_by       VARCHAR(255)  NOT NULL DEFAULT '',
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    amount_total    DOUBLE PRECISION NOT NULL DEFAULT 0,
    vat_total       DOUBLE PRECISION NOT NULL DEFAULT 0,
    wht_total       DOUBLE PRECISION NOT NULL DEFAULT 0,
    net_total       DOUBLE PRECISION NOT NULL DEFAULT 0,
    note            TEXT          NOT NULL DEFAULT '',
    source_filename VARCHAR(255)  NOT NULL DEFAULT '',
    created_by      VARCHAR(30)   NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    approved_by     VARCHAR(30),
    approved_at     TIMESTAMPTZ,
    paid_by         VARCHAR(30),
    paid_at         TIMESTAMPTZ,
    payment_ref     VARCHAR(120)  NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_payment_vouchers_pv_no        ON payment_vouchers (pv_no);
CREATE INDEX IF NOT EXISTS ix_payment_vouchers_period_month ON payment_vouchers (period_month);
CREATE INDEX IF NOT EXISTS ix_payment_vouchers_bill_type    ON payment_vouchers (bill_type);
CREATE INDEX IF NOT EXISTS ix_payment_vouchers_status       ON payment_vouchers (status);
CREATE INDEX IF NOT EXISTS ix_payment_vouchers_created_by   ON payment_vouchers (created_by);

CREATE TABLE IF NOT EXISTS payment_voucher_lines (
    id          SERIAL PRIMARY KEY,
    voucher_id  INTEGER NOT NULL REFERENCES payment_vouchers(id) ON DELETE CASCADE,
    seq         INTEGER NOT NULL DEFAULT 0,
    identifier  VARCHAR(60)  NOT NULL DEFAULT '',
    period      VARCHAR(60)  NOT NULL DEFAULT '',
    description TEXT         NOT NULL DEFAULT '',
    amount      DOUBLE PRECISION NOT NULL DEFAULT 0,
    vat         DOUBLE PRECISION NOT NULL DEFAULT 0,
    wht         DOUBLE PRECISION NOT NULL DEFAULT 0,
    net         DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_payment_voucher_lines_voucher_id ON payment_voucher_lines (voucher_id);
