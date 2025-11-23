-- ============================================================================
-- ATGE Monitoring Tables Migration
-- Bitcoin Sovereign Technology - AI Trade Generation Engine
--
-- This migration adds tables for production monitoring:
-- - cron_execution_logs: Track cron job executions
-- - monitoring_reports: Store monitoring reports
-- - api_usage_logs: Track API usage and costs
--
-- Requirements: Task 47
-- ============================================================================

-- Create cron_execution_logs table
-- Requirements: Task 47 - Check Vercel logs for errors, Verify cron job runs hourly
CREATE TABLE IF NOT EXISTS cron_execution_logs (
    id SERIAL PRIMARY KEY,
    cron_job VARCHAR(100) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    trades_verified INTEGER DEFAULT 0,
    trades_updated INTEGER DEFAULT 0,
    trades_failed INTEGER DEFAULT 0,
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_execution_logs_job_time 
    ON cron_execution_logs(cron_job, executed_at DESC);

-- Create index for success rate queries
CREATE INDEX IF NOT EXISTS idx_cron_execution_logs_success 
    ON cron_execution_logs(cron_job, success, executed_at DESC);

-- Create monitoring_reports table
-- Requirements: Task 47 - Set up alerts for failures
CREATE TABLE IF NOT EXISTS monitoring_reports (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    overall_health VARCHAR(20) NOT NULL CHECK (overall_health IN ('healthy', 'warning', 'critical')),
    cron_job_status VARCHAR(20) NOT NULL CHECK (cron_job_status IN ('healthy', 'warning', 'critical')),
    trade_verification_status VARCHAR(20) NOT NULL CHECK (trade_verification_status IN ('healthy', 'warning', 'critical')),
    api_cost_status VARCHAR(20) NOT NULL CHECK (api_cost_status IN ('healthy', 'warning', 'critical')),
    alerts_count INTEGER DEFAULT 0,
    report_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_monitoring_reports_timestamp 
    ON monitoring_reports(timestamp DESC);

-- Create index for health status queries
CREATE INDEX IF NOT EXISTS idx_monitoring_reports_health 
    ON monitoring_reports(overall_health, timestamp DESC);

-- Create api_usage_logs table
-- Requirements: Task 47 - Monitor OpenAI API costs, Monitor CoinMarketCap API usage
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL,
    endpoint VARCHAR(200),
    request_type VARCHAR(50),
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    tokens_used INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for API usage queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_time 
    ON api_usage_logs(api_name, created_at DESC);

-- Create index for cost tracking
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_cost 
    ON api_usage_logs(api_name, cost_usd, created_at DESC);

-- Create index for success rate queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_success 
    ON api_usage_logs(api_name, success, created_at DESC);

-- Create function to log cron execution
-- Requirements: Task 47 - Check Vercel logs for errors
CREATE OR REPLACE FUNCTION log_cron_execution(
    p_cron_job VARCHAR,
    p_success BOOLEAN,
    p_trades_verified INTEGER,
    p_trades_updated INTEGER,
    p_trades_failed INTEGER,
    p_error_message TEXT,
    p_retry_attempt INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cron_execution_logs (
        cron_job,
        success,
        trades_verified,
        trades_updated,
        trades_failed,
        error_message,
        retry_attempt
    )
    VALUES (
        p_cron_job,
        p_success,
        p_trades_verified,
        p_trades_updated,
        p_trades_failed,
        p_error_message,
        p_retry_attempt
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to log API usage
-- Requirements: Task 47 - Monitor OpenAI API costs, Monitor CoinMarketCap API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    p_api_name VARCHAR,
    p_endpoint VARCHAR,
    p_request_type VARCHAR,
    p_success BOOLEAN,
    p_response_time_ms INTEGER,
    p_cost_usd DECIMAL,
    p_tokens_used INTEGER,
    p_error_message TEXT,
    p_metadata JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO api_usage_logs (
        api_name,
        endpoint,
        request_type,
        success,
        response_time_ms,
        cost_usd,
        tokens_used,
        error_message,
        metadata
    )
    VALUES (
        p_api_name,
        p_endpoint,
        p_request_type,
        p_success,
        p_response_time_ms,
        p_cost_usd,
        p_tokens_used,
        p_error_message,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Create view for cron job health
CREATE OR REPLACE VIEW vw_cron_job_health AS
SELECT 
    cron_job,
    COUNT(*) as total_runs,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_runs,
    ROUND(AVG(CASE WHEN success THEN 100.0 ELSE 0.0 END), 2) as success_rate,
    MAX(executed_at) as last_run,
    AVG(execution_time_ms) as avg_execution_time_ms
FROM cron_execution_logs
WHERE executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY cron_job;

-- Create view for API cost summary
-- Requirements: Task 47 - Monitor OpenAI API costs (should be <$100/month)
CREATE OR REPLACE VIEW vw_api_cost_summary AS
SELECT 
    api_name,
    COUNT(*) as total_calls,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_calls,
    ROUND(AVG(CASE WHEN success THEN 100.0 ELSE 0.0 END), 2) as success_rate,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_per_call,
    SUM(tokens_used) as total_tokens,
    AVG(response_time_ms) as avg_response_time_ms
FROM api_usage_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY api_name;

-- Create view for monthly cost tracking
-- Requirements: Task 47 - Monitor OpenAI API costs (should be <$100/month)
CREATE OR REPLACE VIEW vw_monthly_api_costs AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    api_name,
    COUNT(*) as total_calls,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_per_call
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), api_name
ORDER BY month DESC, api_name;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON cron_execution_logs TO your_app_user;
-- GRANT SELECT, INSERT ON monitoring_reports TO your_app_user;
-- GRANT SELECT, INSERT ON api_usage_logs TO your_app_user;
-- GRANT SELECT ON vw_cron_job_health TO your_app_user;
-- GRANT SELECT ON vw_api_cost_summary TO your_app_user;
-- GRANT SELECT ON vw_monthly_api_costs TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE cron_execution_logs IS 'Tracks execution of cron jobs for monitoring and alerting';
COMMENT ON TABLE monitoring_reports IS 'Stores comprehensive monitoring reports for system health tracking';
COMMENT ON TABLE api_usage_logs IS 'Tracks API usage, costs, and performance for budget monitoring';
COMMENT ON VIEW vw_cron_job_health IS 'Provides 24-hour health summary for cron jobs';
COMMENT ON VIEW vw_api_cost_summary IS 'Provides current month cost summary for all APIs';
COMMENT ON VIEW vw_monthly_api_costs IS 'Provides 12-month historical cost tracking for budget analysis';

-- ============================================================================
-- Migration Complete
-- ============================================================================
