"""Shared API helpers — timestamp, audit, pagination, and user serialization.

Kept dependency-free of routers so every router imports from here without cycles.
"""

import secrets as pysecrets
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from .models import AuditEvent, User


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_event_id(prefix: str = "EVT") -> str:
    return f"{prefix}-{pysecrets.token_hex(5).upper()}"


def paginated(items: list, total: int, page: int, page_size: int) -> dict:
    return {"items": items, "total": total, "page": page, "pageSize": page_size}


def write_audit(db: Session, user: User | None, action: str, **kwargs) -> AuditEvent:
    """Append an audit event. Extra kwargs map to AuditEvent columns
    (record_id, document_id, field, old_value, new_value, reason)."""
    event = AuditEvent(
        event_id=new_event_id("EVT"),
        user_id=user.user_id if user else None,
        user_name=user.username if user else None,
        user_role=user.role if user else None,
        action=action,
        **kwargs,
    )
    db.add(event)
    return event


def user_dict(user: User) -> dict:
    return {
        "id": user.user_id,
        "username": user.username,
        "fullName": user.full_name,
        "email": user.email,
        "role": user.role,
        "languagePreference": "en",
        "isActive": user.is_active,
        "lastLoginAt": None,
    }
