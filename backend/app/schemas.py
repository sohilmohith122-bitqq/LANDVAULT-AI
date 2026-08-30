"""Pydantic request bodies shared across routers."""

from pydantic import BaseModel


class LoginBody(BaseModel):
    username: str
    password: str


class ResolveBody(BaseModel):
    action: str  # 'RESOLVE' | 'DISMISS'
    note: str | None = None


class VerifyBody(BaseModel):
    note: str | None = None
