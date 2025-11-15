-- Migration 003: Add Gemini AI Analysis Table
-- Date: 2025-01-27
-- Purpose: Store Gemini AI analysis results for UCIE

-- Create ucie_gemini_analysis table
CREATE TABLE IF NOT EXISTS ucie_gemini_analysis (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    
    -- Analysis content
    summary_text TEXT NOT NULL,
    thinking_process TEXT,  -- Gemini thinking mode output
    
    -- Metadata
    data_quality_score INTEGER,
    api_status JSONB NOT NULL,
    ai_provider VARCHAR(50) DEFAULT 'gemini',
    model_used VARCHAR(100) DEFAULT 'gemini-2.5-pro',
    
    -- Token usage and cost tracking
    tokens_used INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    thinking_tokens INTEGER,
    estimated_cost_usd DECIMAL(10, 6),
    
    -- Performance metrics
    response_time_ms INTEGER,
    processing_time_ms INTEGER,
    
    -- Data sources used
    data_sources_used JSONB,  -- Array of sources: ['market-data', 'sentiment', etc.]
    available_data_count INTEGER,
    total_data_sources INTEGER DEFAULT 10,
    
    -- Analysis metadata
    analysis_type VARCHAR(50) DEFAULT 'summary',  -- 'summary', 'deep-dive', 'quick'
    confidence_score INTEGER,  -- 0-100
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one analysis per symbol per user
    UNIQUE(symbol, user_id, analysis_type)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_gemini_analysis_symbol 
    ON ucie_gemini_analysis(symbol);

CREATE INDEX IF NOT EXISTS idx_gemini_analysis_user 
    ON ucie_gemini_analysis(user_id);

CREATE INDEX IF NOT EXISTS idx_gemini_analysis_created 
    ON ucie_gemini_analysis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gemini_analysis_model 
    ON ucie_gemini_analysis(model_used);

CREATE INDEX IF NOT EXISTS idx_gemini_analysis_type 
    ON ucie_gemini_analysis(analysis_type);

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_ucie_gemini_analysis_updated_at ON ucie_gemini_analysis;

CREATE TRIGGER update_ucie_gemini_analysis_updated_at
    BEFORE UPDATE ON ucie_gemini_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for recent Gemini analyses
CREATE OR REPLACE VIEW vw_recent_gemini_analyses AS
SELECT 
    symbol,
    user_email,
    model_used,
    analysis_type,
    data_quality_score,
    tokens_used,
    estimated_cost_usd,
    response_time_ms,
    confidence_score,
    created_at,
    SUBSTRING(summary_text, 1, 200) || '...' as summary_preview
FROM ucie_gemini_analysis
ORDER BY created_at DESC
LIMIT 100;

-- Create view for Gemini cost tracking
CREATE OR REPLACE VIEW vw_gemini_cost_summary AS
SELECT 
    DATE(created_at) as analysis_date,
    COUNT(*) as total_analyses,
    SUM(tokens_used) as total_tokens,
    SUM(estimated_cost_usd) as total_cost_usd,
    AVG(response_time_ms) as avg_response_time_ms,
    AVG(data_quality_score) as avg_data_quality,
    COUNT(DISTINCT symbol) as unique_symbols,
    COUNT(DISTINCT user_id) as unique_users
FROM ucie_gemini_analysis
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;

-- Create view for model usage statistics
CREATE OR REPLACE VIEW vw_gemini_model_stats AS
SELECT 
    model_used,
    analysis_type,
    COUNT(*) as usage_count,
    AVG(tokens_used) as avg_tokens,
    AVG(response_time_ms) as avg_response_time,
    AVG(estimated_cost_usd) as avg_cost,
    AVG(data_quality_score) as avg_quality,
    MAX(created_at) as last_used
FROM ucie_gemini_analysis
GROUP BY model_used, analysis_type
ORDER BY usage_count DESC;

-- Add comment to table
COMMENT ON TABLE ucie_gemini_analysis IS 'Stores Gemini AI analysis results for UCIE cryptocurrency intelligence';

-- Add comments to key columns
COMMENT ON COLUMN ucie_gemini_analysis.thinking_process IS 'Gemini thinking mode output showing reasoning process';
COMMENT ON COLUMN ucie_gemini_analysis.thinking_tokens IS 'Tokens used for internal reasoning (Gemini 2.5 thinking mode)';
COMMENT ON COLUMN ucie_gemini_analysis.data_sources_used IS 'JSON array of data sources used in analysis';
COMMENT ON COLUMN ucie_gemini_analysis.confidence_score IS 'AI confidence in analysis (0-100)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 003 completed: ucie_gemini_analysis table created';
    RAISE NOTICE 'Created 5 indexes for performance';
    RAISE NOTICE 'Created 3 views for analytics';
    RAISE NOTICE 'Gemini AI analysis tracking is now ready';
END $$;
