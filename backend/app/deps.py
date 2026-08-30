"""FastAPI dependencies — bearer-token auth and role-based authorization.

The backend is the single source of truth for authorization: the frontend only
hides controls; every endpoint re-checks the caller's role here.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import verify_token


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    payload = verify_token(authorization.removeprefix("Bearer ").strip())
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.scalar(select(User).where(User.user_id == payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(*roles: str):
    """Dependency factory — resolves the current user and enforces a role."""

    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _dep
