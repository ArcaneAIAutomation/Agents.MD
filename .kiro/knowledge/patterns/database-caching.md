# Database Caching Pattern

**Last Updated**: December 19, 2025  
**Status**: Production  
**Used In**: UCIE, Whale Watch

---

## Problem

Serverless functions restart frequently, losing in-memory cache. External API calls are expensive and rate-limited. Need persistent caching that survives function restarts.

---

## Solution

Store all cached data in Supabase PostgreSQL with TTL (time-to-live) expiration. Use utility functions for consistent cache operations.

---

## Implementation

### Cache Utilities (`lib/ucie/cacheUtils.ts`)

```typescript
import { query } from '../db';

// Read from cache
export async function getCachedAnalysis(
  symbol: string, 
  type: string
): Promise<any | null> {
  const result = await query(
    `SELECT data FROM ucie_analysis_cache 
     WHERE symbol = $1 AND analysis_type = $2 
     AND expires_at > NOW()`,
    [symbol.toUpperCase(), type]
  );
  return result.rows[0]?.data || null;
}

// Write to cache
export async function setCachedAnalysis(
  symbol: string,
  type: string,
  data: any,
  ttlSeconds: number,
  qualityScore: number
): Promise<void> {
  await query(
    `INSERT INTO ucie_analysis_cache 
     (symbol, analysis_type, data, quality_score, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${ttlSeconds} seconds')
     ON CONFLICT (symbol, analysis_type) 
     DO UPDATE SET data = $3, quality_score = $4, 
                   expires_at = NOW() + INTERVAL '${ttlSeconds} seconds'`,
    [symbol.toUpperCase(), type, JSON.stringify(data), qualityScore]
  );
}
```

### Usage in API Endpoint

```typescript
export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // 1. Check cache FIRST
  const cached = await getCachedAnalysis(symbol, 'market-data');
  if (cached) {
    return res.status(200).json(cached);
  }
  
  // 2. Fetch fresh data
  const data = await fetchFromExternalAPI(symbol);
  
  // 3. Store in cache IMMEDIATELY
  await setCachedAnalysis(symbol, 'market-data', data, 300, 100);
  
  // 4. Return data
  return res.status(200).json(data);
}
```

---

## When to Use

- ✅ External API responses
- ✅ Expensive calculations
- ✅ Data that doesn't change frequently
- ✅ Rate-limited API calls

---

## When NOT to Use

- ❌ Real-time data requiring <1s freshness
- ❌ User-specific data (use session storage)
- ❌ Large binary files (use object storage)

---

## TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Market Data | 5 min | Prices change frequently |
| Technical Indicators | 1 min | Calculations based on price |
| Sentiment | 5 min | Social data updates moderately |
| News | 5 min | New articles appear regularly |
| Research | 24 hours | Deep analysis is expensive |

---

## Related Patterns

- [Fallback Chain Pattern](./fallback-chain.md)
- [Context Aggregation Pattern](./context-aggregation.md)

---

## Related Steering

- [UCIE System](../../steering/ucie-system.md)
- [API Integration](../../steering/api-integration.md)
