"""Documents — list/get/upload. Uploads preserve the original file, compute a
SHA-256 hash, and queue the document for the (future) processing pipeline.
"""

import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import now_utc, paginated, write_audit
from ..config import UPLOAD_DIR, settings
from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import Document, User
from ..serializers import document_dict

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png"}


@router.get("")
def list_documents(
    district: str | None = None,
    documentType: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = []
    if district:
        filters.append(Document.district == district)
    if documentType:
        filters.append(Document.document_type == documentType)
    total = db.scalar(select(func.count()).select_from(Document).where(*filters)) or 0
    rows = db.scalars(
        select(Document)
        .where(*filters)
        .order_by(Document.uploaded_at.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
    ).all()
    return paginated([document_dict(d) for d in rows], total, page, pageSize)


@router.get("/{doc_id}")
def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = db.scalar(select(Document).where(Document.reference_no == doc_id))
    if doc is None:
        raise HTTPException(status_code=404, detail=f'Document "{doc_id}" not found')
    return document_dict(doc)


@router.post("", status_code=201)
def upload_document(
    file: UploadFile = File(...),
    documentType: str = Form(..., min_length=1),
    district: str = Form(..., min_length=1),
    village: str | None = Form(None),
    languages: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    _ext = Path(file.filename or "").suffix.lower()
    if _ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXT))}")
    if settings.max_upload_mb <= 0:
        raise HTTPException(status_code=400, detail="Uploads are disabled")

    data = file.file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_mb} MB limit")

    digest = hashlib.sha256(data).hexdigest()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{_ext}"
    (UPLOAD_DIR / stored_name).write_bytes(data)

    ref = f"DOC-{now_utc().strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
    doc = Document(
        reference_no=ref,
        filename=file.filename or stored_name,
        stored_path=str(UPLOAD_DIR / stored_name),
        file_hash=digest,
        file_size_bytes=len(data),
        document_type=documentType,
        language=languages or None,
        district=district,
        taluk=village or district,
        village=village or district,
        status="QUEUED",
        progress=0,
        uploaded_by=user.username,
    )
    db.add(doc)
    write_audit(
        db,
        user,
        "DOCUMENT_UPLOAD",
        document_id=ref,
        new_value={
            "filename": doc.filename,
            "documentType": doc.document_type,
            "fileSizeBytes": doc.file_size_bytes,
            "status": doc.status,
        },
        reason="Document uploaded for processing",
    )
    db.commit()
    db.refresh(doc)
    return document_dict(doc)