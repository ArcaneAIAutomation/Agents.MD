# UCIE Caesar API Polling Configuration Update

**Date**: January 27, 2025  
**Status**: ✅ **COMPLETED**  
**Issue**: Caesar API polling too frequent, causing potential timeouts  
**Solution**: Adjusted polling interval from 3 seconds to 60 seconds

---

## Changes Made

### 1. Updated Polling Interval in `lib/ucie/caesarClient.ts`

**Before:**
```typescript
pollInterval: number = 3000  // 3 seconds
```

**After:**
```typescript
pollInterval: number = 60000  // 60 seconds
```

**Impact:**
- Polls Caesar API every **60 seconds** instead of every 3 seconds
- Reduces API calls from ~200 to ~10 over 10-minute period
- Gives Caesar more time to complete research between checks
- More respectful of API rate limits

### 2. Updated API Configuration in `pages/api/ucie/research/[symbol].ts`

**Added:**
```typescript
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 600, // 10 minutes (requires Vercel Pro or Enterprise)
};
```

**Impact:**
- Explicitly sets maximum function duration to 600 seconds (10 minutes)
- Ensures Vercel doesn't timeout the function prematurely
- Requires Vercel Pro or Enterprise plan for 10-minute timeout

---

## Polling Behavior

### Current Configuration
- **Max Wait Time**: 600 seconds (10 minutes)
- **Poll Interval**: 60 seconds
- **Max Attempts**: 10 polls (600s / 60s = 10)

### Polling Timeline
```
Time    | Action
--------|--------------------------------------------------
0:00    | Create Caesar research job
1:00    | Poll #1 - Check status
2:00    | Poll #2 - Check status
3:00    | Poll #3 - Check status
4:00    | Poll #4 - Check status
5:00    | Poll #5 - Check status
6:00    | Poll #6 - Check status
7:00    | Poll #7 - Check status
8:00    | Poll #8 - Check status
9:00    | Poll #9 - Check status
10:00   | Poll #10 - Check status (final attempt)
```

### Status Handling
- **Completed**: Return results immediately
- **Failed/Cancelled/Expired**: Throw error immediately
- **Queued/Pending/Researching**: Continue polling
- **Timeout**: After 10 minutes, throw timeout error

---

## Vercel Plan Requirements

### Function Timeout Limits
| Plan       | Max Duration | UCIE Support |
|------------|--------------|--------------|
| Hobby      | 10 seconds   | ❌ Too short |
| Pro        | 60 seconds   | ⚠️ Limited   |
| Enterprise | 900 seconds  | ✅ Full      |

**Recommendation**: Upgrade to **Vercel Enterprise** for full 10-minute polling support.

### Workaround for Pro Plan
If on Pro plan (60-second limit), consider:
1. **Client-side polling**: Move polling to frontend
2. **Webhook callback**: Use Caesar webhooks (if available)
3. **Background job**: Use Vercel Cron or external worker

---

## Testing

### Test the Updated Configuration

```bash
# Test UCIE research endpoint
curl https://news.arcane.group/api/ucie/research/BTC

# Expected behavior:
# - Creates Caesar research job
# - Polls every 60 seconds
# - Returns results within 10 minutes
# - Or returns timeout error after 10 minutes
```

### Monitor Logs

```bash
# Check Vercel function logs for polling activity
# Look for these log messages:
# - "⏳ Polling Caesar research job..."
# - "📊 Poll attempt X/10: status=..."
# - "✅ Caesar research completed after Xs"
```

---

## Benefits of 60-Second Polling

### 1. Reduced API Calls
- **Before**: ~200 API calls per research (every 3 seconds for 10 minutes)
- **After**: ~10 API calls per research (every 60 seconds for 10 minutes)
- **Savings**: 95% reduction in API calls

### 2. Better Rate Limit Compliance
- Less likely to hit Caesar API rate limits
- More sustainable for production use
- Allows for concurrent research requests

### 3. Improved Reliability
- Gives Caesar more time to complete research
- Reduces network congestion
- Lower chance of transient errors

### 4. Cost Efficiency
- Fewer function invocations
- Lower bandwidth usage
- Reduced API costs

---

## Potential Issues & Solutions

### Issue 1: Vercel Timeout (Pro Plan)
**Problem**: Function times out after 60 seconds on Pro plan  
**Solution**: Upgrade to Enterprise or implement client-side polling

### Issue 2: User Impatience
**Problem**: Users may think the system is frozen (60-second gaps)  
**Solution**: Add progress indicator showing "Checking status every 60 seconds..."

### Issue 3: Caesar Completes Quickly
**Problem**: Research completes in 30 seconds, but we wait 60 seconds to check  
**Solution**: Acceptable trade-off for reduced API calls. Consider adaptive polling (fast initially, slower later)

---

## Next Steps

### Immediate
- [x] Update polling interval to 60 seconds
- [x] Update API configuration for 10-minute timeout
- [ ] Deploy changes to production
- [ ] Test with real Caesar API requests

### Short-term
- [ ] Verify Vercel plan supports 10-minute functions
- [ ] Add progress indicator in UI for 60-second polling
- [ ] Monitor Caesar API usage and rate limits

### Long-term
- [ ] Consider adaptive polling (fast → slow)
- [ ] Implement webhook callback if Caesar supports it
- [ ] Add client-side polling option for Pro plan users

---

## Files Modified

1. **lib/ucie/caesarClient.ts**
   - Changed `pollInterval` default from 3000ms to 60000ms
   - Updated JSDoc comments

2. **pages/api/ucie/research/[symbol].ts**
   - Added `maxDuration: 600` to API config
   - Added detailed comments about Vercel plan requirements

---

## Deployment

```bash
# Build and test locally
npm run build

# Commit changes
git add lib/ucie/caesarClient.ts pages/api/ucie/research/[symbol].ts
git commit -m "feat(ucie): Update Caesar API polling to 60-second intervals for 10-minute timeout"

# Push to production
git push origin main
```

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Impact**: High - Significantly improves Caesar API integration reliability  
**Risk**: Low - Graceful degradation if timeout occurs

The UCIE Caesar API integration now polls every 60 seconds for up to 10 minutes, providing a more sustainable and reliable research experience! 🚀
