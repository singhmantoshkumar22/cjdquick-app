"""
Brand Model - SQLModel Implementation
Represents product brands within the OMS
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase

if TYPE_CHECKING:
    from .company import Company


# ============================================================================
# Database Model
# ============================================================================

class Brand(BaseModel, table=True):
    """
    Brand model - represents product brands.
    Multi-tenant: belongs to a Company.
    """
    __tablename__ = "Brand"

    # Identity
    code: str = Field(
        sa_column=Column(String, unique=True, nullable=False, index=True)
    )
    name: str = Field(sa_column=Column(String, nullable=False))

    # Branding
    logo: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)

    # Contact
    contactPerson: Optional[str] = Field(default=None)
    contactEmail: Optional[str] = Field(default=None)
    contactPhone: Optional[str] = Field(default=None)
    website: Optional[str] = Field(default=None)

    # Address
    address: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # Configuration
    settings: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # Status
    isActive: bool = Field(default=True)

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
    company: Optional["Company"] = Relationship(back_populates="brands")


# ============================================================================
# Request/Response Schemas
# ============================================================================

class BrandCreate(CreateBase):
    """Schema for creating a new brand"""
    code: str
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    contactPerson: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None
    companyId: UUID


class BrandUpdate(UpdateBase):
    """Schema for updating a brand"""
    code: Optional[str] = None
    name: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    contactPerson: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None
    isActive: Optional[bool] = None


class BrandResponse(ResponseBase):
    """Schema for brand API responses"""
    id: UUID
    code: str
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    contactPerson: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None
    isActive: bool
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class BrandBrief(ResponseBase):
    """Brief brand info for lists and references"""
    id: UUID
    code: str
    name: str
    logo: Optional[str] = None
