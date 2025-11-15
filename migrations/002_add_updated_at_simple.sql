-- Simple Migration: Add updated_at column to ucie_analysis_cache
-- Date: 2025-01-27

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ucie_analysis_cache' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ucie_analysis_cache 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to ucie_analysis_cache';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_ucie_analysis_cache_updated_at ON ucie_analysis_cache;

CREATE TRIGGER update_ucie_analysis_cache_updated_at
    BEFORE UPDATE ON ucie_analysis_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create useful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_expires 
    ON ucie_analysis_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_session 
    ON ucie_phase_data(session_id);

CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_expires 
    ON ucie_phase_data(expires_at);

-- Create view for active cache entries
CREATE OR REPLACE VIEW vw_ucie_active_cache AS
SELECT 
    symbol,
    analysis_type,
    data,
    data_quality_score,
    user_email,
    created_at,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
FROM ucie_analysis_cache
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Database ready for 100%% live data analysis';
END $$;
