"""
External Order Schemas - For client API integration
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from sqlmodel import SQLModel
from pydantic import Field, field_validator


class ExternalCustomer(SQLModel):
    """Customer information from external system"""
    name: str
    email: Optional[str] = None
    phone: str


class ExternalAddress(SQLModel):
    """Address information from external system"""
    name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"
    phone: Optional[str] = None


class ExternalOrderItem(SQLModel):
    """Order item from external system"""
    sku: str  # SKU code - must exist in system
    name: str  # Product name (for reference)
    quantity: int = Field(gt=0)
    unitPrice: Decimal
    discount: Decimal = Decimal("0.00")
    taxRate: Decimal = Decimal("0.00")

    @field_validator('unitPrice', 'discount', 'taxRate', mode='before')
    @classmethod
    def convert_to_decimal(cls, v):
        if isinstance(v, str):
            return Decimal(v)
        return v


class ExternalOrderCharges(SQLModel):
    """Order charges from external system"""
    subtotal: Decimal
    discount: Decimal = Decimal("0.00")
    shippingCharges: Decimal = Decimal("0.00")
    codCharges: Decimal = Decimal("0.00")
    giftWrap: Decimal = Decimal("0.00")
    taxAmount: Decimal = Decimal("0.00")
    totalAmount: Decimal

    @field_validator('subtotal', 'discount', 'shippingCharges', 'codCharges',
                     'giftWrap', 'taxAmount', 'totalAmount', mode='before')
    @classmethod
    def convert_to_decimal(cls, v):
        if isinstance(v, str):
            return Decimal(v)
        return v


class ExternalOrderCreate(SQLModel):
    """
    Schema for creating orders from external systems (clients).
    This is the main payload clients will send to create orders.
    """
    # External reference
    externalOrderId: str  # Client's order ID (required, must be unique per channel)
    channel: str = "API"  # Sales channel: SHOPIFY, AMAZON, WEB, POS, API, etc.

    # Order details
    orderDate: Optional[datetime] = None  # Defaults to now if not provided
    paymentMode: str = "PREPAID"  # PREPAID | COD
    paymentStatus: str = "PAID"  # PAID | PENDING | PARTIAL

    # Customer & Address
    customer: ExternalCustomer
    shippingAddress: ExternalAddress
    billingAddress: Optional[ExternalAddress] = None  # Defaults to shipping address

    # Items
    items: List[ExternalOrderItem] = Field(min_length=1)

    # Charges (optional - will be calculated if not provided)
    charges: Optional[ExternalOrderCharges] = None

    # Additional info
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

    # Fulfillment preferences
    preferredWarehouse: Optional[str] = None  # Warehouse code
    preferredCourier: Optional[str] = None  # Courier code

    # Priority
    isPriority: bool = False


class ExternalOrderResponse(SQLModel):
    """Response after creating an external order"""
    success: bool
    orderId: UUID
    orderNo: str
    externalOrderId: str
    status: str
    message: str
    createdAt: datetime


class ExternalOrderError(SQLModel):
    """Error response for external order creation"""
    success: bool = False
    error: str
    errorCode: str
    details: Optional[dict] = None


class ExternalBulkOrderCreate(SQLModel):
    """Schema for creating multiple orders at once"""
    orders: List[ExternalOrderCreate] = Field(min_length=1, max_length=100)


class ExternalBulkOrderResponse(SQLModel):
    """Response for bulk order creation"""
    success: bool
    totalReceived: int
    totalCreated: int
    totalFailed: int
    orders: List[ExternalOrderResponse]
    errors: List[dict]
