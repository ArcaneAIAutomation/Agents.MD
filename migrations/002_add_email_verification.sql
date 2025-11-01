-- Bitcoin Sovereign Technology - Authentication System
-- Email Verification Migration
-- Version: 1.1.0
-- Date: November 1, 2025

-- ============================================================================
-- ADD EMAIL VERIFICATION COLUMNS TO USERS TABLE
-- ============================================================================

-- Add email_verified column (default FALSE for existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Add verification_token column (hashed token for security)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- Add verification_token_expires column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Add verification_sent_at column (track when verification email was sent)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CREATE INDEXES FOR EMAIL VERIFICATION
-- ============================================================================

-- Index for fast verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(verification_token) 
WHERE verification_token IS NOT NULL;

-- Index for filtering verified vs unverified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified);

-- Index for cleanup of expired verification tokens
CREATE INDEX IF NOT EXISTS idx_users_verification_expires 
ON users(verification_token_expires) 
WHERE verification_token_expires IS NOT NULL;

-- ============================================================================
-- ADD CONSTRAINTS FOR EMAIL VERIFICATION
-- ============================================================================

-- Drop constraints if they exist (for idempotency)
DO $$ 
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_verification_token_consistency;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_verification_sent_consistency;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Ensure verification token has expiry when set
ALTER TABLE users 
ADD CONSTRAINT users_verification_token_consistency 
CHECK (
  (verification_token IS NOT NULL AND verification_token_expires IS NOT NULL) OR
  (verification_token IS NULL AND verification_token_expires IS NULL)
);

-- Ensure verification_sent_at is set when token is generated
ALTER TABLE users 
ADD CONSTRAINT users_verification_sent_consistency 
CHECK (
  (verification_token IS NOT NULL AND verification_sent_at IS NOT NULL) OR
  (verification_token IS NULL)
);

-- ============================================================================
-- UPDATE COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Hashed email verification token (SHA-256)';
COMMENT ON COLUMN users.verification_token_expires IS 'Verification token expiration timestamp';
COMMENT ON COLUMN users.verification_sent_at IS 'Timestamp when verification email was sent';

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify columns were added
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')) = 4,
         'Not all email verification columns were added successfully';
  
  RAISE NOTICE 'Email verification migration completed successfully';
  RAISE NOTICE 'Columns added: email_verified, verification_token, verification_token_expires, verification_sent_at';
  RAISE NOTICE 'Indexes created: 3 total';
  RAISE NOTICE 'Constraints added: 2 total';
  
  -- Show count of users needing verification
  RAISE NOTICE 'Users needing email verification: %', (SELECT COUNT(*) FROM users WHERE email_verified = FALSE);
END $$;

