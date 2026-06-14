# Accounting (Payment Voucher) — Handoff & Integration Spec

> เอกสารส่งมอบสำหรับทีมพัฒนาภายนอก ที่จะต่อยอดงานบัญชีกลุ่มที่เหลือ
> (Vendor master, ใบ 50 ทวิ, GL/cost center, ปิดงวด, export journal)
>
> Status: **delivered** = ทำเสร็จแล้วใน repo · **planned** = ยังไม่ทำ (งานของทีมภายนอก)

---

## 1. ภาพรวม (Overview)

ระบบบัญชีนี้ต่อยอดจาก **Bill Reader** (OCR อ่านใบแจ้งหนี้/บิล) ที่มีอยู่เดิม

```
สแกนแจ้งหนี้ (PDF) ──OCR──► ตรวจ/แก้รายการ ──► Save to Accounting
        │                                              │
        └─► ดาวน์โหลด Excel PV (เดิม)                   ▼
                                          Payment Voucher (record จริงใน DB)
                                          DRAFT ──► APPROVED ──► PAID
                                                       │
                                          ┌────────────┼─────────────┐
                                          ▼            ▼             ▼
                                   Expense Actual   AP Aging     Audit log
                                   (Revenue&Expense) (อายุหนี้)   (ใคร/เมื่อ/IP)
```

**ขอบเขตที่ส่งมอบแล้ว (delivered):**
- บันทึกบิลที่สแกนเป็น Payment Voucher (ใบสำคัญจ่าย) ใน DB
- Workflow สถานะ DRAFT → APPROVED → PAID (+ revert) พร้อม role gate
- เลขเอกสาร running (`PV-YYYY-0001`) การันตี unique
- กันบิลซ้ำ (content hash)
- แยกยอด base / VAT (ภาษีซื้อ) / WHT / net ตามหลักบัญชี (ใช้ `Decimal` ทั้งหมด)
- Audit log ทุก action
- แนบไฟล์ PDF ต้นฉบับ (เก็บแบบ private + เสิร์ฟผ่าน auth)
- Pagination
- วันครบกำหนดจ่าย (due date) + รายงานอายุหนี้ (AP aging)
- Unit tests (pure + DB-backed)

---

## 2. สถาปัตยกรรม / ไฟล์ที่เกี่ยวข้อง

| Layer | ไฟล์ | หน้าที่ |
|---|---|---|
| Model | `app/models/payment_voucher.py` | ตาราง `payment_vouchers`, `payment_voucher_lines` |
| Service | `app/services/accounting.py` | business logic ทั้งหมด (สร้าง/สถานะ/aging/summary/hash) — **stateless, ทดสอบง่าย** |
| Service | `app/services/bill_profiles.py` | นิยามชนิดบิล (WHT rate, VAT, ฟอร์ม PV) — ขยายชนิดบิลที่นี่ |
| Service | `app/services/bill_reader.py` | OCR + สร้าง Excel PV (มี OCR deps หนัก) |
| Service | `app/services/audit_service.py` | `write_audit_log()` — ใช้ร่วมทั้งระบบ |
| Router | `app/routers/finance.py` | endpoints ทั้งหมดใต้ `/api/finance/*` |
| Migration | `migrations/20260614_payment_vouchers.sql` | DDL (idempotent) สำหรับ prod |
| Frontend | `frontend/AccountingPage.jsx` | หน้า PV Ledger (`/finance/accounting`) |
| Frontend | `frontend/BillReaderPage.jsx` | ปุ่ม "Save to Accounting" |
| Tests | `tests/test_accounting.py` | pure-logic + DB-backed (SQLite) |

**หลักการ:** business logic อยู่ใน `accounting.py` ทั้งหมด (router แค่ auth + validate + เรียก service)
การต่อยอดส่วนใหญ่จึงทำที่ `accounting.py` + เพิ่ม endpoint บาง ๆ ใน `finance.py`

---

## 3. Data Model

### 3.1 `payment_vouchers` (หัวเอกสาร)

| Column | Type | หมายเหตุ |
|---|---|---|
| `id` | int PK | |
| `doc_no` | varchar(30) **unique** | เลข running ระบบ `PV-YYYY-0001` (อย่าแก้ด้วยมือ) |
| `doc_year` | varchar(4) | ปีของ running number |
| `doc_seq` | int | ลำดับในปี (ใช้ออกเลขถัดไป) |
| `pv_no` | varchar(60) | เลขอ้างอิงจากฟอร์ม/ไฟล์ (อาจซ้ำ/ว่าง) |
| `item` | varchar(30) | เลข Item บนฟอร์ม |
| `pv_date` | varchar(30) | วันที่บนฟอร์ม รูปแบบ `DD-Mon-YYYY` (เก็บเป็น string ตามต้นฉบับ) |
| `period_month` | varchar(7) | `YYYY-MM` เดือนบัญชี (ใช้สรุป/ปิดงวด) |
| `bill_type` | varchar(30) | key จาก `bill_profiles` (telecom/electricity/...) |
| `vendor` | varchar(255) | **ชื่อผู้ขาย (text ลอย)** ← จุดต่อ Vendor master |
| `project` | varchar(255) | โครงการ/cost center (text) ← จุดต่อ cost center |
| `requester` | varchar(255) | ผู้ขอเบิก |
| `issued_by` | varchar(255) | ผู้จัดทำ |
| `status` | varchar(20) | `DRAFT` / `APPROVED` / `PAID` |
| `due_date` | date (null) | วันครบกำหนดจ่าย (ใช้ AP aging) |
| `content_hash` | varchar(64) | sha256 ของเนื้อหา (กันซ้ำ) |
| `amount_total` | **numeric(18,2)** | ยอดก่อน VAT = **ค่าใช้จ่ายจริง (P&L)** |
| `vat_total` | numeric(18,2) | VAT 7% = **ภาษีซื้อ (input tax)** ไม่ใช่ค่าใช้จ่าย |
| `wht_total` | numeric(18,2) | หัก ณ ที่จ่าย (หนี้สินรอนำส่งสรรพากร) |
| `net_total` | numeric(18,2) | ยอดจ่ายสุทธิ = amount + vat − wht (เงินสดออก) |
| `note` | text | |
| `source_filename` | varchar(255) | ชื่อไฟล์ตอนสแกน |
| `attachment_path` | varchar(255) null | path บนดิสก์ (private — ไม่อยู่ใต้ `/photos`) |
| `attachment_name` | varchar(255) | ชื่อไฟล์ต้นฉบับ |
| `created_by` / `created_at` | | ผู้สร้าง/เวลา |
| `approved_by` / `approved_at` | | ผู้อนุมัติ/เวลา |
| `paid_by` / `paid_at` | | ผู้จ่าย/เวลา |
| `payment_ref` | varchar(120) | เลขเช็ค/อ้างอิงการโอน |

### 3.2 `payment_voucher_lines` (บรรทัด)

| Column | Type | หมายเหตุ |
|---|---|---|
| `id` | int PK | |
| `voucher_id` | int FK → payment_vouchers (ON DELETE CASCADE) | |
| `seq` | int | ลำดับบรรทัด |
| `identifier` | varchar(60) | เบอร์/มิเตอร์/เลขสัญญา ← จุดต่อ GL/cost center ระดับบรรทัด |
| `period` | varchar(60) | รอบบิล |
| `description` | text | |
| `amount` / `vat` / `wht` / `net` | numeric(18,2) | |

> **กฎเงิน:** ทุกจำนวนเงินใช้ `Numeric(18,2)` / Python `Decimal` เท่านั้น **ห้ามใช้ float**
> helper อยู่ใน `accounting.py`: `D(x)` (→Decimal), `q2(x)` (ปัด 2 ตำแหน่งครึ่งปัดขึ้น)

---

## 4. API Contract

Base path: `/api/finance/accounting` · ทุก endpoint ต้องมี JWT (`Authorization: Bearer <token>`)

### Role gates
```python
FINANCE_ROLES = {SUPER_ADMIN, SYSTEM_ADMIN, PROJECT_ADMIN, HR_ADMIN, DIRECTOR, ACCOUNTING}  # อ่าน/สร้าง
APPROVE_ROLES = {SUPER_ADMIN, SYSTEM_ADMIN, DIRECTOR, ACCOUNTING}   # approve / revert
PAY_ROLES     = {SUPER_ADMIN, SYSTEM_ADMIN, ACCOUNTING}            # pay
```

| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/vouchers` | FINANCE | สร้าง voucher (DRAFT) จากรายการที่สแกน |
| GET | `/vouchers` | FINANCE | list + filter + pagination |
| GET | `/vouchers/{id}` | FINANCE | รายละเอียด + บรรทัด |
| POST | `/vouchers/{id}/transition` | ตาม action | เปลี่ยนสถานะ |
| POST | `/vouchers/{id}/due-date` | FINANCE | ตั้ง/แก้วันครบกำหนด |
| DELETE | `/vouchers/{id}` | FINANCE | ลบ (เฉพาะ DRAFT) |
| GET | `/vouchers/{id}/export` | FINANCE | ดาวน์โหลด Excel PV |
| POST | `/vouchers/{id}/attachment` | FINANCE | อัปโหลด PDF ต้นฉบับ (multipart) |
| GET | `/vouchers/{id}/attachment` | FINANCE | ดู PDF (ผ่าน auth) |
| GET | `/summary` | FINANCE | สรุปรายเดือน + ตามสถานะ |
| GET | `/aging` | FINANCE | รายงานอายุหนี้ |

### ตัวอย่าง request/response สำคัญ

**POST `/vouchers`**
```jsonc
// request
{
  "vendor": "AIS",
  "bill_type": "telecom",
  "filename": "PV-AIS-TF-04",
  "allow_duplicate": false,        // true = ยืนยันบันทึกแม้เจอบิลซ้ำ
  "header": { "pv_no": "TF-04/2026", "item": "43", "date": "14-Jun-2026",
              "project": "...", "name": "...", "issued": "...",
              "due_date": "2026-07-14" },   // optional, ไม่ใส่ = auto = pv_date + 30 วัน
  "lines": [ { "identifier": "0812345678", "period": "01/06/2026-30/06/2026",
               "amount": 100.00, "vat": 7.00, "desc": "..." } ]
}
// 200 → voucher object (ดู serialize()); 409 ถ้าซ้ำ:
{ "detail": { "code": "duplicate", "message": "...", "duplicate_doc_no": "PV-2026-0001", "duplicate_id": 1 } }
```

**POST `/vouchers/{id}/transition`**
```jsonc
{ "action": "approve" }                       // DRAFT → APPROVED
{ "action": "pay", "payment_ref": "CHQ-001" } // APPROVED → PAID
{ "action": "revert" }                        // APPROVED → DRAFT
// 409 ถ้าสถานะไม่ถูก, 403 ถ้าไม่มีสิทธิ์
```

**GET `/aging`** → buckets: `not_due / d1_30 / d31_60 / d61_90 / d90_plus / no_due_date`
```jsonc
{ "as_of": "2026-06-14",
  "buckets": [ { "key": "d1_30", "label": "เกิน 1–30 วัน", "count": 2, "amount": 1500.00 }, ... ],
  "total_outstanding": 5000.00, "overdue_amount": 1500.00 }
```

> รูปแบบ object ของ voucher ที่ส่งออก ดูได้จาก `accounting.serialize()` (มี `days_overdue`, `aging_bucket` คำนวณสด)

---

## 5. กฎทางบัญชีที่ฝังไว้ (ต้องรักษาไว้)

1. **Expense Actual = `amount_total` (ก่อน VAT)** — VAT เป็นภาษีซื้อขอคืนได้ ไม่นับเป็นค่าใช้จ่าย
2. **`net_total` = amount + vat − wht** = เงินสดที่จ่ายจริง
3. WHT คำนวณจาก `bill_profiles[bill_type].wht_rate` (telecom 3%, rental 5%, ฯลฯ)
4. Aging นับเฉพาะ **APPROVED + ยังไม่จ่าย** (PAID = ชำระแล้ว, DRAFT = ยังไม่เป็นหนี้)
5. `monthly_summary` นับเฉพาะ **APPROVED/PAID** เป็น actual (DRAFT ไม่นับ)

---

## 6. จุดต่อสำหรับงานกลุ่มที่เหลือ (Extension points — planned)

### 6.1 Vendor master + Tax ID
- เพิ่มตาราง `vendors` (id, name, tax_id 13 หลัก, address, default_wht_rate, ...)
- เพิ่มคอลัมน์ `vendor_id` (FK) บน `payment_vouchers` — คงคอลัมน์ `vendor` (text) ไว้เป็น snapshot/ fallback
- ตอน create: map vendor text → vendor_id (มี UI เลือก/สร้าง vendor)
- **เปลี่ยนน้อยที่สุด:** เพิ่ม field ใหม่ ไม่แก้ของเดิม

### 6.2 ใบรับรองหัก ณ ที่จ่าย (50 ทวิ / ภงด.3, 53)
- ต้องมี **Tax ID ของ vendor** (จาก 6.1) ก่อน
- generate จากข้อมูลที่มีแล้ว: `wht_total`, vendor, `pv_date`, ประเภทเงินได้
- เพิ่ม endpoint `GET /vouchers/{id}/wht-certificate` (คล้าย `/export`) คืน PDF/Excel
- ภงด.3 = บุคคลธรรมดา, ภงด.53 = นิติบุคคล → เก็บ `vendor.entity_type`

### 6.3 GL account / Cost center
- เพิ่มตาราง `gl_accounts` (chart of accounts)
- เพิ่ม `gl_account_code` ที่ `payment_voucher_lines` + `cost_center` (ใช้ `project` เดิมหรือแยก field)
- map ค่าเริ่มต้นจาก `bill_type` → GL account ได้ (เช่น telecom → 5xxx ค่าโทรศัพท์)

### 6.4 ปิดงวด (Period lock)
- เพิ่มตาราง `accounting_periods` (period_month, status OPEN/CLOSED, closed_by, closed_at)
- ก่อน create/transition/edit ให้เช็ค period ของ `period_month` ว่า OPEN
- ใส่ guard ใน `accounting.py` (จุดเดียว) — เพิ่ม `assert_period_open(db, period_month)`

### 6.5 Export journal เข้าโปรแกรมบัญชี
- อ่านจาก ledger ที่มีอยู่แล้ว (`list_vouchers` / query ตรง)
- สร้าง double-entry ต่อ voucher: Dr ค่าใช้จ่าย (GL) / Dr ภาษีซื้อ / Cr เจ้าหนี้ / Cr WHT ค้างจ่าย
- ออกไฟล์ตามรูปแบบโปรแกรมปลายทาง (Express/ERP) — endpoint `GET /accounting/journal/export?month=YYYY-MM`
- ต้องมี 6.3 (GL) ก่อนจึงจะ map บัญชีได้ครบ

**ลำดับแนะนำ:** 6.1 → 6.3 → (6.2, 6.4, 6.5 ขนานกันได้)

---

## 7. Developer guide (ทำงานกับ repo นี้)

### Local dev
```bash
docker compose up -d                       # postgres + backend + frontend
# frontend: แก้ไฟล์แล้วเห็นทันที (Vite HMR) ที่ http://localhost:5173
```

### Apply backend changes (backend ไม่มี host volume)
```bash
docker cp app/routers/finance.py ace-system-backend:/app/app/routers/finance.py
docker cp app/services/accounting.py ace-system-backend:/app/app/services/accounting.py
docker restart ace-system-backend
docker logs ace-system-backend             # ดู schema/seed error ตอน startup
```

### Database
```bash
docker exec ace-system-postgres psql -U ace_user -d ace_system -c "SELECT ..."
```
- **ไม่มี Alembic** — schema สร้างจาก models (`Base.metadata.create_all` ตอน startup)
- การเปลี่ยน schema กับ DB เดิมต้องเขียน SQL ใน `migrations/*.sql` แล้ว apply เอง:
  ```bash
  docker exec -i ace-system-postgres psql -U ace_user -d ace_system < migrations/xxx.sql
  ```
- ⚠️ `create_all` **ไม่แก้** ตารางที่มีอยู่แล้ว (ไม่เพิ่ม/เปลี่ยนคอลัมน์) — ต้องใช้ `ALTER` ใน migration

### Tests
```bash
pip install pytest pytest-asyncio aiosqlite      # ยังไม่มีใน image
pytest tests/test_accounting.py
```
- เทสต์แบ่ง 2 ชั้น: **pure-logic** (ไม่ต้องมี DB/OCR) + **DB-backed** (SQLite in-memory)
- เขียน business logic เป็น pure function เมื่อทำได้ (เช่น `validate_transition`, `aging_of`) เพื่อเทสต์ง่าย
- ยังไม่มี CI — ควรตั้ง GitHub Actions รัน pytest (ดู `.claude/skills/session-start-hook` ถ้าจะ setup)

### Conventions
- จำนวนเงิน = `Decimal`/`Numeric(18,2)` เท่านั้น
- business logic อยู่ใน service, router แค่ auth+validate
- ทุก mutation สำคัญ → `audit_service.write_audit_log(..., source="FINANCE")`
- คอมเมนต์/ข้อความผู้ใช้เป็นไทยได้ (ตาม codebase เดิม), identifier เป็นอังกฤษ
- serialize ทำใน service (`serialize()`), อย่าคืน ORM object ตรง ๆ

---

## 8. Security & operations

- **Auth:** JWT (`app/deps.py`), role gate ผ่าน `requireRole` / เช็ค `payload["role"]`
- **เอกสารแนบเป็นข้อมูลการเงิน** — เก็บที่ `/app/voucher_files` (volume แยก) **ไม่อยู่ใต้ `/photos`** ที่เป็น public static; ชื่อไฟล์สุ่ม uuid; เสิร์ฟผ่าน endpoint ที่ตรวจสิทธิ์เท่านั้น
- **Deploy:** ต้อง mount volume `./voucher_files:/app/voucher_files` (อยู่ใน `docker-compose*.yml` แล้ว) — เพิ่ม volume ใหม่ต้อง **recreate** container ไม่ใช่แค่ restart
- **Audit:** ดูได้จากตาราง `audit_logs` (entity_type=`payment_voucher`)

---

## 9. Known gaps / TODO (นอกเหนือกลุ่ม 🟡)

- ยังไม่มี CI (ตั้ง pytest ใน GitHub Actions)
- `vendor`/`project` เป็น text ลอย (รอ master data — 6.1/6.3)
- ยังไม่มี approval matrix ตามวงเงิน (ตอนนี้ approve ขั้นเดียว)
- การออกเลข `doc_no` กันชนด้วย unique + retry (พอสำหรับ volume ปัจจุบัน; ถ้าโหลดสูงพิจารณา DB sequence)
- attachment เก็บใน local volume (ถ้าต้องการ HA ควรย้ายไป object storage เช่น S3)

---

_อ้างอิงโค้ด: PR #3 (ระบบบัญชี core) + PR #4 (due date + AP aging)_
