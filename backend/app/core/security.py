"""JWT helpers for download magic-links + bcrypt password hashing."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import jwt
from passlib.context import CryptContext

from app.core.config import settings

UTC = timezone.utc

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    hashed: str = _pwd_context.hash(plain)
    return hashed


def verify_password(plain: str, hashed: str) -> bool:
    ok: bool = _pwd_context.verify(plain, hashed)
    return ok


def hash_ip(ip: str) -> str:
    """SHA256 of IP with app secret as salt — GDPR-friendly fingerprint."""
    raw = f"{settings.APP_SECRET_KEY}|{ip}".encode()
    return hashlib.sha256(raw).hexdigest()


def create_download_token(order_id: UUID | str, email: str) -> str:
    """JWT with order_id + email, exp = configured days."""
    exp = datetime.now(UTC) + timedelta(
        days=settings.JWT_DOWNLOAD_TOKEN_EXPIRE_DAYS
    )
    payload: dict[str, Any] = {
        "sub": str(order_id),
        "email": email,
        "scope": "download",
        "exp": exp,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=ALGORITHM)


def decode_download_token(token: str) -> dict[str, Any]:
    """Decode & validate. Raises jwt.InvalidTokenError on failure."""
    payload: dict[str, Any] = jwt.decode(
        token,
        settings.APP_SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "sub", "email", "scope"]},
    )
    return payload


def create_gdpr_delete_token(email: str) -> str:
    """Short-lived (24h) magic-link token for GDPR deletion confirmation."""
    exp = datetime.now(UTC) + timedelta(hours=24)
    payload = {
        "email": email,
        "scope": "gdpr_delete",
        "exp": exp,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=ALGORITHM)


def decode_gdpr_delete_token(token: str) -> dict[str, Any]:
    payload: dict[str, Any] = jwt.decode(
        token,
        settings.APP_SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "email", "scope"]},
    )
    if payload.get("scope") != "gdpr_delete":
        raise jwt.InvalidTokenError("Wrong scope")
    return payload
