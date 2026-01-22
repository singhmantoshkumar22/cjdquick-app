-- CJDQuick B2C Courier Database Schema
-- Tables prefixed with B2C_ to avoid conflicts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- B2C User Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS "B2CUser" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'OPERATOR',
    "isActive" BOOLEAN DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2cuser_email ON "B2CUser"(email);

-- ============================================================================
-- Seed Data: Admin User
-- ============================================================================

-- Create admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO "B2CUser" (id, email, password, name, phone, role, "isActive")
VALUES (
    'b2c00000-0000-0000-0000-000000000001',
    'admin@b2c-client.com',
    '$2b$12$2t1w5ZgKpj1qcLg0eh0tzeCkMLyhAlyEQghcl0oYj4748ElkF24LG',
    'B2C Admin',
    '+91-9876543210',
    'SUPER_ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Update Trigger for updatedAt
-- ============================================================================
CREATE OR REPLACE FUNCTION update_b2c_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_b2cuser_updated_at ON "B2CUser";
CREATE TRIGGER update_b2cuser_updated_at
    BEFORE UPDATE ON "B2CUser"
    FOR EACH ROW
    EXECUTE FUNCTION update_b2c_updated_at();

-- ============================================================================
-- Verify Setup
-- ============================================================================
SELECT 'B2C User count:' as info, count(*) FROM "B2CUser";
SELECT 'B2C Admin user:' as info, email, name, role FROM "B2CUser" WHERE role = 'SUPER_ADMIN';
