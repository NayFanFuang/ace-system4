"""Revenue billing-plan targets (top-down) — per project × vendor × month."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_project_user
from app.models.billing_plan import BillingPlan

router = APIRouter(prefix="/api/billing-plan", tags=["Billing Plan"])


def _row(r: BillingPlan) -> dict:
    return {
        "id": r.id,
        "ace_project_code": r.ace_project_code,
        "vendor": r.vendor,
        "month": r.month,
        "planned_amount": float(r.planned_amount or 0),
        "note": r.note,
        "updated_by": r.updated_by,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


@router.get("")
async def list_plan(
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(BillingPlan))).scalars().all()
    return {"data": [_row(r) for r in rows], "total": len(rows)}


class PlanUpsertIn(BaseModel):
    ace_project_code: str
    month: str               # "YYYY-MM"
    planned_amount: float = 0
    vendor: str = "HW"
    note: str | None = None


@router.put("")
async def upsert_plan(
    body: PlanUpsertIn,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Set the planned target for one (project, vendor, month). amount=0 keeps the
    row (zero target); use it to clear a cell to zero."""
    now = datetime.now(timezone.utc)
    by = payload.get("employee_code") or payload.get("sub")
    stmt = pg_insert(BillingPlan).values(
        ace_project_code=body.ace_project_code,
        vendor=(body.vendor or "HW"),
        month=body.month,
        planned_amount=body.planned_amount or 0,
        note=body.note,
        updated_by=by,
        updated_at=now,
    ).on_conflict_do_update(
        index_elements=["ace_project_code", "vendor", "month"],
        set_={"planned_amount": body.planned_amount or 0, "note": body.note,
              "updated_by": by, "updated_at": now},
    ).returning(BillingPlan)
    row = (await db.execute(stmt)).scalar_one()
    await db.commit()
    return _row(row)
