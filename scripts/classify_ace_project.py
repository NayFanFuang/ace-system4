"""Phase 1: classify each PO into an ACE project_code.

Rule (as of 2026-06-05):
  1. Project Name contains "AIS"                         → HWT2604
  2. item_dis starts "B_" (TRUE) + Publish < cutoff      → HWT2304
  3. item_dis starts "B_" (TRUE) + Publish >= cutoff     → HWT2601
  4. item_dis starts "C_" (NPM)                          → None (NEED_REVIEW)
  5. anything else                                        → None (NEED_REVIEW)

cutoff default 2026-06-05 (HWT2601 starts from this date onward).

Usage (inside backend container):
  python /app/classify_ace_project.py --dry-run
  python /app/classify_ace_project.py            # commit
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from collections import Counter
from datetime import date, datetime

sys.path.insert(0, "/app")
from sqlalchemy import select
from app.database import SessionLocal
from app.models.employee import ProjectPO

CUTOFF = date(2026, 6, 5)


def _parse_date(s):
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19] if " " in s else s[:10], fmt).date()
        except ValueError:
            continue
    return None


def classify_ace_project(project_name, item_dis, publish_date, cutoff=CUTOFF):
    """Return (ace_project_code | None, reason)."""
    pn = (project_name or "").upper()
    item = (item_dis or "").strip()

    if item.startswith("A_"):
        return "HWT2604", "A_ item"
    if item.startswith("B_"):
        pd = _parse_date(publish_date) if not isinstance(publish_date, date) else publish_date
        if pd and pd >= cutoff:
            return "HWT2601", f"TRUE B_ + publish>={cutoff}"
        return "HWT2304", "TRUE B_ + publish<cutoff"
    if item.startswith("C_"):
        return None, "NPM C_ → review"
    return None, "no prefix → review"


async def main(dry_run: bool):
    async with SessionLocal() as db:
        pos = (await db.execute(select(ProjectPO))).scalars().all()

        stats = Counter()
        changes = 0
        examples = {}
        for po in pos:
            hw = po.hw_data or {}
            project_name = hw.get("Project Name")
            publish = hw.get("Publish Date")
            ace, reason = classify_ace_project(project_name, po.item_dis, publish)

            stats[ace or "NEED_REVIEW"] += 1
            stats[f"reason:{reason}"] += 1
            if reason not in examples:
                examples[reason] = (po.id, project_name, (po.item_dis or "")[:30], publish, ace)

            # Apply the classified value (including None → back to NEED_REVIEW)
            new_val = ace or None
            if (po.ace_project_code or None) != new_val:
                changes += 1
                if not dry_run:
                    po.ace_project_code = new_val

        if not dry_run:
            await db.commit()

        print("=" * 60)
        print("DRY RUN — nothing committed" if dry_run else "COMMITTED")
        print("=" * 60)
        print(f"Total POs: {len(pos)}")
        print(f"Would change ace_project_code: {changes}")
        print("\n--- Result distribution ---")
        for k in ("HWT2304", "HWT2601", "HWT2604", "NEED_REVIEW"):
            print(f"  {k:14} {stats.get(k, 0)}")
        print("\n--- By reason ---")
        for k, v in sorted(stats.items()):
            if k.startswith("reason:"):
                print(f"  {k[7:]:30} {v}")
        print("\n--- Example per reason ---")
        for reason, (pid, pn, item, pub, ace) in examples.items():
            print(f"  [{ace or 'REVIEW'}] {reason}")
            print(f"      id={pid} proj={str(pn)[:30]} item={item} pub={pub}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    asyncio.run(main(args.dry_run))
