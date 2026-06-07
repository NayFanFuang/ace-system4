# ACE — Style Normalization Prompt (แบบ B)

ไฟล์นี้คือ prompt มาตรฐาน สำหรับทำให้ทุกหน้า (`frontend/*.jsx`) ใช้ สี + รูปแบบเดียวกัน
โดย คงเมนู / layout / โครงสร้างเดิมไว้ทั้งหมด — เปลี่ยนแค่ "ค่าที่เพี้ยน" ให้ตรงมาตรฐาน

วิธีใช้: copy ส่วน "PROMPT" ด้านล่าง วางใส่แชต แล้วระบุชื่อไฟล์ที่จะทำ

---

## Canonical Palette (ยึดจากโลโก้จริง — ห้ามเปลี่ยน)

| token | hex | ใช้กับ |
|---|---|---|
| brand | `#2447d8` | น้ำเงินหลัก — ปุ่ม primary, link, active |
| brand-dark | `#1d3bb8` | hover ของ brand |
| brand-50 | `#eef2ff` | พื้นอ่อน (chip/active bg) |
| accent | `#c73b32` | แดง brand — gradient, จุดเน้น (ไม่ใช่ error) |
| success | `#16a34a` | สำเร็จ/on-site (พื้น) — text เข้ม `#15803d` |
| warning | `#d97706` | เตือน/pending |
| error | `#dc2626` | error เท่านั้น |
| ink | `#0f172a` | ตัวอักษรหลัก |
| muted | `#64748b` | ตัวอักษรรอง |
| line | `#e2e8f0` | เส้นขอบทั้งหมด |
| app-bg | `#f5f7fb` | พื้นหลังหน้า/แอป |

Gradient brand: `linear-gradient(135deg, #2447d8 0%, #c73b32 100%)`

---

## กฎ normalize (find -> replace ในไฟล์)

น้ำเงินหลักที่เพี้ยน -> `#2447d8`
- `#1d4ed8` -> `#2447d8`
- `#2563eb` -> `#2447d8`
- `#1e40af` -> `#2447d8`  (เฉพาะตอนเป็นน้ำเงินหลัก ไม่ใช่เฉดเข้มในกราฟ)
- `#3b82f6` -> `#2447d8`  (ถ้าเป็น accent หลัก; ถ้าเป็นสีในกราฟที่ตั้งใจให้อ่อน คงไว้)

พื้นหลังหน้า -> `#f5f7fb`
- `#f8fafc` -> `#f5f7fb`

เส้นขอบ -> `#e2e8f0`
- `#e4e7ec` -> `#e2e8f0`
- `#e5e7eb` -> `#e2e8f0`
- `#eaecf0` -> `#e2e8f0`
- `#d0d5dd` -> `#e2e8f0`

สีสถานะ (status) ให้ตรง semantic
- เขียว (พื้น/ไอคอน): `#22c55e`, `#047857` -> `#16a34a` ; text เข้มบน badge เขียวคง `#15803d`
- แดง error คง `#dc2626` (ห้ามแตะ)
- on-site/success = เขียว #16a34a · off-site/error = แดง #dc2626 · pending/leave = ส้ม #d97706 · office = น้ำเงิน #2447d8

Tailwind blue ที่เป็น accent หลัก (ถ้ามี)
- `bg-blue-600` / `bg-blue-700` -> `bg-[#2447d8]` (hover `bg-[#1d3bb8]`)
- `text-blue-700` (link/active) -> `text-[#2447d8]`
- `border-blue-500` -> `border-[#2447d8]`
- `bg-blue-50` (พื้นจาง active) — คงไว้ได้

---

## Elevation scale (เงา)

| ระดับ | ค่า | ใช้กับ |
|---|---|---|
| sm | `0 1px 2px rgba(15,23,42,.06)` | resting — card, input |
| md | `0 10px 28px -10px rgba(15,23,42,.18)` | raised — hover, dropdown, toast |
| lg | `0 24px 60px -16px rgba(15,23,42,.30)` | overlay — modal, drawer |

กฎ normalize เงา
- `shadow-2xl` / `shadow-3xl` -> `shadow-lg`
- `shadow-sm` / `shadow-md` คงไว้
- `shadow-lg` ใช้เฉพาะ modal/drawer/overlay
- inline `boxShadow` / `shadow-[...]` ที่เพี้ยน -> ใช้ค่า scale ใกล้สุด (sm/md/lg)

---

## ห้ามแตะเด็ดขาด

- เมนู / sidebar / header / layout / โครงสร้าง JSX — คงเดิม 100%
- ฟังก์ชัน / state / API / ตรรกะ
- `#dc2626` และเฉดแดง error อื่น (`#b91c1c`, `#b42318`)
- Gray scale อื่น (`#f1f5f9`, `#64748b`, `#94a3b8`, slate-*)
- สีในกราฟที่เป็นชุด categorical
- radius (`rounded-*`), typography, spacing — ไม่อยู่ในขอบเขตแบบ B

---

## ขั้นตอนการทำ (ต่อ 1 ไฟล์)

1. grep หาค่าที่ต้อง normalize ในไฟล์ (ดูจำนวน + บริบท)
2. แก้ทีละค่า ด้วย replace_all เฉพาะค่าที่ชัดเจน
3. verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/<File>.jsx` ต้องได้ 200
4. รายงานว่าเปลี่ยนอะไรกี่จุด + อะไรคงไว้และทำไม
5. ทำทีละไฟล์ ให้ผู้ใช้ดูก่อน

---

## PROMPT (copy ส่วนนี้ไปใช้)

```
normalize สีของไฟล์ <ชื่อไฟล์>.jsx ตาม design-mocks/STYLE_PROMPT.md
คงเมนู/layout/ฟังก์ชันเดิม 100% เปลี่ยนแค่ค่าที่เพี้ยน:

สี:
- น้ำเงินหลัก #1d4ed8 / #2563eb / #1e40af / #3b82f6(เมื่อเป็น accent หลัก) -> #2447d8
- พื้นหลังหน้า #f8fafc -> #f5f7fb
- เส้นขอบ #e4e7ec / #e5e7eb / #eaecf0 / #d0d5dd -> #e2e8f0
- เขียว status #22c55e / #047857 -> #16a34a
- Tailwind: bg-blue-600/700 -> bg-[#2447d8], text-blue-700 -> text-[#2447d8], border-blue-500 -> border-[#2447d8]

เงา:
- shadow-2xl/3xl -> shadow-lg
- inline boxShadow ที่เพี้ยน -> sm 0 1px 2px /.06 | md 0 10px 28px -10px /.18 | lg 0 24px 60px -16px /.30

ห้ามแตะ: เมนู/layout/โครงสร้าง, ฟังก์ชัน, error red #dc2626, gray อื่น (#f1f5f9, slate-*),
bg-blue-50, สีในกราฟ, radius, typography, spacing

verify curl ได้ 200 แล้วรายงานว่าเปลี่ยนกี่จุด
```

---

## สถานะหน้า (อัปเดตเมื่อทำเสร็จ)

| หน้า | ไฟล์ | normalize |
|---|---|---|
| Revenue & Expense | RevenueExpensePage.jsx | done (น้ำเงิน+พื้นหลัง) |
| Clock Monitor | ClockMonitorPage.jsx | - |
| HR Employees | HREmployeePage.jsx | - |
| Project Management | ProjectPage.jsx | - |
| RF Monitor | RFMonitorPage.jsx | - |
| Pre-Site Monitor | PreSiteMonitorPage.jsx | - |
| PO Import | HWPOImportPage.jsx | - |
| Leave Approval | LeaveApprovalPage.jsx | - |
| Clock App | ClockApp.jsx | - |
| KPI | KPIPage.jsx | - |
| Executive Dashboard | ExecutiveDashboard.jsx | - |
