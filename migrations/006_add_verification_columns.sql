-- Migration: Add Verification Columns to ATGE Tables
-- Description: Adds verification tracking columns to trade_results and trade_market_snapshot
-- Date: 2025-01-27
-- Author: System
-- Requirements: 4.4

BEGIN;

-- ============================================================================
-- 1. ADD VERIFICATION COLUMNS TO TRADE_RESULTS
-- ============================================================================
-- Purpose: Track when trades were last verified and the data source used

-- Add last_verified_at column
ALTER TABLE trade_results
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Add verification_data_source column
ALTER TABLE trade_results
ADD COLUMN IF NOT EXISTS verification_data_source VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN trade_results.last_verified_at IS 'Timestamp of last verification check against live market data';
COMMENT ON COLUMN trade_results.verification_data_source IS 'Data source used for verification (e.g., CoinMarketCap, CoinGecko)';

-- ============================================================================
-- 2. ADD BITCOIN-SPECIFIC METRICS TO TRADE_MARKET_SNAPSHOT
-- ============================================================================
-- Purpose: Store Bitcoin on-chain metrics for enhanced analysis

-- Add SOPR (Spent Output Profit Ratio) column
ALTER TABLE trade_market_snapshot
ADD COLUMN IF NOT EXISTS sopr_value DECIMAL(10, 6);

-- Add MVRV Z-Score column
ALTER TABLE trade_market_snapshot
ADD COLUMN IF NOT EXISTS mvrv_z_score DECIMAL(10, 6);

-- Add comments for documentation
COMMENT ON COLUMN trade_market_snapshot.sopr_value IS 'Spent Output Profit Ratio - Bitcoin only. Values > 1 indicate profitable spending (bullish), < 1 indicate loss-taking (bearish)';
COMMENT ON COLUMN trade_market_snapshot.mvrv_z_score IS 'Market Value to Realized Value Z-Score - Bitcoin only. Values > 7 indicate overvaluation, < 0 indicate undervaluation';

-- ============================================================================
-- 3. CREATE INDEX FOR VERIFICATION QUERIES
-- ============================================================================
-- Purpose: Optimize queries that filter by verification status

-- Index for finding unverified or stale trades
CREATE INDEX IF NOT EXISTS idx_trade_results_last_verified_at 
ON trade_results(last_verified_at) 
WHERE last_verified_at IS NOT NULL;

-- Index for finding trades by verification source
CREATE INDEX IF NOT EXISTS idx_trade_results_verification_source 
ON trade_results(verification_data_source) 
WHERE verification_data_source IS NOT NULL;

-- ============================================================================
-- 4. CREATE VIEW FOR VERIFICATION STATUS
-- ============================================================================
-- Purpose: Easy querying of trade verification status

CREATE OR REPLACE VIEW vw_trade_verification_status AS
SELECT 
  ts.id AS trade_signal_id,
  ts.symbol,
  ts.status AS trade_status,
  ts.generated_at,
  ts.expires_at,
  tr.last_verified_at,
  tr.verification_data_source,
  CASE 
    WHEN tr.last_verified_at IS NULL THEN 'never_verified'
    WHEN tr.last_verified_at < NOW() - INTERVAL '1 hour' THEN 'stale'
    ELSE 'current'
  END AS verification_status,
  EXTRACT(EPOCH FROM (NOW() - tr.last_verified_at))/3600 AS hours_since_verification
FROM trade_signals ts
LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
WHERE ts.status = 'active';

-- Add comment for documentation
COMMENT ON VIEW vw_trade_verification_status IS 'Shows verification status for all active trades';

-- ============================================================================
-- 5. CREATE VIEW FOR BITCOIN METRICS
-- ============================================================================
-- Purpose: Easy querying of Bitcoin-specific on-chain metrics

CREATE OR REPLACE VIEW vw_bitcoin_onchain_metrics AS
SELECT 
  ts.id AS trade_signal_id,
  ts.symbol,
  ts.generated_at,
  tms.sopr_value,
  tms.mvrv_z_score,
  CASE 
    WHEN tms.sopr_value > 1 THEN 'bullish'
    WHEN tms.sopr_value < 1 THEN 'bearish'
    ELSE 'neutral'
  END AS sopr_signal,
  CASE 
    WHEN tms.mvrv_z_score > 7 THEN 'overvalued'
    WHEN tms.mvrv_z_score < 0 THEN 'undervalued'
    WHEN tms.mvrv_z_score BETWEEN 0 AND 7 THEN 'fair_value'
    ELSE 'unknown'
  END AS mvrv_signal,
  tms.snapshot_at
FROM trade_signals ts
INNER JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
WHERE ts.symbol = 'BTC'
  AND (tms.sopr_value IS NOT NULL OR tms.mvrv_z_score IS NOT NULL);

-- Add comment for documentation
COMMENT ON VIEW vw_bitcoin_onchain_metrics IS 'Shows Bitcoin on-chain metrics (SOPR and MVRV Z-Score) with signal interpretation';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added to trade_results
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trade_results'
  AND column_name IN ('last_verified_at', 'verification_data_source')
ORDER BY column_name;

-- Verify columns were added to trade_market_snapshot
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trade_market_snapshot'
  AND column_name IN ('sopr_value', 'mvrv_z_score')
ORDER BY column_name;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'trade_results'
  AND indexname LIKE '%verification%'
ORDER BY indexname;

-- Verify views were created
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('vw_trade_verification_status', 'vw_bitcoin_onchain_metrics')
ORDER BY table_name;

-- Test the verification status view
SELECT * FROM vw_trade_verification_status LIMIT 5;

-- Test the Bitcoin metrics view (will be empty until data is populated)
SELECT * FROM vw_bitcoin_onchain_metrics LIMIT 5;
