-- Migration: Add User Email to UCIE Cache Tables
-- Description: Add user_email column for better tracking and analytics
-- Created: January 27, 2025
-- Priority: Enhancement - Better user tracking

-- 1. Add user_email column to ucie_analysis_cache
ALTER TABLE ucie_analysis_cache
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- 2. Add user_email column to ucie_phase_data
ALTER TABLE ucie_phase_data
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- 3. Add user_email column to caesar_research_jobs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'caesar_research_jobs') THEN
    ALTER TABLE caesar_research_jobs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
  END IF;
END $$;

-- 4. Create indexes for email-based queries
CREATE INDEX IF NOT EXISTS idx_ucie_cache_user_email ON ucie_analysis_cache(user_email);
CREATE INDEX IF NOT EXISTS idx_ucie_phase_user_email ON ucie_phase_data(user_email);

-- Create index on caesar_research_jobs only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'caesar_research_jobs') THEN
    CREATE INDEX IF NOT EXISTS idx_caesar_jobs_user_email ON caesar_research_jobs(user_email);
  END IF;
END $$;

-- 5. Add comments
COMMENT ON COLUMN ucie_analysis_cache.user_email IS 'User email address for tracking and analytics';
COMMENT ON COLUMN ucie_phase_data.user_email IS 'User email address for session tracking';

-- Add comment to caesar_research_jobs only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'caesar_research_jobs') THEN
    EXECUTE 'COMMENT ON COLUMN caesar_research_jobs.user_email IS ''User email address for research tracking''';
  END IF;
END $$;

-- Note: Email is stored in addition to user_id for:
-- 1. Better analytics and reporting
-- 2. User identification in logs
-- 3. Support and debugging
-- 4. Usage tracking per user
