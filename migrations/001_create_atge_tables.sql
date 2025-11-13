-- Migration: Create ATGE (AI Trade Generation Engine) Tables
-- Description: Creates all tables for AI Trade Generation Engine with indexes and triggers
-- Date: 2025-01-27
-- Author: System

BEGIN;

-- ============================================================================
-- 1. TRADE_SIGNALS TABLE
-- ============================================================================
-- Purpose: Stores all generated trade signals with complete details

CREATE TABLE IF NOT EXISTS trade_signals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Symbol
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL DEFAULT 'BTC',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- Values: 'active', 'completed_success', 'completed_failure', 'expired', 'incomplete_data'
  
  -- Entry & Exit Prices
  entry_price DECIMAL(20, 8) NOT NULL,
  
  -- Take Profit Levels
  tp1_price DECIMAL(20, 8) NOT NULL,
  tp1_allocation DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
  tp2_price DECIMAL(20, 8) NOT NULL,
  tp2_allocation DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  tp3_price DECIMAL(20, 8) NOT NULL,
  tp3_allocation DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  
  -- Stop Loss
  stop_loss_price DECIMAL(20, 8) NOT NULL,
  stop_loss_percentage DECIMAL(5, 2) NOT NULL,
  
  -- Timeframe
  timeframe VARCHAR(10) NOT NULL,
  -- Values: '1h', '4h', '1d', '1w'
  timeframe_hours INTEGER NOT NULL,
  -- Values: 1, 4, 24, 168
  
  -- AI Analysis
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_reward_ratio DECIMAL(10, 2) NOT NULL,
  market_condition VARCHAR(50) NOT NULL,
  -- Values: 'trending', 'ranging', 'volatile'
  ai_reasoning TEXT NOT NULL,
  ai_model_version VARCHAR(100) NOT NULL,
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_signals_user_id ON trade_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_signals_symbol ON trade_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_signals_status ON trade_signals(status);
CREATE INDEX IF NOT EXISTS idx_trade_signals_generated_at ON trade_signals(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_signals_expires_at ON trade_signals(expires_at);

-- ============================================================================
-- 2. TRADE_RESULTS TABLE
-- ============================================================================
-- Purpose: Stores backtesting results and actual outcomes

CREATE TABLE IF NOT EXISTS trade_results (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Actual Prices
  actual_entry_price DECIMAL(20, 8) NOT NULL,
  actual_exit_price DECIMAL(20, 8),
  
  -- Take Profit 1
  tp1_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp1_hit_at TIMESTAMP WITH TIME ZONE,
  tp1_hit_price DECIMAL(20, 8),
  
  -- Take Profit 2
  tp2_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp2_hit_at TIMESTAMP WITH TIME ZONE,
  tp2_hit_price DECIMAL(20, 8),
  
  -- Take Profit 3
  tp3_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp3_hit_at TIMESTAMP WITH TIME ZONE,
  tp3_hit_price DECIMAL(20, 8),
  
  -- Stop Loss
  stop_loss_hit BOOLEAN NOT NULL DEFAULT FALSE,
  stop_loss_hit_at TIMESTAMP WITH TIME ZONE,
  stop_loss_hit_price DECIMAL(20, 8),
  
  -- Profit/Loss Calculations
  profit_loss_usd DECIMAL(20, 2),
  profit_loss_percentage DECIMAL(10, 4),
  trade_duration_minutes INTEGER,
  
  -- Trade Size & Fees
  trade_size_usd DECIMAL(20, 2) NOT NULL DEFAULT 1000.00,
  fees_usd DECIMAL(20, 2) NOT NULL DEFAULT 2.00,
  -- 0.1% entry + 0.1% exit = 0.2% of $1000 = $2
  slippage_usd DECIMAL(20, 2) NOT NULL DEFAULT 2.00,
  -- 0.1% entry + 0.1% exit = 0.2% of $1000 = $2
  net_profit_loss_usd DECIMAL(20, 2),
  
  -- Data Quality
  data_source VARCHAR(50) NOT NULL,
  -- Values: 'CoinMarketCap', 'CoinGecko'
  data_resolution VARCHAR(10) NOT NULL,
  -- Values: '1m', '5m', '1h'
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- AI Analysis
  ai_analysis TEXT,
  
  -- Timestamps
  backtested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_result UNIQUE (trade_signal_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_results_trade_signal_id ON trade_results(trade_signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_results_profit_loss ON trade_results(profit_loss_usd DESC);
CREATE INDEX IF NOT EXISTS idx_trade_results_backtested_at ON trade_results(backtested_at DESC);

-- ============================================================================
-- 3. TRADE_TECHNICAL_INDICATORS TABLE
-- ============================================================================
-- Purpose: Stores technical indicator values at signal generation time

CREATE TABLE IF NOT EXISTS trade_technical_indicators (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- RSI
  rsi_value DECIMAL(10, 4),
  
  -- MACD
  macd_value DECIMAL(20, 8),
  macd_signal DECIMAL(20, 8),
  macd_histogram DECIMAL(20, 8),
  
  -- EMAs
  ema_20 DECIMAL(20, 8),
  ema_50 DECIMAL(20, 8),
  ema_200 DECIMAL(20, 8),
  
  -- Bollinger Bands
  bollinger_upper DECIMAL(20, 8),
  bollinger_middle DECIMAL(20, 8),
  bollinger_lower DECIMAL(20, 8),
  
  -- ATR
  atr_value DECIMAL(20, 8),
  
  -- Volume & Market Cap
  volume_24h DECIMAL(30, 2),
  market_cap DECIMAL(30, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_indicators UNIQUE (trade_signal_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_trade_technical_indicators_trade_signal_id ON trade_technical_indicators(trade_signal_id);

-- ============================================================================
-- 4. TRADE_MARKET_SNAPSHOT TABLE
-- ============================================================================
-- Purpose: Stores market conditions at signal generation time

CREATE TABLE IF NOT EXISTS trade_market_snapshot (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Price Data
  current_price DECIMAL(20, 8) NOT NULL,
  price_change_24h DECIMAL(10, 4),
  volume_24h DECIMAL(30, 2),
  market_cap DECIMAL(30, 2),
  
  -- Sentiment Data
  social_sentiment_score INTEGER CHECK (social_sentiment_score >= 0 AND social_sentiment_score <= 100),
  whale_activity_count INTEGER DEFAULT 0,
  fear_greed_index INTEGER CHECK (fear_greed_index >= 0 AND fear_greed_index <= 100),
  
  -- Timestamps
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_snapshot UNIQUE (trade_signal_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_trade_market_snapshot_trade_signal_id ON trade_market_snapshot(trade_signal_id);

-- ============================================================================
-- 5. TRADE_HISTORICAL_PRICES TABLE
-- ============================================================================
-- Purpose: Stores historical OHLCV data for backtesting and verification

CREATE TABLE IF NOT EXISTS trade_historical_prices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- OHLCV Data
  open_price DECIMAL(20, 8) NOT NULL,
  high_price DECIMAL(20, 8) NOT NULL,
  low_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(30, 2),
  
  -- Data Source
  data_source VARCHAR(50) NOT NULL,
  -- Values: 'CoinMarketCap', 'CoinGecko'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_historical_price UNIQUE (trade_signal_id, timestamp, data_source)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_historical_prices_trade_signal_id ON trade_historical_prices(trade_signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_historical_prices_timestamp ON trade_historical_prices(timestamp);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to trade_signals table
DROP TRIGGER IF EXISTS update_trade_signals_updated_at ON trade_signals;
CREATE TRIGGER update_trade_signals_updated_at
BEFORE UPDATE ON trade_signals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'trade_signals',
    'trade_results',
    'trade_technical_indicators',
    'trade_market_snapshot',
    'trade_historical_prices'
  )
ORDER BY table_name;

-- Verify all indexes were created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'trade_signals',
    'trade_results',
    'trade_technical_indicators',
    'trade_market_snapshot',
    'trade_historical_prices'
  )
ORDER BY tablename, indexname;

-- Verify triggers were created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'trade_signals'
ORDER BY trigger_name;
