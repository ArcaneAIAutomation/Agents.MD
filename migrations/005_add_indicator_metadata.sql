-- Migration: Add Technical Indicator Metadata
-- Date: January 27, 2025
-- Purpose: Add data source, timeframe, and quality tracking to technical indicators

-- Add metadata columns to trade_technical_indicators
ALTER TABLE trade_technical_indicators
ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'CoinGecko',
ADD COLUMN IF NOT EXISTS timeframe VARCHAR(10) DEFAULT '1d',
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS data_quality INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS candle_count INTEGER DEFAULT 0;

-- Add index for faster queries by timeframe
CREATE INDEX IF NOT EXISTS idx_trade_technical_indicators_timeframe 
ON trade_technical_indicators(timeframe);

-- Add index for faster queries by data source
CREATE INDEX IF NOT EXISTS idx_trade_technical_indicators_source 
ON trade_technical_indicators(data_source);

-- Update existing records with default values
UPDATE trade_technical_indicators
SET 
  data_source = 'CoinGecko',
  timeframe = '1d',
  calculated_at = NOW(),
  data_quality = 70,
  candle_count = 200
WHERE data_source IS NULL;

-- Add comment to table
COMMENT ON COLUMN trade_technical_indicators.data_source IS 'Source of OHLC data (Binance, Kraken, CoinGecko)';
COMMENT ON COLUMN trade_technical_indicators.timeframe IS 'Candle timeframe (15m, 1h, 4h, 1d)';
COMMENT ON COLUMN trade_technical_indicators.calculated_at IS 'When indicators were calculated';
COMMENT ON COLUMN trade_technical_indicators.data_quality IS 'Data quality score (0-100)';
COMMENT ON COLUMN trade_technical_indicators.candle_count IS 'Number of candles used in calculation';
