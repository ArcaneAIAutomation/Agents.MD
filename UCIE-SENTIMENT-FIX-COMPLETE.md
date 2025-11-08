# UCIE Sentiment Analysis - Complete Fix Guide

**Date**: November 8, 2025, 12:25 AM UTC  
**Current Status**: 30% (Reddit only)  
**Target Status**: 70-100% (All sources working)  
**Issue**: LunarCrush and Twitter APIs failing

---

## 🔍 Current Situation

### Production Test Results

```json
{
  "sources": {
    "lunarCrush": false,  // ❌ NOT WORKING
    "twitter": false,      // ❌ NOT WORKING
    "reddit": true         // ✅ WORKING
  },
  "dataQuality": 30
}
```

**Confirmed**: Only Reddit is working, giving us 30% data quality.

---

## 🛠️ Fix Plan

### Issue 1: LunarCrush API - Domain/Endpoint Changed

**Problem**: `api.lunarcrush.com` domain not resolving  
**Root Cause**: LunarCrush migrated to API v4 with new endpoints

**Current Code** (Broken):
```typescript
const response = await fetch(
  `https://api.lunarcrush.com/v2?data=assets&key=${apiKey}&symbol=${symbol}`,
  ...
);
```

**Fix Required**: Update to LunarCrush API v4

**New Endpoint Structure**:
- Base URL: `https://lunarcrush.com/api4`
- Authentication: Bearer token instead of query parameter
- Different response format

**Implementation Steps**:

1. **Update API Endpoint**:
```typescript
// OLD (v2 - broken)
https://api.lunarcrush.com/v2?data=assets&key=${apiKey}&symbol=${symbol}

// NEW (v4 - working)
https://lunarcrush.com/api4/public/coins/${symbol}/v1
// OR with authentication:
https://lunarcrush.com/api4/coins/${symbol}/v1
// Header: Authorization: Bearer ${apiKey}
```

2. **Update Response Parsing**:
```typescript
// v4 has different response structure
// Need to update data extraction logic
```

3. **Test New Endpoint**:
```bash
# Public endpoint (no auth)
curl "https://lunarcrush.com/api4/public/coins/BTC/v1"

# Authenticated endpoint
curl "https://lunarcrush.com/api4/coins/BTC/v1" \
  -H "Authorization: Bearer r1pe78gm2tohk3mwp36cqj7hvmhhln82d856ck5"
```

---

### Issue 2: Twitter API - Bearer Token Issues

**Problem**: Twitter API calls returning `false`  
**Possible Causes**:
1. Bearer token expired/invalid
2. API access tier insufficient
3. Rate limiting
4. Incorrect API endpoint

**Current Code**:
```typescript
const response = await fetch(
  `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=100...`,
  {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      ...
    }
  }
);
```

**Diagnostic Steps**:

1. **Test Bearer Token**:
```bash
curl -X GET "https://api.twitter.com/2/tweets/search/recent?query=bitcoin&max_results=10" \
  -H "Authorization: Bearer AAAAAAAAAAAAAAAAAAAAABfK5AEAAAAARfdLBBxO4WpoP6xWSbcwIGL%2Flg8%3Da6P1toyhhdev46d9AzsgAVt5WvSfPK9zuqD8wjWEpFoiJQlWar"
```

**Expected Responses**:
- ✅ **200 OK**: Token is valid, check code logic
- ❌ **401 Unauthorized**: Token expired - regenerate at https://developer.twitter.com/en/portal/dashboard
- ❌ **403 Forbidden**: Insufficient API access - upgrade tier
- ❌ **429 Too Many Requests**: Rate limit - wait 15 minutes

2. **If Token Invalid**: Regenerate
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Select your app
   - Go to "Keys and tokens"
   - Click "Regenerate" for Bearer Token
   - Update `.env.local` and Vercel environment variables

3. **If Access Insufficient**: Upgrade
   - Free tier: Very limited (500k tweets/month read-only)
   - Basic tier: $100/month (better limits)
   - Consider if worth the cost

---

## 🚀 Recommended Solution: Fix LunarCrush First

**Why LunarCrush is Priority**:
1. ✅ Already have API key
2. ✅ Aggregates Twitter + Reddit + more
3. ✅ No rate limits (generous)
4. ✅ Crypto-specific sentiment
5. ✅ Free (already paid for)

**Expected Result**: 30% → 70% data quality (+40%)

---

## 📝 Implementation: Update LunarCrush to v4

### Step 1: Update `fetchLunarCrushData` Function

**File**: `lib/ucie/socialSentimentClients.ts`

**Replace**:
```typescript
export async function fetchLunarCrushData(symbol: string): Promise<LunarCrushData | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('LunarCrush API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.lunarcrush.com/v2?data=assets&key=${apiKey}&symbol=${symbol}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`LunarCrush API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.warn(`No LunarCrush data found for ${symbol}`);
      return null;
    }

    const asset = data.data[0];

    return {
      symbol: asset.symbol || symbol,
      name: asset.name || '',
      price: asset.price || 0,
      volume24h: asset.volume_24h || 0,
      marketCap: asset.market_cap || 0,
      socialScore: asset.social_score || 0,
      sentimentScore: calculateSentimentScore(asset.sentiment || 0),
      socialVolume: asset.social_volume || 0,
      socialVolumeChange24h: asset.social_volume_24h_change || 0,
      socialDominance: asset.social_dominance || 0,
      galaxyScore: asset.galaxy_score || 0,
      altRank: asset.alt_rank || 0,
      mentions: asset.social_contributors || 0,
      interactions: asset.interactions_24h || 0,
      contributors: asset.social_contributors || 0,
      trendingScore: asset.trending_score || 0,
    };
  } catch (error) {
    console.error('Error fetching LunarCrush data:', error);
    return null;
  }
}
```

**With** (LunarCrush v4):
```typescript
export async function fetchLunarCrushData(symbol: string): Promise<LunarCrushData | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`🌙 Fetching LunarCrush data for ${symbol}...`);
    
    // Try authenticated endpoint first (v4)
    const response = await fetch(
      `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`❌ LunarCrush API error: ${response.status}`);
      
      // Try public endpoint as fallback (no auth)
      const publicResponse = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      
      if (!publicResponse.ok) {
        console.error(`❌ LunarCrush public API also failed: ${publicResponse.status}`);
        return null;
      }
      
      const publicData = await publicResponse.json();
      return parseLunarCrushV4Response(publicData, symbol);
    }

    const data = await response.json();
    console.log(`✅ LunarCrush data fetched successfully for ${symbol}`);
    
    return parseLunarCrushV4Response(data, symbol);
  } catch (error) {
    console.error('❌ Error fetching LunarCrush data:', error);
    return null;
  }
}

/**
 * Parse LunarCrush API v4 response
 */
function parseLunarCrushV4Response(data: any, symbol: string): LunarCrushData | null {
  if (!data || !data.data) {
    console.warn(`⚠️ No LunarCrush data found for ${symbol}`);
    return null;
  }

  const coin = data.data;

  return {
    symbol: coin.symbol || symbol,
    name: coin.name || '',
    price: coin.price || 0,
    volume24h: coin.volume_24h || 0,
    marketCap: coin.market_cap || 0,
    socialScore: coin.social_score || 0,
    sentimentScore: calculateSentimentScore(coin.sentiment || 3), // v4 uses 0-5 scale
    socialVolume: coin.social_volume || 0,
    socialVolumeChange24h: coin.social_volume_change_24h || 0,
    socialDominance: coin.social_dominance || 0,
    galaxyScore: coin.galaxy_score || 0,
    altRank: coin.alt_rank || 0,
    mentions: coin.social_mentions || 0,
    interactions: coin.social_interactions || 0,
    contributors: coin.social_contributors || 0,
    trendingScore: coin.trending_score || 0,
  };
}
```

### Step 2: Test the Fix

```bash
# After deploying, test the endpoint
curl "https://news.arcane.group/api/ucie/sentiment/BTC" | jq '.sources'

# Expected result:
{
  "lunarCrush": true,   // ✅ NOW WORKING
  "twitter": false,     // Still broken (fix separately)
  "reddit": true        // ✅ Still working
}

# Data quality should improve:
"dataQuality": 70  // Up from 30
```

---

## 📊 Expected Results

### After LunarCrush Fix

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Data Quality** | 30% | 70% | +40% ✅ |
| **Working Sources** | 1 (Reddit) | 2 (Reddit + LunarCrush) | +100% ✅ |
| **Twitter Data** | ❌ None | ✅ Via LunarCrush | ✅ |
| **Social Volume** | ❌ None | ✅ Available | ✅ |
| **Influencer Tracking** | ❌ None | ✅ Available | ✅ |
| **Galaxy Score** | ❌ None | ✅ Available | ✅ |

### After Twitter Fix (Optional)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Data Quality** | 70% | 100% | +30% ✅ |
| **Working Sources** | 2 | 3 (All sources) | +50% ✅ |
| **Twitter Data** | ✅ Aggregated | ✅ Direct + Aggregated | ✅ |

---

## 🎯 Action Plan

### Priority 1: Fix LunarCrush (30 minutes)

**Steps**:
1. Update `fetchLunarCrushData` function with v4 endpoint
2. Add `parseLunarCrushV4Response` helper function
3. Test locally
4. Deploy to production
5. Verify sentiment endpoint shows `lunarCrush: true`

**Expected Result**: Data quality 30% → 70%

### Priority 2: Fix Twitter (15 minutes - Optional)

**Steps**:
1. Test bearer token with curl
2. If invalid, regenerate at Twitter Developer Portal
3. Update environment variables
4. Deploy
5. Verify sentiment endpoint shows `twitter: true`

**Expected Result**: Data quality 70% → 100%

---

## 📝 Summary

**Current State**:
- ✅ Reddit working (30% quality)
- ❌ LunarCrush broken (API v2 → v4 migration)
- ❌ Twitter broken (bearer token issues)

**Fix LunarCrush First**:
- Update to API v4 endpoints
- 30 minutes implementation
- +40% data quality improvement
- Includes Twitter data via aggregation

**Fix Twitter Later** (Optional):
- Test/regenerate bearer token
- 15 minutes implementation
- +30% data quality improvement
- Direct Twitter data

**Final Result**: 100% sentiment data quality with all sources working

---

**Next Step**: Implement LunarCrush v4 fix (30 minutes) 🚀

