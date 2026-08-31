"""LANDVAULT AI — real-data database schema.

Hierarchy: DISTRICT → TALUK → VILLAGE → SURVEY_PARCEL → {PATTA, CHITTA, A_REGISTER, ADANGAL, FMB}
Cross-cutting: GIS, REGISTRATION/EC, GUIDELINE_VALUE, ILR, PATTA_TRANSFER → VALIDATION.

Conventions:
- Provenance columns (source, source_reference, collected_at) are NOT NULL where the
  collection protocol requires them — the DB is the second line of defence after the ingester.
- Original values are preserved (owner_name_original); normalized values live beside them.
- No fabricated data anywhere: nullable columns stay NULL when the source lacks a value.
"""

from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


# --------------------------------- Geography -------------------------------- #

class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(primary_key=True)
    district_code: Mapped[str] = mapped_column(String(20), unique=True)
    district_name_en: Mapped[str] = mapped_column(String(80))
    district_name_ta: Mapped[str | None] = mapped_column(String(80))
    source: Mapped[str] = mapped_column(String(80))
    source_url: Mapped[str | None] = mapped_column(String(255))
    download_date: Mapped[date | None] = mapped_column(Date)


class Taluk(Base):
    __tablename__ = "taluks"

    id: Mapped[int] = mapped_column(primary_key=True)
    taluk_code: Mapped[str] = mapped_column(String(20), unique=True)
    taluk_name_en: Mapped[str] = mapped_column(String(80))
    taluk_name_ta: Mapped[str | None] = mapped_column(String(80))
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"), index=True)
    source: Mapped[str] = mapped_column(String(80))
    source_url: Mapped[str | None] = mapped_column(String(255))
    download_date: Mapped[date | None] = mapped_column(Date)


class Village(Base):
    __tablename__ = "villages"

    id: Mapped[int] = mapped_column(primary_key=True)
    village_code: Mapped[str] = mapped_column(String(20), unique=True)
    village_name_en: Mapped[str] = mapped_column(String(120))
    village_name_ta: Mapped[str | None] = mapped_column(String(120))
    taluk_id: Mapped[int] = mapped_column(ForeignKey("taluks.id"), index=True)
    census_2011_code: Mapped[str | None] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(80))
    source_url: Mapped[str | None] = mapped_column(String(255))
    download_date: Mapped[date | None] = mapped_column(Date)


class SurveyParcel(Base):
    """Survey/subdivision level anchor that all record types reference."""
    __tablename__ = "survey_parcels"
    __table_args__ = (UniqueConstraint("village_id", "survey_number", "subdivision_number", name="uq_parcel"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    source: Mapped[str] = mapped_column(String(80))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ---------------------------------- Sources --------------------------------- #

class Source(Base):
    """Registry of official data sources (mirrors 00_SOURCE_METADATA/sources.csv)."""
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[str] = mapped_column(String(40), unique=True)
    source_name: Mapped[str] = mapped_column(String(120))
    official_url: Mapped[str] = mapped_column(String(255))
    priority: Mapped[str] = mapped_column(String(4))  # P0 | P1 | P2
    datasets_provided: Mapped[str | None] = mapped_column(Text)

# ------------------------------- P0 datasets -------------------------------- #

class Patta(Base):
    __tablename__ = "patta"
    __table_args__ = (Index("ix_patta_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patta_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    survey_normalized: Mapped[str | None] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    owner_name: Mapped[str | None] = mapped_column(String(200))
    extent: Mapped[float | None] = mapped_column(Float)
    extent_unit: Mapped[str | None] = mapped_column(String(20))
    land_classification: Mapped[str | None] = mapped_column(String(60))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    verification_status: Mapped[str] = mapped_column(String(20), default="UNVERIFIED")


class Chitta(Base):
    __tablename__ = "chitta"
    __table_args__ = (Index("ix_chitta_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    chitta_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    survey_normalized: Mapped[str | None] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    owner_name_original: Mapped[str | None] = mapped_column(String(200))
    owner_name_normalized: Mapped[str | None] = mapped_column(String(200))
    land_type: Mapped[str | None] = mapped_column(String(60))
    extent: Mapped[float | None] = mapped_column(Float)
    extent_unit: Mapped[str | None] = mapped_column(String(20))
    reference_number: Mapped[str | None] = mapped_column(String(60))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ARegister(Base):
    __tablename__ = "a_register"
    __table_args__ = (Index("ix_areg_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    a_register_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    classification: Mapped[str | None] = mapped_column(String(60))
    land_type: Mapped[str | None] = mapped_column(String(60))
    extent: Mapped[float | None] = mapped_column(Float)
    extent_unit: Mapped[str | None] = mapped_column(String(20))
    assessment: Mapped[str | None] = mapped_column(String(60))
    owner_information: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    record_date: Mapped[date | None] = mapped_column(Date)


class Fmb(Base):
    """Field Measurement Book — original preserved by file_hash; digitization is derived only."""
    __tablename__ = "fmb"
    __table_args__ = (Index("ix_fmb_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    fmb_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    document_id: Mapped[str | None] = mapped_column(String(40))
    file_path: Mapped[str] = mapped_column(String(400))
    file_hash: Mapped[str] = mapped_column(String(64))  # SHA-256 of the ORIGINAL
    page_count: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(80))
    collection_date: Mapped[date | None] = mapped_column(Date)


class Adangal(Base):
    __tablename__ = "adangal"
    __table_args__ = (Index("ix_adangal_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    adangal_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    crop: Mapped[str | None] = mapped_column(String(80))
    season: Mapped[str | None] = mapped_column(String(30))  # Samba / Kar / ...
    yield_kg: Mapped[str | None] = mapped_column(String(40))
    irrigation_source: Mapped[str | None] = mapped_column(String(60))
    cultivation_status: Mapped[str | None] = mapped_column(String(60))
    extent: Mapped[float | None] = mapped_column(Float)
    record_date: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))

    access_method: Mapped[str | None] = mapped_column(Text)
    requires_account: Mapped[bool] = mapped_column(Boolean, default=False)
    captcha_protected: Mapped[bool] = mapped_column(Boolean, default=False)
    legal_notes: Mapped[str | None] = mapped_column(Text)
    recorded_at: Mapped[date | None] = mapped_column(Date)


# ----------------------------- P1 / P2 datasets ----------------------------- #

class IlrRecord(Base):
    """Integrated Land Record — RoR + FMB + Chitta combined (launched 2026-03)."""
    __tablename__ = "ilr_records"
    __table_args__ = (Index("ix_ilr_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ilr_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    rors_reference: Mapped[str | None] = mapped_column(String(60))
    fmb_reference: Mapped[str | None] = mapped_column(String(60))
    chitta_reference: Mapped[str | None] = mapped_column(String(60))
    owner_name_original: Mapped[str | None] = mapped_column(String(200))
    owner_name_normalized: Mapped[str | None] = mapped_column(String(200))
    extent: Mapped[float | None] = mapped_column(Float)
    extent_unit: Mapped[str | None] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PattaTransfer(Base):
    """Patta transfer history (private lands, 2016+) — builds the record timeline."""
    __tablename__ = "patta_transfers"
    __table_args__ = (Index("ix_transfer_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patta_transfer_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    previous_patta: Mapped[str | None] = mapped_column(String(40))
    new_patta: Mapped[str | None] = mapped_column(String(40))
    transfer_date: Mapped[date | None] = mapped_column(Date)
    transfer_status: Mapped[str | None] = mapped_column(String(40))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class GisParcel(Base):
    """TNGIS spatial parcel — PostGIS `geometry` column in production; GeoJSON JSON here."""
    __tablename__ = "gis_parcels"
    __table_args__ = (Index("ix_gis_survey", "village_id", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_id: Mapped[str] = mapped_column(String(40), unique=True)
    village_id: Mapped[int] = mapped_column(ForeignKey("villages.id"), index=True)
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    geometry: Mapped[dict | None] = mapped_column(JSON)  # GeoJSON Polygon
    crs: Mapped[str | None] = mapped_column(String(20), default="EPSG:4326")
    calculated_area: Mapped[float | None] = mapped_column(Float)
    area_unit: Mapped[str | None] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(80))
    source_layer: Mapped[str | None] = mapped_column(String(120))
    download_date: Mapped[date | None] = mapped_column(Date)

# --------------------------- Registration / values --------------------------- #

class Registration(Base):
    """TNREGINET registration documents."""
    __tablename__ = "registrations"
    __table_args__ = (Index("ix_reg_survey", "village_name", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    registration_id: Mapped[str] = mapped_column(String(40), unique=True)
    district_name: Mapped[str | None] = mapped_column(String(80))
    sro: Mapped[str | None] = mapped_column(String(120))
    village_name: Mapped[str | None] = mapped_column(String(120))
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    document_number: Mapped[str | None] = mapped_column(String(60))
    registration_date: Mapped[date | None] = mapped_column(Date)
    registration_year: Mapped[int | None] = mapped_column(Integer)
    transaction_type: Mapped[str | None] = mapped_column(String(60))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class EncumbranceEntry(Base):
    """TNREGINET Encumbrance Certificate line entries."""
    __tablename__ = "ec_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    ec_id: Mapped[str] = mapped_column(String(40), unique=True)
    sro: Mapped[str | None] = mapped_column(String(120))
    district_name: Mapped[str | None] = mapped_column(String(80))
    village_name: Mapped[str | None] = mapped_column(String(120))
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    period_start: Mapped[date | None] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date)
    document_number: Mapped[str | None] = mapped_column(String(60))
    registration_date: Mapped[date | None] = mapped_column(Date)
    transaction_type: Mapped[str | None] = mapped_column(String(60))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class GuidelineValue(Base):
    """TNREGINET guideline values."""
    __tablename__ = "guideline_values"

    id: Mapped[int] = mapped_column(primary_key=True)
    guideline_id: Mapped[str] = mapped_column(String(40), unique=True)
    zone: Mapped[str | None] = mapped_column(String(120))
    district_name: Mapped[str | None] = mapped_column(String(80))
    sro: Mapped[str | None] = mapped_column(String(120))
    village_name: Mapped[str | None] = mapped_column(String(120))
    survey_number: Mapped[str | None] = mapped_column(String(30))
    classification: Mapped[str | None] = mapped_column(String(80))
    effective_date: Mapped[date | None] = mapped_column(Date)
    value: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(30))
    source: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    collected_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())



# ------------------------- Pipeline (AI output layer) ------------------------ #

class Document(Base):
    """Uploaded source documents — originals preserved; AI output never overwrites them."""
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_no: Mapped[str] = mapped_column(String(40), unique=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(400))
    file_hash: Mapped[str] = mapped_column(String(64))
    file_size_bytes: Mapped[int] = mapped_column(Integer)
    document_type: Mapped[str] = mapped_column(String(40))  # PATTA / CHITTA / FMB / ...
    language: Mapped[list | None] = mapped_column(JSON)     # ["ta","en"]
    district: Mapped[str | None] = mapped_column(String(80))
    taluk: Mapped[str | None] = mapped_column(String(80))
    village: Mapped[str | None] = mapped_column(String(120))
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="QUEUED")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    ocr_confidence: Mapped[float | None] = mapped_column(Float)
    uploaded_by: Mapped[str | None] = mapped_column(String(80))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class LandRecord(Base):
    """Digitized record produced by the pipeline — provenance-linked, human-verifiable."""
    __tablename__ = "land_records"
    __table_args__ = (Index("ix_landrecords_survey", "village", "survey_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    record_number: Mapped[str] = mapped_column(String(40), unique=True)
    document_id: Mapped[str | None] = mapped_column(String(40))
    survey_number: Mapped[str] = mapped_column(String(30))
    survey_normalized: Mapped[str | None] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    village: Mapped[str | None] = mapped_column(String(120))
    taluk: Mapped[str | None] = mapped_column(String(80))
    district: Mapped[str | None] = mapped_column(String(80))
    owner_name_original: Mapped[str | None] = mapped_column(String(200))
    owner_name_normalized: Mapped[str | None] = mapped_column(String(200))
    area: Mapped[float | None] = mapped_column(Float)
    area_unit: Mapped[str | None] = mapped_column(String(20))
    document_type: Mapped[str | None] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="EXTRACTED")
    verify_confidence: Mapped[float | None] = mapped_column(Float)
    fields: Mapped[list | None] = mapped_column(JSON)  # ExtractedField[] (see frontend types)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class Conflict(Base):
    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(primary_key=True)
    conflict_id: Mapped[str] = mapped_column(String(40), unique=True)
    record_id: Mapped[str | None] = mapped_column(String(40), index=True)
    document_id: Mapped[str | None] = mapped_column(String(40), index=True)
    category: Mapped[str] = mapped_column(String(40))
    severity: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="OPEN")
    field: Mapped[str | None] = mapped_column(String(60))
    extracted_value: Mapped[str | None] = mapped_column(String(200))
    reference_value: Mapped[str | None] = mapped_column(String(200))
    difference: Mapped[str | None] = mapped_column(String(80))
    evidence: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_by: Mapped[str | None] = mapped_column(String(80))
    resolution_note: Mapped[str | None] = mapped_column(Text)


class AuditEvent(Base):
    """Append-only audit trail — corrections preserve old and new values."""
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[str] = mapped_column(String(40), unique=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user_id: Mapped[str | None] = mapped_column(String(40))
    user_name: Mapped[str | None] = mapped_column(String(80))
    user_role: Mapped[str | None] = mapped_column(String(20))
    action: Mapped[str] = mapped_column(String(40))
    record_id: Mapped[str | None] = mapped_column(String(40))
    document_id: Mapped[str | None] = mapped_column(String(40))
    field: Mapped[str | None] = mapped_column(String(60))
    old_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)


class ValidationResult(Base):
    """Cross-source validation engine output (mirrors 14_VALIDATION CSV)."""
    __tablename__ = "validation_results"
    __table_args__ = (Index("ix_vres_case", "case_id", "field"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[str] = mapped_column(String(40))
    field: Mapped[str] = mapped_column(String(60))
    patta_value: Mapped[str | None] = mapped_column(String(200))
    chitta_value: Mapped[str | None] = mapped_column(String(200))
    a_register_value: Mapped[str | None] = mapped_column(String(200))
    adangal_value: Mapped[str | None] = mapped_column(String(200))
    gis_value: Mapped[str | None] = mapped_column(String(200))
    registration_value: Mapped[str | None] = mapped_column(String(200))
    match_status: Mapped[str] = mapped_column(String(20))  # MATCH/PARTIAL_MATCH/MISMATCH/MISSING
    confidence: Mapped[float | None] = mapped_column(Float)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class GroundTruthCase(Base):
    """Human-verified cases (PERSONAL DATA — handled per 13_GROUND_TRUTH policy)."""
    __tablename__ = "ground_truth_cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[str] = mapped_column(String(40), unique=True)
    document_id: Mapped[str | None] = mapped_column(String(40))
    district: Mapped[str | None] = mapped_column(String(80))
    taluk: Mapped[str | None] = mapped_column(String(80))
    village: Mapped[str | None] = mapped_column(String(120))
    survey_number: Mapped[str] = mapped_column(String(30))
    subdivision_number: Mapped[str | None] = mapped_column(String(30))
    patta_number: Mapped[str | None] = mapped_column(String(40))
    owner_name: Mapped[str | None] = mapped_column(String(200))  # restricted access only
    extent: Mapped[float | None] = mapped_column(Float)
    extent_unit: Mapped[str | None] = mapped_column(String(20))
    land_classification: Mapped[str | None] = mapped_column(String(60))
    source_document: Mapped[str | None] = mapped_column(String(200))
    verified_by: Mapped[str | None] = mapped_column(String(80))
    verification_date: Mapped[date | None] = mapped_column(Date)
    verification_status: Mapped[str] = mapped_column(String(20), default="UNVERIFIED")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(40), unique=True)
    username: Mapped[str] = mapped_column(String(80), unique=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20))  # ADMIN/OFFICER/VERIFIER/VIEWER
    password_hash: Mapped[str] = mapped_column(String(300))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SessionToken(Base):
    """Server-side session registry — enables instant token revocation.

    Only the SHA-256 hash of each issued token is stored, so a database leak
    cannot be replayed as a valid session. Logout (and admin kill-switches)
    simply stamp `revoked_at`; `deps.get_current_user` refuses revoked rows.
    """

    __tablename__ = "session_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String(40), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)

