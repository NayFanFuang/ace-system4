import io
import os
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# Clock timestamps are stored tz-aware in UTC; the timesheet must display Thailand time.
_BKK_TZ = ZoneInfo("Asia/Bangkok")


def _to_bkk(dt):
    """Convert a (UTC/aware or naive-UTC) datetime to Asia/Bangkok for display."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(_BKK_TZ)

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image as PILImage
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

# Register Thai font once at import time (fonts-thai-tlwg, SIL-OFL)
_FONT_DIR = "/usr/share/fonts/truetype/tlwg"
_FONT_REG = "Garuda"
_FONT_BOLD = "Garuda-Bold"
_fonts_registered = False


def _ensure_fonts() -> None:
    global _fonts_registered
    if _fonts_registered:
        return
    try:
        pdfmetrics.registerFont(TTFont(_FONT_REG, os.path.join(_FONT_DIR, "Garuda.ttf")))
        pdfmetrics.registerFont(TTFont(_FONT_BOLD, os.path.join(_FONT_DIR, "Garuda-Bold.ttf")))
        _fonts_registered = True
    except Exception:
        # Fall back to Helvetica if Thai fonts unavailable — Thai text will render as boxes
        pass

from app.database import get_db
from app.deps import get_current_user
from app.models.clock import ClockSession
from app.models.employee import Employee, ProjectAssignment, ProjectCatalog
from app.models.worklog import DailyWorkLog

router = APIRouter(prefix="/api/worklog", tags=["Worklog"])

_SIGNATURE_DIR = "/app/photos/signatures"
_MAX_SIG_BYTES = 2 * 1024 * 1024  # 2 MB


def _signature_path(emp_code: str) -> str:
    return os.path.join(_SIGNATURE_DIR, f"{emp_code}.png")


class WorkLogIn(BaseModel):
    summary: str = Field(min_length=1, max_length=500)


def _emp_code(payload: dict) -> str:
    code = payload.get("employee_code") or payload.get("sub")
    if not code:
        raise HTTPException(status_code=401, detail="Missing employee context")
    return code


def _month_range(month: str) -> tuple[date, date]:
    """Calendar month range (1st .. last day) — used by /me listing."""
    try:
        year, mon = month.split("-")
        first = date(int(year), int(mon), 1)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="month must be YYYY-MM")
    if first.month == 12:
        next_first = date(first.year + 1, 1, 1)
    else:
        next_first = date(first.year, first.month + 1, 1)
    return first, next_first - timedelta(days=1)


def _timesheet_period(month: str, start_day: int = 26) -> tuple[date, date]:
    """Timesheet period for a given month.
    start_day=26 → 26th of prev month .. 25th of selected month (payroll cycle)
    start_day=1  → 1st .. last day of selected month (calendar month)
    """
    try:
        year, mon = month.split("-")
        year_i, mon_i = int(year), int(mon)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="month must be YYYY-MM")
    if start_day == 1:
        first = date(year_i, mon_i, 1)
        if mon_i == 12:
            last = date(year_i + 1, 1, 1) - timedelta(days=1)
        else:
            last = date(year_i, mon_i + 1, 1) - timedelta(days=1)
        return first, last
    # default payroll cycle (start_day=26)
    end = date(year_i, mon_i, 25)
    if end.month == 1:
        start = date(end.year - 1, 12, 26)
    else:
        start = date(end.year, end.month - 1, 26)
    return start, end


def _serialize_log(row: DailyWorkLog) -> dict:
    return {
        "id": row.id,
        "employee_code": row.employee_code,
        "work_date": row.work_date.isoformat(),
        "summary": row.summary,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _is_clock_complete(sessions: list) -> bool:
    """A day's clock is 'complete' when at least one session has a clock-in
    AND at least one has a clock-out. Detail Work can only be saved on such days."""
    has_in = any(s.clock_in_at for s in sessions)
    has_out = any(s.clock_out_at for s in sessions)
    return has_in and has_out


def _serialize_session(s: ClockSession) -> dict:
    return {
        "id": s.id,
        "clock_type": s.clock_type,
        "site_code": s.site_code,
        "site_name": s.site_name,
        "clock_in_at": s.clock_in_at.isoformat() if s.clock_in_at else None,
        "clock_out_at": s.clock_out_at.isoformat() if s.clock_out_at else None,
        "status": s.status,
    }


@router.get("/me")
async def list_my_logs(
    month: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    emp = _emp_code(payload)
    first, last = _month_range(month)

    logs = (await db.execute(
        select(DailyWorkLog).where(
            and_(
                DailyWorkLog.employee_code == emp,
                DailyWorkLog.work_date >= first,
                DailyWorkLog.work_date <= last,
            )
        ).order_by(DailyWorkLog.work_date.asc())
    )).scalars().all()

    sessions = (await db.execute(
        select(ClockSession).where(
            and_(
                ClockSession.employee_code == emp,
                ClockSession.work_date >= first,
                ClockSession.work_date <= last,
            )
        ).order_by(ClockSession.clock_in_at.asc())
    )).scalars().all()

    sessions_by_date: dict[str, list] = {}
    for s in sessions:
        sessions_by_date.setdefault(s.work_date.isoformat(), []).append(_serialize_session(s))

    log_dates = {r.work_date.isoformat() for r in logs}
    today_iso = date.today().isoformat()
    missing = [d for d in sorted(sessions_by_date.keys()) if d not in log_dates and d <= today_iso]

    return {
        "month": month,
        "logs": [_serialize_log(r) for r in logs],
        "sessions_by_date": sessions_by_date,
        "missing": missing,
    }


@router.get("/me/projects")
async def list_my_projects(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Active project assignments of the current user, joined with project name."""
    emp = _emp_code(payload)
    rows = (await db.execute(
        select(ProjectAssignment, ProjectCatalog)
        .join(ProjectCatalog, ProjectCatalog.project_code == ProjectAssignment.project_code, isouter=True)
        .where(and_(
            ProjectAssignment.employee_code == emp,
            ProjectAssignment.is_active.is_(True),
        ))
        .order_by(ProjectAssignment.project_code.asc())
    )).all()
    return [
        {
            "project_code": pa.project_code,
            "project_name": pc.project_name if pc else None,
            "role_in_project": pa.role_in_project,
        }
        for pa, pc in rows
    ]


# Signature endpoints — declared before /me/{work_date} so the literal path wins.
@router.get("/me/signature")
async def get_my_signature(payload: dict = Depends(get_current_user)):
    """Return current signature PNG, or 404 if not set."""
    emp = _emp_code(payload)
    path = _signature_path(emp)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="No signature uploaded")
    return FileResponse(path, media_type="image/png")


@router.put("/me/signature")
async def upload_my_signature(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user),
):
    """Upload (replace) signature image. Accepts PNG/JPG, max 2MB.
    Re-encoded to PNG with transparent background preserved."""
    emp = _emp_code(payload)
    raw = await file.read()
    if len(raw) > _MAX_SIG_BYTES:
        raise HTTPException(status_code=413, detail="ไฟล์ใหญ่เกิน 2MB")
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="ไฟล์ว่าง")
    try:
        img = PILImage.open(io.BytesIO(raw))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง")
    # Re-open since verify() closes the file
    img = PILImage.open(io.BytesIO(raw))
    # Cap dimension for storage
    img.thumbnail((1200, 600))
    os.makedirs(_SIGNATURE_DIR, exist_ok=True)
    path = _signature_path(emp)
    img.save(path, "PNG", optimize=True)
    return {"ok": True, "size": os.path.getsize(path)}


@router.delete("/me/signature")
async def delete_my_signature(payload: dict = Depends(get_current_user)):
    emp = _emp_code(payload)
    path = _signature_path(emp)
    if os.path.exists(path):
        os.remove(path)
    return {"ok": True}


# IMPORTANT: this route must be declared BEFORE /me/{work_date}
# or FastAPI will try to parse "export" as a date.
@router.get("/me/export/timesheet")
async def export_timesheet(
    month: str,
    start_day: int = 26,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export attendance timesheet PDF.
    start_day=26 (default): payroll cycle 26th prev month → 25th selected month.
    start_day=1: calendar month 1st → last day of selected month.
    """
    if start_day not in (1, 26):
        raise HTTPException(status_code=400, detail="start_day must be 1 or 26")
    emp = _emp_code(payload)
    # Signature is mandatory — must be uploaded before exporting.
    if not os.path.exists(_signature_path(emp)):
        raise HTTPException(status_code=400, detail="Please upload your signature before exporting the Timesheet.")
    period_start, period_end = _timesheet_period(month, start_day)

    employee = (await db.execute(
        select(Employee).where(Employee.employee_code == emp)
    )).scalar_one_or_none()

    # Look up direct manager (PM) by manager_code → fill PM block in PDF
    manager = None
    if employee and employee.manager_code:
        manager = (await db.execute(
            select(Employee).where(Employee.employee_code == employee.manager_code)
        )).scalar_one_or_none()

    # Fallback Project line: if employee row has no project_code/name, pick first
    # active assignment instead so the PDF header is never blank.
    project_override = None
    if employee and not (employee.project_code or employee.project_name):
        first_assign = (await db.execute(
            select(ProjectAssignment, ProjectCatalog)
            .join(ProjectCatalog, ProjectCatalog.project_code == ProjectAssignment.project_code, isouter=True)
            .where(and_(
                ProjectAssignment.employee_code == emp,
                ProjectAssignment.is_active.is_(True),
            ))
            .order_by(ProjectAssignment.project_code.asc())
            .limit(1)
        )).first()
        if first_assign:
            pa, pc = first_assign
            project_override = (pa.project_code, pc.project_name if pc else None)

    sessions = (await db.execute(
        select(ClockSession).where(
            and_(
                ClockSession.employee_code == emp,
                ClockSession.work_date >= period_start,
                ClockSession.work_date <= period_end,
            )
        ).order_by(ClockSession.clock_in_at.asc())
    )).scalars().all()

    logs = (await db.execute(
        select(DailyWorkLog).where(
            and_(
                DailyWorkLog.employee_code == emp,
                DailyWorkLog.work_date >= period_start,
                DailyWorkLog.work_date <= period_end,
            )
        )
    )).scalars().all()

    sessions_by_date: dict[date, list[ClockSession]] = {}
    for s in sessions:
        sessions_by_date.setdefault(s.work_date, []).append(s)
    logs_by_date: dict[date, DailyWorkLog] = {l.work_date: l for l in logs}

    buf = _build_timesheet_pdf(
        employee=employee,
        emp_code=emp,
        manager=manager,
        project_override=project_override,
        period_start=period_start,
        period_end=period_end,
        sessions_by_date=sessions_by_date,
        logs_by_date=logs_by_date,
    )

    safe_name = (employee.full_name if employee else emp).replace(" ", "_").replace("/", "_")
    filename = f"TimeSheet_{month}_{safe_name}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _fmt_hms(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h}:{m:02d}:{s:02d}"


def _aggregate_day(rows: list[ClockSession]) -> dict:
    """Aggregate a day's sessions: first clock-in, last clock-out, total worked seconds, score, remarks."""
    if not rows:
        return {"start": None, "end": None, "hours": None, "score": None, "site_count": 0, "remarks": ""}
    starts = [r.clock_in_at for r in rows if r.clock_in_at]
    ends = [r.clock_out_at for r in rows if r.clock_out_at]
    first_in = min(starts) if starts else None
    last_out = max(ends) if ends else None
    has_in = bool(first_in)
    has_out = bool(last_out)
    sites = {r.site_code for r in rows if r.site_code}

    if has_in and has_out:
        delta = (last_out - first_in).total_seconds()
        hours = _fmt_hms(int(delta)) if delta > 0 else None
        score = 1
    elif has_in and not has_out:
        hours = None
        score = 0.5
    else:
        hours = None
        score = None

    remark_parts = []
    no_gps = any(r.clock_in_at and (r.lat_in is None or r.lng_in is None) for r in rows)
    if no_gps:
        remark_parts.append("No Line")
    if has_in and not has_out:
        remark_parts.append("Clock Incomplete")

    return {
        "start": first_in,
        "end": last_out,
        "hours": hours,
        "score": score,
        "site_count": len(sites),
        "remarks": ", ".join(remark_parts),
    }


_REMARK_EN = (
    "If incorrect information is found, Company has the right to take by the following actions to employee, PM and Management level:<br/>"
    "1. The First penalty, HR will issue the 1st warning letter to employee, PM and all signers.<br/>"
    "2. The Second penalty, HR will issue the 2nd warning letter to employee, PM and all signers.<br/>"
    "&nbsp;&nbsp;&nbsp;Also, all above will be fine doubled; double amount of the day that incorrect.<br/>"
    "&nbsp;&nbsp;&nbsp;This penalty caused by violate to company's prohibit policy on Section 6, discipline, disciplinary action and grievances.<br/>"
    "3. The Third penalty, HR will consider to terminate the employment to employees without receiving any compensation.<br/>"
    "All above policy is to encourage everyone in the company to take responsibilities of whatever work the company had been assigned to performance."
)

_REMARK_TH = (
    "สำหรับเรื่องการตรวจสอบความถูกต้อง Time Sheet ของพนักงาน โดย PM และ Management หากมีการตรวจสอบย้อนหลังและพบว่าข้อมูลที่ลงนามยืนยันใน Time Sheet ไม่ถูกต้อง<br/>"
    "ทางบริษัท ฯ จะดำเนินการตามมาตรการดังต่อไปนี้กับพนักงาน รวมถึง PM และ Management ทุกคนที่มีส่วนลงนามตรวจสอบความถูกต้องในเอกสาร<br/>"
    "1. การลงโทษ หากพบความผิด ครั้งที่ 1 ดำเนินการออกจดหมายตักเตือน ครั้งที่ 1<br/>"
    "2. การลงโทษ หากพบความผิด ครั้งที่ 2 ดำเนินการออกจดหมายตักเตือน ครั้งที่ 2 และมีการปรับเงินเป็นสองเท่าตามจำนวนวันจริงที่บริษัทฯ ได้ตรวจสอบพบการกระทำผิด<br/>"
    "&nbsp;&nbsp;&nbsp;โดยการทุจริตต่อหน้าที่ไม่ว่าด้วยประการใด ๆ ซึ่งการกระทำในลักษณะดังกล่าว เป็นการฝ่าฝืนระเบียบข้อบังคับและประกาศของบริษัท ฯ หมวดที่ 6 วินัย โทษทางวินัยและการร้องทุกข์<br/>"
    "3. การลงโทษ หากพบความผิด ครั้งที่ 3 บริษัท ฯ จะพิจารณาลงโทษโดยการให้พ้นสภาพจากการเป็นพนักงานบริษัท ฯ โดยไม่ได้รับการจ่ายค่าชดเชยใด ๆ<br/>"
    "นโยบายดังกล่าวข้างต้น สนับสนุนให้ทุกคนในบริษัท ฯ มีความรับผิดชอบในงานใดๆ ก็ตามที่บริษัท ฯ ได้มอบหมายให้ปฏิบัติงาน"
)


def _build_timesheet_pdf(
    *,
    employee: Employee | None,
    emp_code: str,
    manager: Employee | None = None,
    project_override: tuple | None = None,
    period_start: date,
    period_end: date,
    sessions_by_date: dict,
    logs_by_date: dict,
) -> io.BytesIO:
    _ensure_fonts()

    full_name = employee.full_name if employee else emp_code
    position = (employee.position or employee.job_title or "") if employee else ""
    project_code = (employee.project_code or "") if employee else ""
    project_name = (employee.project_name or "") if employee else ""
    if not (project_code or project_name) and project_override:
        project_code = project_override[0] or ""
        project_name = project_override[1] or ""
    project_line = f"{project_code} : {project_name}".strip(" :") if (project_code or project_name) else ""

    page_size = landscape(A4)
    margin = 8 * mm
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=page_size,
        leftMargin=margin, rightMargin=margin,
        topMargin=margin, bottomMargin=margin,
        title=f"TimeSheet {period_start.isoformat()} to {period_end.isoformat()}",
    )

    base_font = _FONT_REG if _fonts_registered else "Helvetica"
    bold_font = _FONT_BOLD if _fonts_registered else "Helvetica-Bold"

    p_title = ParagraphStyle("title", fontName=bold_font, fontSize=12, alignment=1, spaceAfter=2)
    p_note = ParagraphStyle("note", fontName=base_font, fontSize=7, alignment=1, textColor=colors.dimgrey, spaceAfter=2, leading=8)
    p_header_cell = ParagraphStyle("hcell", fontName=base_font, fontSize=7, leading=9)
    p_header_cell_bold = ParagraphStyle("hcellb", fontName=bold_font, fontSize=7, leading=9)
    p_th_col = ParagraphStyle("thcol", fontName=bold_font, fontSize=6.5, alignment=1, leading=8, textColor=colors.black)
    p_cell = ParagraphStyle("cell", fontName=base_font, fontSize=6.3, alignment=1, leading=7.5)
    p_cell_left = ParagraphStyle("celll", fontName=base_font, fontSize=6.3, alignment=0, leading=7.5)
    p_remark = ParagraphStyle("remark", fontName=base_font, fontSize=5.5, leading=6.8)

    story = []

    # Title
    story.append(Paragraph("Attendance Time Sheet", p_title))

    # Header grid: Company / Project, Name / Period
    header_data = [
        [Paragraph("<b>Company:</b>", p_header_cell_bold),
         Paragraph("Air Connect Engineering (Thailand) Co., Ltd.", p_header_cell),
         Paragraph("<b>Project:</b>", p_header_cell_bold),
         Paragraph(project_line or "&nbsp;", p_header_cell)],
        [Paragraph("<b>Name:</b>", p_header_cell_bold),
         Paragraph(full_name, p_header_cell),
         Paragraph("<b>Period:</b>", p_header_cell_bold),
         Paragraph(f"{period_start.strftime('%d %b %Y')} - {period_end.strftime('%d %b %Y')}", p_header_cell)],
    ]
    avail_width = page_size[0] - 2 * margin
    header_tbl = Table(
        header_data,
        colWidths=[22 * mm, avail_width * 0.45 - 22 * mm, 18 * mm, avail_width * 0.55 - 18 * mm],
    )
    header_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f1f5f9")),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 2))
    story.append(Paragraph("<i>Note: Weekly attendance time sheet is the key reference for consultant's work payment</i>", p_note))

    # Main data table
    col_headers = [
        Paragraph("Date", p_th_col),
        Paragraph("Day of<br/>Week", p_th_col),
        Paragraph("Time (hh:mm)<br/>Start", p_th_col),
        Paragraph("Time (hh:mm)<br/>Finish", p_th_col),
        Paragraph("Working<br/>Hour", p_th_col),
        Paragraph("Working Day<br/>(score)", p_th_col),
        Paragraph("Type of Work", p_th_col),
        Paragraph("#Site", p_th_col),
        Paragraph("Detail Work", p_th_col),
        Paragraph("Remarks", p_th_col),
    ]

    data = [col_headers]
    sunday_row_indices = []  # highlight every Sunday row
    total_seconds = 0
    total_score = 0.0

    cur = period_start
    while cur <= period_end:
        rows_today = sessions_by_date.get(cur, [])
        agg = _aggregate_day(rows_today)
        log = logs_by_date.get(cur)

        date_str = cur.strftime("%d-%b-%y")
        day_str = cur.strftime("%A")
        start_str = _to_bkk(agg["start"]).strftime("%H:%M") if agg["start"] else ""
        end_str = _to_bkk(agg["end"]).strftime("%H:%M") if agg["end"] else ""
        hours_str = agg["hours"] or ""
        score = agg["score"]
        site_count = str(agg["site_count"]) if agg["site_count"] else ""
        detail = log.summary if log else ""
        remarks = agg["remarks"]

        if agg["start"] and agg["end"]:
            total_seconds += int((agg["end"] - agg["start"]).total_seconds())
        if score:
            total_score += score

        row = [
            Paragraph(date_str, p_cell),
            Paragraph(day_str, p_cell),
            Paragraph(start_str, p_cell),
            Paragraph(end_str, p_cell),
            Paragraph(hours_str, p_cell),
            Paragraph(str(score) if score is not None else "", p_cell),
            Paragraph(position, p_cell_left),
            Paragraph(site_count, p_cell),
            Paragraph(detail, p_cell_left),
            Paragraph(remarks, p_cell_left),
        ]
        data.append(row)

        if cur.weekday() == 6:  # Sunday
            sunday_row_indices.append(len(data) - 1)

        cur += timedelta(days=1)

    # Total row
    total_str = _fmt_hms(total_seconds) if total_seconds else ""
    total_row = [
        Paragraph("<b>TOTAL DAYS/PRICE FOR THE MONTH</b>", ParagraphStyle("tot", fontName=bold_font, fontSize=8, alignment=2)),
        "", "", "",
        Paragraph(f"<b>{total_str}</b>", p_cell),
        Paragraph(f"<b>{total_score if total_score else ''}</b>", p_cell),
        "", "", "", "",
    ]
    data.append(total_row)
    total_row_idx = len(data) - 1

    col_widths = [
        avail_width * 0.06,   # Date
        avail_width * 0.07,   # Day
        avail_width * 0.06,   # Start
        avail_width * 0.06,   # Finish
        avail_width * 0.07,   # Hour
        avail_width * 0.06,   # Score
        avail_width * 0.07,   # Type
        avail_width * 0.04,   # #Site
        avail_width * 0.41,   # Detail
        avail_width * 0.10,   # Remarks
    ]
    main_tbl = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("GRID", (0, 0), (-1, -1), 0.3, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d9e1f2")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        # Total row
        ("SPAN", (0, total_row_idx), (3, total_row_idx)),
        ("BACKGROUND", (0, total_row_idx), (-1, total_row_idx), colors.HexColor("#d9e1f2")),
    ]
    for ri in sunday_row_indices:
        style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), colors.HexColor("#fff2cc")))
    main_tbl.setStyle(TableStyle(style_cmds))
    story.append(Spacer(1, 1))
    story.append(main_tbl)

    # Signature block — employee. Embed uploaded signature image when present.
    story.append(Spacer(1, 2))
    _SIG_ROW_H = 11 * mm
    sig_img_flow = None
    sig_path = _signature_path(emp_code)
    if os.path.exists(sig_path):
        try:
            with PILImage.open(sig_path) as _probe:
                iw, ih = _probe.size
            max_h = _SIG_ROW_H - 2 * mm
            max_w = avail_width * 0.30 - 27 * mm
            scale = min(max_w / iw, max_h / ih)
            sig_img_flow = RLImage(sig_path, width=iw * scale, height=ih * scale)
        except Exception:
            sig_img_flow = None
    sig_emp = [[
        Paragraph("<b>Signature :</b>", p_header_cell_bold),
        sig_img_flow if sig_img_flow else Paragraph("", p_header_cell),
        Paragraph("<b>Position:</b>", p_header_cell_bold),
        Paragraph(position, p_header_cell),
        Paragraph("<b>Date :</b>", p_header_cell_bold),
        Paragraph(period_end.strftime("%Y-%m-%d"), p_header_cell),
    ]]
    sig_tbl = Table(sig_emp, colWidths=[
        25 * mm, avail_width * 0.30 - 25 * mm,
        20 * mm, avail_width * 0.35 - 20 * mm,
        18 * mm, avail_width * 0.35 - 18 * mm,
    ], rowHeights=[_SIG_ROW_H])
    sig_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(sig_tbl)

    # PM verification block
    story.append(Spacer(1, 1))
    pm_block = [
        [Paragraph("<b>Verified by Project Manager:</b>", p_header_cell_bold)],
        [Paragraph("I have checked this Timesheet and agree the number of days, I agree that this is a true and accurate record of worked", p_header_cell)],
    ]
    pm_tbl = Table(pm_block, colWidths=[avail_width])
    pm_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(pm_tbl)

    pm_position = ((manager.position or manager.job_title) if manager else "") or "Project Manager"
    pm_name = manager.full_name if manager else ""
    sig_pm = [[
        Paragraph("<b>Signature :</b>", p_header_cell_bold),
        Paragraph(pm_name, p_header_cell),
        Paragraph("<b>Position:</b>", p_header_cell_bold),
        Paragraph(pm_position, p_header_cell),
        Paragraph("<b>Date :</b>", p_header_cell_bold),
        Paragraph(period_end.strftime("%Y-%m-%d"), p_header_cell),
    ]]
    sig_pm_tbl = Table(sig_pm, colWidths=[
        25 * mm, avail_width * 0.30 - 25 * mm,
        20 * mm, avail_width * 0.35 - 20 * mm,
        18 * mm, avail_width * 0.35 - 18 * mm,
    ], rowHeights=[_SIG_ROW_H])
    sig_pm_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(sig_pm_tbl)

    # Remarks — EN + TH
    story.append(Spacer(1, 2))
    remark_block = [
        [Paragraph("<b>Remark:</b>", p_header_cell_bold), Paragraph(_REMARK_EN, p_remark)],
        [Paragraph("<b>หมายเหตุ :</b>", p_header_cell_bold), Paragraph(_REMARK_TH, p_remark)],
    ]
    remark_tbl = Table(remark_block, colWidths=[24 * mm, avail_width - 24 * mm])
    remark_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
    ]))
    story.append(remark_tbl)

    doc.build(story)
    buf.seek(0)
    return buf


@router.get("/me/{work_date}")
async def get_my_log(
    work_date: date,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    emp = _emp_code(payload)
    log = (await db.execute(
        select(DailyWorkLog).where(
            and_(DailyWorkLog.employee_code == emp, DailyWorkLog.work_date == work_date)
        )
    )).scalar_one_or_none()

    sessions = (await db.execute(
        select(ClockSession).where(
            and_(ClockSession.employee_code == emp, ClockSession.work_date == work_date)
        ).order_by(ClockSession.clock_in_at.asc())
    )).scalars().all()

    return {
        "work_date": work_date.isoformat(),
        "log": _serialize_log(log) if log else None,
        "sessions": [_serialize_session(s) for s in sessions],
        "clock_complete": _is_clock_complete(sessions),
    }


@router.put("/me/{work_date}")
async def upsert_my_log(
    work_date: date,
    body: WorkLogIn,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    emp = _emp_code(payload)
    if work_date > date.today():
        raise HTTPException(status_code=400, detail="Cannot log future dates")

    summary = body.summary.strip()
    if not summary:
        raise HTTPException(status_code=400, detail="Summary cannot be empty")

    # Require a complete clock (clock-in AND clock-out) for the day.
    day_sessions = (await db.execute(
        select(ClockSession).where(
            and_(ClockSession.employee_code == emp, ClockSession.work_date == work_date)
        )
    )).scalars().all()
    if not _is_clock_complete(day_sessions):
        raise HTTPException(
            status_code=400,
            detail="Clock is incomplete for this day — Detail Work can only be saved when both clock-in and clock-out exist.",
        )

    existing = (await db.execute(
        select(DailyWorkLog).where(
            and_(DailyWorkLog.employee_code == emp, DailyWorkLog.work_date == work_date)
        )
    )).scalar_one_or_none()

    if existing:
        existing.summary = summary
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return _serialize_log(existing)

    row = DailyWorkLog(employee_code=emp, work_date=work_date, summary=summary)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return _serialize_log(row)
