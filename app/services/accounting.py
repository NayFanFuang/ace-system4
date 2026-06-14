"""
Accounting service — บันทึกบิลที่ scan แล้วเข้า "ระบบบัญชี" (Payment Voucher ledger)

ต่อยอดจาก Bill Reader: หลังจากตรวจ/แก้รายการบิลแล้ว แทนที่จะดาวน์โหลด Excel อย่างเดียว
ผู้ใช้สามารถ "บันทึกเข้าระบบบัญชี" ได้ → สร้าง record ใน payment_vouchers
ติดตามสถานะ DRAFT → APPROVED → PAID และรวมยอดเป็นค่าใช้จ่ายจริงรายเดือน

  create_voucher()      สร้างใบสำคัญจ่ายจากรายการที่ scan/แก้แล้ว (สถานะเริ่มต้น DRAFT)
  list_vouchers()       รายการใบสำคัญจ่าย (กรองตามสถานะ/เดือน/ชนิดบิล/คำค้น)
  get_voucher()         อ่านใบเดียวพร้อมบรรทัด
  transition()          เปลี่ยนสถานะ (approve / pay / revert) + ลงเวลา/ผู้ทำ
  delete_voucher()      ลบได้เฉพาะใบที่ยังเป็น DRAFT
  monthly_summary()     สรุปค่าใช้จ่ายจริงรายเดือน (ป้อนหน้า Revenue & Expense)
"""

from __future__ import annotations

import datetime
import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_voucher import PaymentVoucher, PaymentVoucherLine
from app.services import bill_profiles
from app.services.bill_reader import _desc_from_dict

# วงจรสถานะ + การเปลี่ยนสถานะที่อนุญาต
STATUSES = ("DRAFT", "APPROVED", "PAID")
STATUS_LABEL_TH = {"DRAFT": "ร่าง", "APPROVED": "อนุมัติแล้ว", "PAID": "จ่ายแล้ว"}
_TRANSITIONS = {
    "approve": ("DRAFT", "APPROVED"),
    "pay": ("APPROVED", "PAID"),
    "revert": ("APPROVED", "DRAFT"),   # ดึงกลับมาแก้ก่อนจ่าย
}

_MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"])}


def _r2(n) -> float:
    return round((float(n) or 0.0), 2)


def _period_month(pv_date: str, lines: list[dict]) -> str:
    """หาเดือนบัญชี (YYYY-MM) จากวันที่บนฟอร์ม ถ้าไม่ได้ลองดูจากงวดบิล สุดท้าย fallback เดือนนี้"""
    # 1) จากวันที่ PV รูปแบบ DD-Mon-YYYY (เช่น 14-Jun-2026)
    m = re.search(r"(\d{1,2})[-/\s]+([A-Za-z]{3})[A-Za-z]*[-/\s]+(\d{4})", pv_date or "")
    if m and m.group(2).lower() in _MONTHS:
        return f"{int(m.group(3)):04d}-{_MONTHS[m.group(2).lower()]:02d}"
    # 2) จากปลายงวดบิล รูปแบบ ...-DD/MM/YYYY
    for ln in lines or []:
        mm = re.search(r"(\d{2})/(\d{2})/(\d{4})\s*$", str(ln.get("period") or ""))
        if mm:
            return f"{mm.group(3)}-{mm.group(2)}"
    # 3) เดือนปัจจุบัน
    today = datetime.date.today()
    return f"{today.year:04d}-{today.month:02d}"


def serialize(v: PaymentVoucher, *, with_lines: bool = False) -> dict:
    out = {
        "id": v.id, "pv_no": v.pv_no, "item": v.item, "pv_date": v.pv_date,
        "period_month": v.period_month, "bill_type": v.bill_type, "vendor": v.vendor,
        "project": v.project, "requester": v.requester, "issued_by": v.issued_by,
        "status": v.status, "status_label": STATUS_LABEL_TH.get(v.status, v.status),
        "amount_total": v.amount_total, "vat_total": v.vat_total,
        "wht_total": v.wht_total, "net_total": v.net_total,
        "note": v.note, "source_filename": v.source_filename,
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
            "description": l.description, "amount": l.amount, "vat": l.vat,
            "wht": l.wht, "net": l.net,
        } for l in v.lines]
    return out


async def create_voucher(db: AsyncSession, *, lines: list[dict], header: dict,
                         vendor: str, bill_type: str, filename: str,
                         created_by: str) -> PaymentVoucher:
    profile = bill_profiles.get_profile(bill_type)
    header = header or {}

    pv = PaymentVoucher(
        pv_no=header.get("pv_no") or "", item=str(header.get("item") or ""),
        pv_date=header.get("date") or "",
        period_month=_period_month(header.get("date") or "", lines),
        bill_type=bill_type or "", vendor=vendor or profile.default_vendor or "",
        project=header.get("project") or "", requester=header.get("name") or "",
        issued_by=header.get("issued") or "", status="DRAFT",
        source_filename=filename or "", created_by=created_by or "",
    )

    amount_t = vat_t = wht_t = net_t = 0.0
    for i, ln in enumerate(lines, 1):
        amount = _r2(ln.get("amount"))
        vat = _r2(ln.get("vat")) if profile.extract_vat else 0.0
        wht = _r2(amount * profile.wht_rate)
        net = _r2(amount + vat - wht)
        pv.lines.append(PaymentVoucherLine(
            seq=i,
            identifier=ln.get("identifier") or ln.get("phone") or "",
            period=ln.get("period") or "",
            description=ln.get("desc") or _desc_from_dict(ln, profile),
            amount=amount, vat=vat, wht=wht, net=net,
        ))
        amount_t += amount; vat_t += vat; wht_t += wht; net_t += net

    pv.amount_total = _r2(amount_t); pv.vat_total = _r2(vat_t)
    pv.wht_total = _r2(wht_t); pv.net_total = _r2(net_t)

    db.add(pv)
    await db.commit()
    # re-query so the selectin relationship (lines) is loaded for serialization
    # — accessing pv.lines after commit would otherwise lazy-load under async
    return await get_voucher(db, pv.id)


async def list_vouchers(db: AsyncSession, *, status: str = "", month: str = "",
                        bill_type: str = "", q: str = "", limit: int = 200) -> list[dict]:
    stmt = select(PaymentVoucher)
    if status:
        stmt = stmt.where(PaymentVoucher.status == status)
    if month:
        stmt = stmt.where(PaymentVoucher.period_month == month)
    if bill_type:
        stmt = stmt.where(PaymentVoucher.bill_type == bill_type)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            PaymentVoucher.pv_no.ilike(like)
            | PaymentVoucher.vendor.ilike(like)
            | PaymentVoucher.project.ilike(like))
    stmt = stmt.order_by(PaymentVoucher.created_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [serialize(v) for v in rows]


async def get_voucher(db: AsyncSession, voucher_id: int) -> PaymentVoucher | None:
    return (await db.execute(
        select(PaymentVoucher).where(PaymentVoucher.id == voucher_id)
    )).scalar_one_or_none()


async def transition(db: AsyncSession, voucher: PaymentVoucher, *, action: str,
                     actor: str, payment_ref: str = "") -> PaymentVoucher:
    rule = _TRANSITIONS.get(action)
    if not rule:
        raise ValueError(f"ไม่รู้จักการกระทำ '{action}'")
    src, dst = rule
    if voucher.status != src:
        raise ValueError(
            f"เปลี่ยนสถานะไม่ได้: ต้องอยู่สถานะ {STATUS_LABEL_TH.get(src, src)} "
            f"แต่ใบนี้เป็น {STATUS_LABEL_TH.get(voucher.status, voucher.status)}")
    now = datetime.datetime.now(datetime.timezone.utc)
    voucher.status = dst
    if action == "approve":
        voucher.approved_by, voucher.approved_at = actor, now
    elif action == "pay":
        voucher.paid_by, voucher.paid_at = actor, now
        if payment_ref:
            voucher.payment_ref = payment_ref
    elif action == "revert":
        voucher.approved_by = voucher.approved_at = None
    await db.commit()
    # re-query to reload the selectin relationship after commit expired attributes
    return await get_voucher(db, voucher.id)


async def delete_voucher(db: AsyncSession, voucher: PaymentVoucher) -> None:
    if voucher.status != "DRAFT":
        raise ValueError("ลบได้เฉพาะใบที่ยังเป็นร่าง (DRAFT) เท่านั้น")
    await db.delete(voucher)
    await db.commit()


async def monthly_summary(db: AsyncSession) -> dict:
    """สรุปยอดรายเดือน (ค่าใช้จ่ายจริงจากบิลที่บันทึก) + จำนวนตามสถานะ

    ค่าใช้จ่ายจริงที่ส่งเข้าหน้า Revenue & Expense ใช้ "ยอดก่อนหัก ณ ที่จ่าย + VAT"
    (amount + vat) ของใบที่อนุมัติหรือจ่ายแล้ว — ใบ DRAFT ยังไม่นับเป็น actual
    """
    # นับตามสถานะ
    status_rows = (await db.execute(
        select(PaymentVoucher.status, func.count(), func.coalesce(func.sum(PaymentVoucher.net_total), 0))
        .group_by(PaymentVoucher.status))).all()
    by_status = {s: {"count": int(c), "net_total": _r2(n)} for s, c, n in status_rows}

    # ค่าใช้จ่ายจริงรายเดือน (เฉพาะ APPROVED/PAID)
    month_rows = (await db.execute(
        select(
            PaymentVoucher.period_month,
            func.coalesce(func.sum(PaymentVoucher.amount_total + PaymentVoucher.vat_total), 0),
            func.coalesce(func.sum(PaymentVoucher.wht_total), 0),
            func.coalesce(func.sum(PaymentVoucher.net_total), 0),
            func.count(),
        )
        .where(PaymentVoucher.status.in_(("APPROVED", "PAID")))
        .group_by(PaymentVoucher.period_month)
        .order_by(PaymentVoucher.period_month))).all()
    months = [{
        "month": m or "?", "expense_actual": _r2(exp),
        "wht_total": _r2(wht), "net_total": _r2(net), "count": int(c),
    } for m, exp, wht, net, c in month_rows]

    return {
        "by_status": by_status,
        "months": months,
        "total_expense_actual": _r2(sum(x["expense_actual"] for x in months)),
    }
