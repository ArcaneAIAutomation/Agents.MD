-- Einstein Trade Engine Database Schema
-- Version: 2.0.0
-- Created: January 27, 2025

-- ============================================
-- Table: einstein_trade_signals
-- Purpose: Store all generated trade signals
-- ============================================

CREATE TABLE IF NOT EXISTS einstein_trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trade Details
  symbol VARCHAR(10) NOT NULL,
  position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT', 'NO_TRADE')),
  timeframe VARCHAR(10) NOT NULL,
  
  -- Price Levels
  entry_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  take_profit_1 DECIMAL(20, 8) NOT NULL,
  take_profit_2 DECIMAL(20, 8) NOT NULL,
  take_profit_3 DECIMAL(20, 8) NOT NULL,
  
  -- Position Sizing
  position_size DECIMAL(20, 8) NOT NULL,
  position_size_usd DECIMAL(20, 2),
  
  -- Quality Scores
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- AI Analysis
  reasoning TEXT,
  technical_analysis JSONB,
  sentiment_analysis JSONB,
  onchain_analysis JSONB,
  risk_analysis JSONB,
  
  -- Execution Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CLOSED', 'EXPIRED')),
  executed_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- P/L Tracking
  entry_price_actual DECIMAL(20, 8),
  exit_price_actual DECIMAL(20, 8),
  realized_pl DECIMAL(20, 8),
  realized_pl_usd DECIMAL(20, 2),
  realized_pl_percentage DECIMAL(10, 4),
  
  -- Partial Closes
  tp1_hit BOOLEAN DEFAULT FALSE,
  tp1_hit_at TIMESTAMP,
  tp1_exit_price DECIMAL(20, 8),
  tp2_hit BOOLEAN DEFAULT FALSE,
  tp2_hit_at TIMESTAMP,
  tp2_exit_price DECIMAL(20, 8),
  tp3_hit BOOLEAN DEFAULT FALSE,
  tp3_hit_at TIMESTAMP,
  tp3_exit_price DECIMAL(20, 8),
  stop_loss_hit BOOLEAN DEFAULT FALSE,
  stop_loss_hit_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_entry_price CHECK (entry_price > 0),
  CONSTRAINT valid_stop_loss CHECK (stop_loss > 0),
  CONSTRAINT valid_take_profits CHECK (
    take_profit_1 > 0 AND 
    take_profit_2 > 0 AND 
    take_profit_3 > 0
  ),
  CONSTRAINT valid_position_size CHECK (position_size > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_einstein_signals_user ON einstein_trade_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_einstein_signals_symbol ON einstein_trade_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_einstein_signals_status ON einstein_trade_signals(status);
CREATE INDEX IF NOT EXISTS idx_einstein_signals_created ON einstein_trade_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_einstein_signals_executed ON einstein_trade_signals(executed_at DESC) WHERE executed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_einstein_signals_user_status ON einstein_trade_signals(user_id, status);

-- ============================================
-- Table: einstein_analysis_cache
-- Purpose: Cache API data to reduce costs
-- ============================================

CREATE TABLE IF NOT EXISTS einstein_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache Key
  symbol VARCHAR(10) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
    'market_data',
    'sentiment_data',
    'onchain_data',
    'technical_data',
    'news_data',
    'complete_analysis'
  )),
  
  -- Cached Data
  data JSONB NOT NULL,
  data_quality INTEGER NOT NULL CHECK (data_quality >= 0 AND data_quality <= 100),
  
  -- Cache Management
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint for cache key
  CONSTRAINT unique_cache_key UNIQUE (symbol, analysis_type)
);

-- Indexes for cache lookups
CREATE INDEX IF NOT EXISTS idx_einstein_cache_symbol_type ON einstein_analysis_cache(symbol, analysis_type);
CREATE INDEX IF NOT EXISTS idx_einstein_cache_expires ON einstein_analysis_cache(expires_at);

-- ============================================
-- Table: einstein_performance
-- Purpose: Track performance metrics
-- ============================================

CREATE TABLE IF NOT EXISTS einstein_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference (trade_id can be NULL for aggregate metrics)
  trade_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metric Details
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'win_rate',
    'avg_profit',
    'avg_loss',
    'max_drawdown',
    'profit_factor',
    'sharpe_ratio',
    'total_trades',
    'winning_trades',
    'losing_trades'
  )),
  metric_value DECIMAL(20, 8) NOT NULL,
  
  -- Time Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Add foreign key constraint for trade_id (after table creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_einstein_performance_trade'
  ) THEN
    ALTER TABLE einstein_performance 
    ADD CONSTRAINT fk_einstein_performance_trade 
    FOREIGN KEY (trade_id) REFERENCES einstein_trade_signals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_einstein_performance_trade ON einstein_performance(trade_id) WHERE trade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_einstein_performance_user ON einstein_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_einstein_performance_type ON einstein_performance(metric_type);
CREATE INDEX IF NOT EXISTS idx_einstein_performance_period ON einstein_performance(period_start, period_end);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_einstein_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER trigger_einstein_signals_updated_at
  BEFORE UPDATE ON einstein_trade_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_einstein_updated_at();

-- ============================================
-- Function: Clean expired cache entries
-- ============================================

CREATE OR REPLACE FUNCTION clean_expired_einstein_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM einstein_analysis_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE einstein_trade_signals IS 'Stores all Einstein-generated trade signals with complete analysis and execution tracking';
COMMENT ON TABLE einstein_analysis_cache IS 'Caches API data to reduce costs and improve performance (TTL: 5 minutes for most data)';
COMMENT ON TABLE einstein_performance IS 'Tracks performance metrics for learning and improvement';

COMMENT ON COLUMN einstein_trade_signals.confidence_score IS 'AI confidence in the signal (0-100%), minimum 60% required';
COMMENT ON COLUMN einstein_trade_signals.data_quality_score IS 'Data quality score (0-100%), minimum 90% required';
COMMENT ON COLUMN einstein_trade_signals.reasoning IS 'GPT-5.1 reasoning and analysis explanation';
COMMENT ON COLUMN einstein_trade_signals.position_size IS 'Position size in crypto units (e.g., BTC)';
COMMENT ON COLUMN einstein_trade_signals.position_size_usd IS 'Position size in USD for reference';

-- ============================================
-- Grant permissions (adjust as needed)
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON einstein_trade_signals TO authenticated;
GRANT SELECT ON einstein_analysis_cache TO authenticated;
GRANT SELECT ON einstein_performance TO authenticated;

-- ============================================
-- Initial data / seed (optional)
-- ============================================

-- No seed data needed for Einstein tables

-- ============================================
-- Migration complete
-- ============================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Einstein Trade Engine tables created successfully';
  RAISE NOTICE 'Tables: einstein_trade_signals, einstein_analysis_cache, einstein_performance';
  RAISE NOTICE 'Indexes: 12 indexes created for optimal performance';
  RAISE NOTICE 'Functions: update_einstein_updated_at, clean_expired_einstein_cache';
END $$;
