"""
Inventory Allocation Model
Tracks inventory allocation for FIFO/LIFO/FEFO picking
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship
from pydantic import ConfigDict

if TYPE_CHECKING:
    from .company import Location, Bin
    from .sku import SKU
    from .user import User
    from .inventory import Inventory


# ============================================================================
# Inventory Allocation Table
# ============================================================================

class InventoryAllocation(SQLModel, table=True):
    """
    Inventory allocation record - tracks inventory reserved for orders.
    Supports FIFO/LIFO/FEFO allocation strategies.
    """
    __tablename__ = "inventory_allocations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    allocationNo: str = Field(index=True, unique=True)

    # Reference to order/wave/picklist
    orderId: Optional[UUID] = Field(default=None, foreign_key="Order.id", index=True)
    orderItemId: Optional[UUID] = Field(default=None, foreign_key="OrderItem.id")
    waveId: Optional[UUID] = Field(default=None, foreign_key="Wave.id", index=True)
    picklistId: Optional[UUID] = Field(default=None, foreign_key="Picklist.id", index=True)
    picklistItemId: Optional[UUID] = Field(default=None, foreign_key="PicklistItem.id")

    # Inventory reference
    skuId: UUID = Field(foreign_key="SKU.id", index=True)
    inventoryId: UUID = Field(foreign_key="Inventory.id", index=True)
    binId: UUID = Field(foreign_key="Bin.id", index=True)

    # Batch tracking
    batchNo: Optional[str] = Field(default=None)
    lotNo: Optional[str] = Field(default=None)

    # Quantities
    allocatedQty: int = Field(default=0)
    pickedQty: int = Field(default=0)

    # Valuation tracking
    valuationMethod: str = Field(default="FIFO")  # FIFO, LIFO, FEFO
    fifoSequence: Optional[int] = Field(default=None, index=True)
    expiryDate: Optional[datetime] = Field(default=None)
    costPrice: Optional[Decimal] = Field(default=None, max_digits=12, decimal_places=2)

    # Status tracking
    status: str = Field(default="ALLOCATED", index=True)  # ALLOCATED, PICKED, CANCELLED

    # User tracking
    allocatedById: Optional[UUID] = Field(default=None, foreign_key="User.id")
    pickedById: Optional[UUID] = Field(default=None, foreign_key="User.id")
    cancelledById: Optional[UUID] = Field(default=None, foreign_key="User.id")

    # Timestamps
    allocatedAt: datetime = Field(default_factory=datetime.utcnow)
    pickedAt: Optional[datetime] = Field(default=None)
    cancelledAt: Optional[datetime] = Field(default=None)

    # Multi-tenant
    locationId: UUID = Field(foreign_key="Location.id", index=True)
    companyId: UUID = Field(foreign_key="Company.id", index=True)

    # Audit
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Pydantic Schemas for API
# ============================================================================

class InventoryAllocationBase(SQLModel):
    """Base schema for inventory allocation"""
    orderId: Optional[UUID] = None
    orderItemId: Optional[UUID] = None
    waveId: Optional[UUID] = None
    picklistId: Optional[UUID] = None
    picklistItemId: Optional[UUID] = None
    skuId: UUID
    inventoryId: UUID
    binId: UUID
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    allocatedQty: int
    valuationMethod: str = "FIFO"
    fifoSequence: Optional[int] = None
    expiryDate: Optional[datetime] = None
    costPrice: Optional[Decimal] = None
    locationId: UUID
    companyId: UUID


class InventoryAllocationCreate(SQLModel):
    """Schema for creating an allocation (internal use)"""
    orderId: Optional[UUID] = None
    orderItemId: Optional[UUID] = None
    waveId: Optional[UUID] = None
    picklistId: Optional[UUID] = None
    picklistItemId: Optional[UUID] = None
    skuId: UUID
    inventoryId: UUID
    binId: UUID
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    allocatedQty: int
    valuationMethod: str = "FIFO"
    fifoSequence: Optional[int] = None
    expiryDate: Optional[datetime] = None
    costPrice: Optional[Decimal] = None
    locationId: UUID
    companyId: UUID


class InventoryAllocationUpdate(SQLModel):
    """Schema for updating allocation"""
    pickedQty: Optional[int] = None
    status: Optional[str] = None
    pickedById: Optional[UUID] = None
    pickedAt: Optional[datetime] = None


class InventoryAllocationResponse(SQLModel):
    """Response schema for allocation"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    allocationNo: str
    orderId: Optional[UUID] = None
    orderItemId: Optional[UUID] = None
    waveId: Optional[UUID] = None
    picklistId: Optional[UUID] = None
    picklistItemId: Optional[UUID] = None
    skuId: UUID
    inventoryId: UUID
    binId: UUID
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    allocatedQty: int
    pickedQty: int
    valuationMethod: str
    fifoSequence: Optional[int] = None
    expiryDate: Optional[datetime] = None
    costPrice: Optional[Decimal] = None
    status: str
    allocatedById: Optional[UUID] = None
    allocatedAt: datetime
    pickedAt: Optional[datetime] = None
    locationId: UUID
    companyId: UUID
    createdAt: datetime

    # Additional computed fields
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    binCode: Optional[str] = None


class InventoryAllocationBrief(SQLModel):
    """Brief allocation info for lists"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    allocationNo: str
    skuId: UUID
    skuCode: Optional[str] = None
    binId: UUID
    binCode: Optional[str] = None
    allocatedQty: int
    pickedQty: int
    status: str
    valuationMethod: str
    fifoSequence: Optional[int] = None


# ============================================================================
# Allocation Request/Response Schemas
# ============================================================================

class AllocationRequest(SQLModel):
    """Request to allocate inventory for an order/wave"""
    skuId: UUID
    requiredQty: int
    locationId: UUID
    orderId: Optional[UUID] = None
    orderItemId: Optional[UUID] = None
    waveId: Optional[UUID] = None
    picklistId: Optional[UUID] = None
    picklistItemId: Optional[UUID] = None
    valuationMethod: Optional[str] = None  # Override default method
    preferredBinId: Optional[UUID] = None  # Prefer specific bin


class AllocationResult(SQLModel):
    """Result of allocation attempt"""
    success: bool
    skuId: UUID
    requestedQty: int
    allocatedQty: int
    shortfallQty: int
    allocations: List[InventoryAllocationBrief] = []
    message: Optional[str] = None


class BulkAllocationRequest(SQLModel):
    """Request to allocate multiple SKUs"""
    locationId: UUID
    orderId: Optional[UUID] = None
    waveId: Optional[UUID] = None
    items: List[AllocationRequest]


class BulkAllocationResult(SQLModel):
    """Result of bulk allocation"""
    success: bool
    totalRequested: int
    totalAllocated: int
    totalShortfall: int
    results: List[AllocationResult]
    message: Optional[str] = None


class DeallocationRequest(SQLModel):
    """Request to deallocate (release) inventory"""
    allocationId: UUID
    reason: Optional[str] = None


class ConfirmPickRequest(SQLModel):
    """Request to confirm pick completion"""
    allocationId: UUID
    pickedQty: int
    pickedById: Optional[UUID] = None
