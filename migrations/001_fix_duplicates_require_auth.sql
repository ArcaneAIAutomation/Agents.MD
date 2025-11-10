-- ============================================================================
-- Fix Duplicate Data and Require Authentication
-- ============================================================================
-- Purpose: 
--   1. Remove duplicate entries (keep only authenticated user data)
--   2. Delete all anonymous user data (user_email IS NULL)
--   3. Change UNIQUE constraint to prevent future duplicates
--   4. Require user_email for all new entries
-- ============================================================================

-- Step 1: Delete all anonymous user data (user_email IS NULL)
DELETE FROM ucie_analysis_cache WHERE user_email IS NULL;

-- Step 2: Delete all entries with user_id = 'anonymous'
DELETE FROM ucie_analysis_cache WHERE user_id = 'anonymous';

-- Step 3: Drop old UNIQUE constraint
ALTER TABLE ucie_analysis_cache DROP CONSTRAINT IF EXISTS ucie_analysis_cache_symbol_analysis_type_user_id_key;

-- Step 4: Add new UNIQUE constraint (symbol + analysis_type only, no user_id)
-- This ensures only ONE entry per symbol+type across ALL users
ALTER TABLE ucie_analysis_cache ADD CONSTRAINT ucie_analysis_cache_symbol_type_unique UNIQUE (symbol, analysis_type);

-- Step 5: Make user_email NOT NULL (require authentication)
-- First, delete any remaining NULL emails
DELETE FROM ucie_analysis_cache WHERE user_email IS NULL;

-- Then, alter column to NOT NULL
ALTER TABLE ucie_analysis_cache ALTER COLUMN user_email SET NOT NULL;

-- Step 6: Update index to reflect new constraint
DROP INDEX IF EXISTS idx_ucie_analysis_cache_symbol_type_user;
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_symbol_type ON ucie_analysis_cache(symbol, analysis_type);

-- Step 7: Clean up other tables (OpenAI, Caesar)
DELETE FROM ucie_openai_analysis WHERE user_email IS NULL;
DELETE FROM ucie_openai_analysis WHERE user_id = 'anonymous';

DELETE FROM ucie_caesar_research WHERE user_email IS NULL;
DELETE FROM ucie_caesar_research WHERE user_id = 'anonymous';

-- Step 8: Make user_email NOT NULL in other tables
ALTER TABLE ucie_openai_analysis ALTER COLUMN user_email SET NOT NULL;
ALTER TABLE ucie_caesar_research ALTER COLUMN user_email SET NOT NULL;

-- Step 9: Update UNIQUE constraints for other tables
ALTER TABLE ucie_openai_analysis DROP CONSTRAINT IF EXISTS ucie_openai_analysis_symbol_user_id_key;
ALTER TABLE ucie_openai_analysis ADD CONSTRAINT ucie_openai_analysis_symbol_unique UNIQUE (symbol);

ALTER TABLE ucie_caesar_research DROP CONSTRAINT IF EXISTS ucie_caesar_research_symbol_user_id_key;
ALTER TABLE ucie_caesar_research ADD CONSTRAINT ucie_caesar_research_symbol_unique UNIQUE (symbol);

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  cache_count INTEGER;
  openai_count INTEGER;
  caesar_count INTEGER;
  null_email_count INTEGER;
BEGIN
  -- Count remaining entries
  SELECT COUNT(*) INTO cache_count FROM ucie_analysis_cache;
  SELECT COUNT(*) INTO openai_count FROM ucie_openai_analysis;
  SELECT COUNT(*) INTO caesar_count FROM ucie_caesar_research;
  
  -- Check for any NULL emails (should be 0)
  SELECT COUNT(*) INTO null_email_count FROM ucie_analysis_cache WHERE user_email IS NULL;
  
  RAISE NOTICE '✅ Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Status:';
  RAISE NOTICE '   - ucie_analysis_cache: % entries (all authenticated)', cache_count;
  RAISE NOTICE '   - ucie_openai_analysis: % entries (all authenticated)', openai_count;
  RAISE NOTICE '   - ucie_caesar_research: % entries (all authenticated)', caesar_count;
  RAISE NOTICE '   - NULL emails remaining: % (should be 0)', null_email_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - user_email is now REQUIRED (NOT NULL)';
  RAISE NOTICE '   - Anonymous users cannot store data';
  RAISE NOTICE '   - Only authenticated users get database storage';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Duplicates:';
  RAISE NOTICE '   - UNIQUE constraint changed to (symbol, analysis_type)';
  RAISE NOTICE '   - Only ONE entry per symbol+type (no user-specific duplicates)';
  RAISE NOTICE '   - All anonymous data deleted';
  
  IF null_email_count > 0 THEN
    RAISE WARNING '⚠️  Found % entries with NULL email - manual cleanup needed', null_email_count;
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN ucie_analysis_cache.user_email IS 'User email (REQUIRED - authenticated users only)';
COMMENT ON COLUMN ucie_openai_analysis.user_email IS 'User email (REQUIRED - authenticated users only)';
COMMENT ON COLUMN ucie_caesar_research.user_email IS 'User email (REQUIRED - authenticated users only)';

COMMENT ON CONSTRAINT ucie_analysis_cache_symbol_type_unique ON ucie_analysis_cache IS 'One entry per symbol+type (no user-specific duplicates)';
COMMENT ON CONSTRAINT ucie_openai_analysis_symbol_unique ON ucie_openai_analysis IS 'One entry per symbol (no user-specific duplicates)';
COMMENT ON CONSTRAINT ucie_caesar_research_symbol_unique ON ucie_caesar_research IS 'One entry per symbol (no user-specific duplicates)';
