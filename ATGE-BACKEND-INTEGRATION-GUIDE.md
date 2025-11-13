# ATGE Backend Integration Guide

**Date**: January 27, 2025  
**Status**: Ready for Integration  
**Purpose**: Connect frontend TradeSignal interface with backend data

---

## Overview

The frontend has been updated to display technical indicators and market snapshots. The backend already stores this data, but we need to ensure the data structure matches the frontend interface.

---

## Current Status

### ✅ Frontend Complete
- TradeSignal interface updated with `indicators` and `snapshot` fields
- TradeDetailModal displays all technical indicators
- Market snapshot section added
- Data quality fields integrated

### ✅ Backend Data Storage
- Technical indicators stored in `trade_technical_indicators` table
- Market snapshots stored in `trade_market_snapshot` table
- Data quality fields exist in `trade_results` table

### ⚠️ Data Structure Mismatch

The backend returns data in a different structure than the frontend expects. We need to transform the data.

---

## Required Changes

### 1. Update API Response Structure (`pages/api/atge/trades.ts`)

The API currently returns:
```typescript
{
  indicators?: {
    rsiValue?: number;
    macdValue?: number;
    // ... other fields
  }
}
```

But the frontend expects:
```typescript
{
  indicators?: {
    rsiValue: number;
    rsiSignal: 'overbought' | 'oversold' | 'neutral';
    macdValue: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    // ... other fields
  }
}
```

**Solution**: Add signal calculation logic to the API response mapping.

### 2. Add Signal Calculation Functions

Add these helper functions to `pages/api/atge/trades.ts`:

```typescript
/**
 * Calculate RSI signal based on value
 */
function calculateRSISignal(rsiValue: number): 'overbought' | 'oversold' | 'neutral' {
  if (rsiValue > 70) return 'overbought';
  if (rsiValue < 30) return 'oversold';
  return 'neutral';
}

/**
 * Calculate MACD signal based on value
 */
function calculateMACDSignal(macdValue: number): 'bullish' | 'bearish' | 'neutral' {
  if (macdValue > 0) return 'bullish';
  if (macdValue < 0) return 'bearish';
  return 'neutral';
}
```

### 3. Update Indicators Mapping

Replace the indicators mapping section (around line 330) with:

```typescript
// Add indicators if exists
if (row.rsi_value !== null) {
  const rsiValue = parseFloat(row.rsi_value);
  const macdValue = row.macd_value ? parseFloat(row.macd_value) : 0;
  
  trade.indicators = {
    rsiValue: rsiValue,
    rsiSignal: calculateRSISignal(rsiValue),
    macdValue: macdValue,
    macdSignal: calculateMACDSignal(macdValue),
    ema20: row.ema_20 ? parseFloat(row.ema_20) : 0,
    ema50: row.ema_50 ? parseFloat(row.ema_50) : 0,
    ema200: row.ema_200 ? parseFloat(row.ema_200) : 0,
    bollingerUpper: row.bollinger_upper ? parseFloat(row.bollinger_upper) : 0,
    bollingerMiddle: row.bollinger_middle ? parseFloat(row.bollinger_middle) : 0,
    bollingerLower: row.bollinger_lower ? parseFloat(row.bollinger_lower) : 0,
    volumeAvg: row.indicator_volume ? parseFloat(row.indicator_volume) : 0,
    atr: row.atr_value ? parseFloat(row.atr_value) : 0
  };
}
```

### 4. Update Snapshot Mapping

Replace the snapshot mapping section (around line 350) with:

```typescript
// Add snapshot if exists
if (row.current_price !== null) {
  trade.snapshot = {
    price: parseFloat(row.current_price),
    volume24h: row.snapshot_volume ? parseFloat(row.snapshot_volume) : 0,
    marketCap: row.snapshot_market_cap ? parseFloat(row.snapshot_market_cap) : 0,
    priceChange24h: row.price_change_24h ? parseFloat(row.price_change_24h) : 0,
    high24h: row.high_24h ? parseFloat(row.high_24h) : parseFloat(row.current_price),
    low24h: row.low_24h ? parseFloat(row.low_24h) : parseFloat(row.current_price),
    timestamp: new Date(row.snapshot_at)
  };
}
```

### 5. Add Missing Snapshot Fields to Database

The `trade_market_snapshot` table needs `high_24h` and `low_24h` columns:

```sql
-- Add to migrations/004_add_trade_display_fields.sql

ALTER TABLE trade_market_snapshot 
ADD COLUMN IF NOT EXISTS high_24h DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS low_24h DECIMAL(20, 8);

COMMENT ON COLUMN trade_market_snapshot.high_24h IS '24-hour high price';
COMMENT ON COLUMN trade_market_snapshot.low_24h IS '24-hour low price';
```

### 6. Update Market Snapshot Storage

Update `lib/atge/database.ts` - `storeMarketSnapshot` function to include high/low:

```typescript
export async function storeMarketSnapshot(snapshot: {
  tradeSignalId: string;
  currentPrice: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  high24h?: number;  // ADD THIS
  low24h?: number;   // ADD THIS
  socialSentimentScore?: number;
  whaleActivityCount?: number;
  fearGreedIndex?: number;
  galaxyScore?: number;
  altRank?: number;
  socialDominance?: number;
  sentimentPositive?: number;
  sentimentNegative?: number;
  sentimentNeutral?: number;
  socialVolume24h?: number;
  socialPosts24h?: number;
  socialInteractions24h?: number;
  socialContributors24h?: number;
  correlationScore?: number;
  snapshotAt: Date;
}): Promise<void> {
  await query(`
    INSERT INTO trade_market_snapshot (
      trade_signal_id,
      current_price,
      price_change_24h,
      volume_24h,
      market_cap,
      high_24h,  -- ADD THIS
      low_24h,   -- ADD THIS
      social_sentiment_score,
      whale_activity_count,
      fear_greed_index,
      galaxy_score,
      alt_rank,
      social_dominance,
      sentiment_positive,
      sentiment_negative,
      sentiment_neutral,
      social_volume_24h,
      social_posts_24h,
      social_interactions_24h,
      social_contributors_24h,
      correlation_score,
      snapshot_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
  `, [
    snapshot.tradeSignalId,
    snapshot.currentPrice,
    snapshot.priceChange24h,
    snapshot.volume24h,
    snapshot.marketCap,
    snapshot.high24h,  // ADD THIS
    snapshot.low24h,   // ADD THIS
    snapshot.socialSentimentScore,
    snapshot.whaleActivityCount,
    snapshot.fearGreedIndex,
    snapshot.galaxyScore,
    snapshot.altRank,
    snapshot.socialDominance,
    snapshot.sentimentPositive,
    snapshot.sentimentNegative,
    snapshot.sentimentNeutral,
    snapshot.socialVolume24h,
    snapshot.socialPosts24h,
    snapshot.socialInteractions24h,
    snapshot.socialContributors24h,
    snapshot.correlationScore,
    snapshot.snapshotAt
  ]);
}
```

### 7. Update Trade Generation to Include High/Low

Update `pages/api/atge/generate.ts` - `storeMarketSnapshot` call:

```typescript
await storeMarketSnapshot({
  tradeSignalId: storedSignal.id,
  currentPrice: marketData.currentPrice,
  priceChange24h: marketData.priceChange24h,
  volume24h: marketData.volume24h,
  marketCap: marketData.marketCap,
  high24h: marketData.high24h,  // ADD THIS
  low24h: marketData.low24h,    // ADD THIS
  socialSentimentScore: sentimentData.aggregateSentiment.score,
  whaleActivityCount: onChainData.largeTransactionCount,
  fearGreedIndex: undefined,
  galaxyScore: sentimentData.lunarCrush?.galaxyScore,
  altRank: sentimentData.lunarCrush?.altRank,
  socialDominance: undefined,
  sentimentPositive: sentimentData.lunarCrush?.sentiment === 'bullish' ? 70 : sentimentData.lunarCrush?.sentiment === 'bearish' ? 30 : 50,
  sentimentNegative: sentimentData.lunarCrush?.sentiment === 'bearish' ? 70 : sentimentData.lunarCrush?.sentiment === 'bullish' ? 30 : 50,
  sentimentNeutral: sentimentData.lunarCrush?.sentiment === 'neutral' ? 100 : 0,
  socialVolume24h: undefined,
  socialPosts24h: undefined,
  socialInteractions24h: undefined,
  socialContributors24h: undefined,
  correlationScore: undefined,
  snapshotAt: new Date()
});
```

---

## Testing Checklist

After making these changes:

- [ ] Run database migration: `psql $DATABASE_URL -f migrations/004_add_trade_display_fields.sql`
- [ ] Generate a new trade signal
- [ ] Verify indicators are stored with RSI and MACD values
- [ ] Verify snapshot includes high24h and low24h
- [ ] Fetch trades via API and verify structure matches frontend interface
- [ ] Open trade detail modal and verify all data displays correctly
- [ ] Check that RSI signal shows correct color (red/orange/white)
- [ ] Check that MACD signal shows correct color (orange/red/white)
- [ ] Verify market snapshot displays all 6 metrics
- [ ] Verify data source, resolution, and quality score display

---

## Expected Data Flow

### 1. Trade Generation
```
User clicks "Generate Trade"
  ↓
API fetches market data (including high/low)
  ↓
API calculates technical indicators
  ↓
API stores trade signal
  ↓
API stores technical indicators (with RSI, MACD values)
  ↓
API stores market snapshot (with high/low)
  ↓
Returns trade ID
```

### 2. Trade Display
```
User opens trade history
  ↓
API fetches trades with LEFT JOINs
  ↓
API calculates RSI signal (overbought/oversold/neutral)
  ↓
API calculates MACD signal (bullish/bearish/neutral)
  ↓
API formats snapshot data
  ↓
Returns complete trade objects
  ↓
Frontend displays in TradeDetailModal
```

---

## Complete Code Changes

### File 1: `migrations/004_add_trade_display_fields.sql`

```sql
-- Add data quality fields to trade_results
ALTER TABLE trade_results 
ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT 'CoinMarketCap',
ADD COLUMN IF NOT EXISTS data_resolution VARCHAR(100) DEFAULT '1-minute intervals',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 100;

-- Add high/low to market snapshot
ALTER TABLE trade_market_snapshot 
ADD COLUMN IF NOT EXISTS high_24h DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS low_24h DECIMAL(20, 8);
```

### File 2: `pages/api/atge/trades.ts`

Add helper functions at the top:

```typescript
function calculateRSISignal(rsiValue: number): 'overbought' | 'oversold' | 'neutral' {
  if (rsiValue > 70) return 'overbought';
  if (rsiValue < 30) return 'oversold';
  return 'neutral';
}

function calculateMACDSignal(macdValue: number): 'bullish' | 'bearish' | 'neutral' {
  if (macdValue > 0) return 'bullish';
  if (macdValue < 0) return 'bearish';
  return 'neutral';
}
```

Update SQL query to include high/low:

```sql
-- Add to SELECT statement (around line 200)
ms.high_24h, ms.low_24h,
```

Update indicators mapping (around line 330):

```typescript
if (row.rsi_value !== null) {
  const rsiValue = parseFloat(row.rsi_value);
  const macdValue = row.macd_value ? parseFloat(row.macd_value) : 0;
  
  trade.indicators = {
    rsiValue: rsiValue,
    rsiSignal: calculateRSISignal(rsiValue),
    macdValue: macdValue,
    macdSignal: calculateMACDSignal(macdValue),
    ema20: row.ema_20 ? parseFloat(row.ema_20) : 0,
    ema50: row.ema_50 ? parseFloat(row.ema_50) : 0,
    ema200: row.ema_200 ? parseFloat(row.ema_200) : 0,
    bollingerUpper: row.bollinger_upper ? parseFloat(row.bollinger_upper) : 0,
    bollingerMiddle: row.bollinger_middle ? parseFloat(row.bollinger_middle) : 0,
    bollingerLower: row.bollinger_lower ? parseFloat(row.bollinger_lower) : 0,
    volumeAvg: row.indicator_volume ? parseFloat(row.indicator_volume) : 0,
    atr: row.atr_value ? parseFloat(row.atr_value) : 0
  };
}
```

Update snapshot mapping (around line 350):

```typescript
if (row.current_price !== null) {
  trade.snapshot = {
    price: parseFloat(row.current_price),
    volume24h: row.snapshot_volume ? parseFloat(row.snapshot_volume) : 0,
    marketCap: row.snapshot_market_cap ? parseFloat(row.snapshot_market_cap) : 0,
    priceChange24h: row.price_change_24h ? parseFloat(row.price_change_24h) : 0,
    high24h: row.high_24h ? parseFloat(row.high_24h) : parseFloat(row.current_price),
    low24h: row.low_24h ? parseFloat(row.low_24h) : parseFloat(row.current_price),
    timestamp: new Date(row.snapshot_at)
  };
}
```

---

## Summary

The frontend is ready to display complete trade details. To complete the integration:

1. ✅ Run database migration to add missing fields
2. ✅ Update API to calculate RSI/MACD signals
3. ✅ Update API to include high/low in snapshot
4. ✅ Update trade generation to store high/low
5. ✅ Test end-to-end flow

**Estimated Time**: 1-2 hours

**Priority**: High - Required for proper trade detail display

---

**Status**: Ready for Implementation 🚀
