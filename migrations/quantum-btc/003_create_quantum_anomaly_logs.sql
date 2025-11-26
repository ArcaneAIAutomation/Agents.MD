-- Migration: Create quantum_anomaly_logs table
-- Purpose: Tracks all detected anomalies and system suspensions
-- Requirements: 4.14

CREATE TABLE IF NOT EXISTS quantum_anomaly_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Anomaly Details
  anomaly_type VARCHAR(100) NOT NULL,
  -- Values: 'PRICE_DIVERGENCE', 'MEMPOOL_ZERO', 'WHALE_COUNT_LOW', 'PHASE_SHIFT', 'DATA_QUALITY_LOW'
  
  severity VARCHAR(20) NOT NULL,
  -- Values: 'INFO', 'WARNING', 'ERROR', 'FATAL'
  
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_severity ON quantum_anomaly_logs(severity);
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_detected_at ON quantum_anomaly_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_trade_id ON quantum_anomaly_logs(trade_id);
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_anomaly_type ON quantum_anomaly_logs(anomaly_type);

-- Add comment
COMMENT ON TABLE quantum_anomaly_logs IS 'Tracks all detected anomalies and system suspensions';
