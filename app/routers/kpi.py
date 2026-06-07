import io
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
# NOTE: KPI item/evaluation editing is open to PROJECT_ROLES (incl. PM, PROJECT_ADMIN,
# DIRECTOR) so a PM can fully manage their team's KPIs, not just HR.
from app.deps import get_current_user, require_monitor_user, require_project_user
from app.models.employee import Employee
from app.models.kpi import KpiEvaluation, KpiItem, KpiPeriodItem, KpiPeriodLock

router = APIRouter(prefix="/api/kpi", tags=["KPI"], dependencies=[Depends(require_monitor_user)])


# ── Schemas ───────────────────────────────────────────────────────────────────

class EvalRow(BaseModel):
    employee_name: str
    employee_code: str | None = None
    position: str | None = None
    period: str
    item_id: str
    main_evaluate: str | None = None
    evaluate_item: str | None = None
    weight: int = 0
    target: int = 100
    actual: float | None = None
    score: float | None = None
    remark: str | None = None
    evaluated_by: str | None = None
    rater_type: str = "PM"   # SELF | PM


class BulkImportRequest(BaseModel):
    items: list[dict[str, Any]] = []
    period_items: list[dict[str, Any]] = []
    evaluations: list[dict[str, Any]] = []


class KpiItemIn(BaseModel):
    item_id: str | None = None  # if None, auto-generate
    position: str | None = None
    main_evaluate: str
    evaluate_item: str
    weight: int = 10
    target: int = 100
    active: bool = True


class KpiItemPatchIn(BaseModel):
    position: str | None = None
    main_evaluate: str | None = None
    evaluate_item: str | None = None
    weight: int | None = None
    target: int | None = None
    active: bool | None = None


class KpiPeriodItemPatchIn(BaseModel):
    weight: int | None = None
    active: bool | None = None


class KpiPeriodItemUpsertIn(BaseModel):
    employee_name: str
    period: str
    item_id: str
    position: str | None = None
    weight: int | None = None
    active: bool | None = None


class EvalDeleteIn(BaseModel):
    employee_name: str
    period: str
    reason: str


class LockIn(BaseModel):
    employee_name: str
    period: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _item_dict(r: KpiItem) -> dict:
    return {
        "itemId": r.item_id,
        "position": r.position,
        "mainEvaluate": r.main_evaluate,
        "evaluateItem": r.evaluate_item,
        "weight": r.weight,
        "target": r.target,
        "active": r.active,
        "updatedAt": r.source_updated_at or "",
    }


def _eval_dict(r: KpiEvaluation) -> dict:
    return {
        "evalId": r.eval_id or "",
        "employeeName": r.employee_name,
        "employeeCode": r.employee_code or "",
        "position": r.position or "",
        "period": r.period,
        "itemId": r.item_id,
        "raterType": r.rater_type or "PM",
        "mainEvaluate": r.main_evaluate or "",
        "evaluateItem": r.evaluate_item or "",
        "weight": r.weight,
        "target": r.target,
        "actual": r.actual,
        "score": r.score,
        "remark": str(r.remark) if r.remark is not None else "",
        "updatedAt": r.source_updated_at or "",
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/employees")
async def kpi_employees(db: AsyncSession = Depends(get_db)):
    """Active project employees for KPI evaluation list."""
    rows = (
        await db.execute(
            select(Employee)
            .where(Employee.status == "ACTIVE")
            .order_by(Employee.full_name)
        )
    ).scalars().all()
    return {
        "employees": [
            {
                "name": r.full_name,
                "employeeCode": r.employee_code,
                "email": r.email or "",
                "projectName": r.project_name or "",
                "projectCode": r.project_code or r.project_team or "",
                "position": r.project_role or r.position or r.job_title or "",
                "active": r.status == "ACTIVE",
            }
            for r in rows
        ]
    }


@router.get("/periods")
async def kpi_periods(db: AsyncSession = Depends(get_db)):
    """Distinct periods available across kpi_period_items + kpi_evaluations, sorted descending."""
    result = await db.execute(text("""
        SELECT period, SUM(cnt)::INT AS total FROM (
            SELECT period, COUNT(*) AS cnt FROM kpi_period_items GROUP BY 1
            UNION ALL
            SELECT period, COUNT(*) AS cnt FROM kpi_evaluations WHERE deleted_at IS NULL GROUP BY 1
        ) u
        GROUP BY 1
        ORDER BY 1 DESC
    """))
    rows = result.mappings().all()
    return {
        "periods": [r["period"] for r in rows],
        "details": [{"period": r["period"], "count": r["total"]} for r in rows],
        "count": len(rows),
    }


# Employee position → KPI catalog position (from KPI_Position_Mapping.csv).
# Resolves naming gaps so an employee finds the right Main Evaluate set.
POSITION_ALIAS = {
    "drive test analysis engineer": "Drive Test Analysis",
    "senior site supervisor": "Sr.Supervisor",
    "store officer": "Inventory Management",
    "site engineer": "Site Supervisor",
    "dte": "Drive Test Engineer",
    "project coordinator and store officer": "Inventory Management",
    # "driver" → no KPI catalog (excluded)
}


def _resolve_position(position: str) -> str:
    return POSITION_ALIAS.get((position or "").strip().lower(), position)


@router.get("/items")
async def kpi_items(position: str = "", db: AsyncSession = Depends(get_db)):
    stmt = select(KpiItem).where(KpiItem.active == True)
    if position:
        stmt = stmt.where(KpiItem.position == _resolve_position(position))
    rows = (await db.execute(stmt.order_by(KpiItem.item_id))).scalars().all()
    return {"items": [_item_dict(r) for r in rows]}


@router.get("/period-items")
async def kpi_period_items(
    employee_name: str = "",
    period: str = "",
    db: AsyncSession = Depends(get_db),
):
    stmt = select(KpiPeriodItem).where(KpiPeriodItem.active == True)
    if employee_name:
        stmt = stmt.where(func.upper(KpiPeriodItem.employee_name) == employee_name.strip().upper())
    if period:
        stmt = stmt.where(KpiPeriodItem.period == period[:7])
    rows = (await db.execute(stmt.order_by(KpiPeriodItem.period.desc(), KpiPeriodItem.item_id))).scalars().all()
    # Enrich with catalog details (by item_id, ignoring position/active) so per-employee
    # items render even when the catalog row isn't in the position's active library.
    item_ids = {r.item_id for r in rows}
    cat = {}
    if item_ids:
        cat = {
            c.item_id: c
            for c in (await db.execute(select(KpiItem).where(KpiItem.item_id.in_(item_ids)))).scalars().all()
        }
    return {
        "periodItems": [
            {
                "period": r.period,
                "employeeName": r.employee_name,
                "position": r.position or "",
                "itemId": r.item_id,
                "weight": r.weight,
                "active": r.active,
                "mainEvaluate": (cat[r.item_id].main_evaluate if r.item_id in cat else "") or "",
                "evaluateItem": (cat[r.item_id].evaluate_item if r.item_id in cat else "") or "",
                "target": (cat[r.item_id].target if r.item_id in cat else 100) or 100,
                "updatedAt": r.source_updated_at or "",
            }
            for r in rows
        ]
    }


@router.get("/evaluations")
async def kpi_evaluations(
    employee_name: str = "",
    period: str = "",
    rater_type: str = "",
    db: AsyncSession = Depends(get_db),
):
    stmt = select(KpiEvaluation).where(KpiEvaluation.deleted_at.is_(None))
    if employee_name:
        stmt = stmt.where(func.upper(KpiEvaluation.employee_name) == employee_name.strip().upper())
    if period:
        stmt = stmt.where(KpiEvaluation.period == period[:7])
    if rater_type:
        stmt = stmt.where(KpiEvaluation.rater_type == rater_type.strip().upper())
    rows = (await db.execute(stmt.order_by(KpiEvaluation.period.desc(), KpiEvaluation.item_id))).scalars().all()
    return {"evaluations": [_eval_dict(r) for r in rows]}


@router.post("/evaluations")
async def save_evaluations(rows: list[EvalRow], db: AsyncSession = Depends(get_db)):
    """Upsert evaluation rows for one employee+period."""
    if not rows:
        raise HTTPException(400, "No rows provided.")

    # Block edits to a finalized (locked) employee+period — only PM rows are gated
    for key in {(r.employee_name.strip().upper(), r.period[:7]) for r in rows if (r.rater_type or "PM").upper() == "PM"}:
        locked = (
            await db.execute(
                select(KpiPeriodLock).where(
                    func.upper(KpiPeriodLock.employee_name) == key[0],
                    KpiPeriodLock.period == key[1],
                )
            )
        ).scalar_one_or_none()
        if locked:
            raise HTTPException(423, f"{key[0]} @ {key[1]} is finalized (locked). Unlock to edit.")

    for row in rows:
        rater = (row.rater_type or "PM").strip().upper()
        existing = (
            await db.execute(
                select(KpiEvaluation).where(
                    func.upper(KpiEvaluation.employee_name) == row.employee_name.strip().upper(),
                    KpiEvaluation.period == row.period[:7],
                    KpiEvaluation.item_id == row.item_id,
                    KpiEvaluation.rater_type == rater,
                )
            )
        ).scalar_one_or_none()

        if existing:
            # Re-saving = restore if soft-deleted
            existing.deleted_at = None
            existing.deleted_by = None
            existing.delete_reason = None
            existing.actual = row.actual
            existing.score = row.score
            existing.remark = row.remark
            existing.evaluate_item = row.evaluate_item or existing.evaluate_item
            existing.main_evaluate = row.main_evaluate or existing.main_evaluate
            existing.weight = row.weight if row.weight else existing.weight
            existing.target = row.target if row.target else existing.target
            existing.evaluated_by = row.evaluated_by
        else:
            db.add(KpiEvaluation(
                employee_name=row.employee_name.strip().upper(),
                employee_code=row.employee_code,
                position=row.position,
                period=row.period[:7],
                item_id=row.item_id,
                rater_type=rater,
                main_evaluate=row.main_evaluate,
                evaluate_item=row.evaluate_item,
                weight=row.weight,
                target=row.target,
                actual=row.actual,
                score=row.score,
                remark=row.remark,
                evaluated_by=row.evaluated_by,
            ))

    await db.commit()
    return {"success": True, "saved": len(rows)}


@router.get("/summary")
async def kpi_summary(period: str = "", db: AsyncSession = Depends(get_db)):
    """Evaluation summary grouped by project_code for a given period."""
    if not period:
        latest = (
            await db.execute(
                select(KpiPeriodItem.period).distinct().order_by(KpiPeriodItem.period.desc()).limit(1)
            )
        ).scalar_one_or_none()
        period = latest or ""

    # Employees with evaluation status
    employees = (
        await db.execute(
            select(Employee).where(Employee.status == "ACTIVE").order_by(Employee.full_name)
        )
    ).scalars().all()

    # Aggregate per-employee total score for this period
    scores_by_name: dict[str, dict] = {}
    if period:
        eval_rows = (
            await db.execute(
                select(KpiEvaluation).where(
                    KpiEvaluation.period == period[:7],
                    KpiEvaluation.rater_type == "PM",   # official scores only
                    KpiEvaluation.deleted_at.is_(None),
                )
            )
        ).scalars().all()
        for r in eval_rows:
            key = (r.employee_name or "").strip().upper()
            agg = scores_by_name.setdefault(key, {"score": 0.0, "weight": 0.0, "items": 0})
            if r.score is not None:
                agg["score"] += float(r.score)
            agg["weight"] += float(r.weight or 0)
            agg["items"] += 1
    evaluated_names = set(scores_by_name.keys())

    result: dict[str, dict] = {}
    for emp in employees:
        pc = emp.project_code or emp.project_team or "OTHER"
        if pc not in result:
            result[pc] = {
                "projectCode": pc,
                "projectName": emp.project_name or pc,
                "employees": [],
                "evaluated": 0,
                "total": 0,
                "totalScore": 0.0,
                "totalWeight": 0.0,
            }
        name_key = emp.full_name.strip().upper()
        agg = scores_by_name.get(name_key)
        is_eval = agg is not None
        emp_score = agg["score"] if agg else 0.0
        emp_weight = agg["weight"] if agg else 0.0
        result[pc]["employees"].append({
            "name": emp.full_name,
            "employeeCode": emp.employee_code,
            "position": emp.project_role or emp.position or emp.job_title or "",
            "evaluated": is_eval,
            "score": round(emp_score, 2),
            "weight": round(emp_weight, 2),
            "items": agg["items"] if agg else 0,
        })
        result[pc]["total"] += 1
        if is_eval:
            result[pc]["evaluated"] += 1
            result[pc]["totalScore"] += emp_score
            result[pc]["totalWeight"] += emp_weight

    for group in result.values():
        t = group["total"]
        group["pct"] = round(group["evaluated"] / t * 100) if t else 0
        e = group["evaluated"]
        group["avgScore"] = round(group["totalScore"] / e, 2) if e else 0.0

    # Also count unmatched evaluations (employees in KPI but not in employees table)
    matched_keys = {emp.full_name.strip().upper() for emp in employees}
    unmatched_eval = [n for n in evaluated_names if n not in matched_keys]

    return {
        "period": period,
        "projects": list(result.values()),
        "unmatched_count": len(unmatched_eval),
        "unmatched_names": sorted(unmatched_eval),
    }


@router.get("/export/scorecard")
async def export_scorecard(
    employee_name: str,
    period: str,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """KPI Scorecard PDF for one employee + period (official PM scores)."""
    from app.services.kpi_scorecard import build_scorecard_pdf

    period = period[:7]
    name = employee_name.strip()
    evals = (
        await db.execute(
            select(KpiEvaluation).where(
                func.upper(KpiEvaluation.employee_name) == name.upper(),
                KpiEvaluation.period == period,
                KpiEvaluation.rater_type == "PM",
                KpiEvaluation.deleted_at.is_(None),
            ).order_by(KpiEvaluation.item_id)
        )
    ).scalars().all()
    if not evals:
        raise HTTPException(404, f"No PM evaluation for {name} @ {period}")

    # Group by Main Evaluate (preserve first-seen order)
    order: list[str] = []
    agg: dict[str, dict] = {}
    for e in evals:
        m = (e.main_evaluate or "Others").strip()
        if m not in agg:
            agg[m] = {"main": m, "weight": 0.0, "score": 0.0}
            order.append(m)
        agg[m]["weight"] += float(e.weight or 0)
        agg[m]["score"] += float(e.score or 0)
    rows = []
    for m in order:
        g = agg[m]
        g["achieve"] = round(g["score"] / g["weight"] * 100, 1) if g["weight"] else 0.0
        rows.append(g)

    emp = (await db.execute(select(Employee).where(func.upper(Employee.full_name) == name.upper()))).scalar_one_or_none()
    proj_code = (emp.project_code if emp else None) or (evals[0].position or "")
    # strip leading team-code prefix (TE / RF) from the displayed project name
    proj_name = (emp.project_name if emp else "") or proj_code
    for _pref in ("TE ", "RF "):
        if proj_name.startswith(_pref):
            proj_name = proj_name[len(_pref):].strip()
            break
    sig_path = None
    if emp and emp.employee_code:
        p = f"/app/photos/signatures/{emp.employee_code}.png"
        sig_path = p if os.path.exists(p) else None

    meta = {
        "company": "Air Connect Engineering (Thailand) Company Limited",
        "title": "PROJECT MANAGEMENT TEAM KPI ASSESSMENT",
        "period": period,
        "project_code": proj_code,
        "project_name": proj_name,
        "name": emp.full_name if emp else name,
        "position": (emp.project_role or emp.position or emp.job_title) if emp else (evals[0].position or ""),
        "evaluated_at": (evals[0].updated_at.strftime("%Y-%m-%d") if evals and evals[0].updated_at else ""),
        "department": (emp.department if emp else "") or "Project",
        "employee_code": (emp.employee_code if emp else "") or "",
        "evaluated_by": (payload.get("name") or payload.get("employee_code") or "PM"),
    }
    pdf = build_scorecard_pdf(meta, rows, sig_path)
    fname = f"KPI_{meta['name']}_{period}.pdf".replace(" ", "_")
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})


@router.post("/import")
async def bulk_import(body: BulkImportRequest, db: AsyncSession = Depends(get_db)):
    """
    One-time seed from kpiSeed.js data sent by the frontend.
    Skips if tables already have data.
    """
    has_items = (await db.execute(select(func.count()).select_from(KpiItem))).scalar_one()
    has_evals = (await db.execute(select(func.count()).select_from(KpiEvaluation))).scalar_one()

    inserted = {"items": 0, "period_items": 0, "evaluations": 0}

    # KPI Items
    if not has_items and body.items:
        for chunk in _chunks(body.items, 200):
            stmt = pg_insert(KpiItem).values([
                {
                    "item_id": r.get("itemId", ""),
                    "position": r.get("position"),
                    "main_evaluate": r.get("mainEvaluate"),
                    "evaluate_item": r.get("evaluateItem"),
                    "weight": int(r.get("weight") or 0),
                    "target": int(r.get("target") or 100),
                    "active": r.get("active", True),
                    "source_updated_at": r.get("updatedAt"),
                }
                for r in chunk
            ]).on_conflict_do_nothing()
            await db.execute(stmt)
            inserted["items"] += len(chunk)
        await db.commit()

    # Period Items
    has_pi = (await db.execute(select(func.count()).select_from(KpiPeriodItem))).scalar_one()
    if not has_pi and body.period_items:
        for chunk in _chunks(body.period_items, 500):
            stmt = pg_insert(KpiPeriodItem).values([
                {
                    "period": str(r.get("period", ""))[:7],
                    "employee_name": str(r.get("employeeName", "")).strip().upper(),
                    "position": r.get("position"),
                    "item_id": r.get("itemId", ""),
                    "weight": int(r.get("weight") or 0),
                    "active": r.get("active", True),
                    "source_updated_at": r.get("updatedAt"),
                }
                for r in chunk
            ]).on_conflict_do_nothing()
            await db.execute(stmt)
            inserted["period_items"] += len(chunk)
        await db.commit()

    # Evaluations
    if not has_evals and body.evaluations:
        for chunk in _chunks(body.evaluations, 500):
            stmt = pg_insert(KpiEvaluation).values([
                {
                    "eval_id": r.get("evalId"),
                    "employee_name": str(r.get("employeeName", "")).strip().upper(),
                    "position": r.get("position"),
                    "period": str(r.get("period", ""))[:7],
                    "item_id": r.get("itemId", ""),
                    "main_evaluate": r.get("mainEvaluate"),
                    "evaluate_item": r.get("evaluateItem"),
                    "weight": int(r.get("weight") or 0),
                    "target": int(r.get("target") or 100),
                    "actual": _to_float(r.get("actual")),
                    "score": _to_float(r.get("score")),
                    "remark": str(r.get("remark")) if r.get("remark") is not None else None,
                    "source_updated_at": r.get("updatedAt"),
                }
                for r in chunk
            ]).on_conflict_do_nothing()
            await db.execute(stmt)
            inserted["evaluations"] += len(chunk)
        await db.commit()

    return {"success": True, "inserted": inserted}


def _chunks(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def _to_float(value) -> float | None:
    try:
        return float(value) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


# ── KPI Item CRUD (Manage Library) ────────────────────────────────────────────

@router.post("/items", status_code=201)
async def create_kpi_item(
    body: KpiItemIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.audit_service import write_audit_log
    item_id = (body.item_id or "").strip()
    if not item_id:
        # Auto-generate next KPI-#### code
        max_id = (await db.execute(text(
            "SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(item_id, '[^0-9]', '', 'g'), '')::INT), 0) FROM kpi_items"
        ))).scalar_one()
        item_id = f"KPI-{int(max_id) + 1:04d}"

    existing = (await db.execute(select(KpiItem).where(KpiItem.item_id == item_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, f"Item ID {item_id} already exists")

    row = KpiItem(
        item_id=item_id,
        position=body.position,
        main_evaluate=body.main_evaluate,
        evaluate_item=body.evaluate_item,
        weight=int(body.weight),
        target=int(body.target),
        active=bool(body.active),
        source_updated_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(row)
    await db.flush()
    await write_audit_log(
        db, action="kpi_item_created", entity_type="kpi_item", entity_id=row.id,
        payload=payload, new_value=_item_dict(row),
        changed_fields=["item_id", "position", "main_evaluate", "evaluate_item", "weight", "target"],
        request=request, source="KPI API",
    )
    await db.commit()
    return _item_dict(row)


@router.patch("/items/{item_id}")
async def update_kpi_item(
    item_id: str,
    body: KpiItemPatchIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.audit_service import write_audit_log
    row = (await db.execute(select(KpiItem).where(KpiItem.item_id == item_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "KPI item not found")

    old = _item_dict(row)
    changed = []
    for field, value in body.model_dump(exclude_none=True).items():
        if getattr(row, field) != value:
            setattr(row, field, value)
            changed.append(field)
    row.source_updated_at = datetime.now(timezone.utc).isoformat()

    if changed:
        await write_audit_log(
            db, action="kpi_item_updated", entity_type="kpi_item", entity_id=row.id,
            payload=payload, old_value=old, new_value=_item_dict(row),
            changed_fields=changed, request=request, source="KPI API",
        )
    await db.commit()
    return _item_dict(row)


@router.delete("/items/{item_id}")
async def delete_kpi_item(
    item_id: str,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete — sets active=false. Item remains in DB for history."""
    from app.services.audit_service import write_audit_log
    row = (await db.execute(select(KpiItem).where(KpiItem.item_id == item_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "KPI item not found")
    if not row.active:
        return {"status": "already_inactive", "item_id": item_id}
    row.active = False
    row.source_updated_at = datetime.now(timezone.utc).isoformat()
    await write_audit_log(
        db, action="kpi_item_deactivated", entity_type="kpi_item", entity_id=row.id,
        payload=payload, new_value={"active": False}, changed_fields=["active"],
        request=request, source="KPI API",
    )
    await db.commit()
    return {"status": "deactivated", "item_id": item_id}


# ── Period Items CRUD (Manage Modal) ──────────────────────────────────────────

@router.patch("/period-items/{pi_id}")
async def update_period_item(
    pi_id: int,
    body: KpiPeriodItemPatchIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.audit_service import write_audit_log
    row = (await db.execute(select(KpiPeriodItem).where(KpiPeriodItem.id == pi_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Period item not found")
    old = {"weight": row.weight, "active": row.active}
    changed = []
    if body.weight is not None and row.weight != body.weight:
        row.weight = int(body.weight)
        changed.append("weight")
    if body.active is not None and row.active != body.active:
        row.active = bool(body.active)
        changed.append("active")
    if changed:
        row.source_updated_at = datetime.now(timezone.utc).isoformat()
        await write_audit_log(
            db, action="kpi_period_item_updated", entity_type="kpi_period_item",
            entity_id=row.id, payload=payload,
            old_value=old, new_value={"weight": row.weight, "active": row.active},
            changed_fields=changed, request=request, source="KPI API",
        )
    await db.commit()
    return {"id": row.id, "weight": row.weight, "active": row.active}


@router.post("/period-items")
async def upsert_period_item(
    body: KpiPeriodItemUpsertIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Upsert a per-employee-per-period KPI item (weight/active) so edits don't touch the global catalog."""
    from app.services.audit_service import write_audit_log
    period = (body.period or "")[:7]
    name = (body.employee_name or "").strip()
    if not period or not name or not body.item_id:
        raise HTTPException(400, "employee_name, period and item_id are required")

    row = (
        await db.execute(
            select(KpiPeriodItem).where(
                func.upper(KpiPeriodItem.employee_name) == name.upper(),
                KpiPeriodItem.period == period,
                KpiPeriodItem.item_id == body.item_id,
            )
        )
    ).scalar_one_or_none()

    created = row is None
    old = None if created else {"weight": row.weight, "active": row.active}
    if created:
        row = KpiPeriodItem(
            period=period,
            employee_name=name,
            position=body.position,
            item_id=body.item_id,
            weight=int(body.weight) if body.weight is not None else 0,
            active=bool(body.active) if body.active is not None else True,
            source_updated_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(row)
        await db.flush()
    else:
        if body.weight is not None:
            row.weight = int(body.weight)
        if body.active is not None:
            row.active = bool(body.active)
        if body.position:
            row.position = body.position
        row.source_updated_at = datetime.now(timezone.utc).isoformat()

    await write_audit_log(
        db, action="kpi_period_item_created" if created else "kpi_period_item_updated",
        entity_type="kpi_period_item", entity_id=row.id, payload=payload,
        old_value=old, new_value={"weight": row.weight, "active": row.active},
        changed_fields=["weight", "active"], request=request, source="KPI API",
    )
    await db.commit()
    return {"id": row.id, "period": row.period, "employeeName": row.employee_name,
            "itemId": row.item_id, "weight": row.weight, "active": row.active, "created": created}


# ── Finalize / Lock (per employee + period) ───────────────────────────────────

@router.get("/locks")
async def list_locks(period: str = "", db: AsyncSession = Depends(get_db)):
    stmt = select(KpiPeriodLock)
    if period:
        stmt = stmt.where(KpiPeriodLock.period == period[:7])
    rows = (await db.execute(stmt)).scalars().all()
    return {"locks": [{"employeeName": r.employee_name, "period": r.period, "lockedBy": r.locked_by, "lockedAt": r.locked_at.isoformat() if r.locked_at else None} for r in rows]}


@router.post("/lock")
async def lock_period(body: LockIn, payload: dict = Depends(require_project_user), db: AsyncSession = Depends(get_db)):
    name = body.employee_name.strip().upper()
    period = body.period[:7]
    existing = (
        await db.execute(select(KpiPeriodLock).where(func.upper(KpiPeriodLock.employee_name) == name, KpiPeriodLock.period == period))
    ).scalar_one_or_none()
    if existing:
        return {"status": "already_locked", "employeeName": name, "period": period}
    db.add(KpiPeriodLock(employee_name=name, period=period, locked_by=payload.get("employee_code") or payload.get("sub")))
    await db.commit()
    return {"status": "locked", "employeeName": name, "period": period}


@router.delete("/lock")
async def unlock_period(body: LockIn, payload: dict = Depends(require_project_user), db: AsyncSession = Depends(get_db)):
    name = body.employee_name.strip().upper()
    period = body.period[:7]
    existing = (
        await db.execute(select(KpiPeriodLock).where(func.upper(KpiPeriodLock.employee_name) == name, KpiPeriodLock.period == period))
    ).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
    return {"status": "unlocked", "employeeName": name, "period": period}


# ── Evaluations Soft Delete (Re-Eval) ─────────────────────────────────────────

@router.delete("/evaluations")
async def soft_delete_evaluations(
    body: EvalDeleteIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete all evaluation rows for an employee+period (Re-Eval)."""
    from app.services.audit_service import write_audit_log
    if not body.reason or len(body.reason.strip()) < 3:
        raise HTTPException(400, "Reason is required (min 3 chars)")

    emp_key = body.employee_name.strip().upper()
    period = body.period[:7]
    user_code = payload.get("employeeCode") or payload.get("email") or "system"

    rows = (await db.execute(
        select(KpiEvaluation).where(
            func.upper(KpiEvaluation.employee_name) == emp_key,
            KpiEvaluation.period == period,
            KpiEvaluation.deleted_at.is_(None),
        )
    )).scalars().all()

    if not rows:
        raise HTTPException(404, "No active evaluations found for this employee+period")

    now = datetime.now(timezone.utc)
    for r in rows:
        r.deleted_at = now
        r.deleted_by = user_code[:40]
        r.delete_reason = body.reason.strip()

    await write_audit_log(
        db, action="kpi_evaluation_soft_deleted", entity_type="kpi_evaluation",
        entity_id=None, payload=payload,
        new_value={"employee_name": emp_key, "period": period, "rows": len(rows), "reason": body.reason.strip()},
        changed_fields=["deleted_at", "delete_reason"],
        request=request, source="KPI API",
    )
    await db.commit()
    return {"status": "soft_deleted", "employee_name": emp_key, "period": period, "rows_deleted": len(rows)}


@router.post("/evaluations/restore")
async def restore_evaluations(
    body: EvalDeleteIn,
    request: Request,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore soft-deleted evaluations."""
    from app.services.audit_service import write_audit_log
    emp_key = body.employee_name.strip().upper()
    period = body.period[:7]
    rows = (await db.execute(
        select(KpiEvaluation).where(
            func.upper(KpiEvaluation.employee_name) == emp_key,
            KpiEvaluation.period == period,
            KpiEvaluation.deleted_at.is_not(None),
        )
    )).scalars().all()
    if not rows:
        raise HTTPException(404, "No deleted evaluations found")
    for r in rows:
        r.deleted_at = None
        r.deleted_by = None
        r.delete_reason = None
    await write_audit_log(
        db, action="kpi_evaluation_restored", entity_type="kpi_evaluation",
        entity_id=None, payload=payload,
        new_value={"employee_name": emp_key, "period": period, "rows": len(rows)},
        changed_fields=["deleted_at"], request=request, source="KPI API",
    )
    await db.commit()
    return {"status": "restored", "rows_restored": len(rows)}
