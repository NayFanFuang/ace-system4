"""
Accounting service — บันทึกบิลที่ scan แล้วเข้า "ระบบบัญชี" (Payment Voucher ledger)

ต่อยอดจาก Bill Reader: หลังจากตรวจ/แก้รายการบิลแล้ว แทนที่จะดาวน์โหลด Excel อย่างเดียว
ผู้ใช้สามารถ "บันทึกเข้าระบบบัญชี" ได้ → สร้าง record ใน payment_vouchers
ติดตามสถานะ DRAFT → APPROVED → PAID และรวมยอดเป็นค่าใช้จ่ายจริงรายเดือน

  next_doc_no()         ออกเลขเอกสาร running ของระบบ (PV-YYYY-0001) การันตี unique
  content_hash()        ลายเซ็นเนื้อหาบิล (ไว้ตรวจซ้ำ)
  find_duplicate()      หา voucher ที่เนื้อหาเหมือนกัน (กันบันทึก/จ่ายซ้ำ)
  create_voucher()      สร้างใบสำคัญจ่ายจากรายการที่ scan/แก้แล้ว (สถานะเริ่มต้น DRAFT)
  list_vouchers()       รายการใบสำคัญจ่าย (กรองตามสถานะ/เดือน/ชนิดบิล/คำค้น)
  get_voucher()         อ่านใบเดียวพร้อมบรรทัด
  transition()          เปลี่ยนสถานะ (approve / pay / revert) + ลงเวลา/ผู้ทำ
  delete_voucher()      ลบได้เฉพาะใบที่ยังเป็น DRAFT
  monthly_summary()     สรุปรายเดือน — แยก base (ค่าใช้จ่าย) / VAT (ภาษีซื้อ) / WHT

หมายเหตุงานบัญชี: จำนวนเงินใช้ Decimal ตลอด (ไม่ใช้ float) และ "ค่าใช้จ่ายจริง"
(expense_actual) คือยอดก่อน VAT — VAT 7% เป็นภาษีซื้อที่ขอคืนได้ ไม่ใช่ค่าใช้จ่าย
"""

from __future__ import annotations

import datetime
import hashlib
import re
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_voucher import PaymentVoucher, PaymentVoucherLine
from app.services import bill_profiles
# หมายเหตุ: bill_reader ดึง OCR libs หนัก — import แบบ lazy ใน create_voucher
# เพื่อให้ฟังก์ชันบริสุทธิ์ (q2/content_hash/validate_transition) ทดสอบได้โดยไม่ต้องมี deps เหล่านั้น

# วงจรสถานะ + การเปลี่ยนสถานะที่อนุญาต
STATUSES = ("DRAFT", "APPROVED", "PAID")
STATUS_LABEL_TH = {"DRAFT": "ร่าง", "APPROVED": "อนุมัติแล้ว", "PAID": "จ่ายแล้ว"}
_TRANSITIONS = {
    "approve": ("DRAFT", "APPROVED"),
    "pay": ("APPROVED", "PAID"),
    "revert": ("APPROVED", "DRAFT"),   # ดึงกลับมาแก้ก่อนจ่าย
}

_TWO = Decimal("0.01")
_MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"])}


def D(x) -> Decimal:
    """แปลงค่าเป็น Decimal อย่างปลอดภัย (ผ่าน str กัน float artefact)"""
    if isinstance(x, Decimal):
        return x
    try:
        return Decimal(str(x if x not in (None, "") else 0))
    except (InvalidOperation, ValueError):
        return Decimal(0)


def q2(x) -> Decimal:
    """ปัดเป็น 2 ตำแหน่ง (ครึ่งปัดขึ้น แบบงานเงิน)"""
    return D(x).quantize(_TWO, rounding=ROUND_HALF_UP)


def _f(x) -> float:
    return float(D(x))


def _norm(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def _period_month(pv_date: str, lines: list[dict]) -> str:
    """หาเดือนบัญชี (YYYY-MM) จากวันที่บนฟอร์ม ถ้าไม่ได้ลองดูจากงวดบิล สุดท้าย fallback เดือนนี้"""
    m = re.search(r"(\d{1,2})[-/\s]+([A-Za-z]{3})[A-Za-z]*[-/\s]+(\d{4})", pv_date or "")
    if m and m.group(2).lower() in _MONTHS:
        return f"{int(m.group(3)):04d}-{_MONTHS[m.group(2).lower()]:02d}"
    for ln in lines or []:
        mm = re.search(r"(\d{2})/(\d{2})/(\d{4})\s*$", str(ln.get("period") or ""))
        if mm:
            return f"{mm.group(3)}-{mm.group(2)}"
    today = datetime.date.today()
    return f"{today.year:04d}-{today.month:02d}"


def content_hash(*, vendor: str, bill_type: str, lines: list[dict]) -> str:
    """ลายเซ็นเนื้อหาบิล: vendor + ชนิด + ชุดบรรทัด (identifier/period/amount) — ไว้ตรวจซ้ำ"""
    parts = sorted(
        f"{_norm(ln.get('identifier') or ln.get('phone') or '')}|"
        f"{(ln.get('period') or '').strip()}|{q2(ln.get('amount'))}"
        for ln in lines or [])
    raw = f"{(vendor or '').strip().lower()}|{bill_type or ''}|" + ";".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def validate_transition(current_status: str, action: str) -> str:
    """ตรวจกฎ state-machine (pure) — คืนสถานะปลายทาง หรือ raise ValueError

    แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อทดสอบได้โดยไม่ต้องมี DB
    """
    rule = _TRANSITIONS.get(action)
    if not rule:
        raise ValueError(f"ไม่รู้จักการกระทำ '{action}'")
    src, dst = rule
    if current_status != src:
        raise ValueError(
            f"เปลี่ยนสถานะไม่ได้: ต้องอยู่สถานะ {STATUS_LABEL_TH.get(src, src)} "
            f"แต่ใบนี้เป็น {STATUS_LABEL_TH.get(current_status, current_status)}")
    return dst


def serialize(v: PaymentVoucher, *, with_lines: bool = False) -> dict:
    out = {
        "id": v.id, "doc_no": v.doc_no, "pv_no": v.pv_no, "item": v.item,
        "pv_date": v.pv_date, "period_month": v.period_month, "bill_type": v.bill_type,
        "vendor": v.vendor, "project": v.project, "requester": v.requester,
        "issued_by": v.issued_by, "status": v.status,
        "status_label": STATUS_LABEL_TH.get(v.status, v.status),
        "amount_total": _f(v.amount_total), "vat_total": _f(v.vat_total),
        "wht_total": _f(v.wht_total), "net_total": _f(v.net_total),
        "note": v.note, "source_filename": v.source_filename,
        "has_attachment": bool(v.attachment_path), "attachment_name": v.attachment_name,
        "created_by": v.created_by,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "approved_by": v.approved_by,
        "approved_at": v.approved_at.isoformat() if v.approved_at else None,
        "paid_by": v.paid_by,
        "paid_at": v.paid_at.isoformat() if v.paid_at else None,
        "payment_ref": v.payment_ref,
        "line_count": len(v.lines),
    }
    if with_lines:
        out["lines"] = [{
            "seq": l.seq, "identifier": l.identifier, "period": l.period,
            "description": l.description, "amount": _f(l.amount), "vat": _f(l.vat),
            "wht": _f(l.wht), "net": _f(l.net),
        } for l in v.lines]
    return out


async def next_doc_no(db: AsyncSession, year: str) -> tuple[str, int]:
    last = (await db.execute(
        select(func.max(PaymentVoucher.doc_seq))
        .where(PaymentVoucher.doc_year == year))).scalar() or 0
    seq = int(last) + 1
    return f"PV-{year}-{seq:04d}", seq


async def find_duplicate(db: AsyncSession, chash: str) -> PaymentVoucher | None:
    if not chash:
        return None
    return (await db.execute(
        select(PaymentVoucher).where(PaymentVoucher.content_hash == chash)
        .order_by(PaymentVoucher.created_at.desc()).limit(1))).scalar_one_or_none()


async def create_voucher(db: AsyncSession, *, lines: list[dict], header: dict,
                         vendor: str, bill_type: str, filename: str,
                         created_by: str) -> PaymentVoucher:
    profile = bill_profiles.get_profile(bill_type)
    header = header or {}
    period_month = _period_month(header.get("date") or "", lines)
    year = period_month[:4]
    chash = content_hash(vendor=vendor, bill_type=bill_type, lines=lines)

    amount_t = vat_t = wht_t = net_t = Decimal(0)
    built_lines = []
    for i, ln in enumerate(lines, 1):
        amount = q2(ln.get("amount"))
        vat = q2(ln.get("vat")) if profile.extract_vat else Decimal(0)
        wht = q2(amount * D(profile.wht_rate))
        net = q2(amount + vat - wht)
        desc = ln.get("desc")
        if not desc:
            # lazy import: bill_reader ดึง OCR libs หนัก — โหลดเฉพาะเมื่อต้อง derive desc
            from app.services.bill_reader import _desc_from_dict
            desc = _desc_from_dict(ln, profile)
        built_lines.append(PaymentVoucherLine(
            seq=i,
            identifier=ln.get("identifier") or ln.get("phone") or "",
            period=ln.get("period") or "",
            description=desc,
            amount=amount, vat=vat, wht=wht, net=net,
        ))
        amount_t += amount; vat_t += vat; wht_t += wht; net_t += net

    # ออกเลขเอกสาร + บันทึก พร้อม retry ถ้าเลขชน (unique constraint)
    for attempt in range(5):
        doc_no, seq = await next_doc_no(db, year)
        pv = PaymentVoucher(
            doc_no=doc_no, doc_year=year, doc_seq=seq,
            pv_no=header.get("pv_no") or "", item=str(header.get("item") or ""),
            pv_date=header.get("date") or "", period_month=period_month,
            bill_type=bill_type or "", vendor=vendor or profile.default_vendor or "",
            project=header.get("project") or "", requester=header.get("name") or "",
            issued_by=header.get("issued") or "", status="DRAFT", content_hash=chash,
            amount_total=q2(amount_t), vat_total=q2(vat_t),
            wht_total=q2(wht_t), net_total=q2(net_t),
            source_filename=filename or "", created_by=created_by or "",
        )
        pv.lines = [PaymentVoucherLine(
            seq=l.seq, identifier=l.identifier, period=l.period,
            description=l.description, amount=l.amount, vat=l.vat,
            wht=l.wht, net=l.net) for l in built_lines]
        db.add(pv)
        try:
            await db.commit()
            break
        except IntegrityError:
            await db.rollback()
            if attempt == 4:
                raise
    return await get_voucher(db, pv.id)


async def list_vouchers(db: AsyncSession, *, status: str = "", month: str = "",
                        bill_type: str = "", q: str = "", limit: int = 50,
                        offset: int = 0) -> dict:
    """รายการใบสำคัญจ่าย (มี pagination) — คืน items + total สำหรับแบ่งหน้า"""
    limit = max(1, min(int(limit or 50), 200))
    offset = max(0, int(offset or 0))

    filters = []
    if status:
        filters.append(PaymentVoucher.status == status)
    if month:
        filters.append(PaymentVoucher.period_month == month)
    if bill_type:
        filters.append(PaymentVoucher.bill_type == bill_type)
    if q:
        like = f"%{q}%"
        filters.append(
            PaymentVoucher.doc_no.ilike(like)
            | PaymentVoucher.pv_no.ilike(like)
            | PaymentVoucher.vendor.ilike(like)
            | PaymentVoucher.project.ilike(like))

    total = (await db.execute(
        select(func.count()).select_from(PaymentVoucher).where(*filters))).scalar() or 0
    rows = (await db.execute(
        select(PaymentVoucher).where(*filters)
        .order_by(PaymentVoucher.created_at.desc())
        .limit(limit).offset(offset))).scalars().all()
    return {"vouchers": [serialize(v) for v in rows],
            "total": int(total), "limit": limit, "offset": offset}


async def get_voucher(db: AsyncSession, voucher_id: int) -> PaymentVoucher | None:
    return (await db.execute(
        select(PaymentVoucher).where(PaymentVoucher.id == voucher_id)
    )).scalar_one_or_none()


async def transition(db: AsyncSession, voucher: PaymentVoucher, *, action: str,
                     actor: str, payment_ref: str = "") -> PaymentVoucher:
    voucher.status = validate_transition(voucher.status, action)
    now = datetime.datetime.now(datetime.timezone.utc)
    if action == "approve":
        voucher.approved_by, voucher.approved_at = actor, now
    elif action == "pay":
        voucher.paid_by, voucher.paid_at = actor, now
        if payment_ref:
            voucher.payment_ref = payment_ref
    elif action == "revert":
        voucher.approved_by = voucher.approved_at = None
    await db.commit()
    return await get_voucher(db, voucher.id)


async def delete_voucher(db: AsyncSession, voucher: PaymentVoucher) -> None:
    if voucher.status != "DRAFT":
        raise ValueError("ลบได้เฉพาะใบที่ยังเป็นร่าง (DRAFT) เท่านั้น")
    await db.delete(voucher)
    await db.commit()


async def monthly_summary(db: AsyncSession) -> dict:
    """สรุปยอดรายเดือน + จำนวนตามสถานะ (ป้อนหน้า Revenue & Expense)

    แยกชัดเจนตามหลักบัญชี:
      expense_actual = ยอดก่อน VAT (ค่าใช้จ่ายจริงเข้า P&L)
      input_vat      = VAT 7% (ภาษีซื้อ ขอคืนได้ ไม่ใช่ค่าใช้จ่าย)
      wht            = หัก ณ ที่จ่าย (เป็นหนี้สินรอนำส่งสรรพากร)
      net_paid       = ยอดจ่ายสุทธิจริง (กระแสเงินสดออก)
    นับเฉพาะใบที่ APPROVED/PAID — ใบ DRAFT ยังไม่ถือเป็น actual
    """
    status_rows = (await db.execute(
        select(PaymentVoucher.status, func.count(),
               func.coalesce(func.sum(PaymentVoucher.net_total), 0))
        .group_by(PaymentVoucher.status))).all()
    by_status = {s: {"count": int(c), "net_total": _f(n)} for s, c, n in status_rows}

    month_rows = (await db.execute(
        select(
            PaymentVoucher.period_month,
            func.coalesce(func.sum(PaymentVoucher.amount_total), 0),
            func.coalesce(func.sum(PaymentVoucher.vat_total), 0),
            func.coalesce(func.sum(PaymentVoucher.wht_total), 0),
            func.coalesce(func.sum(PaymentVoucher.net_total), 0),
            func.count(),
        )
        .where(PaymentVoucher.status.in_(("APPROVED", "PAID")))
        .group_by(PaymentVoucher.period_month)
        .order_by(PaymentVoucher.period_month))).all()
    months = [{
        "month": m or "?", "expense_actual": _f(base), "input_vat": _f(vat),
        "wht_total": _f(wht), "net_paid": _f(net), "count": int(c),
    } for m, base, vat, wht, net, c in month_rows]

    return {
        "by_status": by_status,
        "months": months,
        "total_expense_actual": _f(sum((D(x["expense_actual"]) for x in months), Decimal(0))),
        "total_input_vat": _f(sum((D(x["input_vat"]) for x in months), Decimal(0))),
        "total_net_paid": _f(sum((D(x["net_paid"]) for x in months), Decimal(0))),
    }
