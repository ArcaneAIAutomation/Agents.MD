# Vercel Environment Variables Update Guide

## Required Actions for UCIE to Work

### 1. Remove Binance API Keys ✅ REQUIRED

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Delete these variables:**
- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`

**Why:** Binance API is location-restricted and has been removed from the codebase.

---

### 2. Fix Redis/KV URL Format ⚠️ CRITICAL

**Problem:** Your `KV_REST_API_URL` is in the wrong format.

**Current (WRONG):**
```
redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
```

**Required (CORRECT):**
```
https://your-instance.kv.vercel-storage.com
```

**How to Fix:**

#### Option A: Get Correct URL from Vercel KV (Recommended)
1. Go to: https://vercel.com/dashboard → Storage
2. Find your KV database (or create one if missing)
3. Click on the database
4. Go to `.env.local` tab
5. Copy the **HTTPS URL** that starts with `https://`
6. Update `KV_REST_API_URL` in Vercel environment variables

#### Option B: Use In-Memory Fallback (Temporary)
If you don't have Vercel KV set up:
1. **Delete** `KV_REST_API_URL` from Vercel environment variables
2. **Delete** `KV_REST_API_TOKEN` from Vercel environment variables
3. System will automatically use in-memory rate limiting (works but doesn't scale)

**Note:** The current `redis://` URL is causing errors but the system is already falling back to in-memory storage, so authentication still works. However, fixing this will eliminate error logs.

---

### 3. Verify Required API Keys for UCIE

**Check these are set in Vercel:**

#### CoinMarketCap (PRIMARY - REQUIRED)
```
COINMARKETCAP_API_KEY=your_actual_key_here
```
- Get from: https://pro.coinmarketcap.com/account
- Used for: Market data, price, volume, market cap, metadata
- Status: **REQUIRED** for UCIE Phase 1

#### NewsAPI (REQUIRED)
```
NEWS_API_KEY=your_actual_key_here
```
- Get from: https://newsapi.org/account
- Used for: News aggregation with sentiment analysis
- Status: **REQUIRED** for UCIE Phase 2

#### Caesar API (REQUIRED)
```
CAESAR_API_KEY=your_actual_key_here
```
- Get from: https://api.caesar.xyz
- Used for: AI-powered deep research
- Status: **REQUIRED** for UCIE Phase 4

---

### 4. Optional API Keys (Improve Data Quality)

#### CryptoCompare (Optional)
```
CRYPTOCOMPARE_API_KEY=your_actual_key_here
```
- Get from: https://www.cryptocompare.com/cryptopian/api-keys
- Used for: Additional price validation
- Status: **Optional** (works without key, but has rate limits)

---

## Complete Vercel Environment Variables Checklist

### Authentication & Database (Already Set)
- ✅ `DATABASE_URL` - Postgres connection
- ✅ `JWT_SECRET` - Token signing
- ✅ `CRON_SECRET` - Cron job auth
- ✅ `AZURE_TENANT_ID` - Office 365
- ✅ `AZURE_CLIENT_ID` - Office 365
- ✅ `AZURE_CLIENT_SECRET` - Office 365
- ✅ `SENDER_EMAIL` - Email sender
- ✅ `NEXT_PUBLIC_APP_URL` - App URL

### Rate Limiting (Needs Fix)
- ⚠️ `KV_REST_API_URL` - **FIX THIS** (must be https://)
- ⚠️ `KV_REST_API_TOKEN` - Update if fixing KV URL
- ⚠️ `KV_REST_API_READ_ONLY_TOKEN` - Update if fixing KV URL

### AI & Market Data (Required for UCIE)
- ✅ `OPENAI_API_KEY` - Already set
- ✅ `OPENAI_MODEL` - Already set (gpt-4o-2024-08-06)
- ✅ `GEMINI_API_KEY` - Already set (Whale Watch)
- ✅ `COINMARKETCAP_API_KEY` - **VERIFY THIS IS SET**
- ✅ `NEWS_API_KEY` - **VERIFY THIS IS SET**
- ✅ `CAESAR_API_KEY` - **VERIFY THIS IS SET**

### To Remove
- ❌ `BINANCE_API_KEY` - **DELETE THIS**
- ❌ `BINANCE_SECRET_KEY` - **DELETE THIS**

---

## Step-by-Step Instructions

### Step 1: Access Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project (news.arcane.group)
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar

### Step 2: Delete Binance Variables
1. Find `BINANCE_API_KEY`
2. Click the **⋮** (three dots) menu
3. Click **Delete**
4. Confirm deletion
5. Repeat for `BINANCE_SECRET_KEY`

### Step 3: Fix Redis/KV URL
1. Find `KV_REST_API_URL`
2. Click **Edit**
3. Replace with correct HTTPS URL from Vercel KV
4. Click **Save**
5. Repeat for `KV_REST_API_TOKEN` if needed

### Step 4: Verify UCIE API Keys
1. Search for `COINMARKETCAP_API_KEY`
   - If missing: Click **Add New** → Enter key
   - If present: Verify it's not empty
2. Search for `NEWS_API_KEY`
   - If missing: Click **Add New** → Enter key
   - If present: Verify it's not empty
3. Search for `CAESAR_API_KEY`
   - If missing: Click **Add New** → Enter key
   - If present: Verify it's not empty

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **⋮** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2-3 minutes)

---

## Verification After Update

### Test 1: Check Rate Limiting Works
```bash
# Should return 200 (not 500)
curl https://news.arcane.group/api/auth/csrf-token
```

### Test 2: Check UCIE Market Data
```bash
# Should return market data from CoinMarketCap
curl https://news.arcane.group/api/ucie-market-data?symbol=BTC
```

### Test 3: Check UCIE News
```bash
# Should return news with sentiment
curl https://news.arcane.group/api/ucie-news?symbol=BTC&limit=10
```

### Test 4: Check Full UCIE Flow
1. Visit: https://news.arcane.group/ucie/analyze/BTC
2. Watch console logs for:
   - ✅ Phase 1: Market data loads (5s)
   - ✅ Phase 2: News loads (8s)
   - ✅ Phase 4: Caesar research starts (2min)

---

## Expected Console Output (After Fix)

### Before Fix (Current)
```
❌ Rate limit: Failed to get attempts: UrlError: Upstash Redis client was passed an invalid URL
⚠️ Using in-memory fallback for rate limiting
```

### After Fix (Expected)
```
✅ Vercel KV initialized with Upstash Redis
✅ Rate limiting using distributed storage
```

**OR** (if you delete KV variables):
```
⚠️ Upstash Redis not configured. Using in-memory fallback for rate limiting.
```

---

## Troubleshooting

### Issue: "COINMARKETCAP_API_KEY not found"
**Solution:** Add the key in Vercel environment variables

### Issue: "NEWS_API_KEY not found"
**Solution:** Add the key in Vercel environment variables

### Issue: "CAESAR_API_KEY not found"
**Solution:** Add the key in Vercel environment variables

### Issue: Still seeing Redis URL error
**Solution:** 
1. Verify you saved the changes in Vercel
2. Redeploy the application
3. Clear browser cache
4. Wait 2-3 minutes for deployment

### Issue: UCIE not loading data
**Solution:**
1. Check Vercel function logs for errors
2. Verify all API keys are set correctly
3. Test each endpoint individually (see Verification section)

---

## Quick Reference: Where to Get API Keys

| Service | URL | Used For |
|---------|-----|----------|
| CoinMarketCap | https://pro.coinmarketcap.com/account | Market data (PRIMARY) |
| NewsAPI | https://newsapi.org/account | News aggregation |
| Caesar AI | https://api.caesar.xyz | Deep research |
| CryptoCompare | https://www.cryptocompare.com/cryptopian/api-keys | Price validation (optional) |
| Vercel KV | https://vercel.com/dashboard → Storage | Rate limiting |

---

## Summary of Changes

### Required Actions
1. ✅ **Delete** `BINANCE_API_KEY` from Vercel
2. ✅ **Delete** `BINANCE_SECRET_KEY` from Vercel
3. ⚠️ **Fix** `KV_REST_API_URL` (change to https://)
4. ✅ **Verify** `COINMARKETCAP_API_KEY` is set
5. ✅ **Verify** `NEWS_API_KEY` is set
6. ✅ **Verify** `CAESAR_API_KEY` is set
7. ✅ **Redeploy** application

### Optional Actions
- Add `CRYPTOCOMPARE_API_KEY` for better data quality
- Add `KV_REST_API_READ_ONLY_TOKEN` for monitoring

---

**Status:** Ready to Update
**Priority:** HIGH (Required for UCIE to work)
**Estimated Time:** 10-15 minutes
**Impact:** Fixes rate limiting errors, enables UCIE functionality
