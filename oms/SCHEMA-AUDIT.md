# Schema Audit Report - CJDQuick OMS

## Executive Summary

**Audit Date:** January 16, 2026
**Source of Truth:** Supabase Production Database
**Status:** CRITICAL - Major synchronization gaps found

| Layer | Tables/Models | Status |
|-------|---------------|--------|
| Production Supabase | 70 tables | Source of Truth |
| Prisma Schema | 70 models | SYNCED |
| SQLAlchemy Models | 11 models | CRITICAL - 59 models missing |
| Pydantic Schemas | 3 schemas | CRITICAL - Incomplete |
| Local Docker | PostgreSQL 15 | OK - Version matches |

---

## 1. Production Database Analysis

### Database Configuration
- **Platform:** Supabase (PostgreSQL 15)
- **Host:** aws-1-ap-northeast-1.pooler.supabase.com
- **Extensions Enabled:**
  - `pgcrypto` - Cryptographic functions
  - `uuid-ossp` - UUID generation functions

### ID Strategy
All tables use native PostgreSQL UUID:
```sql
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

### Total Tables: 70

---

## 2. Prisma Schema Status

**Location:** `/oms/packages/database/prisma/schema.prisma`
**Status:** FULLY SYNCED with production

Verified via `prisma db pull --print` - production schema matches Prisma schema exactly.

---

## 3. SQLAlchemy Models Audit

**Location:** `/oms/backend/app/models/`
**Status:** CRITICAL - Only 11 of 70 models implemented

### Currently Implemented Models (11)

| Model | File | Notes |
|-------|------|-------|
| User | user.py | Type issues with UUID |
| Company | company.py | OK |
| Location | company.py | OK |
| Zone | company.py | OK |
| Bin | company.py | OK |
| Order | order.py | Missing 13+ fields |
| OrderItem | order.py | OK |
| Delivery | order.py | Missing 5 fields, enum gaps |
| SKU | inventory.py | Missing variant fields |
| Inventory | inventory.py | Missing 2 fields |
| Brand | brand.py | OK |

### Missing Models (59)

#### Core Business (HIGH PRIORITY)
- [ ] Customer
- [ ] CustomerGroup
- [ ] Transporter
- [ ] TransporterConfig
- [ ] Vendor
- [ ] PurchaseOrder
- [ ] POItem
- [ ] Quotation
- [ ] QuotationItem

#### NDR & Communication (HIGH PRIORITY)
- [ ] NDR
- [ ] NDROutreach
- [ ] AIActionLog
- [ ] ProactiveCommunication
- [ ] CommunicationTemplate

#### Inventory & Warehouse (HIGH PRIORITY)
- [ ] Inbound
- [ ] InboundItem
- [ ] InventoryMovement
- [ ] VirtualInventory
- [ ] StockAdjustment
- [ ] StockAdjustmentItem
- [ ] CycleCount
- [ ] CycleCountItem

#### Fulfillment (HIGH PRIORITY)
- [ ] Wave
- [ ] WaveItem
- [ ] WaveItemDistribution
- [ ] WaveOrder
- [ ] Picklist
- [ ] PicklistItem
- [ ] Manifest

#### QC System (MEDIUM PRIORITY)
- [ ] QCTemplate
- [ ] QCParameter
- [ ] QCExecution
- [ ] QCResult
- [ ] QCDefect

#### Returns (MEDIUM PRIORITY)
- [ ] Return
- [ ] ReturnItem

#### Pricing & Commerce (MEDIUM PRIORITY)
- [ ] PriceList
- [ ] PriceListItem
- [ ] PricingTier
- [ ] RateCard
- [ ] RateCardSlab
- [ ] CODReconciliation
- [ ] CODTransaction
- [ ] B2BCreditTransaction

#### SKU Variants & Bundles (MEDIUM PRIORITY)
- [ ] SKUVariant
- [ ] SKUVariantValue
- [ ] SKUBundle
- [ ] BundleItem
- [ ] SKUBrand
- [ ] VariantAttribute
- [ ] VariantAttributeValue

#### Configuration (LOW PRIORITY)
- [ ] ChannelConfig
- [ ] ServicePincode
- [ ] ShippingRule
- [ ] ShippingRuleCondition

#### Analytics & Reporting (LOW PRIORITY)
- [ ] AnalyticsSnapshot
- [ ] DemandForecast
- [ ] ScheduledReport
- [ ] ReportExecution

#### Security & Access (LOW PRIORITY)
- [ ] Session
- [ ] AuditLog
- [ ] BrandUser
- [ ] AWB
- [ ] GatePass
- [ ] GatePassItem
- [ ] Exception
- [ ] Sequence
- [ ] OrderImport

---

## 4. Field-Level Mismatches in Existing Models

### 4.1 User Model

| Issue | Current | Required |
|-------|---------|----------|
| ID Type | `String` | `UUID` (@db.Uuid) |

```python
# Current
id = Column(String, primary_key=True)

# Required
id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
```

### 4.2 Order Model

**Missing Fields (13):**
- `importId` (UUID, FK to OrderImport)
- `csvLineNumber` (Int)
- `dataSourceType` (String)
- `replacementForReturnId` (UUID, unique, FK to Return)
- `customerId` (UUID, FK to Customer)
- `paymentTermType` (PaymentTermType enum)
- `paymentTermDays` (Int)
- `creditDueDate` (DateTime)
- `poNumber` (String)
- `gstInvoiceNo` (String)
- `gstInvoiceDate` (DateTime)
- `eWayBillNo` (String)
- `irnNo` (String)

**Enum Gaps:**
```python
# Current Channel enum - MISSING B2B
class Channel(str, enum.Enum):
    AMAZON = "AMAZON"
    FLIPKART = "FLIPKART"
    # ... others
    # MISSING: B2B = "B2B"

# Current PaymentMode enum - MISSING CREDIT
class PaymentMode(str, enum.Enum):
    PREPAID = "PREPAID"
    COD = "COD"
    # MISSING: CREDIT = "CREDIT"

# Current OrderStatus enum - MISSING PROCESSING
class OrderStatus(str, enum.Enum):
    # ... others
    # MISSING: PROCESSING = "PROCESSING"
```

### 4.3 Delivery Model

**Missing Fields (5):**
- `podImage` (String)
- `podSignature` (String)
- `podRemarks` (String)
- `receivedBy` (String)
- `manifestId` (UUID, FK to Manifest)

**Enum Gaps:**
```python
# Current DeliveryStatus - MISSING NDR, RTO
class DeliveryStatus(str, enum.Enum):
    # ... others
    # MISSING: NDR = "NDR"
    # MISSING: RTO = "RTO"
```

### 4.4 Inventory Model

**Missing Fields (2):**
- `valuationMethod` (InventoryValuationMethod enum) - default FIFO
- `fifoSequence` (Int)

**Missing Enum:**
```python
class InventoryValuationMethod(str, enum.Enum):
    FIFO = "FIFO"
    LIFO = "LIFO"
    FEFO = "FEFO"
    WAC = "WAC"
```

### 4.5 SKU Model

**Missing Fields (2):**
- `isVariantParent` (Boolean, default False)
- `isVariant` (Boolean, default False)

---

## 5. Pydantic Schemas Audit

**Location:** `/oms/backend/app/schemas/`
**Status:** CRITICAL - Minimal implementation

### Currently Implemented

| File | Schemas | Purpose |
|------|---------|---------|
| auth.py | Token, TokenData, LoginRequest, UserResponse, LoginResponse | Auth only |
| common.py | PaginatedResponse, MessageResponse, ErrorResponse | Generic responses |

### Missing Schemas (All models need Create, Update, Response variants)

- [ ] OrderCreate, OrderUpdate, OrderResponse
- [ ] InventoryCreate, InventoryUpdate, InventoryResponse
- [ ] SKUCreate, SKUUpdate, SKUResponse
- [ ] DeliveryCreate, DeliveryUpdate, DeliveryResponse
- [ ] CustomerCreate, CustomerUpdate, CustomerResponse
- [ ] NDRCreate, NDRUpdate, NDRResponse
- [ ] WaveCreate, WaveUpdate, WaveResponse
- ... (59+ more model schemas)

---

## 6. Local Docker Configuration

**Status:** OK - Configuration matches production

```yaml
# docker-compose.yml
postgres:
  image: postgres:15-alpine  # Matches Supabase PostgreSQL 15
```

### Local Database
- **URL:** `postgresql://postgres:postgres@localhost:5432/oms`
- **Version:** PostgreSQL 15-alpine

### Schema Sync Method
Uses Prisma migrations which is correct:
```bash
npm run db:push:local  # Push Prisma schema to local DB
```

---

## 7. Recommended Actions

### Phase 1: Critical Fixes (Immediate)

#### 1.1 Fix ID Types in All SQLAlchemy Models
```python
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text

class BaseModel(Base):
    __abstract__ = True
    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))
```

#### 1.2 Add Missing Enums
- Add `B2B` to Channel enum
- Add `CREDIT` to PaymentMode enum
- Add `PROCESSING` to OrderStatus enum
- Add `NDR`, `RTO` to DeliveryStatus enum
- Add `InventoryValuationMethod` enum

#### 1.3 Add Missing Fields to Existing Models
- Order: Add 13 missing fields
- Delivery: Add 5 missing fields
- Inventory: Add 2 missing fields
- SKU: Add 2 missing fields

### Phase 2: Add Missing Models (Priority Order)

1. **Customer & B2B** (Week 1)
   - Customer, CustomerGroup
   - Quotation, QuotationItem
   - B2BCreditTransaction

2. **NDR & Communication** (Week 1)
   - NDR, NDROutreach
   - AIActionLog
   - CommunicationTemplate

3. **Transporter & Delivery** (Week 2)
   - Transporter, TransporterConfig
   - Manifest
   - RateCard, RateCardSlab

4. **Inventory & Warehouse** (Week 2)
   - Inbound, InboundItem
   - InventoryMovement
   - CycleCount, CycleCountItem

5. **Fulfillment** (Week 3)
   - Wave, WaveItem, WaveOrder
   - Picklist, PicklistItem
   - VirtualInventory

6. **QC System** (Week 3)
   - QCTemplate, QCParameter
   - QCExecution, QCResult, QCDefect

7. **Remaining Models** (Week 4)
   - All other models

### Phase 3: Pydantic Schemas

Create schemas for all models following this pattern:
```python
# For each model, create:
class ModelBase(BaseModel):
    """Shared fields"""

class ModelCreate(ModelBase):
    """Create request"""

class ModelUpdate(BaseModel):
    """Update request - all optional"""

class ModelResponse(ModelBase):
    """Response with ID and timestamps"""
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
```

---

## 8. Model Template for New SQLAlchemy Models

```python
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric, ARRAY, JSON, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class NewModel(Base):
    __tablename__ = "NewModel"

    # Standard ID - Native PostgreSQL UUID
    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))

    # Fields here...

    # Standard timestamps
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # ...
```

---

## 9. Verification Checklist

- [ ] All SQLAlchemy models use UUID type for IDs
- [ ] All enums match Prisma schema exactly
- [ ] All fields match Prisma schema (names, types, defaults)
- [ ] All foreign key relationships defined
- [ ] All indexes match Prisma schema
- [ ] Pydantic schemas cover all CRUD operations
- [ ] Local Docker runs with full schema
- [ ] API endpoints work with new models

---

## Appendix: Complete Table List from Production

```
1.  AIActionLog
2.  AWB
3.  AnalyticsSnapshot
4.  AuditLog
5.  B2BCreditTransaction
6.  Bin
7.  Brand
8.  BrandUser
9.  BundleItem
10. CODReconciliation
11. CODTransaction
12. ChannelConfig
13. CommunicationTemplate
14. Company
15. Customer
16. CustomerGroup
17. CycleCount
18. CycleCountItem
19. Delivery
20. DemandForecast
21. Exception
22. GatePass
23. GatePassItem
24. Inbound
25. InboundItem
26. Inventory
27. InventoryMovement
28. Location
29. Manifest
30. NDR
31. NDROutreach
32. Order
33. OrderImport
34. OrderItem
35. POItem
36. Picklist
37. PicklistItem
38. PriceList
39. PriceListItem
40. PricingTier
41. ProactiveCommunication
42. PurchaseOrder
43. QCDefect
44. QCExecution
45. QCParameter
46. QCResult
47. QCTemplate
48. Quotation
49. QuotationItem
50. RateCard
51. RateCardSlab
52. ReportExecution
53. Return
54. ReturnItem
55. SKU
56. SKUBrand
57. SKUBundle
58. SKUVariant
59. SKUVariantValue
60. ScheduledReport
61. Sequence
62. ServicePincode
63. Session
64. ShippingRule
65. ShippingRuleCondition
66. StockAdjustment
67. StockAdjustmentItem
68. Transporter
69. TransporterConfig
70. User
71. VariantAttribute
72. VariantAttributeValue
73. Vendor
74. VirtualInventory
75. Wave
76. WaveItem
77. WaveItemDistribution
78. WaveOrder
79. Zone
```

---

*Report generated by Claude Code on January 16, 2026*
