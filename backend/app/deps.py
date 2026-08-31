"""FastAPI dependencies — bearer-token auth and role-based authorization.

The backend is the single source of truth for authorization: the frontend only
hides controls; every endpoint re-checks the caller's role here.

Session model: tokens are HMAC-signed AND registered server-side (hashed) in
`session_tokens`, so logout/admin kill-switch revokes access instantly. The
token's `role` claim is never trusted — the role always comes from the database.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import SessionToken, User
from .security import hash_token, verify_token


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Server-side session registry — refuse unknown, revoked, or expired sessions.
    session = db.scalar(
        select(SessionToken).where(
            SessionToken.token_hash == hash_token(token),
            SessionToken.revoked_at.is_(None),
            SessionToken.expires_at > func.now(),
        )
    )
    if session is None:
        raise HTTPException(status_code=401, detail="Session expired or revoked")

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
