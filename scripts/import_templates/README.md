# CSV Import Templates

ไฟล์ตัวอย่างสำหรับ import ข้อมูลเก่าเข้า DB

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | ตาราง | จำนวน sample rows |
|---|---|---|
| `01_employees_sample.csv`      | `employees`       | 10 คน |
| `02_clock_sites_sample.csv`    | `clock_sites`     | 15 sites |
| `03_clock_sessions_sample.csv` | `clock_sessions`  | 30 sessions (3 วัน × 10 คน) |
| `import_csv.py`                | (script)          | importer ทั้ง 3 ตาราง |

## ลำดับการ import

ต้องทำตามนี้ — ไฟล์หลังต้องการข้อมูลจากไฟล์ก่อนหน้า:

1. **employees** ก่อน (เพราะ sessions อ้าง `employee_code`)
2. **clock_sites** (สำหรับ geofence — sessions อ้าง `site_code`)
3. **clock_sessions** (ข้อมูล clock-in/out จริง)

## วิธีรัน

### Dry-run (ตรวจสอบก่อน)

```bash
# Copy ไฟล์ทั้งโฟลเดอร์เข้า container
docker cp scripts/import_templates ace-system-backend:/app/scripts/

# Dry-run ก่อน — ไม่ commit
docker exec ace-system-backend python /app/scripts/import_templates/import_csv.py --dry-run /app/scripts/import_templates/
```

### Commit จริง

```bash
docker exec ace-system-backend python /app/scripts/import_templates/import_csv.py /app/scripts/import_templates/
```

### Import เฉพาะตารางเดียว

```bash
docker exec ace-system-backend python /app/scripts/import_templates/import_csv.py --only employees /app/scripts/import_templates/
docker exec ace-system-backend python /app/scripts/import_templates/import_csv.py --only sites     /app/scripts/import_templates/
docker exec ace-system-backend python /app/scripts/import_templates/import_csv.py --only sessions  /app/scripts/import_templates/
```

## พฤติกรรม

- **employees** & **clock_sites**: UPSERT (มีอยู่แล้ว → update, ไม่มี → insert)
- **clock_sessions**: INSERT only — ถ้า `(employee_code, work_date, clock_in_at)` ซ้ำ จะข้าม (กัน import ซ้ำ)

## ลบข้อมูล sample ทิ้ง

```sql
DELETE FROM clock_sessions WHERE employee_code LIKE 'ACE-IMP%';
DELETE FROM clock_sites    WHERE site_code LIKE 'SITE-IMP-%';
DELETE FROM employees      WHERE employee_code LIKE 'ACE-IMP%';
```

## ข้อมูลที่อยู่ในไฟล์ตัวอย่าง

### Employees (10 คน)
- 4 RF (3 DTE/DTA/OSS field + 1 Field)
- 3 TE (1 Lead + 2 Tech)
- 1 HR
- 1 Finance
- 1 AI

### Sites (15 sites พร้อม lat/lng + geofence radius)
- 4 Bangkok (BKK)
- 4 Chonburi (CBR — Pattaya/Jomtien/Sriracha/Bangsaen)
- 2 Rayong (RYG)
- 2 Chiang Mai (CMI)
- 2 Phuket (PKT)
- 1 ACE HQ Office (DAILY clock)

### Sessions (30 records — 3 วัน × 10 คน)
- 2026-05-15, 2026-05-16, 2026-05-17
- ผสม PER_SITE (field work) + DAILY (office)
- มี edge cases:
  - **Missing clock-out** (ACE-IMP002 วันที่ 16, ACE-IMP003 วันที่ 17, ACE-IMP010 วันที่ 16)
  - **Missing GPS** (ACE-IMP008 วันที่ 17 ที่ lat_in/lng_in ว่าง)
  - **Off-site** (ACE-IMP005 และ ACE-IMP006 วันที่ 17 พิกัด clock-in ห่างจาก site)

ทดสอบทุก panel:
- **Map Live**: เห็น pin หลายสีกระจายทั้งประเทศ + วงกลม geofence
- **Admin Attention**: เจอ incomplete sessions เมื่อวาน
- **Today Executive**: 10 คน clock-in วันนี้
- **Monthly/Individual**: ข้อมูล 3 วัน
