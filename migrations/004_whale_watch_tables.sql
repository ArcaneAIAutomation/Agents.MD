-- Whale Watch Database Tables
-- Stores whale transaction data and analysis results

-- Table: whale_transactions
-- Stores detected whale transactions
CREATE TABLE IF NOT EXISTS whale_transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  blockchain VARCHAR(10) NOT NULL DEFAULT 'BTC',
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 2) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50), -- exchange_deposit, exchange_withdrawal, whale_to_whale, unknown
  description TEXT,
  block_height INTEGER,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  transaction_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: whale_analysis
-- Stores AI analysis results for whale transactions
CREATE TABLE IF NOT EXISTS whale_analysis (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(255) NOT NULL REFERENCES whale_transactions(tx_hash) ON DELETE CASCADE,
  analysis_provider VARCHAR(50) NOT NULL, -- caesar, gemini, openai, gemini-deep-dive
  analysis_type VARCHAR(50) NOT NULL, -- quick, deep-dive
  analysis_data JSONB NOT NULL, -- Full analysis JSON
  blockchain_data JSONB, -- Blockchain data used for analysis
  metadata JSONB, -- Model, processing time, etc.
  confidence INTEGER, -- 0-100
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- pending, analyzing, completed, failed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, analysis_provider, analysis_type)
);

-- Table: whale_watch_cache
-- Caches whale detection results
CREATE TABLE IF NOT EXISTS whale_watch_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  threshold_btc DECIMAL(10, 2) NOT NULL,
  whale_count INTEGER NOT NULL,
  whale_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_transactions_detected_at ON whale_transactions(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_amount ON whale_transactions(amount DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_type ON whale_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_whale_analysis_tx_hash ON whale_analysis(tx_hash);
CREATE INDEX IF NOT EXISTS idx_whale_analysis_provider ON whale_analysis(analysis_provider);
CREATE INDEX IF NOT EXISTS idx_whale_watch_cache_expires ON whale_watch_cache(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whale_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS whale_transactions_updated_at ON whale_transactions;
CREATE TRIGGER whale_transactions_updated_at
  BEFORE UPDATE ON whale_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_whale_updated_at();

DROP TRIGGER IF EXISTS whale_analysis_updated_at ON whale_analysis;
CREATE TRIGGER whale_analysis_updated_at
  BEFORE UPDATE ON whale_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_whale_updated_at();

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_whale_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM whale_watch_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE whale_transactions IS 'Stores detected Bitcoin whale transactions (>50 BTC)';
COMMENT ON TABLE whale_analysis IS 'Stores AI analysis results for whale transactions';
COMMENT ON TABLE whale_watch_cache IS 'Caches whale detection results for 30 seconds';
COMMENT ON COLUMN whale_transactions.tx_hash IS 'Bitcoin transaction hash (unique identifier)';
COMMENT ON COLUMN whale_transactions.amount IS 'Transaction amount in BTC';
COMMENT ON COLUMN whale_transactions.amount_usd IS 'Transaction amount in USD at detection time';
COMMENT ON COLUMN whale_analysis.analysis_data IS 'Full JSON analysis from AI provider';
COMMENT ON COLUMN whale_analysis.blockchain_data IS 'Blockchain data used for analysis (address history, etc.)';
COMMENT ON COLUMN whale_analysis.metadata IS 'Analysis metadata (model, processing time, data sources)';
