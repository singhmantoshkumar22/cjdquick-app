"""
Company, Location, Zone, Bin Models - SQLModel Implementation
Core organizational structure for multi-tenant OMS
"""
from datetime import datetime
from typing import Optional, List, Any, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, JSON, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase
from .enums import LocationType, ZoneType

if TYPE_CHECKING:
    from .user import User
    from .brand import Brand
    from .sku import SKU
    from .customer import Customer, CustomerGroup


# ============================================================================
# Company Model
# ============================================================================

class Company(BaseModel, table=True):
    """
    Company model - represents tenant organizations.
    Root of multi-tenant hierarchy.
    """
    __tablename__ = "Company"

    # Identity
    code: str = Field(
        sa_column=Column(String, unique=True, nullable=False, index=True)
    )
    name: str = Field(sa_column=Column(String, nullable=False))
    legalName: Optional[str] = Field(default=None)

    # Tax/Legal
    gst: Optional[str] = Field(default=None)
    pan: Optional[str] = Field(default=None)
    cin: Optional[str] = Field(default=None)

    # Branding
    logo: Optional[str] = Field(default=None)

    # Contact
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
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

    # Relationships
    users: List["User"] = Relationship(back_populates="company")
    locations: List["Location"] = Relationship(back_populates="company")
    brands: List["Brand"] = Relationship(back_populates="company")
    skus: List["SKU"] = Relationship(back_populates="company")
    customers: List["Customer"] = Relationship(back_populates="company")
    customerGroups: List["CustomerGroup"] = Relationship(back_populates="company")


# ============================================================================
# Location Model
# ============================================================================

class Location(BaseModel, table=True):
    """
    Location model - warehouses, stores, hubs.
    Child of Company.
    """
    __tablename__ = "Location"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    type: LocationType = Field(
        sa_column=Column(String, nullable=False)
    )

    # Address
    address: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # Contact
    contactPerson: Optional[str] = Field(default=None)
    contactPhone: Optional[str] = Field(default=None)
    contactEmail: Optional[str] = Field(default=None)

    # Tax
    gst: Optional[str] = Field(default=None)

    # Status
    isActive: bool = Field(default=True)

    # Configuration
    settings: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

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
    company: Optional["Company"] = Relationship(back_populates="locations")
    zones: List["Zone"] = Relationship(back_populates="location")


# ============================================================================
# Zone Model
# ============================================================================

class Zone(BaseModel, table=True):
    """
    Zone model - warehouse zones (saleable, damaged, QC, etc.)
    Child of Location.
    """
    __tablename__ = "Zone"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    type: ZoneType = Field(
        sa_column=Column(String, nullable=False)
    )

    # Details
    description: Optional[str] = Field(default=None)

    # Status
    isActive: bool = Field(default=True)

    # Parent
    locationId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Location.id"),
            nullable=False,
            index=True
        )
    )

    # Relationships
    location: Optional["Location"] = Relationship(back_populates="zones")
    bins: List["Bin"] = Relationship(back_populates="zone")


# ============================================================================
# Bin Model
# ============================================================================

class Bin(BaseModel, table=True):
    """
    Bin model - storage bins within zones.
    Child of Zone.
    """
    __tablename__ = "Bin"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: Optional[str] = Field(default=None)

    # Details
    description: Optional[str] = Field(default=None)
    capacity: Optional[int] = Field(default=None)

    # Status
    isActive: bool = Field(default=True)

    # Parent
    zoneId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Zone.id"),
            nullable=False,
            index=True
        )
    )

    # Relationships
    zone: Optional["Zone"] = Relationship(back_populates="bins")


# ============================================================================
# Request/Response Schemas
# ============================================================================

# Company Schemas
class CompanyCreate(CreateBase):
    code: str
    name: str
    legalName: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    logo: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None


class CompanyUpdate(UpdateBase):
    code: Optional[str] = None
    name: Optional[str] = None
    legalName: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    logo: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None
    isActive: Optional[bool] = None


class CompanyResponse(ResponseBase):
    id: UUID
    code: str
    name: str
    legalName: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    logo: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    settings: Optional[dict] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime


class CompanyBrief(ResponseBase):
    id: UUID
    code: str
    name: str
    logo: Optional[str] = None


# Location Schemas
class LocationCreate(CreateBase):
    code: str
    name: str
    type: LocationType
    address: Optional[dict] = None
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    gst: Optional[str] = None
    settings: Optional[dict] = None
    companyId: UUID


class LocationUpdate(UpdateBase):
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[LocationType] = None
    address: Optional[dict] = None
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    gst: Optional[str] = None
    settings: Optional[dict] = None
    isActive: Optional[bool] = None


class LocationResponse(ResponseBase):
    id: UUID
    code: str
    name: str
    type: LocationType
    address: Optional[dict] = None
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    gst: Optional[str] = None
    settings: Optional[dict] = None
    isActive: bool
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class LocationBrief(ResponseBase):
    id: UUID
    code: str
    name: str
    type: LocationType


# Zone Schemas
class ZoneCreate(CreateBase):
    code: str
    name: str
    type: ZoneType
    description: Optional[str] = None
    locationId: UUID


class ZoneUpdate(UpdateBase):
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[ZoneType] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None


class ZoneResponse(ResponseBase):
    id: UUID
    code: str
    name: str
    type: ZoneType
    description: Optional[str] = None
    isActive: bool
    locationId: UUID
    createdAt: datetime
    updatedAt: datetime


# Bin Schemas
class BinCreate(CreateBase):
    code: str
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    zoneId: UUID


class BinUpdate(UpdateBase):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    isActive: Optional[bool] = None


class BinResponse(ResponseBase):
    id: UUID
    code: str
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    isActive: bool
    zoneId: UUID
    createdAt: datetime
    updatedAt: datetime
