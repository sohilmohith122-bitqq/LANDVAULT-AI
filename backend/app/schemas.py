"""Pydantic request bodies shared across routers."""

from pydantic import BaseModel, Field


class LoginBody(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class ResolveBody(BaseModel):
    action: str  # 'RESOLVE' | 'DISMISS'
    note: str | None = None


class VerifyBody(BaseModel):
    note: str | None = None
