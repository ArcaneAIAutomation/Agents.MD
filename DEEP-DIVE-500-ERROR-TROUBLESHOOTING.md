# Deep Dive 500 Error - Troubleshooting Guide

## Current Status

Deep Dive is returning 500 Internal Server Error. I've added comprehensive logging to identify the exact cause.

## Options to Resolve (Ordered by Cost)

### FREE Options ⭐⭐⭐

#### 1. Check Vercel Logs (NEXT STEP)
**Action:** View server-side logs to see exact error
**How:**
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click latest deployment
5. Click "Functions" tab
6. Find `/api/whale-watch/deep-dive`
7. View logs to see which step failed

**What to look for:**
- `❌ Failed to fetch blockchain data` → Blockchain.info API issue
- `❌ Failed to get BTC price` → Price API issue
- `❌ Failed to load Gemini config` → Missing GEMINI_API_KEY
- `❌ Gemini API error: 401` → Invalid API key
- `❌ Gemini API error: 429` → Rate limit exceeded
- `❌ Failed to parse analysis JSON` → Gemini response format issue

#### 2. Verify Environment Variables
**Check these are set in Vercel:**
```bash
GEMINI_API_KEY=AIzaSy... (39 characters)
```

**How to check:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify GEMINI_API_KEY exists
3. Verify it starts with "AIzaSy"
4. Redeploy if you just added it

#### 3. Test Blockchain API Directly
**Test if blockchain.info is accessible:**
```bash
curl https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=3
```

If this fails, blockchain.info might be:
- Down temporarily
- Rate limiting your IP
- Blocking Vercel IPs

#### 4. Test Gemini API Key
**Verify your API key works:**
```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

If this fails:
- API key is invalid
- API key doesn't have access to gemini-2.5-flash
- Rate limit exceeded

### VERCEL CONFIGURATION Options 💰

#### 5. Increase Function Timeout (Hobby: Free, Pro: $20/month)
**Current:** 10 seconds (Hobby), 60 seconds (Pro)
**Needed:** Deep Dive takes 10-20 seconds

**Hobby Plan Limitations:**
- 10-second timeout (might be too short)
- Limited to 100 GB-hours/month

**Pro Plan Benefits:**
- 60-second timeout
- 1000 GB-hours/month
- Better for production

**How to upgrade:**
1. Vercel Dashboard → Settings → General
2. Click "Upgrade to Pro"
3. $20/month per member

#### 6. Configure Function Region
**Issue:** Vercel might be deploying to region far from blockchain.info servers

**How to configure:**
```javascript
// pages/api/whale-watch/deep-dive.ts
export const config = {
  runtime: 'nodejs',
  regions: ['iad1'], // US East (closest to most APIs)
  maxDuration: 30, // Pro plan only
};
```

### ALTERNATIVE APPROACHES (FREE)

#### 7. Use Different Blockchain API
**Options:**
- **Blockchair API** - https://api.blockchair.com/
- **Blockchain.com API** - https://api.blockchain.com/
- **Mempool.space API** - https://mempool.space/api/

**Pros:** Might be more reliable
**Cons:** Different data format, need to rewrite fetch logic

#### 8. Cache Blockchain Data
**Approach:** Cache blockchain data in Vercel KV or database
**Pros:** Faster, more reliable
**Cons:** Requires Vercel KV ($0.25/100K reads) or database setup

#### 9. Split into Two Requests
**Approach:** 
1. First request: Fetch blockchain data, return immediately
2. Second request: Analyze with Gemini

**Pros:** Avoids timeout, better UX
**Cons:** More complex, requires polling

## Recommended Action Plan

### Step 1: Check Logs (5 minutes)
1. Deploy current version (already done)
2. Trigger Deep Dive
3. Check Vercel logs
4. Identify exact error

### Step 2: Quick Fixes (Based on logs)
**If "Gemini API key" error:**
- Add GEMINI_API_KEY to Vercel environment variables
- Redeploy

**If "Blockchain API timeout":**
- Increase timeout from 5s to 8s
- Or try different blockchain API

**If "Rate limit":**
- Wait a few minutes
- Or implement caching

### Step 3: Vercel Configuration (If needed)
**If consistent timeouts:**
- Consider Pro plan for 60s timeout
- Or split into two requests

## Diagnostic Commands

### Check if deployed correctly:
```bash
curl -X POST https://news.arcane.group/api/whale-watch/deep-dive \
  -H "Content-Type: application/json" \
  -d '{"txHash":"test","amount":100,"fromAddress":"1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa","toAddress":"1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa","timestamp":"2024-01-01"}'
```

### Check Vercel deployment status:
```bash
vercel ls
```

### View recent logs:
```bash
vercel logs
```

## Expected Log Output (Success)

```
🔬 Deep Dive API called
📋 Request body: {"txHash":"...","amount":100,...}
🔬 Starting Deep Dive analysis for e54fd1e05a9063f5...
📍 From: bc1qxy2kgdygjrsqtzq2n...
📍 To: 3FZbgi29cpjq2GjdwV8e...
📡 Fetching real blockchain data from blockchain.info...
✅ Blockchain data fetched in 3245ms
📊 Source: 1234 total txs, 3 recent
📊 Destination: 5678 total txs, 3 recent
💰 Fetching current BTC price...
✅ BTC price: $95,000
⚙️ Loading Gemini configuration...
✅ Gemini config loaded, using gemini-2.5-flash
📝 Building analysis prompt...
✅ Prompt built, length: 2456 characters
📡 Calling Gemini API...
✅ Gemini API responded in 4567ms with status 200
📥 Parsing Gemini response...
✅ Response parsed successfully
📊 Parsing analysis JSON...
✅ Analysis parsed successfully
✅ Deep Dive analysis completed in 8912ms
```

## Expected Log Output (Error Examples)

### Blockchain API Timeout:
```
❌ Failed to fetch blockchain data after 8234ms: Error: Blockchain API timeout
```

### Gemini API Key Missing:
```
❌ Failed to load Gemini config: Error: GEMINI_API_KEY environment variable is required
```

### Gemini Rate Limit:
```
❌ Gemini API error: 429 - Rate limit exceeded
```

## Next Steps After Identifying Error

Once you see the logs, we can:
1. Fix the specific issue identified
2. Implement appropriate workaround
3. Optimize for reliability

---

**Status:** Awaiting Vercel logs to identify root cause
**Priority:** High - Feature non-functional
**Blockchain Data:** Kept intact for real data integrity
