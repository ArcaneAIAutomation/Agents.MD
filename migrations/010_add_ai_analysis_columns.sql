-- Migration: Add AI Analysis Columns to ATGE Trade Signals
-- Purpose: Support GPT-4o powered trade analysis (Phase 1-4)
-- Created: January 27, 2025

-- Add AI analysis columns to trade_signals table
ALTER TABLE trade_signals
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis_confidence INTEGER CHECK (ai_analysis_confidence >= 0 AND ai_analysis_confidence <= 100),
ADD COLUMN IF NOT EXISTS ai_analysis_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_analysis_version VARCHAR(10);

-- Add comment to explain the columns
COMMENT ON COLUMN trade_signals.ai_analysis IS 'GPT-4o generated analysis explaining why the trade succeeded or failed';
COMMENT ON COLUMN trade_signals.ai_analysis_confidence IS 'Confidence score (0-100) for the AI analysis';
COMMENT ON COLUMN trade_signals.ai_analysis_generated_at IS 'Timestamp when the AI analysis was generated';
COMMENT ON COLUMN trade_signals.ai_analysis_version IS 'Analysis version: phase1, phase2, phase3, or phase4';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_signals_ai_analysis_generated_at 
ON trade_signals(ai_analysis_generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_signals_ai_analysis_confidence 
ON trade_signals(ai_analysis_confidence DESC);

-- Create index for filtering by analysis version
CREATE INDEX IF NOT EXISTS idx_trade_signals_ai_analysis_version 
ON trade_signals(ai_analysis_version);

-- Verify the migration
DO $$
BEGIN
    -- Check if columns exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trade_signals' 
        AND column_name = 'ai_analysis'
    ) THEN
        RAISE NOTICE 'Migration successful: AI analysis columns added to trade_signals';
    ELSE
        RAISE EXCEPTION 'Migration failed: AI analysis columns not found';
    END IF;
END $$;
