"""SQLAlchemy engine/session — SQLite for local dev, Supabase Postgres for production.

Set `DATABASE_URL` in backend/.env to switch engines with zero code changes:

  # Local SQLite (default)
  # DATABASE_URL=sqlite:///data/landvault.db

  # Supabase (Project Settings → Database → Connection string → URI).
  # Use the **pooler** URI (port 6543) for serverless/API workloads; append
  # ?sslmode=require — Supabase enforces TLS.
  # DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

_url = settings.database_url
_is_sqlite = _url.startswith("sqlite")

# check_same_thread=False is safe here: FastAPI runs sync DB work in its threadpool,
# and SQLite connections are used per-request via SessionLocal.
engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # Supabase Postgres: recycle connections (pooler is pgbouncer-fronted) and
    # self-heal dropped TCP connections behind the cloud NAT.
    **({} if _is_sqlite else {"pool_pre_ping": True, "pool_recycle": 280, "pool_size": 5, "max_overflow": 10}),
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
