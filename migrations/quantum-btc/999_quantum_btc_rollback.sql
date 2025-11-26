-- ============================================================================
-- QUANTUM BTC SUPER SPEC - ROLLBACK MIGRATION
-- ============================================================================
-- Version: 1.0.0
-- Purpose: Safely rollback all Quantum Bitcoin Intelligence Engine tables
-- Requirements: 6.1-6.5
-- 
-- WARNING: This will DROP all tables and their data!
-- Only run this if you need to completely remove the Quantum BTC system.
-- ============================================================================

-- Begin transaction for atomic rollback
BEGIN;

-- ============================================================================
-- DROP TABLES IN REVERSE ORDER (respecting foreign key dependencies)
-- ============================================================================

-- Drop api_latency_reliability_logs (no dependencies)
DROP TABLE IF EXISTS api_latency_reliability_logs CASCADE;

-- Drop prediction_accuracy_database (no dependencies)
DROP TABLE IF EXISTS prediction_accuracy_database CASCADE;

-- Drop quantum_anomaly_logs (references btc_trades)
DROP TABLE IF EXISTS quantum_anomaly_logs CASCADE;

-- Drop btc_hourly_snapshots (references btc_trades)
DROP TABLE IF EXISTS btc_hourly_snapshots CASCADE;

-- Drop btc_trades (references users)
DROP TABLE IF EXISTS btc_trades CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_btc_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_prediction_accuracy_updated_at() CASCADE;

-- ============================================================================
-- COMMIT ROLLBACK
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after rollback to verify all tables are removed:
--
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND (table_name LIKE 'btc_%' OR table_name LIKE 'quantum_%' OR table_name LIKE 'prediction_%' OR table_name LIKE 'api_%');
--
-- Expected result: 0 rows (all tables removed)
-- ============================================================================
