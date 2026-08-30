"""Audit trail + activity feed.

The audit trail is append-only: events are never edited or deleted; corrections
preserve old and new values. The dashboard activity feed is derived from the
same events.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..common import paginated
from ..database import get_db
from ..deps import get_current_user
from ..models import AuditEvent, User
from ..serializers import activity_dict, audit_dict

audit_router = APIRouter(prefix="/api/audit", tags=["audit"])
activity_router = APIRouter(prefix="/api/activity", tags=["activity"])


@audit_router.get("")
def list_audit(
    query: str | None = None,
    recordId: str | None = None,
    documentId: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = []
    if recordId:
        filters.append(AuditEvent.record_id == recordId)
    if documentId:
        filters.append(AuditEvent.document_id == documentId)
    if query:
        q = query.strip().lower()
        filters.append(
            or_(
                AuditEvent.action.ilike(f"%{q}%"),
                AuditEvent.user_name.ilike(f"%{q}%"),
                AuditEvent.reason.ilike(f"%{q}%"),
            )
        )
    total = db.scalar(select(func.count()).select_from(AuditEvent).where(*filters)) or 0
    rows = db.scalars(
        select(AuditEvent)
        .where(*filters)
        .order_by(AuditEvent.timestamp.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return paginated([audit_dict(e) for e in rows], total, page, pageSize)


@activity_router.get("")
def list_activity(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(50)).all()
    return [activity_dict(e) for e in rows]