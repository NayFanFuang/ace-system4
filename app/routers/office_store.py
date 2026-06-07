from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.office_store import (
    StockItem, StockMovement, StockRequest, StockRequestLine,
)

router = APIRouter(prefix="/api", tags=["OfficeStore"])

# Roles allowed to manage stock + approve/reject withdrawals.
STORE_ADMIN_ROLES = {"SUPER_ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"}


def _emp(payload: dict) -> tuple[str, str | None]:
    code = payload.get("employee_code") or payload.get("sub")
    if not code:
        raise HTTPException(status_code=401, detail="Missing employee context")
    return code, payload.get("name") or payload.get("full_name")


def _is_admin(payload: dict) -> bool:
    return payload.get("role") in STORE_ADMIN_ROLES


def _require_admin(payload: dict) -> None:
    if not _is_admin(payload):
        raise HTTPException(status_code=403, detail="ต้องเป็นผู้ดูแลสโตร์")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ItemIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    sku: str | None = Field(default=None, max_length=60)
    category: str | None = Field(default=None, max_length=80)
    unit: str = Field(default="ชิ้น", max_length=30)
    min_qty: int = Field(default=0, ge=0, le=1_000_000)
    quantity: int | None = Field(default=None, ge=0, le=1_000_000)  # initial stock on create
    is_active: bool = True


class AdjustIn(BaseModel):
    delta: int = Field(..., description="+receive / -remove")
    reason: str | None = Field(default=None, max_length=200)


class RequestLineIn(BaseModel):
    item_id: int
    qty: int = Field(..., ge=1, le=1_000_000)


class RequestIn(BaseModel):
    note: str | None = Field(default=None, max_length=2000)
    lines: list[RequestLineIn] = Field(..., min_length=1)


class DecisionIn(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    note: str | None = Field(default=None, max_length=2000)


def _item_dict(i: StockItem) -> dict:
    return {
        "id": i.id, "name": i.name, "sku": i.sku, "category": i.category,
        "unit": i.unit, "quantity": i.quantity, "min_qty": i.min_qty,
        "is_active": i.is_active, "low_stock": i.quantity <= i.min_qty,
    }


# ---------------------------------------------------------------------------
# Items / stock
# ---------------------------------------------------------------------------
@router.get("/stock-items")
async def list_items(
    include_inactive: bool = Query(False),
    low_stock: bool = Query(False),
    q: str | None = Query(None),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StockItem).order_by(StockItem.name)
    if not include_inactive:
        stmt = stmt.where(StockItem.is_active.is_(True))
    rows = (await db.execute(stmt)).scalars().all()
    items = [_item_dict(i) for i in rows]
    if q:
        ql = q.lower()
        items = [i for i in items if ql in (i["name"] or "").lower() or ql in (i["sku"] or "").lower()]
    if low_stock:
        items = [i for i in items if i["low_stock"]]
    return {"items": items, "can_manage": _is_admin(payload)}


@router.post("/stock-items")
async def create_item(
    body: ItemIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    code, name = _emp(payload)
    qty0 = body.quantity or 0
    item = StockItem(
        name=body.name.strip(),
        sku=(body.sku or "").strip() or None,
        category=(body.category or "").strip() or None,
        unit=(body.unit or "ชิ้น").strip() or "ชิ้น",
        min_qty=body.min_qty,
        quantity=qty0,
        is_active=body.is_active,
    )
    db.add(item)
    await db.flush()
    if qty0:
        db.add(StockMovement(
            item_id=item.id, delta=qty0, balance_after=qty0, reason="RECEIVE",
            created_by=code, created_by_name=name,
        ))
    await db.commit()
    await db.refresh(item)
    return _item_dict(item)


@router.patch("/stock-items/{item_id}")
async def update_item(
    item_id: int,
    body: ItemIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    item = (await db.execute(select(StockItem).where(StockItem.id == item_id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้า")
    item.name = body.name.strip()
    item.sku = (body.sku or "").strip() or None
    item.category = (body.category or "").strip() or None
    item.unit = (body.unit or "ชิ้น").strip() or "ชิ้น"
    item.min_qty = body.min_qty
    item.is_active = body.is_active
    # NOTE: quantity is NOT edited here — use /adjust so every change is in the ledger.
    await db.commit()
    await db.refresh(item)
    return _item_dict(item)


@router.post("/stock-items/{item_id}/adjust")
async def adjust_item(
    item_id: int,
    body: AdjustIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    code, name = _emp(payload)
    item = (await db.execute(select(StockItem).where(StockItem.id == item_id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้า")
    if body.delta == 0:
        raise HTTPException(status_code=400, detail="delta ต้องไม่เป็น 0")
    new_qty = item.quantity + body.delta
    if new_qty < 0:
        raise HTTPException(status_code=400, detail=f"สต็อกไม่พอ (คงเหลือ {item.quantity})")
    item.quantity = new_qty
    db.add(StockMovement(
        item_id=item.id, delta=body.delta, balance_after=new_qty,
        reason="RECEIVE" if body.delta > 0 else "ADJUST",
        created_by=code, created_by_name=name,
    ))
    await db.commit()
    await db.refresh(item)
    return _item_dict(item)


@router.delete("/stock-items/{item_id}")
async def delete_item(
    item_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    item = (await db.execute(select(StockItem).where(StockItem.id == item_id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้า")
    item.is_active = False
    await db.commit()
    return {"ok": True}


@router.get("/stock-items/{item_id}/movements")
async def item_movements(
    item_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    rows = (await db.execute(
        select(StockMovement).where(StockMovement.item_id == item_id)
        .order_by(StockMovement.id.desc()).limit(200)
    )).scalars().all()
    return {"movements": [{
        "id": m.id, "delta": m.delta, "balance_after": m.balance_after,
        "reason": m.reason, "ref_request_id": m.ref_request_id,
        "by": m.created_by_name or m.created_by,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in rows]}


# ---------------------------------------------------------------------------
# Withdrawal requests (เบิก)
# ---------------------------------------------------------------------------
async def _serialize_request(db: AsyncSession, r: StockRequest) -> dict:
    lines = (await db.execute(
        select(StockRequestLine).where(StockRequestLine.request_id == r.id)
        .order_by(StockRequestLine.id)
    )).scalars().all()
    return {
        "id": r.id,
        "requested_by": r.requested_by,
        "requested_by_name": r.requested_by_name,
        "status": r.status,
        "note": r.note,
        "decided_by_name": r.decided_by_name,
        "decided_at": r.decided_at.isoformat() if r.decided_at else None,
        "decision_note": r.decision_note,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "lines": [{"item_id": l.item_id, "item_name": l.item_name, "unit": l.unit, "qty": l.qty} for l in lines],
    }


@router.get("/stock-requests")
async def list_requests(
    scope: str = Query("mine", pattern="^(mine|all)$"),
    status: str | None = Query(None),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, _ = _emp(payload)
    stmt = select(StockRequest).order_by(StockRequest.id.desc())
    if scope == "all":
        _require_admin(payload)
    else:
        stmt = stmt.where(StockRequest.requested_by == code)
    if status:
        stmt = stmt.where(StockRequest.status == status)
    rows = (await db.execute(stmt.limit(300))).scalars().all()
    out = [await _serialize_request(db, r) for r in rows]
    # Pending count helps badge the approval tab.
    pending = (await db.execute(
        select(StockRequest.id).where(StockRequest.status == "PENDING")
    )).all()
    return {"requests": out, "is_admin": _is_admin(payload), "pending_count": len(pending)}


@router.post("/stock-requests")
async def create_request(
    body: RequestIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, name = _emp(payload)
    # Merge duplicate item_ids and validate each item exists & is active.
    merged: dict[int, int] = defaultdict(int)
    for ln in body.lines:
        merged[ln.item_id] += ln.qty
    items = (await db.execute(
        select(StockItem).where(StockItem.id.in_(list(merged.keys())))
    )).scalars().all()
    by_id = {i.id: i for i in items}
    missing = [iid for iid in merged if iid not in by_id or not by_id[iid].is_active]
    if missing:
        raise HTTPException(status_code=400, detail=f"มีสินค้าที่ไม่พบหรือปิดใช้งาน: {missing}")

    req = StockRequest(
        requested_by=code, requested_by_name=name,
        status="PENDING", note=(body.note or "").strip() or None,
    )
    db.add(req)
    await db.flush()
    for iid, qty in merged.items():
        it = by_id[iid]
        db.add(StockRequestLine(
            request_id=req.id, item_id=iid, item_name=it.name, unit=it.unit, qty=qty,
        ))
    await db.commit()
    await db.refresh(req)
    return await _serialize_request(db, req)


@router.post("/stock-requests/{request_id}/decision")
async def decide_request(
    request_id: int,
    body: DecisionIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    code, name = _emp(payload)
    req = (await db.execute(select(StockRequest).where(StockRequest.id == request_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบคำขอเบิก")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"คำขอนี้ถูกดำเนินการแล้ว ({req.status})")

    lines = (await db.execute(
        select(StockRequestLine).where(StockRequestLine.request_id == req.id)
    )).scalars().all()

    if body.action == "approve":
        # Lock & verify stock for every line before deducting anything.
        need: dict[int, int] = defaultdict(int)
        for l in lines:
            need[l.item_id] += l.qty
        items = (await db.execute(
            select(StockItem).where(StockItem.id.in_(list(need.keys())))
        )).scalars().all()
        by_id = {i.id: i for i in items}
        for iid, qty in need.items():
            it = by_id.get(iid)
            if not it:
                raise HTTPException(status_code=400, detail=f"สินค้า id={iid} ถูกลบไปแล้ว")
            if it.quantity < qty:
                raise HTTPException(
                    status_code=409,
                    detail=f"สต็อกไม่พอ: {it.name} ต้องการ {qty} {it.unit} (คงเหลือ {it.quantity})",
                )
        # All good — deduct + ledger.
        for iid, qty in need.items():
            it = by_id[iid]
            it.quantity -= qty
            db.add(StockMovement(
                item_id=iid, delta=-qty, balance_after=it.quantity, reason="ISSUE",
                ref_request_id=req.id, created_by=code, created_by_name=name,
            ))
        req.status = "APPROVED"
    else:
        req.status = "REJECTED"

    req.decided_by = code
    req.decided_by_name = name
    req.decided_at = datetime.now(timezone.utc)
    req.decision_note = (body.note or "").strip() or None
    await db.commit()
    await db.refresh(req)
    return await _serialize_request(db, req)


@router.post("/stock-requests/{request_id}/cancel")
async def cancel_request(
    request_id: int,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code, _ = _emp(payload)
    req = (await db.execute(select(StockRequest).where(StockRequest.id == request_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="ไม่พบคำขอเบิก")
    if req.requested_by != code and not _is_admin(payload):
        raise HTTPException(status_code=403, detail="ยกเลิกได้เฉพาะคำขอของตัวเอง")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail="ยกเลิกได้เฉพาะคำขอที่ยังรออนุมัติ")
    req.status = "CANCELLED"
    await db.commit()
    return {"ok": True}


async def seed_stock_items(db: AsyncSession) -> None:
    """Seed a few common office supplies on first boot (idempotent)."""
    existing = (await db.execute(select(StockItem.id))).first()
    if existing:
        return
    defaults = [
        StockItem(name="กระดาษ A4 80 แกรม", sku="PPR-A4", category="กระดาษ", unit="รีม", quantity=50, min_qty=10),
        StockItem(name="ปากกาลูกลื่น น้ำเงิน", sku="PEN-BL", category="เครื่องเขียน", unit="ด้าม", quantity=120, min_qty=24),
        StockItem(name="หมึกพิมพ์ HP 678 ดำ", sku="INK-678K", category="หมึกพิมพ์", unit="ตลับ", quantity=8, min_qty=4),
        StockItem(name="แฟ้มสันกว้าง", sku="FLD-WD", category="แฟ้ม", unit="เล่ม", quantity=30, min_qty=10),
    ]
    db.add_all(defaults)
    await db.flush()
    for it in defaults:
        db.add(StockMovement(item_id=it.id, delta=it.quantity, balance_after=it.quantity, reason="RECEIVE"))
    await db.commit()
