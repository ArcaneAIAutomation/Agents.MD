-- Migration: Add Unique Constraint to ATGE Historical Prices
-- Description: Adds unique constraint to prevent duplicate historical price entries
-- Date: 2025-01-27
-- Author: System
-- Task: Task 5.2 - Stores data in database without duplicates

BEGIN;

-- ============================================================================
-- ADD UNIQUE CONSTRAINT
-- ============================================================================
-- Purpose: Prevent duplicate historical price entries for the same symbol,
--          timestamp, and timeframe combination

-- Add unique constraint on (symbol, timestamp, timeframe)
ALTER TABLE atge_historical_prices
ADD CONSTRAINT unique_historical_price 
UNIQUE (symbol, timestamp, timeframe);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify constraint was added
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'atge_historical_prices'::regclass
  AND conname = 'unique_historical_price';

-- Test: Try to insert duplicate data (should fail)
-- INSERT INTO atge_historical_prices (symbol, timestamp, open, high, low, close, volume, timeframe, data_source)
-- VALUES ('BTC', '2025-01-01T00:00:00Z', 95000, 95500, 94800, 95200, 1000000, '1h', 'test');
-- 
-- INSERT INTO atge_historical_prices (symbol, timestamp, open, high, low, close, volume, timeframe, data_source)
-- VALUES ('BTC', '2025-01-01T00:00:00Z', 95000, 95500, 94800, 95200, 1000000, '1h', 'test');
-- Expected: ERROR: duplicate key value violates unique constraint "unique_historical_price"

