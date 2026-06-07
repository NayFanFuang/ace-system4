# ACE System 4 — UI Kit Prompt For All Pages

ใช้ prompt นี้เมื่ออยากปรับทุกหน้าให้มีหน้าตาเดียวกัน โดยยึด UI kit ที่มีอยู่แล้วในโปรเจกต์:

- `frontend/src/ui/ds.css`
- `frontend/src/ui/index.jsx`
- `frontend/src/PlatformShell.jsx`
- `frontend/src/platformRoutes.js`

เป้าหมายคือให้ทุกหน้าเป็น ACE enterprise operations UI แบบเดียวกัน: สะอาด อ่านง่าย หนาแน่นพอดีสำหรับงานประจำวัน และไม่เปลี่ยน logic/API เดิม

---

## PROMPT

```
ปรับ UI ของหน้า <ชื่อไฟล์หรือชื่อ route> ให้เข้ากับ ACE System 4 UI Kit กลาง

บริบทสำคัญ:
- โปรเจกต์ใช้ React + Vite + Tailwind + lucide-react
- UI kit กลางอยู่ที่ frontend/src/ui/ds.css และ component helper อยู่ที่ frontend/src/ui/index.jsx
- shell กลางอยู่ที่ frontend/src/PlatformShell.jsx
- routing/navigation กลางอยู่ที่ frontend/src/platformRoutes.js
- ห้ามเปลี่ยน business logic, state, API call, permission, route, data mapping, export/import behavior

เป้าหมาย:
1. ทุก authenticated page ต้องใช้ visual language เดียวกัน:
   - พื้นหลังหน้า: #f5f7fb หรือ var(--ds-bg)
   - primary brand: #2447d8
   - primary hover: #1d3bb8
   - brand accent red: #c73b32 ใช้เป็น accent/gradient เท่านั้น ไม่ใช่ error
   - success: #16a34a
   - warning: #d97706
   - error: #dc2626
   - text หลัก: #0f172a
   - text รอง: #64748b
   - border: #e2e8f0
2. ใช้ shared shell ให้มากที่สุด:
   - ถ้าเป็นหน้าปกติ ให้ wrap ด้วย PlatformShell
   - active path ต้องตรงกับ route จริง
   - ไม่สร้าง sidebar/topbar ใหม่ถ้า PlatformShell ใช้ได้
   - ถ้าหน้านั้นมี sub-navigation ภายใน ให้ทำเป็น tabs/segmented controls ใน content area ไม่ใช่ sidebar ซ้อน sidebar
3. ใช้ class/component ของ ds-* แทน inline style ซ้ำ ๆ:
   - card: ds-card
   - button: ds-btn, ds-btn-primary, ds-btn-ghost, ds-btn-soft, ds-btn-icon
   - input/select/textarea: ds-field
   - table: ds-table
   - badge: ds-badge + semantic badge color
   - modal/drawer/toast/empty/loading ให้ใช้ pattern จาก ds.css
4. Layout มาตรฐานของแต่ละหน้า:
   - root content: flex column, gap 20-24px
   - page header: eyebrow optional, H1, short supporting text, action buttons ฝั่งขวา
   - metric cards: responsive grid
   - filters/toolbar: อยู่ใน ds-card หรือ compact toolbar, ไม่ลอยกระจัดกระจาย
   - data table/list/grid: ใช้ card/table shell เดียวกัน
   - drawer/modal: ใช้ ds-overlay/ds-drawer/ds-modal pattern
5. Typography:
   - page title: text-2xl ถึง text-3xl, font-black, tracking-normal
   - section title: text-sm ถึง text-base, font-black
   - body/table: 12-14px
   - ห้ามใช้ hero-scale typography ใน panel เล็ก
   - letter spacing ปกติ หลีกเลี่ยง tracking-wide ยกเว้น label uppercase ขนาดเล็ก
6. Shape/elevation:
   - card radius 8-14px ตาม ds token
   - หลีกเลี่ยง rounded-2xl/3xl จำนวนมากใน operational panels
   - resting card ใช้ shadow sm เท่านั้น
   - hover/dropdown ใช้ shadow md
   - modal/drawer ใช้ shadow lg
   - ห้ามใช้ shadow ใหญ่กับทุก card
7. Icons:
   - ใช้ lucide-react สำหรับปุ่ม/เมนู/action
   - ปุ่ม icon-only ต้องมี aria-label/title
   - หลีกเลี่ยง emoji เป็น icon ใน production UI ยกเว้นข้อมูล legacy ที่ตั้งใจให้เป็น text
8. Status semantics:
   - active/success/ready = green #16a34a
   - pending/probation/warning = amber #d97706
   - error/blocker/missing = red #dc2626
   - info/office/system = blue #2447d8 หรือ #0ea5e9
   - terminated/inactive/disabled = slate/gray
9. Responsive:
   - mobile ต้องไม่ overflow
   - table ใช้ overflow-x-auto และ min-width เฉพาะเมื่อจำเป็น
   - toolbar/filter wrap ได้
   - drawer width ใช้ min(92vw, <desktop width>)
10. Dark mode:
   - อย่า hardcode สีที่ทำให้ dark mode พังเมื่อใช้ ds class ได้
   - ถ้าต้อง hardcode ให้ใช้เฉพาะ semantic status/charts ที่ตั้งใจ

ขั้นตอนทำงาน:
1. อ่านไฟล์เป้าหมายและไฟล์ UI kit ที่เกี่ยวข้องก่อนแก้
2. ระบุว่า page ใช้ PlatformShell แล้วหรือยัง
3. ถ้ายังไม่ใช้ PlatformShell ให้ migrate shell ก่อน โดยคง content/logic เดิม
4. แทนที่ local duplicate sidebar/topbar/card/button/input/table style ด้วย ds-* pattern
5. Normalize สีและเงาตาม token ด้านบน
6. อย่า refactor logic/API เกินจำเป็น
7. รัน npm build หรือ verification ที่เหมาะสม
8. เปิด/ตรวจ route ที่แก้ แล้วรายงาน:
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยนด้าน UI
   - สิ่งที่ตั้งใจคงไว้
   - verification result

ข้อห้าม:
- ห้ามเปลี่ยน endpoint, request body, response mapping
- ห้ามเปลี่ยน permission/role checks
- ห้ามลบ feature ที่มีอยู่
- ห้ามสร้าง design system ใหม่ซ้อนกับ ds.css
- ห้ามทำ landing page หรือ hero marketing layout สำหรับ operational pages
- ห้ามใช้ gradient/orb/blob decoration เป็นพื้นหลังหลัก

เริ่มจากหน้า <route> แล้วทำให้เหมือน ACE UI Kit กลางที่สุด โดยแก้แบบ scoped และตรวจ build หลังเสร็จ
```

---

## Notes From `/hr/employees`

ตรวจวันที่ 2026-05-31 ที่ `http://localhost:5173/hr/employees`:

- route ตอบ `200`
- หน้า HR Employees มี shell/sidebar/header ของตัวเองใน `frontend/HREmployeePage.jsx`
- โปรเจกต์มี shared shell แล้วใน `frontend/src/PlatformShell.jsx`
- โปรเจกต์มี token และ component class กลางแล้วใน `frontend/src/ui/ds.css`
- งานปรับที่ควรทำต่อคือย้ายหน้า HR Employees และหน้าอื่น ๆ ไปใช้ shell + ds-* pattern เดียวกัน แทนการใช้ inline style/local sidebar ซ้ำ

