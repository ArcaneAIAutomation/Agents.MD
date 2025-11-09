# Preview Data Error Analysis

**Date**: January 27, 2025  
**Status**: 🔍 INVESTIGATING  
**Issue**: "Network error failed to fetch data preview"

---

## 🚨 Current Situation

### User Report
- Vercel logs show APIs are working
- Frontend shows "Error Loading Data" with "Network error failed to fetch data preview"
- Retry button available

### Screenshot Analysis
The error modal shows:
```
Data Collection Preview
Error Loading Data
Network error failed to fetch data preview
[Retry button]
```

Console errors visible:
- Multiple framework-related errors
- Possible CORS or network issues
- Frontend unable to fetch from `/api/ucie/preview-data/[symbol]`

---

## 🔍 Root Cause Analysis

### Possible Causes

#### 1. Quality Score Fix Side Effects ✅ FIXED
**Status**: Already fixed in commit `ee9b736`
- The quality score type mismatch was causing database writes to fail
- This would prevent data from being cached
- Preview-data endpoint relies on cached data

**Fix Applied**:
- Added `Math.round()` to convert quality scores to integers
- All database writes should now succeed

#### 2. Data Formatter Errors ✅ FIXED
**Status**: Fixed in commit `8a18fcc`
- Preview-data endpoint uses `require()` for dataFormatter
- If formatter throws errors, entire endpoint fails

**Fix Applied**:
- Wrapped all formatter calls in try-catch blocks
- Added fallback formatting if formatters fail
- Improved error logging

#### 3. Frontend Timeout Issues ⏳ INVESTIGATING
**Possible Issue**: Frontend timeout before API completes
- Preview-data endpoint can take 10-30 seconds
- Frontend might have shorter timeout
- Network issues could cause premature timeout

**Evidence**:
- "Network error" suggests fetch() failed
- Could be timeout, CORS, or connection issue

#### 4. CORS Configuration ⏳ INVESTIGATING
**Possible Issue**: CORS headers not set correctly
- API might be rejecting frontend requests
- Missing or incorrect CORS headers

**Check**:
- Verify CORS headers in API response
- Check if frontend origin is allowed

#### 5. API Endpoint Errors ⏳ INVESTIGATING
**Possible Issue**: Preview-data endpoint throwing unhandled errors
- Database connection issues
- OpenAI API failures
- Data collection failures

**Check Vercel Logs For**:
- 500 errors from `/api/ucie/preview-data/[symbol]`
- Database connection errors
- OpenAI API errors
- Timeout errors

---

## 🧪 Debugging Steps

### Step 1: Check Vercel Function Logs
```bash
# Look for errors in preview-data endpoint
# Filter by: /api/ucie/preview-data
# Look for: 500 errors, timeouts, database errors
```

**What to Look For**:
- ❌ Database connection errors
- ❌ OpenAI API errors
- ❌ Timeout errors (> 30 seconds)
- ❌ Data formatter errors
- ❌ Cache read/write errors

### Step 2: Test API Directly
```bash
# Test the endpoint directly
curl https://news.arcane.group/api/ucie/preview-data/BTC

# Expected: 200 OK with preview data
# If error: Check response body for error message
```

### Step 3: Check Frontend Network Tab
```javascript
// In browser console, check:
// 1. Network tab for /api/ucie/preview-data/BTC
// 2. Status code (200, 500, timeout?)
// 3. Response body (error message?)
// 4. Request headers (CORS?)
// 5. Timing (how long did it take?)
```

### Step 4: Check Database Cache
```bash
# Verify data is being cached
npx tsx scripts/verify-database-storage.ts

# Expected: Data for BTC in ucie_analysis_cache table
# If missing: Database writes are failing
```

---

## 🛠️ Fixes Applied

### Fix #1: Quality Score Type Mismatch ✅
**Commit**: `ee9b736`
**Files**: `lib/ucie/cacheUtils.ts`, `lib/ucie/caesarStorage.ts`
**Impact**: All database writes now succeed

### Fix #2: Data Formatter Error Handling ✅
**Commit**: `8a18fcc`
**Files**: `pages/api/ucie/preview-data/[symbol].ts`
**Impact**: Formatter errors won't crash endpoint

---

## 🎯 Next Steps

### Immediate Actions

1. **Check Vercel Logs** (PRIORITY 1)
   - Look for errors in `/api/ucie/preview-data/BTC`
   - Check for 500 errors, timeouts, database errors
   - Verify quality score fix is working

2. **Test API Directly** (PRIORITY 2)
   - `curl https://news.arcane.group/api/ucie/preview-data/BTC`
   - Check response status and body
   - Verify data is being returned

3. **Check Frontend Code** (PRIORITY 3)
   - Look for timeout configuration
   - Check fetch() error handling
   - Verify CORS configuration

4. **Verify Database Cache** (PRIORITY 4)
   - Run `npx tsx scripts/verify-database-storage.ts`
   - Check if data is being cached
   - Verify quality scores are integers

### Potential Additional Fixes

#### If API is Timing Out:
```typescript
// Increase frontend timeout
const response = await fetch('/api/ucie/preview-data/BTC', {
  signal: AbortSignal.timeout(60000) // 60 seconds
});
```

#### If CORS is the Issue:
```typescript
// Add CORS headers to API response
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

#### If Database is Slow:
```typescript
// Increase database connection timeout
const pool = new Pool({
  connectionTimeoutMillis: 30000, // 30 seconds
  query_timeout: 30000
});
```

---

## 📊 Expected Behavior

### Successful Flow
1. User clicks "Collect Data" for BTC
2. Frontend calls `/api/ucie/preview-data/BTC`
3. API collects data from 5 sources (10-30 seconds)
4. API stores data in database with integer quality scores
5. API generates OpenAI summary
6. API returns preview data to frontend
7. Frontend displays preview modal with summary

### Current Flow (Broken)
1. User clicks "Collect Data" for BTC
2. Frontend calls `/api/ucie/preview-data/BTC`
3. ❌ **FAILURE POINT** - Network error
4. Frontend shows "Error Loading Data" modal

---

## 🔍 Diagnostic Checklist

- [ ] Check Vercel logs for `/api/ucie/preview-data/BTC` errors
- [ ] Test API endpoint directly with curl
- [ ] Verify database cache is working
- [ ] Check frontend network tab for request details
- [ ] Verify quality score fix is deployed
- [ ] Check OpenAI API key is valid
- [ ] Verify database connection is working
- [ ] Check for timeout issues
- [ ] Verify CORS headers
- [ ] Test with different symbols (ETH, SOL)

---

## 📝 User Instructions

### For User to Provide
1. **Vercel Function Logs**:
   - Go to Vercel dashboard
   - Select deployment
   - Click "Functions"
   - Filter by `/api/ucie/preview-data`
   - Copy recent error logs

2. **Browser Console Logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Copy all error messages
   - Go to Network tab
   - Find `/api/ucie/preview-data/BTC` request
   - Copy request/response details

3. **Test Direct API Call**:
   ```bash
   curl https://news.arcane.group/api/ucie/preview-data/BTC
   ```
   - Copy the response

---

**Status**: 🔍 **AWAITING DIAGNOSTIC DATA**  
**Next**: User to provide Vercel logs and browser console errors  
**Priority**: HIGH - Blocking UCIE functionality

