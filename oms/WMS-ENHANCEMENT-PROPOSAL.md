# WMS Enhancement Proposal - CJDQuick OMS

## Executive Summary

This document provides a comprehensive analysis of the current WMS implementation in CJDQuick OMS, compares it with industry best practices, identifies gaps, and proposes a complete WMS structure for implementation.

---

## Part 1: Current State Analysis

### What's Currently Implemented

| Module | Frontend | Backend | Status |
|--------|----------|---------|--------|
| Wave Picking | ✅ Full | ✅ Complete | **Live** |
| Picklists | ✅ Full | ✅ Complete | **Live** |
| Packing Station | ✅ Full | ✅ Complete | **Live** |
| Manifests | ✅ Full | ✅ Complete | **Live** |
| Delivery & Shipping | ✅ Full | ✅ Complete | **Live** |
| Gate Pass | ✅ Full | ✅ Complete | **Live** |
| QC Templates | ✅ Full | ✅ Complete | **Live** |
| Basic Inventory | ⚠️ Limited | ✅ API only | Partial |
| Basic Inbound | ⚠️ Limited | ✅ API only | Partial |
| Cycle Counts | ❌ None | ⚠️ Basic | Not functional |
| Stock Adjustments | ❌ None | ⚠️ Basic | Not functional |

### Current Workflow Coverage

```
✅ ORDER FULFILLMENT (Well Implemented)
   Order → Wave → Picklist → Pick → Pack → Manifest → Ship → Deliver

⚠️ INBOUND (Partially Implemented)
   PO Created → Items Added → (no ASN) → (no dock scheduling) → Basic QC → (limited putaway)

❌ INVENTORY MANAGEMENT (Minimal)
   Basic stock view → (no slotting) → (no replenishment) → (no bin optimization)
```

---

## Part 2: Industry Standard WMS Modules

Based on industry best practices from SAP EWM, Manhattan Associates, Infor WMS, and other leading systems:

### 1. INBOUND / GOODS RECEIPT (MIGO)

| Function | Description | Current State |
|----------|-------------|---------------|
| **ASN Management** | Advance Shipping Notice from suppliers | ❌ Missing |
| **Dock Scheduling** | Appointment slots for inbound trucks | ❌ Missing |
| **Receiving** | Unload, verify, count against PO/ASN | ⚠️ Basic |
| **Goods Receipt (GR)** | Formal receipt posting (SAP 101 movement) | ❌ Missing |
| **Blind Receiving** | Receive without PO for verification | ❌ Missing |
| **Cross-Docking** | Direct to outbound without storage | ❌ Missing |
| **Quality Inspection** | Inspect samples, hold/release logic | ⚠️ Basic |
| **Putaway** | Move to storage with directed logic | ❌ Missing |
| **GRN Generation** | Goods Receipt Note with serial tracking | ❌ Missing |

### 2. OUTBOUND / GOODS ISSUE (GIGO)

| Function | Description | Current State |
|----------|-------------|---------------|
| **Order Allocation** | Reserve inventory for orders | ⚠️ Basic |
| **Wave Planning** | Group orders by criteria | ✅ Good |
| **Pick Release** | Release picks to floor | ✅ Good |
| **Picking Methods** | Discrete, batch, zone, cluster | ⚠️ Basic |
| **Pick Confirmation** | Scan-based verification | ⚠️ Basic |
| **Goods Issue (GI)** | Formal issue posting (SAP 261 movement) | ❌ Missing |
| **Short Pick Handling** | Handle stock-outs during pick | ❌ Missing |
| **Packing** | Pack with materials tracking | ✅ Good |
| **Shipping** | Carrier integration, documentation | ✅ Good |

### 3. INVENTORY MANAGEMENT

| Function | Description | Current State |
|----------|-------------|---------------|
| **Bin/Location Master** | Define storage locations | ⚠️ Basic |
| **Zone Management** | Organize warehouse into zones | ❌ Missing |
| **Slotting** | Optimal product placement | ❌ Missing |
| **ABC Analysis** | Classify by velocity/value | ❌ Missing |
| **Stock Status** | Available, reserved, blocked, QC hold | ⚠️ Basic |
| **Batch/Lot Tracking** | Track by batch with expiry | ⚠️ Basic |
| **Serial Number Tracking** | Track individual items | ⚠️ Basic |
| **FIFO/FEFO Enforcement** | Pick oldest/expiring first | ⚠️ Basic |
| **Inventory Valuation** | Cost tracking methods | ❌ Missing |

### 4. STOCK MOVEMENTS

| Function | Description | Current State |
|----------|-------------|---------------|
| **Stock Transfer** | Move between locations | ⚠️ Basic API |
| **Bin-to-Bin Transfer** | Move within warehouse | ❌ Missing |
| **Inter-Warehouse Transfer** | Move between warehouses | ❌ Missing |
| **Stock Adjustment** | Add/remove with reasons | ⚠️ Basic API |
| **Cycle Counting** | Regular inventory audits | ⚠️ Basic API |
| **Physical Inventory** | Full warehouse count | ❌ Missing |
| **Movement History** | Audit trail of all movements | ⚠️ Basic |
| **Scrapping** | Write-off damaged goods | ❌ Missing |

### 5. REPLENISHMENT

| Function | Description | Current State |
|----------|-------------|---------------|
| **Min/Max Levels** | Define reorder points | ❌ Missing |
| **Replenishment Rules** | Trigger criteria | ❌ Missing |
| **Pick Face Replenishment** | Keep pick locations stocked | ❌ Missing |
| **Demand-Based Replenishment** | Based on pending orders | ❌ Missing |
| **Replenishment Tasks** | Assigned to operators | ❌ Missing |

### 6. WAREHOUSE LAYOUT & CONFIGURATION

| Function | Description | Current State |
|----------|-------------|---------------|
| **Warehouse Structure** | Sites > Warehouses > Zones > Aisles > Racks > Bins | ⚠️ Basic |
| **Bin Types** | Picking, bulk, reserve, staging, QC hold | ❌ Missing |
| **Storage Types** | Ambient, cold, frozen, hazmat | ❌ Missing |
| **Bin Capacity** | Volume, weight, unit limits | ❌ Missing |
| **Bin Restrictions** | Product compatibility rules | ❌ Missing |
| **Pick Paths** | Optimized routes through warehouse | ❌ Missing |

### 7. RETURNS / REVERSE LOGISTICS

| Function | Description | Current State |
|----------|-------------|---------------|
| **Return Authorization** | RMA creation | ✅ Good |
| **Return Receiving** | Receive returned goods | ⚠️ Basic |
| **Return QC** | Inspect returned items | ⚠️ Basic |
| **Disposition** | Restock, refurbish, scrap, quarantine | ⚠️ Basic |
| **Restocking** | Put back to inventory | ❌ Missing |

### 8. LABOR MANAGEMENT

| Function | Description | Current State |
|----------|-------------|---------------|
| **Task Assignment** | Assign work to users | ⚠️ Basic |
| **Task Interleaving** | Combine tasks to reduce travel | ❌ Missing |
| **Performance Tracking** | Units/hour, accuracy | ❌ Missing |
| **Labor Standards** | Expected time per task | ❌ Missing |
| **Incentive Management** | Performance-based pay | ❌ Missing |

### 9. YARD MANAGEMENT

| Function | Description | Current State |
|----------|-------------|---------------|
| **Yard Locations** | Parking spots, dock doors | ❌ Missing |
| **Trailer Tracking** | Where trailers are parked | ❌ Missing |
| **Dock Door Assignment** | Which truck at which door | ❌ Missing |
| **Yard Moves** | Move trailers between spots | ❌ Missing |

---

## Part 3: Gap Analysis Summary

### Critical Gaps (High Priority)

| Gap | Impact | Effort |
|-----|--------|--------|
| **No Goods Receipt (MIGO)** | Can't formally receive inventory | Medium |
| **No Putaway Logic** | Items placed randomly | Medium |
| **No Bin Management** | No capacity planning | High |
| **No Replenishment** | Pick faces go empty | Medium |
| **No Cycle Count UI** | Can't audit inventory | Low |
| **No Stock Adjustment UI** | Can't correct errors | Low |

### Important Gaps (Medium Priority)

| Gap | Impact | Effort |
|-----|--------|--------|
| **No ASN Management** | Can't plan receiving | Medium |
| **No Dock Scheduling** | Congestion at docks | Medium |
| **No Slotting** | Inefficient picking | High |
| **No Zone Management** | Poor organization | Medium |
| **No Cross-Docking** | Everything goes to storage | Medium |

### Nice-to-Have Gaps (Lower Priority)

| Gap | Impact | Effort |
|-----|--------|--------|
| **No Labor Management** | Can't optimize workforce | High |
| **No Task Interleaving** | Wasted travel | High |
| **No Yard Management** | Manual trailer tracking | Medium |
| **No Pick Path Optimization** | Longer pick times | High |

---

## Part 4: Proposed WMS Structure

### A. Database Schema Additions

```
NEW TABLES REQUIRED:
├── warehouse_zones
│   ├── id, code, name, warehouse_id
│   ├── type (RECEIVING, BULK, PICK, STAGING, SHIPPING, QC_HOLD, RETURN)
│   └── temperature_type (AMBIENT, COLD, FROZEN)
│
├── bin_types
│   ├── id, code, name
│   ├── max_weight, max_volume, max_units
│   └── allowed_product_types
│
├── bins (enhance existing)
│   ├── + zone_id, bin_type_id
│   ├── + capacity_weight, capacity_volume, capacity_units
│   ├── + current_weight, current_volume, current_units
│   ├── + is_pick_face, is_reserve, is_staging
│   └── + pick_sequence, aisle, rack, level, position
│
├── asn (Advance Shipping Notice)
│   ├── id, asn_no, supplier_id, po_id
│   ├── expected_arrival, actual_arrival
│   ├── carrier, vehicle_no, driver_name
│   ├── status (EXPECTED, ARRIVED, RECEIVING, COMPLETED)
│   └── dock_door_id, appointment_slot
│
├── asn_items
│   ├── id, asn_id, sku_id
│   ├── expected_qty, received_qty
│   └── batch_no, expiry_date
│
├── dock_appointments
│   ├── id, dock_door_id, appointment_date
│   ├── slot_start, slot_end
│   ├── type (INBOUND, OUTBOUND)
│   ├── asn_id, manifest_id
│   └── status (SCHEDULED, CHECKED_IN, COMPLETED, CANCELLED)
│
├── dock_doors
│   ├── id, location_id, door_no
│   ├── type (INBOUND, OUTBOUND, BOTH)
│   └── is_active
│
├── goods_receipts (MIGO equivalent)
│   ├── id, gr_no, inbound_id, asn_id
│   ├── received_by_id, received_at
│   ├── movement_type (101, 102, 122)
│   ├── status (DRAFT, POSTED, REVERSED)
│   └── total_qty, total_value
│
├── goods_receipt_items
│   ├── id, gr_id, sku_id
│   ├── received_qty, accepted_qty, rejected_qty
│   ├── batch_no, serial_numbers
│   ├── target_bin_id
│   └── qc_status (PENDING, PASSED, FAILED, SKIPPED)
│
├── goods_issues (GIGO equivalent)
│   ├── id, gi_no, order_id, wave_id
│   ├── issued_by_id, issued_at
│   ├── movement_type (261, 262)
│   └── status (DRAFT, POSTED, REVERSED)
│
├── goods_issue_items
│   ├── id, gi_id, sku_id, from_bin_id
│   ├── issued_qty, batch_no
│   └── serial_numbers
│
├── putaway_tasks
│   ├── id, task_no, gr_id, gr_item_id
│   ├── sku_id, qty
│   ├── from_bin_id (staging), to_bin_id (storage)
│   ├── assigned_to_id
│   ├── status (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED)
│   └── started_at, completed_at
│
├── replenishment_rules
│   ├── id, sku_id, location_id
│   ├── pick_bin_id, reserve_bin_id
│   ├── min_qty, max_qty, reorder_qty
│   ├── trigger_type (MIN_LEVEL, DEMAND, SCHEDULED)
│   └── is_active
│
├── replenishment_tasks
│   ├── id, task_no, rule_id
│   ├── sku_id, qty
│   ├── from_bin_id (reserve), to_bin_id (pick face)
│   ├── assigned_to_id
│   ├── status, priority
│   └── triggered_by (MANUAL, AUTO, ORDER)
│
├── stock_movements (audit trail)
│   ├── id, movement_no
│   ├── movement_type (GR, GI, TRANSFER, ADJUST, SCRAP)
│   ├── reference_type, reference_id
│   ├── sku_id, batch_no
│   ├── from_bin_id, to_bin_id
│   ├── qty, direction (IN, OUT)
│   ├── reason_code
│   └── created_by_id, created_at
│
├── cycle_count_plans
│   ├── id, plan_no, location_id
│   ├── type (ABC, RANDOM, FULL, ZONE)
│   ├── frequency (DAILY, WEEKLY, MONTHLY)
│   ├── next_run_date
│   └── is_active
│
├── slotting_rules
│   ├── id, location_id
│   ├── rule_type (VELOCITY, SIZE, AFFINITY)
│   ├── criteria (JSON)
│   └── priority
│
└── pick_paths
    ├── id, location_id, path_name
    ├── zones (array), sequence
    └── is_default
```

### B. API Structure

```
/api/v1/wms/

├── /zones
│   ├── GET    /                    - List zones
│   ├── POST   /                    - Create zone
│   ├── GET    /{id}                - Get zone details
│   ├── PATCH  /{id}                - Update zone
│   └── GET    /{id}/bins           - Get bins in zone

├── /bins
│   ├── GET    /                    - List bins (filters: zone, type, available)
│   ├── POST   /                    - Create bin
│   ├── GET    /{id}                - Get bin with inventory
│   ├── PATCH  /{id}                - Update bin
│   ├── GET    /{id}/inventory      - Get bin contents
│   └── GET    /{id}/movements      - Get bin movement history

├── /asn
│   ├── GET    /                    - List ASNs
│   ├── POST   /                    - Create ASN
│   ├── GET    /{id}                - Get ASN details
│   ├── PATCH  /{id}                - Update ASN
│   ├── POST   /{id}/receive        - Start receiving
│   └── POST   /{id}/complete       - Complete receiving

├── /dock-scheduling
│   ├── GET    /doors               - List dock doors
│   ├── POST   /doors               - Create dock door
│   ├── GET    /appointments        - List appointments
│   ├── POST   /appointments        - Create appointment
│   ├── PATCH  /appointments/{id}   - Update appointment
│   └── GET    /availability        - Get available slots

├── /goods-receipt
│   ├── GET    /                    - List GRs
│   ├── POST   /                    - Create GR (MIGO 101)
│   ├── GET    /{id}                - Get GR details
│   ├── POST   /{id}/post           - Post GR
│   ├── POST   /{id}/reverse        - Reverse GR (102)
│   └── POST   /{id}/items          - Add items to GR

├── /goods-issue
│   ├── GET    /                    - List GIs
│   ├── POST   /                    - Create GI (261)
│   ├── GET    /{id}                - Get GI details
│   ├── POST   /{id}/post           - Post GI
│   └── POST   /{id}/reverse        - Reverse GI (262)

├── /putaway
│   ├── GET    /tasks               - List putaway tasks
│   ├── POST   /suggest             - Get suggested bin for item
│   ├── POST   /tasks               - Create putaway task
│   ├── PATCH  /tasks/{id}          - Update task (assign, start, complete)
│   └── POST   /tasks/{id}/confirm  - Confirm putaway with scan

├── /replenishment
│   ├── GET    /rules               - List replenishment rules
│   ├── POST   /rules               - Create rule
│   ├── PATCH  /rules/{id}          - Update rule
│   ├── GET    /tasks               - List replenishment tasks
│   ├── POST   /tasks               - Create manual replenishment
│   ├── PATCH  /tasks/{id}          - Update task
│   └── POST   /generate            - Generate tasks from rules

├── /stock-movements
│   ├── GET    /                    - List movements (audit trail)
│   ├── POST   /transfer            - Bin-to-bin transfer
│   ├── POST   /adjust              - Stock adjustment
│   └── POST   /scrap               - Scrap/write-off

├── /cycle-counts
│   ├── GET    /plans               - List count plans
│   ├── POST   /plans               - Create plan
│   ├── GET    /                    - List counts
│   ├── POST   /                    - Create count
│   ├── GET    /{id}                - Get count details
│   ├── POST   /{id}/items          - Add items to count
│   ├── PATCH  /{id}/items/{itemId} - Record count
│   ├── POST   /{id}/complete       - Complete count
│   └── POST   /{id}/approve        - Approve variances

├── /slotting
│   ├── GET    /rules               - List slotting rules
│   ├── POST   /rules               - Create rule
│   ├── POST   /analyze             - Run ABC analysis
│   ├── POST   /suggest             - Get re-slotting suggestions
│   └── POST   /execute             - Execute re-slotting

└── /cross-docking
    ├── GET    /opportunities       - List cross-dock opportunities
    ├── POST   /                    - Create cross-dock
    └── PATCH  /{id}                - Update cross-dock
```

### C. Frontend Pages Structure

```
/wms/
├── /dashboard                      - WMS operations dashboard
│
├── /receiving/                     - INBOUND / MIGO
│   ├── /asn                        - ASN list & management
│   ├── /asn/[id]                   - ASN details
│   ├── /asn/new                    - Create ASN
│   ├── /dock-schedule              - Dock appointment calendar
│   ├── /goods-receipt              - Goods receipt list
│   ├── /goods-receipt/[id]         - GR details & posting
│   └── /goods-receipt/new          - Create new GR (MIGO)
│
├── /putaway/                       - PUTAWAY MANAGEMENT
│   ├── /tasks                      - Putaway task list
│   ├── /tasks/[id]                 - Task execution with scan
│   └── /suggest                    - Bin suggestion tool
│
├── /inventory/                     - INVENTORY MANAGEMENT
│   ├── /bins                       - Bin master list
│   ├── /bins/[id]                  - Bin details & contents
│   ├── /zones                      - Zone management
│   ├── /stock                      - Stock overview by SKU
│   ├── /stock/[skuId]              - SKU inventory details
│   ├── /movements                  - Movement history
│   ├── /transfer                   - Stock transfer
│   ├── /adjustment                 - Stock adjustment (with reasons)
│   └── /scrap                      - Scrap/write-off
│
├── /replenishment/                 - REPLENISHMENT
│   ├── /rules                      - Replenishment rules
│   ├── /rules/new                  - Create rule
│   ├── /tasks                      - Replenishment tasks
│   └── /dashboard                  - Replenishment status
│
├── /cycle-count/                   - CYCLE COUNTING
│   ├── /plans                      - Count plans
│   ├── /plans/new                  - Create plan
│   ├── /active                     - Active counts
│   ├── /[id]                       - Execute count
│   ├── /[id]/review                - Review variances
│   └── /history                    - Count history
│
├── /picking/                       - OUTBOUND PICKING (existing enhanced)
│   ├── /waves                      - Wave management (existing)
│   ├── /picklist                   - Picklist execution (existing)
│   └── /short-picks                - Short pick handling (NEW)
│
├── /shipping/                      - OUTBOUND SHIPPING (existing enhanced)
│   ├── /goods-issue                - Goods issue list (NEW)
│   ├── /goods-issue/[id]           - GI details (NEW)
│   ├── /packing                    - Packing station (existing)
│   ├── /manifest                   - Manifest management (existing)
│   └── /delivery-shipping          - Delivery & AWB (existing)
│
├── /slotting/                      - SLOTTING OPTIMIZATION
│   ├── /rules                      - Slotting rules
│   ├── /abc-analysis               - ABC velocity analysis
│   ├── /suggestions                - Re-slotting suggestions
│   └── /execute                    - Execute re-slotting
│
├── /qc/                            - QUALITY CONTROL (existing)
│   ├── /templates                  - QC templates
│   └── /executions                 - QC executions
│
└── /gate-pass/                     - GATE PASS (existing)
    ├── /                           - Gate pass list
    └── /[id]                       - Gate pass details
```

---

## Part 5: Implementation Phases

### Phase 1: Foundation (Critical)
**Focus: Get basic MIGO/GIGO working + FIFO/LIFO allocation**

1. **Bin Management Enhancement**
   - Add zone support to locations
   - Add bin types and capacity
   - Add pick sequence to bins
   - UI: Zone management page
   - UI: Enhanced bin management

2. **Goods Receipt (MIGO)**
   - GR model and APIs
   - GR creation from inbound/PO
   - GR posting with inventory update
   - **Assign FIFO sequence on receipt** ← Critical for FIFO
   - UI: Goods receipt pages

3. **🔥 FIFO/LIFO/FEFO Allocation Engine** ← NEW CRITICAL ITEM
   - Inventory allocation service
   - Bin selection algorithm based on valuation method
   - FIFO: Order by fifoSequence ASC (oldest first)
   - LIFO: Order by fifoSequence DESC (newest first)
   - FEFO: Order by expiryDate ASC (expiring soonest first)
   - Reservation system (update reservedQty)
   - Integration with wave/picklist generation
   - Configuration at Company/SKU/Location level
   - UI: Valuation method settings

4. **Putaway**
   - Putaway task model
   - Bin suggestion algorithm (basic)
   - Putaway task execution
   - UI: Putaway task pages

5. **Stock Adjustment UI**
   - Wire existing APIs to frontend
   - Add reason codes
   - Approval workflow

6. **Cycle Count UI**
   - Wire existing APIs to frontend
   - Count execution with variance
   - Variance approval

### Phase 2: Optimization (Important)
**Focus: Improve efficiency**

1. **ASN Management**
   - ASN model and APIs
   - Link ASN to PO
   - ASN receiving workflow

2. **Dock Scheduling**
   - Dock door master
   - Appointment scheduling
   - Calendar view

3. **Replenishment**
   - Replenishment rules
   - Auto-generate tasks
   - Task execution

4. **Goods Issue (GIGO)**
   - GI model and APIs
   - Link GI to orders/waves
   - GI posting

5. **Movement History**
   - Comprehensive audit trail
   - Movement reports
   - Bin history

### Phase 3: Advanced (Nice-to-Have)
**Focus: Optimization & intelligence**

1. **Slotting Optimization**
   - ABC analysis
   - Slotting rules engine
   - Re-slotting suggestions

2. **Pick Path Optimization**
   - Define pick paths
   - Optimize picklist sequence

3. **Cross-Docking**
   - Identify opportunities
   - Cross-dock workflow

4. **Labor Management**
   - Task timing
   - Performance metrics
   - Task interleaving

---

## Part 6: Recommended Starting Point

Based on your current state and typical WMS implementation patterns, I recommend starting with:

### Immediate Actions (Week 1-2)

1. **Stock Adjustment UI** - Low effort, high value
   - Backend API exists
   - Just need frontend page
   - Enables inventory corrections

2. **Cycle Count UI** - Low effort, high value
   - Backend API exists
   - Just need frontend page
   - Enables inventory audits

3. **Bin Enhancement** - Medium effort, foundation
   - Add zone_id, bin_type, capacity fields
   - Required for all future work

### Short Term (Week 3-6)

4. **Goods Receipt (MIGO)** - High value
   - Core receiving workflow
   - Proper inventory posting
   - Foundation for putaway
   - **FIFO sequence assignment on receipt**

5. **🔥 FIFO/LIFO/FEFO Allocation Engine** - CRITICAL
   - Must be implemented alongside Goods Receipt
   - Powers intelligent picklist generation
   - Ensures inventory accuracy and compliance

6. **Putaway Tasks** - High value
   - Directed putaway
   - Proper bin assignment

### Medium Term (Week 7-12)

7. **ASN & Dock Scheduling** - Important
8. **Replenishment** - Important
9. **Goods Issue (GIGO)** - Important

---

## Part 7: FIFO/LIFO/FEFO Allocation Engine - Detailed Specification

This is a **CRITICAL** component that must be implemented in Phase 1 to ensure proper inventory management.

### 7.1 Overview

| Method | Description | Use Case | Order By |
|--------|-------------|----------|----------|
| **FIFO** | First In, First Out | General goods, cost accounting | `fifoSequence ASC` |
| **LIFO** | Last In, First Out | Non-perishables, tax optimization | `fifoSequence DESC` |
| **FEFO** | First Expire, First Out | Perishables, pharma, food | `expiryDate ASC` |
| **WAC** | Weighted Average Cost | Financial valuation only | N/A (no pick logic) |

### 7.2 Database Changes Required

```sql
-- 1. Ensure indexes exist for efficient queries
CREATE INDEX idx_inventory_fifo
ON inventory(sku_id, location_id, fifo_sequence ASC)
WHERE quantity > reserved_qty;

CREATE INDEX idx_inventory_fefo
ON inventory(sku_id, location_id, expiry_date ASC)
WHERE quantity > reserved_qty;

CREATE INDEX idx_inventory_lifo
ON inventory(sku_id, location_id, fifo_sequence DESC)
WHERE quantity > reserved_qty;

-- 2. Add valuation method to SKU master (override company default)
ALTER TABLE skus ADD COLUMN valuation_method VARCHAR(10) DEFAULT NULL;

-- 3. Add valuation method to company settings (company default)
ALTER TABLE companies ADD COLUMN default_valuation_method VARCHAR(10) DEFAULT 'FIFO';

-- 4. Add valuation method to locations (warehouse-level override)
ALTER TABLE locations ADD COLUMN valuation_method VARCHAR(10) DEFAULT NULL;

-- 5. Create inventory allocation log for audit trail
CREATE TABLE inventory_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_no VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    wave_id UUID REFERENCES waves(id),
    picklist_id UUID REFERENCES picklists(id),
    sku_id UUID NOT NULL REFERENCES skus(id),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    bin_id UUID NOT NULL REFERENCES bins(id),
    batch_no VARCHAR(100),
    allocated_qty INTEGER NOT NULL,
    valuation_method VARCHAR(10) NOT NULL,
    fifo_sequence INTEGER,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'ALLOCATED',  -- ALLOCATED, PICKED, CANCELLED
    allocated_at TIMESTAMP DEFAULT NOW(),
    allocated_by_id UUID REFERENCES users(id),
    picked_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    company_id UUID NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_allocations_order ON inventory_allocations(order_id);
CREATE INDEX idx_allocations_wave ON inventory_allocations(wave_id);
CREATE INDEX idx_allocations_status ON inventory_allocations(status);
```

### 7.3 Backend Service Implementation

```
backend/app/services/
├── inventory_allocation.py      ← NEW: Core allocation engine
├── fifo_sequence.py             ← NEW: FIFO sequence management
└── valuation_config.py          ← NEW: Valuation method resolution
```

#### Key Service: `InventoryAllocationService`

```python
# backend/app/services/inventory_allocation.py

class InventoryAllocationService:
    """
    Core service for allocating inventory using FIFO/LIFO/FEFO logic.
    Called during wave creation and picklist generation.
    """

    def get_valuation_method(self, sku_id: UUID, location_id: UUID, company_id: UUID) -> str:
        """
        Resolve valuation method with priority:
        1. SKU-level override (if set)
        2. Location-level override (if set)
        3. Company default
        """
        # Check SKU override
        sku = db.query(SKU).get(sku_id)
        if sku.valuation_method:
            return sku.valuation_method

        # Check Location override
        location = db.query(Location).get(location_id)
        if location.valuation_method:
            return location.valuation_method

        # Company default
        company = db.query(Company).get(company_id)
        return company.default_valuation_method or "FIFO"

    def allocate_inventory(
        self,
        sku_id: UUID,
        required_qty: int,
        location_id: UUID,
        company_id: UUID,
        order_id: UUID = None,
        wave_id: UUID = None,
        exclude_bins: List[UUID] = None
    ) -> List[InventoryAllocation]:
        """
        Allocate inventory for a SKU using appropriate valuation method.
        Returns list of allocations from potentially multiple bins/batches.
        """
        valuation_method = self.get_valuation_method(sku_id, location_id, company_id)

        # Build base query for available inventory
        query = select(Inventory).where(
            Inventory.skuId == sku_id,
            Inventory.locationId == location_id,
            Inventory.quantity > Inventory.reservedQty
        )

        # Exclude specific bins if requested
        if exclude_bins:
            query = query.where(Inventory.binId.notin_(exclude_bins))

        # Apply ordering based on valuation method
        if valuation_method == "FIFO":
            query = query.order_by(Inventory.fifoSequence.asc().nullslast())
        elif valuation_method == "LIFO":
            query = query.order_by(Inventory.fifoSequence.desc().nullsfirst())
        elif valuation_method == "FEFO":
            query = query.order_by(Inventory.expiryDate.asc().nullslast())

        inventory_records = db.execute(query).scalars().all()

        # Allocate from bins until quantity fulfilled
        allocations = []
        remaining_qty = required_qty

        for inv in inventory_records:
            if remaining_qty <= 0:
                break

            available = inv.quantity - inv.reservedQty
            if available <= 0:
                continue

            allocate_qty = min(available, remaining_qty)

            # Create allocation record
            allocation = InventoryAllocation(
                orderId=order_id,
                waveId=wave_id,
                skuId=sku_id,
                inventoryId=inv.id,
                binId=inv.binId,
                batchNo=inv.batchNo,
                allocatedQty=allocate_qty,
                valuationMethod=valuation_method,
                fifoSequence=inv.fifoSequence,
                expiryDate=inv.expiryDate,
                companyId=company_id
            )
            allocations.append(allocation)

            # Reserve the inventory
            inv.reservedQty += allocate_qty
            remaining_qty -= allocate_qty

        # Check if fully allocated
        if remaining_qty > 0:
            raise InsufficientInventoryError(
                f"Cannot allocate {required_qty} units of SKU {sku_id}. "
                f"Only {required_qty - remaining_qty} available."
            )

        # Save allocations
        db.add_all(allocations)
        db.commit()

        return allocations

    def deallocate(self, allocation_id: UUID):
        """Release allocation and restore reserved quantity."""
        allocation = db.query(InventoryAllocation).get(allocation_id)
        if allocation.status == "ALLOCATED":
            inventory = db.query(Inventory).get(allocation.inventoryId)
            inventory.reservedQty -= allocation.allocatedQty
            allocation.status = "CANCELLED"
            allocation.cancelledAt = datetime.utcnow()
            db.commit()

    def confirm_pick(self, allocation_id: UUID, picked_qty: int):
        """Confirm pick and reduce actual inventory."""
        allocation = db.query(InventoryAllocation).get(allocation_id)
        inventory = db.query(Inventory).get(allocation.inventoryId)

        # Reduce reserved and actual quantity
        inventory.reservedQty -= allocation.allocatedQty
        inventory.quantity -= picked_qty

        allocation.status = "PICKED"
        allocation.pickedAt = datetime.utcnow()
        db.commit()
```

### 7.4 FIFO Sequence Assignment (On Goods Receipt)

```python
# backend/app/services/fifo_sequence.py

class FifoSequenceService:
    """Manages FIFO sequence numbers for inventory."""

    def assign_sequence(self, inventory: Inventory) -> int:
        """
        Assign next FIFO sequence number for new inventory.
        Called when goods are received (MIGO).
        """
        # Get max sequence for this SKU at this location
        max_seq = db.query(func.max(Inventory.fifoSequence)).filter(
            Inventory.skuId == inventory.skuId,
            Inventory.locationId == inventory.locationId
        ).scalar() or 0

        inventory.fifoSequence = max_seq + 1
        return inventory.fifoSequence

    def reassign_sequences(self, sku_id: UUID, location_id: UUID):
        """
        Reassign sequences based on receipt date.
        Used for data migration or correction.
        """
        inventories = db.query(Inventory).filter(
            Inventory.skuId == sku_id,
            Inventory.locationId == location_id
        ).order_by(Inventory.createdAt.asc()).all()

        for seq, inv in enumerate(inventories, start=1):
            inv.fifoSequence = seq

        db.commit()
```

### 7.5 Integration with Wave/Picklist Generation

```python
# backend/app/api/v1/waves/__init__.py (enhanced)

@router.post("/{wave_id}/generate-picklist")
async def generate_picklist(
    wave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate picklist from wave with FIFO/LIFO/FEFO allocation.
    """
    wave = db.query(Wave).get(wave_id)
    allocation_service = InventoryAllocationService()

    picklist = Picklist(
        waveId=wave_id,
        locationId=wave.locationId,
        status="PENDING"
    )
    db.add(picklist)

    # For each order in wave
    for wave_order in wave.orders:
        order = wave_order.order

        # For each item in order
        for item in order.items:
            # Allocate inventory using FIFO/LIFO/FEFO
            allocations = allocation_service.allocate_inventory(
                sku_id=item.skuId,
                required_qty=item.quantity,
                location_id=wave.locationId,
                company_id=wave.companyId,
                order_id=order.id,
                wave_id=wave_id
            )

            # Create picklist items from allocations
            for alloc in allocations:
                picklist_item = PicklistItem(
                    picklistId=picklist.id,
                    skuId=alloc.skuId,
                    binId=alloc.binId,           # ← Selected by FIFO/LIFO/FEFO!
                    batchNo=alloc.batchNo,       # ← Correct batch!
                    requiredQty=alloc.allocatedQty,
                    allocationId=alloc.id
                )
                db.add(picklist_item)

    db.commit()
    return picklist
```

### 7.6 API Endpoints

```
/api/v1/wms/allocation/

├── POST   /allocate                - Manual allocation for order/SKU
├── POST   /deallocate/{id}         - Release allocation
├── GET    /order/{orderId}         - Get allocations for order
├── GET    /wave/{waveId}           - Get allocations for wave
├── GET    /sku/{skuId}             - Get allocations for SKU
└── POST   /confirm-pick/{id}       - Confirm pick completion

/api/v1/settings/valuation/

├── GET    /company                 - Get company default
├── PATCH  /company                 - Update company default
├── GET    /sku/{skuId}             - Get SKU override
├── PATCH  /sku/{skuId}             - Set SKU override
├── GET    /location/{locationId}   - Get location override
└── PATCH  /location/{locationId}   - Set location override
```

### 7.7 Frontend UI Requirements

#### Settings Page: `/settings/inventory/valuation`

```
┌─────────────────────────────────────────────────────────────────┐
│  Inventory Valuation Settings                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Company Default: [FIFO ▼]                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Location Overrides                                       │   │
│  ├──────────────────┬───────────────────┬──────────────────┤   │
│  │ Location         │ Valuation Method  │ Action           │   │
│  ├──────────────────┼───────────────────┼──────────────────┤   │
│  │ Cold Storage     │ FEFO              │ [Edit] [Remove]  │   │
│  │ Pharma Zone      │ FEFO              │ [Edit] [Remove]  │   │
│  └──────────────────┴───────────────────┴──────────────────┘   │
│  [+ Add Location Override]                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SKU Overrides                                            │   │
│  ├──────────────────┬───────────────────┬──────────────────┤   │
│  │ SKU              │ Valuation Method  │ Action           │   │
│  ├──────────────────┼───────────────────┼──────────────────┤   │
│  │ MILK-001         │ FEFO              │ [Edit] [Remove]  │   │
│  │ CHEESE-002       │ FEFO              │ [Edit] [Remove]  │   │
│  └──────────────────┴───────────────────┴──────────────────┘   │
│  [+ Add SKU Override]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Wave Creation: Show Allocation Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Wave - Allocation Preview                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Orders: 5 | Items: 12 | Units: 150                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Allocation Preview (FIFO)                                │   │
│  ├────────┬────────┬──────────┬──────────┬────────┬────────┤   │
│  │ SKU    │ Qty    │ Bin      │ Batch    │ Expiry │ Seq    │   │
│  ├────────┼────────┼──────────┼──────────┼────────┼────────┤   │
│  │ SKU001 │ 50     │ A-01-01  │ B001     │ -      │ 1      │   │
│  │ SKU001 │ 30     │ A-01-02  │ B002     │ -      │ 2      │   │
│  │ SKU002 │ 20     │ B-02-01  │ B003     │ Mar-26 │ 1      │   │
│  │ SKU003 │ 50     │ C-03-01  │ -        │ -      │ 1      │   │
│  └────────┴────────┴──────────┴──────────┴────────┴────────┘   │
│                                                                 │
│  ⚠️ 2 items will be picked from multiple bins due to split     │
│                                                                 │
│  [Cancel]                              [Generate Picklist →]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Picklist Execution: Show FIFO/Batch Info

```
┌─────────────────────────────────────────────────────────────────┐
│  Picklist: PL-2026-001 | Wave: WAVE-001                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Item 1 of 5                                      Progress: 20% │
│  ═══════════════════════════════════════░░░░░░░░░░░░░░░░░░░░░  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  SKU: SKU001 - Blue T-Shirt Large                       │   │
│  │                                                          │   │
│  │  📍 Bin: A-01-01 (Zone A, Aisle 1, Rack 1)              │   │
│  │  📦 Batch: B001                                          │   │
│  │  🔢 FIFO Seq: 1 (Oldest)                                │   │
│  │  📅 Received: 15-Jan-2026                               │   │
│  │                                                          │   │
│  │  Pick: [50] units                                        │   │
│  │                                                          │   │
│  │  [Scan Bin] [Scan Item] [Confirm Pick]                  │   │
│  │                                                          │   │
│  │  ⚠️ FIFO: This is the OLDEST batch - pick this first    │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Previous]                                           [Next →]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.8 Migration Script for Existing Data

```python
# backend/app/migrations/assign_fifo_sequences.py

def migrate_fifo_sequences():
    """
    Assign FIFO sequences to existing inventory based on created_at.
    Run once during deployment.
    """
    # Get all unique SKU + Location combinations
    sku_locations = db.query(
        Inventory.skuId,
        Inventory.locationId
    ).distinct().all()

    for sku_id, location_id in sku_locations:
        # Get all inventory for this SKU at this location, ordered by creation
        inventories = db.query(Inventory).filter(
            Inventory.skuId == sku_id,
            Inventory.locationId == location_id
        ).order_by(Inventory.createdAt.asc()).all()

        # Assign sequences
        for seq, inv in enumerate(inventories, start=1):
            inv.fifoSequence = seq

    db.commit()
    print(f"Assigned FIFO sequences to {len(sku_locations)} SKU-Location pairs")
```

### 7.9 Testing Checklist

- [ ] FIFO sequence assigned on goods receipt
- [ ] FIFO allocation selects oldest inventory first
- [ ] LIFO allocation selects newest inventory first
- [ ] FEFO allocation selects expiring soonest first
- [ ] Multi-bin allocation when single bin insufficient
- [ ] Reserved quantity updated on allocation
- [ ] Reserved quantity released on deallocation
- [ ] Actual quantity reduced on pick confirmation
- [ ] SKU-level override works
- [ ] Location-level override works
- [ ] Company default works
- [ ] Allocation audit trail captured
- [ ] Insufficient inventory error raised appropriately

---

## Decision Points for You

Before proceeding, please confirm:

1. **Scope**: Do you want all phases, or just Phase 1 for now?

2. **Bin Structure**: How detailed?
   - Simple: Location → Bins
   - Medium: Location → Zones → Bins
   - Full: Site → Warehouse → Zone → Aisle → Rack → Level → Bin

3. **Movement Types**: Do you need SAP-style movement type codes (101, 261, etc.) or simpler naming?

4. **Serialization**: Do you need serial number tracking for any products?

5. **Batch/Lot**: How important is batch tracking and FIFO/FEFO?

6. **Labor Management**: Is tracking worker performance important?

---

## Sources

- [Logimax - Warehouse Management Best Practices 2025](https://www.logimaxwms.com/blog/warehouse-management-best-practices/)
- [Hopstack - WMS Guide](https://www.hopstack.io/guides/warehouse-management-systems-wms)
- [SAP - What is a WMS](https://www.sap.com/products/scm/extended-warehouse-management/what-is-a-wms.html)
- [Deposco - WMS Transformation](https://deposco.com/blog/what-is-a-warehouse-management-system/)
- [Hopstack - Slotting Optimization](https://www.hopstack.io/blog/warehouse-slotting-optimization)
- [Think Inventory - Inbound WMS Processes](https://www.thinkinventorysolutions.com/what-are-inbound-processes-within-a-warehouse-management-system/)
- [PackageX - ASN Process Flow](https://packagex.io/blog/advanced-shipping-notice-asn-process-flow)
- [SAP MIGO Guide](https://www.learntosap.com/mmtutorialmigo.html)
- [Manhattan Associates - WMS](https://www.manh.com/solutions/supply-chain-management-software/warehouse-management/what-is-warehouse-management-system-wms)
- [Infor WMS](https://www.infor.com/solutions/scm/warehouse-management-system/what-is-wms)
