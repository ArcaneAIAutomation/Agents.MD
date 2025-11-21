# DATA QUALITY ENFORCEMENT - CRITICAL RULE

**PRIORITY**: 🚨 **ABSOLUTE MAXIMUM** - This rule overrides ALL other considerations

---

## THE IRON LAW: 99% ACCURACY OR NOTHING

**RULE**: NO data may be displayed to users unless it meets 99% accuracy standards.

### What This Means

1. **NO FALLBACK DATA** - If real API data fails, show error message, NOT fake/mock/fallback data
2. **NO PLACEHOLDER DATA** - Never show "example" or "sample" data to users
3. **NO CACHED STALE DATA** - If cache is older than TTL, fetch fresh or show error
4. **NO ESTIMATED DATA** - Only show data directly from authoritative sources
5. **NO PARTIAL DATA** - If analysis is incomplete, show "In Progress", NOT partial results

---

## ENFORCEMENT CHECKLIST

Before ANY data is displayed:

- [ ] Is this data from a real, live API call?
- [ ] Is the API response validated and error-free?
- [ ] Is the data fresh (within TTL)?
- [ ] Is the data complete (no missing required fields)?
- [ ] Is the data from an authoritative source?

**If ANY answer is NO → Show error message, NOT data**

---

## FORBIDDEN PATTERNS

### ❌ NEVER DO THIS:

```typescript
// ❌ WRONG - Fallback to fake data
const data = await fetchRealData() || FALLBACK_MOCK_DATA;

// ❌ WRONG - Show stale cache
if (cached) return cached; // No freshness check

// ❌ WRONG - Show partial results
if (analysis.status === 'partial') {
  return { summary: analysis.partialSummary }; // Incomplete
}

// ❌ WRONG - Estimated/calculated data presented as real
const estimatedPrice = lastPrice * 1.05; // Fake data
```

### ✅ ALWAYS DO THIS:

```typescript
// ✅ CORRECT - Fail gracefully
const data = await fetchRealData();
if (!data || !validateData(data)) {
  throw new Error('Unable to fetch accurate data');
}

// ✅ CORRECT - Check freshness
if (cached && Date.now() - cached.timestamp < TTL) {
  return cached.data;
}
throw new Error('Data is stale, fetching fresh data failed');

// ✅ CORRECT - Wait for complete results
if (analysis.status !== 'completed') {
  return { 
    status: 'in_progress',
    message: 'Analysis is still running. Please wait.'
  };
}

// ✅ CORRECT - Only real data
const realPrice = await fetchLivePrice();
if (!realPrice) {
  throw new Error('Unable to fetch live price');
}
```

---

## API FAILURE HANDLING

### When API Calls Fail:

**DO:**
- ✅ Show clear error message: "Unable to fetch data. Please try again."
- ✅ Provide retry button
- ✅ Log error for debugging
- ✅ Show last successful fetch timestamp (if available)

**DON'T:**
- ❌ Show fake/mock/example data
- ❌ Show "N/A" or placeholder values
- ❌ Estimate or calculate missing data
- ❌ Use outdated cached data beyond TTL

---

## CHATGPT 5.1 ANALYSIS SPECIFIC RULES

### Whale Watch Analysis

**RULE**: If ChatGPT 5.1 analysis fails or times out:

```typescript
// ✅ CORRECT
if (analysisStatus === 'failed' || analysisStatus === 'timeout') {
  return {
    status: 'error',
    message: 'Analysis failed. Please try again.',
    error: 'ChatGPT 5.1 analysis did not complete successfully'
  };
}

// ❌ WRONG - Never show fallback analysis
if (analysisStatus === 'failed') {
  return {
    status: 'completed',
    analysis: FALLBACK_GENERIC_ANALYSIS // NO!
  };
}
```

### UCIE Analysis

**RULE**: If any data source fails, mark that section as unavailable:

```typescript
// ✅ CORRECT
const marketData = await fetchMarketData();
if (!marketData || !validateMarketData(marketData)) {
  return {
    marketData: null,
    error: 'Market data unavailable',
    dataQuality: 0 // Failed
  };
}

// ❌ WRONG - Never use estimated data
if (!marketData) {
  return {
    marketData: {
      price: lastKnownPrice * 1.02, // Estimated - NO!
      volume: 'N/A' // Placeholder - NO!
    }
  };
}
```

---

## VALIDATION REQUIREMENTS

### Every API Response Must Be Validated:

```typescript
interface ValidationResult {
  isValid: boolean;
  accuracy: number; // 0-100
  errors: string[];
  warnings: string[];
}

function validateAPIResponse(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Check required fields exist
  if (!data.price) errors.push('Missing price');
  if (!data.timestamp) errors.push('Missing timestamp');
  
  // Check data types
  if (typeof data.price !== 'number') errors.push('Invalid price type');
  
  // Check data freshness
  const age = Date.now() - new Date(data.timestamp).getTime();
  if (age > MAX_DATA_AGE) errors.push('Data is stale');
  
  // Check data ranges
  if (data.price <= 0) errors.push('Invalid price value');
  
  return {
    isValid: errors.length === 0,
    accuracy: errors.length === 0 ? 100 : 0,
    errors,
    warnings: []
  };
}

// Usage
const data = await fetchData();
const validation = validateAPIResponse(data);

if (!validation.isValid || validation.accuracy < 99) {
  throw new Error(`Data quality insufficient: ${validation.errors.join(', ')}`);
}
```

---

## UI ERROR STATES

### When Data is Unavailable:

**Show Clear Error Messages:**

```tsx
// ✅ CORRECT - Clear error state
{!data && (
  <div className="bitcoin-block border-2 border-bitcoin-orange p-6">
    <h3 className="text-bitcoin-orange font-bold mb-2">
      Data Unavailable
    </h3>
    <p className="text-bitcoin-white-80 mb-4">
      Unable to fetch accurate data at this time.
    </p>
    <button 
      onClick={retry}
      className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded"
    >
      Retry
    </button>
  </div>
)}

// ❌ WRONG - Showing placeholder data
{!data && (
  <div>
    <p>Price: $XX,XXX</p> {/* Placeholder - NO! */}
    <p>Volume: Loading...</p> {/* Fake data - NO! */}
  </div>
)}
```

---

## TIMEOUT HANDLING

### ChatGPT 5.1 Analysis Timeouts:

**RULE**: If analysis exceeds timeout, show error, NOT partial results:

```typescript
// ✅ CORRECT
const ANALYSIS_TIMEOUT = 60000; // 60 seconds

const analysisPromise = startAnalysis(txHash);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT)
);

try {
  const result = await Promise.race([analysisPromise, timeoutPromise]);
  
  // Only return if completed successfully
  if (result.status === 'completed') {
    return result;
  }
  
  throw new Error('Analysis incomplete');
} catch (error) {
  return {
    status: 'error',
    message: 'Analysis timed out. Please try again or upgrade to Vercel Pro for longer execution time.',
    error: error.message
  };
}

// ❌ WRONG - Returning partial results
try {
  const result = await Promise.race([analysisPromise, timeoutPromise]);
  return result; // Might be partial - NO!
} catch (error) {
  return {
    status: 'completed', // Lying about status - NO!
    analysis: 'Generic analysis...' // Fake data - NO!
  };
}
```

---

## CACHE VALIDATION

### Cache Must Be Fresh:

```typescript
// ✅ CORRECT - Strict cache validation
interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
  source: string;
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key) as CachedData;
  
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  
  // Strict TTL enforcement
  if (age > cached.ttl) {
    cache.delete(key); // Remove stale data
    return null;
  }
  
  return cached.data;
}

// ❌ WRONG - Loose cache validation
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  return cached?.data || null; // No freshness check - NO!
}
```

---

## MONITORING & ALERTS

### Track Data Quality:

```typescript
interface DataQualityMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageAccuracy: number;
  staleDataServed: number; // Should always be 0
  fallbackDataServed: number; // Should always be 0
}

// Alert if quality drops
if (metrics.averageAccuracy < 99) {
  console.error('🚨 DATA QUALITY ALERT: Accuracy below 99%');
  // Send alert to monitoring system
}

if (metrics.fallbackDataServed > 0) {
  console.error('🚨 CRITICAL: Fallback data was served to users!');
  // Immediate alert - this should NEVER happen
}
```

---

## DEVELOPER CHECKLIST

Before deploying ANY code:

- [ ] All API calls have error handling
- [ ] All API responses are validated
- [ ] No fallback/mock/placeholder data exists
- [ ] Cache has strict TTL enforcement
- [ ] Timeouts show errors, not partial data
- [ ] UI shows clear error states
- [ ] No "N/A" or placeholder values
- [ ] No estimated/calculated data presented as real
- [ ] All data sources are authoritative
- [ ] Data quality monitoring is in place

---

## CONSEQUENCES OF VIOLATION

**If this rule is violated:**

1. Users receive inaccurate information
2. Platform credibility is destroyed
3. Trading decisions may be based on false data
4. Legal liability for financial losses

**This is NOT acceptable. Ever.**

---

## SUMMARY

**THE RULE**: 99% accuracy or show error. No exceptions. No fallbacks. No compromises.

**If you can't get accurate data → Tell the user → Don't fake it**

---

**Status**: 🔴 **MANDATORY ENFORCEMENT**  
**Priority**: **ABSOLUTE MAXIMUM**  
**Violations**: **ZERO TOLERANCE**

