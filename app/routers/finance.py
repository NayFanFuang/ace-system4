"""
Finance router — Bill Reader (ระบบอ่านบิล)

Stateless endpoints:
  POST /api/finance/bill-reader/extract  อัปโหลด PDF บิล -> JSON (lines + header)
  POST /api/finance/bill-reader/export   ส่งข้อมูล (แก้แล้ว) -> ดาวน์โหลด Excel PV.03

OCR ทำงานในคอนเทนเนอร์ (Tesseract tha+eng) ไม่มีค่า API และไม่เก็บลง DB
"""

from __future__ import annotations

import io
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import requireRole
from app.services import accounting, audit_service, bill_reader, bill_memory

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
_ACTION_AUDIT = {"approve": "pv_approved", "pay": "pv_paid", "revert": "pv_reverted"}

MAX_PDF_MB = 25

# เอกสารแนบของ voucher เป็นเอกสารการเงิน — เก็บแยก ไม่อยู่ใต้ public /photos mount
# ชื่อไฟล์สุ่ม (uuid) และเสิร์ฟผ่าน endpoint ที่ตรวจสิทธิ์เท่านั้น
VOUCHER_FILE_DIR = os.environ.get("VOUCHER_FILE_DIR", "/app/voucher_files")


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
    allow_duplicate: bool = False     # True = ยืนยันบันทึกแม้เจอบิลซ้ำ


class VoucherTransition(BaseModel):
    action: str                       # approve | pay | revert
    payment_ref: str = ""


class VoucherDueDate(BaseModel):
    due_date: str = ""                # 'YYYY-MM-DD' หรือว่าง = ล้างวันครบกำหนด


def _actor(payload: dict) -> str:
    return payload.get("employee_code") or payload.get("sub") or ""


@router.post("/accounting/vouchers")
async def create_voucher(
    body: VoucherCreate,
    request: Request,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """บันทึกรายการบิล (ที่ตรวจ/แก้แล้ว) เข้าระบบบัญชีเป็นใบสำคัญจ่ายสถานะ DRAFT"""
    lines = [l.model_dump() for l in body.lines]
    if not lines:
        raise HTTPException(400, "ไม่มีรายการสำหรับบันทึกเข้าระบบบัญชี")

    # กันบิลซ้ำ (กันบันทึก/จ่ายซ้ำ) — เตือนก่อน เว้นแต่ผู้ใช้ยืนยัน allow_duplicate
    if not body.allow_duplicate:
        chash = accounting.content_hash(
            vendor=body.vendor, bill_type=body.bill_type or "", lines=lines)
        dup = await accounting.find_duplicate(db, chash)
        if dup:
            raise HTTPException(409, {
                "code": "duplicate",
                "message": f"พบบิลที่เนื้อหาเหมือนกันถูกบันทึกแล้ว: {dup.doc_no} "
                           f"(สถานะ {accounting.STATUS_LABEL_TH.get(dup.status, dup.status)}) "
                           f"— ยืนยันเพื่อบันทึกซ้ำ",
                "duplicate_doc_no": dup.doc_no, "duplicate_id": dup.id,
            })

    pv = await accounting.create_voucher(
        db, lines=lines, header=body.header or {}, vendor=body.vendor,
        bill_type=body.bill_type or "", filename=body.filename or "",
        created_by=_actor(payload))
    # serialize ทันทีก่อน commit อื่น ๆ (commit จะ expire attribute ของ pv)
    result = accounting.serialize(pv, with_lines=True)
    # เก็บ correction ไว้เรียนรู้ด้วย (เหมือนตอน export) — ไม่ให้ล้มถ้าพลาด
    try:
        await bill_memory.save_corrections(
            db, lines=lines, vendor=body.vendor, bill_type=body.bill_type or "",
            filename=body.filename or "", created_by=_actor(payload))
    except Exception:
        pass
    try:
        await audit_service.write_audit_log(
            db, action="pv_created", entity_type="payment_voucher", entity_id=result["id"],
            payload=payload, request=request, source="FINANCE",
            new_value={"doc_no": result["doc_no"], "vendor": result["vendor"],
                       "net_total": result["net_total"], "status": result["status"]})
        await db.commit()
    except Exception:
        await db.rollback()
    return result


@router.get("/accounting/vouchers")
async def list_vouchers(
    status: str = "", month: str = "", bill_type: str = "", q: str = "",
    limit: int = 50, offset: int = 0,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """รายการใบสำคัญจ่าย (กรอง + แบ่งหน้า) — คืน vouchers + total"""
    return await accounting.list_vouchers(
        db, status=status, month=month, bill_type=bill_type, q=q,
        limit=limit, offset=offset)


@router.get("/accounting/summary")
async def accounting_summary(
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """สรุปค่าใช้จ่ายจริงรายเดือน + จำนวนตามสถานะ (ป้อนหน้า Revenue & Expense)"""
    return await accounting.monthly_summary(db)


@router.get("/accounting/aging")
async def accounting_aging(
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """รายงานอายุหนี้เจ้าหนี้ (AP aging) — หนี้ที่อนุมัติแล้วแต่ยังไม่จ่าย แบ่งตามช่วงวันเลยกำหนด"""
    return await accounting.aging_summary(db)


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
    request: Request,
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
    old_status = pv.status
    try:
        pv = await accounting.transition(
            db, pv, action=body.action, actor=_actor(payload),
            payment_ref=body.payment_ref or "")
    except ValueError as e:
        raise HTTPException(409, str(e))
    # serialize ก่อน commit ของ audit (กัน attribute expire ใต้ async)
    result = accounting.serialize(pv, with_lines=True)
    try:
        await audit_service.write_audit_log(
            db, action=_ACTION_AUDIT.get(body.action, "pv_updated"),
            entity_type="payment_voucher", entity_id=result["id"], payload=payload,
            request=request, source="FINANCE",
            old_value={"status": old_status}, new_value={"status": result["status"]},
            changed_fields=["status"])
        await db.commit()
    except Exception:
        await db.rollback()
    return result


@router.post("/accounting/vouchers/{voucher_id}/due-date")
async def set_voucher_due_date(
    voucher_id: int,
    body: VoucherDueDate,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """ตั้ง/แก้วันครบกำหนดจ่าย (YYYY-MM-DD) — ส่งค่าว่างเพื่อล้าง"""
    due = accounting.parse_iso_date(body.due_date)
    if body.due_date and due is None:
        raise HTTPException(400, "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)")
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    pv = await accounting.set_due_date(db, pv, due)
    return accounting.serialize(pv, with_lines=True)


@router.delete("/accounting/vouchers/{voucher_id}")
async def delete_voucher(
    voucher_id: int,
    request: Request,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    doc_no = pv.doc_no
    attach = pv.attachment_path
    try:
        await accounting.delete_voucher(db, pv)
    except ValueError as e:
        raise HTTPException(409, str(e))
    if attach and os.path.isfile(attach):
        try:
            os.remove(attach)
        except OSError:
            pass
    try:
        await audit_service.write_audit_log(
            db, action="pv_deleted", entity_type="payment_voucher", entity_id=voucher_id,
            payload=payload, request=request, source="FINANCE",
            old_value={"doc_no": doc_no})
        await db.commit()
    except Exception:
        await db.rollback()
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
    safe = (pv.doc_no or pv.pv_no or f"PV-{pv.id}").replace("/", "-").replace("\\", "-")
    return StreamingResponse(
        io.BytesIO(xls),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{safe}.xlsx"'},
    )


@router.post("/accounting/vouchers/{voucher_id}/attachment")
async def upload_voucher_attachment(
    voucher_id: int,
    request: Request,
    file: UploadFile = File(...),
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """แนบไฟล์บิลต้นฉบับ (PDF) เข้ากับใบสำคัญจ่าย — เก็บในที่ไม่เปิด public"""
    name = file.filename or ""
    if not name.lower().endswith(".pdf"):
        raise HTTPException(400, "ต้องเป็นไฟล์ PDF เท่านั้น")
    content = await file.read()
    if not content:
        raise HTTPException(400, "ไฟล์ว่าง")
    if len(content) > MAX_PDF_MB * 1024 * 1024:
        raise HTTPException(400, f"ไฟล์ใหญ่เกิน {MAX_PDF_MB} MB")
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")

    os.makedirs(VOUCHER_FILE_DIR, exist_ok=True)
    # ลบไฟล์เดิมถ้าแนบใหม่ทับ
    if pv.attachment_path and os.path.isfile(pv.attachment_path):
        try:
            os.remove(pv.attachment_path)
        except OSError:
            pass
    fname = f"{pv.doc_no or pv.id}_{uuid.uuid4().hex}.pdf".replace("/", "-")
    fpath = os.path.join(VOUCHER_FILE_DIR, fname)
    with open(fpath, "wb") as fh:
        fh.write(content)
    pv.attachment_path = fpath
    pv.attachment_name = name[:255]
    await db.commit()
    try:
        await audit_service.write_audit_log(
            db, action="pv_attachment_added", entity_type="payment_voucher",
            entity_id=voucher_id, payload=payload, request=request, source="FINANCE",
            new_value={"attachment_name": name})
        await db.commit()
    except Exception:
        await db.rollback()
    return {"ok": True, "attachment_name": name}


@router.get("/accounting/vouchers/{voucher_id}/attachment")
async def download_voucher_attachment(
    voucher_id: int,
    payload: dict = Depends(require_finance_user),
    db: AsyncSession = Depends(get_db),
):
    """ดู/ดาวน์โหลดไฟล์บิลต้นฉบับ (ผ่านการตรวจสิทธิ์ ไม่ใช่ public static)"""
    pv = await accounting.get_voucher(db, voucher_id)
    if not pv:
        raise HTTPException(404, "ไม่พบใบสำคัญจ่าย")
    if not pv.attachment_path or not os.path.isfile(pv.attachment_path):
        raise HTTPException(404, "ไม่มีไฟล์แนบ")
    return FileResponse(
        pv.attachment_path, media_type="application/pdf",
        filename=pv.attachment_name or f"{pv.doc_no or pv.id}.pdf")
