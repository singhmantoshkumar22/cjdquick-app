"""
Putaway Task Models - For managing putaway operations from receiving to storage
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from decimal import Decimal

from sqlmodel import SQLModel, Field, Column, String, Integer, DateTime, Relationship
from sqlalchemy import Text
from pydantic import BaseModel


class PutawayTask(SQLModel, table=True):
    """
    Putaway task for moving inventory from receiving/staging to storage bins.
    Generated from Goods Receipt or created manually.
    """
    __tablename__ = "putaway_tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    taskNo: str = Field(sa_column=Column(String(50), unique=True, index=True))

    # Source references
    goodsReceiptId: Optional[UUID] = Field(default=None, foreign_key="GoodsReceipt.id", index=True)
    goodsReceiptItemId: Optional[UUID] = Field(default=None, foreign_key="GoodsReceiptItem.id", index=True)

    # SKU and quantity
    skuId: UUID = Field(foreign_key="SKU.id", index=True)
    quantity: int = Field(default=0)
    batchNo: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    lotNo: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    expiryDate: Optional[datetime] = Field(default=None)

    # Bin locations
    fromBinId: Optional[UUID] = Field(default=None, foreign_key="Bin.id")  # Staging/receiving bin
    toBinId: UUID = Field(foreign_key="Bin.id", index=True)  # Target storage bin

    # Actual putaway result (may differ from planned)
    actualBinId: Optional[UUID] = Field(default=None, foreign_key="Bin.id")
    actualQty: Optional[int] = Field(default=None)

    # Status and priority
    status: str = Field(
        default="PENDING",
        sa_column=Column(String(20), default="PENDING", index=True)
    )  # PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    priority: int = Field(default=5)  # 1 = highest, 10 = lowest

    # Assignment
    assignedToId: Optional[UUID] = Field(default=None, foreign_key="User.id", index=True)
    assignedAt: Optional[datetime] = Field(default=None)
    assignedById: Optional[UUID] = Field(default=None, foreign_key="User.id")

    # Execution timestamps
    startedAt: Optional[datetime] = Field(default=None)
    completedAt: Optional[datetime] = Field(default=None)
    completedById: Optional[UUID] = Field(default=None, foreign_key="User.id")

    # Cancellation
    cancelledAt: Optional[datetime] = Field(default=None)
    cancelledById: Optional[UUID] = Field(default=None, foreign_key="User.id")
    cancellationReason: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Notes
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Location and company (multi-tenant)
    locationId: UUID = Field(foreign_key="Location.id", index=True)
    companyId: UUID = Field(foreign_key="Company.id", index=True)

    # Audit fields
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    createdById: Optional[UUID] = Field(default=None, foreign_key="User.id")
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Request/Response Schemas
# ============================================================================

class PutawayTaskCreate(BaseModel):
    """Schema for creating a putaway task"""
    goodsReceiptId: Optional[UUID] = None
    goodsReceiptItemId: Optional[UUID] = None
    skuId: UUID
    quantity: int
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    fromBinId: Optional[UUID] = None
    toBinId: UUID
    priority: int = 5
    notes: Optional[str] = None
    locationId: UUID


class PutawayTaskUpdate(BaseModel):
    """Schema for updating a putaway task"""
    toBinId: Optional[UUID] = None
    priority: Optional[int] = None
    notes: Optional[str] = None


class PutawayTaskAssign(BaseModel):
    """Schema for assigning a putaway task"""
    assignedToId: UUID


class PutawayTaskComplete(BaseModel):
    """Schema for completing a putaway task"""
    actualBinId: Optional[UUID] = None  # If different from planned toBinId
    actualQty: Optional[int] = None  # If different from planned quantity
    notes: Optional[str] = None


class PutawayTaskCancel(BaseModel):
    """Schema for cancelling a putaway task"""
    reason: str


class PutawayTaskResponse(BaseModel):
    """Response schema for putaway task"""
    id: UUID
    taskNo: str
    goodsReceiptId: Optional[UUID] = None
    goodsReceiptItemId: Optional[UUID] = None
    skuId: UUID
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    quantity: int
    batchNo: Optional[str] = None
    lotNo: Optional[str] = None
    expiryDate: Optional[datetime] = None
    fromBinId: Optional[UUID] = None
    fromBinCode: Optional[str] = None
    toBinId: UUID
    toBinCode: Optional[str] = None
    actualBinId: Optional[UUID] = None
    actualBinCode: Optional[str] = None
    actualQty: Optional[int] = None
    status: str
    priority: int
    assignedToId: Optional[UUID] = None
    assignedToName: Optional[str] = None
    assignedAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    notes: Optional[str] = None
    locationId: UUID
    locationName: Optional[str] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PutawayTaskBrief(BaseModel):
    """Brief response schema for putaway task list"""
    id: UUID
    taskNo: str
    skuCode: Optional[str] = None
    skuName: Optional[str] = None
    quantity: int
    toBinCode: Optional[str] = None
    status: str
    priority: int
    assignedToName: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class BinSuggestion(BaseModel):
    """Bin suggestion for putaway"""
    binId: UUID
    binCode: str
    zoneName: Optional[str] = None
    zoneType: Optional[str] = None
    score: float  # Higher is better
    reason: str
    availableCapacity: int
    hasSameSku: bool
    isEmpty: bool


class BinSuggestionRequest(BaseModel):
    """Request for bin suggestion"""
    skuId: UUID
    quantity: int
    locationId: UUID
    preferSameSkuBins: bool = True
    preferEmptyBins: bool = False


class BinSuggestionResponse(BaseModel):
    """Response with bin suggestions"""
    suggestions: List[BinSuggestion]
    defaultBinId: Optional[UUID] = None
    defaultBinCode: Optional[str] = None


class BulkPutawayTaskCreate(BaseModel):
    """Schema for creating multiple putaway tasks from goods receipt"""
    goodsReceiptId: UUID
    autoSuggestBins: bool = True


class BulkPutawayTaskResponse(BaseModel):
    """Response for bulk putaway task creation"""
    success: bool
    tasksCreated: int
    tasks: List[PutawayTaskResponse]
    errors: List[str] = []
