"""
Rate Limiting Configuration using SlowAPI

Provides configurable rate limits for different API endpoints:
- General endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute (stricter for security)
- Heavy operations (import/export): 10 requests/minute
- Webhook endpoints: 1000 requests/minute (for integrations)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


def get_request_identifier(request: Request) -> str:
    """
    Get a unique identifier for rate limiting.
    Uses X-User-Id header if available (for authenticated requests),
    otherwise falls back to IP address.
    """
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return f"user:{user_id}"

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    return get_remote_address(request)


# Create the limiter instance with custom key function
limiter = Limiter(
    key_func=get_request_identifier,
    default_limits=["100/minute"],
    storage_uri="memory://",
    strategy="fixed-window",
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors."""
    logger.warning(
        f"Rate limit exceeded for {get_request_identifier(request)}: "
        f"{request.method} {request.url.path}"
    )
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.detail.split("per ")[1] if "per " in str(exc.detail) else "60 seconds"
        }
    )


# Preset rate limit decorators for different endpoint types
# These can be imported and used with @decorator syntax

# For authentication endpoints (login, register, password reset)
auth_limit = limiter.limit("10/minute")

# For heavy operations (bulk import, export, report generation)
heavy_limit = limiter.limit("10/minute")

# For webhook/integration endpoints (higher limit for external services)
webhook_limit = limiter.limit("1000/minute")

# For general API endpoints (default)
default_limit = limiter.limit("100/minute")

# For read-only listing endpoints (can be slightly higher)
list_limit = limiter.limit("200/minute")
