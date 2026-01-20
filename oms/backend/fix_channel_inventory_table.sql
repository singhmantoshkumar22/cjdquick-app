-- ============================================================
-- Fix ChannelInventory table - Run this in Supabase SQL Editor
-- ============================================================

-- First, check if table exists and what columns it has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ChannelInventory'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- batchNo column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'batchNo') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "batchNo" VARCHAR(100);
    END IF;

    -- lotNo column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'lotNo') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "lotNo" VARCHAR(100);
    END IF;

    -- expiryDate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'expiryDate') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "expiryDate" TIMESTAMP;
    END IF;

    -- mfgDate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'mfgDate') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "mfgDate" TIMESTAMP;
    END IF;

    -- costPrice column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'costPrice') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "costPrice" NUMERIC(12,2);
    END IF;

    -- createdAt column (from BaseModel)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'createdAt') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- updatedAt column (from BaseModel)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ChannelInventory' AND column_name = 'updatedAt') THEN
        ALTER TABLE "ChannelInventory" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Verify the updated structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ChannelInventory'
ORDER BY ordinal_position;
