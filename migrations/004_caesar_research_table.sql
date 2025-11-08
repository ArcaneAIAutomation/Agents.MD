-- Caesar Research Storage Migration
-- Created: January 2025
-- Purpose: Store Caesar AI research results for reference and caching

-- Caesar research jobs table
CREATE TABLE IF NOT EXISTS caesar_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caesar_job_id VARCHAR(255) NOT NULL UNIQUE,
  symbol VARCHAR(10),
  query TEXT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'queued', 'researching', 'completed', 'failed', 'cancelled', 'expired'
  compute_units INTEGER DEFAULT 2,
  
  -- Results
  content TEXT,
  transformed_content TEXT,
  results JSONB, -- Array of research results with citations
  
  -- Metadata
  data_quality_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- User tracking (optional)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Cost tracking
  cost_usd DECIMAL(10, 6)
);

CREATE INDEX IF NOT EXISTS idx_caesar_jobs_caesar_id ON caesar_research_jobs(caesar_job_id);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_symbol ON caesar_research_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_status ON caesar_research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_created ON caesar_research_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_caesar_jobs_user ON caesar_research_jobs(user_id);

COMMENT ON TABLE caesar_research_jobs IS 'Stores Caesar AI research jobs and results for caching and reference';
COMMENT ON COLUMN caesar_research_jobs.caesar_job_id IS 'Caesar API job ID for polling and retrieval';
COMMENT ON COLUMN caesar_research_jobs.results IS 'Array of research results with citations, scores, and URLs';
COMMENT ON COLUMN caesar_research_jobs.transformed_content IS 'Formatted output if system_prompt was used (e.g., JSON)';
COMMENT ON COLUMN caesar_research_jobs.data_quality_score IS 'Score 0-100 indicating research quality and completeness';

-- Caesar research sources table (for detailed citation tracking)
CREATE TABLE IF NOT EXISTS caesar_research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_job_id UUID NOT NULL REFERENCES caesar_research_jobs(id) ON DELETE CASCADE,
  caesar_result_id VARCHAR(255) NOT NULL,
  
  -- Source details
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  score DECIMAL(3, 2), -- Relevance score 0-1
  citation_index INTEGER,
  
  -- Full content (optional, can be fetched on demand)
  full_content TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caesar_sources_job ON caesar_research_sources(research_job_id);
CREATE INDEX IF NOT EXISTS idx_caesar_sources_result_id ON caesar_research_sources(caesar_result_id);

COMMENT ON TABLE caesar_research_sources IS 'Detailed citation tracking for Caesar research results';
COMMENT ON COLUMN caesar_research_sources.full_content IS 'Full source content, fetched via /research/:id/results/:resultId/content';

-- Grant permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON caesar_research_jobs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON caesar_research_sources TO your_app_user;
