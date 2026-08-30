"""Authentication security — stdlib only (no external crypto deps).

- Passwords: PBKDF2-HMAC-SHA256 with per-user random salt (constant iterations from settings).
- Tokens: HMAC-SHA256 signed, base64url payload with expiry; verified in constant time.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

from .config import settings


# ------------------------------- Passwords -------------------------------- #

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, settings.pbkdf2_iterations)
    return f"pbkdf2_sha256${settings.pbkdf2_iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iterations, salt_hex, digest_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


# -------------------------------- Tokens ---------------------------------- #

def _sign(payload_b64: str) -> str:
    return hmac.new(settings.secret_key.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()


def create_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role, "exp": int(time.time()) + settings.token_ttl_seconds}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
    return f"{payload_b64}.{_sign(payload_b64)}"


def verify_token(token: str) -> dict | None:
    try:
        payload_b64, signature = token.rsplit(".", 1)
        if not hmac.compare_digest(_sign(payload_b64), signature):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def generate_password(length: int = 20) -> str:
    """Cryptographically random initial password (printed once by init_db)."""
    alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))
