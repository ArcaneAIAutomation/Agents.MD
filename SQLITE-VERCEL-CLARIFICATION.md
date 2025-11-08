# SQLite on Vercel - Important Clarification

**Date**: November 8, 2025  
**Status**: ⚠️ **IMPORTANT CORRECTION**

---

## ❌ SQLite Does NOT Work on Vercel

### The Problem:

**SQLite is NOT compatible with Vercel's serverless architecture.**

### Why It Doesn't Work:

1. **Stateless Functions**
   - Each Vercel function runs in an isolated container
   - No persistent file system between invocations
   - Database file is lost after each request

2. **Read-Only File System**
   - Vercel functions have read-only file systems
   - Only `/tmp` is writable (and it's cleared between invocations)
   - SQLite needs to write to disk

3. **No Shared State**
   - Multiple function instances can't share the same file
   - Each instance would have its own isolated database
   - No data synchronization between instances

4. **Cold Starts**
   - Functions spin down when idle
   - Database file would be recreated on each cold start
   - All cached data would be lost

---

## ✅ What the SQLite MCP Server Is For

### Local Development Only:

The SQLite MCP server configured in `.kiro/settings/mcp.json` is **ONLY for local development**:

- ✅ Works in Kiro IDE on your local machine
- ✅ Great for development and testing
- ✅ Fast local caching during development
- ❌ **NOT for production/Vercel**
- ❌ **NOT deployed to Vercel**

**Location**: `C:\OriK.Projects\Agents.MD\Agents.MD\data\cache.db`  
**Scope**: Local machine only  
**Purpose**: Development convenience

---

## ✅ Correct Caching Strategy for Vercel

### You Already Have the Perfect Setup! 🎉

### 1. **Upstash Redis** ⭐ (Primary Cache)

**Status**: ✅ Already configured and working  
**Perfect For**: Production caching on Vercel

**Why Redis is Perfect**:
- ✅ Serverless-compatible (HTTP REST API)
- ✅ Shared across all function instances
- ✅ Persistent data storage
- ✅ Fast (sub-millisecond latency)
- ✅ Built-in TTL (time-to-live)
- ✅ Free tier: 10,000 commands/day

**Current Configuration**:
```bash
UPSTASH_REDIS_REST_URL=https://musical-cattle-22790.upstash.io
UPSTASH_REDIS_REST_TOKEN=AVkGAAIncDIyOTYyY2RhZGViNTg0ODI5OWQ1ZWVmN2ZjNjBhMTlkM3AyMjI3OTA
```

**Usage Example**:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache API response (5 minute TTL)
await redis.set('btc:price', 
  { price: 101659, timestamp: Date.now() }, 
  { ex: 300 }
);

// Get cached data
const cached = await redis.get('btc:price');
if (cached) {
  return cached; // Use cache
}

// Fetch fresh data if cache miss
const fresh = await fetchFromAPI();
await redis.set('btc:price', fresh, { ex: 300 });
return fresh;
```

---

### 2. **PostgreSQL (Supabase)** (Secondary Cache)

**Status**: ✅ Already configured and working  
**Perfect For**: Longer-term caching and historical data

**Why PostgreSQL Works**:
- ✅ Persistent storage
- ✅ Shared across all instances
- ✅ Complex queries
- ✅ Relational data
- ✅ Already configured

**Usage Example**:
```typescript
// Create cache table (run once)
CREATE TABLE api_cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);

// Cache data
await query(
  `INSERT INTO api_cache (key, value, expires_at) 
   VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
   ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = NOW() + INTERVAL '5 minutes'`,
  ['btc:price', JSON.stringify({ price: 101659 })]
);

// Get cached data
const result = await query(
  `SELECT value FROM api_cache 
   WHERE key = $1 AND expires_at > NOW()`,
  ['btc:price']
);
```

---

## 📊 Recommended Caching Architecture

### Three-Tier Caching Strategy:

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Production                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Memory Cache (In-Function)                          │
│     └─ Duration: Single request only                    │
│     └─ Use: Avoid duplicate API calls in same request   │
│                                                          │
│  2. Redis Cache (Upstash) ⭐                            │
│     └─ Duration: 1-10 minutes                           │
│     └─ Use: API responses, market data                  │
│                                                          │
│  3. Database Cache (PostgreSQL)                         │
│     └─ Duration: 1 hour - 1 day                         │
│     └─ Use: Historical data, analysis results           │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Local Development                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SQLite (MCP Server)                                    │
│     └─ Duration: Until cleared                          │
│     └─ Use: Development convenience                     │
│     └─ Location: data/cache.db                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Implementation Guide

### Step 1: Use Redis for Short-Term Cache (1-10 minutes)

**Install Upstash Redis SDK** (if not already):
```bash
npm install @upstash/redis
```

**Create Redis utility** (`lib/cache/redis.ts`):
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 300
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}
```

**Use in API routes**:
```typescript
import { getCached, setCache } from '@/lib/cache/redis';

export default async function handler(req, res) {
  const cacheKey = `btc:price:${Date.now() / 60000 | 0}`; // 1-minute buckets
  
  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  // Fetch fresh data
  const fresh = await fetchBTCPrice();
  
  // Cache for 5 minutes
  await setCache(cacheKey, fresh, 300);
  
  return res.json({ ...fresh, cached: false });
}
```

---

### Step 2: Use PostgreSQL for Long-Term Cache (1 hour - 1 day)

**Create cache table** (run migration):
```sql
-- migrations/002_api_cache.sql
CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_api_cache_created ON api_cache(created_at DESC);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Create database cache utility** (`lib/cache/database.ts`):
```typescript
import { query } from '@/lib/db';

export async function getDBCache<T>(key: string): Promise<T | null> {
  const result = await query(
    `SELECT value FROM api_cache 
     WHERE key = $1 AND expires_at > NOW()`,
    [key]
  );
  
  return result.rows[0]?.value || null;
}

export async function setDBCache<T>(
  key: string,
  value: T,
  ttlMinutes: number = 60
): Promise<void> {
  await query(
    `INSERT INTO api_cache (key, value, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '${ttlMinutes} minutes')
     ON CONFLICT (key) DO UPDATE 
     SET value = $2, expires_at = NOW() + INTERVAL '${ttlMinutes} minutes'`,
    [key, JSON.stringify(value)]
  );
}
```

---

## 🎯 Cache Strategy by Data Type

### Market Prices (Use Redis):
- **TTL**: 1-5 minutes
- **Why**: Frequently accessed, needs to be fast
- **Example**: BTC/ETH current prices

### Historical Data (Use PostgreSQL):
- **TTL**: 1-24 hours
- **Why**: Doesn't change, can be stored longer
- **Example**: 30-day price history

### News Articles (Use Redis):
- **TTL**: 5-15 minutes
- **Why**: Updates frequently, needs to be fresh
- **Example**: Latest crypto news

### Whale Transactions (Use PostgreSQL):
- **TTL**: 1 hour - 1 day
- **Why**: Historical data, doesn't change
- **Example**: Analyzed whale transactions

### Social Sentiment (Use Redis):
- **TTL**: 5-10 minutes
- **Why**: Changes frequently, needs to be current
- **Example**: LunarCrush social scores

---

## ✅ Summary

### SQLite MCP Server:
- ✅ **Local development only**
- ✅ Works in Kiro IDE
- ❌ **NOT for Vercel production**
- ❌ **NOT deployed**

### Production Caching (Vercel):
- ✅ **Use Upstash Redis** (already configured)
- ✅ **Use PostgreSQL** (already configured)
- ❌ **Don't use SQLite**

### Your Current Setup:
- ✅ **Perfect for production!**
- ✅ Redis for rate limiting (working)
- ✅ PostgreSQL for data (working)
- ✅ SQLite for local dev (working)

---

## 🚀 Next Steps

1. ✅ Keep SQLite MCP server for local development
2. ✅ Use Upstash Redis for production caching
3. ✅ Use PostgreSQL for long-term cache
4. ⏳ Implement caching utilities (optional)
5. ⏳ Add cache to API endpoints (optional)

**No changes needed to your current setup!** Everything is configured correctly. SQLite is only for local development, and you have Redis + PostgreSQL for production. 🎉

---

**Clarified**: November 8, 2025  
**Status**: ✅ Current setup is correct  
**Action**: No changes needed
