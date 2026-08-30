"""Conflicts — list/get/resolve. Resolving or dismissing a conflict is audited
and never deletes the conflict row (status transitions only).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import now_utc, paginated, write_audit
from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import Conflict, User
from ..schemas import ResolveBody
from ..serializers import conflict_dict

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"])


@router.get("")
def list_conflicts(
    status: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = []
    if status:
        filters.append(Conflict.status == status)
    total = db.scalar(select(func.count()).select_from(Conflict).where(*filters)) or 0
    rows = db.scalars(
        select(Conflict)
        .where(*filters)
        .order_by(Conflict.created_at.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return paginated([conflict_dict(c) for c in rows], total, page, pageSize)


@router.get("/{conflict_id}")
def get_conflict(
    conflict_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conflict = db.scalar(select(Conflict).where(Conflict.conflict_id == conflict_id))
    if conflict is None:
        raise HTTPException(status_code=404, detail=f'Conflict "{conflict_id}" not found')
    return conflict_dict(conflict)


@router.post("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    body: ResolveBody,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    action = body.action.upper()
    if action not in ("RESOLVE", "DISMISS"):
        raise HTTPException(status_code=400, detail="action must be RESOLVE or DISMISS")
    conflict = db.scalar(select(Conflict).where(Conflict.conflict_id == conflict_id))
    if conflict is None:
        raise HTTPException(status_code=404, detail=f'Conflict "{conflict_id}" not found')

    previous_status = conflict.status
    conflict.status = "RESOLVED" if action == "RESOLVE" else "DISMISSED"
    conflict.resolved_by = user.username
    conflict.resolution_note = body.note
    conflict.updated_at = now_utc()
    write_audit(
        db,
        user,
        "CONFLICT_RESOLVED" if action == "RESOLVE" else "CONFLICT_DISMISSED",
        record_id=conflict.record_id,
        document_id=conflict.document_id,
        field=conflict.field,
        old_value={"status": previous_status},
        new_value={"status": conflict.status},
        reason=body.note or f"Conflict {action.lower()}ed",
    )
    db.commit()
    db.refresh(conflict)
    return conflict_dict(conflict)