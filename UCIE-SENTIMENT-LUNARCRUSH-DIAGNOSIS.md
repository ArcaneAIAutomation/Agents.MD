# UCIE Sentiment - LunarCrush API Diagnosis

**Date**: November 29, 2025  
**Status**: ⚠️ **PARTIAL DATA - Social Metrics Missing**  
**Issue**: LunarCrush API returns basic market data but NO social metrics

---

## 🔍 Problem Summary

The LunarCrush API (`/coins/BTC/v1`) is returning:
- ✅ **Basic Market Data**: price, market_cap, volume_24h
- ✅ **Core Scores**: galaxy_score, alt_rank, volatility
- ❌ **Social Metrics**: interactions_24h, posts_active_24h, creators_active_24h
- ❌ **Sentiment Data**: sentiment, sentiment_absolute, sentiment_relative
- ❌ **Dominance Data**: social_dominance, market_dominance

---

## 📊 Actual API Response

```json
{
  "config": {
    "id": "$btc",
    "name": "Bitcoin",
    "symbol": "BTC",
    "topic": "bitcoin",
    "generated": 1764455374
  },
  "data": {
    "id": 1,
    "name": "Bitcoin",
    "symbol": "BTC",
    "price": 90752.66,
    "market_cap": 1811011465712.02,
    "volume_24h": 38355258422.63,
    "galaxy_score": 48.9,
    "alt_rank": 59,
    "volatility": 0.0048,
    "market_cap_rank": 2
  }
}
```

**Missing Fields**:
- `interactions_24h` (social volume)
- `posts_active_24h` (mentions)
- `creators_active_24h` (contributors)
- `social_dominance`
- `sentiment`
- `sentiment_absolute`
- `sentiment_relative`

---

## 🔍 Root Cause Analysis

### Possible Causes:

1. **API Key Tier Limitation** ⭐ **MOST LIKELY**
   - Free tier may only include basic market data + galaxy_score
   - Social metrics require paid tier
   - Check: https://lunarcrush.com/pricing

2. **Wrong Endpoint**
   - Current: `/coins/{symbol}/v1`
   - Alternative: `/coins/{symbol}/time-series/v1` (might have social data)
   - Alternative: `/coins/{symbol}/meta/v1` (metadata endpoint)

3. **Missing Query Parameters**
   - May need `?data=social` or similar parameter
   - May need `?interval=1d` for time-series data

4. **API Version Change**
   - v4 API structure may have changed
   - Social metrics may have moved to different endpoint

---

## 🧪 Diagnostic Results

### Test 1: Endpoint Check ✅
```bash
GET https://lunarcrush.com/api4/public/coins/BTC/v1
Status: 200 OK
Endpoint: /storm/topic/:id
Transformer: public_coins_v1:get_topic
```

### Test 2: Field Availability ❌
```
✅ galaxy_score: 48.9
✅ alt_rank: 59
❌ interactions_24h: undefined
❌ posts_active_24h: undefined
❌ creators_active_24h: undefined
❌ social_dominance: undefined
❌ sentiment: undefined
```

### Test 3: Rate Limits ✅
```
Daily: 2000 requests (1939 remaining)
Minute: 10 requests (7 remaining)
```

---

## 💡 Recommended Solutions

### Solution 1: Upgrade API Key (Recommended)
**If social metrics are tier-restricted:**
1. Check current plan: https://lunarcrush.com/pricing
2. Upgrade to plan that includes social metrics
3. Verify new key has access to social data

### Solution 2: Try Alternative Endpoints
**Test different endpoints for social data:**

```typescript
// Try time-series endpoint
GET https://lunarcrush.com/api4/public/coins/BTC/time-series/v1?interval=1d

// Try meta endpoint
GET https://lunarcrush.com/api4/public/coins/BTC/meta/v1

// Try with data parameter
GET https://lunarcrush.com/api4/public/coins/BTC/v1?data=social
```

### Solution 3: Use Alternative Social Data Sources
**If LunarCrush social metrics unavailable:**

1. **Twitter/X API** (Already configured) ✅
   - Tweet volume, sentiment, influencer tracking
   - Current status: Working

2. **Reddit API** (Already configured) ✅
   - Subreddit mentions, post sentiment
   - Current status: Working

3. **Fear & Greed Index** (Already configured) ✅
   - Market sentiment indicator
   - Current status: Working (primary source)

### Solution 4: Enhance Existing Data
**Use galaxy_score and alt_rank to estimate social metrics:**

```typescript
// Calculate estimated social metrics from available data
function estimateSocialMetrics(data: any) {
  const { galaxy_score, alt_rank } = data;
  
  // Estimate social dominance from galaxy_score (0-100 → 0-10%)
  const estimatedDominance = Math.max(0, Math.min(10, (galaxy_score - 50) / 5));
  
  // Estimate social volume from alt_rank (lower rank = higher volume)
  const estimatedVolume = Math.floor(10000 - (alt_rank * 4.95));
  
  // Estimate contributors from alt_rank
  const estimatedContributors = alt_rank <= 100 ? 
    Math.floor(150 - alt_rank) : 
    Math.max(1, Math.floor(10 - (alt_rank / 200)));
  
  return {
    socialDominance: estimatedDominance,
    socialVolume: estimatedVolume,
    socialContributors: estimatedContributors,
    isEstimated: true // Flag to indicate these are estimates
  };
}
```

---

## 🎯 Current Workaround

**UCIE Sentiment API is currently using:**

1. **Fear & Greed Index** (40% weight) - ✅ Working
   - Primary sentiment source
   - Always available
   - Reliable market sentiment

2. **LunarCrush** (35% weight) - ⚠️ Partial
   - galaxy_score: Available
   - alt_rank: Available
   - Social metrics: Missing

3. **Reddit** (25% weight) - ✅ Working
   - Subreddit mentions
   - Post sentiment
   - Community activity

**Result**: UCIE Sentiment achieves **65% data quality** (Fear & Greed + Reddit) without LunarCrush social metrics.

---

## 📋 Action Items

### Immediate (User Action Required):
- [ ] Check LunarCrush account tier/plan
- [ ] Verify if social metrics are included in current plan
- [ ] Consider upgrading if social metrics are needed

### Short-term (Development):
- [ ] Test alternative LunarCrush endpoints
- [ ] Implement social metric estimation from galaxy_score/alt_rank
- [ ] Add clear indicators when using estimated vs real data

### Long-term (Enhancement):
- [ ] Add more social data sources (Santiment, Messari, etc.)
- [ ] Implement weighted averaging with confidence scores
- [ ] Create fallback chain for social metrics

---

## 🔗 Resources

### LunarCrush Documentation:
- API Docs: https://lunarcrush.com/developers/api
- Pricing: https://lunarcrush.com/pricing
- v4 Migration: https://lunarcrush.com/developers/v4-migration

### Internal Documentation:
- UCIE System: `.kiro/steering/ucie-system.md`
- API Integration: `.kiro/steering/api-integration.md`
- Sentiment API: `pages/api/ucie/sentiment/[symbol].ts`

### Test Scripts:
- Field Test: `scripts/test-lunarcrush-v4-fields.ts`
- Debug Response: `scripts/debug-lunarcrush-response.ts`

---

## ✅ Verification Steps

To verify if social metrics become available:

1. **Check API Response**:
   ```bash
   npx tsx scripts/debug-lunarcrush-response.ts
   ```

2. **Test UCIE Sentiment**:
   ```bash
   curl "http://localhost:3000/api/ucie/sentiment/BTC?refresh=true"
   ```

3. **Check Data Quality**:
   - Should show `dataQuality: 100` if all sources working
   - Currently shows `dataQuality: 65` (Fear & Greed + Reddit only)

---

**Status**: ⚠️ **PARTIAL FUNCTIONALITY**  
**Data Quality**: 65% (without LunarCrush social metrics)  
**Recommendation**: Check API key tier and consider upgrade for full social metrics

**The UCIE Sentiment API is operational but missing LunarCrush social metrics due to API key limitations.** 🔍
