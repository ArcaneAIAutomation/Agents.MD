-- UCIE Jobs Table
-- Stores async job queue for UCIE analysis

CREATE TABLE IF NOT EXISTS ucie_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  phase VARCHAR(50),
  result JSONB,
  data_quality INTEGER,
  error TEXT,
  user_id VARCHAR(255),
  force_refresh BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ucie_jobs_status ON ucie_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ucie_jobs_symbol ON ucie_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_jobs_created ON ucie_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_ucie_jobs_user ON ucie_jobs(user_id);

-- Status values: 'queued', 'processing', 'completed', 'failed'
-- Phase values: 'initializing', 'market-data', 'sentiment', 'technical', 'on-chain', 'news', 'ai-analysis'

COMMENT ON TABLE ucie_jobs IS 'Async job queue for UCIE analysis';
COMMENT ON COLUMN ucie_jobs.status IS 'Job status: queued, processing, completed, failed';
COMMENT ON COLUMN ucie_jobs.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN ucie_jobs.phase IS 'Current processing phase';
COMMENT ON COLUMN ucie_jobs.result IS 'Final analysis result (JSON)';
COMMENT ON COLUMN ucie_jobs.data_quality IS 'Data quality score (0-100)';
