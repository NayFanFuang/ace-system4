"""Email templates for the multi-step leave approval workflow."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.leave import LeaveRequest


def _base_html(title: str, content: str) -> str:
    """Bulletproof email wrapper — renders consistently across Outlook (Word engine)
    and mobile/webmail (WebKit).

    Why this shape:
      • Outlook Desktop ignores `max-width` on <div> — so we constrain width with a
        fixed-width <table> wrapped in an MSO conditional comment instead.
      • The outer 100%-width table + align=center keeps it centered on mobile.
      • All layout is table-based; no flexbox/grid (Outlook supports neither).
      • Inline styles only; <head>/<style> are stripped by many clients.
    """
    return f"""<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fb;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7fb">
  <tr>
    <td align="center" style="padding:24px 12px">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
        <tr>
          <td style="background-color:#2447d8;border-radius:12px 12px 0 0;padding:18px 24px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:18px;font-weight:bold">
            {title}
          </td>
        </tr>
        <tr>
          <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#101828">
            {content}
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:14px">
              ACE System — Automated Notification
            </p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>"""


def _leave_detail_rows(leave: "LeaveRequest") -> str:
    return f"""
<table style="border-collapse:collapse;margin:14px 0;width:100%">
  <tr><td style="padding:5px 14px 5px 0;color:#667085;width:160px">Employee</td><td style="font-weight:700">{leave.employee_name} ({leave.employee_code})</td></tr>
  <tr><td style="padding:5px 14px 5px 0;color:#667085">Leave Type</td><td>{leave.leave_type} — {leave.session_type}</td></tr>
  <tr><td style="padding:5px 14px 5px 0;color:#667085">Period</td><td>{leave.start_date} → {leave.end_date} ({leave.days} day{'s' if leave.days != 1 else ''})</td></tr>
  <tr><td style="padding:5px 14px 5px 0;color:#667085">Reason</td><td>{leave.reason or '—'}</td></tr>
</table>
"""


def _leave_stats_text(stats: dict | None) -> str:
    if not stats:
        return ""
    base = (
        "\nLeave statistics (year):\n"
        f"  Year entitlement : {stats['entitlement_text']}\n"
        f"  Approved used    : {stats['approved_used']:.1f} day(s)\n"
        f"  Pending requests : {stats['pending_days']:.1f} day(s)\n"
        f"  This request     : {stats['this_request_days']:.1f} day(s)\n"
        f"  Remaining        : {stats['remaining_after_request_text']}\n"
    )

    history = stats.get("last_3_months") or []
    if not history:
        return base

    lines = ["\nPast 3 months ({} only):".format(stats.get("category", "category"))]
    for item in history:
        lines.append(
            f"  {item['label']:8} : approved {item['approved']:.1f} d · pending {item['pending']:.1f} d"
        )
    lines.append(
        f"  {'Total':8} : approved {stats['last_3_months_total_approved']:.1f} d · "
        f"pending {stats['last_3_months_total_pending']:.1f} d"
    )
    return base + "\n".join(lines) + "\n"


def _leave_stats_html(stats: dict | None) -> str:
    if not stats:
        return ""
    rows = [
        ("Leave Category", stats["category"]),
        ("Year Entitlement", stats["entitlement_text"]),
        ("Approved Used", f"{stats['approved_used']:.1f} day(s)"),
        ("Pending Requests", f"{stats['pending_days']:.1f} day(s)"),
        ("This Request", f"{stats['this_request_days']:.1f} day(s)"),
        ("Remaining After This Request", stats["remaining_after_request_text"]),
    ]
    cells = "".join(
        f"<tr><td style='padding:6px 14px 6px 0;color:#667085'>{label}</td>"
        f"<td style='padding:6px 0;font-weight:700'>{value}</td></tr>"
        for label, value in rows
    )
    year_table = f"""
<h3 style="margin:18px 0 8px;color:#344054;font-size:15px">Leave Statistics (Year)</h3>
<table style="border-collapse:collapse;margin:8px 0 14px;width:100%">
  {cells}
</table>
"""

    history = stats.get("last_3_months") or []
    if not history:
        return year_table

    head_cells = (
        "<tr style='background:#f8fafc;color:#475569;text-align:left'>"
        "<th style='padding:7px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em'>Month</th>"
        "<th style='padding:7px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;text-align:right'>Approved</th>"
        "<th style='padding:7px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;text-align:right'>Pending</th>"
        "</tr>"
    )
    body_rows = "".join(
        f"<tr style='border-top:1px solid #e2e8f0'>"
        f"<td style='padding:7px 12px;color:#0f172a;font-weight:700'>{item['label']}</td>"
        f"<td style='padding:7px 12px;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums'>{item['approved']:.1f}</td>"
        f"<td style='padding:7px 12px;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums'>{item['pending']:.1f}</td>"
        "</tr>"
        for item in history
    )
    total_row = (
        "<tr style='background:#eff6ff;border-top:2px solid #93c5fd'>"
        "<td style='padding:8px 12px;color:#1d4ed8;font-weight:900'>Total (3 mo.)</td>"
        f"<td style='padding:8px 12px;color:#1d4ed8;text-align:right;font-weight:900;font-variant-numeric:tabular-nums'>{stats['last_3_months_total_approved']:.1f}</td>"
        f"<td style='padding:8px 12px;color:#1d4ed8;text-align:right;font-weight:900;font-variant-numeric:tabular-nums'>{stats['last_3_months_total_pending']:.1f}</td>"
        "</tr>"
    )
    history_table = f"""
<h3 style="margin:18px 0 8px;color:#344054;font-size:15px">Past 3 Months — {stats.get('category', 'category')} only</h3>
<table style="border-collapse:collapse;margin:8px 0 14px;width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
  {head_cells}
  {body_rows}
  {total_row}
</table>
"""
    return year_table + history_table


def _leave_category(leave_type: str) -> str:
    normalized = (leave_type or "").strip().lower()
    if normalized in {"sick leave", "sick", "medical leave"}:
        return "sick"
    if normalized in {"personal leave", "personal"}:
        return "personal"
    if normalized in {"annual leave", "vacation leave", "vacation"}:
        return "annual"
    return "other"


def _process_steps(leave: "LeaveRequest") -> list[tuple[str, str]]:
    category = _leave_category(leave.leave_type)
    if category == "sick":
        return [
            ("SUBMIT", "Submit"),
            ("HR", "HR Acknowledge"),
            ("APPROVED", "Approved"),
        ]
    if category == "personal":
        return [
            ("SUBMIT", "Submit"),
            ("PM", "PM Approval"),
            ("APPROVED", "Approved"),
            ("ACK", "HR + Boss Acknowledge"),
        ]
    return [
        ("SUBMIT", "Submit"),
        ("PM", "PM Approval"),
        ("PD", "PD / Dept. Head Approval"),
        ("APPROVED", "Approved"),
        ("ACK", "HR + Boss Acknowledge"),
    ]


def _step_status(leave: "LeaveRequest", step_key: str) -> str:
    rejected_step = (leave.reject_at_step or "").upper()
    if leave.status == "REJECTED":
        if step_key == rejected_step or (step_key == "PD" and rejected_step == "DC"):
            return "rejected"
        order = [key for key, _ in _process_steps(leave)]
        rejected_key = "PD" if rejected_step == "DC" else rejected_step
        if rejected_key in order and step_key in order and order.index(step_key) < order.index(rejected_key):
            return "done"
        return "todo"

    # SUBMIT is always done once a record exists.
    if step_key == "SUBMIT":
        return "done"
    # ACK is "after APPROVED" — it should be DONE only when the request is APPROVED,
    # not while still PENDING_PM / PENDING_DC. Otherwise the visual flow shows
    # "[DONE] HR + Boss Ack" before "Approved" is even reached.
    if step_key == "ACK":
        return "done" if leave.status == "APPROVED" else "todo"

    if leave.status == "PENDING_HR":
        return "current" if step_key == "HR" else "todo"
    if leave.status == "PENDING_PM":
        return "current" if step_key == "PM" else "todo"
    if leave.status == "PENDING_DC":
        if step_key == "PM":
            return "done"
        return "current" if step_key == "PD" else "todo"
    if leave.status == "APPROVED":
        return "done"
    return "todo"


def _process_flow_text(leave: "LeaveRequest") -> str:
    markers = {"done": "[DONE]", "current": "[NOW]", "rejected": "[REJECTED]", "todo": "[ ]"}
    steps = [f"{markers[_step_status(leave, key)]} {label}" for key, label in _process_steps(leave)]
    return "\nProcess flow:\n  " + " -> ".join(steps) + "\n"


def _process_flow_html(leave: "LeaveRequest") -> str:
    styles = {
        "done": ("#dcfce7", "#166534", "#86efac", "Done"),
        "current": ("#dbeafe", "#1d4ed8", "#93c5fd", "Now"),
        "rejected": ("#fee2e2", "#b91c1c", "#fca5a5", "Rejected"),
        "todo": ("#f8fafc", "#64748b", "#e2e8f0", "Pending"),
    }
    cells = []
    steps = _process_steps(leave)
    for index, (key, label) in enumerate(steps):
        state = _step_status(leave, key)
        bg, color, border, badge = styles[state]
        cells.append(
            "<td style='vertical-align:top;padding:4px 0'>"
            f"<div style='border:1px solid {border};background:{bg};color:{color};"
            "border-radius:8px;padding:9px 10px;min-width:92px;text-align:center'>"
            f"<div style='font-size:11px;font-weight:700;text-transform:uppercase'>{badge}</div>"
            f"<div style='font-size:12px;font-weight:700;line-height:1.25;margin-top:3px'>{label}</div>"
            "</div>"
            "</td>"
        )
        if index < len(steps) - 1:
            cells.append("<td style='padding:0 6px;color:#94a3b8;font-size:18px;vertical-align:middle'>→</td>")
    return f"""
<h3 style="margin:18px 0 8px;color:#344054;font-size:15px">Process Flow Diagram</h3>
<table style="border-collapse:collapse;margin:8px 0 14px;width:100%">
  <tr>{''.join(cells)}</tr>
</table>
"""


def leave_submitted_email(leave: "LeaveRequest", stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    # actors is accepted for signature parity (submit has no approver yet, so unused here).
    _ = actors
    step = "HR acknowledgement" if leave.status == "PENDING_HR" else "PM approval"
    subject = f"[Leave Request] {leave.employee_name} — {leave.leave_type} ({leave.days}d)"
    body_text = (
        f"Leave request submitted — awaiting {step}.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"Reason   : {leave.reason or '—'}\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}\n"
        "Please log in to ACE System to continue."
    )
    body_html = _base_html(
        f"Leave Request — {'HR Acknowledgement' if leave.status == 'PENDING_HR' else 'PM Approval'} Required",
        f"<p>A new leave request has been submitted and is <b>awaiting {step}</b>.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p>Please log in to ACE System to <b>Approve</b> or <b>Reject</b> this request.</p>",
    )
    return subject, body_text, body_html


def _actor(code: str | None, actors: dict[str, str] | None) -> str:
    """Resolve an employee_code to "Full Name (CODE)". Falls back to raw code."""
    if not code:
        return "—"
    if actors and code in actors and actors[code]:
        return f"{actors[code]} ({code})"
    return code


def leave_pm_approved_email(leave: "LeaveRequest", next_step: str = "PD", skip_dc: bool = False, stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    note = ""
    step_labels = {"PD": "PD / Department Head Approval", "DC": "PD / Department Head Approval", "HR": "HR Acknowledgement"}
    step_label = step_labels.get(next_step, f"{next_step} Review")
    pm_display = _actor(leave.pm_approved_by, actors)
    subject = f"[Leave Request] PM Approved — {leave.employee_name}{note}"
    body_text = (
        f"PM has approved the leave request. Now awaiting {next_step} review.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"PM       : {pm_display}\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}\n"
        "Please log in to ACE System to continue the approval."
    )
    body_html = _base_html(
        f"Leave Request — {step_label} Required",
        f"<p>The PM has <b>approved</b> this leave request{note}. Your action is required.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p><b>PM approved by:</b> {pm_display}</p>"
        f"<p>Please log in to ACE System to <b>{'Acknowledge' if next_step == 'HR' else 'Approve / Reject'}</b>.</p>",
    )
    return subject, body_text, body_html


def leave_spm_approved_email(leave: "LeaveRequest", stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    pm_display  = _actor(leave.pm_approved_by, actors)
    spm_display = _actor(leave.spm_approved_by, actors)
    subject = f"[Leave Request] Senior PM Approved — {leave.employee_name}"
    body_text = (
        f"Senior Project Manager has approved the leave request. Now awaiting DC (Project Director) review.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"PM       : {pm_display}\n"
        f"Senior PM: {spm_display}\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}\n"
        "Please log in to ACE System to approve or reject."
    )
    body_html = _base_html(
        "Leave Request — DC (Project Director) Approval Required",
        f"<p>The Senior PM has <b>approved</b> this leave request. DC approval required.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p><b>PM approved by:</b> {pm_display}<br>"
        f"<b>Senior PM approved by:</b> {spm_display}</p>"
        f"<p>Please log in to ACE System to <b>Approve / Reject</b>.</p>",
    )
    return subject, body_text, body_html


def leave_dc_approved_email(leave: "LeaveRequest", stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    pm_display = _actor(leave.pm_approved_by, actors)
    pd_display = _actor(leave.dc_approved_by, actors)
    subject = f"[Leave Request] PD Approved — {leave.employee_name}"
    body_text = (
        f"PD / Department Head has approved the leave request. HR and Boss acknowledgement notified.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"PM       : {pm_display}\n"
        f"PD       : {pd_display}\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}\n"
        "This request is now approved."
    )
    body_html = _base_html(
        "Leave Request — APPROVED (HR + Boss Notified)",
        f"<p>The PD / Department Head has <b>approved</b> this leave request. HR and Boss acknowledgement has been notified.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p><b>PM approved by:</b> {pm_display}<br>"
        f"<b>PD approved by:</b> {pd_display}</p>",
    )
    return subject, body_text, body_html


def leave_hr_acknowledged_email(leave: "LeaveRequest", stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    subject = f"[Leave Summary] APPROVED — {leave.employee_name} {leave.leave_type} ({leave.days}d)"
    has_hr_ack = bool(leave.hr_acknowledged_by)
    chain_lines = []
    if leave.pm_approved_by:
        chain_lines.append(f"PM: {_actor(leave.pm_approved_by, actors)}")
    if leave.spm_approved_by:
        chain_lines.append(f"Senior PM: {_actor(leave.spm_approved_by, actors)}")
    if leave.dc_approved_by:
        chain_lines.append(f"PD: {_actor(leave.dc_approved_by, actors)}")
    if leave.hr_acknowledged_by:
        chain_lines.append(f"HR: {_actor(leave.hr_acknowledged_by, actors)}")
    elif leave.leave_type != "Sick Leave":
        chain_lines.append("HR + Boss: Notified")
    chain_text = "\n  ".join(chain_lines)
    chain_html = "<br>".join(chain_lines)
    body_text = (
        f"Leave request has been APPROVED{' and acknowledged by HR' if has_hr_ack else '. HR and Boss have been notified for acknowledgement'}.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}\n"
        f"Approval chain:\n  {chain_text}"
    )
    body_html = _base_html(
        "Leave Request — APPROVED (Summary)",
        f"<p>The leave request has been <b style='color:#16a34a'>APPROVED</b>{' and acknowledged by HR' if has_hr_ack else '. HR and Boss have been notified for acknowledgement'}.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p><b>Approval chain:</b><br>{chain_html}</p>",
    )
    return subject, body_text, body_html


def leave_rejected_email(leave: "LeaveRequest", stats: dict | None = None, actors: dict[str, str] | None = None) -> tuple[str, str, str]:
    step = leave.reject_at_step or "?"
    rejector = _actor(leave.reviewed_by, actors)
    subject = f"[Leave Request] REJECTED at {step} — {leave.employee_name}"
    body_text = (
        f"Leave request has been REJECTED at the {step} step.\n\n"
        f"Employee : {leave.employee_name} ({leave.employee_code})\n"
        f"Type     : {leave.leave_type} / {leave.session_type}\n"
        f"Period   : {leave.start_date} → {leave.end_date} ({leave.days} day(s))\n"
        f"{_process_flow_text(leave)}"
        f"{_leave_stats_text(stats)}"
        f"Reason   : {leave.reject_reason or '—'}\n"
        f"Rejected by: {rejector}"
    )
    body_html = _base_html(
        f"Leave Request — REJECTED at {step} Step",
        f"<p>The leave request has been <b style='color:#dc2626'>REJECTED</b> at the <b>{step}</b> step.</p>"
        f"{_leave_detail_rows(leave)}"
        f"{_process_flow_html(leave)}"
        f"{_leave_stats_html(stats)}"
        f"<p><b>Reject reason:</b> {leave.reject_reason or '—'}<br>"
        f"<b>Rejected by:</b> {rejector}</p>",
    )
    return subject, body_text, body_html
