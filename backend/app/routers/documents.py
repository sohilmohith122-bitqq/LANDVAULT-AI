"""Documents — list/get/upload. Uploads preserve the original file, compute a
SHA-256 hash, and queue the document for the (future) processing pipeline.

Upload hardening:
- Declared `Content-Length` is rejected before the body is buffered (fail fast).
- The body is streamed to disk in 1 MiB chunks — memory stays flat regardless of
  file size — with the size limit enforced *during* the stream.
- Magic bytes are verified against the extension, so renamed executables/HTML
  cannot masquerade as PDFs or images.
- Uploads are rate-limited per user to prevent storage/processing abuse.
"""

import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import now_utc, paginated, write_audit
from ..config import UPLOAD_DIR, settings
from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import Document, User
from ..rate_limit import rate_limiter
from ..serializers import document_dict

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png"}

# Content signatures — the first bytes of the stream must match the extension.
MAGIC_BYTES: dict[str, tuple[bytes, ...]] = {
    ".pdf": (b"%PDF",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
}

UPLOAD_RATE_LIMIT = 30  # uploads per user per minute
UPLOAD_CHUNK = 1024 * 1024  # 1 MiB


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
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    documentType: str = Form(..., min_length=1, max_length=40),
    district: str = Form(..., min_length=1, max_length=80),
    village: str | None = Form(None, max_length=80),
    languages: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    if settings.max_upload_mb <= 0:
        raise HTTPException(status_code=400, detail="Uploads are disabled")

    # Abuse control — per-user upload rate limit.
    if not rate_limiter.hit_and_check(f"upload:{user.user_id}", UPLOAD_RATE_LIMIT, 60):
        raise HTTPException(status_code=429, detail="Too many uploads. Please wait a moment.")

    # The user-supplied filename is only recorded as metadata; the on-disk name
    # is a server-generated UUID, so path traversal is structurally impossible.
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXT))}")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    declared = request.headers.get("content-length", "")
    # Fail fast on oversized declarations (allow 64 KiB of multipart overhead).
    if declared.isdigit() and int(declared) > max_bytes + 64 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_mb} MB limit")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{ext}"
    dest = UPLOAD_DIR / stored_name

    digest = hashlib.sha256()
    size = 0
    first_chunk = True
    try:
        with dest.open("wb") as out:
            while chunk := await file.read(UPLOAD_CHUNK):
                if first_chunk:
                    # Content sniffing — reject payloads whose bytes contradict
                    # the declared extension (malicious renames).
                    if not any(chunk.startswith(sig) for sig in MAGIC_BYTES[ext]):
                        raise HTTPException(status_code=415, detail="File content does not match its extension — upload rejected")
                    first_chunk = False
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_mb} MB limit")
                digest.update(chunk)
                out.write(chunk)
    except HTTPException:
        dest.unlink(missing_ok=True)  # never leave partial/spoofed files behind
        raise
    finally:
        await file.close()

    if size == 0:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Empty files are not accepted")

    ref = f"DOC-{now_utc().strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
    doc = Document(
        reference_no=ref,
        filename=file.filename or stored_name,
        stored_path=str(dest),
        file_hash=digest.hexdigest(),
        file_size_bytes=size,
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