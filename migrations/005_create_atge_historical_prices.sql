-- Migration: Create ATGE Historical Prices Table
-- Description: Creates table for storing historical OHLCV data for backtesting
-- Date: 2025-01-27
-- Author: System
-- Task: Task 5.1 - Create Supabase Table for Historical OHLCV Data

BEGIN;

-- ============================================================================
-- ATGE_HISTORICAL_PRICES TABLE
-- ============================================================================
-- Purpose: Store historical OHLCV (Open, High, Low, Close, Volume) price data
--          for backtesting trade signals

CREATE TABLE IF NOT EXISTS atge_historical_prices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Symbol (e.g., 'BTC', 'ETH', 'SOL')
  symbol VARCHAR(10) NOT NULL,
  
  -- Timestamp of the candle
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- OHLCV Data
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  
  -- Timeframe (e.g., '15m', '1h', '4h', '1d', '1w')
  timeframe VARCHAR(10) NOT NULL,
  
  -- Data Source (e.g., 'coingecko', 'coinmarketcap')
  data_source VARCHAR(50) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_ohlc CHECK (
    high >= open AND 
    high >= close AND 
    low <= open AND 
    low <= close
  ),
  CONSTRAINT valid_prices CHECK (
    open > 0 AND 
    high > 0 AND 
    low > 0 AND 
    close > 0 AND 
    volume >= 0
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Purpose: Optimize query performance for backtesting lookups

-- Primary lookup index: (symbol, timestamp, timeframe)
-- Used for: Fetching historical data for a specific symbol and timeframe
CREATE INDEX IF NOT EXISTS idx_historical_prices_lookup 
ON atge_historical_prices(symbol, timestamp, timeframe);

-- Symbol-timeframe index: (symbol, timeframe)
-- Used for: Querying all data for a symbol in a specific timeframe
CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol_timeframe 
ON atge_historical_prices(symbol, timeframe);

-- Timestamp index: (timestamp DESC)
-- Used for: Finding most recent data
CREATE INDEX IF NOT EXISTS idx_historical_prices_timestamp 
ON atge_historical_prices(timestamp DESC);

-- Data source index: (data_source)
-- Used for: Filtering by data source
CREATE INDEX IF NOT EXISTS idx_historical_prices_data_source 
ON atge_historical_prices(data_source);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'atge_historical_prices';

-- Verify columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'atge_historical_prices'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'atge_historical_prices'
ORDER BY indexname;

-- Verify constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'atge_historical_prices'::regclass
ORDER BY conname;
