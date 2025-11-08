# UCIE Quick Fix Guide - Data Source Failures

**Priority**: 🔴 Critical  
**Time Required**: 30 minutes  
**Impact**: Immediate improvement in data quality reporting

---

## 🎯 Quick Win #1: Fix API Status Calculation (15 minutes)

### The Problem

Current code treats empty responses as "working":

```typescript
// ❌ CURRENT (WRONG)
if (collectedData[api] && collectedData[api].success !== false) {
  working.push(api);
}
```

This counts APIs as "working" even when they return no data.

### The Fix

**File**: `pages/api/ucie/preview-data/[symbol].ts`

**Replace** the `calculateAPIStatus` function:

```typescript
/**
 * Calculate API status with proper data validation
 */
function calculateAPIStatus(collectedData: any) {
  const working: string[] = [];
  const failed: string[] = [];

  // Market Data - Check for actual price data
  if (
    collectedData.marketData?.success === true &&
    collectedData.marketData?.priceAggregation?.prices?.length > 0
  ) {
    working.push('Market Data');
  } else {
    failed.push('Market Data');
  }

  // Sentiment - Check for actual sentiment data
  if (
    collectedData.sentiment?.success === true &&
    (collectedData.sentiment?.sentiment?.overallScore > 0 ||
     collectedData.sentiment?.sources?.lunarCrush === true ||
     collectedData.sentiment?.sources?.twitter === true ||
     collectedData.sentiment?.sources?.reddit === true)
  ) {
    working.push('Sentiment');
  } else {
    failed.push('Sentiment');
  }

  // Technical - Check for actual indicators
  if (
    collectedData.technical?.success === true &&
    collectedData.technical?.indicators &&
    Object.keys(collectedData.technical.indicators).length > 0
  ) {
    working.push('Technical');
  } else {
    failed.push('Technical');
  }

  // News - Check for actual articles
  if (
    collectedData.news?.success === true &&
    collectedData.news?.articles?.length > 0
  ) {
    working.push('News');
  } else {
    failed.push('News');
  }

  // On-Chain - Check for actual data quality
  if (
    collectedData.onChain?.success === true &&
    collectedData.onChain?.dataQuality > 0
  ) {
    working.push('On-Chain');
  } else {
    failed.push('On-Chain');
  }

  return {
    working,
    failed,
    total: 5,
    successRate: Math.round((working.length / 5) * 100)
  };
}
```

### Expected Result

**Before**: "5/5 APIs working" with 0% data quality  
**After**: "0/5 APIs working" with 0% data quality (accurate!)

---

## 🎯 Quick Win #2: Increase Timeouts (5 minutes)

### The Problem

5-second timeouts are too aggressive for complex API calls.

### The Fix

**File**: `pages/api/ucie/preview-data/[symbol].ts`

**Update** the `EFFECTIVE_APIS` configuration:

```typescript
const EFFECTIVE_APIS = {
  marketData: {
    endpoint: '/api/ucie/market-data',
    priority: 1,
    timeout: 10000, // ✅ Increased from 5000
    required: true
  },
  sentiment: {
    endpoint: '/api/ucie/sentiment',
    priority: 2,
    timeout: 10000, // ✅ Increased from 5000
    required: false
  },
  technical: {
    endpoint: '/api/ucie/technical',
    priority: 2,
    timeout: 10000, // ✅ Increased from 5000
    required: false
  },
  news: {
    endpoint: '/api/ucie/news',
    priority: 2,
    timeout: 15000, // ✅ Already 10000, increase to 15000
    required: false
  },
  onChain: {
    endpoint: '/api/ucie/on-chain',
    priority: 3,
    timeout: 10000, // ✅ Increased from 5000
    required: false
  }
};
```

### Expected Result

Fewer timeout failures, especially for sentiment and news APIs.

---

## 🎯 Quick Win #3: Better Error Logging (10 minutes)

### The Problem

When APIs fail, we don't know why.

### The Fix

**File**: `pages/api/ucie/preview-data/[symbol].ts`

**Update** the `collectDataFromAPIs` function:

```typescript
async function collectDataFromAPIs(symbol: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log(`🔍 Collecting data for ${symbol}...`);
  
  const results = await Promise.allSettled([
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.marketData.endpoint}/${symbol}`,
      EFFECTIVE_APIS.marketData.timeout
    ).catch(err => {
      console.error(`❌ Market Data failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.sentiment.endpoint}/${symbol}`,
      EFFECTIVE_APIS.sentiment.timeout
    ).catch(err => {
      console.error(`❌ Sentiment failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.technical.endpoint}/${symbol}`,
      EFFECTIVE_APIS.technical.timeout
    ).catch(err => {
      console.error(`❌ Technical failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.news.endpoint}/${symbol}`,
      EFFECTIVE_APIS.news.timeout
    ).catch(err => {
      console.error(`❌ News failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.onChain.endpoint}/${symbol}`,
      EFFECTIVE_APIS.onChain.timeout
    ).catch(err => {
      console.error(`❌ On-Chain failed:`, err.message);
      throw err;
    })
  ]);

  // Log results
  results.forEach((result, index) => {
    const apiNames = ['Market Data', 'Sentiment', 'Technical', 'News', 'On-Chain'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${apiNames[index]}: Success`);
    } else {
      console.log(`❌ ${apiNames[index]}: ${result.reason?.message || 'Failed'}`);
    }
  });

  return {
    marketData: results[0].status === 'fulfilled' ? results[0].value : null,
    sentiment: results[1].status === 'fulfilled' ? results[1].value : null,
    technical: results[2].status === 'fulfilled' ? results[2].value : null,
    news: results[3].status === 'fulfilled' ? results[3].value : null,
    onChain: results[4].status === 'fulfilled' ? results[4].value : null
  };
}
```

### Expected Result

Clear console logs showing exactly which APIs failed and why.

---

## 🧪 Testing After Fixes

### Test Command

```bash
# Test SOL
curl https://news.arcane.group/api/ucie/preview-data/SOL

# Test BTC
curl https://news.arcane.group/api/ucie/preview-data/BTC

# Test ETH
curl https://news.arcane.group/api/ucie/preview-data/ETH
```

### Expected Results

**SOL (Solana)**:
- Market Data: ✅ (CoinGecko should work)
- Sentiment: ❌ (May still fail)
- Technical: ✅ (CryptoCompare should work)
- News: ⚠️ (May have limited articles)
- On-Chain: ❌ (Not supported)
- **Total**: 40-60% data quality

**BTC (Bitcoin)**:
- Market Data: ✅
- Sentiment: ✅
- Technical: ✅
- News: ✅
- On-Chain: ❌ (Not an ERC-20 token)
- **Total**: 80% data quality

**ETH (Ethereum)**:
- Market Data: ✅
- Sentiment: ✅
- Technical: ✅
- News: ✅
- On-Chain: ✅
- **Total**: 100% data quality

---

## 📊 Monitoring

### Check Vercel Logs

1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Click latest deployment → Functions
4. View logs for `/api/ucie/preview-data/[symbol]`

### Look For

```
🔍 Collecting data for SOL...
❌ Market Data failed: HTTP 404: Not Found
❌ Sentiment failed: No social sentiment data found
✅ Technical: Success
❌ News failed: Timeout
❌ On-Chain failed: Token not supported
```

---

## 🚀 Deployment

### Step 1: Apply Fixes

```bash
# Edit the file
code pages/api/ucie/preview-data/[symbol].ts

# Apply all 3 fixes above
```

### Step 2: Test Locally

```bash
npm run dev

# Test in browser
http://localhost:3000/api/ucie/preview-data/SOL
```

### Step 3: Deploy

```bash
git add pages/api/ucie/preview-data/[symbol].ts
git commit -m "fix: Improve UCIE data quality calculation and error logging"
git push origin main
```

### Step 4: Verify Production

```bash
# Wait 2-3 minutes for deployment
# Then test
curl https://news.arcane.group/api/ucie/preview-data/SOL
```

---

## 📈 Expected Improvements

### Before Fixes

- **False Positives**: APIs counted as "working" with no data
- **Poor Visibility**: No idea why APIs are failing
- **Timeout Issues**: Aggressive 5s timeouts causing failures

### After Fixes

- **Accurate Reporting**: Only APIs with actual data counted as working
- **Clear Diagnostics**: Console logs show exactly what's failing
- **Better Success Rate**: Increased timeouts reduce failures

### Metrics

| Metric | Before | After |
|--------|--------|-------|
| False Positives | High | None |
| Diagnostic Clarity | Low | High |
| Timeout Failures | ~30% | ~10% |
| User Confidence | Low | High |

---

## 🎯 Next Steps (After Quick Fixes)

### Medium Priority (1-2 hours)

1. **Implement Symbol Mapping Service**
   - Centralized mapping for all APIs
   - Handle "SOL" → "solana" conversions
   - Support multiple identifier formats

2. **Add Fallback Data Sources**
   - Cache successful responses
   - Use cached data when APIs fail
   - Implement stale-while-revalidate pattern

### Long Priority (4-6 hours)

1. **Add Solana Support**
   - Implement Solana RPC client
   - Add SOL to TOKEN_CONTRACTS
   - Support Solana-native tokens

2. **Improve Sentiment API**
   - Better error handling
   - Fallback to single source if others fail
   - Cache social metrics longer

---

**Status**: 🟡 **Ready to Implement**  
**Time**: 30 minutes  
**Impact**: Immediate improvement in accuracy and diagnostics
