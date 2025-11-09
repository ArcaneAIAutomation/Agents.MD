-- Migration: Create Caesar AI Research Tables
-- Description: Store all Caesar AI analysis responses for tracking and historical analysis
-- Created: January 27, 2025
-- Matches: lib/ucie/caesarStorage.ts interface

-- Create caesar_research_jobs table (main research jobs)
CREATE TABLE IF NOT EXISTS caesar_research_jobs (
  id SERIAL PRIMARY KEY,
  
  -- Request Information
  caesar_job_id VARCHAR(255) NOT NULL UNIQUE,
  symbol VARCHAR(20),
  query TEXT NOT NULL,
  compute_units INTEGER DEFAULT 2,
  
  -- Response Data
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  content TEXT,
  transformed_content TEXT,
  
  -- Results/Sources (stored as JSONB for flexibility)
  results JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  data_quality_score INTEGER,
  
  -- User tracking
  user_id VARCHAR(255),
  
  -- Cost tracking
  cost_usd DECIMAL(10, 4),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create caesar_research_sources table (detailed source tracking)
CREATE TABLE IF NOT EXISTS caesar_research_sources (
  id SERIAL PRIMARY KEY,
  
  -- Link to research job
  research_job_id INTEGER NOT NULL REFERENCES caesar_research_jobs(id) ON DELETE CASCADE,
  
  -- Source information
  caesar_result_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  score DECIMAL(3, 2) NOT NULL,
  citation_index INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_caesar_job_id ON caesar_research_jobs(caesar_job_id);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_symbol ON caesar_research_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_status ON caesar_research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_created_at ON caesar_research_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_symbol_created ON caesar_research_jobs(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_expires_at ON caesar_research_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_user_id ON caesar_research_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_caesar_sources_research_job_id ON caesar_research_sources(research_job_id);
CREATE INDEX IF NOT EXISTS idx_caesar_sources_citation_index ON caesar_research_sources(citation_index);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_caesar_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_caesar_jobs_updated_at ON caesar_research_jobs;
CREATE TRIGGER trigger_update_caesar_jobs_updated_at
  BEFORE UPDATE ON caesar_research_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_caesar_jobs_updated_at();

-- Add comments for documentation
COMMENT ON TABLE caesar_research_jobs IS 'Stores all Caesar AI research jobs for tracking and historical analysis';
COMMENT ON COLUMN caesar_research_jobs.caesar_job_id IS 'Unique Caesar API job identifier';
COMMENT ON COLUMN caesar_research_jobs.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN caesar_research_jobs.query IS 'Original query sent to Caesar API';
COMMENT ON COLUMN caesar_research_jobs.compute_units IS 'Number of compute units used (1-10)';
COMMENT ON COLUMN caesar_research_jobs.status IS 'Job status (queued, researching, completed, failed, cancelled, expired)';
COMMENT ON COLUMN caesar_research_jobs.content IS 'Raw synthesis text from Caesar';
COMMENT ON COLUMN caesar_research_jobs.transformed_content IS 'Formatted output (e.g., JSON)';
COMMENT ON COLUMN caesar_research_jobs.results IS 'Array of sources/citations found during research (JSONB)';
COMMENT ON COLUMN caesar_research_jobs.data_quality_score IS 'Quality score of analysis (0-100)';
COMMENT ON COLUMN caesar_research_jobs.user_id IS 'User who requested the research';
COMMENT ON COLUMN caesar_research_jobs.cost_usd IS 'Estimated cost in USD';
COMMENT ON COLUMN caesar_research_jobs.expires_at IS 'When this cached research expires (default 7 days)';

COMMENT ON TABLE caesar_research_sources IS 'Detailed source/citation tracking for Caesar research';
COMMENT ON COLUMN caesar_research_sources.research_job_id IS 'Foreign key to caesar_research_jobs';
COMMENT ON COLUMN caesar_research_sources.caesar_result_id IS 'Caesar API result identifier';
COMMENT ON COLUMN caesar_research_sources.title IS 'Source title';
COMMENT ON COLUMN caesar_research_sources.url IS 'Source URL';
COMMENT ON COLUMN caesar_research_sources.score IS 'Relevance score (0-1)';
COMMENT ON COLUMN caesar_research_sources.citation_index IS 'Citation number for referencing';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON caesar_research_jobs TO your_app_user;
-- GRANT SELECT, INSERT ON caesar_research_sources TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE caesar_research_jobs_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE caesar_research_sources_id_seq TO your_app_user;
