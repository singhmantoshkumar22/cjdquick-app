-- Create Brand table for OMS
-- Run this in Supabase SQL Editor

-- Create Brand table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Brand" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    description TEXT,
    "contactPerson" VARCHAR(255),
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(50),
    website VARCHAR(500),
    address JSONB,
    settings JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brand_code ON "Brand"(code);
CREATE INDEX IF NOT EXISTS idx_brand_company_id ON "Brand"("companyId");
CREATE INDEX IF NOT EXISTS idx_brand_is_active ON "Brand"("isActive");

-- Add trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_brand_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_updated_at ON "Brand";
CREATE TRIGGER brand_updated_at
    BEFORE UPDATE ON "Brand"
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE "Brand" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access
CREATE POLICY "Enable all operations for authenticated users" ON "Brand"
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON "Brand" TO authenticated;
GRANT ALL ON "Brand" TO service_role;
