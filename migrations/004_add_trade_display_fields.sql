-- =====================================================
-- Migration: Add Trade Display Fields
-- =====================================================
-- Description: Adds fields needed for frontend trade detail display
-- Date: 2025-01-27
-- Version: 1.1
-- =====================================================

-- Modify existing columns to have correct sizes
-- (Columns already exist but with wrong VARCHAR lengths)
ALTER TABLE trade_results 
ALTER COLUMN data_source TYPE VARCHAR(100),
ALTER COLUMN data_resolution TYPE VARCHAR(100);

-- Add high/low columns to market snapshot table
ALTER TABLE trade_market_snapshot 
ADD COLUMN IF NOT EXISTS high_24h DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS low_24h DECIMAL(20, 8);

-- Add comments for new columns
COMMENT ON COLUMN trade_results.data_source IS 'Primary data source used for backtesting (e.g., CoinMarketCap, Binance)';
COMMENT ON COLUMN trade_results.data_resolution IS 'Time resolution of price data (e.g., 1-minute intervals, 5-minute intervals)';
COMMENT ON COLUMN trade_results.data_quality_score IS 'Quality score of data used (0-100, where 100 is perfect)';

-- Create index for data quality queries
CREATE INDEX IF NOT EXISTS idx_trade_results_data_quality ON trade_results(data_quality_score DESC);

-- =====================================================
-- Update existing records with default values
-- =====================================================

-- Set default values for existing records (if any exist)
UPDATE trade_results 
SET 
  data_source = COALESCE(data_source, 'CoinMarketCap'),
  data_resolution = COALESCE(data_resolution, '1-minute intervals'),
  data_quality_score = COALESCE(data_quality_score, 100);

-- =====================================================
-- Verification
-- =====================================================

DO $$
DECLARE
  source_length INTEGER;
  resolution_length INTEGER;
BEGIN
  -- Check column sizes
  SELECT character_maximum_length INTO source_length
  FROM information_schema.columns
  WHERE table_name = 'trade_results' AND column_name = 'data_source';
  
  SELECT character_maximum_length INTO resolution_length
  FROM information_schema.columns
  WHERE table_name = 'trade_results' AND column_name = 'data_resolution';
  
  IF source_length = 100 AND resolution_length = 100 THEN
    RAISE NOTICE '✅ Migration Complete: Column sizes updated successfully';
    RAISE NOTICE '   data_source: VARCHAR(100)';
    RAISE NOTICE '   data_resolution: VARCHAR(100)';
  ELSE
    RAISE WARNING '⚠️ Migration may be incomplete';
    RAISE WARNING '   data_source length: %', source_length;
    RAISE WARNING '   data_resolution length: %', resolution_length;
  END IF;
END $$;

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================
-- To rollback this migration, run:
-- ALTER TABLE trade_results DROP COLUMN IF EXISTS data_source;
-- ALTER TABLE trade_results DROP COLUMN IF EXISTS data_resolution;
-- ALTER TABLE trade_results DROP COLUMN IF EXISTS data_quality_score;
-- DROP INDEX IF EXISTS idx_trade_results_data_quality;
