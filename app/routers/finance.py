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
from app.services import accounting, bill_reader, bill_memory

router = APIRouter(prefix="/api/finance", tags=["Finance"])

# กลุ่มสิทธิ์ Finance (ตรงกับ ROLES.FINANCE ฝั่ง frontend)
FINANCE_ROLES = {
    "SUPER_ADMIN", "SYSTEM_ADMIN", "PROJECT_ADMIN",
    "HR_ADMIN", "DIRECTOR", "ACCOUNTING",
}
require_finance_user = requireRole(FINANCE_ROLES)

# สิทธิ์เปลี่ยนสถานะใบสำคัญจ่าย: อนุมัติ = ผู้บริหาร/บัญชี, จ่าย = บัญชีเท่านั้น
APPROVE_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "DIRECTOR", "ACCOUNTING"}
PAY_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "ACCOUNTING"}
_ACTION_ROLES = {"approve": APPROVE_ROLES, "pay": PAY_ROLES, "revert": APPROVE_ROLES}

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


# ---------------------------------------------------------------------------
# Accounting — บันทึกบิลที่ scan แล้วเข้าระบบบัญชี (Payment Voucher ledger)
#   DRAFT (ร่าง) → APPROVED (อนุมัติ) → PAID (จ่ายแล้ว)
# ---------------------------------------------------------------------------

class VoucherCreate(BaseModel):
    lines: list[BillLineIn] = Field(default_factory=list)
    header: dict = Field(default_factory=dict)
    vendor: str = ""
    bill_type: str = ""
    filename: str = ""


class VoucherTransition(BaseModel):
    action: str                       # approve | pay | revert
    payment_ref: str = ""


def _actor(payload: dict) -> str:
    return payload.get("employee_code") or payload.get("sub") or ""


@router.post("/accounting/vouchers")
async def create_voucher(
    body: VoucherCreate,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """บันทึกรายการบิล (ที่ตรวจ/แก้แล้ว) เข้าระบบบัญชีเป็นใบสำคัญจ่ายสถานะ DRAFT"""
    lines = [l.model_dump() for l in body.lines]
    if not lines:
        raise HTTPException(400, "ไม่มีรายการสำหรับบันทึกเข้าระบบบัญชี")
    pv = await accounting.create_voucher(
        db, lines=lines, header=body.header or {}, vendor=body.vendor,
        bill_type=body.bill_type or "", filename=body.filename or "",
        created_by=_actor(payload))
    # เก็บ correction ไว้เรียนรู้ด้วย (เหมือนตอน export) — ไม่ให้ล้มถ้าพลาด
    try:
        await bill_memory.save_corrections(
            db, lines=lines, vendor=body.vendor, bill_type=body.bill_type or "",
            filename=body.filename or "", created_by=_actor(payload))
    except Exception:
        pass
    return accounting.serialize(pv, with_lines=True)


@router.get("/accounting/vouchers")
async def list_vouchers(
    status: str = "", month: str = "", bill_type: str = "", q: str = "",
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """รายการใบสำคัญจ่าย (กรองตามสถานะ/เดือน/ชนิดบิล/คำค้น)"""
    return {"vouchers": await accounting.list_vouchers(
        db, status=status, month=month, bill_type=bill_type, q=q)}


@router.get("/accounting/summary")
async def accounting_summary(
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """สรุปค่าใช้จ่ายจริงรายเดือน + จำนวนตามสถานะ (ป้อนหน้า Revenue & Expense)"""
    return await accounting.monthly_summary(db)


@router.get("/accounting/vouchers/{voucher_id}")
async def get_voucher(
    voucher_id: int,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    return accounting.serialize(pv, with_lines=True)


@router.post("/accounting/vouchers/{voucher_id}/transition")
async def transition_voucher(
    voucher_id: int,
    body: VoucherTransition,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """เปลี่ยนสถานะใบสำคัญจ่าย: approve (อนุมัติ) / pay (จ่าย) / revert (ดึงกลับ)"""
    allowed = _ACTION_ROLES.get(body.action)
    if allowed is None:
        raise HTTPException(400, f"ไม่รู้จักการกระทำ '{body.action}'")
    if payload.get("role") not in allowed:
        raise HTTPException(403, "ไม่มีสิทธิ์เปลี่ยนสถานะนี้")
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    try:
        pv = await accounting.transition(
            db, pv, action=body.action, actor=_actor(payload),
            payment_ref=body.payment_ref or "")
    except ValueError as e:
        raise HTTPException(409, str(e))
    return accounting.serialize(pv, with_lines=True)


@router.delete("/accounting/vouchers/{voucher_id}")
async def delete_voucher(
    voucher_id: int,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    try:
        await accounting.delete_voucher(db, pv)
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"ok": True}


@router.get("/accounting/vouchers/{voucher_id}/export")
async def export_voucher(
    voucher_id: int,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """ดาวน์โหลดฟอร์ม Excel PV ของใบสำคัญจ่ายที่บันทึกไว้แล้ว"""
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    header = {
        "pv_no": pv.pv_no, "item": pv.item, "date": pv.pv_date,
        "project": pv.project, "name": pv.requester, "issued": pv.issued_by,
    }
    lines = [{
        "identifier": l.identifier, "period": l.period, "desc": l.description,
        "amount": l.amount, "vat": l.vat, "vendor": pv.vendor,
    } for l in pv.lines]
    try:
        xls = bill_reader.build_pv_excel(lines, header, pv.vendor, pv.bill_type or None)
    except Exception as e:
        raise HTTPException(500, f"สร้าง PV ไม่สำเร็จ: {e}")
    safe = (pv.pv_no or f"PV-{pv.id}").replace("/", "-").replace("\\", "-")
    return StreamingResponse(
        io.BytesIO(xls),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{safe}.xlsx"'},
    )
