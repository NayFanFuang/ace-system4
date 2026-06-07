"""Employee self-assessment endpoints — a logged-in user can only read/write
their OWN KPI with rater_type=SELF. Separate from the PM router (no monitor gate)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.employee import Employee
from app.models.kpi import KpiEvaluation, KpiItem, KpiPeriodItem
from app.routers.kpi import _resolve_position

router = APIRouter(prefix="/api/kpi/self", tags=["KPI Self"])


class SelfRow(BaseModel):
    item_id: str
    main_evaluate: str | None = None
    evaluate_item: str | None = None
    weight: int = 0
    target: int = 100
    actual: float | None = None
    score: float | None = None


class SelfSaveIn(BaseModel):
    period: str
    rows: list[SelfRow]


async def _own_employee(payload: dict, db: AsyncSession) -> Employee:
    code = payload.get("employee_code") or payload.get("sub")
    emp = (
        await db.execute(select(Employee).where(Employee.employee_code == code))
    ).scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "No employee profile linked to this account")
    return emp


def _emp_position(emp: Employee) -> str:
    return emp.project_role or emp.position or emp.job_title or ""


@router.get("")
async def my_kpi(period: str = "", payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    emp = await _own_employee(payload, db)
    name = emp.full_name.strip()
    position = _emp_position(emp)

    # Item set: this employee's curated period-items (closest period), else catalog by position
    pis = (
        await db.execute(
            select(KpiPeriodItem).where(
                func.upper(KpiPeriodItem.employee_name) == name.upper(),
                KpiPeriodItem.active == True,
            )
        )
    ).scalars().all()
    avail = sorted({p.period for p in pis}, reverse=True)
    resolved = period[:7] if period[:7] in avail else (avail[0] if avail else period[:7])
    match = [p for p in pis if p.period == resolved]

    if match:
        cat = {
            c.item_id: c
            for c in (await db.execute(select(KpiItem).where(KpiItem.item_id.in_([p.item_id for p in match])))).scalars().all()
        }
        items = [{
            "itemId": p.item_id,
            "mainEvaluate": (cat.get(p.item_id).main_evaluate if cat.get(p.item_id) else "") or "",
            "evaluateItem": (cat.get(p.item_id).evaluate_item if cat.get(p.item_id) else "") or "",
            "weight": p.weight or (cat.get(p.item_id).weight if cat.get(p.item_id) else 0) or 0,
            "target": (cat.get(p.item_id).target if cat.get(p.item_id) else 100) or 100,
        } for p in match]
    else:
        cat_rows = (
            await db.execute(
                select(KpiItem).where(KpiItem.active == True, KpiItem.position == _resolve_position(position)).order_by(KpiItem.item_id)
            )
        ).scalars().all()
        items = [{
            "itemId": c.item_id, "mainEvaluate": c.main_evaluate or "", "evaluateItem": c.evaluate_item or "",
            "weight": c.weight or 0, "target": c.target or 100,
        } for c in cat_rows]

    # Own SELF evaluations for this period
    selfs = (
        await db.execute(
            select(KpiEvaluation).where(
                func.upper(KpiEvaluation.employee_name) == name.upper(),
                KpiEvaluation.period == period[:7],
                KpiEvaluation.rater_type == "SELF",
                KpiEvaluation.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    self_map = {s.item_id: s for s in selfs}
    for it in items:
        s = self_map.get(it["itemId"])
        it["actual"] = s.actual if s else None
        it["score"] = s.score if s else None
        # Employee may set their own target for the round; show what they saved.
        if s and s.target:
            it["target"] = s.target

    return {
        "employee": {"name": emp.full_name, "position": position, "projectName": emp.project_name or "", "employeeCode": emp.employee_code},
        "period": period[:7],
        "items": items,
    }


@router.post("")
async def save_my_kpi(body: SelfSaveIn, payload: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    emp = await _own_employee(payload, db)
    name = emp.full_name.strip().upper()
    period = body.period[:7]
    if not body.rows:
        raise HTTPException(400, "No rows provided")

    for r in body.rows:
        existing = (
            await db.execute(
                select(KpiEvaluation).where(
                    func.upper(KpiEvaluation.employee_name) == name,
                    KpiEvaluation.period == period,
                    KpiEvaluation.item_id == r.item_id,
                    KpiEvaluation.rater_type == "SELF",
                )
            )
        ).scalar_one_or_none()
        if existing:
            existing.deleted_at = None
            existing.actual = r.actual
            existing.score = r.score
            existing.weight = r.weight or existing.weight
            existing.target = r.target or existing.target
            existing.main_evaluate = r.main_evaluate or existing.main_evaluate
            existing.evaluate_item = r.evaluate_item or existing.evaluate_item
            existing.source_updated_at = datetime.now(timezone.utc).isoformat()
        else:
            db.add(KpiEvaluation(
                employee_name=name, employee_code=emp.employee_code, position=_emp_position(emp),
                period=period, item_id=r.item_id, rater_type="SELF",
                main_evaluate=r.main_evaluate, evaluate_item=r.evaluate_item,
                weight=r.weight, target=r.target, actual=r.actual, score=r.score,
                evaluated_by=emp.employee_code,
                source_updated_at=datetime.now(timezone.utc).isoformat(),
            ))
    await db.commit()
    return {"success": True, "saved": len(body.rows)}
