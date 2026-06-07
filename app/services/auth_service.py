import os
import re
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=BCRYPT_ROUNDS)


def validate_jwt_secret_strength() -> None:
    if SECRET_KEY == "dev-secret-key-change-in-production" or len(SECRET_KEY) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be set to a strong secret with at least 32 characters.")
    if SECRET_KEY.lower() in {"secret", "password", "changeme", "dev-secret"}:
        raise RuntimeError("JWT_SECRET_KEY is too weak.")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises JWTError if invalid or expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def validate_password_policy(password: str, *, email: str | None = None, employee_code: str | None = None) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ValueError("Password must contain letters and numbers.")
    normalized = password.strip().lower()
    if email and normalized == email.strip().lower():
        raise ValueError("Password must not be the same as email.")
    if employee_code and normalized == employee_code.strip().lower():
        raise ValueError("Password must not be the same as employee code.")
