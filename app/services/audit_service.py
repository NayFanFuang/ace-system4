from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


SENSITIVE_KEYS = {
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "id_card_no",
    "national_id",
    "bank_account_no",
    "bank_account_name",
}

ACTION_LABELS = {
    "employee_created": "Employee created",
    "employee_profile_updated": "Employee profile updated",
    "employee_contract_updated": "Employee contract updated",
    "employee_status_changed": "Employee status changed",
    "employee_archived": "Employee archived",
    "employee_terminated": "Employee terminated",
    "document_uploaded": "Document uploaded",
    "document_replaced": "Document replaced",
    "document_deleted": "Document deleted",
    "login_created": "Login created",
    "login_deactivated": "Login deactivated",
    "welcome_email_sent": "Welcome email sent",
    "welcome_email_failed": "Welcome email failed",
    "password_reset_requested": "Password reset requested",
    "data_quality_issue_detected": "Data quality issue detected",
    "data_quality_issue_resolved": "Data quality issue resolved",
    "data_quality_issue_ignored": "Data quality issue ignored",
    "pv_created": "Payment voucher created",
    "pv_approved": "Payment voucher approved",
    "pv_paid": "Payment voucher paid",
    "pv_reverted": "Payment voucher reverted to draft",
    "pv_deleted": "Payment voucher deleted",
}


def client_ip(request: Request | None) -> str | None:
    if not request:
        return None
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else None


def _jsonable(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def mask_value(key: str, value: Any) -> Any:
    if value is None:
        return None
    if key.lower() in SENSITIVE_KEYS:
        return "***MASKED***"
    return _jsonable(value)


def mask_dict(values: dict[str, Any] | None) -> dict[str, Any] | None:
    if not values:
        return values
    return {key: mask_value(key, value) for key, value in values.items()}


def actor_name(payload: dict | None) -> str | None:
    if not payload:
        return None
    name = payload.get("name")
    if name:
        return name
    first = payload.get("firstName") or payload.get("first_name") or ""
    last = payload.get("lastName") or payload.get("last_name") or ""
    return f"{first} {last}".strip() or payload.get("sub")


async def write_audit_log(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str | int | None = None,
    employee_id: int | None = None,
    payload: dict | None = None,
    old_value: dict[str, Any] | None = None,
    new_value: dict[str, Any] | None = None,
    changed_fields: list[str] | None = None,
    request: Request | None = None,
    source: str = "HR",
    action_label: str | None = None,
) -> None:
    db.add(AuditLog(
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        employee_id=employee_id,
        action=action,
        action_label=action_label or ACTION_LABELS.get(action, action.replace("_", " ").title()),
        changed_by_user_id=payload.get("id") if payload else None,
        changed_by_name=actor_name(payload),
        changed_by_email=payload.get("email") if payload else None,
        old_value=mask_dict(old_value),
        new_value=mask_dict(new_value),
        changed_fields=changed_fields or [],
        ip_address=client_ip(request),
        user_agent=request.headers.get("user-agent") if request else None,
        source=source,
    ))
