"""
Security utilities for authentication and password hashing
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt

from .config import settings


# Password hashing context (supports multiple algorithms)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password using bcrypt.
    Compatible with bcryptjs from Node.js (NextAuth)
    """
    try:
        # Use bcrypt directly for compatibility with Node.js bcryptjs
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        # Fallback to passlib context
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt (12 rounds).
    Compatible with Node.js bcryptjs
    """
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt(12)
    ).decode('utf-8')


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.

    Args:
        data: Payload data (user_id, email, role, etc.)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[dict[str, Any]]:
    """
    Verify JWT token and return payload.
    Alias for decode_token with additional validation.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict or None if invalid/expired
    """
    payload = decode_token(token)

    if not payload:
        return None

    # Verify required fields
    if "user_id" not in payload and "sub" not in payload:
        return None

    # Normalize user_id (support both 'user_id' and 'sub' claims)
    if "user_id" not in payload and "sub" in payload:
        payload["user_id"] = payload["sub"]

    return payload
