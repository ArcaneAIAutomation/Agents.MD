-- ============================================================================
-- UCIE Veritas Protocol - Source Reliability Tracking Table
-- ============================================================================
-- This migration creates the table for tracking data source reliability
-- with dynamic trust weight adjustment based on historical validation results.
--
-- Created: January 2025
-- Version: 1.0.0
-- ============================================================================

-- Create veritas_source_reliability table
CREATE TABLE IF NOT EXISTS veritas_source_reliability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100) NOT NULL UNIQUE,
  reliability_score DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  total_validations INTEGER NOT NULL DEFAULT 0 CHECK (total_validations >= 0),
  successful_validations INTEGER NOT NULL DEFAULT 0 CHECK (successful_validations >= 0),
  deviation_count INTEGER NOT NULL DEFAULT 0 CHECK (deviation_count >= 0),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trust_weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (trust_weight >= 0 AND trust_weight <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_source_name 
  ON veritas_source_reliability(source_name);

CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_reliability_score 
  ON veritas_source_reliability(reliability_score DESC);

CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_last_updated 
  ON veritas_source_reliability(last_updated DESC);

-- Add constraint to ensure successful_validations <= total_validations
ALTER TABLE veritas_source_reliability 
  ADD CONSTRAINT check_successful_validations 
  CHECK (successful_validations <= total_validations);

-- Add comment to table
COMMENT ON TABLE veritas_source_reliability IS 
  'Tracks reliability scores and trust weights for data sources in the Veritas Protocol';

-- Add comments to columns
COMMENT ON COLUMN veritas_source_reliability.source_name IS 
  'Name of the data source (e.g., CoinGecko, CoinMarketCap, Kraken)';

COMMENT ON COLUMN veritas_source_reliability.reliability_score IS 
  'Percentage of successful validations (0-100)';

COMMENT ON COLUMN veritas_source_reliability.total_validations IS 
  'Total number of validation checks performed';

COMMENT ON COLUMN veritas_source_reliability.successful_validations IS 
  'Number of validations that passed';

COMMENT ON COLUMN veritas_source_reliability.deviation_count IS 
  'Number of times source deviated from consensus';

COMMENT ON COLUMN veritas_source_reliability.trust_weight IS 
  'Dynamic trust weight (0-1) used in validation calculations';

-- Insert initial data for known sources
INSERT INTO veritas_source_reliability (source_name, reliability_score, trust_weight)
VALUES 
  ('CoinGecko', 100.00, 1.00),
  ('CoinMarketCap', 100.00, 1.00),
  ('Kraken', 100.00, 1.00),
  ('LunarCrush', 100.00, 1.00),
  ('Reddit', 100.00, 1.00),
  ('Twitter', 100.00, 1.00),
  ('Blockchain.com', 100.00, 1.00),
  ('Etherscan', 100.00, 1.00),
  ('NewsAPI', 100.00, 1.00),
  ('CryptoCompare', 100.00, 1.00)
ON CONFLICT (source_name) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON veritas_source_reliability TO your_app_user;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'veritas_source_reliability'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'veritas_source_reliability';

-- Verify initial data
SELECT 
  source_name,
  reliability_score,
  trust_weight,
  created_at
FROM veritas_source_reliability
ORDER BY source_name;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS veritas_source_reliability CASCADE;
