-- Email Verification Migration
-- Bitcoin Sovereign Technology - Authentication System
-- Version: 1.1.0
-- Date: November 1, 2025

-- Add email verification columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Create index for finding unverified users
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add comments
COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification (hashed)';
COMMENT ON COLUMN users.verification_token_expires IS 'Expiration time for verification token (24 hours)';
COMMENT ON COLUMN users.verification_sent_at IS 'Timestamp when verification email was last sent';

-- Verify migration
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'verification_sent_at')) = 4,
         'Email verification columns not added successfully';
  
  RAISE NOTICE 'Email verification migration completed successfully';
END $$;
