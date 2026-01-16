"""
Core module - Configuration, Database, Security, and Dependencies
"""
from .config import settings, get_settings
from .database import engine, get_session, get_db, get_session_context
from .security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
    verify_token
)
from .deps import (
    get_current_user,
    get_current_user_optional,
    get_current_active_user,
    require_roles,
    require_any_role,
    require_super_admin,
    require_admin,
    require_manager,
    CompanyFilter
)

__all__ = [
    # Config
    "settings",
    "get_settings",
    # Database
    "engine",
    "get_session",
    "get_db",
    "get_session_context",
    # Security
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_token",
    "verify_token",
    # Dependencies
    "get_current_user",
    "get_current_user_optional",
    "get_current_active_user",
    "require_roles",
    "require_any_role",
    "require_super_admin",
    "require_admin",
    "require_manager",
    "CompanyFilter",
]
