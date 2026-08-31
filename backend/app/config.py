"""Central configuration — every secret comes from environment / .env, never from code."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_WORKSPACE = PROJECT_ROOT / "SIH26018_REAL_DATA"
UPLOAD_DIR = BACKEND_DIR / "data" / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    # --- Application ---
    app_name: str = "LANDVAULT AI API"
    environment: str = "development"  # development | production
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # --- Database ---
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'data' / 'landvault.db').as_posix()}"

    # --- Security ---
    secret_key: str = ""  # REQUIRED — init_db.py generates and persists one if missing
    token_ttl_seconds: int = 12 * 60 * 60  # 12h sessions
    pbkdf2_iterations: int = 600_000  # OWASP 2024 guidance for PBKDF2-HMAC-SHA256

    # --- Uploads ---
    max_upload_mb: int = 25
    allowed_upload_exts: list[str] = [".pdf", ".jpg", ".jpeg", ".png"]

    # --- External data keys (server-side only; never expose to frontend) ---
    data_gov_in_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    # Production must fail closed: no deployments with weak/absent signing keys.
    if s.environment == "production" and len(s.secret_key) < 32:
        raise RuntimeError(
            "SECRET_KEY must be configured (>= 32 chars) when ENVIRONMENT=production — refusing to start."
        )
    if not s.secret_key:
        # Dev convenience: ephemeral per-process key (sessions reset on restart).
        import secrets as _pysecrets

        s.secret_key = _pysecrets.token_hex(32)
        print(
            "[config] WARNING: SECRET_KEY missing — generated an EPHEMERAL key for this process. "
            "Run scripts/init_db.py to persist one."
        )
    return s


settings = get_settings()
