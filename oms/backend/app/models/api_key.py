"""
API Key Model - For client authentication
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID
import secrets

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase

if TYPE_CHECKING:
    from .company import Company


class APIKey(BaseModel, table=True):
    """
    API Key model for client authentication.
    Each company can have multiple API keys for different channels/purposes.
    """
    __tablename__ = "APIKey"

    # Key details
    name: str = Field(sa_column=Column(String(255), nullable=False))
    key: str = Field(sa_column=Column(String(64), unique=True, nullable=False, index=True))
    keyPrefix: str = Field(sa_column=Column(String(8), nullable=False))  # First 8 chars for identification

    # Permissions
    channel: Optional[str] = Field(default=None, sa_column=Column(String(50)))  # SHOPIFY, AMAZON, WEB, etc.
    permissions: Optional[str] = Field(default="orders:write,orders:read", sa_column=Column(Text))

    # Rate limiting
    rateLimit: int = Field(default=1000)  # Requests per hour

    # Status
    isActive: bool = Field(default=True, sa_column=Column(Boolean, default=True))
    lastUsedAt: Optional[datetime] = Field(default=None)
    expiresAt: Optional[datetime] = Field(default=None)

    # Multi-tenant
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Relationships
    company: Optional["Company"] = Relationship(back_populates="apiKeys")

    @staticmethod
    def generate_key() -> tuple[str, str]:
        """Generate a new API key and return (full_key, prefix)"""
        key = secrets.token_hex(32)  # 64 character hex string
        prefix = key[:8]
        return key, prefix


class APIKeyCreate(CreateBase):
    """Schema for creating a new API key"""
    name: str
    channel: Optional[str] = None
    permissions: Optional[str] = "orders:write,orders:read"
    rateLimit: Optional[int] = 1000
    companyId: UUID


class APIKeyUpdate(UpdateBase):
    """Schema for updating an API key"""
    name: Optional[str] = None
    channel: Optional[str] = None
    permissions: Optional[str] = None
    rateLimit: Optional[int] = None
    isActive: Optional[bool] = None


class APIKeyResponse(ResponseBase):
    """Schema for API key responses (without full key)"""
    id: UUID
    name: str
    keyPrefix: str
    channel: Optional[str] = None
    permissions: Optional[str] = None
    rateLimit: int
    isActive: bool
    lastUsedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class APIKeyCreatedResponse(APIKeyResponse):
    """Response when creating a new API key (includes full key - shown only once)"""
    key: str  # Full key shown only on creation
