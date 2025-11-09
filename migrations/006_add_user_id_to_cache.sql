-- Migration: Add User ID to UCIE Cache Tables
-- Description: Add user_id column for user-specific data isolation
-- Created: January 27, 2025
-- Priority: CRITICAL - Security and data privacy fix

-- 1. Add user_id column to ucie_analysis_cache
ALTER TABLE ucie_analysis_cache
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 2. Drop existing unique constraint (symbol, analysis_type)
ALTER TABLE ucie_analysis_cache
DROP CONSTRAINT IF EXISTS ucie_analysis_cache_symbol_analysis_type_key;

-- 3. Create new unique constraint (symbol, analysis_type, user_id)
-- This ensures each user has their own cache per symbol/type
ALTER TABLE ucie_analysis_cache
ADD CONSTRAINT ucie_analysis_cache_symbol_type_user_key 
UNIQUE (symbol, analysis_type, user_id);

-- 4. Create index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_ucie_cache_user_id ON ucie_analysis_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_cache_user_symbol ON ucie_analysis_cache(user_id, symbol);

-- 5. Add user_id to ucie_phase_data
ALTER TABLE ucie_phase_data
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 6. Drop existing unique constraint on ucie_phase_data
ALTER TABLE ucie_phase_data
DROP CONSTRAINT IF EXISTS ucie_phase_data_session_id_key;

-- 7. Create new unique constraint for ucie_phase_data
ALTER TABLE ucie_phase_data
ADD CONSTRAINT ucie_phase_data_session_user_key 
UNIQUE (session_id, user_id);

-- 8. Create index for user-specific phase data queries
CREATE INDEX IF NOT EXISTS idx_ucie_phase_user_id ON ucie_phase_data(user_id);

-- 9. Add comments
COMMENT ON COLUMN ucie_analysis_cache.user_id IS 'User ID for data isolation - ensures each user has their own cache';
COMMENT ON COLUMN ucie_phase_data.user_id IS 'User ID for session isolation';

-- 10. Update existing NULL user_id values to a default (optional)
-- UPDATE ucie_analysis_cache SET user_id = 'system' WHERE user_id IS NULL;
-- UPDATE ucie_phase_data SET user_id = 'system' WHERE user_id IS NULL;

-- Note: After this migration, all cache functions MUST include user_id parameter
