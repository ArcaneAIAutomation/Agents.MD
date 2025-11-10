-- Migration 006: Add AI Provider Column
-- Adds support for both OpenAI and Gemini AI

-- Add ai_provider column to ucie_openai_analysis table
ALTER TABLE ucie_openai_analysis
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'openai';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_ai_provider 
ON ucie_openai_analysis(ai_provider);

-- Add comment
COMMENT ON COLUMN ucie_openai_analysis.ai_provider IS 'AI provider used: openai or gemini';

-- Update existing rows to have 'openai' as provider
UPDATE ucie_openai_analysis
SET ai_provider = 'openai'
WHERE ai_provider IS NULL;
