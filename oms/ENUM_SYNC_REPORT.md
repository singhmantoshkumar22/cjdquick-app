# ENUM Synchronization Report

## Summary
Comprehensive comparison of Python backend enums vs PostgreSQL database enums.

**Date:** 2026-01-17

---

## CRITICAL MISMATCHES (Require Immediate Fix)

### 1. PicklistStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING | PENDING | OK |
| **ASSIGNED** | - | **MISSING IN DB** |
| **IN_PROGRESS** | - | **MISSING IN DB** |
| COMPLETED | COMPLETED | OK |
| CANCELLED | CANCELLED | OK |
| - | PROCESSING | Legacy (unused in Python) |

**Impact:** Runtime errors when assigning picklists or marking them in progress.

---

### 2. NDRStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| OPEN | OPEN | OK |
| **ACTION_REQUESTED** | - | **MISSING IN DB** |
| REATTEMPT_SCHEDULED | REATTEMPT_SCHEDULED | OK |
| RESOLVED | RESOLVED | OK |
| **RTO** | - | **MISSING IN DB** |
| CLOSED | CLOSED | OK |
| - | OUTREACH_IN_PROGRESS | Legacy |
| - | CUSTOMER_RESPONDED | Legacy |
| - | ESCALATED | Legacy |
| - | RTO_INITIATED | Legacy |
| - | CONTACTED | Legacy |

---

### 3. NDRReason
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| **CUSTOMER_UNAVAILABLE** | CUSTOMER_NOT_AVAILABLE | **NAME MISMATCH** |
| WRONG_ADDRESS | WRONG_ADDRESS | OK |
| INCOMPLETE_ADDRESS | INCOMPLETE_ADDRESS | OK |
| CUSTOMER_REFUSED | CUSTOMER_REFUSED | OK |
| COD_NOT_READY | COD_NOT_READY | OK |
| PHONE_UNREACHABLE | PHONE_UNREACHABLE | OK |
| **DELIVERY_RESCHEDULED** | - | **MISSING IN DB** |
| ADDRESS_NOT_FOUND | ADDRESS_NOT_FOUND | OK |
| **AREA_NOT_SERVICEABLE** | - | **MISSING IN DB** |
| **NATURAL_DISASTER** | - | **MISSING IN DB** |
| OTHER | OTHER | OK |
| - | FUTURE_DELIVERY_REQUESTED | Legacy |
| - | PHONE_NOT_REACHABLE | Legacy (duplicate) |
| - | PREMISES_CLOSED | Legacy |
| - | SHIPMENT_DAMAGED | Legacy |
| - | CUSTOMER_OUT_OF_STATION | Legacy |
| - | REFUSED | Legacy (duplicate) |
| - | CUSTOMER_RESCHEDULE | Legacy |

---

### 4. CycleCountStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PLANNED | PLANNED | OK |
| IN_PROGRESS | IN_PROGRESS | OK |
| COMPLETED | COMPLETED | OK |
| CANCELLED | CANCELLED | OK |
| - | VARIANCE_FOUND | Legacy (not in Python) |
| - | VERIFIED | Legacy (not in Python) |

---

### 5. ImportStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING | PENDING | OK |
| **IN_PROGRESS** | - | **MISSING IN DB** |
| COMPLETED | COMPLETED | OK |
| FAILED | FAILED | OK |
| PARTIAL | PARTIAL | OK |
| - | PROCESSING | Legacy |

---

### 6. ReturnType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| CUSTOMER_RETURN | CUSTOMER_RETURN | OK |
| RTO | RTO | OK |
| **EXCHANGE** | - | **MISSING IN DB** |
| - | VENDOR_RETURN | Legacy |

---

### 7. ManifestStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| OPEN | OPEN | OK |
| CLOSED | CLOSED | OK |
| **HANDED_OVER** | - | **MISSING IN DB** |
| **CANCELLED** | - | **MISSING IN DB** |
| - | CONFIRMED | Legacy |

---

### 8. ResolutionType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| **REATTEMPT** | - | **MISSING IN DB** |
| ADDRESS_UPDATED | ADDRESS_UPDATED | OK |
| **PHONE_UPDATED** | - | **MISSING IN DB** |
| **RESCHEDULE** | - | **MISSING IN DB** |
| **RTO** | - | **MISSING IN DB** |
| **CUSTOMER_PICKUP** | - | **MISSING IN DB** |
| - | REATTEMPT_SCHEDULED | Legacy |
| - | CUSTOMER_WILL_COLLECT | Legacy |
| - | PAYMENT_MODE_CHANGED | Legacy |
| - | REFUND_INITIATED | Legacy |
| - | RTO_INITIATED | Legacy |
| - | ORDER_CANCELLED | Legacy |
| - | DELIVERED_ON_REATTEMPT | Legacy |

---

### 9. AIActionType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| **NDR_CLASSIFICATION** | - | **MISSING IN DB** |
| **NDR_RESOLUTION** | - | **MISSING IN DB** |
| **FRAUD_DETECTION** | - | **MISSING IN DB** |
| **DEMAND_FORECAST** | - | **MISSING IN DB** |
| **CARRIER_SELECTION** | - | **MISSING IN DB** |
| - | CARRIER_SWITCH | Legacy |
| - | REATTEMPT_SCHEDULE | Legacy |
| - | ADDRESS_UPDATE | Legacy |
| - | CUSTOMER_NOTIFICATION | Legacy |
| - | (many more legacy) | Legacy |

---

### 10. AIActionStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING_APPROVAL | PENDING_APPROVAL | OK |
| APPROVED | APPROVED | OK |
| REJECTED | REJECTED | OK |
| EXECUTED | EXECUTED | OK |
| FAILED | FAILED | OK |
| - | AUTO_APPROVED | Legacy |
| - | EXPIRED | Legacy |
| - | SUCCESS | Legacy |
| - | PENDING | Legacy |
| - | SKIPPED | Legacy |

---

### 11. GatePassType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| **INBOUND** | - | **MISSING IN DB** |
| **OUTBOUND** | - | **MISSING IN DB** |
| VISITOR | VISITOR | OK |
| **VEHICLE** | - | **MISSING IN DB** |
| - | INBOUND_DELIVERY | Legacy |
| - | OUTBOUND_SHIPMENT | Legacy |
| - | VENDOR | Legacy |
| - | OTHER | Legacy |

---

### 12. GatePassStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| OPEN | OPEN | OK |
| VERIFIED | VERIFIED | OK |
| CLOSED | CLOSED | OK |
| CANCELLED | CANCELLED | OK |
| - | IN_PROGRESS | Legacy |

---

### 13. CODReconciliationStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING | PENDING | OK |
| IN_PROGRESS | IN_PROGRESS | OK |
| RECONCILED | RECONCILED | OK |
| DISPUTED | DISPUTED | OK |
| **CLOSED** | - | **MISSING IN DB** |
| - | SETTLED | Legacy |
| - | CANCELLED | Legacy |

---

### 14. InboundType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PURCHASE_ORDER | PURCHASE_ORDER | OK |
| RETURN | RETURN | OK |
| **TRANSFER** | - | **MISSING IN DB** |
| ADJUSTMENT | - | See note |
| - | ASN | Legacy |
| - | DIRECT | Legacy |
| - | STOCK_TRANSFER | Legacy |

---

### 15. InboundStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING | PENDING | OK |
| IN_PROGRESS | IN_PROGRESS | OK |
| COMPLETED | COMPLETED | OK |
| CANCELLED | CANCELLED | OK |
| - | QC_PENDING | Legacy |

---

### 16. POStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| DRAFT | DRAFT | OK |
| **PENDING** | - | **MISSING IN DB** |
| APPROVED | APPROVED | OK |
| **SENT** | - | **MISSING IN DB** |
| PARTIALLY_RECEIVED | PARTIALLY_RECEIVED | OK |
| RECEIVED | RECEIVED | OK |
| CANCELLED | CANCELLED | OK |

---

### 17. QCStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| PENDING | PENDING | OK |
| IN_PROGRESS | IN_PROGRESS | OK |
| PASSED | PASSED | OK |
| FAILED | FAILED | OK |
| **PARTIAL** | - | **MISSING IN DB** |
| CONDITIONAL | CONDITIONAL | OK |

---

### 18. OutreachChannel
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| SMS | SMS | OK |
| EMAIL | EMAIL | OK |
| WHATSAPP | WHATSAPP | OK |
| **VOICE** | - | **MISSING IN DB** |
| IVR | IVR | OK |
| - | AI_VOICE | Legacy |
| - | MANUAL_CALL | Legacy |

---

### 19. CustomerType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| RETAIL | RETAIL | OK |
| WHOLESALE | WHOLESALE | OK |
| DISTRIBUTOR | DISTRIBUTOR | OK |
| **FRANCHISE** | - | **MISSING IN DB** |
| - | DEALER | Legacy |
| - | CORPORATE | Legacy |

---

### 20. CreditStatus
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| AVAILABLE | AVAILABLE | OK |
| **EXHAUSTED** | - | **MISSING IN DB** |
| ON_HOLD | ON_HOLD | OK |
| **OVERDUE** | - | **MISSING IN DB** |
| - | EXCEEDED | Legacy |
| - | BLOCKED | Legacy |

---

### 21. CreditTransactionType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| **CREDIT_LIMIT_SET** | - | **MISSING IN DB** |
| **CREDIT_LIMIT_INCREASE** | - | **MISSING IN DB** |
| **CREDIT_LIMIT_DECREASE** | - | **MISSING IN DB** |
| **ORDER_PLACED** | - | **MISSING IN DB** |
| **ORDER_CANCELLED** | - | **MISSING IN DB** |
| **PAYMENT_RECEIVED** | - | **MISSING IN DB** |
| REFUND | REFUND | OK |
| - | ORDER_DEBIT | Legacy |
| - | PAYMENT_CREDIT | Legacy |
| - | ADJUSTMENT | Legacy |
| - | WRITE_OFF | Legacy |
| - | INTEREST_DEBIT | Legacy |
| - | PAYMENT | Legacy |
| - | ORDER | Legacy |
| - | CREDIT_NOTE | Legacy |

---

### 22. BrandUserRole
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| OWNER | OWNER | OK |
| **ADMIN** | - | **MISSING IN DB** |
| MANAGER | MANAGER | OK |
| ANALYST | ANALYST | OK |
| VIEWER | VIEWER | OK |

---

### 23. CommunicationTrigger
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| ORDER_CONFIRMED | ORDER_CONFIRMED | OK |
| ORDER_SHIPPED | ORDER_SHIPPED | OK |
| OUT_FOR_DELIVERY | OUT_FOR_DELIVERY | OK |
| DELIVERED | DELIVERED | OK |
| **NDR_FIRST_ATTEMPT** | - | **MISSING IN DB** |
| **NDR_FOLLOWUP** | - | **MISSING IN DB** |
| RTO_INITIATED | RTO_INITIATED | OK |
| - | DELAY_PREDICTED | Legacy |
| - | SLA_BREACH_RISK | Legacy |
| - | WEATHER_DISRUPTION | Legacy |
| - | CARRIER_ISSUE | Legacy |
| - | DELIVERY_ATTEMPTED | Legacy |
| - | PAYMENT_REMINDER | Legacy |
| - | FEEDBACK_REQUEST | Legacy |
| - | CUSTOM | Legacy |

---

### 24. SyncFrequency
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| REALTIME | REALTIME | OK |
| **EVERY_5_MINS** | - | **MISSING IN DB** |
| **EVERY_15_MINS** | - | **MISSING IN DB** |
| **EVERY_30_MINS** | - | **MISSING IN DB** |
| HOURLY | HOURLY | OK |
| DAILY | DAILY | OK |
| **MANUAL** | - | **MISSING IN DB** |
| - | WEEKLY | Legacy |

---

### 25. PaymentTermType
| Python (Backend) | PostgreSQL (DB) | Status |
|------------------|-----------------|--------|
| IMMEDIATE | IMMEDIATE | OK |
| NET_7 | NET_7 | OK |
| NET_15 | NET_15 | OK |
| NET_30 | NET_30 | OK |
| NET_45 | NET_45 | OK |
| NET_60 | NET_60 | OK |
| CUSTOM | CUSTOM | OK |
| - | NET_90 | Legacy (extra in DB) |

---

## ENUMS THAT MATCH (No Action Needed)

The following enums are perfectly synchronized:
- UserRole
- LocationType
- ZoneType
- Channel
- OrderType
- PaymentMode
- OrderStatus
- ItemStatus
- DeliveryStatus
- InventoryValuationMethod
- NDRPriority
- WaveType
- WaveStatus
- QCType
- QCParameterType
- TransporterType

---

## Missing Enums in Database

The following Python enums have no corresponding PostgreSQL enum type:
- **SeverityLevel** (CRITICAL, MAJOR, MINOR, COSMETIC)
- **ReturnReason** (WRONG_PRODUCT, DAMAGED, DEFECTIVE, SIZE_ISSUE, COLOR_MISMATCH, NOT_AS_DESCRIBED, CHANGED_MIND, LATE_DELIVERY, OTHER)

---

Generated: 2026-01-17
