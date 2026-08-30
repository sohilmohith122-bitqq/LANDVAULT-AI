"""Operational statistics — aggregated across the corpus (GET /api/stats/overview)."""

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import now_utc
from ..database import get_db
from ..deps import get_current_user
from ..models import AuditEvent, Conflict, Document, LandRecord, User

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview")
def stats_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total_records = db.scalar(select(func.count(LandRecord.id))) or 0
    verified = db.scalar(select(func.count(LandRecord.id)).where(LandRecord.status == "VERIFIED")) or 0
    in_review = (
        db.scalar(
            select(func.count(LandRecord.id)).where(LandRecord.status.in_(["IN_REVIEW", "CONFLICT"]))
        )
        or 0
    )
    conflict_records = (
        db.scalar(select(func.count(LandRecord.id)).where(LandRecord.status == "CONFLICT")) or 0
    )
    open_conflicts = (
        db.scalar(
            select(func.count(Conflict.id)).where(Conflict.status.in_(["OPEN", "UNDER_REVIEW"]))
        )
        or 0
    )

    week_ago = now_utc() - timedelta(days=7)
    docs_this_week = db.scalar(select(func.count(Document.id)).where(Document.uploaded_at >= week_ago)) or 0
    total_docs = db.scalar(select(func.count(Document.id))) or 0
    avg_ocr = db.scalar(select(func.avg(Document.ocr_confidence)).where(Document.ocr_confidence.is_not(None)))

    records = db.scalars(select(LandRecord)).all()
    field_confidences = [
        float(f["confidence"])
        for rec in records
        for f in (rec.fields or [])
        if isinstance(f, dict) and isinstance(f.get("confidence"), (int, float))
    ]
    avg_ext = sum(field_confidences) / len(field_confidences) if field_confidences else None
    low_conf_rate = (sum(1 for c in field_confidences if c < 0.7) / len(field_confidences)) if field_confidences else 0.0

    corrected = db.scalar(select(func.count(AuditEvent.id)).where(AuditEvent.action == "FIELD_CORRECTED")) or 0
    accepted = db.scalar(select(func.count(AuditEvent.id)).where(AuditEvent.action == "FIELD_ACCEPTED")) or 0
    correction_rate = (corrected / (corrected + accepted)) if (corrected + accepted) else 0.0

    pipeline = [
        {"stage": "Uploaded", "count": total_docs},
        {
            "stage": "Processing",
            "count": db.scalar(
                select(func.count(Document.id)).where(Document.status.in_(["QUEUED", "PREPROCESSING", "OCR", "EXTRACTION"]))
            )
            or 0,
        },
        {"stage": "Extracted", "count": db.scalar(select(func.count(LandRecord.id)).where(LandRecord.status == "EXTRACTED")) or 0},
        {"stage": "Validation", "count": db.scalar(select(func.count(LandRecord.id)).where(LandRecord.status == "DRAFT")) or 0},
        {"stage": "Human Review", "count": in_review},
        {"stage": "Verified", "count": verified},
    ]

    docs_by_type = [
        {"type": row[0] or "OTHER", "count": row[1]}
        for row in db.execute(select(Document.document_type, func.count(Document.id)).group_by(Document.document_type)).all()
    ]

    docs_by_language: dict[str, int] = {}
    for lang_json, count in db.execute(
        select(Document.language, func.count(Document.id)).group_by(Document.language)
    ).all():
        label = " + ".join(str(l).upper() for l in (lang_json or ["en"]))
        docs_by_language[label] = docs_by_language.get(label, 0) + count
    documents_by_language = [{"language": k, "count": v} for k, v in sorted(docs_by_language.items())]

    weekly_volume = []
    for i in range(6, 0, -1):
        start = now_utc() - timedelta(weeks=i)
        end = now_utc() - timedelta(weeks=i - 1)
        count = db.scalar(select(func.count(Document.id)).where(Document.uploaded_at >= start, Document.uploaded_at < end)) or 0
        weekly_volume.append({"week": f"W{6 - i + 1}", "documents": count})

    return {
        "totalRecords": total_records,
        "digitized": max(total_records - conflict_records, 0),
        "verified": verified,
        "pendingReview": in_review,
        "conflicts": open_conflicts,
        "documentsThisWeek": docs_this_week,
        "avgOcrConfidence": round(float(avg_ocr), 4) if avg_ocr is not None else None,
        "avgExtractionConfidence": round(avg_ext, 4) if avg_ext is not None else None,
        "lowConfidenceRate": round(low_conf_rate, 4),
        "correctionRate": round(correction_rate, 4),
        "avgProcessingHours": None,
        "errorsByDistrict": [],
        "pipeline": pipeline,
        "documentsByType": docs_by_type,
        "documentsByLanguage": documents_by_language,
        "weeklyVolume": weekly_volume,
    }
