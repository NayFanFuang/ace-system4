import json
from datetime import date, datetime, time
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\GoogleAppScript\0_NewServer\POsystem\PO 2026.xlsx")
OUTPUT = ROOT / "frontend" / "poSystemRawRows.js"


def cell_text(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.strftime("%H:%M:%S")
    return str(value)


def main():
    workbook = openpyxl.load_workbook(SOURCE, data_only=True, read_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    headers = [cell_text(value) for value in next(rows)]
    raw_by_id = {}

    for row in rows:
        values = [cell_text(value) for value in row[: len(headers)]]
        row_id = values[0] if values else ""
        if row_id:
            raw_by_id[row_id] = values

    content = (
        f"// Generated from {SOURCE.as_posix()}\n"
        "// Used by PO_System Export Review to keep the PO 2026 column layout.\n\n"
        f"export const PO_2026_HEADERS = {json.dumps(headers, ensure_ascii=False, indent=2)}\n\n"
        f"export const PO_2026_RAW_ROWS_BY_ID = {json.dumps(raw_by_id, ensure_ascii=False, indent=2)}\n"
    )
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(headers)} headers and {len(raw_by_id)} rows.")


if __name__ == "__main__":
    main()
