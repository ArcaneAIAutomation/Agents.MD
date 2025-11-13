-- =====================================================
-- AI Trade Generation Engine (ATGE) Database Schema
-- =====================================================
-- Version: 1.0
-- Focus: Bitcoin (BTC) only
-- Created: January 2025
-- =====================================================

-- =====================================================
-- Table 1: trade_signals
-- Stores AI-generated trade signals with entry, targets, and stop loss
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trade Details
  symbol VARCHAR(10) NOT NULL DEFAULT 'BTC', -- Bitcoin only for now
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  timeframe VARCHAR(10) NOT NULL CHECK (timeframe IN ('1h', '4h', '1d', '1w')),
  
  -- Price Levels
  entry_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  take_profit_1 DECIMAL(20, 8) NOT NULL,
  take_profit_2 DECIMAL(20, 8) NOT NULL,
  take_profit_3 DECIMAL(20, 8) NOT NULL,
  
  -- AI Analysis
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_reasoning TEXT NOT NULL,
  ai_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o',
  
  -- Trade Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed_success', 'completed_failure', 'expired', 'cancelled')),
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for trade_signals
CREATE INDEX IF NOT EXISTS idx_trade_signals_user_id ON trade_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_signals_symbol ON trade_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_signals_status ON trade_signals(status);
CREATE INDEX IF NOT EXISTS idx_trade_signals_generated_at ON trade_signals(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_signals_expires_at ON trade_signals(expires_at);

-- =====================================================
-- Table 2: trade_results
-- Stores backtesting results and AI analysis of completed trades
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Backtesting Results
  tp1_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp1_hit_at TIMESTAMP WITH TIME ZONE,
  tp1_hit_price DECIMAL(20, 8),
  
  tp2_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp2_hit_at TIMESTAMP WITH TIME ZONE,
  tp2_hit_price DECIMAL(20, 8),
  
  tp3_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp3_hit_at TIMESTAMP WITH TIME ZONE,
  tp3_hit_price DECIMAL(20, 8),
  
  sl_hit BOOLEAN NOT NULL DEFAULT FALSE,
  sl_hit_at TIMESTAMP WITH TIME ZONE,
  sl_hit_price DECIMAL(20, 8),
  
  -- Profit/Loss Calculations (based on $1000 trade size)
  trade_size_usd DECIMAL(20, 2) NOT NULL DEFAULT 1000.00,
  gross_profit_loss DECIMAL(20, 2),
  fees_paid DECIMAL(20, 2) NOT NULL DEFAULT 2.00, -- 0.1% entry + 0.1% exit
  slippage_cost DECIMAL(20, 2) NOT NULL DEFAULT 2.00, -- 0.1% entry + 0.1% exit
  net_profit_loss DECIMAL(20, 2),
  profit_loss_percentage DECIMAL(10, 4),
  
  -- Trade Duration
  time_to_completion_minutes INTEGER,
  
  -- AI Analysis
  ai_analysis TEXT,
  ai_analysis_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for trade_results
CREATE INDEX IF NOT EXISTS idx_trade_results_trade_signal_id ON trade_results(trade_signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_results_net_profit_loss ON trade_results(net_profit_loss DESC);

-- =====================================================
-- Table 3: trade_technical_indicators
-- Stores technical indicators at the time of trade generation
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_technical_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- RSI (Relative Strength Index)
  rsi_14 DECIMAL(10, 4),
  
  -- MACD (Moving Average Convergence Divergence)
  macd_line DECIMAL(20, 8),
  macd_signal DECIMAL(20, 8),
  macd_histogram DECIMAL(20, 8),
  
  -- EMAs (Exponential Moving Averages)
  ema_20 DECIMAL(20, 8),
  ema_50 DECIMAL(20, 8),
  ema_200 DECIMAL(20, 8),
  
  -- Bollinger Bands
  bb_upper DECIMAL(20, 8),
  bb_middle DECIMAL(20, 8),
  bb_lower DECIMAL(20, 8),
  
  -- ATR (Average True Range)
  atr_14 DECIMAL(20, 8),
  
  -- Stochastic Oscillator
  stoch_k DECIMAL(10, 4),
  stoch_d DECIMAL(10, 4),
  
  -- Volume
  volume_24h DECIMAL(30, 2),
  volume_sma_20 DECIMAL(30, 2),
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for trade_technical_indicators
CREATE INDEX IF NOT EXISTS idx_trade_technical_indicators_trade_signal_id ON trade_technical_indicators(trade_signal_id);

-- =====================================================
-- Table 4: trade_market_snapshot
-- Stores complete market state at time of trade generation
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_market_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Price Data
  current_price DECIMAL(20, 8) NOT NULL,
  price_change_24h DECIMAL(10, 4),
  price_change_7d DECIMAL(10, 4),
  
  -- Market Data
  market_cap DECIMAL(30, 2),
  volume_24h DECIMAL(30, 2),
  circulating_supply DECIMAL(30, 8),
  
  -- Sentiment Data
  fear_greed_index INTEGER CHECK (fear_greed_index >= 0 AND fear_greed_index <= 100),
  social_sentiment_score INTEGER CHECK (social_sentiment_score >= 0 AND social_sentiment_score <= 100),
  
  -- LunarCrush Social Intelligence
  galaxy_score INTEGER CHECK (galaxy_score >= 0 AND galaxy_score <= 100),
  alt_rank INTEGER,
  social_dominance DECIMAL(5, 2),
  sentiment_positive DECIMAL(5, 2),
  sentiment_negative DECIMAL(5, 2),
  sentiment_neutral DECIMAL(5, 2),
  social_volume_24h INTEGER,
  social_posts_24h INTEGER,
  social_interactions_24h INTEGER,
  social_contributors_24h INTEGER,
  correlation_score DECIMAL(5, 4),
  
  -- On-Chain Data
  whale_transactions_24h INTEGER,
  exchange_inflow_24h DECIMAL(30, 8),
  exchange_outflow_24h DECIMAL(30, 8),
  
  -- Data Quality
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  data_sources JSONB, -- Array of data sources used
  
  -- Metadata
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for trade_market_snapshot
CREATE INDEX IF NOT EXISTS idx_trade_market_snapshot_trade_signal_id ON trade_market_snapshot(trade_signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_market_snapshot_galaxy_score ON trade_market_snapshot(galaxy_score DESC);
CREATE INDEX IF NOT EXISTS idx_trade_market_snapshot_social_sentiment ON trade_market_snapshot(social_sentiment_score DESC);

-- =====================================================
-- Table 5: trade_historical_prices
-- Stores minute-level OHLCV data for backtesting
-- =====================================================
CREATE TABLE IF NOT EXISTS trade_historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- OHLCV Data
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(30, 8) NOT NULL,
  
  -- Metadata
  data_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate data
  UNIQUE(trade_signal_id, timestamp)
);

-- Indexes for trade_historical_prices
CREATE INDEX IF NOT EXISTS idx_trade_historical_prices_trade_signal_id ON trade_historical_prices(trade_signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_historical_prices_timestamp ON trade_historical_prices(timestamp);

-- =====================================================
-- Table 6: atge_performance_cache
-- Caches performance statistics for fast dashboard loading
-- =====================================================
CREATE TABLE IF NOT EXISTS atge_performance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Aggregate Statistics
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5, 2),
  
  -- Profit/Loss
  total_profit_loss DECIMAL(20, 2),
  total_profit DECIMAL(20, 2),
  total_loss DECIMAL(20, 2),
  average_win DECIMAL(20, 2),
  average_loss DECIMAL(20, 2),
  
  -- Best/Worst
  best_trade_id UUID REFERENCES trade_signals(id),
  best_trade_profit DECIMAL(20, 2),
  worst_trade_id UUID REFERENCES trade_signals(id),
  worst_trade_loss DECIMAL(20, 2),
  
  -- Advanced Metrics
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  profit_factor DECIMAL(10, 4),
  win_loss_ratio DECIMAL(10, 4),
  
  -- Social Intelligence Performance
  avg_galaxy_score_wins DECIMAL(5, 2),
  avg_galaxy_score_losses DECIMAL(5, 2),
  social_correlation DECIMAL(5, 4),
  
  -- Cache Metadata
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one cache per user
  UNIQUE(user_id)
);

-- Indexes for atge_performance_cache
CREATE INDEX IF NOT EXISTS idx_atge_performance_cache_user_id ON atge_performance_cache(user_id);

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_trade_signals_updated_at
  BEFORE UPDATE ON trade_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_results_updated_at
  BEFORE UPDATE ON trade_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atge_performance_cache_updated_at
  BEFORE UPDATE ON atge_performance_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View: Complete trade details with all related data
CREATE OR REPLACE VIEW vw_complete_trades AS
SELECT 
  ts.id,
  ts.user_id,
  ts.symbol,
  ts.direction,
  ts.timeframe,
  ts.entry_price,
  ts.stop_loss,
  ts.take_profit_1,
  ts.take_profit_2,
  ts.take_profit_3,
  ts.confidence_score,
  ts.ai_reasoning,
  ts.status,
  ts.generated_at,
  ts.expires_at,
  ts.completed_at,
  
  -- Results
  tr.tp1_hit,
  tr.tp1_hit_at,
  tr.tp2_hit,
  tr.tp2_hit_at,
  tr.tp3_hit,
  tr.tp3_hit_at,
  tr.sl_hit,
  tr.sl_hit_at,
  tr.net_profit_loss,
  tr.profit_loss_percentage,
  tr.time_to_completion_minutes,
  tr.ai_analysis,
  
  -- Technical Indicators
  tti.rsi_14,
  tti.macd_line,
  tti.ema_20,
  tti.ema_50,
  tti.ema_200,
  
  -- Market Snapshot
  tms.current_price,
  tms.market_cap,
  tms.volume_24h,
  tms.galaxy_score,
  tms.alt_rank,
  tms.social_dominance,
  tms.sentiment_positive,
  tms.sentiment_negative,
  tms.social_volume_24h,
  tms.correlation_score,
  tms.whale_transactions_24h
  
FROM trade_signals ts
LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
LEFT JOIN trade_technical_indicators tti ON ts.id = tti.trade_signal_id
LEFT JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id;

-- =====================================================
-- Functions for Performance Calculations
-- =====================================================

-- Function: Calculate and update performance cache for a user
CREATE OR REPLACE FUNCTION calculate_atge_performance(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_trades INTEGER;
  v_winning_trades INTEGER;
  v_losing_trades INTEGER;
  v_success_rate DECIMAL(5, 2);
  v_total_profit_loss DECIMAL(20, 2);
  v_total_profit DECIMAL(20, 2);
  v_total_loss DECIMAL(20, 2);
  v_avg_win DECIMAL(20, 2);
  v_avg_loss DECIMAL(20, 2);
  v_best_trade_id UUID;
  v_best_trade_profit DECIMAL(20, 2);
  v_worst_trade_id UUID;
  v_worst_trade_loss DECIMAL(20, 2);
  v_avg_galaxy_wins DECIMAL(5, 2);
  v_avg_galaxy_losses DECIMAL(5, 2);
BEGIN
  -- Calculate total trades
  SELECT COUNT(*) INTO v_total_trades
  FROM trade_signals
  WHERE user_id = p_user_id AND status IN ('completed_success', 'completed_failure');
  
  -- Calculate winning/losing trades
  SELECT 
    COUNT(*) FILTER (WHERE tr.net_profit_loss > 0),
    COUNT(*) FILTER (WHERE tr.net_profit_loss <= 0)
  INTO v_winning_trades, v_losing_trades
  FROM trade_signals ts
  JOIN trade_results tr ON ts.id = tr.trade_signal_id
  WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
  
  -- Calculate success rate
  v_success_rate := CASE 
    WHEN v_total_trades > 0 THEN (v_winning_trades::DECIMAL / v_total_trades) * 100
    ELSE 0
  END;
  
  -- Calculate profit/loss
  SELECT 
    COALESCE(SUM(tr.net_profit_loss), 0),
    COALESCE(SUM(tr.net_profit_loss) FILTER (WHERE tr.net_profit_loss > 0), 0),
    COALESCE(ABS(SUM(tr.net_profit_loss) FILTER (WHERE tr.net_profit_loss <= 0)), 0),
    COALESCE(AVG(tr.net_profit_loss) FILTER (WHERE tr.net_profit_loss > 0), 0),
    COALESCE(AVG(tr.net_profit_loss) FILTER (WHERE tr.net_profit_loss <= 0), 0)
  INTO v_total_profit_loss, v_total_profit, v_total_loss, v_avg_win, v_avg_loss
  FROM trade_signals ts
  JOIN trade_results tr ON ts.id = tr.trade_signal_id
  WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
  
  -- Find best trade
  SELECT ts.id, tr.net_profit_loss INTO v_best_trade_id, v_best_trade_profit
  FROM trade_signals ts
  JOIN trade_results tr ON ts.id = tr.trade_signal_id
  WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure')
  ORDER BY tr.net_profit_loss DESC
  LIMIT 1;
  
  -- Find worst trade
  SELECT ts.id, tr.net_profit_loss INTO v_worst_trade_id, v_worst_trade_loss
  FROM trade_signals ts
  JOIN trade_results tr ON ts.id = tr.trade_signal_id
  WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure')
  ORDER BY tr.net_profit_loss ASC
  LIMIT 1;
  
  -- Calculate average Galaxy Score for wins vs losses
  SELECT 
    COALESCE(AVG(tms.galaxy_score) FILTER (WHERE tr.net_profit_loss > 0), 0),
    COALESCE(AVG(tms.galaxy_score) FILTER (WHERE tr.net_profit_loss <= 0), 0)
  INTO v_avg_galaxy_wins, v_avg_galaxy_losses
  FROM trade_signals ts
  JOIN trade_results tr ON ts.id = tr.trade_signal_id
  JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
  WHERE ts.user_id = p_user_id AND ts.status IN ('completed_success', 'completed_failure');
  
  -- Insert or update cache
  INSERT INTO atge_performance_cache (
    user_id,
    total_trades,
    winning_trades,
    losing_trades,
    success_rate,
    total_profit_loss,
    total_profit,
    total_loss,
    average_win,
    average_loss,
    best_trade_id,
    best_trade_profit,
    worst_trade_id,
    worst_trade_loss,
    avg_galaxy_score_wins,
    avg_galaxy_score_losses,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_total_trades,
    v_winning_trades,
    v_losing_trades,
    v_success_rate,
    v_total_profit_loss,
    v_total_profit,
    v_total_loss,
    v_avg_win,
    v_avg_loss,
    v_best_trade_id,
    v_best_trade_profit,
    v_worst_trade_id,
    v_worst_trade_loss,
    v_avg_galaxy_wins,
    v_avg_galaxy_losses,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    success_rate = EXCLUDED.success_rate,
    total_profit_loss = EXCLUDED.total_profit_loss,
    total_profit = EXCLUDED.total_profit,
    total_loss = EXCLUDED.total_loss,
    average_win = EXCLUDED.average_win,
    average_loss = EXCLUDED.average_loss,
    best_trade_id = EXCLUDED.best_trade_id,
    best_trade_profit = EXCLUDED.best_trade_profit,
    worst_trade_id = EXCLUDED.worst_trade_id,
    worst_trade_loss = EXCLUDED.worst_trade_loss,
    avg_galaxy_score_wins = EXCLUDED.avg_galaxy_score_wins,
    avg_galaxy_score_losses = EXCLUDED.avg_galaxy_score_losses,
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grants (adjust based on your user setup)
-- =====================================================

-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE trade_signals IS 'AI-generated trade signals with entry, targets, and stop loss (Bitcoin only)';
COMMENT ON TABLE trade_results IS 'Backtesting results and AI analysis of completed trades';
COMMENT ON TABLE trade_technical_indicators IS 'Technical indicators at time of trade generation';
COMMENT ON TABLE trade_market_snapshot IS 'Complete market state including LunarCrush social intelligence';
COMMENT ON TABLE trade_historical_prices IS 'Minute-level OHLCV data for backtesting';
COMMENT ON TABLE atge_performance_cache IS 'Cached performance statistics for fast dashboard loading';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'trade_signals',
    'trade_results',
    'trade_technical_indicators',
    'trade_market_snapshot',
    'trade_historical_prices',
    'atge_performance_cache'
  );
  
  IF table_count = 6 THEN
    RAISE NOTICE '✅ ATGE Migration Complete: All 6 tables created successfully';
  ELSE
    RAISE WARNING '⚠️ ATGE Migration Incomplete: Only % of 6 tables created', table_count;
  END IF;
END $$;
