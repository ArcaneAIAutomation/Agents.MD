# UCIE Timeout Configuration Summary

**Created**: December 7, 2025  
**Status**: ⏱️ **TIMEOUT CONFIGURATION REFERENCE**  
**Purpose**: Complete timeout settings for all UCIE endpoints

---

## 🎯 Overview

This document provides a complete reference of all timeout configurations in the UCIE system, including:
- Vercel function timeouts
- API endpoint timeouts
- Polling intervals
- Database query timeouts
- External API timeouts

---

## 🔧 Vercel Function Timeouts (vercel.json)

### Critical UCIE Endpoints (5 minutes)

```json
{
  "functions": {
    "pages/api/ucie/preview-data/**/*.ts": {
      "maxDuration": 300
    },
    "pages/api/ucie/research/**/*.ts": {
      "maxDuration": 300
    },
    "pages/api/ucie/comprehensive/**/*.ts": {
      "maxDuration": 300
    },
    "pages/api/ucie/openai-summary-process.ts": {
      "maxDuration": 300
    }
  }
}
```

**Why 5 minutes (300 seconds)?**
- Data collection from 5 APIs: 30-60 seconds
- Database operations: 5-10 seconds
- GPT-5.1 job creation: 1-2 seconds
- Buffer for network latency: 3-4 minutes
- Total: Safely under 5-minute limit

### GPT-5.1 Job Endpoints

```json
{
  "functions": {
    "pages/api/ucie/openai-summary-start/**/*.ts": {
      "maxDuration": 60
    },
    "pages/api/ucie/openai-summary-poll/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

**Start Endpoint (60 seconds)**:
- Job creation: 50-100ms
- Database insert: 50-100ms
- Async processing trigger: 10-50ms
- Response: <1 second total

**Poll Endpoint (10 seconds)**:
- Database query: 50-100ms
- Response formatting: 10-50ms
- Response: <1 second total

### Standard API Endpoints (1 minute)

```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**Applies to**:
- `/api/ucie/market-data/[symbol]`
- `/api/ucie/sentiment/[symbol]`
- `/api/ucie/technical/[symbol]`
- `/api/ucie/news/[symbol]`
- `/api/ucie/on-chain/[symbol]`

---

## 📊 API Endpoint Timeouts

### 1. Market Data API

```typescript
// Timeout: 30 seconds per source
const MARKET_DATA_TIMEOUT = 30000; // 30 seconds

// Parallel execution with Promise.allSettled()
const sources = await Promise.allSettled([
  fetchCoinMarketCap(symbol, { timeout: 30000 }),
  fetchCoinGecko(symbol, { timeout: 30000 }),
  fetchKraken(symbol, { timeout: 30000 })
]);

// Total time: max(30s, 30s, 30s) = 30 seconds (parallel)
```

**Breakdown**:
- CoinMarketCap: 30s timeout
- CoinGecko: 30s timeout
- Kraken: 30s timeout
- Parallel execution: 30s total
- Database storage: 100ms
- **Total**: ~30 seconds

### 2. Sentiment API

```typescript
// Timeout: 30 seconds total (10s per source)
const SENTIMENT_TIMEOUT = 10000; // 10 seconds per source

// Parallel execution
const sources = await Promise.allSettled([
  fetchFearGreedIndex({ timeout: 10000 }),      // 25% weight
  fetchCoinMarketCap({ timeout: 10000 }),       // 20% weight
  fetchCoinGecko({ timeout: 10000 }),           // 20% weight
  fetchLunarCrush({ timeout: 10000 }),          // 20% weight
  fetchReddit({ timeout: 10000 })               // 15% weight
]);

// Total time: max(10s, 10s, 10s, 10s, 10s) = 10 seconds (parallel)
```

**Breakdown**:
- Fear & Greed: 10s timeout
- CoinMarketCap: 10s timeout
- CoinGecko: 10s timeout
- LunarCrush: 10s timeout
- Reddit: 10s timeout
- Parallel execution: 10s total
- Database storage: 100ms
- **Total**: ~10 seconds

### 3. Technical Analysis API

```typescript
// Timeout: 30 seconds
const TECHNICAL_TIMEOUT = 30000; // 30 seconds

// Calculation time (not external API)
const indicators = calculateIndicators(historicalData);

// Total time: 1-2 seconds (calculation only)
```

**Breakdown**:
- Fetch historical data: 5-10 seconds
- Calculate RSI: 100-200ms
- Calculate MACD: 100-200ms
- Calculate EMAs: 100-200ms
- Calculate Bollinger Bands: 100-200ms
- Generate signals: 100-200ms
- Database storage: 100ms
- **Total**: ~6-11 seconds

### 4. News API

```typescript
// Timeout: 30 seconds (20s for AI assessment)
const NEWS_TIMEOUT = 30000; // 30 seconds
const AI_ASSESSMENT_TIMEOUT = 20000; // 20 seconds

// Parallel news fetching
const articles = await Promise.allSettled([
  fetchLunarCrush({ timeout: 10000 }),
  fetchNewsAPI({ timeout: 10000 }),
  fetchCryptoCompare({ timeout: 10000 })
]);

// AI assessment (sequential)
const assessments = await assessArticles(articles, { timeout: 20000 });
```

**Breakdown**:
- LunarCrush: 10s timeout
- NewsAPI: 10s timeout
- CryptoCompare: 10s timeout
- Parallel execution: 10s total
- AI assessment: 20s timeout
- Database storage: 100ms
- **Total**: ~30 seconds

### 5. On-Chain API

```typescript
// Timeout: 30 seconds
const ONCHAIN_TIMEOUT = 30000; // 30 seconds

// Bitcoin blockchain data
const data = await fetchBlockchainData(symbol, { timeout: 30000 });
```

**Breakdown**:
- Network metrics: 5-10 seconds
- Mempool analysis: 5-10 seconds
- Whale detection: 10-15 seconds
- Database storage: 100ms
- **Total**: ~20-35 seconds

---

## 🤖 GPT-5.1 Processing Timeouts

### Job Creation

```typescript
// Timeout: 60 seconds (Vercel function)
// Actual time: <1 second

POST /api/ucie/openai-summary-start/BTC
- Database insert: 50-100ms
- Async trigger: 10-50ms
- Response: <200ms
```

### Async Processing

```typescript
// Timeout: 3 minutes (180 seconds)
const OPENAI_TIMEOUT = 180000; // 3 minutes

const response = await fetch('https://api.openai.com/v1/responses', {
  signal: AbortSignal.timeout(180000)
});
```

**Breakdown**:
- Prompt building: 10-50ms
- OpenAI API call: 1-2 seconds (low reasoning)
- Response parsing: 10-50ms
- JSON cleanup: 10-50ms
- Database storage: 50-100ms
- **Total**: ~2-3 seconds typical

**Why 3 minutes?**
- Typical response: 1-2 seconds
- Network latency: 500ms-1s
- Retry buffer: 1-2 minutes
- Safety margin: Prevents infinite hangs

### Polling

```typescript
// Timeout: 10 seconds (Vercel function)
// Actual time: <1 second

GET /api/ucie/openai-summary-poll/[jobId]
- Database query: 50-100ms
- Response formatting: 10-50ms
- Response: <200ms
```

**Frontend Polling Configuration**:
```typescript
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_ATTEMPTS = 600;   // 30 minutes (600 × 3s = 1800s)
```

---

## 🗄️ Database Timeouts

### Connection Pool

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000,       // 30 seconds
  max: 20                         // 20 connections
});
```

### Query Timeouts

```typescript
// Standard query timeout: 10 seconds
const result = await query(
  'SELECT * FROM ucie_analysis_cache WHERE symbol = $1',
  [symbol],
  { timeout: 10000 }
);
```

**Typical Query Times**:
- Simple SELECT: 10-50ms
- INSERT/UPDATE: 50-100ms
- Complex JOIN: 100-500ms
- Cleanup queries: 1-5 seconds

---

## 📋 Complete Timeout Summary Table

| Component | Timeout | Typical Time | Notes |
|-----------|---------|--------------|-------|
| **Vercel Functions** |
| Preview Data | 300s | 30-60s | Main orchestrator |
| Research | 300s | 15-20min | Caesar AI |
| Comprehensive | 300s | 30-60s | Full analysis |
| OpenAI Start | 60s | <1s | Job creation |
| OpenAI Poll | 10s | <1s | Status check |
| Standard APIs | 60s | 5-30s | Individual endpoints |
| **API Endpoints** |
| Market Data | 30s | 5-10s | 3 sources parallel |
| Sentiment | 30s | 10-15s | 5 sources parallel |
| Technical | 30s | 6-11s | Calculation heavy |
| News | 30s | 25-30s | Includes AI assessment |
| On-Chain | 30s | 20-35s | Blockchain queries |
| **GPT-5.1 Processing** |
| Job Creation | 60s | <1s | Database insert |
| Async Processing | 180s | 2-3s | OpenAI API call |
| Polling | 10s | <1s | Status query |
| Frontend Poll Interval | 3s | - | Every 3 seconds |
| Max Poll Duration | 1800s | - | 30 minutes max |
| **Database** |
| Connection | 10s | <100ms | Pool connection |
| Query | 10s | 10-100ms | Standard queries |
| Idle Timeout | 30s | - | Connection reuse |
| **External APIs** |
| CoinMarketCap | 30s | 5-10s | Market data |
| CoinGecko | 30s | 2-5s | Market data |
| Kraken | 30s | 2-5s | Exchange data |
| LunarCrush | 10s | 3-5s | Social metrics |
| Reddit | 10s | 5-10s | Community data |
| NewsAPI | 10s | 3-5s | News articles |
| Blockchain.com | 30s | 10-20s | On-chain data |
| OpenAI | 180s | 1-2s | GPT-5.1 analysis |

---

## 🎯 Data Freshness Rules

### Phase 2: Initial Collection

**Rule**: Data must be <20 minutes old

```typescript
const MAX_AGE_INITIAL = 1200; // 20 minutes (1200 seconds)
const TTL_CACHE = 390;        // 6.5 minutes (390 seconds)
```

**Why 6.5 minutes TTL?**
- Initial collection: 20-minute freshness rule
- GPT-5.1 processing: 5-6 minutes
- Caesar analysis: 30-minute freshness rule
- Buffer: Extra time for user review

### Phase 4: GPT-5.1 Analysis

**Rule**: Use cached data (5-6 minutes old is acceptable)

```typescript
// GPT-5.1 reads from database
const context = await getComprehensiveContext(symbol, userId);

// Data is 5-6 minutes old (still fresh)
// No re-fetch needed
```

### Phase 6: Caesar Analysis

**Rule**: Data must be <30 minutes old

```typescript
const MAX_AGE_CAESAR = 1800; // 30 minutes (1800 seconds)

// Check data age
const dataAge = Date.now() - new Date(cached.created_at).getTime();

if (dataAge > MAX_AGE_CAESAR) {
  // Re-fetch data
  await fetchFreshData(symbol);
}
```

---

## 🚨 Timeout Error Handling

### API Endpoint Timeouts

```typescript
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000)
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out after 30 seconds');
    return { success: false, error: 'Timeout' };
  }
  throw error;
}
```

### GPT-5.1 Timeout Handling

```typescript
try {
  const response = await fetch('https://api.openai.com/v1/responses', {
    signal: AbortSignal.timeout(180000)
  });
} catch (error) {
  if (error.message.includes('timeout') || error.message.includes('abort')) {
    await query(
      'UPDATE ucie_openai_jobs SET status = $1, error = $2 WHERE id = $3',
      ['error', 'Analysis timed out after 3 minutes', jobId]
    );
  }
}
```

### Frontend Timeout Handling

```typescript
// Max 30 minutes of polling
if (attempts > MAX_ATTEMPTS) {
  clearInterval(interval);
  setError('Analysis timed out after 30 minutes');
  return;
}
```

---

## 📊 Performance Targets

### Response Time Targets

| Endpoint | Target | Acceptable | Unacceptable |
|----------|--------|------------|--------------|
| Market Data | <10s | <20s | >30s |
| Sentiment | <15s | <25s | >30s |
| Technical | <10s | <20s | >30s |
| News | <25s | <30s | >30s |
| On-Chain | <25s | <30s | >30s |
| GPT-5.1 | <3s | <10s | >180s |
| Preview Data | <60s | <120s | >300s |

### Success Rate Targets

- API endpoints: >95% success rate
- GPT-5.1 processing: >95% success rate
- Database queries: >99% success rate
- Overall system: >90% success rate

---

## 🔧 Timeout Configuration Best Practices

### 1. Always Use Timeouts

```typescript
// ✅ GOOD: Explicit timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000)
});

// ❌ BAD: No timeout (can hang forever)
const response = await fetch(url);
```

### 2. Use Appropriate Timeout Values

```typescript
// ✅ GOOD: Reasonable timeout for operation
const quickOperation = await fetch(url, {
  signal: AbortSignal.timeout(5000) // 5 seconds
});

// ❌ BAD: Timeout too short
const complexOperation = await fetch(url, {
  signal: AbortSignal.timeout(1000) // 1 second (too short!)
});
```

### 3. Handle Timeout Errors Gracefully

```typescript
// ✅ GOOD: Specific error handling
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
} catch (error) {
  if (error.name === 'AbortError') {
    return { success: false, error: 'Request timed out' };
  }
  throw error;
}

// ❌ BAD: Generic error handling
try {
  const response = await fetch(url);
} catch (error) {
  console.error('Error:', error); // No timeout handling
}
```

### 4. Use Parallel Execution

```typescript
// ✅ GOOD: Parallel with Promise.allSettled()
const results = await Promise.allSettled([
  fetch(url1, { signal: AbortSignal.timeout(30000) }),
  fetch(url2, { signal: AbortSignal.timeout(30000) }),
  fetch(url3, { signal: AbortSignal.timeout(30000) })
]);
// Total time: max(30s, 30s, 30s) = 30 seconds

// ❌ BAD: Sequential execution
const result1 = await fetch(url1, { signal: AbortSignal.timeout(30000) });
const result2 = await fetch(url2, { signal: AbortSignal.timeout(30000) });
const result3 = await fetch(url3, { signal: AbortSignal.timeout(30000) });
// Total time: 30s + 30s + 30s = 90 seconds
```

---

**Status**: ✅ **COMPLETE TIMEOUT CONFIGURATION**  
**Total Endpoints**: 15+ with timeout settings  
**Vercel Functions**: 7 with custom timeouts  
**External APIs**: 8 with timeout protection  
**Database**: Connection pool with 10s timeout  
**GPT-5.1**: 3-minute processing timeout  
**Frontend**: 30-minute max polling duration
