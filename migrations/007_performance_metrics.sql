-- Migration: Performance Metrics Table
-- Purpose: Store performance monitoring data for the Quantum BTC Super Spec
-- Requirements: 14.1-14.10

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric Type
  metric_type VARCHAR(50) NOT NULL,
  -- Values: 'api_response', 'db_query', 'error_rate', 'system_health'
  
  -- Metric Details
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(20, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  -- Values: 'ms', 'count', 'percentage', 'bytes'
  
  -- Context (JSON for additional data)
  context JSONB,
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_type_timestamp ON performance_metrics(metric_type, timestamp DESC);

-- Create index for cleanup queries
CREATE INDEX idx_performance_metrics_cleanup ON performance_metrics(timestamp) WHERE timestamp < NOW() - INTERVAL '30 days';

-- Add comment
COMMENT ON TABLE performance_metrics IS 'Stores performance monitoring metrics for API responses, database queries, error rates, and system health';
