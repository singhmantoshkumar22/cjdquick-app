"""
Request Audit Logging Middleware

Logs all API requests with:
- Request method and path
- User ID and company ID (if authenticated)
- Request timestamp
- Response status code
- Request duration
- Client IP address

Logs are written to both console and can be extended to
persistent storage (database, file, or external service).
"""

import time
import logging
from datetime import datetime, timezone
from typing import Callable
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("audit")
logger.setLevel(logging.INFO)

# Create a handler for audit logs
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - AUDIT - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    )
    logger.addHandler(handler)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests for auditing purposes.
    """

    # Paths to exclude from audit logging (health checks, static files, etc.)
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    }

    # Paths that contain sensitive data (mask request body)
    SENSITIVE_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/users",
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip excluded paths
        path = request.url.path
        if path in self.EXCLUDED_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Record start time
        start_time = time.time()

        # Extract request info
        method = request.method
        client_ip = self._get_client_ip(request)
        user_id = request.headers.get("X-User-Id", "anonymous")
        company_id = request.headers.get("X-Company-Id", "none")
        user_agent = request.headers.get("User-Agent", "unknown")[:100]

        # Process the request
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Build log message
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": method,
            "path": path,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "user_id": user_id,
            "company_id": company_id,
            "client_ip": client_ip,
            "user_agent": user_agent,
        }

        # Add query parameters (excluding sensitive ones)
        if request.query_params and not self._is_sensitive(path):
            log_data["query"] = str(request.query_params)[:200]

        # Log the request
        log_level = self._get_log_level(response.status_code)
        log_message = (
            f"{method} {path} - {response.status_code} - "
            f"{round(duration_ms, 2)}ms - user:{user_id} - company:{company_id}"
        )

        if log_level == logging.ERROR:
            logger.error(log_message, extra=log_data)
        elif log_level == logging.WARNING:
            logger.warning(log_message, extra=log_data)
        else:
            logger.info(log_message, extra=log_data)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        return request.client.host if request.client else "unknown"

    def _is_sensitive(self, path: str) -> bool:
        """Check if path contains sensitive data."""
        return any(sensitive in path for sensitive in self.SENSITIVE_PATHS)

    def _get_log_level(self, status_code: int) -> int:
        """Determine log level based on status code."""
        if status_code >= 500:
            return logging.ERROR
        elif status_code >= 400:
            return logging.WARNING
        return logging.INFO


def get_audit_summary_endpoint():
    """
    Returns a function that can be used as an endpoint to
    get audit log summary (for admin dashboards).
    """

    async def audit_summary():
        # This would typically query from a database
        # For now, return a placeholder
        return {
            "message": "Audit logging is active",
            "log_destination": "console",
            "excluded_paths": list(AuditLogMiddleware.EXCLUDED_PATHS),
        }

    return audit_summary
