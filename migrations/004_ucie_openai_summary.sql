-- UCIE OpenAI Summary Table Migration
-- Created: January 28, 2025
-- Purpose: Store OpenAI-generated summaries for Caesar AI context

-- UCIE OpenAI Summary Table
-- Stores OpenAI GPT-4o summaries of collected data for Caesar AI analysis
CREATE TABLE IF NOT EXISTS ucie_openai_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  summary_text TEXT NOT NULL,
  data_quality INTEGER CHECK (data_quality >= 0 AND data_quality <= 100),
  api_status JSONB NOT NULL, -- { working: [], failed: [], total: 5, successRate: 80 }
  collected_data_summary JSONB, -- Summary of what data was collected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT ucie_openai_summary_unique UNIQUE(symbol)
);

CREATE INDEX idx_ucie_openai_symbol ON ucie_openai_summary(symbol);
CREATE INDEX idx_ucie_openai_expires ON ucie_openai_summary(expires_at);
CREATE INDEX idx_ucie_openai_created ON ucie_openai_summary(created_at DESC);

COMMENT ON TABLE ucie_openai_summary IS 'Stores OpenAI-generated summaries of UCIE data collection for Caesar AI context';
COMMENT ON COLUMN ucie_openai_summary.summary_text IS 'OpenAI GPT-4o generated summary of collected data';
COMMENT ON COLUMN ucie_openai_summary.data_quality IS 'Overall data quality score 0-100';
COMMENT ON COLUMN ucie_openai_summary.api_status IS 'Status of API sources (working/failed)';
COMMENT ON COLUMN ucie_openai_summary.collected_data_summary IS 'Summary of collected data from each source';

-- Update cleanup function to include OpenAI summaries
CREATE OR REPLACE FUNCTION cleanup_expired_ucie_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete expired cache entries
  DELETE FROM ucie_analysis_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired phase data
  DELETE FROM ucie_phase_data WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired alerts
  DELETE FROM ucie_alerts WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired OpenAI summaries
  DELETE FROM ucie_openai_summary WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_ucie_data IS 'Cleans up expired UCIE data from all tables';

