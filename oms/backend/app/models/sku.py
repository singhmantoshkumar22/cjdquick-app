"""
SKU Model - SQLModel Implementation
Product/Stock Keeping Unit master data
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Boolean, JSON, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase

if TYPE_CHECKING:
    from .company import Company
    from .inventory import Inventory
    from .order import OrderItem


# ============================================================================
# Database Model
# ============================================================================

class SKU(BaseModel, table=True):
    """
    SKU model - Stock Keeping Unit / Product master.
    Multi-tenant: belongs to a Company.
    """
    __tablename__ = "SKU"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False, index=True))
    name: str = Field(sa_column=Column(String, nullable=False, index=True))
    description: Optional[str] = Field(default=None)

    # Categorization
    category: Optional[str] = Field(default=None)
    subCategory: Optional[str] = Field(default=None)
    brand: Optional[str] = Field(default=None)

    # Tax
    hsn: Optional[str] = Field(default=None)

    # Dimensions
    weight: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 3))
    )
    length: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )
    width: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )
    height: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )

    # Pricing
    mrp: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 2))
    )
    costPrice: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 2))
    )
    sellingPrice: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 2))
    )
    taxRate: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(5, 2))
    )

    # Tracking
    isSerialised: bool = Field(default=False)
    isBatchTracked: bool = Field(default=False)

    # Reorder
    reorderLevel: Optional[int] = Field(default=None)
    reorderQty: Optional[int] = Field(default=None)

    # Arrays
    barcodes: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )
    images: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # Custom attributes
    attributes: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # Status
    isActive: bool = Field(default=True)

    # Inventory Valuation - Override for this SKU
    valuationMethod: Optional[str] = Field(
        default=None,
        sa_column=Column(String, default=None)
    )  # FIFO, LIFO, FEFO, WAC - overrides company/location default

    # Variant flags
    isVariantParent: bool = Field(default=False)
    isVariant: bool = Field(default=False)

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
    company: Optional["Company"] = Relationship(back_populates="skus")
    inventory: List["Inventory"] = Relationship(back_populates="sku")
    orderItems: List["OrderItem"] = Relationship(back_populates="sku")


# ============================================================================
# Request/Response Schemas
# ============================================================================

class SKUBase(SQLModel):
    """Shared SKU fields"""
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    weight: Optional[Decimal] = None
    length: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    mrp: Optional[Decimal] = None
    costPrice: Optional[Decimal] = None
    sellingPrice: Optional[Decimal] = None
    taxRate: Optional[Decimal] = None
    isSerialised: bool = False
    isBatchTracked: bool = False
    reorderLevel: Optional[int] = None
    reorderQty: Optional[int] = None
    barcodes: List[str] = []
    images: List[str] = []
    attributes: Optional[dict] = None
    isActive: bool = True
    valuationMethod: Optional[str] = None  # FIFO, LIFO, FEFO, WAC
    isVariantParent: bool = False
    isVariant: bool = False


class SKUCreate(CreateBase):
    """Schema for creating a new SKU"""
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    weight: Optional[Decimal] = None
    length: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    mrp: Optional[Decimal] = None
    costPrice: Optional[Decimal] = None
    sellingPrice: Optional[Decimal] = None
    taxRate: Optional[Decimal] = None
    isSerialised: bool = False
    isBatchTracked: bool = False
    reorderLevel: Optional[int] = None
    reorderQty: Optional[int] = None
    barcodes: List[str] = []
    images: List[str] = []
    attributes: Optional[dict] = None
    valuationMethod: Optional[str] = None  # FIFO, LIFO, FEFO, WAC
    companyId: UUID


class SKUUpdate(UpdateBase):
    """Schema for updating a SKU"""
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    weight: Optional[Decimal] = None
    length: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    mrp: Optional[Decimal] = None
    costPrice: Optional[Decimal] = None
    sellingPrice: Optional[Decimal] = None
    taxRate: Optional[Decimal] = None
    isSerialised: Optional[bool] = None
    isBatchTracked: Optional[bool] = None
    reorderLevel: Optional[int] = None
    reorderQty: Optional[int] = None
    barcodes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    attributes: Optional[dict] = None
    isActive: Optional[bool] = None
    valuationMethod: Optional[str] = None  # FIFO, LIFO, FEFO, WAC
    isVariantParent: Optional[bool] = None
    isVariant: Optional[bool] = None


class SKUResponse(ResponseBase):
    """Schema for SKU API responses"""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    weight: Optional[Decimal] = None
    length: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    mrp: Optional[Decimal] = None
    costPrice: Optional[Decimal] = None
    sellingPrice: Optional[Decimal] = None
    taxRate: Optional[Decimal] = None
    isSerialised: bool
    isBatchTracked: bool
    reorderLevel: Optional[int] = None
    reorderQty: Optional[int] = None
    barcodes: List[str] = []
    images: List[str] = []
    attributes: Optional[dict] = None
    isActive: bool
    valuationMethod: Optional[str] = None  # FIFO, LIFO, FEFO, WAC
    isVariantParent: bool
    isVariant: bool
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class SKUBrief(ResponseBase):
    """Brief SKU info for lists and references"""
    id: UUID
    code: str
    name: str
    category: Optional[str] = None
    mrp: Optional[Decimal] = None
    sellingPrice: Optional[Decimal] = None
    isActive: bool
