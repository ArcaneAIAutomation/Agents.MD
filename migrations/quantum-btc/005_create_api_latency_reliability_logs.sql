-- Migration: Create api_latency_reliability_logs table
-- Purpose: Tracks API performance, latency, and reliability metrics
-- Requirements: 8.10

CREATE TABLE IF NOT EXISTS api_latency_reliability_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- API Details
  api_name VARCHAR(100) NOT NULL,
  -- Values: 'CMC', 'CoinGecko', 'Kraken', 'Blockchain.com', 'LunarCrush', 'GPT-5.1', 'Gemini'
  
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_api_name ON api_latency_reliability_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_requested_at ON api_latency_reliability_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_success ON api_latency_reliability_logs(success);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_status_code ON api_latency_reliability_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_latency_logs_trade_id ON api_latency_reliability_logs(trade_id);

-- Add comment
COMMENT ON TABLE api_latency_reliability_logs IS 'Tracks API performance, latency, and reliability metrics for monitoring';
