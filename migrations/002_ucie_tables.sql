-- UCIE Database Tables Migration
-- Created: January 27, 2025
-- Purpose: Create persistent storage for UCIE analysis data

-- UCIE Analysis Cache Table
-- Stores cached analysis results to avoid repeated API calls
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL, -- 'research', 'market-data', 'technical', 'sentiment', 'news', 'on-chain', 'predictions', 'risk', 'derivatives', 'defi'
  data JSONB NOT NULL,
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT ucie_cache_unique UNIQUE(symbol, analysis_type)
);

CREATE INDEX idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
CREATE INDEX idx_ucie_cache_expires ON ucie_analysis_cache(expires_at);
CREATE INDEX idx_ucie_cache_type ON ucie_analysis_cache(analysis_type);
CREATE INDEX idx_ucie_cache_symbol_type ON ucie_analysis_cache(symbol, analysis_type);

COMMENT ON TABLE ucie_analysis_cache IS 'Caches UCIE analysis results to reduce API costs and improve performance';
COMMENT ON COLUMN ucie_analysis_cache.analysis_type IS 'Type of analysis: research, market-data, technical, sentiment, news, on-chain, predictions, risk, derivatives, defi';
COMMENT ON COLUMN ucie_analysis_cache.data_quality_score IS 'Quality score 0-100 indicating reliability of the data';

-- UCIE Phase Data Storage
-- Stores intermediate phase data for passing between analysis phases
CREATE TABLE IF NOT EXISTS ucie_phase_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  CONSTRAINT ucie_phase_unique UNIQUE(session_id, symbol, phase_number)
);

CREATE INDEX idx_ucie_phase_session ON ucie_phase_data(session_id);
CREATE INDEX idx_ucie_phase_expires ON ucie_phase_data(expires_at);
CREATE INDEX idx_ucie_phase_session_symbol ON ucie_phase_data(session_id, symbol);

COMMENT ON TABLE ucie_phase_data IS 'Stores intermediate phase data for progressive loading analysis';
COMMENT ON COLUMN ucie_phase_data.session_id IS 'Unique session identifier for tracking analysis progress';
COMMENT ON COLUMN ucie_phase_data.phase_number IS 'Phase number (1-4): 1=Critical, 2=Important, 3=Enhanced, 4=Deep';

-- UCIE User Watchlist
-- Stores user's watched cryptocurrency tokens
CREATE TABLE IF NOT EXISTS ucie_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT ucie_watchlist_unique UNIQUE(user_id, symbol)
);

CREATE INDEX idx_ucie_watchlist_user ON ucie_watchlist(user_id);
CREATE INDEX idx_ucie_watchlist_symbol ON ucie_watchlist(symbol);
CREATE INDEX idx_ucie_watchlist_added ON ucie_watchlist(added_at DESC);

COMMENT ON TABLE ucie_watchlist IS 'User watchlist for tracking favorite cryptocurrency tokens';

-- UCIE User Alerts
-- Stores user-configured alerts for price, sentiment, and on-chain events
CREATE TABLE IF NOT EXISTS ucie_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'sentiment_change', 'whale_tx', 'news_impact'
  threshold_value DECIMAL,
  condition_details JSONB, -- Additional conditions (e.g., sentiment threshold, whale tx size)
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT TRUE,
  CONSTRAINT ucie_alerts_check CHECK (
    (alert_type IN ('price_above', 'price_below') AND threshold_value IS NOT NULL) OR
    (alert_type NOT IN ('price_above', 'price_below'))
  )
);

CREATE INDEX idx_ucie_alerts_user ON ucie_alerts(user_id);
CREATE INDEX idx_ucie_alerts_symbol ON ucie_alerts(symbol);
CREATE INDEX idx_ucie_alerts_triggered ON ucie_alerts(triggered);
CREATE INDEX idx_ucie_alerts_enabled ON ucie_alerts(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_ucie_alerts_type ON ucie_alerts(alert_type);

COMMENT ON TABLE ucie_alerts IS 'User-configured alerts for cryptocurrency events';
COMMENT ON COLUMN ucie_alerts.alert_type IS 'Type of alert: price_above, price_below, sentiment_change, whale_tx, news_impact';
COMMENT ON COLUMN ucie_alerts.condition_details IS 'Additional alert conditions stored as JSON';

-- Cleanup function for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_ucie_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired cache entries
  DELETE FROM ucie_analysis_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired phase data
  DELETE FROM ucie_phase_data WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Delete expired alerts
  DELETE FROM ucie_alerts WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ucie_data IS 'Cleans up expired UCIE data from cache, phase data, and alerts tables';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ucie_analysis_cache TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ucie_phase_data TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ucie_watchlist TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ucie_alerts TO authenticated;
