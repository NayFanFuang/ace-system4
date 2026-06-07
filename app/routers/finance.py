"""
Finance router — Bill Reader (ระบบอ่านบิล)

Stateless endpoints:
  POST /api/finance/bill-reader/extract  อัปโหลด PDF บิล -> JSON (lines + header)
  POST /api/finance/bill-reader/export   ส่งข้อมูล (แก้แล้ว) -> ดาวน์โหลด Excel PV.03

OCR ทำงานในคอนเทนเนอร์ (Tesseract tha+eng) ไม่มีค่า API และไม่เก็บลง DB
"""

from __future__ import annotations

import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import requireRole
from app.services import bill_reader, bill_memory

router = APIRouter(prefix="/api/finance", tags=["Finance"])

# กลุ่มสิทธิ์ Finance (ตรงกับ ROLES.FINANCE ฝั่ง frontend)
FINANCE_ROLES = {
    "SUPER_ADMIN", "SYSTEM_ADMIN", "PROJECT_ADMIN",
    "HR_ADMIN", "DIRECTOR", "ACCOUNTING",
}
require_finance_user = requireRole(FINANCE_ROLES)

MAX_PDF_MB = 25


class BillLineIn(BaseModel):
    identifier: str = ""
    phone: str = ""            # เผื่อ frontend เดิมส่ง phone
    period: str = ""
    amount: float = 0.0
    vat: float = 0.0
    vendor: str = ""
    desc: str = ""
    ocr: dict = Field(default_factory=dict)   # ค่าที่ OCR เดามาตอนแรก (เก็บไว้เทรน)


class ExportRequest(BaseModel):
    lines: list[BillLineIn] = Field(default_factory=list)
    header: dict = Field(default_factory=dict)
    vendor: str = ""
    bill_type: str = ""
    filename: str = "PV"


@router.get("/bill-reader/profiles")
async def bill_reader_profiles(payload: dict = Depends(require_finance_user)):
    """รายการชนิดบิลทั้งหมด สำหรับ dropdown"""
    return {"profiles": bill_reader.bill_profiles.public_list()}


@router.get("/bill-reader/stats")
async def bill_reader_stats(
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """สถิติการเรียนรู้ (จำนวน correction ที่เก็บไว้)"""
    return await bill_memory.stats(db)


@router.post("/bill-reader/extract")
async def bill_reader_extract(
    file: UploadFile = File(...),
    bill_type: str = Form(""),
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """อ่านบิล PDF (สแกน) ด้วย OCR -> รายการ + หัวกระดาษ. bill_type ว่าง = auto-detect"""
    name = file.filename or ""
    if not name.lower().endswith(".pdf"):
        raise HTTPException(400, "ต้องเป็นไฟล์ PDF เท่านั้น")
    content = await file.read()
    if not content:
        raise HTTPException(400, "ไฟล์ว่าง")
    if len(content) > MAX_PDF_MB * 1024 * 1024:
        raise HTTPException(400, f"ไฟล์ใหญ่เกิน {MAX_PDF_MB} MB")
    try:
        result = bill_reader.extract_bill(content, name, bill_type or None)
    except Exception as e:  # OCR/parse error
        raise HTTPException(422, f"อ่านบิลไม่สำเร็จ: {e}")
    if not result["lines"]:
        raise HTTPException(422, "อ่านไม่พบรายการในบิล — ตรวจสอบว่าเป็นบิลค่าโทรศัพท์ที่สแกนชัดเจน")
    # Level 1 learning: เติมค่าที่เคยแก้ไว้ให้บรรทัดที่ identifier ตรงกัน
    try:
        result["lines"], result["learned_count"] = await bill_memory.enrich(
            db, result["lines"], result["bill_type"])
    except Exception:
        result["learned_count"] = 0  # ไม่ให้ระบบล่มเพราะ memory
    return result


@router.post("/bill-reader/export")
async def bill_reader_export(
    body: ExportRequest,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """กรอกข้อมูล (ที่ผู้ใช้ตรวจ/แก้แล้ว) ลงฟอร์ม PV -> ดาวน์โหลด .xlsx + เก็บ correction ไว้เรียนรู้"""
    lines = [l.model_dump() for l in body.lines]
    if not lines:
        raise HTTPException(400, "ไม่มีรายการสำหรับสร้าง PV")
    try:
        xls = bill_reader.build_pv_excel(lines, body.header or {}, body.vendor,
                                         body.bill_type or None)
    except Exception as e:
        raise HTTPException(500, f"สร้าง PV ไม่สำเร็จ: {e}")
    # Level 1 learning: เก็บค่าที่ผู้ใช้ยืนยันแล้ว (truth) ไว้ใช้ครั้งหน้า + เป็น dataset
    try:
        await bill_memory.save_corrections(
            db, lines=lines, vendor=body.vendor, bill_type=body.bill_type or "",
            filename=body.filename or "",
            created_by=payload.get("employee_code") or payload.get("sub") or "")
    except Exception:
        pass  # การเก็บเรียนรู้ล้มเหลว ไม่ควรทำให้ดาวน์โหลดล้ม
    safe = (body.filename or "PV").replace("/", "-").replace("\\", "-")
    return StreamingResponse(
        io.BytesIO(xls),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{safe}.xlsx"'},
    )
