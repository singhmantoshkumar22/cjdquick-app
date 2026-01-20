"""WMS Phase 1 Enhancements

Revision ID: 002_wms_phase1
Revises: 001_add_return_status
Create Date: 2026-01-20

This migration adds:
1. Enhanced Zone model with temperature and priority fields
2. Enhanced Bin model with capacity, location fields, and flags
3. Valuation fields to Company, SKU, Location, Inventory
4. New GoodsReceipt and GoodsReceiptItem tables
5. New InventoryAllocation table for FIFO/LIFO/FEFO tracking
6. New PutawayTask table for putaway operations
7. Enhanced StockAdjustment with approval workflow fields
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_wms_phase1'
down_revision: Union[str, None] = '001_add_return_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply WMS Phase 1 schema changes"""

    # =========================================================================
    # 1. ZONE ENHANCEMENTS
    # =========================================================================
    # Add temperature and priority fields to Zone table
    op.execute("""
        DO $$
        BEGIN
            -- Temperature type
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Zone' AND column_name = 'temperatureType'
            ) THEN
                ALTER TABLE "Zone" ADD COLUMN "temperatureType" VARCHAR;
            END IF;

            -- Min temperature
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Zone' AND column_name = 'minTemp'
            ) THEN
                ALTER TABLE "Zone" ADD COLUMN "minTemp" NUMERIC(10, 2);
            END IF;

            -- Max temperature
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Zone' AND column_name = 'maxTemp'
            ) THEN
                ALTER TABLE "Zone" ADD COLUMN "maxTemp" NUMERIC(10, 2);
            END IF;

            -- Priority for putaway
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Zone' AND column_name = 'priority'
            ) THEN
                ALTER TABLE "Zone" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100;
            END IF;
        END $$;
    """)

    # =========================================================================
    # 2. BIN ENHANCEMENTS
    # =========================================================================
    # Add capacity, location, and flag fields to Bin table
    op.execute("""
        DO $$
        BEGIN
            -- Bin type
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'binType'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "binType" VARCHAR;
            END IF;

            -- Max weight
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'maxWeight'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "maxWeight" NUMERIC(10, 2);
            END IF;

            -- Max volume
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'maxVolume'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "maxVolume" NUMERIC(10, 4);
            END IF;

            -- Max units
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'maxUnits'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "maxUnits" INTEGER;
            END IF;

            -- Current weight
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'currentWeight'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "currentWeight" NUMERIC(10, 2) DEFAULT 0;
            END IF;

            -- Current volume
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'currentVolume'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "currentVolume" NUMERIC(10, 4) DEFAULT 0;
            END IF;

            -- Current units
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'currentUnits'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "currentUnits" INTEGER NOT NULL DEFAULT 0;
            END IF;

            -- Aisle
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'aisle'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "aisle" VARCHAR;
            END IF;

            -- Rack
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'rack'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "rack" VARCHAR;
            END IF;

            -- Level
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'level'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "level" VARCHAR;
            END IF;

            -- Position
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'position'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "position" VARCHAR;
            END IF;

            -- Pick sequence
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'pickSequence'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "pickSequence" INTEGER DEFAULT 0;
            END IF;

            -- isPickFace flag
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'isPickFace'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "isPickFace" BOOLEAN DEFAULT FALSE;
            END IF;

            -- isReserve flag
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'isReserve'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "isReserve" BOOLEAN DEFAULT FALSE;
            END IF;

            -- isStaging flag
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Bin' AND column_name = 'isStaging'
            ) THEN
                ALTER TABLE "Bin" ADD COLUMN "isStaging" BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)

    # Create index on pickSequence if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE indexname = 'ix_bin_picksequence'
            ) THEN
                CREATE INDEX ix_bin_picksequence ON "Bin" ("pickSequence");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 3. VALUATION FIELDS
    # =========================================================================
    # Add valuationMethod to Company
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Company' AND column_name = 'valuationMethod'
            ) THEN
                ALTER TABLE "Company" ADD COLUMN "valuationMethod" VARCHAR DEFAULT 'FIFO';
            END IF;
        END $$;
    """)

    # Add valuationMethod to SKU
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'SKU' AND column_name = 'valuationMethod'
            ) THEN
                ALTER TABLE "SKU" ADD COLUMN "valuationMethod" VARCHAR;
            END IF;
        END $$;
    """)

    # Add valuationMethod to Location
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Location' AND column_name = 'valuationMethod'
            ) THEN
                ALTER TABLE "Location" ADD COLUMN "valuationMethod" VARCHAR;
            END IF;
        END $$;
    """)

    # Add fifoSequence and valuationMethod to Inventory
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Inventory' AND column_name = 'fifoSequence'
            ) THEN
                ALTER TABLE "Inventory" ADD COLUMN "fifoSequence" INTEGER;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Inventory' AND column_name = 'valuationMethod'
            ) THEN
                ALTER TABLE "Inventory" ADD COLUMN "valuationMethod" VARCHAR DEFAULT 'FIFO';
            END IF;
        END $$;
    """)

    # Create index on fifoSequence for Inventory
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE indexname = 'ix_inventory_fifosequence'
            ) THEN
                CREATE INDEX ix_inventory_fifosequence ON "Inventory" ("fifoSequence");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 4. GOODS RECEIPT TABLE
    # =========================================================================
    op.execute("""
        CREATE TABLE IF NOT EXISTS "GoodsReceipt" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "grNo" VARCHAR NOT NULL UNIQUE,
            "inboundId" UUID REFERENCES "Inbound"(id),
            "purchaseOrderId" UUID REFERENCES "PurchaseOrder"(id),
            "asnNo" VARCHAR,
            status VARCHAR NOT NULL DEFAULT 'DRAFT',
            "movementType" VARCHAR NOT NULL DEFAULT '101',
            "totalQty" INTEGER DEFAULT 0,
            "totalValue" NUMERIC(12, 2) DEFAULT 0,
            "locationId" UUID NOT NULL REFERENCES "Location"(id),
            "companyId" UUID NOT NULL REFERENCES "Company"(id),
            "receivedById" UUID REFERENCES "User"(id),
            "postedById" UUID REFERENCES "User"(id),
            "receivedAt" TIMESTAMP,
            "postedAt" TIMESTAMP,
            notes TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "deletedAt" TIMESTAMP
        );
    """)

    # Create indexes for GoodsReceipt
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_goodsreceipt_grno') THEN
                CREATE INDEX ix_goodsreceipt_grno ON "GoodsReceipt" ("grNo");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_goodsreceipt_locationid') THEN
                CREATE INDEX ix_goodsreceipt_locationid ON "GoodsReceipt" ("locationId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_goodsreceipt_companyid') THEN
                CREATE INDEX ix_goodsreceipt_companyid ON "GoodsReceipt" ("companyId");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 5. GOODS RECEIPT ITEM TABLE
    # =========================================================================
    op.execute("""
        CREATE TABLE IF NOT EXISTS "GoodsReceiptItem" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "goodsReceiptId" UUID NOT NULL REFERENCES "GoodsReceipt"(id),
            "skuId" UUID NOT NULL REFERENCES "SKU"(id),
            "expectedQty" INTEGER DEFAULT 0,
            "receivedQty" INTEGER DEFAULT 0,
            "acceptedQty" INTEGER DEFAULT 0,
            "rejectedQty" INTEGER DEFAULT 0,
            "batchNo" VARCHAR,
            "lotNo" VARCHAR,
            "expiryDate" TIMESTAMP,
            "mfgDate" TIMESTAMP,
            "serialNumbers" TEXT[] DEFAULT '{}',
            mrp NUMERIC(12, 2),
            "costPrice" NUMERIC(12, 2),
            "targetBinId" UUID REFERENCES "Bin"(id),
            "qcStatus" VARCHAR,
            "qcRemarks" TEXT,
            "fifoSequence" INTEGER,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "deletedAt" TIMESTAMP
        );
    """)

    # Create indexes for GoodsReceiptItem
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_goodsreceiptitem_goodsreceiptid') THEN
                CREATE INDEX ix_goodsreceiptitem_goodsreceiptid ON "GoodsReceiptItem" ("goodsReceiptId");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 6. INVENTORY ALLOCATION TABLE
    # =========================================================================
    op.execute("""
        CREATE TABLE IF NOT EXISTS inventory_allocations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "allocationNo" VARCHAR NOT NULL UNIQUE,
            "orderId" UUID REFERENCES "Order"(id),
            "orderItemId" UUID REFERENCES "OrderItem"(id),
            "waveId" UUID REFERENCES "Wave"(id),
            "picklistId" UUID REFERENCES "Picklist"(id),
            "picklistItemId" UUID REFERENCES "PicklistItem"(id),
            "skuId" UUID NOT NULL REFERENCES "SKU"(id),
            "inventoryId" UUID NOT NULL REFERENCES "Inventory"(id),
            "binId" UUID NOT NULL REFERENCES "Bin"(id),
            "batchNo" VARCHAR,
            "lotNo" VARCHAR,
            "allocatedQty" INTEGER DEFAULT 0,
            "pickedQty" INTEGER DEFAULT 0,
            "valuationMethod" VARCHAR DEFAULT 'FIFO',
            "fifoSequence" INTEGER,
            "expiryDate" TIMESTAMP,
            "costPrice" NUMERIC(12, 2),
            status VARCHAR DEFAULT 'ALLOCATED',
            "allocatedById" UUID REFERENCES "User"(id),
            "pickedById" UUID REFERENCES "User"(id),
            "cancelledById" UUID REFERENCES "User"(id),
            "allocatedAt" TIMESTAMP DEFAULT NOW(),
            "pickedAt" TIMESTAMP,
            "cancelledAt" TIMESTAMP,
            "locationId" UUID NOT NULL REFERENCES "Location"(id),
            "companyId" UUID NOT NULL REFERENCES "Company"(id),
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW()
        );
    """)

    # Create indexes for inventory_allocations
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_allocationno') THEN
                CREATE UNIQUE INDEX ix_inventory_allocations_allocationno ON inventory_allocations ("allocationNo");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_orderid') THEN
                CREATE INDEX ix_inventory_allocations_orderid ON inventory_allocations ("orderId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_waveid') THEN
                CREATE INDEX ix_inventory_allocations_waveid ON inventory_allocations ("waveId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_picklistid') THEN
                CREATE INDEX ix_inventory_allocations_picklistid ON inventory_allocations ("picklistId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_skuid') THEN
                CREATE INDEX ix_inventory_allocations_skuid ON inventory_allocations ("skuId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_inventoryid') THEN
                CREATE INDEX ix_inventory_allocations_inventoryid ON inventory_allocations ("inventoryId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_binid') THEN
                CREATE INDEX ix_inventory_allocations_binid ON inventory_allocations ("binId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_status') THEN
                CREATE INDEX ix_inventory_allocations_status ON inventory_allocations (status);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_fifosequence') THEN
                CREATE INDEX ix_inventory_allocations_fifosequence ON inventory_allocations ("fifoSequence");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_locationid') THEN
                CREATE INDEX ix_inventory_allocations_locationid ON inventory_allocations ("locationId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_inventory_allocations_companyid') THEN
                CREATE INDEX ix_inventory_allocations_companyid ON inventory_allocations ("companyId");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 7. PUTAWAY TASK TABLE
    # =========================================================================
    op.execute("""
        CREATE TABLE IF NOT EXISTS putaway_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "taskNo" VARCHAR(50) NOT NULL UNIQUE,
            "goodsReceiptId" UUID REFERENCES "GoodsReceipt"(id),
            "goodsReceiptItemId" UUID REFERENCES "GoodsReceiptItem"(id),
            "skuId" UUID NOT NULL REFERENCES "SKU"(id),
            quantity INTEGER DEFAULT 0,
            "batchNo" VARCHAR(100),
            "lotNo" VARCHAR(100),
            "expiryDate" TIMESTAMP,
            "fromBinId" UUID REFERENCES "Bin"(id),
            "toBinId" UUID NOT NULL REFERENCES "Bin"(id),
            "actualBinId" UUID REFERENCES "Bin"(id),
            "actualQty" INTEGER,
            status VARCHAR(20) DEFAULT 'PENDING',
            priority INTEGER DEFAULT 5,
            "assignedToId" UUID REFERENCES "User"(id),
            "assignedAt" TIMESTAMP,
            "assignedById" UUID REFERENCES "User"(id),
            "startedAt" TIMESTAMP,
            "completedAt" TIMESTAMP,
            "completedById" UUID REFERENCES "User"(id),
            "cancelledAt" TIMESTAMP,
            "cancelledById" UUID REFERENCES "User"(id),
            "cancellationReason" TEXT,
            notes TEXT,
            "locationId" UUID NOT NULL REFERENCES "Location"(id),
            "companyId" UUID NOT NULL REFERENCES "Company"(id),
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "createdById" UUID REFERENCES "User"(id),
            "updatedAt" TIMESTAMP DEFAULT NOW()
        );
    """)

    # Create indexes for putaway_tasks
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_taskno') THEN
                CREATE UNIQUE INDEX ix_putaway_tasks_taskno ON putaway_tasks ("taskNo");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_goodsreceiptid') THEN
                CREATE INDEX ix_putaway_tasks_goodsreceiptid ON putaway_tasks ("goodsReceiptId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_goodsreceiptitemid') THEN
                CREATE INDEX ix_putaway_tasks_goodsreceiptitemid ON putaway_tasks ("goodsReceiptItemId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_skuid') THEN
                CREATE INDEX ix_putaway_tasks_skuid ON putaway_tasks ("skuId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_tobinid') THEN
                CREATE INDEX ix_putaway_tasks_tobinid ON putaway_tasks ("toBinId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_status') THEN
                CREATE INDEX ix_putaway_tasks_status ON putaway_tasks (status);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_assignedtoid') THEN
                CREATE INDEX ix_putaway_tasks_assignedtoid ON putaway_tasks ("assignedToId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_locationid') THEN
                CREATE INDEX ix_putaway_tasks_locationid ON putaway_tasks ("locationId");
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_putaway_tasks_companyid') THEN
                CREATE INDEX ix_putaway_tasks_companyid ON putaway_tasks ("companyId");
            END IF;
        END $$;
    """)

    # =========================================================================
    # 8. STOCK ADJUSTMENT ENHANCEMENTS
    # =========================================================================
    # Add approval workflow fields to StockAdjustment if they don't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'submittedById'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "submittedById" UUID REFERENCES "User"(id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'submittedAt'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "submittedAt" TIMESTAMP;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'approvedById'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "approvedById" UUID REFERENCES "User"(id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'approvedAt'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "approvedAt" TIMESTAMP;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'rejectedById'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "rejectedById" UUID REFERENCES "User"(id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'rejectedAt'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "rejectedAt" TIMESTAMP;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'rejectionReason'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "rejectionReason" TEXT;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'postedById'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "postedById" UUID REFERENCES "User"(id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'postedAt'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "postedAt" TIMESTAMP;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'StockAdjustment' AND column_name = 'companyId'
            ) THEN
                ALTER TABLE "StockAdjustment" ADD COLUMN "companyId" UUID REFERENCES "Company"(id);
            END IF;
        END $$;
    """)

    # Create index on companyId for StockAdjustment if not exists
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE indexname = 'ix_stockadjustment_companyid'
            ) THEN
                CREATE INDEX ix_stockadjustment_companyid ON "StockAdjustment" ("companyId");
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """
    Rollback WMS Phase 1 schema changes.

    WARNING: This will drop tables and columns. Data will be lost.
    """
    # Drop putaway_tasks table
    op.execute('DROP TABLE IF EXISTS putaway_tasks CASCADE;')

    # Drop inventory_allocations table
    op.execute('DROP TABLE IF EXISTS inventory_allocations CASCADE;')

    # Drop GoodsReceiptItem table
    op.execute('DROP TABLE IF EXISTS "GoodsReceiptItem" CASCADE;')

    # Drop GoodsReceipt table
    op.execute('DROP TABLE IF EXISTS "GoodsReceipt" CASCADE;')

    # Remove StockAdjustment approval fields
    op.execute("""
        ALTER TABLE "StockAdjustment"
        DROP COLUMN IF EXISTS "submittedById",
        DROP COLUMN IF EXISTS "submittedAt",
        DROP COLUMN IF EXISTS "approvedById",
        DROP COLUMN IF EXISTS "approvedAt",
        DROP COLUMN IF EXISTS "rejectedById",
        DROP COLUMN IF EXISTS "rejectedAt",
        DROP COLUMN IF EXISTS "rejectionReason",
        DROP COLUMN IF EXISTS "postedById",
        DROP COLUMN IF EXISTS "postedAt",
        DROP COLUMN IF EXISTS "companyId";
    """)

    # Remove Inventory valuation fields
    op.execute("""
        ALTER TABLE "Inventory"
        DROP COLUMN IF EXISTS "fifoSequence",
        DROP COLUMN IF EXISTS "valuationMethod";
    """)

    # Remove Location valuation fields
    op.execute('ALTER TABLE "Location" DROP COLUMN IF EXISTS "valuationMethod";')

    # Remove SKU valuation fields
    op.execute('ALTER TABLE "SKU" DROP COLUMN IF EXISTS "valuationMethod";')

    # Remove Company valuation fields
    op.execute('ALTER TABLE "Company" DROP COLUMN IF EXISTS "valuationMethod";')

    # Remove Bin enhancement fields
    op.execute("""
        ALTER TABLE "Bin"
        DROP COLUMN IF EXISTS "binType",
        DROP COLUMN IF EXISTS "maxWeight",
        DROP COLUMN IF EXISTS "maxVolume",
        DROP COLUMN IF EXISTS "maxUnits",
        DROP COLUMN IF EXISTS "currentWeight",
        DROP COLUMN IF EXISTS "currentVolume",
        DROP COLUMN IF EXISTS "currentUnits",
        DROP COLUMN IF EXISTS "aisle",
        DROP COLUMN IF EXISTS "rack",
        DROP COLUMN IF EXISTS "level",
        DROP COLUMN IF EXISTS "position",
        DROP COLUMN IF EXISTS "pickSequence",
        DROP COLUMN IF EXISTS "isPickFace",
        DROP COLUMN IF EXISTS "isReserve",
        DROP COLUMN IF EXISTS "isStaging";
    """)

    # Remove Zone enhancement fields
    op.execute("""
        ALTER TABLE "Zone"
        DROP COLUMN IF EXISTS "temperatureType",
        DROP COLUMN IF EXISTS "minTemp",
        DROP COLUMN IF EXISTS "maxTemp",
        DROP COLUMN IF EXISTS "priority";
    """)
