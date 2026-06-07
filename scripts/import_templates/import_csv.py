#!/usr/bin/env python3
"""Import historical employees / clock_sites / clock_sessions from CSV files.

Usage (inside backend container):
  python /app/scripts/import_csv.py --dry-run /app/scripts/import_templates/
  python /app/scripts/import_csv.py /app/scripts/import_templates/

Behaviour:
  - employees: UPSERT by employee_code (insert new, update existing).
  - clock_sites: UPSERT by site_code.
  - clock_sessions: INSERT only (skipped if (employee_code, work_date, clock_in_at)
    already exists), since sessions are append-only events.
  - Empty cells become NULL; "true"/"false" → boolean; ISO timestamps parsed.
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import sys
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import from app package (script runs inside backend container)
sys.path.insert(0, "/app")
from app.database import SessionLocal
from app.models.clock import ClockSession, ClockSite
from app.models.employee import Employee


EMPLOYEES_FILE = "01_employees_sample.csv"
SITES_FILE     = "02_clock_sites_sample.csv"
SESSIONS_FILE  = "03_clock_sessions_sample.csv"


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip()
    return v if v != "" else None


def parse_bool(value: str | None) -> bool:
    v = (value or "").strip().lower()
    return v in {"true", "1", "yes", "y", "t"}


def parse_date(value: str | None) -> date | None:
    v = clean(value)
    if not v:
        return None
    return date.fromisoformat(v[:10])


def parse_dt(value: str | None) -> datetime | None:
    v = clean(value)
    if not v:
        return None
    return datetime.fromisoformat(v)


def parse_float(value: str | None) -> float | None:
    v = clean(value)
    return float(v) if v is not None else None


def parse_int(value: str | None, default: int | None = None) -> int | None:
    v = clean(value)
    return int(v) if v is not None else default


async def import_employees(db: AsyncSession, path: Path, dry_run: bool) -> dict[str, int]:
    stats = {"inserted": 0, "updated": 0, "skipped": 0}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = clean(row.get("employee_code"))
            if not code:
                stats["skipped"] += 1
                continue
            existing = (await db.execute(
                select(Employee).where(Employee.employee_code == code)
            )).scalar_one_or_none()
            data = dict(
                employee_code   = code,
                full_name       = clean(row.get("full_name")) or code,
                first_name      = clean(row.get("first_name")),
                last_name       = clean(row.get("last_name")),
                email           = clean(row.get("email")),
                phone           = clean(row.get("phone")),
                department      = clean(row.get("department")) or "Project",
                project_team    = clean(row.get("project_team")) or "RF",
                project_role    = clean(row.get("project_role")),
                position        = clean(row.get("position")),
                job_title       = clean(row.get("job_title")),
                manager_code    = clean(row.get("manager_code")),
                status          = clean(row.get("status")) or "ACTIVE",
                hire_date       = parse_date(row.get("hire_date")),
                employment_type = clean(row.get("employment_type")),
                source          = "import_csv",
            )
            if existing:
                for k, v in data.items():
                    if v is not None:
                        setattr(existing, k, v)
                stats["updated"] += 1
            else:
                db.add(Employee(**data))
                stats["inserted"] += 1
        if not dry_run:
            await db.commit()
    return stats


async def import_sites(db: AsyncSession, path: Path, dry_run: bool) -> dict[str, int]:
    stats = {"inserted": 0, "updated": 0, "skipped": 0}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = clean(row.get("site_code"))
            if not code:
                stats["skipped"] += 1
                continue
            existing = (await db.execute(
                select(ClockSite).where(ClockSite.site_code == code)
            )).scalar_one_or_none()
            data = dict(
                site_code    = code,
                site_name    = clean(row.get("site_name")),
                customer     = clean(row.get("customer")),
                project_code = clean(row.get("project_code")),
                lat          = parse_float(row.get("lat")),
                lng          = parse_float(row.get("lng")),
                gps_radius_m = parse_int(row.get("gps_radius_m"), 500),
                is_active    = parse_bool(row.get("is_active") or "true"),
            )
            if existing:
                for k, v in data.items():
                    if v is not None:
                        setattr(existing, k, v)
                stats["updated"] += 1
            else:
                db.add(ClockSite(**data))
                stats["inserted"] += 1
        if not dry_run:
            await db.commit()
    return stats


async def import_sessions(db: AsyncSession, path: Path, dry_run: bool) -> dict[str, int]:
    stats = {"inserted": 0, "duplicate": 0, "skipped": 0}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = clean(row.get("employee_code"))
            work_date = parse_date(row.get("work_date"))
            clock_in = parse_dt(row.get("clock_in_at"))
            if not (code and work_date and clock_in):
                stats["skipped"] += 1
                continue
            existing = (await db.execute(
                select(ClockSession).where(
                    ClockSession.employee_code == code,
                    ClockSession.work_date == work_date,
                    ClockSession.clock_in_at == clock_in,
                )
            )).scalar_one_or_none()
            if existing:
                stats["duplicate"] += 1
                continue
            data = dict(
                employee_code = code,
                clock_type    = clean(row.get("clock_type")) or "DAILY",
                work_date     = work_date,
                site_code     = clean(row.get("site_code")),
                site_name     = clean(row.get("site_name")),
                clock_in_at   = clock_in,
                lat_in        = parse_float(row.get("lat_in")),
                lng_in        = parse_float(row.get("lng_in")),
                clock_out_at  = parse_dt(row.get("clock_out_at")),
                lat_out       = parse_float(row.get("lat_out")),
                lng_out       = parse_float(row.get("lng_out")),
                status        = clean(row.get("status")) or "ACTIVE",
            )
            db.add(ClockSession(**data))
            stats["inserted"] += 1
        if not dry_run:
            await db.commit()
    return stats


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", help="Folder containing the 3 CSV files")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, do not commit")
    parser.add_argument("--only", choices=["employees", "sites", "sessions"], help="Import only one table")
    args = parser.parse_args()

    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        print(f"❌ Not a folder: {folder}")
        return 2

    mode = "DRY-RUN" if args.dry_run else "COMMIT"
    print(f"\n📦 Import folder: {folder}   ({mode})")

    async with SessionLocal() as db:
        if args.only in (None, "employees"):
            path = folder / EMPLOYEES_FILE
            if path.exists():
                s = await import_employees(db, path, args.dry_run)
                print(f"  employees       inserted={s['inserted']} updated={s['updated']} skipped={s['skipped']}")
            else:
                print(f"  employees       ⚠ file not found: {path.name}")

        if args.only in (None, "sites"):
            path = folder / SITES_FILE
            if path.exists():
                s = await import_sites(db, path, args.dry_run)
                print(f"  clock_sites     inserted={s['inserted']} updated={s['updated']} skipped={s['skipped']}")
            else:
                print(f"  clock_sites     ⚠ file not found: {path.name}")

        if args.only in (None, "sessions"):
            path = folder / SESSIONS_FILE
            if path.exists():
                s = await import_sessions(db, path, args.dry_run)
                print(f"  clock_sessions  inserted={s['inserted']} duplicate={s['duplicate']} skipped={s['skipped']}")
            else:
                print(f"  clock_sessions  ⚠ file not found: {path.name}")

    print(f"\n✓ Done ({mode})\n")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
