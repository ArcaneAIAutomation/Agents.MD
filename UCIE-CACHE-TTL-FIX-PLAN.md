# UCIE Cache TTL Fix - Complete Plan

**Date**: November 15, 2025  
**Issue**: Cache expires too quickly (2 minutes) - data not available for Gemini analysis  
**Root Cause**: All UCIE endpoints have `CACHE_TTL = 2 * 60` (120 seconds)  
**Required**: Increase to 5 minutes (300 seconds) minimum

---

## 🔍 Problem Analysis

### Current State (From Database Screenshot):
```
created_at: 2025-11-15 13:53:12
expires_at: 2025-11-15 13:55:12
Duration: 2 minutes (120 seconds)
```

### Why This Is a Problem:
1. **Phase 1 Data Collection**: Takes 10-15 seconds
2. **User Review Time**: User needs time to review preview
3. **Phase 2 Gemini Analysis**: Starts after user clicks "Proceed"
4. **Total Time**: Can easily exceed 2 minutes
5. **Result**: Cache expires before Gemini can use it

### Recommended TTL Values:
- **Market Data**: 5 minutes (300s) - Prices change frequently but not every second
- **Sentiment**: 5 minutes (300s) - Social data updates every few minutes
- **Technical**: 5 minutes (300s) - Indicators recalculate every few minutes
- **News**: 10 minutes (600s) - News doesn't change that fast
- **On-Chain**: 5 minutes (300s) - Blockchain data updates every block
- **Risk**: 10 minutes (600s) - Risk scores are relatively stable
- **Predictions**: 15 minutes (900s) - Predictions don't change rapidly
- **DeFi**: 10 minutes (600s) - TVL data updates slowly
- **Derivatives**: 5 minutes (300s) - Futures data updates frequently

---

## 📋 Files to Update (14 endpoints)

### Phase 1 Data Collection Endpoints (9 files):
1. ✅ `pages/api/ucie/market-data/[symbol].ts` - 2min → 5min
2. ✅ `pages/api/ucie/sentiment/[symbol].ts` - 2min → 5min
3. ✅ `pages/api/ucie/technical/[symbol].ts` - 2min → 5min
4. ✅ `pages/api/ucie/news/[symbol].ts` - 2min → 10min
5. ✅ `pages/api/ucie/on-chain/[symbol].ts` - 2min → 5min
6. ✅ `pages/api/ucie/risk/[symbol].ts` - 2min → 10min
7. ✅ `pages/api/ucie/predictions/[symbol].ts` - 2min → 15min
8. ✅ `pages/api/ucie/derivatives/[symbol].ts` - 2min → 5min
9. ✅ `pages/api/ucie/defi/[symbol].ts` - 2min → 10min

### Phase 2 Analysis Endpoints (3 files):
10. ✅ `pages/api/ucie/research/[symbol].ts` - 2min → 30min (Caesar research)
11. ✅ `pages/api/ucie/openai-summary/[symbol].ts` - 2min → 30min (OpenAI summary)
12. ✅ `pages/api/ucie/preview-data/[symbol].ts` - Check if has TTL setting

### Utility Endpoints (2 files):
13. ✅ `pages/api/ucie/collect-all-data/[symbol].ts` - 2min → 5min
14. ✅ `pages/api/ucie/enrich-data/[symbol].ts` - 2min → 5min

---

## 🔧 Implementation Plan

### Step 1: Update All Cache TTL Constants

**Pattern to Replace:**
```typescript
// OLD (2 minutes)
const CACHE_TTL = 2 * 60; // 120 seconds

// NEW (5-30 minutes depending on data type)
const CACHE_TTL = 5 * 60; // 300 seconds (5 minutes)
```

### Step 2: Add TTL Comments for Clarity

```typescript
// Cache TTL: 5 minutes (balances freshness with performance)
const CACHE_TTL = 5 * 60; // 300 seconds
```

### Step 3: Update Preview-Data Storage

Check if `preview-data/[symbol].ts` stores data with proper TTL:
```typescript
await setCachedAnalysis(
  normalizedSymbol, 
  'preview-data', 
  response, 
  5 * 60, // 5 minutes
  dataQuality,
  userId,
  userEmail
);
```

### Step 4: Verify Database Schema

Ensure `ucie_analysis_cache` table calculates `expires_at` correctly:
```sql
expires_at = created_at + (ttl_seconds * INTERVAL '1 second')
```

---

## 🎯 Expected Results After Fix

### Before Fix:
```
created_at: 2025-11-15 13:53:12
expires_at: 2025-11-15 13:55:12  ❌ Only 2 minutes
Status: EXPIRED before Gemini can use it
```

### After Fix:
```
created_at: 2025-11-15 13:53:12
expires_at: 2025-11-15 13:58:12  ✅ 5 minutes
Status: AVAILABLE for Gemini analysis
```

### Timeline Example:
```
00:00 - User clicks "Analyze BTC"
00:10 - Phase 1 completes, data cached (expires at 00:10 + 5min = 00:15)
00:30 - User reviews preview
00:45 - User clicks "Proceed to Analysis"
00:45 - Gemini reads cached data (still valid until 00:15)
01:00 - Gemini completes analysis
Result: ✅ SUCCESS - Data was available throughout
```

---

## 🧪 Testing Plan

### Test 1: Cache Duration
```bash
# 1. Trigger BTC analysis
curl https://news.arcane.group/api/ucie/preview-data/BTC

# 2. Check database immediately
npx tsx scripts/check-gemini-cache.ts

# Expected: expires_at = created_at + 5 minutes
```

### Test 2: Data Availability
```bash
# 1. Trigger analysis
# 2. Wait 3 minutes
# 3. Check if data still cached
# Expected: ✅ Data still available
```

### Test 3: End-to-End Flow
```bash
# 1. Analyze BTC
# 2. Review preview (wait 2 minutes)
# 3. Proceed to Gemini analysis
# 4. Verify Gemini gets all data
# Expected: ✅ 1500-2000 word analysis with all sections
```

---

## 📊 Cache TTL Reference Table

| Data Type | Current TTL | New TTL | Reason |
|-----------|-------------|---------|--------|
| Market Data | 2 min | 5 min | Prices change frequently |
| Sentiment | 2 min | 5 min | Social data updates often |
| Technical | 2 min | 5 min | Indicators recalculate |
| News | 2 min | 10 min | News updates slower |
| On-Chain | 2 min | 5 min | Block-based updates |
| Risk | 2 min | 10 min | Risk scores stable |
| Predictions | 2 min | 15 min | Predictions stable |
| DeFi | 2 min | 10 min | TVL updates slowly |
| Derivatives | 2 min | 5 min | Futures data frequent |
| Research | 2 min | 30 min | Caesar analysis expensive |
| OpenAI | 2 min | 30 min | GPT-4o analysis expensive |

---

## 🚀 Deployment Steps

1. ✅ Update all 14 endpoint files with new TTL values
2. ✅ Test locally with `npm run dev`
3. ✅ Verify cache duration in database
4. ✅ Commit changes with descriptive message
5. ✅ Push to main branch
6. ✅ Vercel auto-deploys
7. ✅ Test in production
8. ✅ Monitor cache hit rates

---

## 📝 Success Criteria

- [ ] All endpoints have appropriate TTL (5-30 minutes)
- [ ] Database shows correct `expires_at` timestamps
- [ ] Gemini analysis can read cached data
- [ ] No "data not found" errors
- [ ] 1500-2000 word analysis generated successfully
- [ ] User experience is smooth (no delays)
- [ ] Cache hit rate > 80%

---

## 🔄 Rollback Plan

If issues occur:
1. Revert TTL changes: `git revert <commit-hash>`
2. Push to main
3. Vercel auto-deploys old version
4. Investigate issue
5. Fix and redeploy

---

## 💡 Additional Improvements

### 1. Add Cache Warming
Pre-fetch popular symbols (BTC, ETH) every 4 minutes to keep cache fresh.

### 2. Add Cache Monitoring
Track cache hit/miss rates per endpoint.

### 3. Add User Feedback
Show cache age in UI: "Data from 2 minutes ago"

### 4. Add Cache Invalidation
Allow manual cache refresh with `?refresh=true` parameter.

---

**Status**: 📋 **PLAN READY**  
**Next Step**: Implement TTL changes across all 14 endpoints  
**Estimated Time**: 30 minutes  
**Risk Level**: Low (just changing constants)
