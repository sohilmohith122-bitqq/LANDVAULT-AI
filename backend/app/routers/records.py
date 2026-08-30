"""Land records — list/get/validation/verify. Verification is human-in-the-loop:
the record status moves to VERIFIED and the action is audited with old/new values.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..common import paginated, write_audit
from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import LandRecord, User
from ..schemas import VerifyBody
from ..serializers import record_dict

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("")
def list_records(
    query: str | None = None,
    district: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = []
    if district:
        filters.append(LandRecord.district == district)
    if status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        if statuses:
            filters.append(LandRecord.status.in_(statuses))
    if query:
        q = query.strip().lower()
        filters.append(
            or_(
                LandRecord.owner_name_original.ilike(f"%{q}%"),
                LandRecord.owner_name_normalized.ilike(f"%{q}%"),
                LandRecord.survey_number.ilike(f"%{q}%"),
                LandRecord.record_number.ilike(f"%{q}%"),
                LandRecord.village.ilike(f"%{q}%"),
            )
        )

    total = db.scalar(select(func.count()).select_from(LandRecord).where(*filters)) or 0
    rows = db.scalars(
        select(LandRecord)
        .where(*filters)
        .order_by(LandRecord.updated_at.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return paginated([record_dict(r) for r in rows], total, page, pageSize)


@router.get("/{record_id:path}/validation")
def record_validation(
    record_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # The configurable rule engine (Phase 9) plugs in here. Until then the
    # endpoint returns the (empty) set of engine results for this record.
    rec = db.scalar(select(LandRecord).where(LandRecord.record_number == record_id))
    if rec is None:
        raise HTTPException(status_code=404, detail=f'Record "{record_id}" not found')
    return []


@router.post("/{record_id:path}/verify")
def verify_record(
    record_id: str,
    body: VerifyBody,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("ADMIN", "OFFICER", "VERIFIER")),
):
    rec = db.scalar(select(LandRecord).where(LandRecord.record_number == record_id))
    if rec is None:
        raise HTTPException(status_code=404, detail=f'Record "{record_id}" not found')
    old_status = rec.status
    rec.status = "VERIFIED"
    rec.verify_confidence = 0.99
    write_audit(
        db,
        user,
        "RECORD_VERIFIED",
        record_id=rec.record_number,
        document_id=rec.document_id,
        old_value={"status": old_status},
        new_value={"status": "VERIFIED"},
        reason=body.note or "Record approved by human verifier",
    )
    db.commit()
    db.refresh(rec)
    return record_dict(rec)


@router.get("/{record_id:path}")
def get_record(
    record_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # `:path` converter so slashed record numbers (e.g. "REC-124/2A-PATTA") match.
    # Registered after /validation and /verify so those specific routes win.
    rec = db.scalar(select(LandRecord).where(LandRecord.record_number == record_id))
    if rec is None:
        raise HTTPException(status_code=404, detail=f'Record "{record_id}" not found')
    return record_dict(rec)