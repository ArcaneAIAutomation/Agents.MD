# Glassnode API Integration for ATGE

## Overview

This integration adds Bitcoin on-chain metrics to the ATGE (AI Trade Generation Engine) system using the Glassnode API. The metrics provide additional context for trade signal generation and analysis.

## Features

### Supported Metrics

1. **SOPR (Spent Output Profit Ratio)**
   - Measures the profit ratio of spent Bitcoin outputs
   - **SOPR > 1**: Coins are being spent at a profit (bullish signal)
   - **SOPR < 1**: Coins are being spent at a loss (bearish signal)
   - **SOPR = 1**: Break-even

2. **MVRV Z-Score (Market Value to Realized Value Z-Score)**
   - Measures how far the market value deviates from realized value
   - **MVRV > 7**: Overvalued (potential market top)
   - **MVRV 0-7**: Fair value range
   - **MVRV < 0**: Undervalued (potential market bottom)

### Key Features

- ✅ **1-hour caching**: Reduces API calls and costs
- ✅ **Graceful error handling**: Continues without metrics if API fails
- ✅ **Bitcoin-only**: Returns null for non-Bitcoin symbols
- ✅ **Automatic fallback**: Uses stale cache if fresh fetch fails
- ✅ **Database storage**: Metrics stored in `trade_market_snapshot` table

## Setup

### 1. Get Glassnode API Key

1. Visit https://studio.glassnode.com/settings/api
2. Sign up for a free account (or upgrade for more data)
3. Generate an API key
4. Copy the API key

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Glassnode API (Bitcoin on-chain metrics)
GLASSNODE_API_KEY=your_glassnode_api_key_here
```

Add to Vercel environment variables:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add `GLASSNODE_API_KEY` with your API key
5. Select all environments (Production, Preview, Development)
6. Save

### 3. Verify Setup

Run the test script:

```bash
npx tsx scripts/test-glassnode-api.ts
```

Expected output:
- If API key is configured: Fetches SOPR and MVRV Z-Score values
- If API key is missing: Shows graceful handling message

## Usage

### Fetch Individual Metrics

```typescript
import { fetchSOPR, fetchMVRVZScore } from '../lib/atge/glassnode';

// Fetch SOPR for Bitcoin
const sopr = await fetchSOPR('BTC');
console.log(`SOPR: ${sopr}`); // e.g., 1.05

// Fetch MVRV Z-Score for Bitcoin
const mvrvZScore = await fetchMVRVZScore('BTC');
console.log(`MVRV Z-Score: ${mvrvZScore}`); // e.g., 3.2
```

### Fetch Both Metrics in Parallel

```typescript
import { fetchBitcoinOnChainMetrics } from '../lib/atge/glassnode';

const metrics = await fetchBitcoinOnChainMetrics('BTC');
console.log(`SOPR: ${metrics.sopr}`);
console.log(`MVRV Z-Score: ${metrics.mvrvZScore}`);
```

### Interpret Metrics

```typescript
import { interpretSOPR, interpretMVRVZScore } from '../lib/atge/glassnode';

const sopr = 1.05;
console.log(interpretSOPR(sopr)); // "Bullish (profitable spending)"

const mvrvZScore = 8.5;
console.log(interpretMVRVZScore(mvrvZScore)); // "Overvalued (potential top)"
```

### Store in Database

```typescript
import { storeMarketSnapshot } from '../lib/atge/database';
import { fetchBitcoinOnChainMetrics } from '../lib/atge/glassnode';

// Fetch metrics
const metrics = await fetchBitcoinOnChainMetrics('BTC');

// Store in market snapshot
await storeMarketSnapshot({
  tradeSignalId: 'uuid-here',
  currentPrice: 95000,
  // ... other fields
  soprValue: metrics.sopr,
  mvrvZScore: metrics.mvrvZScore,
  snapshotAt: new Date()
});
```

## Integration Points

### 1. Trade Signal Generation

When generating a trade signal, fetch Glassnode metrics and store them in the market snapshot:

```typescript
// In pages/api/atge/generate.ts or similar

// Fetch Bitcoin on-chain metrics
const onChainMetrics = await fetchBitcoinOnChainMetrics(symbol);

// Store market snapshot with metrics
await storeMarketSnapshot({
  tradeSignalId: tradeSignal.id,
  currentPrice: marketData.price,
  // ... other market data
  soprValue: onChainMetrics.sopr,
  mvrvZScore: onChainMetrics.mvrvZScore,
  snapshotAt: new Date()
});
```

### 2. Trade Details Display

Display metrics in the trade details modal:

```typescript
// In components/ATGE/TradeDetailsModal.tsx or similar

{snapshot.soprValue && (
  <div>
    <h4>SOPR (Spent Output Profit Ratio)</h4>
    <p>Value: {snapshot.soprValue.toFixed(4)}</p>
    <p>Signal: {interpretSOPR(snapshot.soprValue)}</p>
  </div>
)}

{snapshot.mvrvZScore && (
  <div>
    <h4>MVRV Z-Score</h4>
    <p>Value: {snapshot.mvrvZScore.toFixed(4)}</p>
    <p>Signal: {interpretMVRVZScore(snapshot.mvrvZScore)}</p>
  </div>
)}
```

## Caching

### Cache Behavior

- **TTL**: 1 hour (3600 seconds)
- **Storage**: In-memory Map (per serverless function instance)
- **Fallback**: Uses stale cache if fresh fetch fails

### Cache Management

```typescript
import { clearMetricsCache, getCacheStats } from '../lib/atge/glassnode';

// Clear cache (useful for testing)
clearMetricsCache();

// Get cache statistics
const stats = getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Entries:`, stats.entries);
```

## Error Handling

### Graceful Degradation

The integration is designed to fail gracefully:

1. **Missing API key**: Returns null, logs warning
2. **API timeout**: Returns null, logs error
3. **API error**: Returns null, logs error
4. **Non-Bitcoin symbol**: Returns null, logs info
5. **Stale cache available**: Uses stale cache, logs warning

### Example Error Handling

```typescript
const metrics = await fetchBitcoinOnChainMetrics('BTC');

if (metrics.sopr === null) {
  console.log('SOPR not available, continuing without it');
  // Continue trade generation without SOPR
}

if (metrics.mvrvZScore === null) {
  console.log('MVRV Z-Score not available, continuing without it');
  // Continue trade generation without MVRV Z-Score
}
```

## API Limits

### Glassnode Free Tier

- **Rate limit**: ~10 requests per minute
- **Data access**: Limited to recent data (last 30 days)
- **Metrics**: Basic metrics only

### Glassnode Paid Tiers

- **Rate limit**: Higher (varies by plan)
- **Data access**: Full historical data
- **Metrics**: All metrics including advanced ones

### Optimization

- **Caching**: 1-hour TTL reduces API calls by ~95%
- **Parallel fetching**: SOPR and MVRV fetched simultaneously
- **Conditional fetching**: Only fetches for Bitcoin trades

## Database Schema

### Table: `trade_market_snapshot`

```sql
ALTER TABLE trade_market_snapshot
ADD COLUMN sopr_value DECIMAL(10, 6);

ALTER TABLE trade_market_snapshot
ADD COLUMN mvrv_z_score DECIMAL(10, 6);
```

### Migration

The columns were added in migration `006_add_verification_columns.sql`.

To verify:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trade_market_snapshot'
  AND column_name IN ('sopr_value', 'mvrv_z_score');
```

## Testing

### Unit Tests

Run the test script:

```bash
npx tsx scripts/test-glassnode-api.ts
```

### Manual Testing

1. Set `GLASSNODE_API_KEY` in `.env.local`
2. Generate a Bitcoin trade signal
3. Check database for SOPR and MVRV Z-Score values:

```sql
SELECT 
  ts.symbol,
  tms.sopr_value,
  tms.mvrv_z_score,
  tms.snapshot_at
FROM trade_signals ts
JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
WHERE ts.symbol = 'BTC'
ORDER BY ts.generated_at DESC
LIMIT 5;
```

## Troubleshooting

### Issue: API key not working

**Solution**: Verify API key is correct and active at https://studio.glassnode.com/settings/api

### Issue: Rate limit exceeded

**Solution**: 
- Wait a few minutes before retrying
- Upgrade to paid plan for higher limits
- Caching should prevent most rate limit issues

### Issue: Metrics always null

**Solution**:
- Check if API key is configured in environment
- Check Vercel logs for error messages
- Verify network connectivity to Glassnode API

### Issue: Stale data

**Solution**:
- Clear cache: `clearMetricsCache()`
- Wait for cache to expire (1 hour)
- Check Glassnode API status

## Cost Estimation

### Free Tier

- **Cost**: $0/month
- **Requests**: ~10/minute
- **With caching**: ~240 requests/day (1 per hour for SOPR + MVRV)
- **Sufficient for**: Low-volume testing

### Paid Tier (Starter)

- **Cost**: ~$29/month
- **Requests**: Higher limits
- **With caching**: Same usage pattern
- **Sufficient for**: Production use

## References

- **Glassnode API Docs**: https://docs.glassnode.com/api/
- **SOPR Metric**: https://academy.glassnode.com/indicators/sopr
- **MVRV Z-Score**: https://academy.glassnode.com/indicators/mvrv-z-score
- **API Key Management**: https://studio.glassnode.com/settings/api

## Support

For issues or questions:

1. Check this documentation
2. Review Glassnode API documentation
3. Check Vercel function logs
4. Contact Glassnode support for API issues

---

**Status**: ✅ Implemented and tested  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
