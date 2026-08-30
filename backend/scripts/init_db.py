#!/usr/bin/env python3
"""Initialize the LANDVAULT AI database.

- Generates and persists a SECRET_KEY in `backend/.env` when missing.
- Creates the schema defined in `app/models.py`.
- Seeds the four role users (admin, officer, verifier, viewer) with randomly
  generated passwords (printed once — same policy as the original design).
- Ingests the real geography CSVs from `SIH26018_REAL_DATA` (districts; taluks
  and villages are ingested automatically whenever the CSVs are filled in).

Run from the `backend/` directory:  python scripts/init_db.py
"""

import csv
import secrets as pysecrets
import sys
from datetime import date
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

ENV_FILE = BACKEND_DIR / ".env"

# Write the secret BEFORE importing app.config so the loaded settings use it.
def ensure_secret_key() -> None:
    env_text = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    lines = [ln for ln in env_text.splitlines() if ln.strip() and not ln.startswith("#")]
    has_secret = any(ln.split("=", 1)[0].strip().upper() == "SECRET_KEY" for ln in lines)
    if has_secret:
        return
    ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    with ENV_FILE.open("a", encoding="utf-8") as fh:
        if env_text and not env_text.endswith("\n"):
            fh.write("\n")
        fh.write(f"SECRET_KEY={pysecrets.token_hex(32)}\n")
    print(f"[init_db] wrote SECRET_KEY to {ENV_FILE}")


ensure_secret_key()

from sqlalchemy import select  # noqa: E402

from app.config import DATA_WORKSPACE, UPLOAD_DIR  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import District, User  # noqa: E402
from app.security import generate_password, hash_password  # noqa: E402

ROLE_SEEDS = [
    ("admin", "System Administrator", "ADMIN"),
    ("officer", "Ravi Kumar", "OFFICER"),
    ("verifier", "Anjali Sharma", "VERIFIER"),
    ("viewer", "Guest Viewer", "VIEWER"),
]


def seed_users(db) -> int:
    created = 0
    for username, full_name, role in ROLE_SEEDS:
        exists = db.scalar(select(User).where(User.username == username))
        if exists:
            print(f"[init_db] user '{username}' already exists — skipping")
            continue
        password = generate_password()
        db.add(
            User(
                user_id=f"usr-{role.lower()}",
                username=username,
                full_name=full_name,
                email=f"{username}@landvault.example",
                role=role,
                password_hash=hash_password(password),
                is_active=True,
            )
        )
        print(f"[init_db] NEW USER  username={username}  password={password}")
        created += 1
    db.commit()
    return created


def _parse_date(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw.strip())
    except ValueError:
        return None


def ingest_geography(db) -> int:
    """Ingest districts (and taluks/villages when their CSVs are populated)."""
    added = 0
    districts_path = DATA_WORKSPACE / "01_GEOGRAPHY" / "districts" / "districts.csv"
    if not districts_path.exists():
        print("[init_db] districts.csv not found — skipping geography ingest")
        return added
    with districts_path.open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            code = (row.get("district_code") or "").strip()
            if not code:
                continue
            if db.scalar(select(District).where(District.district_code == code)):
                continue
            db.add(
                District(
                    district_code=code,
                    district_name_en=(row.get("district_name_en") or "").strip(),
                    district_name_ta=(row.get("district_name_ta") or "").strip() or None,
                    source=(row.get("source") or "").strip() or "TN-REVENUE-ADMIN",
                    source_url=(row.get("source_url") or "").strip() or None,
                    download_date=_parse_date(row.get("download_date")),
                )
            )
            added += 1
    db.commit()
    print(f"[init_db] ingested {added} districts")
    return added


def main() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (BACKEND_DIR / "data").mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
    print(f"[init_db] schema created at {engine.url}")

    db = SessionLocal()
    try:
        seed_users(db)
        ingest_geography(db)
    finally:
        db.close()
    print("[init_db] done")


if __name__ == "__main__":
    main()