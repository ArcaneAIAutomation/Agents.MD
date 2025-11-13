-- Migration: Create ATGE Monitoring Tables
-- Description: Creates tables for error tracking, performance monitoring, and user feedback
-- Date: 2025-01-XX
-- Author: System

BEGIN;

-- ============================================================================
-- Error Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS atge_error_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Error Details
  error_type VARCHAR(50) NOT NULL,
  -- Values: 'api', 'database', 'generation', 'backtesting', 'analysis', 'frontend'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trade_signal_id UUID REFERENCES trade_signals(id) ON DELETE SET NULL,
  context JSONB,
  
  -- Severity
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  -- Values: 'low', 'medium', 'high', 'critical'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for error logs
CREATE INDEX idx_atge_error_logs_timestamp ON atge_error_logs(timestamp DESC);
CREATE INDEX idx_atge_error_logs_error_type ON atge_error_logs(error_type);
CREATE INDEX idx_atge_error_logs_severity ON atge_error_logs(severity);
CREATE INDEX idx_atge_error_logs_user_id ON atge_error_logs(user_id);
CREATE INDEX idx_atge_error_logs_trade_signal_id ON atge_error_logs(trade_signal_id);

-- ============================================================================
-- Performance Metrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS atge_performance_metrics (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Metric Details
  metric_type VARCHAR(50) NOT NULL,
  -- Values: 'api_response', 'database_query', 'generation_time', 'backtest_time', 'analysis_time'
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(20, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  -- Values: 'ms', 'seconds', 'count'
  
  -- Context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trade_signal_id UUID REFERENCES trade_signals(id) ON DELETE SET NULL,
  metadata JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX idx_atge_performance_metrics_timestamp ON atge_performance_metrics(timestamp DESC);
CREATE INDEX idx_atge_performance_metrics_metric_type ON atge_performance_metrics(metric_type);
CREATE INDEX idx_atge_performance_metrics_value ON atge_performance_metrics(value DESC);
CREATE INDEX idx_atge_performance_metrics_user_id ON atge_performance_metrics(user_id);
CREATE INDEX idx_atge_performance_metrics_trade_signal_id ON atge_performance_metrics(trade_signal_id);

-- ============================================================================
-- User Feedback Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS atge_user_feedback (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Feedback Details
  feedback_type VARCHAR(50) NOT NULL,
  -- Values: 'trade_accuracy', 'ui_experience', 'performance', 'feature_request', 'bug_report'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Context
  trade_signal_id UUID REFERENCES trade_signals(id) ON DELETE SET NULL,
  metadata JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for user feedback
CREATE INDEX idx_atge_user_feedback_timestamp ON atge_user_feedback(timestamp DESC);
CREATE INDEX idx_atge_user_feedback_user_id ON atge_user_feedback(user_id);
CREATE INDEX idx_atge_user_feedback_feedback_type ON atge_user_feedback(feedback_type);
CREATE INDEX idx_atge_user_feedback_rating ON atge_user_feedback(rating);
CREATE INDEX idx_atge_user_feedback_trade_signal_id ON atge_user_feedback(trade_signal_id);

-- ============================================================================
-- Monitoring Views (Optional - for easier querying)
-- ============================================================================

-- View: Recent Critical Errors
CREATE OR REPLACE VIEW atge_recent_critical_errors AS
SELECT 
  id,
  timestamp,
  error_type,
  error_message,
  user_id,
  trade_signal_id,
  context
FROM atge_error_logs
WHERE severity = 'critical'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- View: Performance Summary (Last 24 Hours)
CREATE OR REPLACE VIEW atge_performance_summary_24h AS
SELECT 
  metric_type,
  COUNT(*) as total_measurements,
  AVG(value) as average_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) as p99_value
FROM atge_performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_type;

-- View: User Feedback Summary
CREATE OR REPLACE VIEW atge_feedback_summary AS
SELECT 
  feedback_type,
  COUNT(*) as total_feedback,
  AVG(rating) as average_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback
FROM atge_user_feedback
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY feedback_type;

COMMIT;
