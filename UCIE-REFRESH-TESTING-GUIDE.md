# UCIE Refresh Testing Guide

**Date**: November 29, 2025  
**Purpose**: Comprehensive testing strategy for refresh parameter fix  
**Expected Outcome**: Sentiment 0% → 40-100%, On-Chain 0% → 60-100%

---

## 🎯 Testing Objectives

1. **Verify refresh parameter works** - Fresh data is fetched when requested
2. **Verify cache still works** - Normal requests use cached data
3. **Verify data quality improves** - 0% → 40-100% for Sentiment, 0% → 60-100% for On-Chain
4. **Verify multiple polls** - Consistent behavior across multiple requests
5. **Verify logs** - Clear indication of refresh vs cached requests

---

## 🧪 Test Scenarios

### Test 1: Initial Request (Cache Miss)

**Purpose**: Establish baseline - first request should fetch fresh data

**Steps**:
1. Clear browser cache (or use incognito mode)
2. Open UCIE preview modal for BTC
3. Observe initial data collection

**Expected Results**:
- ✅ All 5 APIs fetch fresh data
- ✅ Sentiment: 40-100% data quality (Fear & Greed + LunarCrush + Reddit)
- ✅ On-Chain: 60-100% data quality (Blockchain.com stats + latest block)
- ✅ Data is stored in cache
- ✅ Response time: 5-10 seconds

**Vercel Logs to Check**:
```
📊 UCIE Sentiment API called for BTC
❌ Cache miss for BTC/sentiment - fetching fresh data
✅ Sentiment: VALID (dataQuality: 40-100%)

⛓️ UCIE On-Chain API called for BTC
❌ Cache miss for BTC/on-chain - fetching fresh data
✅ On-Chain: VALID (dataQuality: 60-100%)
```

---

### Test 2: Second Request (Cache Hit)

**Purpose**: Verify cache is working for normal requests

**Steps**:
1. Close UCIE preview modal
2. Immediately reopen UCIE preview modal for BTC
3. Observe data is returned instantly

**Expected Results**:
- ✅ All 5 APIs return cached data
- ✅ Sentiment: Same data quality as Test 1
- ✅ On-Chain: Same data quality as Test 1
- ✅ Response time: < 1 second (instant)
- ✅ `cached: true` in response

**Vercel Logs to Check**:
```
📊 UCIE Sentiment API called for BTC
✅ Cache hit for BTC/sentiment

⛓️ UCIE On-Chain API called for BTC
✅ Cache hit for BTC/on-chain
```

---

### Test 3: Refresh Request (Force Fresh Data)

**Purpose**: Verify refresh parameter bypasses cache

**Steps**:
1. In UCIE preview modal, click "Refresh Data" button
2. Observe fresh data is fetched
3. Compare data quality before and after

**Expected Results**:
- ✅ Cache is invalidated
- ✅ Fresh data is fetched from all APIs
- ✅ Sentiment: 40-100% data quality (updated values)
- ✅ On-Chain: 60-100% data quality (updated values)
- ✅ Response time: 5-10 seconds
- ✅ `cached: false` in response

**Vercel Logs to Check**:
```
🗑️ Invalidating cache for BTC...
✅ Invalidated cache for BTC

📊 UCIE Sentiment API called for BTC (FORCING FRESH DATA)
🔄 Refresh requested - bypassing cache for BTC/sentiment
❌ Cache miss for BTC/sentiment - fetching fresh data

⛓️ UCIE On-Chain API called for BTC (FORCING FRESH DATA)
🔄 Refresh requested - bypassing cache for BTC/on-chain
❌ Cache miss for BTC/on-chain - fetching fresh data
```

---

### Test 4: Multiple Refresh Polls (Your Test Case)

**Purpose**: Verify consistent behavior across multiple refresh requests

**Steps**:
1. Open UCIE preview modal for BTC
2. Click "Refresh Data" button
3. Wait for completion
4. Click "Refresh Data" button again (immediately)
5. Wait for completion
6. Click "Refresh Data" button again (immediately)
7. Repeat 5-10 times

**Expected Results**:
- ✅ Each refresh fetches fresh data
- ✅ Sentiment data quality: 40-100% on EVERY refresh
- ✅ On-Chain data quality: 60-100% on EVERY refresh
- ✅ No "0%" data quality after first refresh
- ✅ Response time: 5-10 seconds per refresh
- ✅ No timeout errors
- ✅ No cache contamination

**What to Watch For**:
- ❌ Data quality dropping back to 0% (indicates cache issue)
- ❌ Same data on every refresh (indicates refresh not working)
- ❌ Timeout errors (indicates API issues)
- ❌ Inconsistent data quality (indicates API reliability issues)

**Vercel Logs to Check** (for each refresh):
```
Refresh #1:
📊 UCIE Sentiment API called for BTC (FORCING FRESH DATA)
✅ Sentiment: VALID (dataQuality: 85%)

Refresh #2:
📊 UCIE Sentiment API called for BTC (FORCING FRESH DATA)
✅ Sentiment: VALID (dataQuality: 90%)

Refresh #3:
📊 UCIE Sentiment API called for BTC (FORCING FRESH DATA)
✅ Sentiment: VALID (dataQuality: 75%)
```

---

### Test 5: Mixed Requests (Cache + Refresh)

**Purpose**: Verify cache and refresh work together correctly

**Steps**:
1. Open UCIE preview modal for BTC (cache miss)
2. Close and reopen modal (cache hit)
3. Click "Refresh Data" (force fresh)
4. Close and reopen modal (cache hit with fresh data)
5. Wait 6 minutes (cache expires)
6. Reopen modal (cache miss, fetch fresh)

**Expected Results**:
- ✅ Step 1: Fresh data, 5-10 seconds
- ✅ Step 2: Cached data, < 1 second
- ✅ Step 3: Fresh data, 5-10 seconds
- ✅ Step 4: Cached fresh data, < 1 second
- ✅ Step 5: (wait)
- ✅ Step 6: Fresh data, 5-10 seconds (cache expired)

---

### Test 6: Different Symbols

**Purpose**: Verify refresh works for all supported symbols

**Steps**:
1. Test BTC with refresh
2. Test ETH with refresh
3. Test SOL with refresh (if supported)

**Expected Results**:
- ✅ BTC: Sentiment 40-100%, On-Chain 60-100%
- ✅ ETH: Sentiment 40-100%, On-Chain 60-100%
- ✅ SOL: Sentiment 40-100%, On-Chain 0% (not supported yet)

---

## 📊 Data Quality Expectations

### Sentiment API (40-100% Expected)

**Data Sources**:
1. **Fear & Greed Index** (40% weight) - ALWAYS AVAILABLE
2. **LunarCrush** (35% weight) - Usually available
3. **Reddit** (25% weight) - Usually available

**Quality Scenarios**:
- **100%**: All 3 sources working
- **75%**: Fear & Greed + LunarCrush (Reddit failed)
- **65%**: Fear & Greed + Reddit (LunarCrush failed)
- **40%**: Fear & Greed only (minimum acceptable)
- **0%**: All sources failed (should NOT happen with refresh)

### On-Chain API (60-100% Expected)

**Data Sources**:
1. **Blockchain.com Stats** (60% weight) - Usually available
2. **Latest Block** (40% weight) - Usually available

**Quality Scenarios**:
- **100%**: Both sources working
- **60%**: Stats only (latest block failed)
- **40%**: Latest block only (stats failed)
- **0%**: Both sources failed (should NOT happen with refresh)

---

## 🔍 What to Look For

### Success Indicators ✅

1. **Logs show refresh parameter detected**:
   ```
   (FORCING FRESH DATA)
   🔄 Refresh requested - bypassing cache
   ```

2. **Data quality improves from 0%**:
   - Sentiment: 0% → 40-100%
   - On-Chain: 0% → 60-100%

3. **Fresh data on every refresh**:
   - Timestamps update
   - Values change slightly
   - No stale cached data

4. **Cache works for normal requests**:
   - Instant response (< 1 second)
   - `cached: true` in response
   - Logs show "Cache hit"

5. **Consistent behavior across multiple polls**:
   - No degradation over time
   - No timeout errors
   - No cache contamination

### Failure Indicators ❌

1. **Data quality stays at 0%**:
   - Indicates APIs are failing
   - Check Vercel logs for API errors
   - May need to investigate API issues

2. **Same data on every refresh**:
   - Indicates refresh parameter not working
   - Check logs for "FORCING FRESH DATA"
   - May indicate code issue

3. **Timeout errors**:
   - Indicates API response time too slow
   - Check individual API timeouts
   - May need to increase timeouts

4. **Cache not working**:
   - Every request takes 5-10 seconds
   - No "Cache hit" in logs
   - May indicate cache storage issue

5. **Inconsistent data quality**:
   - Quality varies wildly (0%, 100%, 0%, 100%)
   - Indicates API reliability issues
   - May need fallback strategies

---

## 🐛 Debugging Tips

### If Sentiment stays at 0%:

1. **Check Fear & Greed Index**:
   ```bash
   curl https://api.alternative.me/fng/
   ```
   - Should return JSON with `value` field
   - If fails, Fear & Greed API is down

2. **Check LunarCrush**:
   - Verify `LUNARCRUSH_API_KEY` is set in Vercel
   - Check API key is valid
   - May hit rate limits

3. **Check Reddit**:
   - Public API, no key needed
   - May be rate limited
   - Check for 403/429 errors

### If On-Chain stays at 0%:

1. **Check Blockchain.com Stats**:
   ```bash
   curl https://blockchain.info/stats?format=json
   ```
   - Should return JSON with network stats
   - If fails, Blockchain.com API is down

2. **Check Latest Block**:
   ```bash
   curl https://blockchain.info/latestblock
   ```
   - Should return JSON with block info
   - If fails, Blockchain.com API is down

### If Refresh doesn't work:

1. **Check Vercel logs** for:
   - "FORCING FRESH DATA" message
   - "Refresh requested - bypassing cache" message
   - If missing, refresh parameter not detected

2. **Check browser network tab**:
   - Verify `?refresh=true` in URL
   - Check response has `cached: false`

3. **Check cache invalidation**:
   - Look for "Invalidating cache" message
   - Verify cache is cleared before fetch

---

## 📈 Success Metrics

### After Testing, You Should See:

1. **Sentiment Data Quality**: 40-100% (average 75%)
2. **On-Chain Data Quality**: 60-100% (average 80%)
3. **Cache Hit Rate**: > 80% for normal requests
4. **Refresh Success Rate**: 100% (all refreshes work)
5. **Response Time (Cached)**: < 1 second
6. **Response Time (Fresh)**: 5-10 seconds
7. **No Timeout Errors**: 0%
8. **No 0% Data Quality**: After first refresh

---

## 🎯 Testing Checklist

### Before Testing:
- [ ] Code deployed to Vercel
- [ ] Vercel logs accessible
- [ ] Browser cache cleared
- [ ] Network tab open in DevTools

### During Testing:
- [ ] Test 1: Initial request (cache miss) ✅
- [ ] Test 2: Second request (cache hit) ✅
- [ ] Test 3: Refresh request (force fresh) ✅
- [ ] Test 4: Multiple refresh polls (5-10 times) ✅
- [ ] Test 5: Mixed requests (cache + refresh) ✅
- [ ] Test 6: Different symbols (BTC, ETH, SOL) ✅

### After Testing:
- [ ] Sentiment data quality: 40-100% ✅
- [ ] On-Chain data quality: 60-100% ✅
- [ ] Refresh works consistently ✅
- [ ] Cache works for normal requests ✅
- [ ] No timeout errors ✅
- [ ] Logs show correct behavior ✅

---

## 📝 Test Results Template

Use this template to document your test results:

```markdown
## UCIE Refresh Testing Results

**Date**: [Date]
**Tester**: [Your Name]
**Environment**: Production / Staging

### Test 1: Initial Request
- Status: ✅ / ❌
- Sentiment Quality: [0-100]%
- On-Chain Quality: [0-100]%
- Response Time: [X] seconds
- Notes: [Any observations]

### Test 2: Second Request (Cache)
- Status: ✅ / ❌
- Response Time: [X] seconds
- Cached: Yes / No
- Notes: [Any observations]

### Test 3: Refresh Request
- Status: ✅ / ❌
- Sentiment Quality: [0-100]%
- On-Chain Quality: [0-100]%
- Response Time: [X] seconds
- Logs Show Refresh: Yes / No
- Notes: [Any observations]

### Test 4: Multiple Refresh Polls
- Number of Polls: [X]
- Success Rate: [X]%
- Average Sentiment Quality: [0-100]%
- Average On-Chain Quality: [0-100]%
- Any 0% Results: Yes / No
- Notes: [Any observations]

### Overall Assessment
- Fix Working: ✅ / ❌
- Data Quality Improved: ✅ / ❌
- Cache Working: ✅ / ❌
- Ready for Production: ✅ / ❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🚀 Quick Test Commands

### Test Individual APIs Directly:

```bash
# Test Sentiment API (no cache)
curl "https://news.arcane.group/api/ucie/sentiment/BTC"

# Test Sentiment API (force refresh)
curl "https://news.arcane.group/api/ucie/sentiment/BTC?refresh=true"

# Test On-Chain API (no cache)
curl "https://news.arcane.group/api/ucie/on-chain/BTC"

# Test On-Chain API (force refresh)
curl "https://news.arcane.group/api/ucie/on-chain/BTC?refresh=true"

# Test Preview-Data (force refresh)
curl "https://news.arcane.group/api/ucie/preview-data/BTC?refresh=true"
```

### Check Response Structure:

```bash
# Pretty print JSON response
curl "https://news.arcane.group/api/ucie/sentiment/BTC?refresh=true" | jq '.'

# Check data quality field
curl "https://news.arcane.group/api/ucie/sentiment/BTC?refresh=true" | jq '.data.dataQuality'

# Check cached field
curl "https://news.arcane.group/api/ucie/sentiment/BTC" | jq '.cached'
```

---

**Good luck with testing! 🎉**

**Expected Outcome**: Sentiment and On-Chain data quality should improve from 0% to 40-100% and 60-100% respectively when using the refresh button.

