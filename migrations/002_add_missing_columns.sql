-- Migration: Add missing columns to UCIE tables
-- Date: 2025-01-27
-- Purpose: Ensure all tables have necessary columns for 100% live data analysis

-- Add updated_at column to ucie_analysis_cache if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ucie_analysis_cache' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ucie_analysis_cache 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Create trigger to auto-update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER update_ucie_analysis_cache_updated_at
            BEFORE UPDATE ON ucie_analysis_cache
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Added updated_at column to ucie_analysis_cache';
    END IF;
END $$;

-- Ensure ucie_openai_summary table exists
CREATE TABLE IF NOT EXISTS ucie_openai_summary (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    summary_text TEXT NOT NULL,
    data_quality_score INTEGER,
    api_status JSONB NOT NULL,
    ai_provider VARCHAR(50) DEFAULT 'openai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, user_id)
);

-- Create index on ucie_openai_summary
CREATE INDEX IF NOT EXISTS idx_ucie_openai_summary_symbol 
    ON ucie_openai_summary(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_summary_user 
    ON ucie_openai_summary(user_id);

-- Ensure ucie_analysis_history table exists for tracking changes
CREATE TABLE IF NOT EXISTS ucie_analysis_history (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    data_quality_score INTEGER NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on ucie_analysis_history
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_history_symbol 
    ON ucie_analysis_history(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_history_created 
    ON ucie_analysis_history(created_at DESC);

-- Ensure ucie_api_costs table exists for cost tracking
CREATE TABLE IF NOT EXISTS ucie_api_costs (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    cost_usd DECIMAL(10, 6) NOT NULL,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on ucie_api_costs
CREATE INDEX IF NOT EXISTS idx_ucie_api_costs_symbol 
    ON ucie_api_costs(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_api_costs_api 
    ON ucie_api_costs(api_name);
CREATE INDEX IF NOT EXISTS idx_ucie_api_costs_created 
    ON ucie_api_costs(created_at DESC);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_expires 
    ON ucie_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_user 
    ON ucie_analysis_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_session 
    ON ucie_phase_data(session_id);
CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_expires 
    ON ucie_phase_data(expires_at);

-- Create view for active (non-expired) cache entries
CREATE OR REPLACE VIEW vw_ucie_active_cache AS
SELECT 
    symbol,
    analysis_type,
    data,
    data_quality_score,
    user_email,
    created_at,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
FROM ucie_analysis_cache
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Create view for cache statistics
CREATE OR REPLACE VIEW vw_ucie_cache_stats AS
SELECT 
    symbol,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_entries,
    AVG(data_quality_score) as avg_quality_score,
    MAX(created_at) as last_updated
FROM ucie_analysis_cache
GROUP BY symbol
ORDER BY last_updated DESC;

-- Grant permissions (if needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 002 completed successfully';
    RAISE NOTICE 'Added missing columns and indexes for 100%% live data analysis';
END $$;
