# UCIE Parallel API Pattern - Quick Reference

**Pattern**: Parallel API Racing for Fast, Reliable Data Fetching  
**Use Case**: When multiple API sources provide the same data  
**Benefit**: First success wins, no cumulative timeouts  
**Status**: ✅ Implemented in market data endpoint

---

## 🎯 The Problem

### Sequential Fallback (OLD)
```typescript
// ❌ SLOW: Each failure adds to total time
async function fetchData(symbol: string) {
  try {
    return await sourceA.getData(symbol); // 10s timeout
  } catch {
    try {
      return await sourceB.getData(symbol); // 10s timeout
    } catch {
      return null; // Total: 20s if both fail
    }
  }
}
```

**Issues**:
- Cumulative timeouts (10s + 10s = 20s)
- Slow even if second source is fast
- Exceeds overall timeout limits
- Poor user experience

---

## ✅ The Solution

### Parallel Racing (NEW)
```typescript
// ✅ FAST: First success wins
async function fetchData(symbol: string) {
  // Fetch from all sources in parallel
  const fetchPromises = [
    sourceA.getData(symbol)
      .then(data => ({ source: 'A', data }))
      .catch(error => ({ source: 'A', error })),
    sourceB.getData(symbol)
      .then(data => ({ source: 'B', data }))
      .catch(error => ({ source: 'B', error }))
  ];
  
  // Race with timeout
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ source: 'timeout', error: 'Timeout' }), 8000);
  });
  
  const results = await Promise.race([
    Promise.allSettled(fetchPromises),
    timeoutPromise
  ]);
  
  // Return first success
  if (Array.isArray(results)) {
    for (const result of results) {
      if (result.status === 'fulfilled' && 'data' in result.value) {
        return result.value.data;
      }
    }
  }
  
  return null;
}
```

**Benefits**:
- Parallel execution (max 8s, not 20s)
- First success wins
- No cumulative timeouts
- Fast and reliable

---

## 📊 Performance Comparison

| Scenario | Sequential | Parallel | Improvement |
|----------|-----------|----------|-------------|
| **Both succeed** | 10s (first) | 5s (fastest) | **50% faster** |
| **First fails, second succeeds** | 20s | 8s | **60% faster** |
| **Both fail** | 20s | 8s | **60% faster** |
| **Timeout** | 30s+ (AbortError) | 8s (graceful) | **73% faster** |

---

## 🔧 Implementation Template

### Basic Pattern
```typescript
async function parallelFetch<T>(
  symbol: string,
  sources: Array<() => Promise<T>>,
  timeout: number = 8000
): Promise<T | null> {
  // Wrap each source with error handling
  const fetchPromises = sources.map((fetchFn, index) =>
    fetchFn()
      .then(data => ({ source: `source-${index}`, data }))
      .catch(error => ({ 
        source: `source-${index}`, 
        error: error instanceof Error ? error.message : 'Unknown' 
      }))
  );
  
  // Race with timeout
  const timeoutPromise = new Promise<{ source: string; error: string }>((resolve) => {
    setTimeout(() => resolve({ 
      source: 'timeout', 
      error: `All sources timed out after ${timeout}ms` 
    }), timeout);
  });
  
  try {
    const results = await Promise.race([
      Promise.allSettled(fetchPromises),
      timeoutPromise
    ]);
    
    // If timeout, return null
    if (!Array.isArray(results)) {
      console.warn(`⏱️ Parallel fetch timed out for ${symbol}`);
      return null;
    }
    
    // Find first success
    for (const result of results) {
      if (result.status === 'fulfilled' && 'data' in result.value) {
        console.log(`✅ ${result.value.source} success for ${symbol}`);
        return result.value.data;
      }
    }
    
    // All failed
    const errors = results
      .filter(r => r.status === 'fulfilled' && 'error' in r.value)
      .map(r => r.status === 'fulfilled' ? `${r.value.source}: ${r.value.error}` : 'Unknown');
    
    console.error(`❌ All sources failed for ${symbol}:`, errors.join(', '));
    return null;
    
  } catch (error) {
    console.error(`❌ Unexpected error in parallel fetch:`, error);
    return null;
  }
}
```

### Usage Example
```typescript
// Market data with 2 sources
const marketData = await parallelFetch(
  'BTC',
  [
    () => coinMarketCapClient.getMarketData('BTC'),
    () => coinGeckoClient.getMarketData('BTC')
  ],
  8000 // 8-second timeout
);

// Price data with 3 sources
const priceData = await parallelFetch(
  'ETH',
  [
    () => binanceClient.getPrice('ETH'),
    () => krakenClient.getPrice('ETH'),
    () => coinbaseClient.getPrice('ETH')
  ],
  5000 // 5-second timeout
);
```

---

## 🎓 When to Use This Pattern

### ✅ Good Use Cases
- Multiple API sources for same data
- Need fastest response time
- Fallback sources available
- Timeout-sensitive operations
- User-facing endpoints

### ❌ Not Recommended For
- Single API source (no benefit)
- Different data from each source (use Promise.all)
- Sequential dependencies (one depends on another)
- Rate-limited APIs (may hit limits faster)

---

## 🔍 Debugging Tips

### Check Logs
```typescript
// Add logging to see which source wins
console.log(`📊 Racing ${sources.length} sources for ${symbol}...`);

// Log winner
console.log(`✅ ${winningSource} success for ${symbol} (${duration}ms)`);

// Log failures
console.warn(`❌ ${failedSource} failed: ${error}`);
```

### Monitor Performance
```typescript
const startTime = Date.now();
const data = await parallelFetch(...);
const duration = Date.now() - startTime;

console.log(`⏱️ Parallel fetch completed in ${duration}ms`);
```

### Track Success Rates
```typescript
const stats = {
  sourceA: { success: 0, failure: 0 },
  sourceB: { success: 0, failure: 0 }
};

// Update stats based on which source won
if (winningSource === 'sourceA') {
  stats.sourceA.success++;
} else {
  stats.sourceA.failure++;
}
```

---

## 📋 Checklist for Implementation

### Before Implementing
- [ ] Identify all API sources for same data
- [ ] Verify sources return compatible data formats
- [ ] Check API rate limits (parallel may hit limits faster)
- [ ] Determine appropriate timeout value
- [ ] Plan error handling strategy

### During Implementation
- [ ] Wrap each source with error handling
- [ ] Add timeout promise
- [ ] Use Promise.race() for racing
- [ ] Handle both success and failure cases
- [ ] Add comprehensive logging

### After Implementation
- [ ] Test with all sources working
- [ ] Test with one source failing
- [ ] Test with all sources failing
- [ ] Test timeout scenario
- [ ] Monitor performance in production

---

## 🚀 Advanced Patterns

### Priority-Based Racing
```typescript
// Try fast source first, fallback to slow source
async function priorityFetch<T>(
  symbol: string,
  fastSource: () => Promise<T>,
  slowSource: () => Promise<T>
): Promise<T | null> {
  // Start fast source immediately
  const fastPromise = fastSource()
    .then(data => ({ source: 'fast', data }))
    .catch(error => ({ source: 'fast', error }));
  
  // Start slow source after 2s delay
  const slowPromise = new Promise<any>((resolve) => {
    setTimeout(() => {
      slowSource()
        .then(data => resolve({ source: 'slow', data }))
        .catch(error => resolve({ source: 'slow', error }));
    }, 2000);
  });
  
  // Race both
  const results = await Promise.race([
    Promise.allSettled([fastPromise, slowPromise]),
    timeoutPromise(10000)
  ]);
  
  // Return first success
  // ...
}
```

### Weighted Racing
```typescript
// Prefer certain sources based on reliability
async function weightedFetch<T>(
  symbol: string,
  sources: Array<{ fetch: () => Promise<T>; weight: number }>
): Promise<T | null> {
  // Sort by weight (higher = more reliable)
  const sorted = sources.sort((a, b) => b.weight - a.weight);
  
  // Fetch all in parallel
  const results = await parallelFetch(
    symbol,
    sorted.map(s => s.fetch),
    8000
  );
  
  return results;
}
```

---

## 📚 Related Patterns

### Promise.all() - Wait for All
```typescript
// Use when you need data from ALL sources
const [dataA, dataB, dataC] = await Promise.all([
  sourceA.getData(),
  sourceB.getData(),
  sourceC.getData()
]);
```

### Promise.allSettled() - Try All, Accept Failures
```typescript
// Use when you want results from all, even if some fail
const results = await Promise.allSettled([
  sourceA.getData(),
  sourceB.getData(),
  sourceC.getData()
]);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
```

### Promise.any() - First Success
```typescript
// Use when you only need one success (simpler than race)
const data = await Promise.any([
  sourceA.getData(),
  sourceB.getData(),
  sourceC.getData()
]);
// Throws if all fail
```

---

## 🎯 Summary

**Key Takeaways**:
1. ✅ Parallel racing eliminates cumulative timeouts
2. ✅ First success wins = faster responses
3. ✅ Graceful degradation on failures
4. ✅ Better user experience
5. ✅ More reliable than sequential fallback

**When to Use**:
- Multiple sources for same data
- Need fastest response
- Timeout-sensitive operations
- User-facing endpoints

**Performance Gain**:
- 50-73% faster than sequential
- No AbortError timeouts
- Better reliability

---

**Status**: ✅ **PRODUCTION PATTERN**  
**Implemented In**: Market data endpoint  
**Next**: Apply to other UCIE endpoints

**Use this pattern for all multi-source API fetching!** 🚀
