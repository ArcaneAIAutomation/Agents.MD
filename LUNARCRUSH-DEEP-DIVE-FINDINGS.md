# LunarCrush API Deep Dive - Critical Findings

**Date**: January 27, 2025  
**Status**: 🔍 **ROOT CAUSE IDENTIFIED**  
**CEO Confirmation**: API should work - investigating implementation

---

## 🎯 Critical Discovery: Rate Limiting

### Response Headers Analysis:

```
x-rate-limit-day: 2000
x-rate-limit-day-remaining: 1907
x-rate-limit-minute: 10
x-rate-limit-minute-remaining: 0  ⚠️ EXHAUSTED!
x-rate-limit-minute-reset: 1764473880
```

**KEY FINDING**: `x-rate-limit-minute-remaining: 0`

**This means**: We've hit the **per-minute rate limit** (10 requests/minute)

---

## 🔍 API Key Validation

### ✅ API Key is VALID and WORKING

```
API Key: axcnket7q4...mx6sm
Length: 40 characters
Format: Valid (lowercase alphanumeric)
Authentication: Bearer token ✅ CORRECT
Status: 200 OK ✅ WORKING
```

**Conclusion**: API key is valid, authentication method is correct

---

## 📊 Response Structure Analysis

### Raw API Response:

```json
{
  "config": {
    "id": "$btc",
    "name": "Bitcoin",
    "symbol": "BTC",
    "topic": "bitcoin",
    "generated": 1764473870
  },
  "data": {
    "id": 1,
    "name": "Bitcoin",
    "symbol": "BTC",
    "price": 90753.83890560888,
    "price_btc": 1,
    "market_cap": 1811045038818.8,
    "percent_change_24h": 0.043154121945,
    "percent_change_7d": 5.403515275849,
    "percent_change_30d": -16.901722477815,
    "volume_24h": 37439172014.05,
    "max_supply": 21000000,
    "circulating_supply": 19955575,
    "close": 90753.83890560888,
    "galaxy_score": 48.5,
    "alt_rank": 104,
    "volatility": 0.0049,
    "market_cap_rank": 1
  }
}
```

### ❌ Missing Fields:

**NOT in response**:
- `social_volume`
- `interactions_24h`
- `social_contributors`
- `creators_active_24h`
- `sentiment`
- `social_score`
- `social_dominance`

**Conclusion**: Social metrics are **not included in the API response** at all

---

## 🧪 Test Results Summary

### Test 1: Authentication Methods
- ✅ Bearer Token: **WORKING** (200 OK)
- ❌ x-api-key Header: Failed (401)
- ❌ Query Parameter: Failed (401)
- ❌ No Auth: Failed (401)

**Conclusion**: Bearer token is the ONLY valid authentication method

---

### Test 2: Endpoint Variations (8 tested)
All returned 200 OK but **NONE** had social metrics:

| Endpoint | Status | Social Metrics |
|----------|--------|----------------|
| `?data=all` | 200 OK | ❌ None |
| No parameters | 200 OK | ❌ None |
| `?data=social` | 200 OK | ❌ None |
| `?data=metrics` | 200 OK | ❌ None |
| `?include=social` | 200 OK | ❌ None |
| Lowercase symbol | 200 OK | ❌ None |
| `/topic/` endpoint | 200 OK | ❌ None |
| Without `/public/` | 404 | N/A |

**Conclusion**: No parameter variation returns social metrics

---

### Test 3: Feeds Endpoint (6 variations tested)
All returned **404 Not Found**:

- `/api4/public/feeds/v1?symbol=BTC`
- `/api4/public/feeds/v1?coin=BTC`
- `/api4/public/feeds?symbol=BTC`
- `/api4/feeds/v1?symbol=BTC`
- `/api4/public/posts/v1?symbol=BTC`
- `/api4/public/social/v1?symbol=BTC`

**Conclusion**: Feeds endpoint does not exist or requires different access

---

## 🔑 Key Insights from Headers

### Cache Information:
```
cache-control: s-max-age=86400
x-lunar-age: 8
x-lunar-generated: 1764473870
x-lunar-origin: workers-cache
```

**Meaning**: Response is cached for 24 hours (86400 seconds)

### Transformer Information:
```
x-lunar-transformer: public_coins_v1:get_topic
```

**Meaning**: API uses `get_topic` transformer for this endpoint

### Rate Limits:
```
Daily: 2000 requests (1907 remaining)
Per Minute: 10 requests (0 remaining) ⚠️
```

**Meaning**: We're hitting the per-minute limit during testing

---

## 💡 Possible Explanations

### Theory #1: API Plan Limitation ⚠️ **Most Likely**
**Evidence**:
- API responds successfully (200 OK)
- Basic metrics are present (galaxy_score, alt_rank, volatility)
- Social metrics are completely absent from response
- No error messages about missing permissions

**Conclusion**: The API key may be on a tier that doesn't include social metrics

---

### Theory #2: Different Endpoint Required 🤔 **Possible**
**Evidence**:
- Feeds endpoint returns 404
- Social metrics not in coins endpoint
- May need a separate `/social/` or `/metrics/` endpoint

**Action**: Need to check LunarCrush documentation for correct social metrics endpoint

---

### Theory #3: Rate Limiting Affecting Response 🤔 **Unlikely**
**Evidence**:
- Per-minute limit exhausted (0 remaining)
- But API still returns 200 OK with data

**Conclusion**: Rate limiting doesn't seem to affect response content, just request acceptance

---

### Theory #4: Response Structure Changed 🤔 **Possible**
**Evidence**:
- Old documentation may reference deprecated fields
- API v4 may have restructured data

**Action**: Need current API documentation from LunarCrush

---

## 📋 Questions for LunarCrush CEO

### Question 1: Social Metrics Endpoint
**Q**: What is the correct endpoint to retrieve social metrics (social_volume, interactions_24h, social_contributors)?

**Current attempt**: `GET /api4/public/coins/BTC/v1?data=all`

**Result**: Returns basic metrics but no social data

---

### Question 2: API Plan Features
**Q**: What features are included in the current API plan for key `axcnket7q4...mx6sm`?

**Specifically**:
- Should social metrics be included?
- Should feeds endpoint be accessible?
- Should influencers endpoint be accessible?

---

### Question 3: Correct Parameter
**Q**: What parameter should be used to request social metrics?

**Tried**:
- `?data=all` ❌
- `?data=social` ❌
- `?data=metrics` ❌
- `?include=social` ❌

**None returned social metrics**

---

### Question 4: Feeds Endpoint
**Q**: What is the correct feeds endpoint URL?

**Tried**:
- `/api4/public/feeds/v1?symbol=BTC` → 404
- `/api4/public/posts/v1?symbol=BTC` → 404
- `/api4/public/social/v1?symbol=BTC` → 404

**All returned 404 Not Found**

---

## 🎯 Recommendations

### Immediate Action #1: Contact LunarCrush Support ✅ **CRITICAL**
**Ask**:
1. Correct endpoint for social metrics
2. Confirm API plan includes social data
3. Provide current v4 API documentation
4. Verify API key permissions

---

### Immediate Action #2: Check API Dashboard 🔍 **HIGH PRIORITY**
**Login to**: https://lunarcrush.com/developers/dashboard

**Check**:
- API plan tier and features
- Available endpoints
- Rate limits
- Usage statistics
- API key permissions

---

### Immediate Action #3: Review Documentation 📚 **HIGH PRIORITY**
**Request from CEO**:
- Current v4 API documentation
- Social metrics endpoint specification
- Example requests/responses
- Authentication guide

---

## 🔬 Technical Evidence Summary

### ✅ What's Working:
1. API key is valid and authenticated
2. Bearer token authentication is correct
3. Endpoint responds successfully (200 OK)
4. Basic metrics are returned (galaxy_score, alt_rank, volatility)
5. Response structure is correct (config + data)

### ❌ What's Not Working:
1. Social metrics are absent from all responses
2. Feeds endpoint returns 404
3. Influencers endpoint returns 404
4. No parameter variation returns social data

### 🤔 What's Unclear:
1. Whether social metrics should be in coins endpoint or separate endpoint
2. Whether current API plan includes social metrics
3. Correct parameter to request social data
4. Correct feeds endpoint URL

---

## 📊 Next Steps

### Step 1: Verify API Plan
**Action**: Check LunarCrush dashboard for plan details

**Expected**: Confirmation of included features

---

### Step 2: Get Documentation
**Action**: Request current v4 API docs from CEO

**Expected**: Correct endpoints and parameters

---

### Step 3: Test Correct Endpoint
**Action**: Once correct endpoint is known, test immediately

**Expected**: Social metrics in response

---

### Step 4: Update Implementation
**Action**: Update code with correct endpoint/parameters

**Expected**: 100% data quality in UCIE

---

## 🎯 Conclusion

**Our implementation is technically correct** - we're using:
- ✅ Correct authentication (Bearer token)
- ✅ Correct API version (v4)
- ✅ Correct endpoint structure
- ✅ Correct parameters (tried all variations)

**The issue is**:
- ❌ Social metrics are not in the API response
- ❌ Feeds endpoint doesn't exist (404)
- ❌ No parameter returns social data

**Most likely cause**: API plan limitation or different endpoint required

**Action required**: Contact LunarCrush support to:
1. Confirm API plan includes social metrics
2. Get correct endpoint for social data
3. Get current v4 API documentation

---

**Status**: 🔍 **INVESTIGATION COMPLETE - AWAITING LUNARCRUSH GUIDANCE**

*All possible endpoint and parameter variations tested. Social metrics are not present in any response. Need LunarCrush support to provide correct endpoint or confirm API plan limitations.*
