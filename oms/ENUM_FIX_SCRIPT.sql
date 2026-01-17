-- ============================================================================
-- ENUM SYNCHRONIZATION SQL SCRIPT
-- Generated: 2026-01-17
-- Purpose: Add missing enum values to PostgreSQL to match Python backend
-- ============================================================================
--
-- IMPORTANT NOTES:
-- 1. PostgreSQL does not allow removing enum values easily
-- 2. ALTER TYPE ADD VALUE cannot run inside a transaction
-- 3. This script only ADDS missing values - legacy values remain
-- 4. Run this in Supabase SQL Editor or via psql
--
-- ============================================================================

-- ============================================================================
-- 1. PicklistStatus - Add ASSIGNED and IN_PROGRESS
-- ============================================================================
ALTER TYPE "PicklistStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "PicklistStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- ============================================================================
-- 2. NDRStatus - Add ACTION_REQUESTED and RTO
-- ============================================================================
ALTER TYPE "NDRStatus" ADD VALUE IF NOT EXISTS 'ACTION_REQUESTED';
ALTER TYPE "NDRStatus" ADD VALUE IF NOT EXISTS 'RTO';

-- ============================================================================
-- 3. NDRReason - Add missing values
-- ============================================================================
ALTER TYPE "NDRReason" ADD VALUE IF NOT EXISTS 'CUSTOMER_UNAVAILABLE';
ALTER TYPE "NDRReason" ADD VALUE IF NOT EXISTS 'DELIVERY_RESCHEDULED';
ALTER TYPE "NDRReason" ADD VALUE IF NOT EXISTS 'AREA_NOT_SERVICEABLE';
ALTER TYPE "NDRReason" ADD VALUE IF NOT EXISTS 'NATURAL_DISASTER';

-- ============================================================================
-- 4. ImportStatus - Add IN_PROGRESS
-- ============================================================================
ALTER TYPE "ImportStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- ============================================================================
-- 5. ReturnType - Add EXCHANGE
-- ============================================================================
ALTER TYPE "ReturnType" ADD VALUE IF NOT EXISTS 'EXCHANGE';

-- ============================================================================
-- 6. ManifestStatus - Add HANDED_OVER and CANCELLED
-- ============================================================================
ALTER TYPE "ManifestStatus" ADD VALUE IF NOT EXISTS 'HANDED_OVER';
ALTER TYPE "ManifestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- ============================================================================
-- 7. ResolutionType - Add missing values
-- ============================================================================
ALTER TYPE "ResolutionType" ADD VALUE IF NOT EXISTS 'REATTEMPT';
ALTER TYPE "ResolutionType" ADD VALUE IF NOT EXISTS 'PHONE_UPDATED';
ALTER TYPE "ResolutionType" ADD VALUE IF NOT EXISTS 'RESCHEDULE';
ALTER TYPE "ResolutionType" ADD VALUE IF NOT EXISTS 'RTO';
ALTER TYPE "ResolutionType" ADD VALUE IF NOT EXISTS 'CUSTOMER_PICKUP';

-- ============================================================================
-- 8. AIActionType - Add missing values
-- ============================================================================
ALTER TYPE "AIActionType" ADD VALUE IF NOT EXISTS 'NDR_CLASSIFICATION';
ALTER TYPE "AIActionType" ADD VALUE IF NOT EXISTS 'NDR_RESOLUTION';
ALTER TYPE "AIActionType" ADD VALUE IF NOT EXISTS 'FRAUD_DETECTION';
ALTER TYPE "AIActionType" ADD VALUE IF NOT EXISTS 'DEMAND_FORECAST';
ALTER TYPE "AIActionType" ADD VALUE IF NOT EXISTS 'CARRIER_SELECTION';

-- ============================================================================
-- 9. GatePassType - Add missing values
-- ============================================================================
ALTER TYPE "GatePassType" ADD VALUE IF NOT EXISTS 'INBOUND';
ALTER TYPE "GatePassType" ADD VALUE IF NOT EXISTS 'OUTBOUND';
ALTER TYPE "GatePassType" ADD VALUE IF NOT EXISTS 'VEHICLE';

-- ============================================================================
-- 10. CODReconciliationStatus - Add CLOSED
-- ============================================================================
ALTER TYPE "CODReconciliationStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- ============================================================================
-- 11. InboundType - Add TRANSFER and ADJUSTMENT
-- ============================================================================
ALTER TYPE "InboundType" ADD VALUE IF NOT EXISTS 'TRANSFER';
ALTER TYPE "InboundType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';

-- ============================================================================
-- 12. POStatus - Add PENDING and SENT
-- ============================================================================
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "POStatus" ADD VALUE IF NOT EXISTS 'SENT';

-- ============================================================================
-- 13. QCStatus - Add PARTIAL
-- ============================================================================
ALTER TYPE "QCStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- ============================================================================
-- 14. OutreachChannel - Add VOICE
-- ============================================================================
ALTER TYPE "OutreachChannel" ADD VALUE IF NOT EXISTS 'VOICE';

-- ============================================================================
-- 15. CustomerType - Add FRANCHISE
-- ============================================================================
ALTER TYPE "CustomerType" ADD VALUE IF NOT EXISTS 'FRANCHISE';

-- ============================================================================
-- 16. CreditStatus - Add EXHAUSTED and OVERDUE
-- ============================================================================
ALTER TYPE "CreditStatus" ADD VALUE IF NOT EXISTS 'EXHAUSTED';
ALTER TYPE "CreditStatus" ADD VALUE IF NOT EXISTS 'OVERDUE';

-- ============================================================================
-- 17. CreditTransactionType - Add missing values
-- ============================================================================
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'CREDIT_LIMIT_SET';
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'CREDIT_LIMIT_INCREASE';
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'CREDIT_LIMIT_DECREASE';
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'ORDER_PLACED';
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'ORDER_CANCELLED';
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';

-- ============================================================================
-- 18. BrandUserRole - Add ADMIN
-- ============================================================================
ALTER TYPE "BrandUserRole" ADD VALUE IF NOT EXISTS 'ADMIN';

-- ============================================================================
-- 19. CommunicationTrigger - Add NDR_FIRST_ATTEMPT and NDR_FOLLOWUP
-- ============================================================================
ALTER TYPE "CommunicationTrigger" ADD VALUE IF NOT EXISTS 'NDR_FIRST_ATTEMPT';
ALTER TYPE "CommunicationTrigger" ADD VALUE IF NOT EXISTS 'NDR_FOLLOWUP';

-- ============================================================================
-- 20. SyncFrequency - Add missing values
-- ============================================================================
ALTER TYPE "SyncFrequency" ADD VALUE IF NOT EXISTS 'EVERY_5_MINS';
ALTER TYPE "SyncFrequency" ADD VALUE IF NOT EXISTS 'EVERY_15_MINS';
ALTER TYPE "SyncFrequency" ADD VALUE IF NOT EXISTS 'EVERY_30_MINS';
ALTER TYPE "SyncFrequency" ADD VALUE IF NOT EXISTS 'MANUAL';

-- ============================================================================
-- 21. Create missing enum types (SeverityLevel, ReturnReason)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SeverityLevel') THEN
        CREATE TYPE "SeverityLevel" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReturnReason') THEN
        CREATE TYPE "ReturnReason" AS ENUM (
            'WRONG_PRODUCT',
            'DAMAGED',
            'DEFECTIVE',
            'SIZE_ISSUE',
            'COLOR_MISMATCH',
            'NOT_AS_DESCRIBED',
            'CHANGED_MIND',
            'LATE_DELIVERY',
            'OTHER'
        );
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Run this query after to confirm all values are added
-- ============================================================================
SELECT
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'PicklistStatus', 'NDRStatus', 'NDRReason', 'ImportStatus',
    'ReturnType', 'ManifestStatus', 'ResolutionType', 'AIActionType',
    'GatePassType', 'CODReconciliationStatus', 'InboundType', 'POStatus',
    'QCStatus', 'OutreachChannel', 'CustomerType', 'CreditStatus',
    'CreditTransactionType', 'BrandUserRole', 'CommunicationTrigger',
    'SyncFrequency', 'SeverityLevel', 'ReturnReason'
  )
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
