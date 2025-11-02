-- ============================================================================
-- UCIE Cache Table Migration
-- Bitcoin Sovereign Technology - Universal Crypto Intelligence Engine
-- 
-- This migration creates the database cache table for UCIE analysis results.
-- 
-- Features:
--   - Stores cached analysis data with TTL
--   - Indexed by symbol and analysis type for fast queries
--   - Automatic expiration tracking
--   - JSONB storage for flexible data structures
-- 
-- Requirements: 14.3, 14.4
-- ============================================================================

-- Create UCIE analysis cache table
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  key VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  symbol VARCHAR(20),
  analysis_type VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ucie_cache_expires_at 
  ON ucie_analysis_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol 
  ON ucie_analysis_cache(symbol);

CREATE INDEX IF NOT EXISTS idx_ucie_cache_type 
  ON ucie_analysis_cache(analysis_type);

CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol_type 
  ON ucie_analysis_cache(symbol, analysis_type);

-- Add comment to table
COMMENT ON TABLE ucie_analysis_cache IS 
  'Cache storage for UCIE analysis results with automatic expiration';

-- Add comments to columns
COMMENT ON COLUMN ucie_analysis_cache.key IS 
  'Unique cache key (e.g., ucie:market:BTC)';

COMMENT ON COLUMN ucie_analysis_cache.data IS 
  'Cached analysis data in JSONB format';

COMMENT ON COLUMN ucie_analysis_cache.created_at IS 
  'Timestamp when cache entry was created';

COMMENT ON COLUMN ucie_analysis_cache.expires_at IS 
  'Timestamp when cache entry expires';

COMMENT ON COLUMN ucie_analysis_cache.symbol IS 
  'Token symbol (e.g., BTC, ETH) for filtering';

COMMENT ON COLUMN ucie_analysis_cache.analysis_type IS 
  'Type of analysis (e.g., market, technical, onchain)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'ucie_analysis_cache';

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ucie_analysis_cache';

-- ============================================================================
-- CLEANUP FUNCTION (Optional)
-- ============================================================================

-- Create function to automatically delete expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_ucie_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ucie_analysis_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION cleanup_expired_ucie_cache() IS 
  'Deletes expired cache entries and returns count of deleted rows';

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Insert cache entry
-- INSERT INTO ucie_analysis_cache (key, data, expires_at, symbol, analysis_type)
-- VALUES (
--   'ucie:market:BTC',
--   '{"price": 95000, "volume": 1000000}'::jsonb,
--   NOW() + INTERVAL '1 hour',
--   'BTC',
--   'market'
-- );

-- Query cache entry
-- SELECT data FROM ucie_analysis_cache
-- WHERE key = 'ucie:market:BTC' AND expires_at > NOW();

-- Delete expired entries
-- SELECT cleanup_expired_ucie_cache();

-- Get cache statistics
-- SELECT 
--   COUNT(*) as total_entries,
--   COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
--   COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
--   pg_size_pretty(pg_total_relation_size('ucie_analysis_cache')) as table_size
-- FROM ucie_analysis_cache;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP FUNCTION IF EXISTS cleanup_expired_ucie_cache();
-- DROP TABLE IF EXISTS ucie_analysis_cache;

-- ============================================================================
