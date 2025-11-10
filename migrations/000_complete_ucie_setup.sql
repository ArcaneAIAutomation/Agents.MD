-- Complete UCIE Database Setup
-- Creates ALL required tables for UCIE system
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================================
-- Table 1: ucie_analysis_cache
-- Purpose: Cache for all API data (market, sentiment, news, technical, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  data_quality_score INTEGER,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, analysis_type, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_symbol_type_user 
ON ucie_analysis_cache(symbol, analysis_type, user_id);

CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_expires_at 
ON ucie_analysis_cache(expires_at);

-- Comments
COMMENT ON TABLE ucie_analysis_cache IS 'Caches all UCIE API data with automatic replacement (UPSERT)';
COMMENT ON COLUMN ucie_analysis_cache.data IS 'JSON data from APIs (market, sentiment, news, etc.)';
COMMENT ON COLUMN ucie_analysis_cache.data_quality_score IS 'Quality score 0-100';

-- ============================================================================
-- Table 2: ucie_openai_analysis
-- Purpose: Store OpenAI/Gemini AI summaries
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_openai_analysis (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  summary_text TEXT NOT NULL,
  data_quality_score INTEGER,
  api_status JSONB NOT NULL DEFAULT '{}',
  ai_provider VARCHAR(50) DEFAULT 'openai',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_symbol_user 
ON ucie_openai_analysis(symbol, user_id);

CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_ai_provider 
ON ucie_openai_analysis(ai_provider);

-- Comments
COMMENT ON TABLE ucie_openai_analysis IS 'Stores OpenAI/Gemini AI summaries with automatic replacement';
COMMENT ON COLUMN ucie_openai_analysis.ai_provider IS 'AI provider: openai or gemini';
COMMENT ON COLUMN ucie_openai_analysis.api_status IS 'Which APIs succeeded/failed';

-- ============================================================================
-- Table 3: ucie_caesar_research
-- Purpose: Store complete Caesar AI research
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_caesar_research (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  job_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  research_data JSONB NOT NULL DEFAULT '{}',
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  recommendation VARCHAR(50),
  confidence_score INTEGER,
  sources JSONB DEFAULT '[]',
  source_count INTEGER DEFAULT 0,
  data_quality_score INTEGER,
  analysis_depth VARCHAR(50),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucie_caesar_research_symbol_user 
ON ucie_caesar_research(symbol, user_id);

CREATE INDEX IF NOT EXISTS idx_ucie_caesar_research_status 
ON ucie_caesar_research(status);

CREATE INDEX IF NOT EXISTS idx_ucie_caesar_research_job_id 
ON ucie_caesar_research(job_id);

-- Comments
COMMENT ON TABLE ucie_caesar_research IS 'Stores complete Caesar AI research with automatic replacement';
COMMENT ON COLUMN ucie_caesar_research.research_data IS 'Full Caesar AI response (JSON)';
COMMENT ON COLUMN ucie_caesar_research.recommendation IS 'BUY, SELL, or HOLD';

-- ============================================================================
-- Table 4: ucie_phase_data
-- Purpose: Session-based temporary data (1-hour TTL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_phase_data (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  phase INTEGER NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_session_symbol 
ON ucie_phase_data(session_id, symbol);

CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_expires_at 
ON ucie_phase_data(expires_at);

-- Comments
COMMENT ON TABLE ucie_phase_data IS 'Session-based temporary data (1-hour TTL)';

-- ============================================================================
-- Table 5: ucie_watchlist
-- Purpose: User watchlists
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_watchlist (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_user_id 
ON ucie_watchlist(user_id);

-- Comments
COMMENT ON TABLE ucie_watchlist IS 'User cryptocurrency watchlists';

-- ============================================================================
-- Table 6: ucie_alerts
-- Purpose: User alerts and notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_alerts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  threshold DECIMAL(20, 8),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_user_id 
ON ucie_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_ucie_alerts_symbol 
ON ucie_alerts(symbol);

CREATE INDEX IF NOT EXISTS idx_ucie_alerts_is_active 
ON ucie_alerts(is_active);

-- Comments
COMMENT ON TABLE ucie_alerts IS 'User alerts and notifications for price/volume changes';

-- ============================================================================
-- Automatic Cleanup Function
-- Purpose: Automatically delete expired cache entries
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_ucie_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ucie_analysis_cache WHERE expires_at < NOW();
  DELETE FROM ucie_phase_data WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION cleanup_expired_ucie_cache IS 'Automatically deletes expired cache entries';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'ucie_analysis_cache',
      'ucie_openai_analysis',
      'ucie_caesar_research',
      'ucie_phase_data',
      'ucie_watchlist',
      'ucie_alerts'
    );
  
  IF table_count = 6 THEN
    RAISE NOTICE '✅ All 6 UCIE tables created successfully';
  ELSE
    RAISE NOTICE '⚠️  Only % of 6 tables created', table_count;
  END IF;
END $$;

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample cache entry
INSERT INTO ucie_analysis_cache (
  symbol, analysis_type, data, data_quality_score, user_id, expires_at
) VALUES (
  'BTC', 'market-data', '{"price": 95000, "volume": 1000000}', 100, 'system', NOW() + INTERVAL '1 hour'
)
ON CONFLICT (symbol, analysis_type, user_id) DO NOTHING;

-- Insert sample OpenAI analysis
INSERT INTO ucie_openai_analysis (
  symbol, user_id, summary_text, data_quality_score, api_status, ai_provider
) VALUES (
  'BTC', 'system', 'Sample OpenAI analysis for Bitcoin', 100, '{"marketData": true}', 'openai'
)
ON CONFLICT (symbol, user_id) DO NOTHING;

-- Insert sample Caesar research
INSERT INTO ucie_caesar_research (
  symbol, user_id, job_id, status, research_data, executive_summary, recommendation, confidence_score
) VALUES (
  'BTC', 'system', 'sample-job-123', 'completed', '{"content": "Sample research"}', 
  'Sample executive summary for Bitcoin', 'HOLD', 85
)
ON CONFLICT (symbol, user_id) DO NOTHING;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 UCIE Database Setup Complete!';
  RAISE NOTICE '✅ All tables created';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ Cleanup function created';
  RAISE NOTICE '✅ Sample data inserted';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Run: npm run test:ucie';
  RAISE NOTICE '   2. Verify all tests pass';
  RAISE NOTICE '   3. Deploy to production';
END $$;
