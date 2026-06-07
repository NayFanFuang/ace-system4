import json
import re
from datetime import date, datetime
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "frontend" / "poSystemSeed.js"
ISDP_PATH = Path(r"C:\GoogleAppScript\0_NewServer\POsystem\isdp_sajja.k_56A0LCM_20260506141555.xlsm")


def clean(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text and text.lower() != "none" else None


def date_text(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = clean(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass
    return text


def load_isdp_cluster_ready():
    workbook = openpyxl.load_workbook(ISDP_PATH, data_only=True, read_only=True)
    sheet = workbook["Site Rollout Plan"]
    lookup = {}

    for row in sheet.iter_rows(min_row=4, values_only=True):
        customer_site_id = clean(row[0])
        new_site_code = clean(row[1])
        du_id = clean(row[2])
        rf_cluster_name = clean(row[8])
        cluster_ready_date = date_text(row[10])

        value = {
            "rfClusterName": rf_cluster_name,
            "clusterReadyDate": cluster_ready_date,
        }

        for key in (du_id, customer_site_id, new_site_code):
            if key and key not in lookup:
                lookup[key] = value

        if du_id:
            site_id = du_id.split("_", 1)[0].strip()
            if site_id and site_id not in lookup:
                lookup[site_id] = value

    return lookup


def load_seed_lines():
    text = SEED_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"export const PO_SYSTEM_LINES = (\[.*?\])\s*export const HWT2304_PO_LINES",
        text,
        re.S,
    )
    if not match:
        raise RuntimeError("Could not locate PO_SYSTEM_LINES in seed file")
    return text, json.loads(match.group(1))


def main():
    original_text, lines = load_seed_lines()
    cluster_ready = load_isdp_cluster_ready()

    matched = 0
    for row in lines:
        match = cluster_ready.get(row.get("siteCode")) or cluster_ready.get(row.get("siteId"))
        if match:
            matched += 1
            row["rfClusterName"] = match["rfClusterName"]
            row["clusterReadyDate"] = match["clusterReadyDate"]
        else:
            row["rfClusterName"] = None
            row["clusterReadyDate"] = None

    lines_text = json.dumps(lines, ensure_ascii=False, indent=2)
    new_text = re.sub(
        r"export const PO_SYSTEM_LINES = \[.*?\]\s*export const HWT2304_PO_LINES",
        f"export const PO_SYSTEM_LINES = {lines_text}\n\nexport const HWT2304_PO_LINES",
        original_text,
        flags=re.S,
    )
    new_text = new_text.replace(
        "// Enriched from isdp_sajja.k_56A0LCM_20260506141555.xlsm, sheet Site Rollout Plan, key DU ID, Full On-Air Actual End Date",
        "// Enriched from isdp_sajja.k_56A0LCM_20260506141555.xlsm, sheet Site Rollout Plan: SSV Full On-Air and PAC 15 Cluster Ready",
    )
    SEED_PATH.write_text(new_text, encoding="utf-8")
    print(f"Updated {len(lines)} PO lines; matched ISDP cluster-ready rows for {matched} lines.")


if __name__ == "__main__":
    main()
