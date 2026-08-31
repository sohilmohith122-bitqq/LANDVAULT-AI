#!/usr/bin/env python3
"""API smoke tests using an isolated temp SQLite database + FastAPI TestClient.

Covers every new router and role-based authorization. The temp database is
created under the OS temp dir and is never the real development database.

Run from the `backend/` directory:  python scripts/smoke_test.py
"""

import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

_tmpdir = tempfile.mkdtemp(prefix="landvault-smoke-")
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(_tmpdir) / 'smoke.db').as_posix()}"
os.environ["MAX_UPLOAD_MB"] = "1"  # small limit so the oversize-rejection test stays cheap

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    AuditEvent,
    Conflict,
    District,
    Document,
    GisParcel,
    LandRecord,
    Taluk,
    User,
    Village,
)
from app.security import hash_password  # noqa: E402

failures: list[str] = []


def check(name: str, cond: bool) -> None:
    print(f"[{'PASS' if cond else 'FAIL'}] {name}")
    if not cond:
        failures.append(name)


def seed(db) -> None:
    db.add(
        User(
            user_id="usr-admin", username="admin", full_name="Admin", email="a@landvault.example",
            role="ADMIN", password_hash=hash_password("Admin@123"), is_active=True,
        )
    )
    db.add(
        User(
            user_id="usr-officer", username="officer", full_name="Officer", email="o@landvault.example",
            role="OFFICER", password_hash=hash_password("Officer@123"), is_active=True,
        )
    )
    db.add(
        User(
            user_id="usr-verifier", username="verifier", full_name="Verifier", email="v@landvault.example",
            role="VERIFIER", password_hash=hash_password("Verifier@123"), is_active=True,
        )
    )
    db.add(
        User(
            user_id="usr-viewer", username="viewer", full_name="Viewer", email="w@landvault.example",
            role="VIEWER", password_hash=hash_password("Viewer@123"), is_active=True,
        )
    )

    district = District(district_code="TN-D08", district_name_en="Erode", district_name_ta="ஈரோடு", source="test")
    db.add(district)
    db.flush()
    taluk = Taluk(taluk_code="TK-01", taluk_name_en="Erode", district_id=district.id, source="test")
    db.add(taluk)
    db.flush()
    village = Village(village_code="VL-01", village_name_en="Mettur", taluk_id=taluk.id, source="test")
    db.add(village)
    db.flush()

    db.add(
        Document(
            reference_no="DOC-TEST-001", filename="scan.pdf", stored_path="/tmp/scan.pdf",
            file_hash="abcd1234", file_size_bytes=2048, document_type="PATTA", language=["en"],
            district="Erode", taluk="Erode", village="Mettur", status="COMPLETED", progress=100,
            uploaded_by="admin",
        )
    )
    db.add(
        LandRecord(
            record_number="REC-124/2A-PATTA", document_id="DOC-TEST-001",
            survey_number="124/2A", subdivision_number="2A", village="Mettur", taluk="Erode",
            district="Erode", owner_name_original="R. Rajesh", area=2.5, area_unit="Acres",
            document_type="PATTA", status="CONFLICT", verify_confidence=0.58,
            fields=[
                {
                    "key": "ownerName", "label": "Owner Name", "value": "R. Rajesh",
                    "confidence": 0.58, "sourcePage": 1, "sourceText": "R. Rajesh, S/o Ramesh",
                    "sourceBbox": {"x": 42, "y": 128, "w": 210, "h": 16},
                    "method": "OCR_HEURISTIC", "status": "REVIEW_REQUIRED",
                }
            ],
        )
    )
    db.add(
        Conflict(
            conflict_id="CONF-TEST-001", record_id="REC-124/2A-PATTA", document_id="DOC-TEST-001",
            category="OWNER_MISMATCH", severity="MEDIUM", description="Owner name differs between sources",
            status="OPEN", field="ownerName", extracted_value="R. Rajesh", reference_value="R. Rajeswaran",
            evidence={"patta": "R. Rajesh", "chitta": "R. Rajeswaran"},
        )
    )
    db.add(
        GisParcel(
            parcel_id="GIS-TEST-001", village_id=village.id, survey_number="124/2A",
            subdivision_number="2A",
            geometry={"type": "Polygon", "coordinates": [[[78.6, 10.7], [78.7, 10.7], [78.7, 10.8], [78.6, 10.8], [78.6, 10.7]]]},
            calculated_area=2.47, area_unit="Acres", source="test",
        )
    )
    db.add(
        AuditEvent(
            event_id="EVT-TEST-001", user_id="usr-admin", user_name="admin", user_role="ADMIN",
            action="DOCUMENT_UPLOAD", document_id="DOC-TEST-001", reason="Seeded for smoke test",
        )
    )
    db.commit()


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

    client = TestClient(app)

    # --- health ---
    r = client.get("/api/health")
    check("health endpoint", r.status_code == 200 and r.json()["status"] == "ok")

    # --- auth ---
    r = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    check("admin login", r.status_code == 200 and "token" in r.json())
    headers = {"Authorization": f"Bearer {r.json()['token']}"}

    r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    check("bad login rejected", r.status_code == 401)

    # --- security: server-side session revocation ---
    r = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    tok2 = r.json()["token"]
    r = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {tok2}"})
    check("logout revokes session", r.status_code == 204)
    r = client.get("/api/records", headers={"Authorization": f"Bearer {tok2}"})
    check("revoked token rejected", r.status_code == 401)

    r = client.get("/api/records")
    check("records require auth", r.status_code == 401)

    # --- records ---
    r = client.get("/api/records", headers=headers)
    check("records list", r.status_code == 200 and r.json()["total"] == 1)
    r = client.get("/api/records/REC-124/2A-PATTA", headers=headers)
    check("record detail shape", r.status_code == 200 and r.json()["surveyNumber"] == "124/2A")
    r = client.get("/api/records/REC-124/2A-PATTA/validation", headers=headers)
    check("record validation endpoint", r.status_code == 200 and r.json() == [])

    # --- verify (admin allowed) ---
    r = client.post("/api/records/REC-124/2A-PATTA/verify", json={"note": "approved"}, headers=headers)
    check("verify record", r.status_code == 200 and r.json()["status"] == "VERIFIED")

    # --- conflicts ---
    r = client.get("/api/conflicts", headers=headers)
    check("conflicts list", r.status_code == 200 and r.json()["total"] == 1)
    r = client.get("/api/conflicts/CONF-TEST-001", headers=headers)
    check("conflict detail open", r.status_code == 200 and r.json()["status"] == "OPEN")
    r = client.post(
        "/api/conflicts/CONF-TEST-001/resolve", json={"action": "RESOLVE", "note": "verified"},
        headers=headers,
    )
    check("resolve conflict", r.status_code == 200 and r.json()["status"] == "RESOLVED")

    # --- role enforcement (viewer cannot resolve) ---
    r = client.post("/api/auth/login", json={"username": "viewer", "password": "Viewer@123"})
    viewer_headers = {"Authorization": f"Bearer {r.json()['token']}"}
    r = client.post("/api/conflicts/CONF-TEST-001/resolve", json={"action": "DISMISS"}, headers=viewer_headers)
    check("viewer cannot resolve conflict", r.status_code == 403)

    # --- documents ---
    r = client.get("/api/documents", headers=headers)
    check("documents list", r.status_code == 200 and r.json()["total"] == 1)
    r = client.get("/api/documents/DOC-TEST-001", headers=headers)
    check("document detail", r.status_code == 200 and r.json()["documentType"] == "PATTA")
    r = client.post(
        "/api/documents",
        files={"file": ("scan.png", b"\x89PNG\r\n\x1a\n" + b"fake image body", "image/png")},
        data={"documentType": "CHITTA", "district": "Erode", "languages": ["ta"]},
        headers=headers,
    )
    check("document upload queues", r.status_code == 201 and r.json()["status"] == "QUEUED")

    # --- security: content spoofing must be rejected (magic-byte check) ---
    r = client.post(
        "/api/documents",
        files={"file": ("evil.pdf", b"MZ\x90\x00 not a pdf at all", "application/pdf")},
        data={"documentType": "CHITTA", "district": "Erode", "languages": ["ta"]},
        headers=headers,
    )
    check("spoofed extension rejected", r.status_code == 415)

    # --- audit + activity ---
    r = client.get("/api/audit", headers=headers)
    check("audit list", r.status_code == 200 and r.json()["total"] >= 1)
    r = client.get("/api/activity", headers=headers)
    check("activity feed", r.status_code == 200 and len(r.json()) >= 1)

    # --- parcels ---
    r = client.get("/api/parcels", headers=headers)
    check("parcels list", r.status_code == 200 and len(r.json()) == 1)
    r = client.get("/api/parcels?recordId=REC-124/2A-PATTA", headers=headers)
    check("parcels filter by record", r.status_code == 200 and r.json()[0]["recordId"] == "REC-124/2A-PATTA")

    # --- stats ---
    r = client.get("/api/stats/overview", headers=headers)
    check("stats overview", r.status_code == 200 and "totalRecords" in r.json())

    # --- security: hardened response headers on every response ---
    r = client.get("/api/health")
    check(
        "security headers present",
        r.headers.get("X-Content-Type-Options") == "nosniff"
        and r.headers.get("X-Frame-Options") == "DENY"
        and "frame-ancestors" in (r.headers.get("Content-Security-Policy") or "")
        and r.headers.get("Cache-Control") == "no-store",
    )

    # --- security: logout must revoke the session server-side ---
    r = client.post("/api/auth/logout", headers=viewer_headers)
    check("logout returns 204", r.status_code == 204)
    r = client.get("/api/records", headers=viewer_headers)
    check("revoked session rejected", r.status_code == 401)
    r = client.post("/api/auth/login", json={"username": "viewer", "password": "Viewer@123"})
    check("re-login after logout works", r.status_code == 200)
    viewer_headers = {"Authorization": f"Bearer {r.json()['token']}"}

    # --- security: oversize must be rejected (limit lowered to 1 MB via env) ---
    r = client.post(
        "/api/documents",
        files={"file": ("big.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * (2 * 1024 * 1024), "image/png")},
        data={"documentType": "CHITTA", "district": "Erode", "languages": ["ta"]},
        headers=headers,
    )
    check("oversized file rejected", r.status_code == 413)

    # --- security: brute-force lockout (LAST — locks this client for 'viewer') ---
    # Limit is 5 failures / 5 min: attempts 1-5 get 401, attempt 6 gets 429.
    for _ in range(6):
        r = client.post("/api/auth/login", json={"username": "viewer", "password": "nope"})
    check("brute-force lockout after 5 failures", r.status_code == 429)
    r = client.post("/api/auth/login", json={"username": "viewer", "password": "Viewer@123"})
    check("lockout holds even with correct password", r.status_code == 429)

    print()
    if failures:
        print(f"SMOKE TEST FAILED — {len(failures)} failure(s): {failures}")
        sys.exit(1)
    print("SMOKE TEST PASSED — all checks green")


if __name__ == "__main__":
    main()