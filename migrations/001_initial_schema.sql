-- Bitcoin Sovereign Technology - Authentication System
-- Initial Database Schema Migration
-- Version: 1.0.0
-- Date: January 26, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user account information with secure password hashing
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups during login
CREATE INDEX idx_users_email ON users(email);

-- Index for sorting by creation date
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- ACCESS CODES TABLE
-- ============================================================================
-- Stores one-time use access codes for registration
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast code lookups during registration
CREATE INDEX idx_access_codes_code ON access_codes(code);

-- Index for filtering redeemed vs unredeemed codes
CREATE INDEX idx_access_codes_redeemed ON access_codes(redeemed);

-- Index for admin queries on redemption status
CREATE INDEX idx_access_codes_redeemed_by ON access_codes(redeemed_by);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
-- Stores active user sessions with JWT token hashes
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user session lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Index for token validation
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

-- Index for cleanup of expired sessions
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- AUTH LOGS TABLE
-- ============================================================================
-- Stores comprehensive audit trail of authentication events
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user-specific log queries
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);

-- Index for filtering by event type
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);

-- Index for chronological queries
CREATE INDEX idx_auth_logs_timestamp ON auth_logs(timestamp DESC);

-- Composite index for security monitoring (failed logins by user)
CREATE INDEX idx_auth_logs_user_failed ON auth_logs(user_id, success, timestamp DESC) 
  WHERE success = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at timestamp on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONSTRAINTS & VALIDATION
-- ============================================================================

-- Ensure email is lowercase and trimmed
ALTER TABLE users ADD CONSTRAINT users_email_lowercase 
  CHECK (email = LOWER(TRIM(email)));

-- Ensure access codes are uppercase and trimmed
ALTER TABLE access_codes ADD CONSTRAINT access_codes_code_uppercase 
  CHECK (code = UPPER(TRIM(code)));

-- Ensure redeemed_at is set when redeemed is true
ALTER TABLE access_codes ADD CONSTRAINT access_codes_redeemed_consistency 
  CHECK (
    (redeemed = TRUE AND redeemed_at IS NOT NULL AND redeemed_by IS NOT NULL) OR
    (redeemed = FALSE AND redeemed_at IS NULL AND redeemed_by IS NULL)
  );

-- Ensure expires_at is in the future when session is created
ALTER TABLE sessions ADD CONSTRAINT sessions_expires_at_future 
  CHECK (expires_at > created_at);

-- Ensure event_type is one of the valid types
ALTER TABLE auth_logs ADD CONSTRAINT auth_logs_event_type_valid 
  CHECK (event_type IN ('login', 'logout', 'register', 'failed_login', 'password_reset', 'security_alert'));

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with secure password hashing';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, lowercase)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (12+ salt rounds)';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last account update timestamp';

COMMENT ON TABLE access_codes IS 'One-time use access codes for registration';
COMMENT ON COLUMN access_codes.id IS 'Unique access code identifier (UUID)';
COMMENT ON COLUMN access_codes.code IS 'Access code string (uppercase)';
COMMENT ON COLUMN access_codes.redeemed IS 'Whether code has been used';
COMMENT ON COLUMN access_codes.redeemed_by IS 'User who redeemed the code';
COMMENT ON COLUMN access_codes.redeemed_at IS 'Timestamp of redemption';
COMMENT ON COLUMN access_codes.created_at IS 'Code creation timestamp';

COMMENT ON TABLE sessions IS 'Active user sessions with JWT tokens';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN sessions.user_id IS 'User who owns this session';
COMMENT ON COLUMN sessions.token_hash IS 'Hashed JWT token for validation';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN sessions.created_at IS 'Session creation timestamp';

COMMENT ON TABLE auth_logs IS 'Audit trail of authentication events';
COMMENT ON COLUMN auth_logs.id IS 'Unique log entry identifier (UUID)';
COMMENT ON COLUMN auth_logs.user_id IS 'User associated with event (nullable)';
COMMENT ON COLUMN auth_logs.event_type IS 'Type of authentication event';
COMMENT ON COLUMN auth_logs.ip_address IS 'IP address of request';
COMMENT ON COLUMN auth_logs.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN auth_logs.success IS 'Whether event was successful';
COMMENT ON COLUMN auth_logs.error_message IS 'Error details if failed';
COMMENT ON COLUMN auth_logs.timestamp IS 'Event timestamp';

-- ============================================================================
-- INITIAL DATA VERIFICATION
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')) = 4,
         'Not all tables were created successfully';
  
  RAISE NOTICE 'Schema migration completed successfully';
  RAISE NOTICE 'Tables created: users, access_codes, sessions, auth_logs';
  RAISE NOTICE 'Indexes created: 13 total';
  RAISE NOTICE 'Constraints added: 5 total';
  RAISE NOTICE 'Triggers created: 1 (update_updated_at)';
END $$;
