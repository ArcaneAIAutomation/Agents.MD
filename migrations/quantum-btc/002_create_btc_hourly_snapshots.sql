-- Migration: Create btc_hourly_snapshots table
-- Purpose: Stores hourly market state for trade validation and deviation tracking
-- Requirements: 4.7, 4.8

CREATE TABLE IF NOT EXISTS btc_hourly_snapshots (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_id UUID NOT NULL REFERENCES btc_trades(id) ON DELETE CASCADE,
  
  -- Market Data
  price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(30, 2) NOT NULL,
  market_cap DECIMAL(30, 2) NOT NULL,
  
  -- On-Chain Data
  mempool_size INTEGER NOT NULL,
  whale_transactions INTEGER NOT NULL,
  difficulty DECIMAL(30, 2),
  
  -- Sentiment Data
  sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  social_dominance DECIMAL(5, 2),
  
  -- Validation Metrics
  deviation_from_prediction DECIMAL(10, 4) NOT NULL,
  phase_shift_detected BOOLEAN NOT NULL DEFAULT FALSE,
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Timestamps
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_trade_id ON btc_hourly_snapshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_snapshot_at ON btc_hourly_snapshots(snapshot_at DESC);

-- Add comment
COMMENT ON TABLE btc_hourly_snapshots IS 'Stores hourly market state for trade validation and deviation tracking';
