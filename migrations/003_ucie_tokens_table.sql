-- UCIE Tokens Table Migration
-- Created: January 2025
-- Purpose: Store cryptocurrency token information for fast validation and search

-- Tokens table
CREATE TABLE IF NOT EXISTS ucie_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coingecko_id VARCHAR(100) NOT NULL UNIQUE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  market_cap_rank INTEGER,
  image_url TEXT,
  current_price_usd DECIMAL(20, 8),
  market_cap_usd BIGINT,
  total_volume_usd BIGINT,
  price_change_24h DECIMAL(10, 4),
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_symbol ON ucie_tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_coingecko_id ON ucie_tokens(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_market_cap_rank ON ucie_tokens(market_cap_rank);
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_is_active ON ucie_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_last_updated ON ucie_tokens(last_updated);

-- Full-text search index for name and symbol
CREATE INDEX IF NOT EXISTS idx_ucie_tokens_search ON ucie_tokens USING gin(to_tsvector('english', name || ' ' || symbol));

-- Comments
COMMENT ON TABLE ucie_tokens IS 'Cryptocurrency token information for UCIE validation and search';
COMMENT ON COLUMN ucie_tokens.coingecko_id IS 'CoinGecko unique identifier (e.g., "bitcoin", "ethereum")';
COMMENT ON COLUMN ucie_tokens.symbol IS 'Token symbol (e.g., "BTC", "ETH")';
COMMENT ON COLUMN ucie_tokens.name IS 'Full token name (e.g., "Bitcoin", "Ethereum")';
COMMENT ON COLUMN ucie_tokens.market_cap_rank IS 'Market cap ranking (1 = highest)';
COMMENT ON COLUMN ucie_tokens.is_active IS 'Whether token is actively traded';
COMMENT ON COLUMN ucie_tokens.last_updated IS 'Last time token data was refreshed';
