"""
Enum Definitions for SQLModel
All enums used across the OMS system
"""
from enum import Enum


# ============================================================================
# User & Access Enums
# ============================================================================

class UserRole(str, Enum):
    """User roles for access control"""
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    OPERATOR = "OPERATOR"
    PICKER = "PICKER"
    PACKER = "PACKER"
    VIEWER = "VIEWER"
    CLIENT = "CLIENT"


class BrandUserRole(str, Enum):
    """Roles for brand portal users"""
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"


# ============================================================================
# Location & Warehouse Enums
# ============================================================================

class LocationType(str, Enum):
    """Types of fulfillment locations"""
    WAREHOUSE = "WAREHOUSE"
    STORE = "STORE"
    HUB = "HUB"
    VIRTUAL = "VIRTUAL"


class ZoneType(str, Enum):
    """Types of warehouse zones"""
    SALEABLE = "SALEABLE"
    DAMAGED = "DAMAGED"
    QC = "QC"
    RETURNS = "RETURNS"
    DISPATCH = "DISPATCH"


# ============================================================================
# Order & Fulfillment Enums
# ============================================================================

class Channel(str, Enum):
    """Sales channels"""
    AMAZON = "AMAZON"
    FLIPKART = "FLIPKART"
    MYNTRA = "MYNTRA"
    AJIO = "AJIO"
    MEESHO = "MEESHO"
    NYKAA = "NYKAA"
    TATA_CLIQ = "TATA_CLIQ"
    JIOMART = "JIOMART"
    SHOPIFY = "SHOPIFY"
    WOOCOMMERCE = "WOOCOMMERCE"
    WEBSITE = "WEBSITE"
    MANUAL = "MANUAL"
    B2B = "B2B"


class OrderType(str, Enum):
    """Order types"""
    B2C = "B2C"
    B2B = "B2B"


class PaymentMode(str, Enum):
    """Payment modes"""
    PREPAID = "PREPAID"
    COD = "COD"
    CREDIT = "CREDIT"


class OrderStatus(str, Enum):
    """Order lifecycle status"""
    CREATED = "CREATED"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    ALLOCATED = "ALLOCATED"
    PARTIALLY_ALLOCATED = "PARTIALLY_ALLOCATED"
    PICKLIST_GENERATED = "PICKLIST_GENERATED"
    PICKING = "PICKING"
    PICKED = "PICKED"
    PACKING = "PACKING"
    PACKED = "PACKED"
    MANIFESTED = "MANIFESTED"
    SHIPPED = "SHIPPED"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    RTO_INITIATED = "RTO_INITIATED"
    RTO_IN_TRANSIT = "RTO_IN_TRANSIT"
    RTO_DELIVERED = "RTO_DELIVERED"
    CANCELLED = "CANCELLED"
    ON_HOLD = "ON_HOLD"


class ItemStatus(str, Enum):
    """Order item status"""
    PENDING = "PENDING"
    ALLOCATED = "ALLOCATED"
    PICKED = "PICKED"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"


class DeliveryStatus(str, Enum):
    """Delivery/shipment status"""
    PENDING = "PENDING"
    PACKED = "PACKED"
    MANIFESTED = "MANIFESTED"
    SHIPPED = "SHIPPED"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    NDR = "NDR"
    RTO = "RTO"
    RTO_INITIATED = "RTO_INITIATED"
    RTO_IN_TRANSIT = "RTO_IN_TRANSIT"
    RTO_DELIVERED = "RTO_DELIVERED"
    CANCELLED = "CANCELLED"


# ============================================================================
# Inventory Enums
# ============================================================================

class InventoryValuationMethod(str, Enum):
    """Inventory valuation methods"""
    FIFO = "FIFO"
    LIFO = "LIFO"
    FEFO = "FEFO"
    WAC = "WAC"


class InboundType(str, Enum):
    """Inbound receipt types"""
    PURCHASE_ORDER = "PURCHASE_ORDER"
    RETURN = "RETURN"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"


class InboundStatus(str, Enum):
    """Inbound receipt status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ============================================================================
# Customer & B2B Enums
# ============================================================================

class CustomerType(str, Enum):
    """Customer types"""
    RETAIL = "RETAIL"
    WHOLESALE = "WHOLESALE"
    DISTRIBUTOR = "DISTRIBUTOR"
    FRANCHISE = "FRANCHISE"


class CustomerStatus(str, Enum):
    """Customer account status"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    BLOCKED = "BLOCKED"


class CreditStatus(str, Enum):
    """Credit status for B2B customers"""
    AVAILABLE = "AVAILABLE"
    EXHAUSTED = "EXHAUSTED"
    ON_HOLD = "ON_HOLD"
    OVERDUE = "OVERDUE"


class PaymentTermType(str, Enum):
    """Payment term types"""
    IMMEDIATE = "IMMEDIATE"
    NET_7 = "NET_7"
    NET_15 = "NET_15"
    NET_30 = "NET_30"
    NET_45 = "NET_45"
    NET_60 = "NET_60"
    CUSTOM = "CUSTOM"


class CreditTransactionType(str, Enum):
    """Credit transaction types"""
    CREDIT_LIMIT_SET = "CREDIT_LIMIT_SET"
    CREDIT_LIMIT_INCREASE = "CREDIT_LIMIT_INCREASE"
    CREDIT_LIMIT_DECREASE = "CREDIT_LIMIT_DECREASE"
    ORDER_PLACED = "ORDER_PLACED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    REFUND = "REFUND"


# ============================================================================
# NDR & Communication Enums
# ============================================================================

class NDRReason(str, Enum):
    """NDR (Non-Delivery Report) reasons"""
    CUSTOMER_UNAVAILABLE = "CUSTOMER_UNAVAILABLE"
    WRONG_ADDRESS = "WRONG_ADDRESS"
    INCOMPLETE_ADDRESS = "INCOMPLETE_ADDRESS"
    CUSTOMER_REFUSED = "CUSTOMER_REFUSED"
    COD_NOT_READY = "COD_NOT_READY"
    PHONE_UNREACHABLE = "PHONE_UNREACHABLE"
    DELIVERY_RESCHEDULED = "DELIVERY_RESCHEDULED"
    ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND"
    AREA_NOT_SERVICEABLE = "AREA_NOT_SERVICEABLE"
    NATURAL_DISASTER = "NATURAL_DISASTER"
    OTHER = "OTHER"


class NDRStatus(str, Enum):
    """NDR resolution status"""
    OPEN = "OPEN"
    ACTION_REQUESTED = "ACTION_REQUESTED"
    REATTEMPT_SCHEDULED = "REATTEMPT_SCHEDULED"
    RESOLVED = "RESOLVED"
    RTO = "RTO"
    CLOSED = "CLOSED"


class NDRPriority(str, Enum):
    """NDR priority levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ResolutionType(str, Enum):
    """NDR resolution types"""
    REATTEMPT = "REATTEMPT"
    ADDRESS_UPDATED = "ADDRESS_UPDATED"
    PHONE_UPDATED = "PHONE_UPDATED"
    RESCHEDULE = "RESCHEDULE"
    RTO = "RTO"
    CUSTOMER_PICKUP = "CUSTOMER_PICKUP"


class OutreachChannel(str, Enum):
    """Communication channels"""
    SMS = "SMS"
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"
    VOICE = "VOICE"
    IVR = "IVR"


class OutreachStatus(str, Enum):
    """Outreach attempt status"""
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    RESPONDED = "RESPONDED"
    FAILED = "FAILED"


class CommunicationTrigger(str, Enum):
    """Communication trigger events"""
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    ORDER_SHIPPED = "ORDER_SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    NDR_FIRST_ATTEMPT = "NDR_FIRST_ATTEMPT"
    NDR_FOLLOWUP = "NDR_FOLLOWUP"
    RTO_INITIATED = "RTO_INITIATED"


# ============================================================================
# Wave & Fulfillment Enums
# ============================================================================

class WaveType(str, Enum):
    """Wave picking types"""
    BATCH_PICK = "BATCH_PICK"
    ZONE_PICK = "ZONE_PICK"
    CLUSTER_PICK = "CLUSTER_PICK"
    PRIORITY_PICK = "PRIORITY_PICK"


class WaveStatus(str, Enum):
    """Wave picking status"""
    DRAFT = "DRAFT"
    PLANNED = "PLANNED"
    RELEASED = "RELEASED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PicklistStatus(str, Enum):
    """Picklist status"""
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ManifestStatus(str, Enum):
    """Manifest status"""
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    HANDED_OVER = "HANDED_OVER"
    CANCELLED = "CANCELLED"


# ============================================================================
# QC Enums
# ============================================================================

class QCType(str, Enum):
    """QC template types"""
    INBOUND = "INBOUND"
    RETURN = "RETURN"
    PRODUCTION = "PRODUCTION"
    CYCLE_COUNT = "CYCLE_COUNT"
    RANDOM_AUDIT = "RANDOM_AUDIT"


class QCStatus(str, Enum):
    """QC execution status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    PASSED = "PASSED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"
    CONDITIONAL = "CONDITIONAL"


class QCParameterType(str, Enum):
    """QC parameter types"""
    VISUAL = "VISUAL"
    DIMENSIONAL = "DIMENSIONAL"
    WEIGHT = "WEIGHT"
    BARCODE = "BARCODE"
    FUNCTIONAL = "FUNCTIONAL"
    DOCUMENTATION = "DOCUMENTATION"


class SeverityLevel(str, Enum):
    """Defect severity levels"""
    CRITICAL = "CRITICAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    COSMETIC = "COSMETIC"


# ============================================================================
# Return Enums
# ============================================================================

class ReturnType(str, Enum):
    """Return types"""
    CUSTOMER_RETURN = "CUSTOMER_RETURN"
    RTO = "RTO"
    EXCHANGE = "EXCHANGE"


class ReturnStatus(str, Enum):
    """Return processing status"""
    INITIATED = "INITIATED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    RECEIVED = "RECEIVED"
    QC_PENDING = "QC_PENDING"
    QC_PASSED = "QC_PASSED"
    QC_FAILED = "QC_FAILED"
    PROCESSED = "PROCESSED"
    REFUND_INITIATED = "REFUND_INITIATED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ReturnReason(str, Enum):
    """Return reasons"""
    WRONG_PRODUCT = "WRONG_PRODUCT"
    DAMAGED = "DAMAGED"
    DEFECTIVE = "DEFECTIVE"
    SIZE_ISSUE = "SIZE_ISSUE"
    COLOR_MISMATCH = "COLOR_MISMATCH"
    NOT_AS_DESCRIBED = "NOT_AS_DESCRIBED"
    CHANGED_MIND = "CHANGED_MIND"
    LATE_DELIVERY = "LATE_DELIVERY"
    OTHER = "OTHER"


# ============================================================================
# Import & Sync Enums
# ============================================================================

class ImportStatus(str, Enum):
    """Import job status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


class SyncFrequency(str, Enum):
    """Channel sync frequency"""
    REALTIME = "REALTIME"
    EVERY_5_MINS = "EVERY_5_MINS"
    EVERY_15_MINS = "EVERY_15_MINS"
    EVERY_30_MINS = "EVERY_30_MINS"
    HOURLY = "HOURLY"
    DAILY = "DAILY"
    MANUAL = "MANUAL"


# ============================================================================
# AI Action Enums
# ============================================================================

class AIActionType(str, Enum):
    """AI action types"""
    NDR_CLASSIFICATION = "NDR_CLASSIFICATION"
    NDR_RESOLUTION = "NDR_RESOLUTION"
    FRAUD_DETECTION = "FRAUD_DETECTION"
    DEMAND_FORECAST = "DEMAND_FORECAST"
    CARRIER_SELECTION = "CARRIER_SELECTION"


class AIActionStatus(str, Enum):
    """AI action status"""
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"


# ============================================================================
# Other Enums
# ============================================================================

class GatePassType(str, Enum):
    """Gate pass types"""
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"
    VISITOR = "VISITOR"
    VEHICLE = "VEHICLE"


class GatePassStatus(str, Enum):
    """Gate pass status"""
    OPEN = "OPEN"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class CycleCountStatus(str, Enum):
    """Cycle count status"""
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class CODReconciliationStatus(str, Enum):
    """COD reconciliation status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RECONCILED = "RECONCILED"
    DISPUTED = "DISPUTED"
    CLOSED = "CLOSED"


class CODTransactionType(str, Enum):
    """COD transaction types"""
    COLLECTION = "COLLECTION"
    REMITTANCE = "REMITTANCE"
    ADJUSTMENT = "ADJUSTMENT"
    REFUND = "REFUND"


class POStatus(str, Enum):
    """Purchase order status"""
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    SENT = "SENT"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class TransporterType(str, Enum):
    """Transporter/carrier types"""
    COURIER = "COURIER"
    SELF = "SELF"
    AGGREGATOR = "AGGREGATOR"
