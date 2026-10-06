from datetime import datetime, timedelta, timezone

import jwt

from app.auth.password import verify_password
from app.config import get_settings
from app.db.postgres import get_connection


class AuthServiceUnavailable(Exception):
    """Raised when the database or JWT configuration is unavailable."""


def authenticate_user(email: str, password: str) -> str | None:
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id, password_hash
                    FROM public.users
                    WHERE email = %s
                    """,
                    (email,),
                )
                user = cursor.fetchone()
    except Exception as exc:
        raise AuthServiceUnavailable from exc

    if not user:
        return None

    try:
        is_valid = verify_password(password, user[1])
    except Exception:
        return None

    return str(user[0]) if is_valid else None


def create_access_token(subject: str) -> str:
    settings = get_settings()
    if not settings.JWT_SECRET_KEY:
        raise AuthServiceUnavailable

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    try:
        return jwt.encode(
            {"sub": subject, "exp": expires_at},
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
    except (jwt.PyJWTError, ValueError, TypeError):
        raise AuthServiceUnavailable from None