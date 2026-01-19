"""
B2B Logistics Models - SQLModel Implementation
LTL/FTL freight shipments with Lorry Receipts (LR)
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from uuid import UUID

from pydantic import field_validator
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, JSON, ForeignKey, text, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase


# ============================================================================
# Enums
# ============================================================================

class LRStatus(str, Enum):
    """Lorry Receipt status"""
    BOOKED = "BOOKED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    POD_PENDING = "POD_PENDING"
    POD_RECEIVED = "POD_RECEIVED"
    CANCELLED = "CANCELLED"


class VehicleType(str, Enum):
    """Vehicle types"""
    TRUCK = "TRUCK"
    CONTAINER = "CONTAINER"
    TRAILER = "TRAILER"
    TEMPO = "TEMPO"
    PICKUP = "PICKUP"
    MINI_TRUCK = "MINI_TRUCK"


class FreightPaymentMode(str, Enum):
    """Freight payment modes"""
    PAID = "PAID"
    TO_PAY = "TO_PAY"
    TO_BE_BILLED = "TO_BE_BILLED"


class BookingType(str, Enum):
    """Booking types"""
    LTL = "LTL"  # Less Than Truck Load
    FTL = "FTL"  # Full Truck Load


class BookingStatus(str, Enum):
    """Booking status"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ASSIGNED = "ASSIGNED"
    CANCELLED = "CANCELLED"


class ProductType(str, Enum):
    """Product/cargo types"""
    GENERAL = "GENERAL"
    FRAGILE = "FRAGILE"
    PERISHABLE = "PERISHABLE"
    HAZARDOUS = "HAZARDOUS"
    OVERSIZED = "OVERSIZED"


# ============================================================================
# Database Models
# ============================================================================

class B2BConsignee(BaseModel, table=True):
    """
    B2B Consignee model - Delivery points master for freight shipments.
    Multi-tenant via companyId.
    """
    __tablename__ = "B2BConsignee"

    # Basic info
    name: str = Field(sa_column=Column(String, nullable=False))
    code: Optional[str] = Field(default=None, sa_column=Column(String, index=True))
    contactPerson: Optional[str] = Field(default=None)
    phone: str = Field(sa_column=Column(String, nullable=False))
    email: Optional[str] = Field(default=None)

    # Address
    addressLine1: str = Field(sa_column=Column(String, nullable=False))
    addressLine2: Optional[str] = Field(default=None)
    city: str = Field(sa_column=Column(String, nullable=False, index=True))
    state: str = Field(sa_column=Column(String, nullable=False))
    pincode: str = Field(sa_column=Column(String, nullable=False))
    country: str = Field(default="India")

    # GST
    gstNumber: Optional[str] = Field(default=None, sa_column=Column(String))

    # Stats
    totalLRs: int = Field(default=0)
    totalFreight: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )

    # Multi-tenancy
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Active flag
    isActive: bool = Field(default=True)


class LorryReceipt(BaseModel, table=True):
    """
    Lorry Receipt (LR) model - Main freight shipment document.
    Multi-tenant via companyId.
    """
    __tablename__ = "LorryReceipt"

    # LR identity
    lrNumber: str = Field(sa_column=Column(String, unique=True, nullable=False, index=True))
    bookingDate: datetime = Field(default_factory=datetime.utcnow)

    # Consignee (destination)
    consigneeId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("B2BConsignee.id"), index=True)
    )
    consigneeName: str = Field(sa_column=Column(String, nullable=False))
    consigneeAddress: Optional[str] = Field(default=None, sa_column=Column(Text))
    consigneePhone: Optional[str] = Field(default=None)
    destination: str = Field(sa_column=Column(String, nullable=False, index=True))

    # Origin (pickup)
    origin: str = Field(sa_column=Column(String, nullable=False, index=True))
    originAddress: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Status
    status: LRStatus = Field(
        default=LRStatus.BOOKED,
        sa_column=Column(String, default="BOOKED", index=True)
    )

    # Vehicle details
    vehicleNumber: Optional[str] = Field(default=None, sa_column=Column(String, index=True))
    vehicleType: VehicleType = Field(
        default=VehicleType.TRUCK,
        sa_column=Column(String, default="TRUCK")
    )
    driverName: Optional[str] = Field(default=None)
    driverPhone: Optional[str] = Field(default=None)
    driverLicense: Optional[str] = Field(default=None)

    # Cargo summary
    totalPackages: int = Field(default=0)
    totalWeight: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(12, 3), default=0)
    )
    totalVolume: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(12, 3))
    )
    cargoDescription: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Cargo items stored as JSON
    cargoItems: Optional[list] = Field(
        default=None,
        sa_column=Column(JSON)
    )

    # Freight & Payment
    freightAmount: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), nullable=False)
    )
    advanceAmount: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )
    balanceAmount: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )
    paymentMode: FreightPaymentMode = Field(
        default=FreightPaymentMode.TO_PAY,
        sa_column=Column(String, default="TO_PAY")
    )
    isPaid: bool = Field(default=False)

    # Dates
    dispatchDate: Optional[datetime] = Field(default=None)
    expectedDeliveryDate: Optional[datetime] = Field(default=None)
    deliveredDate: Optional[datetime] = Field(default=None)

    # POD (Proof of Delivery)
    podImage: Optional[str] = Field(default=None)
    podSignature: Optional[str] = Field(default=None)
    podReceivedBy: Optional[str] = Field(default=None)
    podRemarks: Optional[str] = Field(default=None)
    podDate: Optional[datetime] = Field(default=None)

    # E-way bill
    ewayBillNumber: Optional[str] = Field(default=None)
    ewayBillDate: Optional[datetime] = Field(default=None)
    ewayBillExpiry: Optional[datetime] = Field(default=None)

    # Invoice reference
    invoiceNumber: Optional[str] = Field(default=None)
    invoiceValue: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(14, 2))
    )

    # Remarks
    remarks: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Multi-tenancy
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Booking reference (if created from booking)
    bookingId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), index=True)
    )


class B2BBooking(BaseModel, table=True):
    """
    B2B Booking model - Initial booking request before LR generation.
    Multi-tenant via companyId.
    """
    __tablename__ = "B2BBooking"

    # Booking identity
    bookingNumber: str = Field(sa_column=Column(String, unique=True, nullable=False, index=True))
    bookingType: BookingType = Field(sa_column=Column(String, nullable=False))

    # Status
    status: BookingStatus = Field(
        default=BookingStatus.PENDING,
        sa_column=Column(String, default="PENDING", index=True)
    )

    # Origin
    origin: str = Field(sa_column=Column(String, nullable=False))
    originAddress: Optional[str] = Field(default=None)
    originPincode: Optional[str] = Field(default=None)

    # Destination
    destination: str = Field(sa_column=Column(String, nullable=False))
    destinationAddress: Optional[str] = Field(default=None)
    destinationPincode: Optional[str] = Field(default=None)

    # Consignee
    consigneeName: str = Field(sa_column=Column(String, nullable=False))
    consigneePhone: Optional[str] = Field(default=None)
    consigneeId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("B2BConsignee.id"))
    )

    # Cargo
    packages: int = Field(default=1)
    weight: Decimal = Field(sa_column=Column(NUMERIC(12, 3), nullable=False))
    productType: ProductType = Field(
        default=ProductType.GENERAL,
        sa_column=Column(String, default="GENERAL")
    )

    # Schedule
    pickupDate: Optional[datetime] = Field(default=None)
    requestedDeliveryDate: Optional[datetime] = Field(default=None)

    # Remarks
    remarks: Optional[str] = Field(default=None)

    # Quote/Rate
    quotedRate: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(14, 2))
    )

    # Generated LR
    lrId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("LorryReceipt.id"))
    )

    # Multi-tenancy
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )


# ============================================================================
# Request/Response Schemas
# ============================================================================

# Consignee Schemas
class B2BConsigneeCreate(CreateBase):
    """Schema for creating a consignee"""
    name: str
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    phone: str
    email: Optional[str] = None
    addressLine1: str
    addressLine2: Optional[str] = None
    city: str
    state: str
    pincode: str
    gstNumber: Optional[str] = None


class B2BConsigneeUpdate(UpdateBase):
    """Schema for updating a consignee"""
    name: Optional[str] = None
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    addressLine1: Optional[str] = None
    addressLine2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gstNumber: Optional[str] = None
    isActive: Optional[bool] = None


class B2BConsigneeResponse(ResponseBase):
    """Schema for consignee API responses"""
    id: UUID
    name: str
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    phone: str
    email: Optional[str] = None
    addressLine1: str
    addressLine2: Optional[str] = None
    city: str
    state: str
    pincode: str
    gstNumber: Optional[str] = None
    totalLRs: int
    totalFreight: Decimal
    isActive: bool
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


# LR Schemas
class CargoItemSchema(SQLModel):
    """Schema for cargo item within LR"""
    description: str
    packages: int = 1
    weight: Decimal = Decimal("0")
    rate: Decimal = Decimal("0")
    amount: Optional[Decimal] = None


class LorryReceiptCreate(CreateBase):
    """Schema for creating a Lorry Receipt"""
    consigneeId: Optional[UUID] = None
    consigneeName: str
    consigneeAddress: Optional[str] = None
    consigneePhone: Optional[str] = None
    destination: str
    origin: str
    originAddress: Optional[str] = None
    vehicleNumber: Optional[str] = None
    vehicleType: VehicleType = VehicleType.TRUCK
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    cargoItems: Optional[List[CargoItemSchema]] = None
    totalPackages: int = 0
    totalWeight: Decimal = Decimal("0")
    freightAmount: Decimal = Decimal("0")
    advanceAmount: Decimal = Decimal("0")
    paymentMode: FreightPaymentMode = FreightPaymentMode.TO_PAY
    remarks: Optional[str] = None
    ewayBillNumber: Optional[str] = None
    invoiceNumber: Optional[str] = None
    invoiceValue: Optional[Decimal] = None
    pickupDate: Optional[datetime] = None


class LorryReceiptUpdate(UpdateBase):
    """Schema for updating a Lorry Receipt"""
    status: Optional[LRStatus] = None
    vehicleNumber: Optional[str] = None
    vehicleType: Optional[VehicleType] = None
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    driverLicense: Optional[str] = None
    totalPackages: Optional[int] = None
    totalWeight: Optional[Decimal] = None
    freightAmount: Optional[Decimal] = None
    advanceAmount: Optional[Decimal] = None
    paymentMode: Optional[FreightPaymentMode] = None
    isPaid: Optional[bool] = None
    dispatchDate: Optional[datetime] = None
    expectedDeliveryDate: Optional[datetime] = None
    deliveredDate: Optional[datetime] = None
    podImage: Optional[str] = None
    podSignature: Optional[str] = None
    podReceivedBy: Optional[str] = None
    podRemarks: Optional[str] = None
    ewayBillNumber: Optional[str] = None
    ewayBillDate: Optional[datetime] = None
    remarks: Optional[str] = None


class LorryReceiptResponse(ResponseBase):
    """Schema for LR API responses"""
    id: UUID
    lrNumber: str
    bookingDate: datetime
    consigneeId: Optional[UUID] = None
    consigneeName: str
    consigneeAddress: Optional[str] = None
    consigneePhone: Optional[str] = None
    destination: str
    origin: str
    originAddress: Optional[str] = None
    status: LRStatus
    vehicleNumber: Optional[str] = None
    vehicleType: VehicleType
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    totalPackages: int
    totalWeight: Decimal
    cargoItems: Optional[list] = None
    freightAmount: Decimal
    advanceAmount: Decimal
    balanceAmount: Decimal
    paymentMode: FreightPaymentMode
    isPaid: bool
    dispatchDate: Optional[datetime] = None
    expectedDeliveryDate: Optional[datetime] = None
    deliveredDate: Optional[datetime] = None
    podImage: Optional[str] = None
    podReceivedBy: Optional[str] = None
    podRemarks: Optional[str] = None
    podDate: Optional[datetime] = None
    ewayBillNumber: Optional[str] = None
    invoiceNumber: Optional[str] = None
    invoiceValue: Optional[Decimal] = None
    remarks: Optional[str] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class LorryReceiptBrief(ResponseBase):
    """Brief LR info for lists"""
    id: UUID
    lrNumber: str
    bookingDate: datetime
    consigneeName: str
    destination: str
    origin: str
    status: LRStatus
    vehicleNumber: Optional[str] = None
    totalPackages: int
    totalWeight: Decimal
    freightAmount: Decimal
    createdAt: datetime


# Booking Schemas
class B2BBookingCreate(CreateBase):
    """Schema for creating a booking"""
    bookingType: BookingType = BookingType.LTL
    origin: str
    originAddress: Optional[str] = None
    originPincode: Optional[str] = None
    destination: str
    destinationAddress: Optional[str] = None
    destinationPincode: Optional[str] = None
    consigneeName: str
    consigneePhone: Optional[str] = None
    consigneeId: Optional[UUID] = None
    packages: int = 1
    weight: Decimal
    productType: ProductType = ProductType.GENERAL
    pickupDate: Optional[datetime] = None
    requestedDeliveryDate: Optional[datetime] = None
    remarks: Optional[str] = None


class B2BBookingUpdate(UpdateBase):
    """Schema for updating a booking"""
    status: Optional[BookingStatus] = None
    quotedRate: Optional[Decimal] = None
    lrId: Optional[UUID] = None


class B2BBookingResponse(ResponseBase):
    """Schema for booking API responses"""
    id: UUID
    bookingNumber: str
    bookingType: BookingType
    status: BookingStatus
    origin: str
    originAddress: Optional[str] = None
    destination: str
    destinationAddress: Optional[str] = None
    consigneeName: str
    consigneePhone: Optional[str] = None
    packages: int
    weight: Decimal
    productType: ProductType
    pickupDate: Optional[datetime] = None
    quotedRate: Optional[Decimal] = None
    lrId: Optional[UUID] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


# Stats Schema
class B2BLogisticsStats(SQLModel):
    """B2B Logistics statistics"""
    activeLRs: int = 0
    inTransitVehicles: int = 0
    deliveredToday: int = 0
    podPending: int = 0
    freightDues: Decimal = Decimal("0")
    totalConsignees: int = 0
    totalBookings: int = 0
    pendingBookings: int = 0
