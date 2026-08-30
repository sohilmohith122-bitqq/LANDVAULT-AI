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
    pbkdf2_iterations: int = 240_000

    # --- Uploads ---
    max_upload_mb: int = 25
    allowed_upload_exts: list[str] = [".pdf", ".jpg", ".jpeg", ".png"]

    # --- External data keys (server-side only; never expose to frontend) ---
    data_gov_in_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
