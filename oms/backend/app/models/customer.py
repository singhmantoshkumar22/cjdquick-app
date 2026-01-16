"""
Customer Models - SQLModel Implementation
B2B Customers and Customer Groups
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Boolean, Integer, JSON, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase
from .enums import (
    CustomerType, CustomerStatus, CreditStatus, PaymentTermType
)

if TYPE_CHECKING:
    from .company import Company
    from .order import Order


# ============================================================================
# Database Models
# ============================================================================

class CustomerGroup(BaseModel, table=True):
    """
    CustomerGroup model - Grouping for B2B customers.
    Used for pricing tiers, discounts, and default payment terms.
    """
    __tablename__ = "CustomerGroup"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    description: Optional[str] = Field(default=None)

    # Discount settings
    discountPercent: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(5, 2))
    )
    discountType: Optional[str] = Field(default=None)

    # Price list reference
    priceListId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("PriceList.id"))
    )

    # Default credit settings
    defaultCreditLimit: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(14, 2))
    )
    defaultPaymentTermType: PaymentTermType = Field(
        default=PaymentTermType.NET_30,
        sa_column=Column(String, default="NET_30")
    )
    defaultPaymentTermDays: Optional[int] = Field(default=None)

    # Multi-tenant
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Status
    isActive: bool = Field(default=True)

    # Relationships
    company: Optional["Company"] = Relationship(back_populates="customerGroups")
    customers: List["Customer"] = Relationship(back_populates="customerGroup")


class Customer(BaseModel, table=True):
    """
    Customer model - B2B customers with credit management.
    Multi-tenant: belongs to a Company.
    """
    __tablename__ = "Customer"

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    type: CustomerType = Field(
        default=CustomerType.RETAIL,
        sa_column=Column(String, default="RETAIL")
    )
    status: CustomerStatus = Field(
        default=CustomerStatus.ACTIVE,
        sa_column=Column(String, default="ACTIVE", index=True)
    )

    # Contact
    contactPerson: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    phone: str = Field(sa_column=Column(String, nullable=False))
    alternatePhone: Optional[str] = Field(default=None)

    # Tax identifiers
    gst: Optional[str] = Field(default=None)
    pan: Optional[str] = Field(default=None)
    cin: Optional[str] = Field(default=None)
    tradeLicense: Optional[str] = Field(default=None)

    # Addresses
    billingAddress: dict = Field(sa_column=Column(JSON, nullable=False))
    shippingAddresses: List[dict] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(JSON), default=[])
    )

    # Credit management
    creditEnabled: bool = Field(default=False)
    creditLimit: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )
    creditUsed: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )
    creditAvailable: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(NUMERIC(14, 2), default=0)
    )
    creditStatus: CreditStatus = Field(
        default=CreditStatus.AVAILABLE,
        sa_column=Column(String, default="AVAILABLE", index=True)
    )

    # Payment terms
    paymentTermType: PaymentTermType = Field(
        default=PaymentTermType.IMMEDIATE,
        sa_column=Column(String, default="IMMEDIATE")
    )
    paymentTermDays: Optional[int] = Field(default=None)
    earlyPaymentDiscount: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(5, 2))
    )

    # Dunning settings
    dunningEnabled: bool = Field(default=True)
    dunningDays: List[int] = Field(
        default_factory=lambda: [7, 15, 30],
        sa_column=Column(ARRAY(Integer), default=[7, 15, 30])
    )
    lastDunningDate: Optional[datetime] = Field(default=None)
    dunningLevel: int = Field(default=0)

    # Customer portal
    portalEnabled: bool = Field(default=False)
    portalUserId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("User.id"))
    )

    # Foreign Keys
    customerGroupId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("CustomerGroup.id"), index=True)
    )
    priceListId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("PriceList.id"))
    )
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id"),
            nullable=False,
            index=True
        )
    )

    # Relationships
    company: Optional["Company"] = Relationship(back_populates="customers")
    customerGroup: Optional["CustomerGroup"] = Relationship(back_populates="customers")
    orders: List["Order"] = Relationship(back_populates="customer")


# ============================================================================
# Request/Response Schemas
# ============================================================================

# --- CustomerGroup Schemas ---

class CustomerGroupCreate(CreateBase):
    """Schema for creating customer group"""
    code: str
    name: str
    description: Optional[str] = None
    discountPercent: Optional[Decimal] = None
    discountType: Optional[str] = None
    priceListId: Optional[UUID] = None
    defaultCreditLimit: Optional[Decimal] = None
    defaultPaymentTermType: PaymentTermType = PaymentTermType.NET_30
    defaultPaymentTermDays: Optional[int] = None
    companyId: UUID


class CustomerGroupUpdate(UpdateBase):
    """Schema for updating customer group"""
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    discountPercent: Optional[Decimal] = None
    discountType: Optional[str] = None
    priceListId: Optional[UUID] = None
    defaultCreditLimit: Optional[Decimal] = None
    defaultPaymentTermType: Optional[PaymentTermType] = None
    defaultPaymentTermDays: Optional[int] = None
    isActive: Optional[bool] = None


class CustomerGroupResponse(ResponseBase):
    """Schema for customer group API responses"""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    discountPercent: Optional[Decimal] = None
    discountType: Optional[str] = None
    priceListId: Optional[UUID] = None
    defaultCreditLimit: Optional[Decimal] = None
    defaultPaymentTermType: PaymentTermType
    defaultPaymentTermDays: Optional[int] = None
    companyId: UUID
    isActive: bool
    createdAt: datetime
    updatedAt: datetime


class CustomerGroupBrief(ResponseBase):
    """Brief customer group info"""
    id: UUID
    code: str
    name: str
    discountPercent: Optional[Decimal] = None
    isActive: bool


# --- Customer Schemas ---

class CustomerCreate(CreateBase):
    """Schema for creating customer"""
    code: str
    name: str
    type: CustomerType = CustomerType.RETAIL
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: str
    alternatePhone: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    tradeLicense: Optional[str] = None
    billingAddress: dict
    shippingAddresses: List[dict] = []
    creditEnabled: bool = False
    creditLimit: Decimal = Decimal("0")
    paymentTermType: PaymentTermType = PaymentTermType.IMMEDIATE
    paymentTermDays: Optional[int] = None
    earlyPaymentDiscount: Optional[Decimal] = None
    dunningEnabled: bool = True
    dunningDays: List[int] = [7, 15, 30]
    customerGroupId: Optional[UUID] = None
    priceListId: Optional[UUID] = None
    companyId: UUID


class CustomerUpdate(UpdateBase):
    """Schema for updating customer"""
    code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[CustomerType] = None
    status: Optional[CustomerStatus] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    alternatePhone: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    tradeLicense: Optional[str] = None
    billingAddress: Optional[dict] = None
    shippingAddresses: Optional[List[dict]] = None
    creditEnabled: Optional[bool] = None
    creditLimit: Optional[Decimal] = None
    paymentTermType: Optional[PaymentTermType] = None
    paymentTermDays: Optional[int] = None
    earlyPaymentDiscount: Optional[Decimal] = None
    dunningEnabled: Optional[bool] = None
    dunningDays: Optional[List[int]] = None
    portalEnabled: Optional[bool] = None
    portalUserId: Optional[UUID] = None
    customerGroupId: Optional[UUID] = None
    priceListId: Optional[UUID] = None


class CustomerResponse(ResponseBase):
    """Schema for customer API responses"""
    id: UUID
    code: str
    name: str
    type: CustomerType
    status: CustomerStatus
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: str
    alternatePhone: Optional[str] = None
    gst: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    tradeLicense: Optional[str] = None
    billingAddress: dict
    shippingAddresses: List[dict] = []
    creditEnabled: bool
    creditLimit: Decimal
    creditUsed: Decimal
    creditAvailable: Decimal
    creditStatus: CreditStatus
    paymentTermType: PaymentTermType
    paymentTermDays: Optional[int] = None
    earlyPaymentDiscount: Optional[Decimal] = None
    dunningEnabled: bool
    dunningDays: List[int] = []
    lastDunningDate: Optional[datetime] = None
    dunningLevel: int
    portalEnabled: bool
    portalUserId: Optional[UUID] = None
    customerGroupId: Optional[UUID] = None
    priceListId: Optional[UUID] = None
    companyId: UUID
    createdAt: datetime
    updatedAt: datetime


class CustomerBrief(ResponseBase):
    """Brief customer info for lists"""
    id: UUID
    code: str
    name: str
    type: CustomerType
    status: CustomerStatus
    phone: str
    email: Optional[str] = None
    creditStatus: CreditStatus
    creditAvailable: Decimal


class CustomerCreditUpdate(SQLModel):
    """Schema for credit adjustments"""
    customerId: UUID
    amount: Decimal  # Positive to add credit, negative to reduce
    reason: str
    referenceType: Optional[str] = None  # ORDER, PAYMENT, ADJUSTMENT
    referenceId: Optional[UUID] = None
