-- Create APIKey table for client authentication
-- Run this in Supabase SQL Editor

-- Create APIKey table
CREATE TABLE IF NOT EXISTS "APIKey" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key VARCHAR(64) UNIQUE NOT NULL,
    "keyPrefix" VARCHAR(8) NOT NULL,
    channel VARCHAR(50),
    permissions TEXT DEFAULT 'orders:write,orders:read',
    "rateLimit" INTEGER DEFAULT 1000,
    "isActive" BOOLEAN DEFAULT true,
    "lastUsedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_key_key ON "APIKey"(key);
CREATE INDEX IF NOT EXISTS idx_api_key_company_id ON "APIKey"("companyId");
CREATE INDEX IF NOT EXISTS idx_api_key_is_active ON "APIKey"("isActive");

-- Add trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_api_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_key_updated_at ON "APIKey";
CREATE TRIGGER api_key_updated_at
    BEFORE UPDATE ON "APIKey"
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE "APIKey" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access
CREATE POLICY "Enable all operations for authenticated users" ON "APIKey"
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON "APIKey" TO authenticated;
GRANT ALL ON "APIKey" TO service_role;
