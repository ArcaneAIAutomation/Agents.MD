-- Migration: Create Quantum API Cache Table
-- Task: 12.4 - Optimize API calls
-- Requirements: 2.1-2.8
-- 
-- This table stores cached API responses to reduce unnecessary API calls
-- and improve performance of the Quantum BTC system.

-- Create quantum_api_cache table
CREATE TABLE IF NOT EXISTS quantum_api_cache (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache identification
  symbol VARCHAR(10) NOT NULL,
  cache_type VARCHAR(50) NOT NULL,
  
  -- Cached data
  data JSONB NOT NULL,
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Unique constraint: one cache entry per symbol+type
  CONSTRAINT quantum_api_cache_unique UNIQUE (symbol, cache_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quantum_api_cache_symbol ON quantum_api_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_quantum_api_cache_type ON quantum_api_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_quantum_api_cache_expires ON quantum_api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_quantum_api_cache_symbol_type ON quantum_api_cache(symbol, cache_type);

-- Create function to automatically clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_quantum_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM quantum_api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired entries daily
-- Note: This requires pg_cron extension or manual execution
-- For manual execution: SELECT cleanup_expired_quantum_cache();

-- Add comment to table
COMMENT ON TABLE quantum_api_cache IS 'Caches API responses for Quantum BTC system to reduce unnecessary API calls and improve performance';
COMMENT ON COLUMN quantum_api_cache.symbol IS 'Token symbol (e.g., BTC)';
COMMENT ON COLUMN quantum_api_cache.cache_type IS 'Type of cached data (market-data, on-chain, sentiment, etc.)';
COMMENT ON COLUMN quantum_api_cache.data IS 'Cached API response data in JSON format';
COMMENT ON COLUMN quantum_api_cache.data_quality_score IS 'Quality score of cached data (0-100)';
COMMENT ON COLUMN quantum_api_cache.expires_at IS 'Expiration timestamp for cache entry';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quantum_api_cache TO your_app_user;
