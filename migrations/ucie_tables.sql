-- UCIE Database Tables Migration
-- Created: January 2025
-- Purpose: Create tables for Universal Crypto Intelligence Engine

-- Analysis cache table
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  data JSONB NOT NULL,
  data_quality_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT ucie_analysis_cache_symbol_key UNIQUE (symbol)
);

CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_cache_expires ON ucie_analysis_cache(expires_at);

COMMENT ON TABLE ucie_analysis_cache IS 'Caches complete UCIE analysis results';
COMMENT ON COLUMN ucie_analysis_cache.data_quality_score IS 'Score 0-100 indicating data completeness and reliability';

-- Watchlist table
CREATE TABLE IF NOT EXISTS ucie_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ucie_watchlist_user_symbol_key UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_user ON ucie_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_symbol ON ucie_watchlist(symbol);

COMMENT ON TABLE ucie_watchlist IS 'User watchlists for tracking specific tokens';

-- Alerts table
CREATE TABLE IF NOT EXISTS ucie_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'sentiment_change', 'whale_tx'
  threshold DECIMAL,
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ucie_alerts_user ON ucie_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_symbol ON ucie_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_enabled ON ucie_alerts(enabled);

COMMENT ON TABLE ucie_alerts IS 'User-configured alerts for price, sentiment, and on-chain events';
COMMENT ON COLUMN ucie_alerts.alert_type IS 'Type of alert: price_above, price_below, sentiment_change, whale_tx';

-- Cost tracking table
CREATE TABLE IF NOT EXISTS ucie_api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  symbol VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_ucie_costs_api ON ucie_api_costs(api_name);
CREATE INDEX IF NOT EXISTS idx_ucie_costs_timestamp ON ucie_api_costs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ucie_costs_user ON ucie_api_costs(user_id);

COMMENT ON TABLE ucie_api_costs IS 'Tracks API costs for monitoring and optimization';

-- Analysis history table
CREATE TABLE IF NOT EXISTS ucie_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  symbol VARCHAR(10) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  data_quality_score INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ucie_history_user ON ucie_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_history_symbol ON ucie_analysis_history(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_history_created ON ucie_analysis_history(created_at);

COMMENT ON TABLE ucie_analysis_history IS 'Tracks all UCIE analyses for analytics and optimization';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
