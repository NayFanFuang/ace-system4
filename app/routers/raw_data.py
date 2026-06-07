"""Raw-data viewer endpoints — read-only generic table browser for SUPER_ADMIN.

Exposes a whitelisted set of tables with column metadata, pagination, search,
and CSV export. PII-sensitive columns (password hashes, JWT secrets) are
hard-excluded at the source dict, not at filter time.
"""
from datetime import date, datetime, time
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user


router = APIRouter(prefix="/api/admin/raw-data", tags=["Raw Data"])


# Whitelist: { source_key: (table_name, label, default_order_by, excluded_columns) }
# Order matters for the UI tab list.
SOURCES: dict[str, dict] = {
    "clock_sessions":   {"table": "clock_sessions",   "label": "Clock Sessions",    "order_by": "id DESC",            "exclude": []},
    "clock_sites":      {"table": "clock_sites",      "label": "Clock Sites",       "order_by": "id ASC",             "exclude": []},
    "employees":        {"table": "employees",        "label": "Employees",         "order_by": "id ASC",             "exclude": []},
    "project_pos":      {"table": "project_pos",      "label": "Project POs",       "order_by": "id DESC",            "exclude": []},
    "project_sites":    {"table": "project_sites",    "label": "Project Sites",     "order_by": "id DESC",            "exclude": []},
    "project_catalog":  {"table": "project_catalog",  "label": "Project Catalog",   "order_by": "id ASC",             "exclude": []},
    "leave_requests":   {"table": "leave_requests",   "label": "Leave Requests",    "order_by": "id DESC",            "exclude": []},
    "daily_work_logs":  {"table": "daily_work_logs",  "label": "Daily Work Logs",   "order_by": "id DESC",            "exclude": []},
    "kpi_evaluations":  {"table": "kpi_evaluations",  "label": "KPI Evaluations",   "order_by": "id DESC",            "exclude": []},
    "kpi_items":        {"table": "kpi_items",        "label": "KPI Items",         "order_by": "id ASC",             "exclude": []},
    "kpi_period_items": {"table": "kpi_period_items", "label": "KPI Period Items",  "order_by": "id ASC",             "exclude": []},
    "audit_logs":       {"table": "audit_logs",       "label": "Audit Logs",        "order_by": "created_at DESC",    "exclude": []},
    "email_outbox":     {"table": "email_outbox",     "label": "Email Outbox",      "order_by": "id DESC",            "exclude": []},
    "auth_users":       {"table": "auth_users",       "label": "Auth Users",        "order_by": "id ASC",             "exclude": ["password_hash"]},
    "system_settings":  {"table": "system_settings",  "label": "System Settings",   "order_by": "key ASC",            "exclude": []},
    "system_error_logs":{"table": "system_error_logs","label": "System Errors",     "order_by": "created_at DESC",    "exclude": []},
    "hw_import_logs":   {"table": "hw_import_logs",   "label": "HW Import Logs",    "order_by": "id DESC",            "exclude": []},
    "bill_corrections": {"table": "bill_corrections", "label": "Bill Corrections",  "order_by": "id DESC",            "exclude": []},
    "hr_departments":   {"table": "hr_departments",   "label": "HR Departments",    "order_by": "id ASC",             "exclude": []},
    "hr_positions":     {"table": "hr_positions",     "label": "HR Positions",      "order_by": "id ASC",             "exclude": []},
}


def _require_admin(payload: dict) -> None:
    if payload.get("role") not in {"SUPER_ADMIN", "SYSTEM_ADMIN"}:
        raise HTTPException(status_code=403, detail="Not allowed")


def _serialize_cell(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (bytes, bytearray)):
        return f"<{len(value)} bytes>"
    if isinstance(value, (dict, list)):
        return value
    return value


async def _table_columns(db: AsyncSession, table_name: str, excluded: list[str]) -> list[dict]:
    rows = (await db.execute(text(
        """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :t
        ORDER BY ordinal_position
        """
    ), {"t": table_name})).mappings().all()
    excluded_set = set(excluded or [])
    return [
        {"name": r["column_name"], "type": r["data_type"], "nullable": r["is_nullable"] == "YES"}
        for r in rows if r["column_name"] not in excluded_set
    ]


def _text_search_clause(columns: list[dict]) -> str:
    """Build an ILIKE clause across all text-ish columns (cast non-text to text)."""
    parts = []
    for c in columns:
        parts.append(f'CAST("{c["name"]}" AS TEXT) ILIKE :q')
    return " OR ".join(parts) if parts else "FALSE"


def _build_filter_clauses(filters: List[str], columns: list[dict]) -> tuple[list[str], dict]:
    """Parse repeated ?filter=col:value into safe AND ILIKE clauses.

    Column names are validated against the table's column whitelist; values
    are passed as parameters so they cannot inject SQL.
    """
    col_names = {c["name"] for c in columns}
    clauses: list[str] = []
    params: dict = {}
    for i, raw in enumerate(filters or []):
        if not raw or ":" not in raw:
            continue
        col, _, value = raw.partition(":")
        col = col.strip()
        value = value.strip()
        if not col or not value:
            continue
        if col not in col_names:
            raise HTTPException(400, f"Unknown filter column: {col}")
        key = f"f{i}"
        clauses.append(f'CAST("{col}" AS TEXT) ILIKE :{key}')
        params[key] = f"%{value}%"
    return clauses, params


@router.get("/sources")
async def list_sources(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    out = []
    for key, cfg in SOURCES.items():
        try:
            total = int((await db.execute(text(f'SELECT COUNT(*) FROM "{cfg["table"]}"'))).scalar_one() or 0)
        except Exception:
            total = -1
        out.append({"key": key, "label": cfg["label"], "table": cfg["table"], "total": total})
    return {"data": out}


@router.get("/{source}")
async def get_source_rows(
    source: str,
    q: str | None = Query(None, description="Full-row substring search (ILIKE across all visible columns)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order_by: str | None = Query(None, description="Override default order_by (column [ASC|DESC])"),
    filter: List[str] = Query(default_factory=list, description='Per-column filter "col:value" (repeatable, ANDed)'),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    cfg = SOURCES.get(source)
    if not cfg:
        raise HTTPException(404, "Unknown source")

    table_name = cfg["table"]
    columns = await _table_columns(db, table_name, cfg["exclude"])
    if not columns:
        raise HTTPException(500, "Table has no readable columns")

    col_list = ", ".join(f'"{c["name"]}"' for c in columns)
    where_parts: list[str] = []
    params: dict = {}
    if q and q.strip():
        where_parts.append(f"({_text_search_clause(columns)})")
        params["q"] = f"%{q.strip()}%"
    filter_clauses, filter_params = _build_filter_clauses(filter, columns)
    where_parts.extend(filter_clauses)
    params.update(filter_params)
    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    total = int((await db.execute(
        text(f'SELECT COUNT(*) FROM "{table_name}" {where}'), params
    )).scalar_one() or 0)

    order_clause = order_by.strip() if order_by else cfg["order_by"]
    # Whitelist guard: order_by must reference a real column name + optional ASC/DESC.
    # Avoid SQL injection by tokenising and re-validating.
    safe_order = _validate_order(order_clause, columns)

    rows = (await db.execute(
        text(f'SELECT {col_list} FROM "{table_name}" {where} ORDER BY {safe_order} LIMIT :limit OFFSET :offset'),
        {**params, "limit": limit, "offset": offset},
    )).mappings().all()

    data = [{c["name"]: _serialize_cell(r[c["name"]]) for c in columns} for r in rows]
    return {
        "source": source,
        "label": cfg["label"],
        "table": table_name,
        "columns": columns,
        "data": data,
        "total": total,
        "limit": limit,
        "offset": offset,
        "order_by": safe_order,
    }


def _validate_order(clause: str, columns: list[dict]) -> str:
    col_names = {c["name"] for c in columns}
    # Allow multiple comma-separated terms.
    parts = [p.strip() for p in clause.split(",") if p.strip()]
    out = []
    for p in parts:
        tokens = p.split()
        col = tokens[0].strip('"')
        direction = (tokens[1].upper() if len(tokens) > 1 else "ASC")
        if col not in col_names:
            raise HTTPException(400, f"Unknown order column: {col}")
        if direction not in ("ASC", "DESC"):
            raise HTTPException(400, f"Bad direction: {direction}")
        out.append(f'"{col}" {direction}')
    return ", ".join(out) if out else f'"{list(col_names)[0]}" ASC'


@router.get("/{source}/export")
async def export_source_csv(
    source: str,
    q: str | None = None,
    order_by: str | None = None,
    filter: List[str] = Query(default_factory=list),
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_admin(payload)
    cfg = SOURCES.get(source)
    if not cfg:
        raise HTTPException(404, "Unknown source")

    table_name = cfg["table"]
    columns = await _table_columns(db, table_name, cfg["exclude"])
    col_list = ", ".join(f'"{c["name"]}"' for c in columns)
    where_parts: list[str] = []
    params: dict = {}
    if q and q.strip():
        where_parts.append(f"({_text_search_clause(columns)})")
        params["q"] = f"%{q.strip()}%"
    filter_clauses, filter_params = _build_filter_clauses(filter, columns)
    where_parts.extend(filter_clauses)
    params.update(filter_params)
    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
    safe_order = _validate_order(order_by or cfg["order_by"], columns)

    rows = (await db.execute(
        text(f'SELECT {col_list} FROM "{table_name}" {where} ORDER BY {safe_order} LIMIT 50000'),
        params,
    )).mappings().all()

    import csv
    import io
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([c["name"] for c in columns])
    for r in rows:
        writer.writerow([
            "" if r[c["name"]] is None else
            (str(_serialize_cell(r[c["name"]])) if not isinstance(r[c["name"]], (dict, list)) else str(r[c["name"]]))
            for c in columns
        ])
    buf.seek(0)
    fname = f"{table_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
