# LunarCrush Zero Data Diagnostic Guide

**Date**: November 29, 2025  
**Issue**: LunarCrush metrics showing 0 despite field name fixes  
**Status**: 🔍 INVESTIGATING

---

## 🎯 What We Fixed

1. ✅ **Corrected field names** in sentiment API endpoint
2. ✅ **Corrected field names** in preview-data context builder
3. ✅ **Added comprehensive logging** to see actual API responses
4. ✅ **Added zero-detection warning** to identify the issue

---

## 🔍 Diagnostic Steps

### Step 1: Check Vercel Logs After Refresh

After clicking "Refresh Data" in UCIE, check Vercel logs for:

#### **Success Case** (What we want to see):
```
📊 Fetching LunarCrush data for BTC...
✅ LunarCrush data (authenticated): {
  galaxy_score: 72.5,
  social_volume: 125000,
  social_dominance: 45.2,
  social_contributors: 8500,
  num_posts: 45000,
  interactions_24h: 2500000,
  sentiment: 3.8,
  alt_rank: 1
}
```

#### **Zero Data Case** (Current issue):
```
📊 Fetching LunarCrush data for BTC...
✅ LunarCrush data (authenticated): {
  galaxy_score: 49.7,
  social_volume: 0,
  social_dominance: 0,
  social_contributors: 0,
  num_posts: 0,
  interactions_24h: 0,
  sentiment: 3,
  alt_rank: 245
}
⚠️ LunarCrush returned all zeros for BTC!
   This might indicate:
   1. API rate limit reached
   2. Symbol not found in LunarCrush database
   3. API key has insufficient permissions
   4. API response structure changed
```

#### **API Error Case**:
```
❌ LunarCrush API returned 401
❌ LunarCrush public API also returned 401
```

---

## 🔬 Possible Root Causes

### Cause 1: API Rate Limit
**Symptoms**:
- Galaxy Score works (49.7)
- AltRank works (#245)
- All social metrics are 0

**Explanation**: LunarCrush free tier may have rate limits that return partial data

**Solution**: 
- Wait 1 hour and try again
- Upgrade to paid LunarCrush plan
- Check LunarCrush dashboard for rate limit status

### Cause 2: API Key Permissions
**Symptoms**:
- Some fields work (galaxy_score, alt_rank)
- Social metrics return 0

**Explanation**: API key may not have access to social metrics

**Solution**:
- Check LunarCrush API key permissions
- Verify API key tier (free vs paid)
- Generate new API key with full permissions

### Cause 3: Symbol Not Found
**Symptoms**:
- All metrics are 0 or null
- API returns 404 or empty data

**Explanation**: Symbol might not be in LunarCrush database

**Solution**:
- Verify symbol format (BTC vs BITCOIN)
- Check LunarCrush website for supported symbols
- Try different symbol format

### Cause 4: API Response Structure Changed
**Symptoms**:
- API returns 200 OK
- Data structure is different than expected

**Explanation**: LunarCrush may have updated their API

**Solution**:
- Check full API response in logs
- Compare with LunarCrush API documentation
- Update field mappings if needed

### Cause 5: Cached Zero Data
**Symptoms**:
- Zeros persist even after refresh
- Logs show fresh API call but zeros

**Explanation**: Database cache may have old zero data

**Solution**:
- Clear cache manually in Supabase
- Wait for cache TTL to expire (3 minutes)
- Use `?refresh=true` parameter

---

## 🧪 Testing Commands

### Test 1: Direct API Call (No Cache)
```bash
# Force fresh data
curl "https://news.arcane.group/api/ucie/sentiment/BTC?refresh=true"
```

**Check response for**:
```json
{
  "success": true,
  "data": {
    "lunarCrush": {
      "galaxyScore": 49.7,
      "socialVolume": 0,  // ← Should NOT be 0
      "socialDominance": 0,  // ← Should NOT be 0
      "socialContributors": 0,  // ← Should NOT be 0
      "numPosts": 0,  // ← Should NOT be 0
      "interactions24h": 0  // ← Should NOT be 0
    }
  }
}
```

### Test 2: Check Vercel Environment Variables
```bash
# In Vercel dashboard, verify:
LUNARCRUSH_API_KEY=<your-key>
```

**Verify**:
- Key is set
- Key is not expired
- Key has correct permissions

### Test 3: Test LunarCrush API Directly
```bash
# Test with your API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://lunarcrush.com/api4/public/coins/BTC/v1" | jq '.data | {
    galaxy_score,
    social_volume,
    social_dominance,
    social_contributors,
    num_posts,
    interactions_24h
  }'
```

**Expected output**:
```json
{
  "galaxy_score": 72.5,
  "social_volume": 125000,
  "social_dominance": 45.2,
  "social_contributors": 8500,
  "num_posts": 45000,
  "interactions_24h": 2500000
}
```

**If you get zeros here**, the issue is with LunarCrush API, not our code.

---

## 🔧 Fixes Based on Root Cause

### Fix 1: Rate Limit Issue
```typescript
// Add rate limit detection
if (response.status === 429) {
  console.warn('⚠️ LunarCrush rate limit reached');
  // Use cached data or show warning
}
```

### Fix 2: API Key Permissions
```typescript
// Add permission check
if (data.social_volume === 0 && data.galaxy_score > 0) {
  console.warn('⚠️ API key may lack social metrics permissions');
  // Show warning to user
}
```

### Fix 3: Fallback to Public API
```typescript
// If authenticated API returns zeros, try public
if (hasZeros && apiKey) {
  console.log('🔄 Trying public API as fallback...');
  const publicData = await fetchPublicLunarCrush(symbol);
  if (publicData && !hasZeros(publicData)) {
    return publicData;
  }
}
```

### Fix 4: Cache Invalidation
```typescript
// Force cache clear if zeros detected
if (hasZeros) {
  console.log('🗑️ Clearing cache due to zero data...');
  await invalidateCache(symbol, 'sentiment');
}
```

---

## 📊 Expected vs Actual Data

### Expected (Healthy API Response)
```
Galaxy Score: 72.5/100 ✅
Social Volume: 125,000 ✅
Social Dominance: 45.2% ✅
Posts/Mentions: 45,000 ✅
Interactions: 2.5M ✅
Contributors: 8,500 ✅
```

### Actual (Current Issue)
```
Galaxy Score: 49.7/100 ✅ (Working)
Social Volume: 0 ❌ (Zero)
Social Dominance: 0.00% ❌ (Zero)
Posts/Mentions: 0 ❌ (Zero)
Interactions: 0 ❌ (Zero)
Contributors: 0 ❌ (Zero)
```

**Pattern**: Core metrics work (galaxy_score, alt_rank), but social metrics are zero.

---

## 🎯 Next Steps

### Immediate Actions:
1. ✅ Deploy latest code with corrected field names
2. ⏳ Click "Refresh Data" in UCIE
3. ⏳ Check Vercel logs for LunarCrush API response
4. ⏳ Look for zero-detection warning
5. ⏳ Identify which root cause applies

### Based on Logs:

#### If logs show "API rate limit reached":
- Wait 1 hour
- Consider upgrading LunarCrush plan
- Implement rate limit handling

#### If logs show "API key has insufficient permissions":
- Check LunarCrush dashboard
- Verify API key tier
- Generate new API key with full permissions

#### If logs show actual API response with zeros:
- Test LunarCrush API directly (outside our code)
- Contact LunarCrush support
- Consider alternative social metrics provider

#### If logs show different response structure:
- Update field mappings
- Check LunarCrush API documentation
- Adjust code to match new structure

---

## 📝 Diagnostic Checklist

After deploying and testing:

- [ ] Clicked "Refresh Data" in UCIE
- [ ] Checked Vercel logs for LunarCrush API call
- [ ] Found "✅ LunarCrush data (authenticated)" log
- [ ] Checked if social_volume is 0 or has value
- [ ] Checked if zero-detection warning appeared
- [ ] Tested direct API call to LunarCrush
- [ ] Verified API key is set in Vercel
- [ ] Checked API key permissions in LunarCrush dashboard
- [ ] Waited for cache to expire (3 minutes)
- [ ] Tried multiple refresh attempts

---

## 🚨 Critical Questions to Answer

1. **Does the LunarCrush API return zeros when called directly?**
   - If YES → Issue is with LunarCrush API (rate limit, permissions, etc.)
   - If NO → Issue is with our code (field mapping, caching, etc.)

2. **Do the Vercel logs show the zero-detection warning?**
   - If YES → API is returning zeros, not a field mapping issue
   - If NO → Field mapping might still be wrong

3. **Does galaxy_score have a value but social_volume is 0?**
   - If YES → Partial data suggests rate limit or permissions issue
   - If NO → Complete failure suggests API key or network issue

4. **Does the issue persist after waiting 1 hour?**
   - If YES → Not a rate limit issue
   - If NO → Definitely a rate limit issue

---

## 📞 Support Resources

- **LunarCrush API Docs**: https://lunarcrush.com/developers/api
- **LunarCrush Dashboard**: https://lunarcrush.com/dashboard
- **LunarCrush Support**: support@lunarcrush.com
- **API Status**: Check LunarCrush Twitter for outages

---

**Status**: 🔍 Awaiting Vercel logs to identify root cause  
**Next**: Check logs after refresh and report findings

