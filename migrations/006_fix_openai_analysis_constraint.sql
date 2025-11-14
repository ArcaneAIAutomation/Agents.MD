-- ============================================================================
-- Migration: Fix ucie_openai_analysis UNIQUE constraint
-- Date: January 27, 2025
-- Purpose: Ensure UNIQUE constraint exists for ON CONFLICT clause
-- ============================================================================

-- Drop existing table if constraint is missing
DROP TABLE IF EXISTS ucie_openai_analysis CASCADE;

-- Recreate table with proper UNIQUE constraint
CREATE TABLE ucie_openai_analysis (
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
  CONSTRAINT ucie_openai_analysis_unique_symbol_user UNIQUE(symbol, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_symbol_user 
ON ucie_openai_analysis(symbol, user_id);

CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_ai_provider 
ON ucie_openai_analysis(ai_provider);

CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_created_at 
ON ucie_openai_analysis(created_at DESC);

-- Add comments
COMMENT ON TABLE ucie_openai_analysis IS 'Stores OpenAI/Gemini AI summaries with automatic replacement';
COMMENT ON COLUMN ucie_openai_analysis.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN ucie_openai_analysis.user_id IS 'User ID for data isolation (default: anonymous)';
COMMENT ON COLUMN ucie_openai_analysis.user_email IS 'User email for tracking';
COMMENT ON COLUMN ucie_openai_analysis.summary_text IS 'AI-generated summary text';
COMMENT ON COLUMN ucie_openai_analysis.data_quality_score IS 'Data quality score (0-100)';
COMMENT ON COLUMN ucie_openai_analysis.api_status IS 'Which APIs succeeded/failed (JSON)';
COMMENT ON COLUMN ucie_openai_analysis.ai_provider IS 'AI provider: openai or gemini';
COMMENT ON COLUMN ucie_openai_analysis.created_at IS 'When the summary was first created';
COMMENT ON COLUMN ucie_openai_analysis.updated_at IS 'When the summary was last updated';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ucie_openai_analysis TO PUBLIC;
GRANT USAGE, SELECT ON SEQUENCE ucie_openai_analysis_id_seq TO PUBLIC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 006: ucie_openai_analysis table recreated with proper UNIQUE constraint';
END $$;
