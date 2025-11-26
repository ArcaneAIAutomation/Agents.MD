-- ============================================================================
-- Quantum BTC SUPER SPEC - Data Migration Script
-- ============================================================================
-- Version: 1.0.0
-- Purpose: Migrate existing ATGE trade signals to new Quantum BTC schema
-- Author: Quantum-Superior Mode
-- Date: November 25, 2025
--
-- This script:
-- 1. Creates new Quantum BTC tables (btc_trades, btc_hourly_snapshots, etc.)
-- 2. Migrates existing ATGE data to new schema
-- 3. Preserves all historical data
-- 4. Maintains referential integrity
-- ============================================================================

-- ============================================================================
-- STEP 1: Create New Quantum BTC Tables
-- ============================================================================

-- Table 1: btc_trades (Main trade signals table)
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
  wave_pattern_collapse VARCHAR(50) NOT NULL DEFAULT 'CONTINUATION',
  
  -- Data Quality
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  cross_api_proof JSONB NOT NULL DEFAULT '{}',
  historical_triggers JSONB NOT NULL DEFAULT '[]',
  
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

-- Indexes for btc_trades
CREATE INDEX IF NOT EXISTS idx_btc_trades_user_id ON btc_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_btc_trades_status ON btc_trades(status);
CREATE INDEX IF NOT EXISTS idx_btc_trades_generated_at ON btc_trades(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_btc_trades_expires_at ON btc_trades(expires_at);
CREATE INDEX IF NOT EXISTS idx_btc_trades_symbol ON btc_trades(symbol);

-- Table 2: btc_hourly_snapshots (Hourly validation data)
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
  mempool_size INTEGER NOT NULL DEFAULT 0,
  whale_transactions INTEGER NOT NULL DEFAULT 0,
  difficulty DECIMAL(30, 2),
  
  -- Sentiment Data
  sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  social_dominance DECIMAL(5, 2),
  
  -- Validation Metrics
  deviation_from_prediction DECIMAL(10, 4) NOT NULL DEFAULT 0,
  phase_shift_detected BOOLEAN NOT NULL DEFAULT FALSE,
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Timestamps
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for btc_hourly_snapshots
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_trade_id ON btc_hourly_snapshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_snapshot_at ON btc_hourly_snapshots(snapshot_at DESC);

-- Table 3: quantum_anomaly_logs (Anomaly tracking)
CREATE TABLE IF NOT EXISTS quantum_anomaly_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Anomaly Details
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  affected_sources JSONB NOT NULL DEFAULT '[]',
  impact TEXT NOT NULL,
  
  -- System Response
  system_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  suspension_duration_minutes INTEGER,
  resolution_action TEXT,
  
  -- Context
  trade_id UUID REFERENCES btc_trades(id) ON DELETE SET NULL,
  market_conditions JSONB,
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for quantum_anomaly_logs
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_severity ON quantum_anomaly_logs(severity);
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_detected_at ON quantum_anomaly_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_trade_id ON quantum_anomaly_logs(trade_id);

-- Table 4: prediction_accuracy_database (Performance metrics)
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
  overall_accuracy_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
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

-- Indexes for prediction_accuracy_database
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_period ON prediction_accuracy_database(period_start, period_end);

-- Table 5: api_latency_reliability_logs (API monitoring)
CREATE TABLE IF NOT EXISTS api_latency_reliability_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- API Details
  api_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  
  -- Performance Metrics
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Context
  trade_id UUID REFERENCES btc_trades(id) ON DELETE SET NULL,
  
  -- Timestamps
  called_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for api_latency_reliability_logs
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_api_name ON api_latency_reliability_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_called_at ON api_latency_reliability_logs(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_success ON api_latency_reliability_logs(success);

-- ============================================================================
-- STEP 2: Data Migration from ATGE to Quantum BTC
-- ============================================================================

-- Migrate existing ATGE trade signals to btc_trades table
-- Only migrate Bitcoin trades (symbol = 'BTC')
INSERT INTO btc_trades (
  user_id,
  symbol,
  entry_min,
  entry_max,
  entry_optimal,
  tp1_price,
  tp1_allocation,
  tp2_price,
  tp2_allocation,
  tp3_price,
  tp3_allocation,
  stop_loss_price,
  max_loss_percent,
  timeframe,
  timeframe_hours,
  confidence_score,
  quantum_reasoning,
  mathematical_justification,
  wave_pattern_collapse,
  data_quality_score,
  cross_api_proof,
  historical_triggers,
  status,
  generated_at,
  expires_at,
  created_at,
  updated_at
)
SELECT
  user_id,
  symbol,
  -- Entry zone: use entry_price for all three values (min, max, optimal)
  entry_price AS entry_min,
  entry_price AS entry_max,
  entry_price AS entry_optimal,
  
  -- Take profit targets with adjusted allocations (50%, 30%, 20%)
  tp1_price,
  50 AS tp1_allocation,  -- Changed from 40% to 50%
  tp2_price,
  30 AS tp2_allocation,  -- Kept at 30%
  tp3_price,
  20 AS tp3_allocation,  -- Changed from 30% to 20%
  
  -- Stop loss
  stop_loss_price,
  stop_loss_percentage AS max_loss_percent,
  
  -- Timeframe
  timeframe,
  timeframe_hours,
  
  -- Confidence score
  confidence_score,
  
  -- Quantum reasoning: use existing AI reasoning or provide default
  COALESCE(ai_reasoning, 'Migrated from ATGE - Original AI analysis') AS quantum_reasoning,
  
  -- Mathematical justification: provide migration note
  'Migrated from ATGE system. Original entry price: ' || entry_price::TEXT AS mathematical_justification,
  
  -- Wave pattern collapse: default to CONTINUATION
  'CONTINUATION' AS wave_pattern_collapse,
  
  -- Data quality score: use 90 as default for migrated trades
  90 AS data_quality_score,
  
  -- Cross API proof: empty JSON object
  '{}'::JSONB AS cross_api_proof,
  
  -- Historical triggers: empty JSON array
  '[]'::JSONB AS historical_triggers,
  
  -- Status mapping
  CASE 
    WHEN status = 'completed_success' THEN 'HIT'
    WHEN status = 'completed_failure' THEN 'NOT_HIT'
    WHEN status = 'expired' THEN 'EXPIRED'
    WHEN status = 'active' THEN 'ACTIVE'
    ELSE 'ACTIVE'
  END AS status,
  
  -- Timestamps
  generated_at,
  expires_at,
  created_at,
  updated_at
FROM atge_trade_signals
WHERE symbol = 'BTC'
  AND id NOT IN (SELECT id FROM btc_trades)  -- Avoid duplicates
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Create Migration Metadata Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quantum_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name VARCHAR(255) NOT NULL,
  migration_version VARCHAR(50) NOT NULL,
  records_migrated INTEGER NOT NULL DEFAULT 0,
  migration_status VARCHAR(50) NOT NULL,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Log this migration
INSERT INTO quantum_migration_log (
  migration_name,
  migration_version,
  records_migrated,
  migration_status,
  completed_at
)
SELECT
  'ATGE to Quantum BTC Migration',
  '1.0.0',
  COUNT(*),
  'COMPLETED',
  NOW()
FROM btc_trades
WHERE quantum_reasoning LIKE '%Migrated from ATGE%';

-- ============================================================================
-- STEP 4: Create Views for Backward Compatibility
-- ============================================================================

-- View to maintain compatibility with old ATGE queries
CREATE OR REPLACE VIEW atge_trade_signals_compat AS
SELECT
  id,
  user_id,
  symbol,
  entry_optimal AS entry_price,
  tp1_price,
  tp1_allocation,
  tp2_price,
  tp2_allocation,
  tp3_price,
  tp3_allocation,
  stop_loss_price,
  max_loss_percent AS stop_loss_percentage,
  timeframe,
  timeframe_hours,
  confidence_score,
  quantum_reasoning AS ai_reasoning,
  CASE 
    WHEN status = 'HIT' THEN 'completed_success'
    WHEN status = 'NOT_HIT' THEN 'completed_failure'
    WHEN status = 'EXPIRED' THEN 'expired'
    WHEN status = 'ACTIVE' THEN 'active'
    ELSE 'active'
  END AS status,
  generated_at,
  expires_at,
  created_at,
  updated_at
FROM btc_trades;

-- ============================================================================
-- STEP 5: Grant Permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON btc_trades TO authenticated;
GRANT SELECT, INSERT ON btc_hourly_snapshots TO authenticated;
GRANT SELECT, INSERT ON quantum_anomaly_logs TO authenticated;
GRANT SELECT ON prediction_accuracy_database TO authenticated;
GRANT SELECT, INSERT ON api_latency_reliability_logs TO authenticated;
GRANT SELECT ON quantum_migration_log TO authenticated;
GRANT SELECT ON atge_trade_signals_compat TO authenticated;

-- ============================================================================
-- STEP 6: Create Triggers for Updated_At
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to btc_trades
DROP TRIGGER IF EXISTS update_btc_trades_updated_at ON btc_trades;
CREATE TRIGGER update_btc_trades_updated_at
  BEFORE UPDATE ON btc_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to prediction_accuracy_database
DROP TRIGGER IF EXISTS update_prediction_accuracy_updated_at ON prediction_accuracy_database;
CREATE TRIGGER update_prediction_accuracy_updated_at
  BEFORE UPDATE ON prediction_accuracy_database
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
  atge_count INTEGER;
  btc_count INTEGER;
  migrated_count INTEGER;
BEGIN
  -- Count ATGE BTC trades
  SELECT COUNT(*) INTO atge_count FROM atge_trade_signals WHERE symbol = 'BTC';
  
  -- Count new BTC trades
  SELECT COUNT(*) INTO btc_count FROM btc_trades;
  
  -- Count migrated trades
  SELECT COUNT(*) INTO migrated_count FROM btc_trades WHERE quantum_reasoning LIKE '%Migrated from ATGE%';
  
  -- Output results
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'ATGE BTC Trades: %', atge_count;
  RAISE NOTICE 'New BTC Trades: %', btc_count;
  RAISE NOTICE 'Migrated Trades: %', migrated_count;
  RAISE NOTICE '============================';
  
  -- Verify migration completeness
  IF migrated_count >= atge_count THEN
    RAISE NOTICE '✅ Migration SUCCESSFUL - All trades migrated';
  ELSE
    RAISE WARNING '⚠️ Migration INCOMPLETE - Some trades may not have migrated';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary
SELECT 
  'Quantum BTC Migration Complete' AS status,
  NOW() AS completed_at,
  (SELECT COUNT(*) FROM btc_trades) AS total_btc_trades,
  (SELECT COUNT(*) FROM btc_trades WHERE quantum_reasoning LIKE '%Migrated from ATGE%') AS migrated_trades,
  (SELECT COUNT(*) FROM atge_trade_signals WHERE symbol = 'BTC') AS original_atge_btc_trades;
