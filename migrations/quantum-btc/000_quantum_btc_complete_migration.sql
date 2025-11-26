-- ============================================================================
-- QUANTUM BTC SUPER SPEC - COMPLETE DATABASE MIGRATION
-- ============================================================================
-- Version: 1.0.0
-- Purpose: Create all database tables for Quantum Bitcoin Intelligence Engine
-- Requirements: 6.1-6.5
-- 
-- This migration creates 5 tables:
-- 1. btc_trades - Trade signals with quantum reasoning
-- 2. btc_hourly_snapshots - Hourly market validation data
-- 3. quantum_anomaly_logs - System anomaly tracking
-- 4. prediction_accuracy_database - Performance metrics
-- 5. api_latency_reliability_logs - API monitoring
-- ============================================================================

-- Begin transaction for atomic migration
BEGIN;

-- ============================================================================
-- TABLE 1: btc_trades
-- Purpose: Stores all generated Bitcoin trade signals with complete quantum reasoning
-- Requirements: 6.1, 6.2
-- ============================================================================

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

-- Trigger for btc_trades updated_at
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

COMMENT ON TABLE btc_trades IS 'Stores all generated Bitcoin trade signals with complete quantum reasoning';

-- ============================================================================
-- TABLE 2: btc_hourly_snapshots
-- Purpose: Stores hourly market state for trade validation and deviation tracking
-- Requirements: 4.7, 4.8
-- ============================================================================

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

-- Indexes for btc_hourly_snapshots
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_trade_id ON btc_hourly_snapshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_snapshot_at ON btc_hourly_snapshots(snapshot_at DESC);

COMMENT ON TABLE btc_hourly_snapshots IS 'Stores hourly market state for trade validation and deviation tracking';

-- ============================================================================
-- TABLE 3: quantum_anomaly_logs
-- Purpose: Tracks all detected anomalies and system suspensions
-- Requirements: 4.14
-- ============================================================================

CREATE TABLE IF NOT EXISTS quantum_anomaly_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Anomaly Details
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  affected_sources JSONB NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_anomaly_type ON quantum_anomaly_logs(anomaly_type);

COMMENT ON TABLE quantum_anomaly_logs IS 'Tracks all detected anomalies and system suspensions';

-- ============================================================================
-- TABLE 4: prediction_accuracy_database
-- Purpose: Tracks overall system performance and accuracy metrics
-- Requirements: 12.1-12.10
-- ============================================================================

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

-- Indexes for prediction_accuracy_database
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_period ON prediction_accuracy_database(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_created_at ON prediction_accuracy_database(created_at DESC);

-- Trigger for prediction_accuracy_database updated_at
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

COMMENT ON TABLE prediction_accuracy_database IS 'Tracks overall system performance and accuracy metrics';

-- ============================================================================
-- TABLE 5: api_latency_reliability_logs
-- Purpose: Tracks API performance, latency, and reliability metrics
-- Requirements: 8.10
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_latency_reliability_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- API Details
  api_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL DEFAULT 'GET',
  
  -- Performance Metrics
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  
  -- Error Details
  error_message TEXT,
  error_type VARCHAR(100),
  
  -- Request Context
  request_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trade_id UUID REFERENCES btc_trades(id) ON DELETE SET NULL,
  
  -- Additional Metadata
  request_payload JSONB,
  response_size_bytes INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for api_latency_reliability_logs
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_api_name ON api_latency_reliability_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_requested_at ON api_latency_reliability_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_success ON api_latency_reliability_logs(success);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_status_code ON api_latency_reliability_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_trade_id ON api_latency_reliability_logs(trade_id);

COMMENT ON TABLE api_latency_reliability_logs IS 'Tracks API performance, latency, and reliability metrics for monitoring';

-- ============================================================================
-- COMMIT MIGRATION
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify success:
--
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'btc_%' OR table_name LIKE 'quantum_%' OR table_name LIKE 'prediction_%' OR table_name LIKE 'api_%';
--
-- SELECT COUNT(*) as index_count FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND (tablename LIKE 'btc_%' OR tablename LIKE 'quantum_%' OR tablename LIKE 'prediction_%' OR tablename LIKE 'api_%');
-- ============================================================================
