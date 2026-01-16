"""
Inbound Models - SQLModel Implementation
Goods receipt and inbound processing
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase
from .enums import InboundType, InboundStatus

if TYPE_CHECKING:
    from .company import Location, Bin
    from .sku import SKU
    from .user import User


# ============================================================================
# Database Models
# ============================================================================

class Inbound(BaseModel, table=True):
    """
    Inbound model - Goods receipt/receiving.
    Tracks inbound shipments from POs, returns, or transfers.
    """
    __tablename__ = "Inbound"

    # Identity
    inboundNo: str = Field(sa_column=Column(String, unique=True, nullable=False))

    # Type & Status
    type: InboundType = Field(sa_column=Column(String, nullable=False, index=True))
    status: InboundStatus = Field(
        default=InboundStatus.PENDING,
        sa_column=Column(String, default="PENDING", index=True)
    )

    # Foreign Keys
    locationId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Location.id"),
            nullable=False,
            index=True
        )
    )
    receivedById: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("User.id"),
            nullable=False
        )
    )
    purchaseOrderId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("PurchaseOrder.id"))
    )

    # GRN (Goods Receipt Note)
    grnNo: Optional[str] = Field(default=None)

    # Remarks
    remarks: Optional[str] = Field(default=None)

    # Timestamps
    completedAt: Optional[datetime] = Field(default=None)

    # Relationships
    location: Optional["Location"] = Relationship()
    receivedBy: Optional["User"] = Relationship()
    items: List["InboundItem"] = Relationship(back_populates="inbound")


class InboundItem(BaseModel, table=True):
    """
    InboundItem model - Line item in inbound receipt.
    Individual SKU receiving with QC tracking.
    """
    __tablename__ = "InboundItem"

    # Foreign Keys
    inboundId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Inbound.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    skuId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("SKU.id"),
            nullable=False,
            index=True
        )
    )
    binId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("Bin.id"))
    )

    # Quantities
    expectedQty: Optional[int] = Field(default=None)
    receivedQty: int = Field(default=0)
    acceptedQty: int = Field(default=0)
    rejectedQty: int = Field(default=0)

    # Batch tracking
    batchNo: Optional[str] = Field(default=None)
    expiryDate: Optional[datetime] = Field(default=None)
    mfgDate: Optional[datetime] = Field(default=None)
    mrp: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 2))
    )
    serialNumbers: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # QC
    qcStatus: Optional[str] = Field(default=None)
    qcRemarks: Optional[str] = Field(default=None)

    # Relationships
    inbound: Optional["Inbound"] = Relationship(back_populates="items")
    sku: Optional["SKU"] = Relationship()
    bin: Optional["Bin"] = Relationship()


# ============================================================================
# Request/Response Schemas
# ============================================================================

# --- Inbound Schemas ---

class InboundCreate(CreateBase):
    """Schema for creating inbound"""
    inboundNo: str
    type: InboundType
    locationId: UUID
    receivedById: UUID
    purchaseOrderId: Optional[UUID] = None
    grnNo: Optional[str] = None
    remarks: Optional[str] = None


class InboundUpdate(UpdateBase):
    """Schema for updating inbound"""
    status: Optional[InboundStatus] = None
    grnNo: Optional[str] = None
    remarks: Optional[str] = None
    completedAt: Optional[datetime] = None


class InboundResponse(ResponseBase):
    """Schema for inbound API responses"""
    id: UUID
    inboundNo: str
    type: InboundType
    status: InboundStatus
    locationId: UUID
    receivedById: UUID
    purchaseOrderId: Optional[UUID] = None
    grnNo: Optional[str] = None
    remarks: Optional[str] = None
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class InboundBrief(ResponseBase):
    """Brief inbound info for lists"""
    id: UUID
    inboundNo: str
    type: InboundType
    status: InboundStatus
    createdAt: datetime


# --- InboundItem Schemas ---

class InboundItemCreate(CreateBase):
    """Schema for creating inbound item"""
    inboundId: UUID
    skuId: UUID
    expectedQty: Optional[int] = None
    receivedQty: int
    batchNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    mfgDate: Optional[datetime] = None
    mrp: Optional[Decimal] = None
    serialNumbers: List[str] = []
    binId: Optional[UUID] = None


class InboundItemUpdate(UpdateBase):
    """Schema for updating inbound item"""
    receivedQty: Optional[int] = None
    acceptedQty: Optional[int] = None
    rejectedQty: Optional[int] = None
    batchNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    mfgDate: Optional[datetime] = None
    mrp: Optional[Decimal] = None
    serialNumbers: Optional[List[str]] = None
    binId: Optional[UUID] = None
    qcStatus: Optional[str] = None
    qcRemarks: Optional[str] = None


class InboundItemResponse(ResponseBase):
    """Schema for inbound item API responses"""
    id: UUID
    inboundId: UUID
    skuId: UUID
    binId: Optional[UUID] = None
    expectedQty: Optional[int] = None
    receivedQty: int
    acceptedQty: int
    rejectedQty: int
    batchNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    mfgDate: Optional[datetime] = None
    mrp: Optional[Decimal] = None
    serialNumbers: List[str] = []
    qcStatus: Optional[str] = None
    qcRemarks: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


# --- Summary Schemas ---

class InboundSummary(SQLModel):
    """Inbound summary statistics"""
    totalInbounds: int
    pendingInbounds: int
    inProgressInbounds: int
    completedInbounds: int
    totalItemsReceived: int
    totalUnitsReceived: int
    rejectionRate: float
