# UCIE Production Caching Infrastructure Setup

## Overview

This document provides complete instructions for setting up production-grade caching infrastructure for the Universal Crypto Intelligence Engine (UCIE) using Upstash Redis.

**Status**: 🟡 Ready for Setup  
**Priority**: Critical - Required for production performance  
**Target**: >80% cache hit rate, <100ms cache response time

---

## Why Upstash Redis?

- **Serverless-Native**: Perfect for Vercel/Next.js deployments
- **Global Edge Network**: Low latency worldwide
- **Pay-per-Request**: Cost-effective for variable traffic
- **REST API**: Works with serverless functions (no persistent connections)
- **Automatic Scaling**: Handles traffic spikes automatically
- **Built-in Persistence**: Data survives restarts

---

## Step 1: Create Upstash Redis Instance

### 1.1 Sign Up for Upstash

1. Go to [https://upstash.com](https://upstash.com)
2. Click **Sign Up** (free tier available)
3. Sign up with GitHub, Google, or email
4. Verify your email address

### 1.2 Create Redis Database

1. Click **Create Database**
2. Configure database:
   - **Name**: `ucie-production-cache`
   - **Type**: Regional (for lower latency) or Global (for worldwide distribution)
   - **Region**: Choose closest to your Vercel deployment (e.g., `us-east-1`, `eu-west-1`)
   - **Eviction**: Enable (recommended: `allkeys-lru` for automatic cleanup)
   - **TLS**: Enable (required for security)
3. Click **Create**

### 1.3 Get Connection Details

After creation, you'll see:

```
Endpoint: redis-12345.upstash.io
Port: 6379 (or 6380 for TLS)
Password: AaBbCcDd1234567890...
```

You'll also see REST API credentials:

```
UPSTASH_REDIS_REST_URL: https://redis-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN: AaBbCcDd1234567890...
```

---

## Step 2: Configure Environment Variables

### 2.1 Add to `.env.local` (Development)

```bash
# =============================================================================
# UCIE CACHING INFRASTRUCTURE (Upstash Redis)
# =============================================================================

# Upstash Redis REST API (REQUIRED for production caching)
# Get from: https://console.upstash.com/redis
UPSTASH_REDIS_REST_URL=https://redis-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AaBbCcDd1234567890...

# Cache Configuration
UCIE_CACHE_ENABLED=true
UCIE_CACHE_DEFAULT_TTL=300
UCIE_CACHE_MAX_SIZE=1000
```

### 2.2 Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **Agents.MD**
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Key | Value | Environments |
|-----|-------|--------------|
| `UPSTASH_REDIS_REST_URL` | `https://redis-12345.upstash.io` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | `AaBbCcDd1234567890...` | Production, Preview, Development |
| `UCIE_CACHE_ENABLED` | `true` | Production, Preview, Development |
| `UCIE_CACHE_DEFAULT_TTL` | `300` | Production, Preview, Development |
| `UCIE_CACHE_MAX_SIZE` | `1000` | Production, Preview, Development |

---

## Step 3: Update Cache Implementation

### 3.1 Update `lib/ucie/cache.ts`

The cache utility is already implemented with multi-level caching. Update it to use Upstash Redis:

```typescript
// lib/ucie/cache.ts
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache configuration
const CACHE_ENABLED = process.env.UCIE_CACHE_ENABLED === 'true';
const DEFAULT_TTL = parseInt(process.env.UCIE_CACHE_DEFAULT_TTL || '300', 10);

// Level 1: In-memory cache (fastest, 30 seconds)
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Level 2: Redis cache (fast, configurable TTL)
// Level 3: Database cache (persistent, 1 hour) - already implemented

export async function getCachedData<T>(
  key: string,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  if (!CACHE_ENABLED) return null;

  // Try memory cache first
  const memCached = memoryCache.get(key);
  if (memCached && Date.now() - memCached.timestamp < 30000) {
    console.log(`[Cache] Memory hit: ${key}`);
    return memCached.data as T;
  }

  // Try Redis cache
  if (redis) {
    try {
      const redisCached = await redis.get<T>(key);
      if (redisCached) {
        console.log(`[Cache] Redis hit: ${key}`);
        // Update memory cache
        memoryCache.set(key, { data: redisCached, timestamp: Date.now() });
        return redisCached;
      }
    } catch (error) {
      console.error(`[Cache] Redis error:`, error);
    }
  }

  // Try database cache (existing implementation)
  // ... existing database cache code ...

  return null;
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  if (!CACHE_ENABLED) return;

  // Set memory cache
  memoryCache.set(key, { data, timestamp: Date.now() });

  // Set Redis cache
  if (redis) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`[Cache] Redis set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`[Cache] Redis set error:`, error);
    }
  }

  // Set database cache (existing implementation)
  // ... existing database cache code ...
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!CACHE_ENABLED) return;

  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // Clear Redis cache
  if (redis) {
    try {
      const keys = await redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} Redis keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error(`[Cache] Redis invalidation error:`, error);
    }
  }

  // Clear database cache (existing implementation)
  // ... existing database cache code ...
}
```

### 3.2 Install Upstash Redis Package

```bash
npm install @upstash/redis
```

---

## Step 4: Configure Cache TTL Values

### 4.1 Recommended TTL Values by Data Type

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| **Market Data** (price, volume) | 30s | Highly volatile, needs frequent updates |
| **Technical Indicators** | 1 min | Recalculated frequently |
| **Social Sentiment** | 5 min | Changes gradually |
| **News Articles** | 5 min | New articles appear regularly |
| **On-Chain Data** | 5 min | Blockchain updates every ~10-15 min |
| **Caesar Research** | 24 hours | Deep research rarely changes |
| **Risk Scores** | 1 hour | Calculated metrics, stable |
| **Derivatives Data** | 1 min | Funding rates update every 8h but OI changes |
| **DeFi Metrics** | 1 hour | TVL and protocol data stable |
| **Predictions** | 1 hour | Model outputs stable |
| **Token Search** | 24 hours | Token list rarely changes |

### 4.2 Update Cache Keys with TTL

```typescript
// lib/ucie/cacheKeys.ts
export const CACHE_KEYS = {
  MARKET_DATA: (symbol: string) => `ucie:market:${symbol}`,
  TECHNICAL: (symbol: string) => `ucie:technical:${symbol}`,
  SENTIMENT: (symbol: string) => `ucie:sentiment:${symbol}`,
  NEWS: (symbol: string) => `ucie:news:${symbol}`,
  ON_CHAIN: (symbol: string) => `ucie:onchain:${symbol}`,
  CAESAR: (symbol: string) => `ucie:caesar:${symbol}`,
  RISK: (symbol: string) => `ucie:risk:${symbol}`,
  DERIVATIVES: (symbol: string) => `ucie:derivatives:${symbol}`,
  DEFI: (symbol: string) => `ucie:defi:${symbol}`,
  PREDICTIONS: (symbol: string) => `ucie:predictions:${symbol}`,
  SEARCH: 'ucie:search:tokens',
  ANALYSIS: (symbol: string) => `ucie:analysis:${symbol}`,
};

export const CACHE_TTL = {
  MARKET_DATA: 30,        // 30 seconds
  TECHNICAL: 60,          // 1 minute
  SENTIMENT: 300,         // 5 minutes
  NEWS: 300,              // 5 minutes
  ON_CHAIN: 300,          // 5 minutes
  CAESAR: 86400,          // 24 hours
  RISK: 3600,             // 1 hour
  DERIVATIVES: 60,        // 1 minute
  DEFI: 3600,             // 1 hour
  PREDICTIONS: 3600,      // 1 hour
  SEARCH: 86400,          // 24 hours
  ANALYSIS: 300,          // 5 minutes (full analysis)
};
```

---

## Step 5: Test Cache Implementation

### 5.1 Create Cache Test Endpoint

```typescript
// pages/api/ucie/cache-test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedData, setCachedData, invalidateCache } from '../../../lib/ucie/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const testKey = 'ucie:test:cache';
    const testData = {
      timestamp: new Date().toISOString(),
      message: 'Cache test successful',
      random: Math.random(),
    };

    // Test set
    await setCachedData(testKey, testData, 60);

    // Test get
    const cached = await getCachedData(testKey);

    // Test invalidate
    await invalidateCache('test');

    res.status(200).json({
      success: true,
      test: 'passed',
      cached: cached !== null,
      data: cached,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

### 5.2 Test Cache Locally

```bash
# Start development server
npm run dev

# Test cache endpoint
curl http://localhost:3000/api/ucie/cache-test

# Expected response:
{
  "success": true,
  "test": "passed",
  "cached": true,
  "data": {
    "timestamp": "2025-01-27T...",
    "message": "Cache test successful",
    "random": 0.123456
  }
}
```

### 5.3 Monitor Cache Performance

Create a cache monitoring endpoint:

```typescript
// pages/api/ucie/cache-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!redis) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  try {
    // Get Redis info
    const info = await redis.info();
    
    // Get all UCIE keys
    const keys = await redis.keys('ucie:*');
    
    // Calculate cache size
    const keysByType: Record<string, number> = {};
    keys.forEach(key => {
      const type = key.split(':')[1];
      keysByType[type] = (keysByType[type] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      totalKeys: keys.length,
      keysByType,
      redisInfo: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## Step 6: Deploy and Verify

### 6.1 Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: Add Upstash Redis caching infrastructure for UCIE"
git push origin main

# Vercel will automatically deploy
```

### 6.2 Verify Production Cache

```bash
# Test cache endpoint
curl https://news.arcane.group/api/ucie/cache-test

# Check cache stats
curl https://news.arcane.group/api/ucie/cache-stats

# Test actual analysis with caching
curl https://news.arcane.group/api/ucie/analyze/BTC
```

### 6.3 Monitor Cache Hit Rate

In Upstash Console:
1. Go to your database
2. Click **Metrics** tab
3. Monitor:
   - **Commands/sec**: Should be high (>10/sec)
   - **Hit Rate**: Target >80%
   - **Memory Usage**: Should stay under limit
   - **Latency**: Should be <10ms

---

## Step 7: Optimize Cache Performance

### 7.1 Cache Warming Strategy

Pre-populate cache for popular tokens:

```typescript
// scripts/warm-cache.ts
import { setCachedData, CACHE_KEYS, CACHE_TTL } from '../lib/ucie/cache';

const POPULAR_TOKENS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'MATIC', 'LINK', 'UNI'];

async function warmCache() {
  console.log('Warming cache for popular tokens...');
  
  for (const symbol of POPULAR_TOKENS) {
    try {
      // Fetch and cache market data
      const response = await fetch(`https://news.arcane.group/api/ucie/analyze/${symbol}`);
      const data = await response.json();
      
      await setCachedData(CACHE_KEYS.ANALYSIS(symbol), data, CACHE_TTL.ANALYSIS);
      console.log(`✓ Cached ${symbol}`);
    } catch (error) {
      console.error(`✗ Failed to cache ${symbol}:`, error);
    }
  }
  
  console.log('Cache warming complete!');
}

warmCache();
```

### 7.2 Cache Invalidation Strategy

Invalidate cache when data changes:

```typescript
// Invalidate on new whale transaction
await invalidateCache('onchain');

// Invalidate on breaking news
await invalidateCache('news');

// Invalidate specific token
await invalidateCache(`analysis:${symbol}`);
```

### 7.3 Cache Compression

For large data, compress before caching:

```typescript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function setCachedDataCompressed<T>(
  key: string,
  data: T,
  ttl: number
): Promise<void> {
  const json = JSON.stringify(data);
  const compressed = await gzipAsync(Buffer.from(json));
  await redis.setex(key, ttl, compressed.toString('base64'));
}

export async function getCachedDataCompressed<T>(key: string): Promise<T | null> {
  const compressed = await redis.get(key);
  if (!compressed) return null;
  
  const buffer = Buffer.from(compressed as string, 'base64');
  const decompressed = await gunzipAsync(buffer);
  return JSON.parse(decompressed.toString()) as T;
}
```

---

## Cost Estimation

### Upstash Redis Pricing

**Free Tier:**
- 10,000 commands/day
- 256 MB storage
- Perfect for development and testing

**Pay-as-you-go:**
- $0.20 per 100,000 commands
- $0.25 per GB storage/month
- No minimum commitment

**Estimated Monthly Cost (1,000 analyses/day):**

```
Commands per analysis: ~20 (get/set operations)
Daily commands: 1,000 × 20 = 20,000
Monthly commands: 20,000 × 30 = 600,000

Cost: 600,000 / 100,000 × $0.20 = $1.20/month

Storage: ~100 MB average
Cost: 0.1 × $0.25 = $0.025/month

Total: ~$1.25/month
```

**Optimization Tips:**
- Use compression for large data
- Set appropriate TTL values
- Implement cache warming for popular tokens
- Monitor and adjust based on usage

---

## Troubleshooting

### Issue: Redis Connection Timeout

**Solution:**
```typescript
// Increase timeout in Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(retryCount * 100, 3000),
  },
});
```

### Issue: Cache Miss Rate Too High

**Possible causes:**
1. TTL too short - Increase TTL values
2. Cache not warming - Implement cache warming
3. High traffic - Upgrade Upstash plan
4. Keys not matching - Check cache key generation

### Issue: Memory Limit Exceeded

**Solution:**
1. Enable eviction policy: `allkeys-lru`
2. Reduce TTL for less important data
3. Implement cache compression
4. Upgrade to larger plan

---

## Monitoring and Alerts

### Set Up Upstash Alerts

1. Go to Upstash Console
2. Click **Alerts** tab
3. Create alerts for:
   - Memory usage >80%
   - Commands/sec >1000
   - Error rate >1%
   - Latency >50ms

### Integrate with Vercel Monitoring

```typescript
// lib/ucie/monitoring.ts
export function trackCacheMetrics(operation: string, hit: boolean, latency: number) {
  // Log to Vercel Analytics
  console.log('[Cache Metrics]', {
    operation,
    hit,
    latency,
    timestamp: new Date().toISOString(),
  });
  
  // Send to monitoring service (Sentry, LogRocket, etc.)
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('Cache Operation', {
      operation,
      hit,
      latency,
    });
  }
}
```

---

## Success Criteria

- ✅ Upstash Redis instance created and configured
- ✅ Environment variables set in Vercel
- ✅ Cache implementation updated with Redis
- ✅ Cache TTL values configured appropriately
- ✅ Cache test endpoint working
- ✅ Cache hit rate >80%
- ✅ Cache response time <100ms
- ✅ Monitoring and alerts configured
- ✅ Cost tracking implemented

---

## Next Steps

1. ✅ **Complete this setup** (Task 20.1)
2. ⏳ **Configure production database** (Task 20.2)
3. ⏳ **Set up monitoring and error tracking** (Task 20.3)
4. ⏳ **Create deployment pipeline** (Task 20.4)
5. ⏳ **Create user documentation** (Task 20.5)

---

**Last Updated**: January 27, 2025  
**Status**: 🟡 Ready for Implementation  
**Estimated Time**: 2-3 hours  
**Priority**: Critical
