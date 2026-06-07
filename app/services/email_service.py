import os
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email import EmailOutbox


@dataclass
class EmailResult:
    status: str
    outbox_id: int | None = None
    error_code: str | None = None
    error_message: str | None = None

    @property
    def ok(self) -> bool:
        return self.status == "SENT"


def smtp_config() -> dict:
    return {
        "host": os.getenv("SMTP_HOST", "").strip(),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from": os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "")).strip(),
        "tls": os.getenv("SMTP_TLS", "true").lower() in {"1", "true", "yes", "on"},
        "provider": os.getenv("SMTP_PROVIDER", "SMTP").strip() or "SMTP",
    }


def is_smtp_configured() -> bool:
    cfg = smtp_config()
    return bool(cfg["host"] and cfg["user"] and cfg["password"] and cfg["from"])


def from_address() -> str:
    """Bare sending mailbox (no display name) — e.g. 'ace-system@airconnect-e.com'.

    Used as the iCalendar ORGANIZER so it matches the email From header; Exchange/
    Outlook require this match to let recipients Accept/Decline the meeting.
    """
    from email.utils import parseaddr
    return parseaddr(smtp_config()["from"])[1]


DRY_RUN_FLAG_FILE = "/tmp/EMAIL_DRY_RUN"


def is_dry_run() -> bool:
    """Skip real SMTP send, mark outbox row as DRY_RUN. Toggle without restart
    via:  touch /tmp/EMAIL_DRY_RUN   /   rm /tmp/EMAIL_DRY_RUN
    Also honors EMAIL_DRY_RUN env var."""
    if os.getenv("EMAIL_DRY_RUN", "").lower() in {"1", "true", "yes", "on"}:
        return True
    return os.path.exists(DRY_RUN_FLAG_FILE)


def app_base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")


async def queue_and_send_email(
    db: AsyncSession,
    recipient: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
    cc: list[str] | None = None,
    ics_content: str | None = None,
    ics_method: str | None = None,
    ics_filename: str = "invite.ics",
) -> EmailResult:
    cfg = smtp_config()
    cc_list = _clean_recipients(cc or [], exclude={recipient})
    row = EmailOutbox(
        recipient=recipient,
        cc_recipients=", ".join(cc_list) if cc_list else None,
        subject=subject,
        body_text=body_text,
        body_html=body_html,
        status="PENDING",
        provider=cfg["provider"],
    )
    db.add(row)
    await db.flush()

    if is_dry_run():
        row.status = "DRY_RUN"
        row.error_code = None
        row.error_message = "Dry-run mode: email NOT sent over SMTP (body preserved for inspection)."
        row.attempts = 0
        row.sent_at = datetime.now(timezone.utc)
        await db.flush()
        return EmailResult(row.status, row.id, row.error_code, row.error_message)

    if not is_smtp_configured():
        row.status = "FAILED"
        row.error_code = "SMTP_NOT_CONFIGURED"
        row.error_message = "SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM are required."
        row.attempts = 0
        await db.flush()
        return EmailResult(row.status, row.id, row.error_code, row.error_message)

    row.attempts = (row.attempts or 0) + 1
    try:
        _send_smtp(cfg, recipient, subject, body_text, body_html, cc_list,
                   ics_content=ics_content, ics_method=ics_method, ics_filename=ics_filename)
        row.status = "SENT"
        row.sent_at = datetime.now(timezone.utc)
        row.error_code = None
        row.error_message = None
    except smtplib.SMTPRecipientsRefused as exc:
        row.status = "FAILED"
        row.error_code = "RECIPIENT_REJECTED"
        # exc.recipients = {email: (code, msg_bytes)}
        details = "; ".join(
            f"{addr}: {msg.decode() if isinstance(msg, bytes) else msg}"
            for addr, (code, msg) in exc.recipients.items()
        )
        row.error_message = details
    except smtplib.SMTPAuthenticationError as exc:
        row.status = "FAILED"
        row.error_code = "SMTP_AUTH_FAILED"
        row.error_message = str(exc)
    except smtplib.SMTPException as exc:
        row.status = "FAILED"
        row.error_code = "SMTP_SEND_FAILED"
        row.error_message = str(exc)
    except OSError as exc:
        row.status = "FAILED"
        row.error_code = "SMTP_CONNECTION_FAILED"
        row.error_message = str(exc)

    await db.flush()
    return EmailResult(row.status, row.id, row.error_code, row.error_message)


def _clean_recipients(recipients: list[str], exclude: set[str] | None = None) -> list[str]:
    excluded = {e.strip().lower() for e in (exclude or set()) if e}
    clean = []
    seen = set()
    for recipient in recipients:
        email = (recipient or "").strip()
        key = email.lower()
        if not email or key in excluded or key in seen:
            continue
        clean.append(email)
        seen.add(key)
    return clean


def _send_smtp(
    cfg: dict,
    recipient: str,
    subject: str,
    body_text: str,
    body_html: str | None,
    cc: list[str] | None = None,
    ics_content: str | None = None,
    ics_method: str | None = None,
    ics_filename: str = "invite.ics",
) -> None:
    message = EmailMessage()
    message["From"] = cfg["from"]
    message["To"] = recipient
    if cc:
        message["Cc"] = ", ".join(cc)
    message["Subject"] = subject
    message.set_content(body_text)
    if body_html:
        message.add_alternative(body_html, subtype="html")

    if ics_content:
        method = (ics_method or "REQUEST").upper()
        # The calendar MUST be the last part of a multipart/alternative message
        # (NOT a separate attachment) — otherwise the message becomes
        # multipart/mixed and Outlook/Gmail treat the .ics as a file attachment
        # instead of a meeting request, so it never lands on the calendar.
        # (EmailMessage handles UTF-8 transfer-encoding of the part for us.)
        message.add_alternative(ics_content, subtype="calendar")
        cal_part = message.get_payload()[-1]
        cal_part.set_param("method", method)
        cal_part.set_param("charset", "UTF-8")
        cal_part.set_param("name", ics_filename)
        # Outlook-specific hint that this message is a calendar/meeting message.
        message["Content-class"] = "urn:content-classes:calendarmessage"

    if cfg["tls"]:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=20) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(cfg["user"], cfg["password"])
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=20) as server:
            server.login(cfg["user"], cfg["password"])
            server.send_message(message)


def welcome_email(employee_code: str, full_name: str, password: str, email: str = "") -> tuple[str, str, str]:
    login_url = f"{app_base_url()}/ClockApp"
    username = email or employee_code
    subject = "ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials"
    body_text = (
        f"เรียน คุณ{full_name},\n"
        "บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\n"
        f"Username : {username}\n"
        f"Password : {password}\n"
        f"Link     : {login_url}\n\n"
        "กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\n"
        "หากมีปัญหา กรุณาติดต่อ HR\n\n"
        "---\n\n"
        f"Dear {full_name},\n"
        "Your ACE System account is ready.\n\n"
        f"Username : {username}\n"
        f"Password : {password}\n"
        f"Link     : {login_url}\n\n"
        "Please change your password after your first login.\n"
        "If you have any issues, please contact HR.\n\n"
        "ACE System"
    )
    body_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">
      <!-- Header -->
      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>
        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">
          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials
        </p>
      </div>

      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">

        <!-- Thai greeting -->
        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณ{full_name}</b></p>
        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>

        <!-- Credentials table -->
        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">
          <tr>
            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>
            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">{username}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>
            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">{password}</td>
          </tr>
        </table>

        <!-- Login button -->
        <p style="margin:22px 0 6px;text-align:center">
          <a href="{login_url}"
             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">
            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In
          </a>
        </p>

        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">

        <!-- English greeting -->
        <p style="margin:0 0 4px;font-size:14px">Dear <b>{full_name}</b>,</p>
        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>

        <!-- Notes -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">
          <b>⚠ หมายเหตุ / Note</b><br>
          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>
          • Please change your password after your first login.<br>
          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.
        </div>

      </div>

      <!-- Footer -->
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">
        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System
      </p>
    </div>
    """
    return subject, body_text, body_html


def contract_expiry_digest_email(contracts: list[dict], within_days: int) -> tuple[str, str, str]:
    hr_url = f"{app_base_url()}/hr/employees"
    count = len(contracts)
    subject = f"[ACE System] แจ้งเตือนสัญญาใกล้หมดอายุ {count} ราย / Contract Expiry Alert ({count})"

    lines_text = []
    for c in contracts:
        lines_text.append(
            f"- {c['employee_code']} | {c['full_name']} | {c.get('department','')} | "
            f"{c.get('contract_type','')} | สิ้นสุด: {c['contract_end_date']} "
            f"(เหลือ {c['days_until_expiry']} วัน)"
        )
    body_text = (
        f"แจ้งเตือน: มีพนักงาน {count} คนที่สัญญาจะหมดอายุภายใน {within_days} วัน\n\n"
        + "\n".join(lines_text)
        + f"\n\nดูรายละเอียดทั้งหมดและจัดการต่อสัญญา/ปิดจบได้ที่:\n{hr_url}\n\n"
        f"Notice: {count} employee contract(s) will expire within {within_days} days.\n\n"
        "ACE System"
    )

    def bucket_color(days: int) -> str:
        if days <= 7: return "#dc2626"
        if days <= 14: return "#ea580c"
        return "#ca8a04"

    rows_html = "".join(
        f"""<tr>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec;font-weight:700">{c['employee_code']}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec">{c['full_name']}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec;color:#475569;font-size:12px">{c.get('department','')}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec;color:#475569;font-size:12px">{c.get('contract_type','')}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec">{c['contract_end_date']}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e4e7ec;color:{bucket_color(c['days_until_expiry'])};font-weight:800;text-align:right">
            {c['days_until_expiry']} วัน
          </td>
        </tr>"""
        for c in contracts
    )

    body_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;line-height:1.6;color:#101828">
      <div style="background-color:#dc2626;padding:24px 28px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;color:#fff;font-size:20px">⚠ Contract Expiry Alert</h2>
        <p style="margin:5px 0 0;color:rgba(255,255,255,.9);font-size:13px">
          แจ้งเตือนสัญญาใกล้หมดอายุ — {count} ราย ภายใน {within_days} วัน
        </p>
      </div>
      <div style="background:#fff;padding:24px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">
        <p style="margin:0 0 12px;font-size:14px;color:#475569">
          เรียน HR Admin, มีพนักงาน <b>{count}</b> คนที่สัญญาจะหมดอายุภายใน <b>{within_days}</b> วัน
          กรุณาดำเนินการต่อสัญญาหรือยืนยันการปิดจบ
        </p>
        <table style="border-collapse:collapse;width:100%;font-size:13px;background:#f8faff;border:1px solid #e4e7ec;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#eef2ff">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569">Code</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569">Name</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569">Department</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569">Contract</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569">End Date</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569">Days Left</th>
            </tr>
          </thead>
          <tbody>{rows_html}</tbody>
        </table>
        <p style="margin:22px 0 6px;text-align:center">
          <a href="{hr_url}" style="display:inline-block;background-color:#2447d8;color:#fff;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
            📋 จัดการพนักงาน / Manage Employees
          </a>
        </p>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">
        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System
      </p>
    </div>
    """
    return subject, body_text, body_html
