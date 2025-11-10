/**
 * Migration 005: OpenAI Analysis and Caesar Research Tables
 * 
 * Creates tables for:
 * 1. OpenAI/ChatGPT analysis summaries
 * 2. Complete Caesar AI research results
 * 
 * Features:
 * - Separate tables for OpenAI and Caesar analysis
 * - Automatic data replacement (UPSERT)
 * - Timestamp tracking
 * - Data quality scoring
 */

-- ============================================================================
-- 1. OpenAI Analysis Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_openai_analysis (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  
  -- OpenAI Summary
  summary_text TEXT NOT NULL,
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- API Status
  api_status JSONB NOT NULL DEFAULT '{}',
  
  -- Source Data References
  market_data_id INTEGER,
  sentiment_id INTEGER,
  news_id INTEGER,
  technical_id INTEGER,
  onchain_id INTEGER,
  risk_id INTEGER,
  predictions_id INTEGER,
  derivatives_id INTEGER,
  defi_id INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: One OpenAI analysis per symbol per user
  UNIQUE(symbol, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_openai_analysis_symbol_user ON ucie_openai_analysis(symbol, user_id);
CREATE INDEX IF NOT EXISTS idx_openai_analysis_created ON ucie_openai_analysis(created_at DESC);

-- ============================================================================
-- 2. Caesar AI Research Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ucie_caesar_research (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  
  -- Caesar AI Job Info
  job_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  
  -- Research Results (FULL analysis)
  research_data JSONB NOT NULL DEFAULT '{}',
  
  -- Analysis Components
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  recommendation VARCHAR(50),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Sources
  sources JSONB DEFAULT '[]',
  source_count INTEGER DEFAULT 0,
  
  -- Quality Metrics
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  analysis_depth VARCHAR(50),
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: One Caesar research per symbol per user
  UNIQUE(symbol, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_caesar_research_symbol_user ON ucie_caesar_research(symbol, user_id);
CREATE INDEX IF NOT EXISTS idx_caesar_research_job_id ON ucie_caesar_research(job_id);
CREATE INDEX IF NOT EXISTS idx_caesar_research_status ON ucie_caesar_research(status);
CREATE INDEX IF NOT EXISTS idx_caesar_research_created ON ucie_caesar_research(created_at DESC);

-- ============================================================================
-- 3. Update Trigger for updated_at
-- ============================================================================

-- OpenAI Analysis
CREATE OR REPLACE FUNCTION update_openai_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_openai_analysis_updated_at
  BEFORE UPDATE ON ucie_openai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_openai_analysis_updated_at();

-- Caesar Research
CREATE OR REPLACE FUNCTION update_caesar_research_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_caesar_research_updated_at
  BEFORE UPDATE ON ucie_caesar_research
  FOR EACH ROW
  EXECUTE FUNCTION update_caesar_research_updated_at();

-- ============================================================================
-- 4. Comments
-- ============================================================================

COMMENT ON TABLE ucie_openai_analysis IS 'Stores OpenAI/ChatGPT analysis summaries for UCIE';
COMMENT ON TABLE ucie_caesar_research IS 'Stores complete Caesar AI research results for UCIE';

COMMENT ON COLUMN ucie_openai_analysis.summary_text IS 'Comprehensive OpenAI summary of all collected data';
COMMENT ON COLUMN ucie_openai_analysis.api_status IS 'JSON object tracking which APIs succeeded/failed';

COMMENT ON COLUMN ucie_caesar_research.research_data IS 'Complete Caesar AI research result (FULL analysis)';
COMMENT ON COLUMN ucie_caesar_research.job_id IS 'Caesar AI job ID for tracking';
COMMENT ON COLUMN ucie_caesar_research.status IS 'Job status: queued, researching, completed, failed';
COMMENT ON COLUMN ucie_caesar_research.sources IS 'Array of source citations from Caesar AI';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ucie_openai_analysis') THEN
    RAISE NOTICE '✅ ucie_openai_analysis table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ucie_caesar_research') THEN
    RAISE NOTICE '✅ ucie_caesar_research table created';
  END IF;
END $$;
