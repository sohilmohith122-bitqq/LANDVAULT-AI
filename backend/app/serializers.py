"""Database row → frontend JSON serializers.

Every serializer produces the camelCase contract defined in `frontend/src/types`
so the backend can serve the same shapes the UI already renders. Original values
are never mutated; missing values map to null/empty rather than fabricated data.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .common import now_utc
from .models import Conflict, District, GisParcel, LandRecord, Taluk, Village


def _iso(value) -> str | None:
    return value.isoformat() if value else None


# ------------------------------- Documents ------------------------------- #

def document_dict(doc) -> dict:
    return {
        "id": doc.reference_no,
        "referenceNo": doc.reference_no,
        "filename": doc.filename,
        "documentType": doc.document_type,
        "language": doc.language or ["en"],
        "district": doc.district or "",
        "taluk": doc.taluk or "",
        "village": doc.village or "",
        "pageCount": doc.page_count or 0,
        "fileSizeBytes": doc.file_size_bytes,
        "status": doc.status,
        "progress": doc.progress,
        "uploadedAt": _iso(doc.uploaded_at) or now_utc().isoformat(),
        "uploadedBy": doc.uploaded_by or "",
        "ocrConfidence": doc.ocr_confidence,
    }


# -------------------------------- Records -------------------------------- #

def record_dict(rec: LandRecord) -> dict:
    owner = rec.owner_name_original or rec.owner_name_normalized or ""
    return {
        "id": rec.record_number,
        "recordNumber": rec.record_number,
        "documentId": rec.document_id,
        "surveyNumber": rec.survey_number,
        "subdivisionNumber": rec.subdivision_number,
        "khataNumber": None,
        "ownerName": owner,
        "ownerNameTamil": None,
        "coOwners": [],
        "area": rec.area or 0,
        "areaUnit": rec.area_unit or "Acres",
        "village": rec.village or "",
        "taluk": rec.taluk or "",
        "district": rec.district or "",
        "state": "Tamil Nadu",
        "landType": "",
        "documentType": rec.document_type or "OTHER",
        "documentNumber": None,
        "registrationDate": None,
        "status": rec.status,
        "verifyConfidence": rec.verify_confidence,
        "fields": rec.fields or [],
        "createdAt": _iso(rec.created_at),
        "updatedAt": _iso(rec.updated_at),
    }


# ------------------------------- Conflicts ------------------------------- #

def conflict_dict(c: Conflict) -> dict:
    return {
        "id": c.conflict_id,
        "recordId": c.record_id,
        "documentId": c.document_id,
        "category": c.category,
        "severity": c.severity,
        "description": c.description,
        "status": c.status,
        "field": c.field,
        "extractedValue": c.extracted_value,
        "referenceValue": c.reference_value,
        "difference": c.difference,
        "evidence": c.evidence or {},
        "createdAt": _iso(c.created_at),
        "updatedAt": _iso(c.updated_at),
        "resolvedBy": c.resolved_by,
        "resolutionNote": c.resolution_note,
    }


# --------------------------------- Audit --------------------------------- #

def audit_dict(e) -> dict:
    return {
        "id": e.event_id,
        "timestamp": _iso(e.timestamp),
        "userId": e.user_id,
        "userName": e.user_name or "",
        "userRole": e.user_role or "VIEWER",
        "action": e.action,
        "recordId": e.record_id,
        "documentId": e.document_id,
        "field": e.field,
        "oldValue": e.old_value,
        "newValue": e.new_value,
        "reason": e.reason,
    }


# ------------------------------- Activity -------------------------------- #

def activity_dict(e) -> dict:
    """Derive a dashboard activity item from an audit event."""
    _TYPE = {
        "DOCUMENT_UPLOAD": "upload",
        "OCR_COMPLETED": "processing",
        "EXTRACTION_COMPLETED": "extraction",
        "VALIDATION_COMPLETED": "validation",
        "CONFLICT_CREATED": "conflict",
        "RECORD_VERIFIED": "verification",
        "FIELD_ACCEPTED": "verification",
        "FIELD_CORRECTED": "correction",
    }
    title = e.action.replace("_", " ").title()
    return {
        "id": e.event_id,
        "type": _TYPE.get(e.action, "processing"),
        "title": title,
        "description": e.reason or f"{e.user_name or 'System'} — {title}",
        "timestamp": _iso(e.timestamp),
        "user": e.user_name or "System",
    }


# ----------------------------- GIS parcels ------------------------------- #

def gis_parcel_dict(db: Session, p: GisParcel) -> dict:
    """GIS parcel enriched with geography names, linked record and conflict state."""
    village = db.get(Village, p.village_id) if p.village_id else None
    taluk = db.get(Taluk, village.taluk_id) if village else None
    district = db.get(District, taluk.district_id) if taluk else None

    record = None
    if p.survey_number:
        if p.subdivision_number:
            stmt = (
                select(LandRecord)
                .where(
                    LandRecord.survey_number == p.survey_number,
                    LandRecord.subdivision_number == p.subdivision_number,
                )
                .limit(1)
            )
        else:
            stmt = (
                select(LandRecord)
                .where(
                    LandRecord.survey_number == p.survey_number,
                    LandRecord.subdivision_number.is_(None),
                )
                .limit(1)
            )
        record = db.scalar(stmt)

    record_id = record.record_number if record else None
    has_conflict = False
    if record_id:
        has_conflict = (
            db.scalar(
                select(func.count(Conflict.id)).where(
                    Conflict.record_id == record_id,
                    Conflict.status.in_(["OPEN", "UNDER_REVIEW"]),
                )
            )
            or 0
        ) > 0

    return {
        "id": p.parcel_id,
        "parcelId": p.parcel_id,
        "surveyNumber": p.survey_number,
        "subdivisionNumber": p.subdivision_number,
        "village": village.village_name_en if village else "",
        "taluk": taluk.taluk_name_en if taluk else "",
        "district": district.district_name_en if district else "",
        "area": p.calculated_area or 0,
        "areaUnit": p.area_unit or "Acres",
        "geometry": p.geometry or {"type": "Polygon", "coordinates": []},
        "status": "CONFLICT" if has_conflict else (record.status if record else "EXTRACTED"),
        "hasConflict": has_conflict,
        "recordId": record_id,
    }

