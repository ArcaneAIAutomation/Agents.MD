# UCIE Caching Infrastructure - Setup Guide

## Overview

This guide walks you through setting up the three-tier caching infrastructure for the Universal Crypto Intelligence Engine (UCIE).

## Prerequisites

- ✅ Vercel Postgres database configured
- ✅ Node.js 18+ installed
- ✅ Environment variables configured

## Setup Steps

### Step 1: Database Cache (Level 3)

The database cache provides persistent storage for analysis results.

#### 1.1 Run Migration

```bash
# Run the UCIE cache table migration
npm run migrate:ucie-cache
```

This will:
- Create the `ucie_analysis_cache` table
- Add indexes for performance
- Create cleanup function
- Verify table creation

#### 1.2 Verify Database Setup

```bash
# Check database connection
npx tsx -e "import { testConnection } from './lib/db'; testConnection();"
```

Expected output:
```
✅ Database connection test successful
```

### Step 2: Redis Cache (Level 2)

The Redis cache provides fast distributed caching across all server instances.

#### 2.1 Create Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis)
6. Name: `agents-md-ucie-cache` (or your preferred name)
7. Region: Same as your Postgres database for low latency
8. Click **Create**

#### 2.2 Configure Environment Variables

1. In Vercel KV dashboard, click **`.env.local`** tab
2. Copy the three environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN` (optional)

3. Add to your `.env.local` file:

```bash
# Vercel KV (Redis) for UCIE Cache
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token_here
KV_REST_API_READ_ONLY_TOKEN=your_read_only_token_here
```

4. Add to Vercel project environment variables:
   - Go to Project Settings > Environment Variables
   - Add all three variables
   - Select all environments (Production, Preview, Development)

#### 2.3 Verify Redis Connection

```bash
# Test Redis connection
curl -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  "$KV_REST_API_URL/get/test"
```

Expected response:
```json
{"result":null}
```

### Step 3: Memory Cache (Level 1)

The memory cache is automatically initialized when the application starts. No setup required!

### Step 4: Cron Job Setup

Set up automatic cleanup of expired cache entries.

#### 4.1 Generate Cron Secret

```bash
# Generate a secure cron secret
openssl rand -base64 32
```

#### 4.2 Add to Environment Variables

Add to `.env.local`:
```bash
CRON_SECRET=your_generated_secret_here
```

Add to Vercel environment variables:
- Go to Project Settings > Environment Variables
- Add `CRON_SECRET` with the generated value
- Select all environments

#### 4.3 Configure Vercel Cron Job

1. Go to Project Settings > Cron Jobs
2. Click **Add Cron Job**
3. Configure:
   - **Path**: `/api/cron/cleanup-cache`
   - **Schedule**: `0 3 * * *` (Daily at 3 AM UTC)
   - **Custom Headers**: Add header
     - Key: `Authorization`
     - Value: `Bearer [Your CRON_SECRET]`
4. Click **Save**

#### 4.4 Test Cron Job

```bash
# Test the cron job endpoint
curl -X POST https://your-domain.com/api/cron/cleanup-cache \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "deleted": 0,
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

## Verification

### Test Cache Functionality

Create a test script `test-cache.ts`:

```typescript
import {
  getCached,
  setCached,
  getCacheStats,
  getMarketDataCacheKey,
} from './lib/ucie/cache';

async function testCache() {
  console.log('🧪 Testing UCIE cache...\n');

  // Test cache key generation
  const key = getMarketDataCacheKey('BTC');
  console.log('Cache key:', key);

  // Test cache miss
  console.log('\n1. Testing cache miss...');
  const miss = await getCached(key);
  console.log('Result:', miss === null ? '✅ Cache miss (expected)' : '❌ Unexpected data');

  // Test cache set
  console.log('\n2. Testing cache set...');
  const testData = { price: 95000, volume: 1000000, timestamp: Date.now() };
  await setCached(key, testData, { symbol: 'BTC', analysisType: 'market' });
  console.log('✅ Data cached');

  // Test cache hit
  console.log('\n3. Testing cache hit...');
  const hit = await getCached(key);
  console.log('Result:', hit ? '✅ Cache hit' : '❌ Cache miss');
  console.log('Data:', hit);

  // Test cache stats
  console.log('\n4. Cache statistics:');
  const stats = getCacheStats();
  console.log(stats);

  console.log('\n✅ Cache test complete!');
}

testCache();
```

Run the test:
```bash
npx tsx test-cache.ts
```

### Monitor Cache Performance

#### Check Cache Statistics

```bash
# Get cache stats via API
curl https://your-domain.com/api/ucie/cache-stats
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "hits": 150,
    "misses": 50,
    "hitRate": 75.0,
    "memoryHits": 100,
    "redisHits": 40,
    "databaseHits": 10,
    "totalEntries": 25
  },
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

#### Monitor Cache Hit Rate

Target: **>80% hit rate**

If hit rate is low:
1. Increase TTL values
2. Pre-warm cache for popular tokens
3. Check Redis connection
4. Verify cache keys are consistent

## Usage Examples

### Basic Usage

```typescript
import {
  getCached,
  setCached,
  getMarketDataCacheKey,
} from './lib/ucie/cache';

// Fetch with cache
async function getMarketData(symbol: string) {
  const cacheKey = getMarketDataCacheKey(symbol);
  
  // Try cache first
  let data = await getCached(cacheKey);
  
  if (!data) {
    // Cache miss - fetch from API
    data = await fetchMarketDataFromAPI(symbol);
    
    // Store in cache (5 minutes)
    await setCached(cacheKey, data, {
      ttl: 300,
      symbol,
      analysisType: 'market',
    });
  }
  
  return data;
}
```

### Cache Invalidation

```typescript
import { invalidateCache } from './lib/ucie/cache';

// Invalidate all cache for a symbol
await invalidateCache({ symbol: 'BTC' });

// Invalidate all cache of a specific type
await invalidateCache({ analysisType: 'market' });
```

### Manual Cache Cleanup

```bash
# Trigger cache cleanup manually
curl -X POST https://your-domain.com/api/cron/cleanup-cache \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Troubleshooting

### Issue: Redis Not Working

**Symptoms**: Cache always misses Redis, falls back to database

**Solutions**:
1. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set
2. Check Vercel KV dashboard for connection issues
3. Test Redis connection with curl
4. Check application logs for Redis errors

**Note**: System gracefully degrades to database cache if Redis unavailable

### Issue: Database Cache Growing Too Large

**Symptoms**: `ucie_analysis_cache` table size > 1GB

**Solutions**:
1. Reduce database cache TTL
2. Run cleanup cron job more frequently
3. Manually delete old entries:
   ```sql
   DELETE FROM ucie_analysis_cache WHERE expires_at < NOW();
   ```

### Issue: Low Cache Hit Rate

**Symptoms**: Hit rate < 70%

**Solutions**:
1. Increase TTL values for stable data
2. Pre-warm cache for popular tokens
3. Check if cache keys are consistent
4. Verify all cache levels are working

### Issue: High Memory Usage

**Symptoms**: Server memory usage high

**Solutions**:
1. Reduce memory cache TTL (default: 30s)
2. Implement size limits on memory cache
3. Use Redis more aggressively
4. Monitor memory cache size

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Cache Hit Rate | >80% | Monitor via `/api/ucie/cache-stats` |
| Memory Cache Hit Rate | >60% of total | Monitor via stats |
| Average Response Time (cache hit) | <100ms | Monitor via logs |
| Database Cache Size | <1GB | Check Vercel dashboard |
| Cleanup Frequency | Daily | Configured via cron |

## Maintenance

### Daily Tasks
- ✅ Automatic cache cleanup via cron job (3 AM UTC)

### Weekly Tasks
- Monitor cache hit rate
- Check database cache size
- Review cache statistics

### Monthly Tasks
- Analyze cache performance trends
- Optimize TTL values based on usage
- Review and adjust cache strategy

## Next Steps

1. ✅ Database cache configured
2. ✅ Redis cache configured
3. ✅ Memory cache automatic
4. ✅ Cron job scheduled
5. ⏭️ Integrate caching into UCIE API endpoints
6. ⏭️ Monitor cache performance
7. ⏭️ Optimize TTL values based on usage

## Resources

- **Documentation**: `lib/ucie/CACHE-README.md`
- **Cache Module**: `lib/ucie/cache.ts`
- **Migration**: `migrations/002_ucie_cache_table.sql`
- **Cron Job**: `pages/api/cron/cleanup-cache.ts`
- **Stats API**: `pages/api/ucie/cache-stats.ts`
- **Invalidation API**: `pages/api/ucie/invalidate-cache.ts`

## Support

If you encounter issues:
1. Check Vercel function logs
2. Review database logs in Supabase
3. Test each cache level individually
4. Check environment variables are set correctly
5. Refer to `lib/ucie/CACHE-README.md` for detailed documentation

---

**Status**: ✅ Ready for Implementation
**Version**: 1.0.0
**Last Updated**: January 2025
**Requirements**: 14.3, 14.4
