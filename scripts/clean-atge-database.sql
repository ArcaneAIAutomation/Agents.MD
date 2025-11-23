-- ============================================================================
-- ATGE Database Cleanup Script
-- ============================================================================
-- Purpose: Clean all ATGE trade data for fresh testing
-- Date: January 27, 2025
-- WARNING: This will DELETE ALL trade data. Use with caution!
-- ============================================================================

BEGIN;

-- Display current counts before deletion
SELECT 
  'BEFORE CLEANUP' as status,
  (SELECT COUNT(*) FROM trade_signals) as trade_signals_count,
  (SELECT COUNT(*) FROM trade_results) as trade_results_count,
  (SELECT COUNT(*) FROM trade_technical_indicators) as indicators_count,
  (SELECT COUNT(*) FROM trade_market_snapshot) as snapshots_count,
  (SELECT COUNT(*) FROM trade_historical_prices) as historical_prices_count;

-- ============================================================================
-- Delete all ATGE trade data (cascading deletes will handle related tables)
-- ============================================================================

-- Delete historical prices first (no foreign key dependencies)
DELETE FROM trade_historical_prices;

-- Delete market snapshots (references trade_signals)
DELETE FROM trade_market_snapshot;

-- Delete technical indicators (references trade_signals)
DELETE FROM trade_technical_indicators;

-- Delete trade results (references trade_signals)
DELETE FROM trade_results;

-- Delete trade signals (parent table - will cascade if configured)
DELETE FROM trade_signals;

-- ============================================================================
-- Reset sequences (if using SERIAL columns)
-- ============================================================================

-- Note: We're using UUID primary keys, so no sequences to reset

-- ============================================================================
-- Verify cleanup
-- ============================================================================

SELECT 
  'AFTER CLEANUP' as status,
  (SELECT COUNT(*) FROM trade_signals) as trade_signals_count,
  (SELECT COUNT(*) FROM trade_results) as trade_results_count,
  (SELECT COUNT(*) FROM trade_technical_indicators) as indicators_count,
  (SELECT COUNT(*) FROM trade_market_snapshot) as snapshots_count,
  (SELECT COUNT(*) FROM trade_historical_prices) as historical_prices_count;

-- ============================================================================
-- Display table structures (verify tables still exist)
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'trade_signals',
    'trade_results',
    'trade_technical_indicators',
    'trade_market_snapshot',
    'trade_historical_prices'
  )
ORDER BY table_name;

COMMIT;

-- ============================================================================
-- Success message
-- ============================================================================

SELECT 
  '✅ ATGE database cleaned successfully!' as message,
  'All trade data has been removed.' as details,
  'Tables and structure remain intact.' as note,
  'Ready for fresh testing.' as status;

