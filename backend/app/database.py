"""SQLAlchemy engine/session. SQLite for dev; switch DATABASE_URL to PostgreSQL+PostGIS for GIS scale."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

# check_same_thread=False is safe here: FastAPI runs sync DB work in its threadpool,
# and SQLite connections are used per-request via SessionLocal.
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
