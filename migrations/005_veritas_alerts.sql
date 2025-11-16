-- ============================================================================
-- Veritas Protocol - Alerts Table Migration
-- ============================================================================
-- This migration creates the veritas_alerts table for storing validation
-- alerts that require human review.
--
-- Run this migration with:
-- psql $DATABASE_URL -f migrations/005_veritas_alerts.sql
-- ============================================================================

-- Create veritas_alerts table
CREATE TABLE IF NOT EXISTS veritas_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'fatal')),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('market_discrepancy', 'social_impossibility', 'onchain_inconsistency', 'fatal_error')),
  message TEXT NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_symbol ON veritas_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_severity ON veritas_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_reviewed ON veritas_alerts(reviewed);
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_timestamp ON veritas_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_requires_review ON veritas_alerts(requires_human_review) WHERE requires_human_review = true;

-- Create composite index for pending alerts query
CREATE INDEX IF NOT EXISTS idx_veritas_alerts_pending ON veritas_alerts(reviewed, timestamp DESC) WHERE reviewed = false;

-- Add comments for documentation
COMMENT ON TABLE veritas_alerts IS 'Stores Veritas Protocol validation alerts requiring human review';
COMMENT ON COLUMN veritas_alerts.id IS 'Unique identifier for the alert';
COMMENT ON COLUMN veritas_alerts.symbol IS 'Cryptocurrency symbol (e.g., BTC, ETH)';
COMMENT ON COLUMN veritas_alerts.severity IS 'Alert severity level: info, warning, error, fatal';
COMMENT ON COLUMN veritas_alerts.alert_type IS 'Type of validation alert';
COMMENT ON COLUMN veritas_alerts.message IS 'Human-readable alert message';
COMMENT ON COLUMN veritas_alerts.details IS 'JSON object containing alert details (affected sources, thresholds, etc.)';
COMMENT ON COLUMN veritas_alerts.timestamp IS 'When the alert was generated';
COMMENT ON COLUMN veritas_alerts.requires_human_review IS 'Whether this alert requires human review';
COMMENT ON COLUMN veritas_alerts.reviewed IS 'Whether the alert has been reviewed';
COMMENT ON COLUMN veritas_alerts.reviewed_by IS 'User who reviewed the alert';
COMMENT ON COLUMN veritas_alerts.reviewed_at IS 'When the alert was reviewed';
COMMENT ON COLUMN veritas_alerts.review_notes IS 'Notes from the review process';
COMMENT ON COLUMN veritas_alerts.created_at IS 'When the record was created';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON veritas_alerts TO your_app_user;

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample alerts for testing
/*
INSERT INTO veritas_alerts (
  symbol,
  severity,
  alert_type,
  message,
  details,
  timestamp,
  requires_human_review
) VALUES
(
  'BTC',
  'fatal',
  'social_impossibility',
  'Fatal Social Data Error: Contradictory mention count and distribution',
  '{"affectedSources": ["LunarCrush"], "recommendation": "Discarding social data - cannot have sentiment without mentions"}'::jsonb,
  NOW(),
  true
),
(
  'ETH',
  'warning',
  'market_discrepancy',
  'Price discrepancy detected: 2.5% variance across sources',
  '{"affectedSources": ["CoinMarketCap", "CoinGecko", "Kraken"], "discrepancyValue": 2.5, "threshold": 1.5, "recommendation": "Using Kraken as tie-breaker for final price"}'::jsonb,
  NOW(),
  false
);
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'veritas_alerts'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'veritas_alerts';

-- Count records (should be 0 initially, or 2 if sample data was inserted)
SELECT COUNT(*) as total_alerts FROM veritas_alerts;

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS veritas_alerts CASCADE;
