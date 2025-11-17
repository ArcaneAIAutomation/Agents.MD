-- =====================================================
-- Add data_quality_score to trade_results table
-- =====================================================
-- Version: 1.0
-- Purpose: Store data quality score from backtesting
-- Created: January 27, 2025
-- Task: 5.4 - Quality score stored in trade result
-- =====================================================

-- Add data_quality_score column to trade_results table
ALTER TABLE trade_results
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100);

-- Add comment for documentation
COMMENT ON COLUMN trade_results.data_quality_score IS 'Data quality score (0-100%) from historical price data validation';

-- Create index for filtering by data quality
CREATE INDEX IF NOT EXISTS idx_trade_results_data_quality_score ON trade_results(data_quality_score DESC);

-- Verify column was added
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trade_results'
    AND column_name = 'data_quality_score'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ Migration Complete: data_quality_score column added to trade_results table';
  ELSE
    RAISE WARNING '⚠️ Migration Failed: data_quality_score column was not added';
  END IF;
END $$;
