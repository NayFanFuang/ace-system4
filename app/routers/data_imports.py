"""Master-data upload audit log (PO / ISDP / MasterDB).

Provides /api/data-imports/last for the Master Data tab to surface "last
upload" timestamps + counts at a glance. Other upload endpoints write to
this log via `record_data_import` so admins can see staleness without
digging through server logs.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_project_user
from app.models.data_import import DataImport
from app.models.employee import ProjectPO, ProjectSite

router = APIRouter(prefix="/api/data-imports", tags=["Data Imports"])

KNOWN_TYPES = ("PO", "ISDP", "MASTERDB")


async def record_data_import(
    db: AsyncSession,
    *,
    file_type: str,
    file_name: str | None = None,
    row_count: int = 0,
    inserted: int = 0,
    updated: int = 0,
    skipped: int = 0,
    status: str = "SUCCESS",
    note: str | None = None,
    uploaded_by_code: str | None = None,
    uploaded_by_name: str | None = None,
) -> DataImport:
    """Insert one audit row for a successful (or failed) import. Caller
    must commit. Safe to call from any import endpoint."""
    row = DataImport(
        file_type=file_type.upper(),
        file_name=file_name,
        row_count=int(row_count or 0),
        inserted=int(inserted or 0),
        updated=int(updated or 0),
        skipped=int(skipped or 0),
        status=status,
        note=note,
        uploaded_by_code=uploaded_by_code,
        uploaded_by_name=uploaded_by_name,
    )
    db.add(row)
    await db.flush()
    return row


def _row_to_dict(row: DataImport) -> dict:
    return {
        "id": row.id,
        "file_type": row.file_type,
        "file_name": row.file_name,
        "row_count": row.row_count,
        "inserted": row.inserted,
        "updated": row.updated,
        "skipped": row.skipped,
        "status": row.status,
        "note": row.note,
        "uploaded_by_code": row.uploaded_by_code,
        "uploaded_by_name": row.uploaded_by_name,
        "uploaded_at": row.uploaded_at.isoformat() if row.uploaded_at else None,
    }


@router.get("/last")
async def last_per_type(
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the most recent successful import per file_type, alongside
    current data totals (so the UI can show "what's in the system right now"
    even if the last upload row predates the audit table). Missing types
    return null so the UI can show "never uploaded"."""
    out: dict[str, dict | None] = {t: None for t in KNOWN_TYPES}
    for file_type in KNOWN_TYPES:
        row = (await db.execute(
            select(DataImport)
            .where(DataImport.file_type == file_type, DataImport.status.in_(["SUCCESS", "PARTIAL"]))
            .order_by(DataImport.uploaded_at.desc())
            .limit(1)
        )).scalar_one_or_none()
        if row:
            out[file_type] = _row_to_dict(row)

    # Current totals — independent of when the audit log started
    total_sites = (await db.execute(select(func.count()).select_from(ProjectSite))).scalar_one()
    sites_with_geo = (await db.execute(
        select(func.count()).select_from(ProjectSite)
        .where(ProjectSite.lat.isnot(None), ProjectSite.lng.isnot(None))
    )).scalar_one()
    sites_with_rf = (await db.execute(
        select(func.count()).select_from(ProjectSite).where(ProjectSite.rf_cluster_name.isnot(None))
    )).scalar_one()
    total_pos = (await db.execute(select(func.count()).select_from(ProjectPO))).scalar_one()
    pos_with_project = (await db.execute(
        select(func.count()).select_from(ProjectPO).where(ProjectPO.ace_project_code.isnot(None))
    )).scalar_one()

    return {
        "data": out,
        "totals": {
            "MASTERDB": {"sites": int(total_sites), "with_gps": int(sites_with_geo)},
            "ISDP":     {"sites": int(total_sites), "with_rf_cluster": int(sites_with_rf)},
            "PO":       {"pos": int(total_pos), "with_project": int(pos_with_project)},
        },
    }


@router.get("/history")
async def history(
    file_type: str | None = None,
    limit: int = 50,
    payload: dict = Depends(require_project_user),
    db: AsyncSession = Depends(get_db),
):
    """Recent import history for one type (or all). Latest first."""
    stmt = select(DataImport).order_by(DataImport.uploaded_at.desc()).limit(min(int(limit or 50), 500))
    if file_type:
        stmt = stmt.where(DataImport.file_type == file_type.upper())
    rows = (await db.execute(stmt)).scalars().all()
    return {"data": [_row_to_dict(r) for r in rows], "total": len(rows)}
