-- Migration: Database Query Optimizations
-- Purpose: Add missing indexes and optimize slow queries
-- Requirements: All database requirements

-- ============================================================================
-- BTC TRADES TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for user's active trades (common query pattern)
CREATE INDEX IF NOT EXISTS idx_btc_trades_user_status 
ON btc_trades(user_id, status) 
WHERE status = 'ACTIVE';

-- Index for trade expiration checks (used by HQVE)
CREATE INDEX IF NOT EXISTS idx_btc_trades_expires_status 
ON btc_trades(expires_at, status) 
WHERE status IN ('ACTIVE', 'HIT', 'NOT_HIT');

-- Index for performance queries (accuracy by timeframe)
CREATE INDEX IF NOT EXISTS idx_btc_trades_timeframe_status 
ON btc_trades(timeframe, status, confidence_score);

-- Index for data quality analysis
CREATE INDEX IF NOT EXISTS idx_btc_trades_quality_score 
ON btc_trades(data_quality_score, generated_at DESC);

-- Partial index for recent active trades (hot data)
CREATE INDEX IF NOT EXISTS idx_btc_trades_recent_active 
ON btc_trades(generated_at DESC, user_id) 
WHERE status = 'ACTIVE' AND generated_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- BTC HOURLY SNAPSHOTS TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for trade validation queries
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_trade_snapshot 
ON btc_hourly_snapshots(trade_id, snapshot_at DESC);

-- Index for deviation analysis
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_deviation 
ON btc_hourly_snapshots(deviation_from_prediction, snapshot_at DESC);

-- Index for phase shift detection
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_phase_shift 
ON btc_hourly_snapshots(phase_shift_detected, snapshot_at DESC) 
WHERE phase_shift_detected = true;

-- Index for data quality tracking
CREATE INDEX IF NOT EXISTS idx_btc_hourly_snapshots_quality 
ON btc_hourly_snapshots(data_quality_score, snapshot_at DESC);

-- ============================================================================
-- QUANTUM ANOMALY LOGS TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for active anomalies
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_active 
ON quantum_anomaly_logs(severity, detected_at DESC) 
WHERE resolved_at IS NULL;

-- Index for system suspension queries
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_suspension 
ON quantum_anomaly_logs(system_suspended, detected_at DESC) 
WHERE system_suspended = true;

-- Index for anomaly type analysis
CREATE INDEX IF NOT EXISTS idx_quantum_anomaly_logs_type_severity 
ON quantum_anomaly_logs(anomaly_type, severity, detected_at DESC);

-- ============================================================================
-- PREDICTION ACCURACY DATABASE TABLE OPTIMIZATIONS
-- ============================================================================

-- Index for time-based accuracy queries
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_period 
ON prediction_accuracy_database(period_start DESC, period_end DESC);

-- Index for accuracy rate queries
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_rate 
ON prediction_accuracy_database(overall_accuracy_rate, period_start DESC);

-- ============================================================================
-- PERFORMANCE METRICS TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for metric type and time range queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_time 
ON performance_metrics(metric_type, metric_name, timestamp DESC);

-- Partial index for recent metrics (hot data)
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recent 
ON performance_metrics(timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_performance_metrics_old 
ON performance_metrics(timestamp) 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- ============================================================================
-- SYSTEM ALERTS TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for active alerts by severity
CREATE INDEX IF NOT EXISTS idx_system_alerts_active_severity 
ON system_alerts(severity, triggered_at DESC) 
WHERE resolved_at IS NULL;

-- Index for alert resolution tracking
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved 
ON system_alerts(resolved_at DESC, resolved_by) 
WHERE resolved_at IS NOT NULL;

-- ============================================================================
-- QUERY OPTIMIZATION VIEWS
-- ============================================================================

-- View for active trades with latest snapshot
CREATE OR REPLACE VIEW v_active_trades_with_snapshot AS
SELECT 
  t.*,
  s.price as current_price,
  s.deviation_from_prediction,
  s.phase_shift_detected,
  s.snapshot_at as last_snapshot_at
FROM btc_trades t
LEFT JOIN LATERAL (
  SELECT *
  FROM btc_hourly_snapshots
  WHERE trade_id = t.id
  ORDER BY snapshot_at DESC
  LIMIT 1
) s ON true
WHERE t.status = 'ACTIVE';

-- View for trade performance summary
CREATE OR REPLACE VIEW v_trade_performance_summary AS
SELECT 
  timeframe,
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE status = 'HIT') as trades_hit,
  COUNT(*) FILTER (WHERE status = 'NOT_HIT') as trades_not_hit,
  COUNT(*) FILTER (WHERE status = 'INVALIDATED') as trades_invalidated,
  COUNT(*) FILTER (WHERE status = 'EXPIRED') as trades_expired,
  AVG(confidence_score) as avg_confidence,
  AVG(data_quality_score) as avg_data_quality,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'HIT')::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE status IN ('HIT', 'NOT_HIT')), 0)) * 100,
    2
  ) as accuracy_rate
FROM btc_trades
WHERE generated_at > NOW() - INTERVAL '30 days'
GROUP BY timeframe;

-- View for API reliability summary
CREATE OR REPLACE VIEW v_api_reliability_summary AS
SELECT 
  metric_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE (context->>'success')::boolean = true) as successful_calls,
  COUNT(*) FILTER (WHERE (context->>'success')::boolean = false) as failed_calls,
  ROUND(
    (COUNT(*) FILTER (WHERE (context->>'success')::boolean = true)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) as success_rate,
  ROUND(AVG(value), 2) as avg_response_time_ms
FROM performance_metrics
WHERE metric_type = 'api_response'
AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_name
ORDER BY success_rate ASC;

-- View for system health dashboard
CREATE OR REPLACE VIEW v_system_health_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM btc_trades WHERE status = 'ACTIVE') as active_trades,
  (SELECT COUNT(*) FROM btc_trades WHERE generated_at > NOW() - INTERVAL '24 hours') as trades_24h,
  (SELECT COUNT(*) FROM quantum_anomaly_logs WHERE detected_at > NOW() - INTERVAL '24 hours') as anomalies_24h,
  (SELECT COUNT(*) FROM system_alerts WHERE resolved_at IS NULL) as active_alerts,
  (SELECT AVG(value) FROM performance_metrics WHERE metric_type = 'api_response' AND timestamp > NOW() - INTERVAL '1 hour') as avg_api_response_ms,
  (SELECT AVG(value) FROM performance_metrics WHERE metric_type = 'db_query' AND timestamp > NOW() - INTERVAL '1 hour') as avg_db_query_ms,
  (SELECT overall_accuracy_rate FROM prediction_accuracy_database ORDER BY created_at DESC LIMIT 1) as current_accuracy_rate;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to analyze and suggest missing indexes
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE (
  table_name TEXT,
  index_suggestion TEXT,
  estimated_improvement TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    'Consider adding index on: ' || attname as index_suggestion,
    'High' as estimated_improvement
  FROM pg_stats
  WHERE schemaname = 'public'
  AND tablename IN ('btc_trades', 'btc_hourly_snapshots', 'quantum_anomaly_logs', 'performance_metrics')
  AND n_distinct > 100
  AND correlation < 0.5
  ORDER BY n_distinct DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE (
  table_name TEXT,
  rows_deleted INTEGER
) AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
  deleted_count INTEGER;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
  
  -- Cleanup old performance metrics
  DELETE FROM performance_metrics WHERE timestamp < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'performance_metrics';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Cleanup old resolved alerts
  DELETE FROM system_alerts WHERE resolved_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'system_alerts';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  -- Cleanup old resolved anomalies
  DELETE FROM quantum_anomaly_logs WHERE resolved_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  table_name := 'quantum_anomaly_logs';
  rows_deleted := deleted_count;
  RETURN NEXT;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS TEXT AS $$
BEGIN
  VACUUM ANALYZE btc_trades;
  VACUUM ANALYZE btc_hourly_snapshots;
  VACUUM ANALYZE quantum_anomaly_logs;
  VACUUM ANALYZE prediction_accuracy_database;
  VACUUM ANALYZE performance_metrics;
  VACUUM ANALYZE system_alerts;
  
  RETURN 'All tables optimized successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STATISTICS AND MONITORING
-- ============================================================================

-- Update statistics for better query planning
ANALYZE btc_trades;
ANALYZE btc_hourly_snapshots;
ANALYZE quantum_anomaly_logs;
ANALYZE prediction_accuracy_database;
ANALYZE performance_metrics;
ANALYZE system_alerts;

-- Add comments for documentation
COMMENT ON VIEW v_active_trades_with_snapshot IS 'Shows active trades with their most recent snapshot data';
COMMENT ON VIEW v_trade_performance_summary IS 'Aggregates trade performance metrics by timeframe';
COMMENT ON VIEW v_api_reliability_summary IS 'Shows API reliability metrics for the last 24 hours';
COMMENT ON VIEW v_system_health_dashboard IS 'Provides a quick overview of system health metrics';
COMMENT ON FUNCTION analyze_query_performance() IS 'Analyzes query performance and suggests missing indexes';
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'Cleans up old data from monitoring tables';
COMMENT ON FUNCTION optimize_tables() IS 'Vacuums and analyzes all tables for optimal performance';
