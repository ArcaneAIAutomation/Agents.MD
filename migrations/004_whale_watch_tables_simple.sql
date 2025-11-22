-- Whale Watch Database Tables (Simplified)
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS whale_analysis CASCADE;
DROP TABLE IF EXISTS whale_transactions CASCADE;
DROP TABLE IF EXISTS whale_watch_cache CASCADE;

-- Table: whale_transactions
CREATE TABLE whale_transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  blockchain VARCHAR(10) NOT NULL DEFAULT 'BTC',
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 2) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50),
  description TEXT,
  block_height INTEGER,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  transaction_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: whale_analysis
CREATE TABLE whale_analysis (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(255) NOT NULL REFERENCES whale_transactions(tx_hash) ON DELETE CASCADE,
  analysis_provider VARCHAR(50) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  analysis_data JSONB NOT NULL,
  blockchain_data JSONB,
  metadata JSONB,
  confidence INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, analysis_provider, analysis_type)
);

-- Table: whale_watch_cache
CREATE TABLE whale_watch_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  threshold_btc DECIMAL(10, 2) NOT NULL,
  whale_count INTEGER NOT NULL,
  whale_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whale_transactions_detected_at ON whale_transactions(detected_at DESC);
CREATE INDEX idx_whale_transactions_amount ON whale_transactions(amount DESC);
CREATE INDEX idx_whale_transactions_type ON whale_transactions(transaction_type);
CREATE INDEX idx_whale_analysis_tx_hash ON whale_analysis(tx_hash);
CREATE INDEX idx_whale_analysis_provider ON whale_analysis(analysis_provider);
CREATE INDEX idx_whale_watch_cache_expires ON whale_watch_cache(expires_at);

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('whale_transactions', 'whale_analysis', 'whale_watch_cache')
ORDER BY table_name;
