"""Authentication — login issues a signed token; /me returns the caller."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import user_dict, write_audit
from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import LoginBody
from ..security import create_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username.strip()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    write_audit(db, user, "LOGIN", reason="Successful sign-in")
    db.commit()
    return {"user": user_dict(user), "token": create_token(user.user_id, user.role)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_dict(user)
