"""
Bill Memory (Level 1 learning) — เก็บ correction ที่ผู้ใช้ยืนยัน แล้วนำกลับมาใช้

- save_corrections(): บันทึกตอน export (ค่าที่คนตรวจ/แก้แล้ว = ความจริง)
- enrich():          ตอน extract เจอ identifier เดิม -> เติม desc/period ให้ + ทำเครื่องหมาย learned
- stats():           จำนวนที่เรียนรู้แล้ว
"""

from __future__ import annotations

import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bill_correction import BillCorrection
from app.services import bill_profiles


def _norm(identifier: str) -> str:
    return re.sub(r"\D", "", identifier or "")


async def save_corrections(db: AsyncSession, *, lines: list[dict], vendor: str,
                           bill_type: str, filename: str, created_by: str) -> int:
    profile = bill_profiles.get_profile(bill_type)
    saved = 0
    for ln in lines:
        amount = float(ln.get("amount") or 0)
        vat = float(ln.get("vat") or 0)
        wht = round(amount * profile.wht_rate, 2)
        ident = ln.get("identifier") or ln.get("phone") or ""
        db.add(BillCorrection(
            bill_type=bill_type or "", vendor=vendor or "",
            identifier=ident, identifier_norm=_norm(ident),
            period=ln.get("period") or "", amount=amount, vat=vat, wht=wht,
            net=round(amount + vat - wht, 2),
            description=ln.get("desc") or "",
            ocr_raw=ln.get("ocr") or {},
            source_filename=filename or "", created_by=created_by or "",
        ))
        saved += 1
    await db.commit()
    return saved


async def enrich(db: AsyncSession, lines: list[dict], bill_type: str) -> tuple[list[dict], int]:
    """เติมค่าที่เคยแก้ไว้ให้บรรทัดที่ identifier ตรงกัน (ตาม bill_type เดียวกัน)"""
    out, learned = [], 0
    for ln in lines:
        norm = _norm(ln.get("identifier") or ln.get("phone") or "")
        ln = dict(ln)
        if norm:
            row = (await db.execute(
                select(BillCorrection)
                .where(BillCorrection.bill_type == (bill_type or ""),
                       BillCorrection.identifier_norm == norm)
                .order_by(BillCorrection.created_at.desc()).limit(1)
            )).scalar_one_or_none()
            if row:
                if not ln.get("period") and row.period:
                    ln["period"] = row.period
                if row.identifier:
                    ln["identifier"] = row.identifier
                if not ln.get("desc") and row.description:
                    ln["desc"] = row.description
                ln["learned"] = True
                if ln.get("period"):
                    ln["needs_review"] = False
                learned += 1
        out.append(ln)
    return out, learned


async def stats(db: AsyncSession) -> dict:
    total = (await db.execute(select(func.count()).select_from(BillCorrection))).scalar() or 0
    by_type = (await db.execute(
        select(BillCorrection.bill_type, func.count())
        .group_by(BillCorrection.bill_type)
    )).all()
    return {"total": int(total), "by_type": {k or "?": int(v) for k, v in by_type}}
