# ⚡ Upstash Redis Quick Start - 5 Minute Setup

**The fastest way to enable distributed rate limiting**

---

## 🎯 What You Need

1. Upstash account (free): https://console.upstash.com/
2. 5 minutes of your time
3. Access to Vercel dashboard

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Upstash Database (2 min)

1. Go to: https://console.upstash.com/
2. Click "Create Database"
3. Settings:
   - Name: `agents-md-rate-limit`
   - Type: **Regional**
   - Region: **US East (N. Virginia)**
4. Click "Create"

### Step 2: Copy Credentials (30 sec)

1. Click on your new database
2. Go to "REST API" tab
3. Copy these two values:
   - **UPSTASH_REDIS_REST_URL** (starts with `https://`)
   - **UPSTASH_REDIS_REST_TOKEN** (long string)

### Step 3: Update Vercel (2 min)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables
4. Add these 4 variables (all environments):

```
UPSTASH_REDIS_REST_URL = https://your-redis-name.upstash.io
UPSTASH_REDIS_REST_TOKEN = your-token-here
KV_REST_API_URL = https://your-redis-name.upstash.io
KV_REST_API_TOKEN = your-token-here
```

### Step 4: Redeploy (30 sec)

```bash
# Trigger redeploy
vercel --prod

# Or just push to main
git commit --allow-empty -m "🔧 Enable Upstash Redis"
git push origin main
```

### Step 5: Verify (30 sec)

Check Vercel logs for:
```
✅ Vercel KV initialized with Upstash Redis
```

**Done!** 🎉

---

## ✅ Quick Test

Try logging in with wrong password 6 times:

```bash
# Should work 5 times, fail on 6th
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

**6th attempt should return:**
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## 🔍 Troubleshooting

**Problem**: Still seeing "in-memory fallback" in logs

**Solution**: 
1. Verify environment variables are set in Vercel
2. Redeploy after adding variables
3. Check URL starts with `https://` (not `redis://`)

**Problem**: Rate limiting not working

**Solution**:
1. Check Vercel logs for errors
2. Verify Upstash database is "Active"
3. Test Upstash connection:
   ```bash
   curl -X POST https://your-redis-name.upstash.io/set/test/hello \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📊 What Changed

**Before:**
- ⚠️ In-memory rate limiting (not distributed)
- Each serverless instance has own counter
- Attackers can bypass by triggering different instances

**After:**
- ✅ Distributed rate limiting (shared across all instances)
- Single source of truth for all rate limits
- Attackers cannot bypass

---

## 💰 Cost

**Free Tier:**
- 10,000 commands/day
- 256 MB storage
- 1 GB bandwidth

**Your Usage:**
- ~300-1,500 commands/day
- < 1 MB storage
- < 10 MB bandwidth

**Verdict**: Free tier is perfect! ✅

---

## 📚 Full Documentation

For detailed setup and troubleshooting:
- See: `UPSTASH-REDIS-SETUP-GUIDE.md`

---

**Time**: 5 minutes  
**Cost**: Free  
**Impact**: High security improvement  
**Status**: Ready to implement ✅

