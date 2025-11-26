-- Migration: Create btc_trades table
-- Purpose: Stores all generated Bitcoin trade signals with complete quantum reasoning
-- Requirements: 6.1, 6.2

CREATE TABLE IF NOT EXISTS btc_trades (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Symbol
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL DEFAULT 'BTC',
  
  -- Entry Zone
  entry_min DECIMAL(20, 8) NOT NULL,
  entry_max DECIMAL(20, 8) NOT NULL,
  entry_optimal DECIMAL(20, 8) NOT NULL,
  
  -- Take Profit Targets
  tp1_price DECIMAL(20, 8) NOT NULL,
  tp1_allocation INTEGER NOT NULL DEFAULT 50,
  tp2_price DECIMAL(20, 8) NOT NULL,
  tp2_allocation INTEGER NOT NULL DEFAULT 30,
  tp3_price DECIMAL(20, 8) NOT NULL,
  tp3_allocation INTEGER NOT NULL DEFAULT 20,
  
  -- Stop Loss
  stop_loss_price DECIMAL(20, 8) NOT NULL,
  max_loss_percent DECIMAL(5, 2) NOT NULL,
  
  -- Timeframe
  timeframe VARCHAR(10) NOT NULL,
  timeframe_hours INTEGER NOT NULL,
  
  -- Quantum Analysis
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  quantum_reasoning TEXT NOT NULL,
  mathematical_justification TEXT NOT NULL,
  wave_pattern_collapse VARCHAR(50) NOT NULL,
  
  -- Data Quality
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  cross_api_proof JSONB NOT NULL,
  historical_triggers JSONB NOT NULL,
  
  -- Status & Validation
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  -- Values: 'ACTIVE', 'HIT', 'NOT_HIT', 'INVALIDATED', 'EXPIRED'
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_btc_trades_user_id ON btc_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_btc_trades_status ON btc_trades(status);
CREATE INDEX IF NOT EXISTS idx_btc_trades_generated_at ON btc_trades(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_btc_trades_expires_at ON btc_trades(expires_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_btc_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_btc_trades_updated_at
  BEFORE UPDATE ON btc_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_btc_trades_updated_at();

-- Add comment
COMMENT ON TABLE btc_trades IS 'Stores all generated Bitcoin trade signals with complete quantum reasoning';
