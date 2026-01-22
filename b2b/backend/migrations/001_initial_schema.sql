-- CJDQuick B2B Logistics Database Schema
-- Tables prefixed with B2B_ to avoid conflicts in shared database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- B2B Company Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS "B2BCompany" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    gst VARCHAR(20),
    pan VARCHAR(20),
    logo TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    settings JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2bcompany_code ON "B2BCompany"(code);

-- ============================================================================
-- B2B User Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS "B2BUser" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'OPERATOR',
    "isActive" BOOLEAN DEFAULT true,
    "companyId" UUID REFERENCES "B2BCompany"(id),
    "locationAccess" UUID[] DEFAULT '{}',
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2buser_email ON "B2BUser"(email);
CREATE INDEX IF NOT EXISTS idx_b2buser_company ON "B2BUser"("companyId");

-- ============================================================================
-- Seed Data: Default Company and Admin User
-- ============================================================================

-- Create default company
INSERT INTO "B2BCompany" (id, code, name, "legalName", email, phone, "isActive")
VALUES (
    'b2b00000-0000-0000-0000-000000000001',
    'B2B-LOGISTICS',
    'CJDQuick B2B Logistics',
    'CJDQuick B2B Logistics Pvt Ltd',
    'admin@b2b-logistics.com',
    '+91-9876543210',
    true
) ON CONFLICT (code) DO NOTHING;

-- Create admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO "B2BUser" (id, email, password, name, phone, role, "isActive", "companyId")
VALUES (
    'b2b00000-0000-0000-0000-000000000002',
    'admin@b2b-logistics.com',
    '$2b$12$2t1w5ZgKpj1qcLg0eh0tzeCkMLyhAlyEQghcl0oYj4748ElkF24LG',
    'B2B Admin',
    '+91-9876543210',
    'SUPER_ADMIN',
    true,
    'b2b00000-0000-0000-0000-000000000001'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Update Trigger for updatedAt
-- ============================================================================
CREATE OR REPLACE FUNCTION update_b2b_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_b2bcompany_updated_at ON "B2BCompany";
CREATE TRIGGER update_b2bcompany_updated_at
    BEFORE UPDATE ON "B2BCompany"
    FOR EACH ROW
    EXECUTE FUNCTION update_b2b_updated_at();

DROP TRIGGER IF EXISTS update_b2buser_updated_at ON "B2BUser";
CREATE TRIGGER update_b2buser_updated_at
    BEFORE UPDATE ON "B2BUser"
    FOR EACH ROW
    EXECUTE FUNCTION update_b2b_updated_at();

-- ============================================================================
-- Verify Setup
-- ============================================================================
SELECT 'B2B Company count:' as info, count(*) FROM "B2BCompany";
SELECT 'B2B User count:' as info, count(*) FROM "B2BUser";
SELECT 'B2B Admin user:' as info, email, name, role FROM "B2BUser" WHERE role = 'SUPER_ADMIN';
