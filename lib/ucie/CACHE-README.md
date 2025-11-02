# UCIE Caching Infrastructure

## Overview

The Universal Crypto Intelligence Engine (UCIE) implements a sophisticated three-tier caching strategy to optimize performance and reduce API costs while maintaining data freshness.

## Architecture

### Three-Tier Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 1: MEMORY CACHE (Fastest)                                │
│  • Storage: In-memory Map                                        │
│  • TTL: 30 seconds                                               │
│  • Scope: Single server instance                                 │
│  • Use: Hot data, frequently accessed                            │
└─────────────────────────────────────────────────────────────────┘
                              │ Cache Miss
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 2: REDIS CACHE (Fast)                                    │
│  • Storage: Upstash Redis (KV)                                   │
│  • TTL: 5 minutes (300 seconds)                                  │
│  • Scope: Distributed across all instances                       │
│  • Use: Warm data, shared across servers                         │
└─────────────────────────────────────────────────────────────────┘
                              │ Cache Miss
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 3: DATABASE CACHE (Persistent)                           │
│  • Storage: Supabase PostgreSQL                                  │
│  • TTL: 1 hour (3600 seconds)                                    │
│  • Scope: Persistent across restarts                             │
│  • Use: Cold data, long-term storage                             │
└─────────────────────────────────────────────────────────────────┘
                              │ Cache Miss
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXTERNAL APIs (Slowest, Most Expensive)                        │
│  • CoinGecko, CoinMarketCap, Caesar AI, etc.                    │
│  • Rate limited, costs money                                     │
│  • Only called on cache miss                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Cache Levels

### Level 1: Memory Cache

**Purpose**: Ultra-fast access to frequently requested data

**Characteristics**:
- **Storage**: JavaScript Map in server memory
- **TTL**: 30 seconds (configurable)
- **Scope**: Single server instance (not shared)
- **Cleanup**: Automatic every 10 seconds
- **Performance**: Sub-millisecond access time

**Best For**:
- Price data that changes frequently
- Data accessed multiple times per second
- Hot data during high traffic

**Limitations**:
- Lost on server restart
- Not shared across multiple server instances
- Limited by available memory

### Level 2: Redis Cache (Upstash)

**Purpose**: Fast distributed cache shared across all server instances

**Characteristics**:
- **Storage**: Upstash Redis (Vercel KV)
- **TTL**: 5 minutes (300 seconds, configurable)
- **Scope**: Distributed across all server instances
- **Performance**: ~10-50ms access time
- **Fallback**: Gracefully degrades if Redis unavailable

**Best For**:
- Market data (prices, volume, market cap)
- Technical indicators
- Social sentiment scores
- News articles

**Setup**:
```bash
# Environment variables required
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token_here
```

**Limitations**:
- Requires Vercel KV subscription
- Network latency (10-50ms)
- Storage limits based on plan

### Level 3: Database Cache

**Purpose**: Persistent long-term cache that survives restarts

**Characteristics**:
- **Storage**: PostgreSQL table (`ucie_analysis_cache`)
- **TTL**: 1 hour (3600 seconds, configurable)
- **Scope**: Persistent across all instances and restarts
- **Performance**: ~50-200ms access time
- **Indexes**: Optimized for symbol and analysis type queries

**Best For**:
- Complete analysis results
- Caesar AI research (expensive to regenerate)
- Historical data
- Rarely changing data

**Database Schema**:
```sql
CREATE TABLE ucie_analysis_cache (
  key VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  symbol VARCHAR(20),
  analysis_type VARCHAR(50)
);

CREATE INDEX idx_ucie_cache_expires_at ON ucie_analysis_cache(expires_at);
CREATE INDEX idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
CREATE INDEX idx_ucie_cache_type ON ucie_analysis_cache(analysis_type);
```

## Usage

### Basic Usage

```typescript
import {
  getCached,
  setCached,
  deleteCached,
  getMarketDataCacheKey,
} from '../lib/ucie/cache';

// Get cached data
const cacheKey = getMarketDataCacheKey('BTC');
const cachedData = await getCached(cacheKey);

if (cachedData) {
  console.log('Cache hit!', cachedData);
} else {
  // Fetch from API
  const freshData = await fetchMarketData('BTC');
  
  // Store in cache
  await setCached(cacheKey, freshData, {
    ttl: 300, // 5 minutes
    symbol: 'BTC',
    analysisType: 'market',
  });
}
```

### Advanced Usage

```typescript
// Skip specific cache levels
const data = await getCached(key, {
  skipMemory: false,  // Use memory cache
  skipRedis: false,   // Use Redis cache
  skipDatabase: true, // Skip database cache
});

// Set with custom TTL
await setCached(key, data, {
  ttl: 600, // 10 minutes
  symbol: 'ETH',
  analysisType: 'technical',
});

// Delete from all cache levels
await deleteCached(key);
```

### Cache Key Generators

```typescript
import {
  getMarketDataCacheKey,
  getTechnicalAnalysisCacheKey,
  getOnChainCacheKey,
  getSocialSentimentCacheKey,
  getNewsCacheKey,
  getCaesarResearchCacheKey,
  getComprehensiveAnalysisCacheKey,
} from '../lib/ucie/cache';

// Generate cache keys
const marketKey = getMarketDataCacheKey('BTC');        // ucie:market:BTC
const techKey = getTechnicalAnalysisCacheKey('ETH');   // ucie:technical:ETH
const onChainKey = getOnChainCacheKey('SOL');          // ucie:onchain:SOL
const sentimentKey = getSocialSentimentCacheKey('XRP'); // ucie:sentiment:XRP
const newsKey = getNewsCacheKey('ADA');                // ucie:news:ADA
const caesarKey = getCaesarResearchCacheKey('DOT');    // ucie:caesar:DOT
const analysisKey = getComprehensiveAnalysisCacheKey('MATIC'); // ucie:analysis:MATIC
```

## Cache Invalidation

### Manual Invalidation

```typescript
import { invalidateCache } from '../lib/ucie/cache';

// Invalidate all cache for a symbol
await invalidateCache({ symbol: 'BTC' });

// Invalidate all cache of a specific type
await invalidateCache({ analysisType: 'market' });

// Invalidate specific combination
await invalidateCache({ symbol: 'ETH', analysisType: 'technical' });
```

### API Endpoint

```bash
# Invalidate cache via API
curl -X POST https://your-domain.com/api/ucie/invalidate-cache \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC"}'
```

### Automatic Cleanup

Expired cache entries are automatically cleaned up daily via cron job:

```bash
# Vercel Cron Job Configuration
# Path: /api/cron/cleanup-cache
# Schedule: 0 3 * * * (Daily at 3 AM UTC)
# Header: Authorization: Bearer [CRON_SECRET]
```

## Monitoring

### Cache Statistics

```typescript
import { getCacheStats } from '../lib/ucie/cache';

const stats = getCacheStats();
console.log(stats);
// {
//   hits: 1250,
//   misses: 150,
//   hitRate: 89.3,
//   memoryHits: 800,
//   redisHits: 350,
//   databaseHits: 100,
//   totalEntries: 45
// }
```

### API Endpoint

```bash
# Get cache statistics
curl https://your-domain.com/api/ucie/cache-stats
```

### Key Metrics

- **Hit Rate**: Percentage of requests served from cache (target: >80%)
- **Memory Hits**: Fastest cache level (target: >60% of total hits)
- **Redis Hits**: Distributed cache (target: >25% of total hits)
- **Database Hits**: Persistent cache (target: >10% of total hits)
- **Total Entries**: Number of items in memory cache

## Performance Optimization

### Recommended TTL Values

| Data Type | Memory | Redis | Database | Reasoning |
|-----------|--------|-------|----------|-----------|
| Price Data | 30s | 1m | 5m | Changes frequently |
| Market Data | 30s | 5m | 15m | Moderate change rate |
| Technical Indicators | 30s | 5m | 15m | Recalculated often |
| On-Chain Data | 30s | 10m | 1h | Changes slowly |
| Social Sentiment | 30s | 5m | 30m | Moderate volatility |
| News Articles | 30s | 10m | 1h | Relatively static |
| Caesar Research | 30s | 30m | 24h | Expensive to generate |
| Complete Analysis | 30s | 5m | 1h | Comprehensive data |

### Cache Warming

Pre-populate cache for popular tokens:

```typescript
const popularTokens = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];

for (const symbol of popularTokens) {
  const analysis = await fetchComprehensiveAnalysis(symbol);
  await setCached(
    getComprehensiveAnalysisCacheKey(symbol),
    analysis,
    { ttl: 3600, symbol, analysisType: 'comprehensive' }
  );
}
```

### Cache Backfilling

When data is found in a lower cache level, it's automatically backfilled to higher levels:

```
Database Hit → Backfill to Redis → Backfill to Memory
Redis Hit → Backfill to Memory
Memory Hit → No backfill needed
```

## Best Practices

### 1. Always Use Cache Keys

```typescript
// ✅ Good: Use cache key generator
const key = getMarketDataCacheKey('BTC');

// ❌ Bad: Hardcode cache keys
const key = 'btc-market-data';
```

### 2. Set Appropriate TTLs

```typescript
// ✅ Good: Match TTL to data volatility
await setCached(key, priceData, { ttl: 60 }); // 1 minute for prices

// ❌ Bad: Same TTL for all data
await setCached(key, data, { ttl: 3600 }); // Too long for prices
```

### 3. Handle Cache Misses Gracefully

```typescript
// ✅ Good: Fetch and cache on miss
const data = await getCached(key) || await fetchAndCache(key);

// ❌ Bad: Don't cache fetched data
const data = await getCached(key) || await fetchData();
```

### 4. Invalidate on Updates

```typescript
// ✅ Good: Invalidate when data changes
await updateTokenData(symbol);
await invalidateCache({ symbol });

// ❌ Bad: Let stale data persist
await updateTokenData(symbol);
```

### 5. Monitor Cache Performance

```typescript
// ✅ Good: Track cache metrics
const stats = getCacheStats();
if (stats.hitRate < 70) {
  console.warn('Low cache hit rate:', stats);
}

// ❌ Bad: No monitoring
```

## Troubleshooting

### Low Hit Rate

**Problem**: Cache hit rate below 70%

**Solutions**:
1. Increase TTL values
2. Pre-warm cache for popular tokens
3. Check if cache keys are consistent
4. Verify Redis is connected

### High Memory Usage

**Problem**: Memory cache consuming too much RAM

**Solutions**:
1. Reduce memory cache TTL
2. Implement size limits
3. Use Redis more aggressively
4. Clear memory cache periodically

### Redis Connection Errors

**Problem**: Redis cache not working

**Solutions**:
1. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set
2. Check Vercel KV dashboard for issues
3. System gracefully degrades to database cache
4. Monitor error logs

### Database Cache Growing Too Large

**Problem**: `ucie_analysis_cache` table too large

**Solutions**:
1. Reduce database cache TTL
2. Run cleanup cron job more frequently
3. Manually delete old entries
4. Add table partitioning

## Environment Variables

```bash
# Required for Redis cache (Level 2)
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token_here

# Required for database cache (Level 3)
DATABASE_URL=postgres://user:pass@host:5432/db

# Required for cron job authentication
CRON_SECRET=your_cron_secret_here
```

## API Endpoints

### Cache Statistics
```
GET /api/ucie/cache-stats
```

### Cache Invalidation
```
POST /api/ucie/invalidate-cache
Body: { symbol?: string, analysisType?: string }
```

### Cache Cleanup (Cron)
```
POST /api/cron/cleanup-cache
Header: Authorization: Bearer [CRON_SECRET]
```

## Performance Targets

- **Cache Hit Rate**: >80%
- **Memory Cache Hit Rate**: >60% of total hits
- **Average Response Time**: <100ms (cache hit)
- **Database Cache Size**: <1GB
- **Cleanup Frequency**: Daily

## Future Enhancements

1. **Cache Compression**: Compress large JSON objects
2. **Cache Versioning**: Handle schema changes gracefully
3. **Distributed Memory Cache**: Share memory cache across instances
4. **Predictive Caching**: Pre-fetch likely requests
5. **Cache Analytics**: Detailed usage patterns and optimization suggestions

---

**Status**: ✅ Implemented and Ready for Use
**Version**: 1.0.0
**Last Updated**: January 2025
**Requirements**: 14.3, 14.4
