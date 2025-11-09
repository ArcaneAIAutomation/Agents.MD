# User Email Tracking Fix

**Date**: January 27, 2025  
**Status**: 🔧 IN PROGRESS  
**Issue**: User email not being populated in database tables

---

## 🚨 Problem Identified

### Current Situation
Looking at the `ucie_analysis_cache` table:
- ✅ `user_id` column: Populated with "anonymous"
- ❌ `user_email` column: All NULL values

### Root Cause
UCIE endpoints are **not using authentication middleware**, so they don't have access to user information:
- No `req.user` object available
- `userId` defaults to "anonymous"
- `userEmail` is never passed to cache functions

---

## ✅ Solution: Optional Authentication

### Strategy
Use `withOptionalAuth` middleware for UCIE endpoints:
- ✅ Allows anonymous access (no breaking changes)
- ✅ Captures user info when available
- ✅ Populates `user_id` and `user_email` for logged-in users
- ✅ Falls back to "anonymous" / NULL for non-logged-in users

### Implementation Pattern

**Before**:
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // No user info available
  const cachedData = await getCachedAnalysis(symbol, 'market-data');
  // ...
  await setCachedAnalysis(symbol, 'market-data', data, ttl, quality);
}
```

**After**:
```typescript
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Get user info if authenticated
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  const cachedData = await getCachedAnalysis(symbol, 'market-data', userId, userEmail);
  // ...
  await setCachedAnalysis(symbol, 'market-data', data, ttl, quality, userId, userEmail);
}

export default withOptionalAuth(handler);
```

---

## 📊 Endpoints to Update

### Priority 1: Data Collection Endpoints (Use setCachedAnalysis)
These endpoints cache data and need user tracking:

1. ✅ `/api/ucie/market-data/[symbol]` - FIXED
2. ⏳ `/api/ucie/sentiment/[symbol]`
3. ⏳ `/api/ucie/technical/[symbol]`
4. ⏳ `/api/ucie/news/[symbol]`
5. ⏳ `/api/ucie/on-chain/[symbol]`
6. ⏳ `/api/ucie/risk/[symbol]`
7. ⏳ `/api/ucie/predictions/[symbol]`
8. ⏳ `/api/ucie/derivatives/[symbol]`
9. ⏳ `/api/ucie/defi/[symbol]`
10. ⏳ `/api/ucie/research/[symbol]`
11. ⏳ `/api/ucie/preview-data/[symbol]`

### Priority 2: Utility Endpoints (Optional)
These endpoints don't cache data but could benefit from user tracking:

- `/api/ucie/cache-stats` - Show user-specific cache stats
- `/api/ucie/invalidate-cache` - Invalidate user-specific cache
- `/api/ucie/health` - Track health checks by user
- `/api/ucie/metrics` - User-specific metrics

### Priority 3: Already Protected
These endpoints already use `withAuth` (required authentication):

- ✅ `/api/ucie/watchlist` - User watchlists
- ✅ `/api/ucie/alerts` - User alerts

---

## 🔧 Implementation Steps

### Step 1: Update market-data endpoint ✅
**Status**: COMPLETE

**Changes**:
1. Import `withOptionalAuth` and `AuthenticatedRequest`
2. Change handler signature to use `AuthenticatedRequest`
3. Extract `userId` and `userEmail` from `req.user`
4. Pass to `getCachedAnalysis()` and `setCachedAnalysis()`
5. Export with `withOptionalAuth(handler)`

### Step 2: Update remaining data collection endpoints ⏳
**Status**: IN PROGRESS

Apply same pattern to:
- sentiment, technical, news, on-chain
- risk, predictions, derivatives, defi
- research, preview-data

### Step 3: Test user tracking ⏳
**Status**: PENDING

**Test Cases**:
1. **Anonymous User**:
   - Access `/api/ucie/market-data/BTC` without login
   - Verify `user_id` = "anonymous"
   - Verify `user_email` = NULL

2. **Logged-in User**:
   - Login with test account
   - Access `/api/ucie/market-data/BTC`
   - Verify `user_id` = actual user ID
   - Verify `user_email` = actual email

3. **Cache Isolation**:
   - User A accesses BTC data
   - User B accesses BTC data
   - Verify separate cache entries
   - Verify no data leakage

---

## 📝 Code Changes Required

### For Each Endpoint

**1. Add Imports**:
```typescript
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';
```

**2. Update Handler Signature**:
```typescript
// Before
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

// After
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
```

**3. Extract User Info**:
```typescript
// At start of handler
const userId = req.user?.id;
const userEmail = req.user?.email;
```

**4. Update getCachedAnalysis Calls**:
```typescript
// Before
const cached = await getCachedAnalysis(symbol, 'TYPE');

// After
const cached = await getCachedAnalysis(symbol, 'TYPE', userId, userEmail);
```

**5. Update setCachedAnalysis Calls**:
```typescript
// Before
await setCachedAnalysis(symbol, 'TYPE', data, ttl, quality);

// After
await setCachedAnalysis(symbol, 'TYPE', data, ttl, quality, userId, userEmail);
```

**6. Export with Middleware**:
```typescript
// At end of file
export default withOptionalAuth(handler);
```

---

## 🧪 Testing Plan

### Database Verification
```sql
-- Check user_id and user_email population
SELECT 
  symbol,
  analysis_type,
  user_id,
  user_email,
  created_at
FROM ucie_analysis_cache
ORDER BY created_at DESC
LIMIT 20;

-- Expected results:
-- Anonymous users: user_id='anonymous', user_email=NULL
-- Logged-in users: user_id='<uuid>', user_email='user@example.com'
```

### API Testing
```bash
# Test 1: Anonymous access
curl https://news.arcane.group/api/ucie/market-data/BTC

# Test 2: Authenticated access
curl https://news.arcane.group/api/ucie/market-data/BTC \
  -H "Cookie: auth_token=<token>"

# Check database after each test
```

### Frontend Testing
1. **Logged Out**:
   - Open https://news.arcane.group
   - Click BTC button
   - Check database: Should see "anonymous" / NULL

2. **Logged In**:
   - Login to account
   - Click BTC button
   - Check database: Should see user ID / email

---

## 📊 Expected Outcomes

### Before Fix
```
user_id      | user_email
-------------|------------
anonymous    | NULL
anonymous    | NULL
anonymous    | NULL
```

### After Fix (Anonymous)
```
user_id      | user_email
-------------|------------
anonymous    | NULL
anonymous    | NULL
```

### After Fix (Logged In)
```
user_id                              | user_email
-------------------------------------|------------------
550e8400-e29b-41d4-a716-446655440000 | user@example.com
550e8400-e29b-41d4-a716-446655440000 | user@example.com
```

---

## 🎯 Benefits

### User Tracking
- ✅ Track which users are using which features
- ✅ Identify power users vs casual users
- ✅ Analyze usage patterns by user

### Cache Isolation
- ✅ Each user gets their own cache
- ✅ No data leakage between users
- ✅ Better privacy and security

### Analytics
- ✅ User-specific metrics
- ✅ Feature adoption by user
- ✅ API usage by user
- ✅ Cost attribution by user

### Future Features
- ✅ User-specific watchlists
- ✅ User-specific alerts
- ✅ Personalized recommendations
- ✅ Usage-based pricing

---

## 🚀 Deployment Plan

### Phase 1: Core Endpoints ✅
- ✅ market-data endpoint updated

### Phase 2: Remaining Endpoints ⏳
- Update all 10 remaining data collection endpoints
- Test each endpoint individually
- Verify database population

### Phase 3: Verification ⏳
- Test with anonymous users
- Test with logged-in users
- Verify cache isolation
- Check database for proper population

### Phase 4: Monitoring ⏳
- Monitor user_email population rate
- Track anonymous vs authenticated usage
- Analyze user behavior patterns

---

## 📚 Related Documentation

- `migrations/006_add_user_id_to_cache.sql` - User ID migration
- `migrations/007_add_user_email_to_cache.sql` - User email migration
- `middleware/auth.ts` - Authentication middleware
- `lib/ucie/cacheUtils.ts` - Cache utilities with user support
- `.kiro/steering/authentication.md` - Authentication system guide

---

**Status**: 🔧 **IN PROGRESS**  
**Next**: Update remaining 10 UCIE endpoints  
**Priority**: MEDIUM - Improves analytics but not blocking

