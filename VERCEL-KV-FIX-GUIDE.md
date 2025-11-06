# Vercel KV Configuration Fix

## Current Situation

You have **agents-md-redis** KV database connected, but it's showing the old `redis://` URL format instead of the REST API HTTPS URLs that the code needs.

## The Problem

**What you have:**
```
REDIS_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
```

**What the code needs:**
```
KV_REST_API_URL=https://your-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your_token_here
```

## Solution: Get the Correct REST API URLs

### Step 1: Access Your KV Database
1. You're already on the right page: **Storage → agents-md-redis**
2. Look for tabs at the top: `.env.local`, `redis-cli`, `Next.js App Router`, etc.
3. Click on the **`.env.local`** tab

### Step 2: Copy the REST API Variables
You should see something like this:
```bash
KV_URL="redis://default:..."  # ← Ignore this one
KV_REST_API_URL="https://agents-md-redis-xxxxx.kv.vercel-storage.com"  # ← Copy this
KV_REST_API_TOKEN="AYa..."  # ← Copy this
KV_REST_API_READ_ONLY_TOKEN="Asa..."  # ← Copy this (optional)
```

### Step 3: Add to Vercel Environment Variables
1. Go to: **Settings → Environment Variables**
2. Click **Add New**
3. Add these three variables:

**Variable 1:**
- Name: `KV_REST_API_URL`
- Value: `https://agents-md-redis-xxxxx.kv.vercel-storage.com` (from .env.local tab)
- Environment: Production, Preview, Development

**Variable 2:**
- Name: `KV_REST_API_TOKEN`
- Value: `AYa...` (from .env.local tab)
- Environment: Production, Preview, Development

**Variable 3 (Optional):**
- Name: `KV_REST_API_READ_ONLY_TOKEN`
- Value: `Asa...` (from .env.local tab)
- Environment: Production, Preview, Development

### Step 4: Keep or Remove Old REDIS_URL
**Option A (Recommended):** Keep it for compatibility
- Some libraries might use it
- Doesn't hurt to have both

**Option B:** Remove it if you want to clean up
- The code doesn't use `REDIS_URL`
- Only uses `KV_REST_API_URL`

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Wait 2-3 minutes

## Verification

### Check Environment Variables
After adding, you should have:
- ✅ `KV_REST_API_URL` (https://...)
- ✅ `KV_REST_API_TOKEN` (AYa...)
- ✅ `KV_REST_API_READ_ONLY_TOKEN` (Asa...) - optional
- ✅ `REDIS_URL` (redis://...) - can keep for compatibility

### Test Rate Limiting
```bash
# Should work without errors
curl https://news.arcane.group/api/auth/csrf-token
```

### Check Logs
After redeployment, you should see:
```
✅ Vercel KV initialized with Upstash Redis
```

Instead of:
```
❌ Rate limit: Failed to get attempts: UrlError...
```

## Why This Matters

### Current Impact
- ⚠️ Rate limiting falls back to in-memory storage
- ⚠️ Error logs clutter Vercel function logs
- ✅ Authentication still works (fallback is functional)
- ⚠️ Rate limiting doesn't scale across serverless functions

### After Fix
- ✅ Distributed rate limiting across all functions
- ✅ Clean logs (no errors)
- ✅ Better security (proper rate limiting)
- ✅ Scales properly in production

## Alternative: Use In-Memory Fallback

If you don't want to configure KV REST API:

### Option: Delete KV Variables
1. Delete `KV_REST_API_URL` (if it exists)
2. Delete `KV_REST_API_TOKEN` (if it exists)
3. Keep `REDIS_URL` (won't be used, but harmless)

**Result:**
- System uses in-memory rate limiting
- Works fine for low-traffic sites
- No distributed rate limiting
- Simpler configuration

## Recommendation

**For Production:** Configure KV REST API URLs (Steps 1-5 above)
- Better security
- Scales properly
- Distributed rate limiting

**For Testing:** Use in-memory fallback (delete KV variables)
- Simpler setup
- Works fine for testing
- Can upgrade later

---

**Status:** Action Required
**Priority:** MEDIUM (System works with fallback, but fix improves reliability)
**Time:** 5-10 minutes
**Difficulty:** Easy (just copy/paste from Vercel KV dashboard)
