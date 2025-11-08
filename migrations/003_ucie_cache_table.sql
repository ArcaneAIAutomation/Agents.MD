-- UCIE Analysis Cache Table
-- Stores API responses for reuse by OpenAI and Caesar analysis

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  data_quality_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(symbol, analysis_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_cache_type ON ucie_analysis_cache(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ucie_cache_expires ON ucie_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol_type ON ucie_analysis_cache(symbol, analysis_type);

-- Create function to automatically clean up expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_ucie_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ucie_analysis_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE ucie_analysis_cache IS 'Stores UCIE API responses for reuse by OpenAI summaries and Caesar analysis';
COMMENT ON COLUMN ucie_analysis_cache.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN ucie_analysis_cache.analysis_type IS 'Type of analysis (market-data, sentiment, technical, news, on-chain, etc.)';
COMMENT ON COLUMN ucie_analysis_cache.data IS 'Complete API response data in JSON format';
COMMENT ON COLUMN ucie_analysis_cache.data_quality_score IS 'Quality score 0-100 indicating data completeness';
COMMENT ON COLUMN ucie_analysis_cache.expires_at IS 'When this cache entry expires and should be refreshed';
