# ACE System - Presentation Summary

วันที่อัปเดต: 2026-06-05  
ผู้จัดทำ/ติดต่อ: Peerapol Pianmsri

## 1. Executive Summary

ACE System เป็นระบบกลางสำหรับบริหารงานพนักงาน งานภาคสนาม และงานโครงการ ตั้งแต่การ Login, Clock In/Out, Leave Request, Daily Work Log, KPI, Pre-Site Monitor, Report Upload ไปจนถึง DTE Payments

เป้าหมายหลักของระบบคือทำให้ข้อมูลจากพนักงาน, PM, HR, Project และ Finance เชื่อมต่อกันใน workflow เดียว ลดงาน manual, ลดการตามข้อมูลหลายช่องทาง และทำให้ตรวจสอบย้อนหลังได้จากระบบ

## 2. ระบบตอนนี้ทำอะไรได้บ้าง

### My Workspace

- Login / Logout และจัดสิทธิ์ตาม role
- My Profile สำหรับข้อมูลพนักงาน
- Clock App สำหรับ DAILY และ PER_SITE
- My Tasks / Approvals สำหรับงานอนุมัติ
- Notifications เตรียมรองรับการแจ้งเตือน

### Clock App

- Clock In / Clock Out แบบ DAILY สำหรับพนักงานทั่วไป
- Clock PER_SITE สำหรับ DTE ที่ต้องทำงานรายไซต์
- รองรับ GPS, selfie, geofence และประวัติการทำงาน
- Clock Monitor สำหรับผู้ดูแลดู attendance, compliance, map, movement และ summary
- Live Wallboard สำหรับดูสถานะหน้างานแบบ realtime

### Leave

- พนักงานส่ง Leave Request ผ่าน ClockApp
- รองรับ Sick Leave, Personal Leave, Annual Leave และ Other Leave
- มีสถานะ Approve / Reject / Acknowledge
- Email workflow ส่งให้ผู้เกี่ยวข้องตามเส้นทางอนุมัติ

### Worklog / KPI

- Daily Work Log สำหรับบันทึกงานรายวัน
- KPI Evaluation สำหรับผู้ประเมิน
- My KPI / Self-Assessment สำหรับพนักงานประเมินตัวเอง
- KPI Access Control สำหรับจัดสิทธิ์การเข้าถึง KPI

### HR

- HR Employees สำหรับดูและจัดการข้อมูลพนักงาน
- Create Login / Send Welcome Email
- Password Reset Required หลังส่ง Welcome Email
- HR Data Quality สำหรับตรวจคุณภาพข้อมูล
- User Management และ Role Management สำหรับ Admin / HR

### Project / DTE Workflow

- RF Monitor สำหรับติดตามงานโครงการ RF
- Pre-Site Monitor (DTE) สำหรับดูสถานะไซต์, SSV/PAC, DT Plan, DT Done, Report Done, Check Pass/Fail และ SLA
- Pre-Site Monitor (DTA) สำหรับ workflow ฝั่ง DTA
- Report Upload (DTE) สำหรับอัปโหลดรายงาน `.rar`
- Workflow DTE Per-Site เชื่อม ClockApp → Pre-Site → Report → Approval → Payment

### Finance

- นำเข้า PO จาก HW Excel
- Revenue & Expense
- DTE Payments สำหรับดูยอด Ready to Pay, Export Excel / voucher และ Mark Paid
- Bill Reader → PV สำหรับงานอ่านบิลและเตรียม payment voucher

### Admin / Monitoring

- System Monitor สำหรับดูสถานะระบบ
- Audit Logs เตรียมรองรับการตรวจย้อนหลัง
- Email Flow & Approval สำหรับตรวจเส้นทางอีเมลและ approval
- Integration / API Monitor เตรียมรองรับการตรวจ integration

## 3. Workflow ที่ควรนำเสนอ

### Workflow พนักงานทั่วไป

Login → Clock In DAILY → ทำงานประจำวัน → Clock Out → ตรวจประวัติ → ส่ง Leave หรือ Worklog เมื่อจำเป็น

จุดขาย:
- ลดการลงเวลาแบบ manual
- มี GPS / selfie / history
- ตรวจย้อนหลังได้

### Workflow DTE Per-Site

PM Assign Site → DTE เห็นไซต์ใน ClockApp → Start Site → End Site COMPLETE → Upload Report → Pre-Site Check Pass → Ready to Pay → DTE Paid

จุดขาย:
- งานไซต์เชื่อมกับเวลาทำงานจริง
- สถานะเลื่อนอัตโนมัติจาก ClockApp
- Report และ Payment trace กลับไปที่ไซต์ได้

### Workflow Leave

Employee Submit Leave → Email แจ้งผู้เกี่ยวข้อง → PM/PD/HR/Boss Approve / Reject / Acknowledge → ระบบเก็บประวัติ

จุดขาย:
- ลดการขอลาผ่านแชท
- รู้สถานะคำขอ
- มี workflow และหลักฐานในระบบ

### Workflow Finance / Payment

Import PO → Project / PM วางแผน DTE → DTE ทำงานและส่ง report → งานผ่าน Check Pass → Finance ดู Ready to Pay → Export evidence → Mark Paid

จุดขาย:
- ลดการคำนวณยอดจ่ายเอง
- Finance เห็นเฉพาะงานที่พร้อมจ่าย
- มี Payment Ref สำหรับตรวจย้อนหลัง

## 4. จุดที่ควร Demo

1. Login และหน้าเมนูตามสิทธิ์
2. Clock App DAILY
3. Clock App PER_SITE เลือกไซต์และ Start / End Site
4. Pre-Site Monitor ดู SSV/PAC, stage, SLA, rework
5. Report Upload และสถานะ Report Done
6. DTE Payments ดู Ready to Pay และ Mark Paid
7. Leave Request และ approval workflow
8. Worklog / KPI สำหรับภาพรวม performance
9. HR Employees ส่ง Welcome Email และเปลี่ยน password
10. Clock Monitor / Wallboard สำหรับผู้บริหารดูภาพรวม

## 5. ประโยชน์ต่อแต่ละฝ่าย

### Employee / DTE

- ใช้งานผ่านระบบเดียว
- เห็นงานที่ต้องทำและสถานะของตัวเอง
- มีหลักฐาน Clock, Report, Leave และ Payment

### PM / Project

- เห็นงานไซต์แบบ pipeline
- ตรวจ SLA, Rework, Check Pass/Fail ได้เร็ว
- ลดการตามสถานะจากหลายแหล่ง

### HR

- จัดการพนักงานและ Login ได้เป็นระบบ
- ตรวจข้อมูลพนักงานและสิทธิ์ได้ชัดเจน
- รองรับ Leave workflow

### Finance

- เห็นงานที่พร้อมจ่าย
- Export evidence ได้
- Mark Paid พร้อม Payment Ref เพื่อตรวจย้อนหลัง

### Management

- เห็นภาพรวม attendance, field work, project status, KPI และ payment status
- ใช้ข้อมูลจริงจาก workflow ไม่ใช่รายงาน manual

## 6. ข้อเสนอแนะสำหรับพรีเซน

### โครงสไลด์ที่แนะนำ

1. Problem: เดิมข้อมูลกระจายหลายช่องทาง
2. Solution: ACE System เป็น workflow กลาง
3. System Modules: Clock, Leave, HR, Project, KPI, Finance
4. Employee Workflow: Login → Clock → Leave → Worklog
5. DTE Per-Site Workflow: Assign → Clock → Report → Approval → Payment
6. Pre-Site Monitor: ดู stage, SLA, rework, report
7. Finance Payment: Ready to Pay → Export → Mark Paid
8. Management View: Monitor / Dashboard / Audit
9. Benefits: ลด manual, trace ได้, realtime มากขึ้น
10. Next Step: rollout, training, data cleanup, automation

### Key Message ที่ควรย้ำ

ระบบไม่ได้เป็นแค่ Clock App แต่เป็น workflow platform ที่เชื่อมคน, งานไซต์, รายงาน, การอนุมัติ และการจ่ายเงินเข้าด้วยกัน

## 7. ข้อแนะนำต่อยอด

### ระยะสั้น

- ทำคู่มือ onboarding สำหรับแต่ละ role: Employee, DTE, PM, HR, Finance
- เพิ่มหน้า Help / SOP ให้รวมคู่มือทั้งหมด
- ทำ checklist rollout ก่อนให้ทีมใช้งานจริง
- เก็บ feedback จาก DTE และ PM หลังใช้งาน 1-2 สัปดาห์

### ระยะกลาง

- เพิ่ม notification เมื่อไซต์ถูก assign, report ถูก reject, payment ถูก mark paid
- ทำ dashboard สรุป DTE productivity และ SLA
- เพิ่ม audit log ให้ครอบคลุม action สำคัญทั้งหมด
- เพิ่ม export รายงานสำหรับผู้บริหาร

### ระยะยาว

- เชื่อมระบบกับ payroll / accounting
- เชื่อม email / LINE notification ให้ครบ workflow
- ทำ executive dashboard รวม HR, Project, Clock, Finance
- เพิ่ม mobile-first UX สำหรับ DTE ภาคสนาม

## 8. One-Sentence Pitch

ACE System คือระบบกลางที่เชื่อมงานพนักงานและงานโครงการ ตั้งแต่ Clock, Leave, Worklog, Pre-Site, Report, Approval จนถึง Payment เพื่อให้ทุกฝ่ายทำงานจากข้อมูลเดียวกัน ตรวจสอบได้ และลดงาน manual.

