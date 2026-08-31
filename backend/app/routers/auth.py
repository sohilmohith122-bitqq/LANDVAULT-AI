"""Authentication — login issues a signed, server-revocable session token.

Security controls implemented here:
- Brute-force protection: sliding-window rate limit per (IP, username) — the
  counter counts *failed* attempts and is cleared on success.
- Failed logins are audited (action LOGIN_FAILED) without revealing whether the
  username exists; responses are always generic.
- Server-side sessions: every issued token is stored as a SHA-256 hash in
  `session_tokens` and can be revoked instantly (POST /logout).
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..common import now_utc, user_dict, write_audit
from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..models import SessionToken, User
from ..rate_limit import rate_limiter
from ..schemas import LoginBody
from ..security import create_token, hash_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

LOGIN_MAX_ATTEMPTS = 5  # failed sign-ins per window, per (IP, username)
LOGIN_WINDOW_SECONDS = 5 * 60  # 5 minutes


@router.post("/login")
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    username = body.username.strip()
    client_ip = request.client.host if request.client else "unknown"
    rl_key = f"login:{client_ip}:{username.lower()}"

    # Rate limit BEFORE any password hashing — 429 responses are instant and
    # touch neither the database nor the PBKDF2 work factor.
    if not rate_limiter.hit_and_check(rl_key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS):
        raise HTTPException(status_code=429, detail="Too many sign-in attempts. Please wait and try again.")

    user = db.scalar(select(User).where(User.username == username))
    if user is None or not verify_password(body.password, user.password_hash):
        # Audit the failure (attempted username truncated — the attacker's input
        # is forensic data, not a user attribute) and keep the response generic.
        write_audit(db, None, "LOGIN_FAILED", reason=f"Failed sign-in for '{username[:40]}' from {client_ip}")
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    rate_limiter.reset(rl_key)  # a successful sign-in clears the failure counter

    token = create_token(user.user_id, user.role)
    now = now_utc().replace(tzinfo=None)  # naive UTC — matches DateTime columns
    db.add(SessionToken(token_hash=hash_token(token), user_id=user.user_id, expires_at=now + timedelta(seconds=settings.token_ttl_seconds)))
    # Housekeeping — drop this user's expired sessions (keeps the registry small).
    db.execute(delete(SessionToken).where(SessionToken.user_id == user.user_id, SessionToken.expires_at < now - timedelta(days=1)))
    write_audit(db, user, "LOGIN", reason="Successful sign-in")
    db.commit()
    return {"user": user_dict(user), "token": token}


@router.post("/logout", status_code=204)
def logout(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    authorization: str | None = Header(default=None),
):
    """Revoke the caller's session server-side. Idempotent."""
    if authorization and authorization.startswith("Bearer "):
        token_hash = hash_token(authorization.removeprefix("Bearer ").strip())
        session = db.scalar(select(SessionToken).where(SessionToken.token_hash == token_hash))
        if session is not None and session.revoked_at is None:
            session.revoked_at = now_utc().replace(tzinfo=None)
            write_audit(db, user, "LOGOUT", reason="Session revoked via sign-out")
            db.commit()
    return None


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_dict(user)
