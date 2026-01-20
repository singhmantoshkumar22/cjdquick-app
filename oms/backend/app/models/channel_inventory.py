"""
Channel Inventory Models - SQLModel Implementation
Per-SKU channel allocation rules and channel-specific inventory tracking
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase
from .enums import Channel

if TYPE_CHECKING:
    from .sku import SKU
    from .company import Location, Bin, Company
    from .goods_receipt import GoodsReceipt


# ============================================================================
# Channel Inventory Rule - Per-SKU allocation rules by channel
# ============================================================================

class ChannelInventoryRule(BaseModel, table=True):
    """
    Defines allocation rules for how inventory should be split by channel after GRN.
    Example: SKU-001 at Warehouse-A: 40% to WEBSITE, 30% to AMAZON, 30% to FLIPKART
    Or absolute quantities: 400 units to WEBSITE, 300 to AMAZON, 300 to FLIPKART
    """
    __tablename__ = "ChannelInventoryRule"
    __table_args__ = (
        UniqueConstraint('skuId', 'locationId', 'channel', name='uq_channel_rule_sku_location_channel'),
    )

    # Foreign Keys
    skuId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("SKU.id"),
            nullable=False,
            index=True
        )
    )
    locationId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Location.id"),
            nullable=False,
            index=True
        )
    )
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Channel allocation
    channel: str = Field(sa_column=Column(String(50), nullable=False))
    allocatedQty: int = Field(default=0)  # Absolute quantity for this channel
    priority: int = Field(default=1)  # Lower = higher priority for allocation
    isActive: bool = Field(default=True)


# ============================================================================
# Channel Inventory - Actual inventory by channel after GRN
# ============================================================================

class ChannelInventory(BaseModel, table=True):
    """
    Tracks actual inventory available per channel after GRN posting.
    Each channel has its own reserved inventory pool.
    """
    __tablename__ = "ChannelInventory"

    # Foreign Keys
    skuId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("SKU.id"),
            nullable=False,
            index=True
        )
    )
    locationId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Location.id"),
            nullable=False,
            index=True
        )
    )
    binId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Bin.id"),
            nullable=True
        )
    )
    goodsReceiptId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("GoodsReceipt.id"),
            nullable=True
        )
    )
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Channel
    channel: str = Field(sa_column=Column(String(50), nullable=False, index=True))

    # Quantities
    quantity: int = Field(default=0)  # Available for this channel
    reservedQty: int = Field(default=0)  # Reserved for orders

    # Batch tracking
    batchNo: Optional[str] = Field(default=None)
    lotNo: Optional[str] = Field(default=None)
    expiryDate: Optional[datetime] = Field(default=None)
    mfgDate: Optional[datetime] = Field(default=None)

    # Pricing
    costPrice: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 2))
    )

    # FIFO sequence for allocation ordering
    fifoSequence: int = Field(default=0, index=True)

    # GRN reference
    grNo: Optional[str] = Field(default=None)

    @property
    def availableQty(self) -> int:
        """Calculate available quantity (quantity - reserved)"""
        return max(0, self.quantity - self.reservedQty)


# ============================================================================
# Pydantic Schemas for API
# ============================================================================

# ChannelInventoryRule Schemas
class ChannelInventoryRuleBase(SQLModel):
    """Base schema for channel inventory rule"""
    skuId: UUID
    locationId: UUID
    channel: str
    allocatedQty: int = 0
    priority: int = 1
    isActive: bool = True


class ChannelInventoryRuleCreate(CreateBase):
    """Schema for creating channel inventory rule"""
    skuId: UUID
    locationId: UUID
    channel: str
    allocatedQty: int
    priority: int = 1
    isActive: bool = True


class ChannelInventoryRuleUpdate(UpdateBase):
    """Schema for updating channel inventory rule"""
    allocatedQty: Optional[int] = None
    priority: Optional[int] = None
    isActive: Optional[bool] = None


class ChannelInventoryRuleResponse(ResponseBase):
    """Response schema for channel inventory rule"""
    id: UUID
    skuId: UUID
    locationId: UUID
    channel: str
    allocatedQty: int
    priority: int
    isActive: bool
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime

    # Optional joined fields
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    locationName: Optional[str] = None


# ChannelInventory Schemas
class ChannelInventoryBase(SQLModel):
    """Base schema for channel inventory"""
    skuId: UUID
    locationId: UUID
    channel: str
    quantity: int = 0
    reservedQty: int = 0


class ChannelInventoryCreate(CreateBase):
    """Schema for creating channel inventory"""
    skuId: UUID
    locationId: UUID
    binId: Optional[UUID] = None
    channel: str
    quantity: int
    reservedQty: int = 0
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    mfgDate: Optional[datetime] = None
    costPrice: Optional[Decimal] = None
    fifoSequence: int = 0
    grNo: Optional[str] = None
    goodsReceiptId: Optional[UUID] = None


class ChannelInventoryUpdate(UpdateBase):
    """Schema for updating channel inventory"""
    quantity: Optional[int] = None
    reservedQty: Optional[int] = None
    binId: Optional[UUID] = None


class ChannelInventoryResponse(ResponseBase):
    """Response schema for channel inventory"""
    id: UUID
    skuId: UUID
    locationId: UUID
    binId: Optional[UUID] = None
    channel: str
    quantity: int
    reservedQty: int
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    mfgDate: Optional[datetime] = None
    costPrice: Optional[Decimal] = None
    fifoSequence: int
    grNo: Optional[str] = None
    goodsReceiptId: Optional[UUID] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime

    # Computed
    availableQty: Optional[int] = None

    # Optional joined fields
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    locationName: Optional[str] = None
    binCode: Optional[str] = None


class ChannelInventorySummary(ResponseBase):
    """Summary of channel inventory for a SKU"""
    skuId: UUID
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    locationId: UUID
    locationName: Optional[str] = None
    channel: str
    totalQuantity: int
    totalReserved: int
    totalAvailable: int
    recordCount: int


# Bulk allocation request for GRN
class ChannelAllocationItem(SQLModel):
    """Single channel allocation in a GRN"""
    channel: str
    quantity: int  # Absolute quantity for this channel


class GRNChannelAllocationRequest(SQLModel):
    """Request to allocate GRN items by channel"""
    goodsReceiptItemId: UUID
    allocations: List[ChannelAllocationItem]
