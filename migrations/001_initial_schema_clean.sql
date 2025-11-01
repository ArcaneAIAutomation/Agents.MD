-- Bitcoin Sovereign Technology - Authentication System
-- Initial Database Schema Migration (Clean Version)
-- Version: 1.0.0
-- Date: January 26, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- ACCESS CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_redeemed ON access_codes(redeemed);
CREATE INDEX IF NOT EXISTS idx_access_codes_redeemed_by ON access_codes(redeemed_by);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- AUTH LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_failed ON auth_logs(user_id, success, timestamp DESC) WHERE success = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_lowercase') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_lowercase CHECK (email = LOWER(TRIM(email)));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_codes_code_uppercase') THEN
    ALTER TABLE access_codes ADD CONSTRAINT access_codes_code_uppercase CHECK (code = UPPER(TRIM(code)));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_codes_redeemed_consistency') THEN
    ALTER TABLE access_codes ADD CONSTRAINT access_codes_redeemed_consistency 
      CHECK (
        (redeemed = TRUE AND redeemed_at IS NOT NULL AND redeemed_by IS NOT NULL) OR
        (redeemed = FALSE AND redeemed_at IS NULL AND redeemed_by IS NULL)
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_expires_at_future') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_expires_at_future CHECK (expires_at > created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_logs_event_type_valid') THEN
    ALTER TABLE auth_logs ADD CONSTRAINT auth_logs_event_type_valid 
      CHECK (event_type IN ('login', 'logout', 'register', 'failed_login', 'password_reset', 'security_alert'));
  END IF;
END $$;
