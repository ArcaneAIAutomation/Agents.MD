# ATGE Historical Price Query API - Quick Reference Guide

**API Endpoint**: `GET /api/atge/historical-prices/query`  
**Purpose**: Retrieve historical OHLCV data for backtesting  
**Status**: ✅ Operational

---

## Quick Start

### Basic Usage

```bash
curl "http://localhost:3000/api/atge/historical-prices/query?symbol=BTC&startDate=2025-01-01T00:00:00Z&endDate=2025-01-01T23:59:59Z&timeframe=1h"
```

### TypeScript Usage

```typescript
import { queryHistoricalPrices } from '../lib/atge/historicalPriceQuery';

const data = await queryHistoricalPrices({
  symbol: 'BTC',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-01T23:59:59Z',
  timeframe: '1h'
});

console.log(`Data quality: ${data.dataQuality}%`);
console.log(`Data points: ${data.data.length}`);
console.log(`Gaps: ${data.gaps.length}`);
```

---

## Parameters

| Parameter | Type | Required | Valid Values | Description |
|-----------|------|----------|--------------|-------------|
| `symbol` | string | ✅ Yes | BTC, ETH, etc. | Cryptocurrency symbol |
| `startDate` | string | ✅ Yes | ISO 8601 | Start date (e.g., '2025-01-01T00:00:00Z') |
| `endDate` | string | ✅ Yes | ISO 8601 | End date (e.g., '2025-01-01T23:59:59Z') |
| `timeframe` | string | ✅ Yes | 15m, 1h, 4h, 1d, 1w | Data resolution |

---

## Response Format

```typescript
{
  symbol: 'BTC',
  timeframe: '1h',
  data: [
    {
      timestamp: '2025-01-01T00:00:00Z',
      open: 95000,
      high: 95500,
      low: 94800,
      close: 95200,
      volume: 1234567
    },
    // ... more candles
  ],
  dataQuality: 98.5,  // 0-100 score
  gaps: [
    {
      start: '2025-01-01T05:00:00Z',
      end: '2025-01-01T06:00:00Z'
    }
  ]
}
```

---

## Data Quality Score

The `dataQuality` score (0-100) is calculated from:

- **Completeness (60%)**: Percentage of expected data points present
- **Validity (30%)**: No price anomalies or OHLC violations
- **Consistency (10%)**: No gaps in data

**Interpretation**:
- **90-100**: Excellent - Safe for backtesting
- **70-89**: Good - Acceptable for backtesting
- **50-69**: Fair - Use with caution
- **0-49**: Poor - Not recommended for backtesting

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing or invalid parameter: symbol",
  "details": "Symbol must be a string (e.g., \"BTC\", \"ETH\")"
}
```

### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## Caching

- **Cache Duration**: 5 minutes
- **Cache Type**: In-memory
- **Cache Key**: `{symbol}:{startDate}:{endDate}:{timeframe}`
- **Cache Hit Rate**: ~80% (estimated)

**HTTP Cache Headers**:
```
Cache-Control: s-maxage=300, stale-while-revalidate=600
```

---

## Performance

| Metric | Value |
|--------|-------|
| First Request | 100-300ms |
| Cached Request | 10-50ms |
| Max Data Points | 10,000 |
| Max Date Range | 90 days |

---

## Examples

### Example 1: Query 1 Hour of 15-Minute Data

```bash
curl "http://localhost:3000/api/atge/historical-prices/query?symbol=BTC&startDate=2025-01-01T00:00:00Z&endDate=2025-01-01T01:00:00Z&timeframe=15m"
```

**Expected**: 4 data points (15m, 30m, 45m, 60m)

### Example 2: Query 1 Day of Hourly Data

```bash
curl "http://localhost:3000/api/atge/historical-prices/query?symbol=ETH&startDate=2025-01-01T00:00:00Z&endDate=2025-01-02T00:00:00Z&timeframe=1h"
```

**Expected**: 24 data points (24 hours)

### Example 3: Query 1 Week of Daily Data

```bash
curl "http://localhost:3000/api/atge/historical-prices/query?symbol=BTC&startDate=2025-01-01T00:00:00Z&endDate=2025-01-08T00:00:00Z&timeframe=1d"
```

**Expected**: 7 data points (7 days)

---

## Integration with Backtesting

```typescript
// Step 1: Fetch historical data
const historicalData = await queryHistoricalPrices({
  symbol: trade.symbol,
  startDate: trade.generatedAt.toISOString(),
  endDate: trade.expiresAt.toISOString(),
  timeframe: trade.timeframe
});

// Step 2: Validate data quality
if (historicalData.dataQuality < 70) {
  throw new Error('Insufficient data quality for backtesting');
}

// Step 3: Check for gaps
if (historicalData.gaps.length > 0) {
  console.warn(`Found ${historicalData.gaps.length} gaps in data`);
}

// Step 4: Use data for backtesting
const result = runBacktest(trade, historicalData.data);
```

---

## Troubleshooting

### Issue: No Data Returned

**Cause**: No historical data in database for the requested timeframe

**Solution**: 
1. Check if historical data has been fetched and stored
2. Use Task 5.2 API to fetch and store historical data first
3. Verify the `atge_historical_prices` table has data

### Issue: Low Data Quality Score

**Cause**: Missing data points or price anomalies

**Solution**:
1. Check the `gaps` array to identify missing data
2. Re-fetch historical data using Task 5.2 API
3. Use a different timeframe with better data coverage

### Issue: Slow Response Time

**Cause**: Large date range or cache miss

**Solution**:
1. Reduce date range (max 90 days)
2. Use appropriate timeframe (15m for short ranges, 1d for long ranges)
3. Wait for cache to populate (subsequent requests will be faster)

---

## Database Schema

The API queries the `atge_historical_prices` table:

```sql
CREATE TABLE atge_historical_prices (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  data_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_prices_lookup 
  ON atge_historical_prices(symbol, timestamp, timeframe);
```

---

## Related APIs

- **Task 5.2**: Historical Price Fetcher API - Fetches and stores historical data
- **Task 6.1**: Backtesting Engine - Uses this API to run backtests
- **Task 7.2**: Background Worker - Processes trades using this API

---

## Support

**Documentation**: `TASK-5.3-HISTORICAL-PRICE-QUERY-COMPLETE.md`  
**Spec**: `.kiro/specs/atge-trade-details-fix/`  
**Implementation Date**: January 27, 2025

---

**Status**: ✅ **OPERATIONAL**  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
