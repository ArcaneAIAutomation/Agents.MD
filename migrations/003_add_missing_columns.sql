-- Migration: Add Missing Columns to ATGE Tables
-- Description: Adds galaxy_score and other LunarCrush columns if they don't exist
-- Date: 2025-01-27
-- Author: System

BEGIN;

-- ============================================================================
-- Add LunarCrush columns to trade_market_snapshot if they don't exist
-- ============================================================================

-- Add galaxy_score column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'galaxy_score'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN galaxy_score INTEGER CHECK (galaxy_score >= 0 AND galaxy_score <= 100);
    
    RAISE NOTICE 'Added galaxy_score column to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'galaxy_score column already exists in trade_market_snapshot';
  END IF;
END $$;

-- Add alt_rank column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'alt_rank'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN alt_rank INTEGER;
    
    RAISE NOTICE 'Added alt_rank column to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'alt_rank column already exists in trade_market_snapshot';
  END IF;
END $$;

-- Add social_dominance column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'social_dominance'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN social_dominance DECIMAL(5, 2);
    
    RAISE NOTICE 'Added social_dominance column to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'social_dominance column already exists in trade_market_snapshot';
  END IF;
END $$;

-- Add sentiment columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'sentiment_positive'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN sentiment_positive DECIMAL(5, 2),
    ADD COLUMN sentiment_negative DECIMAL(5, 2),
    ADD COLUMN sentiment_neutral DECIMAL(5, 2);
    
    RAISE NOTICE 'Added sentiment columns to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'sentiment columns already exist in trade_market_snapshot';
  END IF;
END $$;

-- Add social volume columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'social_volume_24h'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN social_volume_24h INTEGER,
    ADD COLUMN social_posts_24h INTEGER,
    ADD COLUMN social_interactions_24h INTEGER,
    ADD COLUMN social_contributors_24h INTEGER;
    
    RAISE NOTICE 'Added social volume columns to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'social volume columns already exist in trade_market_snapshot';
  END IF;
END $$;

-- Add correlation_score column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'correlation_score'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN correlation_score DECIMAL(5, 4);
    
    RAISE NOTICE 'Added correlation_score column to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'correlation_score column already exists in trade_market_snapshot';
  END IF;
END $$;

-- Add whale_activity_count column (renamed from whale_transactions_24h for consistency)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_market_snapshot' 
    AND column_name = 'whale_activity_count'
  ) THEN
    ALTER TABLE trade_market_snapshot 
    ADD COLUMN whale_activity_count INTEGER;
    
    RAISE NOTICE 'Added whale_activity_count column to trade_market_snapshot';
  ELSE
    RAISE NOTICE 'whale_activity_count column already exists in trade_market_snapshot';
  END IF;
END $$;

-- Create index on galaxy_score if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'trade_market_snapshot' 
    AND indexname = 'idx_trade_market_snapshot_galaxy_score'
  ) THEN
    CREATE INDEX idx_trade_market_snapshot_galaxy_score 
    ON trade_market_snapshot(galaxy_score DESC);
    
    RAISE NOTICE 'Created index on galaxy_score';
  ELSE
    RAISE NOTICE 'Index on galaxy_score already exists';
  END IF;
END $$;

COMMIT;
