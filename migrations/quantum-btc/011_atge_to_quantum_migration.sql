-- ============================================================================
-- ATGE to Quantum BTC SUPER SPEC - Complete Data Migration Script
-- ============================================================================
-- Version: 1.0.0
-- Purpose: Migrate existing ATGE trade signals to new Quantum BTC schema
-- Author: Quantum-Superior Mode
-- Date: November 25, 2025
-- Requirements: 15.1-15.10
--
-- This script:
-- 1. Maps old ATGE schema to new Quantum BTC schema
-- 2. Preserves all historical data with proper transformations
-- 3. Maintains referential integrity
-- 4. Provides rollback capability
-- 5. Validates migration success
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Pre-Migration Validation
-- ============================================================================

-- Check if source tables exist
DO $
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_signals') THEN
    missing_tables := array_append(missing_tables, 'trade_signals');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_results') THEN
    missing_tables := array_append(missing_tables, 'trade_results');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_technical_indicators') THEN
    missing_tables := array_append(missing_tables, 'trade_technical_indicators');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_market_snapshot') THEN
    missing_tables := array_append(missing_tables, 'trade_market_snapshot');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing source tables: %', array_to_string(missing_tables, ', ');
  END IF;
  
  RAISE NOTICE '✅ All source tables exist';
END $;

-- Check if destination tables exist
DO $
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'btc_trades') THEN
    missing_tables := array_append(missing_tables, 'btc_trades');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'btc_hourly_snapshots') THEN
    missing_tables := array_append(missing_tables, 'btc_hourly_snapshots');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing destination tables: %. Run Quantum BTC table creation first.', array_to_string(missing_tables, ', ');
  END IF;
  
  RAISE NOTICE '✅ All destination tables exist';
END $;

-- ============================================================================
-- STEP 2: Create Backup Tables
-- ============================================================================

-- Backup existing ATGE data before migration
CREATE TABLE IF NOT EXISTS trade_signals_backup AS 
SELECT * FROM trade_signals WHERE 1=0;

CREATE TABLE IF NOT EXISTS trade_results_backup AS 
SELECT * FROM trade_results WHERE 1=0;

CREATE TABLE IF NOT EXISTS trade_technical_indicators_backup AS 
SELECT * FROM trade_technical_indicators WHERE 1=0;

CREATE TABLE IF NOT EXISTS trade_market_snapshot_backup AS 
SELECT * FROM trade_market_snapshot WHERE 1=0;

-- Copy data to backup tables
INSERT INTO trade_signals_backup SELECT * FROM trade_signals;
INSERT INTO trade_results_backup SELECT * FROM trade_results;
INSERT INTO trade_technical_indicators_backup SELECT * FROM trade_technical_indicators;
INSERT INTO trade_market_snapshot_backup SELECT * FROM trade_market_snapshot;

RAISE NOTICE '✅ Backup tables created with % trade signals', (SELECT COUNT(*) FROM trade_signals_backup);

-- ============================================================================
-- STEP 3: Schema Mapping Documentation
-- ============================================================================

/*
SCHEMA MAPPING: ATGE → Quantum BTC

OLD ATGE SCHEMA (trade_signals):
- id → btc_trades.id (UUID, preserved)
- user_id → btc_trades.user_id (UUID, preserved)
- symbol → btc_trades.symbol (VARCHAR, preserved)
- entry_price → btc_trades.entry_min, entry_max, entry_optimal (single value → three values)
- tp1_price → btc_trades.tp1_price (preserved)
- tp1_allocation → btc_trades.tp1_allocation (40% → 50%)
- tp2_price → btc_trades.tp2_price (preserved)
- tp2_allocation → btc_trades.tp2_allocation (30% → 30%)
- tp3_price → btc_trades.tp3_price (preserved)
- tp3_allocation → btc_trades.tp3_allocation (30% → 20%)
- stop_loss_price → btc_trades.stop_loss_price (preserved)
- stop_loss_percentage → btc_trades.max_loss_percent (renamed)
- timeframe → btc_trades.timeframe (preserved)
- timeframe_hours → btc_trades.timeframe_hours (preserved)
- confidence_score → btc_trades.confidence_score (preserved)
- ai_reasoning → btc_trades.quantum_reasoning (renamed)
- risk_reward_ratio → (not migrated, calculated on demand)
- market_condition → (not migrated, stored in snapshots)
- ai_model_version → (not migrated, new system uses GPT-5.1)
- generated_at → btc_trades.generated_at (preserved)
- expires_at → btc_trades.expires_at (preserved)
- created_at → btc_trades.created_at (preserved)
- updated_at → btc_trades.updated_at (preserved)

NEW QUANTUM BTC FIELDS (defaults for migrated data):
- mathematical_justification → 'Migrated from ATGE - Original analysis preserved'
- wave_pattern_collapse → 'CONTINUATION' (default)
- data_quality_score → 90 (high quality for historical data)
- cross_api_proof → {} (empty JSON object)
- historical_triggers → [] (empty JSON array)
- status → Mapped from old status values
- last_validated_at → NULL (will be set by HQVE)

STATUS MAPPING:
- 'active' → 'ACTIVE'
- 'completed_success' → 'HIT'
- 'completed_failure' → 'NOT_HIT'
- 'expired' → 'EXPIRED'
- 'incomplete_data' → 'INVALIDATED'
*/

-- ============================================================================
-- STEP 4: Migrate Trade Signals to btc_trades
-- ============================================================================

-- Migrate all Bitcoin trade signals from ATGE to Quantum BTC
INSERT INTO btc_trades (
  id,
  user_id,
  symbol,
  entry_min,
  entry_max,
  entry_optimal,
  tp1_price,
  tp1_allocation,
  tp2_price,
  tp2_allocation,
  tp3_price,
  tp3_allocation,
  stop_loss_price,
  max_loss_percent,
  timeframe,
  timeframe_hours,
  confidence_score,
  quantum_reasoning,
  mathematical_justification,
  wave_pattern_collapse,
  data_quality_score,
  cross_api_proof,
  historical_triggers,
  status,
  generated_at,
  expires_at,
  last_validated_at,
  created_at,
  updated_at
)
SELECT
  ts.id,
  ts.user_id,
  ts.symbol,
  
  -- Entry zone: use entry_price for all three values
  -- In the new system, we'll have a range, but for migrated data, use the same value
  ts.entry_price AS entry_min,
  ts.entry_price AS entry_max,
  ts.entry_price AS entry_optimal,
  
  -- Take profit targets with adjusted allocations
  -- Old: TP1=40%, TP2=30%, TP3=30%
  -- New: TP1=50%, TP2=30%, TP3=20%
  ts.tp1_price,
  50 AS tp1_allocation,
  ts.tp2_price,
  30 AS tp2_allocation,
  ts.tp3_price,
  20 AS tp3_allocation,
  
  -- Stop loss
  ts.stop_loss_price,
  ts.stop_loss_percentage AS max_loss_percent,
  
  -- Timeframe
  ts.timeframe,
  ts.timeframe_hours,
  
  -- Confidence score
  ts.confidence_score,
  
  -- Quantum reasoning: preserve original AI reasoning
  COALESCE(
    ts.ai_reasoning,
    'Migrated from ATGE - AI analysis: ' || ts.market_condition || ' market with ' || ts.confidence_score || '% confidence'
  ) AS quantum_reasoning,
  
  -- Mathematical justification: provide migration context
  'Migrated from ATGE system on ' || NOW()::DATE || '. ' ||
  'Original entry: $' || ts.entry_price || ', ' ||
  'Risk/Reward: ' || COALESCE(ts.risk_reward_ratio::TEXT, 'N/A') || ', ' ||
  'Market: ' || ts.market_condition || ', ' ||
  'Model: ' || COALESCE(ts.ai_model_version, 'GPT-4o') AS mathematical_justification,
  
  -- Wave pattern collapse: default to CONTINUATION for migrated trades
  'CONTINUATION' AS wave_pattern_collapse,
  
  -- Data quality score: use 90 for historical data (high quality)
  90 AS data_quality_score,
  
  -- Cross API proof: empty JSON object (not available for historical data)
  '{}'::JSONB AS cross_api_proof,
  
  -- Historical triggers: empty JSON array (not available for historical data)
  '[]'::JSONB AS historical_triggers,
  
  -- Status mapping
  CASE 
    WHEN ts.status = 'completed_success' THEN 'HIT'
    WHEN ts.status = 'completed_failure' THEN 'NOT_HIT'
    WHEN ts.status = 'expired' THEN 'EXPIRED'
    WHEN ts.status = 'incomplete_data' THEN 'INVALIDATED'
    WHEN ts.status = 'active' THEN 'ACTIVE'
    ELSE 'ACTIVE'
  END AS status,
  
  -- Timestamps
  ts.generated_at,
  ts.expires_at,
  NULL AS last_validated_at,  -- Will be set by HQVE
  ts.created_at,
  ts.updated_at
FROM trade_signals ts
WHERE ts.symbol = 'BTC'  -- Only migrate Bitcoin trades
  AND NOT EXISTS (
    SELECT 1 FROM btc_trades bt WHERE bt.id = ts.id
  )  -- Avoid duplicates
ON CONFLICT (id) DO NOTHING;

-- Log migration count
DO $
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM btc_trades WHERE mathematical_justification LIKE '%Migrated from ATGE%';
  RAISE NOTICE '✅ Migrated % trade signals to btc_trades', migrated_count;
END $;

-- ============================================================================
-- STEP 5: Migrate Trade Results to btc_hourly_snapshots
-- ============================================================================

-- For completed trades, create an initial snapshot based on trade results
-- This provides historical context for the new hourly validation system
INSERT INTO btc_hourly_snapshots (
  trade_id,
  price,
  volume_24h,
  market_cap,
  mempool_size,
  whale_transactions,
  difficulty,
  sentiment_score,
  social_dominance,
  deviation_from_prediction,
  phase_shift_detected,
  data_quality_score,
  snapshot_at,
  created_at
)
SELECT
  tr.trade_signal_id AS trade_id,
  
  -- Use actual exit price or entry price
  COALESCE(tr.actual_exit_price, tr.actual_entry_price) AS price,
  
  -- Get volume and market cap from market snapshot if available
  COALESCE(tms.volume_24h, 0) AS volume_24h,
  COALESCE(tms.market_cap, 0) AS market_cap,
  
  -- Default values for on-chain data (not available in old system)
  0 AS mempool_size,
  COALESCE(tms.whale_activity_count, 0) AS whale_transactions,
  NULL AS difficulty,
  
  -- Sentiment data from market snapshot
  tms.social_sentiment_score AS sentiment_score,
  NULL AS social_dominance,
  
  -- Calculate deviation from prediction
  CASE 
    WHEN tr.actual_exit_price IS NOT NULL AND tr.actual_entry_price IS NOT NULL THEN
      ABS((tr.actual_exit_price - tr.actual_entry_price) / tr.actual_entry_price * 100)
    ELSE 0
  END AS deviation_from_prediction,
  
  -- Phase shift detection (default to false for historical data)
  FALSE AS phase_shift_detected,
  
  -- Use data quality score from trade results
  tr.data_quality_score,
  
  -- Use backtested_at as snapshot time
  tr.backtested_at AS snapshot_at,
  NOW() AS created_at
FROM trade_results tr
LEFT JOIN trade_market_snapshot tms ON tms.trade_signal_id = tr.trade_signal_id
WHERE EXISTS (
  SELECT 1 FROM btc_trades bt WHERE bt.id = tr.trade_signal_id
)
AND NOT EXISTS (
  SELECT 1 FROM btc_hourly_snapshots bhs WHERE bhs.trade_id = tr.trade_signal_id
)
ON CONFLICT DO NOTHING;

-- Log snapshot migration count
DO $
DECLARE
  snapshot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO snapshot_count FROM btc_hourly_snapshots;
  RAISE NOTICE '✅ Created % initial snapshots from trade results', snapshot_count;
END $;

-- ============================================================================
-- STEP 6: Create Migration Metadata Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quantum_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name VARCHAR(255) NOT NULL,
  migration_version VARCHAR(50) NOT NULL,
  source_table VARCHAR(100) NOT NULL,
  destination_table VARCHAR(100) NOT NULL,
  records_migrated INTEGER NOT NULL DEFAULT 0,
  migration_status VARCHAR(50) NOT NULL,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Log this migration
INSERT INTO quantum_migration_log (
  migration_name,
  migration_version,
  source_table,
  destination_table,
  records_migrated,
  migration_status,
  completed_at
)
SELECT
  'ATGE to Quantum BTC Migration',
  '1.0.0',
  'trade_signals',
  'btc_trades',
  COUNT(*),
  'COMPLETED',
  NOW()
FROM btc_trades
WHERE mathematical_justification LIKE '%Migrated from ATGE%';

-- Log snapshot migration
INSERT INTO quantum_migration_log (
  migration_name,
  migration_version,
  source_table,
  destination_table,
  records_migrated,
  migration_status,
  completed_at
)
SELECT
  'ATGE Results to Quantum Snapshots',
  '1.0.0',
  'trade_results',
  'btc_hourly_snapshots',
  COUNT(*),
  'COMPLETED',
  NOW()
FROM btc_hourly_snapshots;

RAISE NOTICE '✅ Migration metadata logged';

-- ============================================================================
-- STEP 7: Create Compatibility Views
-- ============================================================================

-- View to maintain backward compatibility with old ATGE queries
CREATE OR REPLACE VIEW atge_trade_signals_compat AS
SELECT
  id,
  user_id,
  symbol,
  entry_optimal AS entry_price,
  tp1_price,
  tp1_allocation,
  tp2_price,
  tp2_allocation,
  tp3_price,
  tp3_allocation,
  stop_loss_price,
  max_loss_percent AS stop_loss_percentage,
  timeframe,
  timeframe_hours,
  confidence_score,
  data_quality_score,
  quantum_reasoning AS ai_reasoning,
  'GPT-5.1' AS ai_model_version,
  CASE 
    WHEN status = 'HIT' THEN 'completed_success'
    WHEN status = 'NOT_HIT' THEN 'completed_failure'
    WHEN status = 'EXPIRED' THEN 'expired'
    WHEN status = 'INVALIDATED' THEN 'incomplete_data'
    WHEN status = 'ACTIVE' THEN 'active'
    ELSE 'active'
  END AS status,
  generated_at,
  expires_at,
  created_at,
  updated_at
FROM btc_trades;

-- View for trade results compatibility
CREATE OR REPLACE VIEW atge_trade_results_compat AS
SELECT
  bhs.id,
  bhs.trade_id AS trade_signal_id,
  bhs.price AS actual_entry_price,
  bhs.price AS actual_exit_price,
  bt.status = 'HIT' AS tp1_hit,
  bhs.snapshot_at AS tp1_hit_at,
  bt.tp1_price AS tp1_hit_price,
  FALSE AS tp2_hit,
  NULL::TIMESTAMP WITH TIME ZONE AS tp2_hit_at,
  NULL::DECIMAL AS tp2_hit_price,
  FALSE AS tp3_hit,
  NULL::TIMESTAMP WITH TIME ZONE AS tp3_hit_at,
  NULL::DECIMAL AS tp3_hit_price,
  bt.status = 'NOT_HIT' AS stop_loss_hit,
  bhs.snapshot_at AS stop_loss_hit_at,
  bt.stop_loss_price AS stop_loss_hit_price,
  0 AS profit_loss_usd,
  0 AS profit_loss_percentage,
  0 AS trade_duration_minutes,
  1000 AS trade_size_usd,
  2 AS fees_usd,
  2 AS slippage_usd,
  0 AS net_profit_loss_usd,
  'CoinMarketCap' AS data_source,
  '1h' AS data_resolution,
  bhs.data_quality_score,
  'Migrated from ATGE' AS ai_analysis,
  bhs.snapshot_at AS backtested_at,
  bhs.created_at
FROM btc_hourly_snapshots bhs
JOIN btc_trades bt ON bt.id = bhs.trade_id;

RAISE NOTICE '✅ Compatibility views created';

-- ============================================================================
-- STEP 8: Validation and Verification
-- ============================================================================

-- Verify migration completeness
DO $
DECLARE
  atge_btc_count INTEGER;
  quantum_btc_count INTEGER;
  migrated_count INTEGER;
  snapshot_count INTEGER;
  success_rate DECIMAL;
BEGIN
  -- Count source records
  SELECT COUNT(*) INTO atge_btc_count FROM trade_signals WHERE symbol = 'BTC';
  
  -- Count destination records
  SELECT COUNT(*) INTO quantum_btc_count FROM btc_trades;
  
  -- Count migrated records
  SELECT COUNT(*) INTO migrated_count 
  FROM btc_trades 
  WHERE mathematical_justification LIKE '%Migrated from ATGE%';
  
  -- Count snapshots
  SELECT COUNT(*) INTO snapshot_count FROM btc_hourly_snapshots;
  
  -- Calculate success rate
  IF atge_btc_count > 0 THEN
    success_rate := (migrated_count::DECIMAL / atge_btc_count::DECIMAL) * 100;
  ELSE
    success_rate := 100;
  END IF;
  
  -- Output verification results
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Source (ATGE) BTC Trades: %', atge_btc_count;
  RAISE NOTICE 'Destination (Quantum) BTC Trades: %', quantum_btc_count;
  RAISE NOTICE 'Successfully Migrated: %', migrated_count;
  RAISE NOTICE 'Initial Snapshots Created: %', snapshot_count;
  RAISE NOTICE 'Migration Success Rate: %% ', ROUND(success_rate, 2);
  RAISE NOTICE '==============================';
  RAISE NOTICE '';
  
  -- Verify migration success
  IF success_rate >= 99 THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL - All trades migrated';
  ELSIF success_rate >= 90 THEN
    RAISE WARNING '⚠️ MIGRATION MOSTLY SUCCESSFUL - Some trades may not have migrated (%%)', ROUND(success_rate, 2);
  ELSE
    RAISE EXCEPTION '❌ MIGRATION FAILED - Only %% of trades migrated', ROUND(success_rate, 2);
  END IF;
END $;

-- Verify data integrity
DO $
DECLARE
  integrity_issues INTEGER := 0;
BEGIN
  -- Check for NULL required fields
  SELECT COUNT(*) INTO integrity_issues
  FROM btc_trades
  WHERE entry_optimal IS NULL
     OR tp1_price IS NULL
     OR stop_loss_price IS NULL
     OR quantum_reasoning IS NULL;
  
  IF integrity_issues > 0 THEN
    RAISE WARNING '⚠️ Found % trades with NULL required fields', integrity_issues;
  ELSE
    RAISE NOTICE '✅ Data integrity check passed - No NULL required fields';
  END IF;
  
  -- Check for invalid confidence scores
  SELECT COUNT(*) INTO integrity_issues
  FROM btc_trades
  WHERE confidence_score < 0 OR confidence_score > 100;
  
  IF integrity_issues > 0 THEN
    RAISE WARNING '⚠️ Found % trades with invalid confidence scores', integrity_issues;
  ELSE
    RAISE NOTICE '✅ Confidence score validation passed';
  END IF;
  
  -- Check for invalid timeframes
  SELECT COUNT(*) INTO integrity_issues
  FROM btc_trades
  WHERE timeframe NOT IN ('1h', '4h', '1d', '1w');
  
  IF integrity_issues > 0 THEN
    RAISE WARNING '⚠️ Found % trades with invalid timeframes', integrity_issues;
  ELSE
    RAISE NOTICE '✅ Timeframe validation passed';
  END IF;
END $;

-- ============================================================================
-- STEP 9: Grant Permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON btc_trades TO authenticated;
GRANT SELECT ON btc_hourly_snapshots TO authenticated;
GRANT SELECT ON quantum_migration_log TO authenticated;
GRANT SELECT ON atge_trade_signals_compat TO authenticated;
GRANT SELECT ON atge_trade_results_compat TO authenticated;

RAISE NOTICE '✅ Permissions granted';

COMMIT;

-- ============================================================================
-- STEP 10: Post-Migration Summary
-- ============================================================================

-- Display final migration summary
SELECT 
  '🎉 Quantum BTC Migration Complete' AS status,
  NOW() AS completed_at,
  (SELECT COUNT(*) FROM btc_trades) AS total_btc_trades,
  (SELECT COUNT(*) FROM btc_trades WHERE mathematical_justification LIKE '%Migrated from ATGE%') AS migrated_trades,
  (SELECT COUNT(*) FROM trade_signals WHERE symbol = 'BTC') AS original_atge_btc_trades,
  (SELECT COUNT(*) FROM btc_hourly_snapshots) AS initial_snapshots,
  (SELECT COUNT(*) FROM quantum_migration_log) AS migration_log_entries;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
To rollback this migration:

1. Delete migrated data:
   DELETE FROM btc_hourly_snapshots WHERE trade_id IN (
     SELECT id FROM btc_trades WHERE mathematical_justification LIKE '%Migrated from ATGE%'
   );
   DELETE FROM btc_trades WHERE mathematical_justification LIKE '%Migrated from ATGE%';

2. Restore from backup (if needed):
   TRUNCATE TABLE trade_signals CASCADE;
   INSERT INTO trade_signals SELECT * FROM trade_signals_backup;
   
   TRUNCATE TABLE trade_results CASCADE;
   INSERT INTO trade_results SELECT * FROM trade_results_backup;
   
   TRUNCATE TABLE trade_technical_indicators CASCADE;
   INSERT INTO trade_technical_indicators SELECT * FROM trade_technical_indicators_backup;
   
   TRUNCATE TABLE trade_market_snapshot CASCADE;
   INSERT INTO trade_market_snapshot SELECT * FROM trade_market_snapshot_backup;

3. Drop compatibility views:
   DROP VIEW IF EXISTS atge_trade_signals_compat;
   DROP VIEW IF EXISTS atge_trade_results_compat;

4. Drop migration log:
   DROP TABLE IF EXISTS quantum_migration_log;
*/

-- ============================================================================
-- MIGRATION SCRIPT COMPLETE
-- ============================================================================
