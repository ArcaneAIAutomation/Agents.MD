-- Migration: Create veritas_source_reliability table
-- Purpose: Store historical reliability scores for data sources
-- Requirements: 14.1, 14.2, 14.3

CREATE TABLE IF NOT EXISTS veritas_source_reliability (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL UNIQUE,
  reliability_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
  total_validations INTEGER NOT NULL DEFAULT 0,
  successful_validations INTEGER NOT NULL DEFAULT 0,
  deviation_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  trust_weight DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT reliability_score_range CHECK (reliability_score >= 0 AND reliability_score <= 100),
  CONSTRAINT trust_weight_range CHECK (trust_weight >= 0 AND trust_weight <= 1),
  CONSTRAINT validations_positive CHECK (total_validations >= 0),
  CONSTRAINT successful_validations_positive CHECK (successful_validations >= 0),
  CONSTRAINT deviation_count_positive CHECK (deviation_count >= 0),
  CONSTRAINT successful_le_total CHECK (successful_validations <= total_validations)
);

-- Create index on source_name for fast lookups
CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_source_name 
ON veritas_source_reliability(source_name);

-- Create index on reliability_score for filtering unreliable sources
CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_score 
ON veritas_source_reliability(reliability_score);

-- Create index on last_updated for time-based queries
CREATE INDEX IF NOT EXISTS idx_veritas_source_reliability_last_updated 
ON veritas_source_reliability(last_updated DESC);

-- Add comment to table
COMMENT ON TABLE veritas_source_reliability IS 
'Tracks reliability scores and trust weights for data sources used in Veritas Protocol validation';

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
'Number of times source provided outlier data';

COMMENT ON COLUMN veritas_source_reliability.trust_weight IS 
'Dynamic trust weight (0-1) used in validation calculations';

COMMENT ON COLUMN veritas_source_reliability.last_updated IS 
'Timestamp of last reliability score update';
