-- Veritas Protocol - Validation Metrics Table
-- 
-- Tracks validation attempts, successes, failures, and performance metrics
-- for monitoring and analysis of the Veritas Protocol validation system.
--
-- Requirements: 14.3, 10.1, 14.1

-- Create validation metrics table
CREATE TABLE IF NOT EXISTS veritas_validation_metrics (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  success BOOLEAN NOT NULL,
  completed BOOLEAN NOT NULL,
  halted BOOLEAN NOT NULL,
  timed_out BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  confidence_score INTEGER,
  data_quality_score INTEGER,
  total_alerts INTEGER NOT NULL DEFAULT 0,
  critical_alerts INTEGER NOT NULL DEFAULT 0,
  error_alerts INTEGER NOT NULL DEFAULT 0,
  warning_alerts INTEGER NOT NULL DEFAULT 0,
  info_alerts INTEGER NOT NULL DEFAULT 0,
  completed_steps JSONB,
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_veritas_metrics_symbol ON veritas_validation_metrics(symbol);
CREATE INDEX IF NOT EXISTS idx_veritas_metrics_timestamp ON veritas_validation_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_veritas_metrics_success ON veritas_validation_metrics(success);
CREATE INDEX IF NOT EXISTS idx_veritas_metrics_created_at ON veritas_validation_metrics(created_at);

-- Add comment
COMMENT ON TABLE veritas_validation_metrics IS 'Tracks Veritas Protocol validation attempts and performance metrics';

