-- UCIE Production Fix: Create missing ucie_openai_jobs table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Create ucie_openai_jobs table for GPT-5.1 async job tracking
CREATE TABLE IF NOT EXISTS ucie_openai_jobs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  progress TEXT,
  context_data JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_symbol ON ucie_openai_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_user_id ON ucie_openai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_status ON ucie_openai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_created_at ON ucie_openai_jobs(created_at);

-- Add comment
COMMENT ON TABLE ucie_openai_jobs IS 'Tracks GPT-5.1 async analysis jobs for UCIE system';

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ucie_openai_jobs'
ORDER BY ordinal_position;
