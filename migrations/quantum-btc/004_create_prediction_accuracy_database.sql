-- Migration: Create prediction_accuracy_database table
-- Purpose: Tracks overall system performance and accuracy metrics
-- Requirements: 12.1-12.10

CREATE TABLE IF NOT EXISTS prediction_accuracy_database (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Aggregated Metrics
  total_trades INTEGER NOT NULL DEFAULT 0,
  trades_hit INTEGER NOT NULL DEFAULT 0,
  trades_not_hit INTEGER NOT NULL DEFAULT 0,
  trades_invalidated INTEGER NOT NULL DEFAULT 0,
  trades_expired INTEGER NOT NULL DEFAULT 0,
  
  -- Accuracy Metrics
  overall_accuracy_rate DECIMAL(5, 2) NOT NULL,
  average_confidence_winning DECIMAL(5, 2),
  average_confidence_losing DECIMAL(5, 2),
  average_deviation_score DECIMAL(10, 4),
  
  -- Performance by Timeframe
  accuracy_1h DECIMAL(5, 2),
  accuracy_4h DECIMAL(5, 2),
  accuracy_1d DECIMAL(5, 2),
  accuracy_1w DECIMAL(5, 2),
  
  -- Data Quality Trends
  average_data_quality DECIMAL(5, 2),
  api_reliability_cmc DECIMAL(5, 2),
  api_reliability_coingecko DECIMAL(5, 2),
  api_reliability_kraken DECIMAL(5, 2),
  api_reliability_blockchain DECIMAL(5, 2),
  api_reliability_lunarcrush DECIMAL(5, 2),
  
  -- Anomaly Tracking
  total_anomalies INTEGER NOT NULL DEFAULT 0,
  fatal_anomalies INTEGER NOT NULL DEFAULT 0,
  system_suspensions INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_period ON prediction_accuracy_database(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_created_at ON prediction_accuracy_database(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_prediction_accuracy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prediction_accuracy_updated_at
  BEFORE UPDATE ON prediction_accuracy_database
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_accuracy_updated_at();

-- Add comment
COMMENT ON TABLE prediction_accuracy_database IS 'Tracks overall system performance and accuracy metrics';
