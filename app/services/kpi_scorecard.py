"""KPI Scorecard PDF — per-employee monthly KPI assessment.
Layout: header · info table · Main-Evaluate summary · radar (target vs actual) · 3 signatures.
Uses reportlab (+ Garuda Thai font); radar drawn manually (no matplotlib)."""
import io
import math
import os
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Polygon, Line, String, Circle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage,
)
from reportlab.lib.styles import ParagraphStyle

_FONT_DIR = "/usr/share/fonts/truetype/tlwg"
FONT = "Helvetica"
FONT_B = "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("Garuda", os.path.join(_FONT_DIR, "Garuda.ttf")))
    pdfmetrics.registerFont(TTFont("Garuda-Bold", os.path.join(_FONT_DIR, "Garuda-Bold.ttf")))
    FONT, FONT_B = "Garuda", "Garuda-Bold"
except Exception:
    pass

BLUE = colors.HexColor("#2447d8")
DARK = colors.HexColor("#1d2939")
GREY = colors.HexColor("#64748b")
LINE = colors.HexColor("#e4e7ec")
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "ace-logo.png")
GRADE_COLOR = {"A": colors.HexColor("#16a34a"), "B": colors.HexColor("#22c55e"),
               "C": colors.HexColor("#ca8a04"), "D": colors.HexColor("#dc2626")}


def _grade(total):
    return "A" if total >= 90 else "B" if total >= 80 else "C" if total >= 70 else "D"


def _wrap(label, width=15, max_lines=2):
    """Word-wrap a label into up to max_lines lines (last line ellipsised if it overflows)."""
    words = str(label).split()
    lines, cur = [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > width:
            lines.append(cur)
            cur = w
            if len(lines) == max_lines:
                break
        else:
            cur = (cur + " " + w).strip()
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if not lines:
        lines = [str(label)[:width]]
    # if content remains beyond max_lines, mark the last line with an ellipsis
    if len(" ".join(words)) > len(" ".join(lines)):
        lines[-1] = (lines[-1][:width - 1] + "…")
    return lines


RING_CLR = colors.HexColor("#eef2f6")
AXIS_CLR = colors.HexColor("#dbe2ea")
AMBER = colors.HexColor("#f59e0b")
BLUE_DK = colors.HexColor("#1e3a8a")


def _fit_para(text, width_pt, base_fs=8.5, min_fs=6.0, color=None):
    """Return a Paragraph whose font size is shrunk just enough to fit `text` on one line."""
    from reportlab.pdfbase.pdfmetrics import stringWidth
    text = str(text or "")
    fs = base_fs
    while fs > min_fs and stringWidth(text, FONT, fs) > width_pt:
        fs -= 0.25
    return Paragraph(text, ParagraphStyle("fit", fontName=FONT, fontSize=fs,
                                          leading=fs + 2, textColor=color or DARK))


def _radar(labels, achieve_pcts, size=205):
    """Spider chart: blue filled = Actual achievement, with % shown at each vertex."""
    pad = 12
    d = Drawing(size, size + pad)
    n = len(labels)
    if n < 3:
        return d  # radar needs >=3 axes
    cx, cy, R = size / 2, (size + pad) / 2 + 1, size * 0.30

    def pt(i, frac):
        ang = math.pi / 2 - i * 2 * math.pi / n
        return cx + R * frac * math.cos(ang), cy + R * frac * math.sin(ang)

    # concentric grid rings (light) + scale ticks on the top axis
    for frac in (0.25, 0.5, 0.75, 1.0):
        poly = []
        for i in range(n):
            x, y = pt(i, frac)
            poly += [x, y]
        ring = AXIS_CLR if frac == 1.0 else RING_CLR
        d.add(Polygon(poly, strokeColor=ring, fillColor=None, strokeWidth=0.7 if frac == 1.0 else 0.6))
        if frac < 1.0:
            d.add(String(cx + 2, cy + R * frac - 2, f"{int(frac * 100)}",
                         fontSize=5, textAnchor="start", fillColor=colors.HexColor("#cbd5e1"), fontName=FONT))
    # spokes
    for i in range(n):
        x, y = pt(i, 1.0)
        d.add(Line(cx, cy, x, y, strokeColor=AXIS_CLR, strokeWidth=0.5))

    # ACTUAL polygon (filled blue)
    pts = []
    apoly = []
    for i, v in enumerate(achieve_pcts):
        frac = max(0.04, min(float(v) / 100.0, 1.0))
        x, y = pt(i, frac)
        apoly += [x, y]
        pts.append((x, y, float(v), i))
    d.add(Polygon(apoly, strokeColor=BLUE, fillColor=colors.Color(0.14, 0.28, 0.85, 0.16), strokeWidth=1.8))

    # category labels (wrapped, outside the outer ring)
    for i, lab in enumerate(labels):
        lx, ly = pt(i, 1.30)
        lines = _wrap(lab, width=15, max_lines=2)
        y0 = ly + (len(lines) - 1) * 3.5
        for j, ln in enumerate(lines):
            d.add(String(lx, y0 - j * 7, ln, fontSize=6.2, textAnchor="middle", fillColor=GREY, fontName=FONT))

    # vertex dots + % value (offset slightly inward so it never collides with the category label)
    for x, y, v, i in pts:
        ang = math.pi / 2 - i * 2 * math.pi / n
        d.add(Circle(x, y, 2.4, fillColor=BLUE, strokeColor=colors.white, strokeWidth=0.7))
        vx, vy = x - 11 * math.cos(ang), y - 11 * math.sin(ang)
        d.add(String(vx, vy - 2.2, f"{v:.0f}%", fontSize=6.6, textAnchor="middle", fillColor=BLUE_DK, fontName=FONT_B))
    return d


def build_scorecard_pdf(meta: dict, rows: list[dict], signature_path: str | None = None) -> bytes:
    """meta: company, period, title, project_code, project_name, account, name, position, evaluated_at
    rows: [{main, weight, score, achieve}]  (achieve = %)"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=14 * mm, bottomMargin=12 * mm,
                            leftMargin=16 * mm, rightMargin=16 * mm, title=f"KPI {meta.get('name')}")
    small = ParagraphStyle("small", fontName=FONT, fontSize=8, textColor=GREY, leading=11)
    center = ParagraphStyle("center", fontName=FONT, fontSize=10, alignment=1, leading=13, textColor=GREY)
    h1 = ParagraphStyle("h1", fontName=FONT_B, fontSize=14, alignment=1, leading=18, textColor=DARK)
    proj = ParagraphStyle("proj", fontName=FONT, fontSize=9, alignment=1, leading=12, textColor=BLUE)

    total_w = sum(r["weight"] for r in rows)
    total_s = sum(r["score"] for r in rows)
    grade = _grade(total_s)
    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")

    grade_col = GRADE_COLOR.get(grade, GREY)
    story = []

    # ── Professional header: logo (left) · company (center-left) · period/date (right)
    logo_cell = ""
    if os.path.exists(LOGO):
        try:
            logo_cell = RLImage(LOGO, width=18 * mm, height=18 * mm, kind="proportional")
        except Exception:
            logo_cell = ""
    co_style = ParagraphStyle("co", fontName=FONT_B, fontSize=11.5, textColor=DARK, leading=14)
    co_sub = ParagraphStyle("cosub", fontName=FONT, fontSize=8, textColor=GREY, leading=11)
    mr = ParagraphStyle("mr", fontName=FONT, fontSize=8, textColor=GREY, alignment=2, leading=11)
    mr2 = ParagraphStyle("mr2", fontName=FONT, fontSize=7.5, textColor=colors.HexColor("#94a3b8"), alignment=2, leading=10)
    header = Table([[
        logo_cell,
        [Paragraph(meta.get("company", ""), co_style), Paragraph("Monthly KPI Performance Assessment", co_sub)],
        [Paragraph(f"Period: <b>{meta.get('period','')}</b>", mr), Paragraph(f"Generated: {now}", mr2)],
    ]], colWidths=[22 * mm, doc.width - 22 * mm - 52 * mm, 52 * mm])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (1, 0), (1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story += [header, Spacer(1, 5)]
    # blue accent rule
    rule = Table([[""]], colWidths=[doc.width], rowHeights=[2.4])
    rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), BLUE)]))
    story += [rule, Spacer(1, 10)]

    story += [Paragraph(meta.get("title", "KPI ASSESSMENT"), h1), Spacer(1, 10)]

    # info table (long values wrapped in Paragraphs so they don't overflow into the next column)
    _w = doc.width
    # long values (project name, employee name) live in the wide column (0.30) and shrink to one line;
    # position lives in the narrower right column (0.17) and shrinks too.
    pname = _fit_para(meta.get("project_name", ""), _w * 0.30 - 12, base_fs=8.5, min_fs=5.5)
    nameval = _fit_para(meta.get("name", ""), _w * 0.30 - 12, base_fs=8.5, min_fs=6.0)
    posval = _fit_para(meta.get("position", ""), _w * 0.17 - 12, base_fs=8.5, min_fs=6.0)
    deptval = _fit_para(meta.get("department", ""), _w * 0.155 - 12, base_fs=8.5, min_fs=6.0)
    info = [
        ["Project Code:", meta.get("project_code", ""), "Project Name:", pname, "Grade:", grade],
        ["Emp Code:", meta.get("employee_code", ""), "Name:", nameval, "Position:", posval],
        ["Department:", deptval, "Evaluated At:", meta.get("evaluated_at", ""), "Period:", meta.get("period", "")],
    ]
    it = Table(info, colWidths=[_w * 0.14, _w * 0.155, _w * 0.135, _w * 0.30, _w * 0.10, _w * 0.17])
    it.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), FONT, 8.5),
        ("FONT", (0, 0), (0, -1), FONT_B, 8.5), ("FONT", (2, 0), (2, -1), FONT_B, 8.5), ("FONT", (4, 0), (4, -1), FONT_B, 8.5),
        ("FONT", (5, 0), (5, 0), FONT_B, 15), ("TEXTCOLOR", (5, 0), (5, 0), colors.white),
        ("BACKGROUND", (5, 0), (5, 0), grade_col), ("ALIGN", (5, 0), (5, 0), "CENTER"),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")), ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#f8fafc")), ("BACKGROUND", (4, 0), (4, -1), colors.HexColor("#f8fafc")),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY), ("TEXTCOLOR", (2, 0), (2, -1), GREY), ("TEXTCOLOR", (4, 0), (4, -1), GREY),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    scale_style = ParagraphStyle("scale", fontName=FONT, fontSize=7.5, alignment=2, leading=10,
                                 textColor=colors.HexColor("#94a3b8"))
    story += [it, Spacer(1, 3),
              Paragraph("Grade scale:&nbsp; A 90&#8211;100&nbsp; &middot;&nbsp; B 80&#8211;89&nbsp; &middot;&nbsp; "
                        "C 70&#8211;79&nbsp; &middot;&nbsp; D below 70", scale_style),
              Spacer(1, 10)]

    # summary table
    data = [["Main Evaluate", "Weight", "Score", "Achieve"]]
    for r in rows:
        data.append([r["main"], f"{r['weight']:.0f}", f"{r['score']:.1f}", f"{r['achieve']:.1f}%"])
    total_ach = round(total_s / total_w * 100, 1) if total_w else 0.0
    data.append(["GRAND TOTAL", f"{total_w:.0f}", f"{total_s:.1f}", f"{total_ach:.1f}%"])
    st = Table(data, colWidths=[doc.width - 90 * mm, 30 * mm, 30 * mm, 30 * mm])
    st.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), FONT_B, 9), ("BACKGROUND", (0, 0), (-1, 0), BLUE), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 1), (-1, -1), FONT, 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ("FONT", (0, -1), (-1, -1), FONT_B, 9.5), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#eef2ff")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"), ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TEXTCOLOR", (0, -1), (-1, -1), DARK), ("LEFTPADDING", (0, 0), (0, -1), 10),
    ]))
    story += [st, Spacer(1, 12)]

    today = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")

    def _sig_block(label, name_line, sig_flowable, inner_w):
        t = Table([[label], ["Signature"], [sig_flowable or ""], [name_line], [f"Date: {today}"]],
                  colWidths=[inner_w], rowHeights=[13, 12, 26, 14, 13])
        t.setStyle(TableStyle([
            ("FONT", (0, 0), (0, 0), FONT_B, 9), ("FONT", (0, 1), (0, 1), FONT, 8),
            ("FONT", (0, 3), (0, -1), FONT, 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 2), (0, 2), "BOTTOM"),
            ("TEXTCOLOR", (0, 0), (0, 0), DARK), ("TEXTCOLOR", (0, 1), (0, 1), GREY), ("TEXTCOLOR", (0, 3), (0, -1), GREY),
            ("LINEBELOW", (0, 2), (0, 2), 0.6, colors.HexColor("#94a3b8")),
            ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        return t

    emp_sig = ""
    if signature_path and os.path.exists(signature_path):
        try:
            emp_sig = RLImage(signature_path, width=40 * mm, height=15 * mm, kind="proportional")
        except Exception:
            emp_sig = ""

    # Row 1: radar (left) + Employee signature (right)
    radar = _radar([r["main"] for r in rows], [r["achieve"] for r in rows], size=205)
    left_w, right_w = doc.width * 0.58, doc.width * 0.42
    left_cell = Table([[Paragraph("PRESENTING TARGET VS ACTUAL", ParagraphStyle("rt", fontName=FONT_B, fontSize=9, textColor=GREY))], [radar]],
                      colWidths=[left_w])
    left_cell.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    emp_block = _sig_block("Employee", f"({meta.get('name','')})", emp_sig, right_w - 8)
    row1 = Table([[left_cell, emp_block]], colWidths=[left_w, right_w])
    row1.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story += [Spacer(1, 4), row1, Spacer(1, 8)]

    # Row 2: Project Director (left) + HR Manager (right)
    half = doc.width / 2
    pd_block = _sig_block("Project Director", "(____________________)", "", half - 8)
    hr_block = _sig_block("HR Manager", "(____________________)", "", half - 8)
    row2 = Table([[pd_block, hr_block]], colWidths=[half, half])
    row2.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story += [row2]

    def _footer(canvas, _doc):
        canvas.saveState()
        w, _ = A4
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(16 * mm, 12 * mm, w - 16 * mm, 12 * mm)
        canvas.setFont(FONT, 7)
        canvas.setFillColor(colors.HexColor("#94a3b8"))
        canvas.drawString(16 * mm, 8 * mm, "CONFIDENTIAL · Air Connect Engineering (Thailand) Co., Ltd. · Generated by ACE System")
        canvas.drawRightString(w - 16 * mm, 8 * mm, f"Page {_doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()
