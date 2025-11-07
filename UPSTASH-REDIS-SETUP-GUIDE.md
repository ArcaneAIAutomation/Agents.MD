# 🚀 Upstash Redis Setup Guide - Distributed Rate Limiting

**Purpose**: Upgrade from in-memory rate limiting to distributed Upstash Redis  
**Time Required**: 15 minutes  
**Difficulty**: Easy  
**Status**: Ready to implement

---

## 📊 Current Situation

**Problem**: Rate limiting uses in-memory storage (not distributed)

**Impact**:
- Rate limits don't work across multiple serverless function instances
- Each function instance has its own counter
- Attackers could bypass limits by triggering different instances

**Solution**: Upgrade to Upstash Redis for distributed rate limiting

---

## 🎯 Step-by-Step Setup

### Step 1: Create Upstash Redis Database (5 minutes)

1. **Go to Upstash Console**
   - Visit: https://console.upstash.com/
   - Sign up or log in (free tier available)

2. **Create New Redis Database**
   - Click "Create Database"
   - Name: `agents-md-rate-limit` (or your preferred name)
   - Type: **Regional** (cheaper, sufficient for rate limiting)
   - Region: **US East (N. Virginia)** or closest to your Vercel deployment
   - Eviction: **No eviction** (we handle TTL in code)
   - Click "Create"

3. **Get Connection Details**
   - After creation, click on your database
   - Go to "REST API" tab
   - Copy the following:
     - **UPSTASH_REDIS_REST_URL** (starts with `https://`)
     - **UPSTASH_REDIS_REST_TOKEN** (long alphanumeric string)

**Example values:**
```
UPSTASH_REDIS_REST_URL=https://agents-md-rate-limit-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3
```

---

### Step 2: Update Local Environment (2 minutes)

1. **Open `.env.local`**

2. **Find the Upstash Redis section** (around line 327)

3. **Replace the commented lines with your credentials:**

```bash
# =============================================================================
# 🛡️ RATE LIMITING CONFIGURATION (Upstash Redis)
# =============================================================================
# Upstash Redis for distributed rate limiting
# Prevents brute force attacks and API abuse across multiple server instances
# 
# STATUS: ✅ CONFIGURED with Upstash Redis
# 
# Connection: https://agents-md-rate-limit-12345.upstash.io

# Upstash Redis REST API URL (REQUIRED)
# Format: https://your-redis-name.upstash.io
# Get from: https://console.upstash.com/redis > Your Database > REST API tab
UPSTASH_REDIS_REST_URL=https://agents-md-rate-limit-12345.upstash.io

# Upstash Redis REST API Token (REQUIRED)
# Authentication token for Upstash Redis
# Get from: https://console.upstash.com/redis > Your Database > REST API tab
UPSTASH_REDIS_REST_TOKEN=AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3

# Alternative variable names (for compatibility)
KV_REST_API_URL=https://agents-md-rate-limit-12345.upstash.io
KV_REST_API_TOKEN=AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3

# Rate Limiting Configuration
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

4. **Save the file**

---

### Step 3: Update Vercel Environment Variables (5 minutes)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `agents-md` or `news.arcane.group`

2. **Navigate to Settings → Environment Variables**

3. **Add the following variables:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `UPSTASH_REDIS_REST_URL` | `https://agents-md-rate-limit-12345.upstash.io` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | `AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3` | Production, Preview, Development |
| `KV_REST_API_URL` | `https://agents-md-rate-limit-12345.upstash.io` | Production, Preview, Development |
| `KV_REST_API_TOKEN` | `AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3` | Production, Preview, Development |

**Note**: We add both `UPSTASH_REDIS_*` and `KV_REST_API_*` for compatibility.

4. **Save all variables**

---

### Step 4: Deploy to Production (3 minutes)

1. **Commit your changes:**
```bash
git add .env.local
git commit -m "🔧 Configure Upstash Redis for distributed rate limiting"
git push origin main
```

2. **Vercel will automatically deploy**
   - Wait for deployment to complete (~2 minutes)
   - Check deployment logs for success

3. **Verify deployment:**
```bash
# Check Vercel deployment status
vercel ls

# View latest deployment logs
vercel logs --follow
```

---

### Step 5: Verify It's Working (2 minutes)

1. **Check Application Logs**

Look for this message in Vercel function logs:
```
✅ Vercel KV initialized with Upstash Redis
```

**NOT this message:**
```
⚠️ Upstash Redis not configured. Using in-memory fallback for rate limiting.
```

2. **Test Rate Limiting**

Try logging in with wrong password 6 times:

```bash
# Attempt 1-5 (should work)
for i in {1..5}; do
  curl -X POST https://news.arcane.group/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Attempt 6 (should be rate limited)
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response on 6th attempt:**
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

**Status Code**: `429 Too Many Requests`

3. **Check Upstash Dashboard**

- Go to https://console.upstash.com/redis
- Click on your database
- Go to "Data Browser" tab
- You should see keys like: `ratelimit:/api/auth/login:test@example.com`

---

## 🔍 Troubleshooting

### Issue 1: "Vercel KV module not available"

**Error in logs:**
```
⚠️ Vercel KV module not available, using in-memory fallback
```

**Solution:**
```bash
# Install @vercel/kv package
npm install @vercel/kv

# Commit and deploy
git add package.json package-lock.json
git commit -m "📦 Add @vercel/kv package"
git push origin main
```

---

### Issue 2: "Redis URL must start with https://"

**Error in logs:**
```
⚠️ Redis URL must start with https:// for Upstash. Using in-memory fallback.
```

**Solution:**
- Verify your `UPSTASH_REDIS_REST_URL` starts with `https://`
- NOT `redis://` (that's for direct Redis connections)
- Upstash REST API requires HTTPS URLs

**Correct format:**
```
✅ UPSTASH_REDIS_REST_URL=https://agents-md-rate-limit-12345.upstash.io
❌ UPSTASH_REDIS_REST_URL=redis://default:password@host:6379
```

---

### Issue 3: Rate Limiting Still Not Working

**Symptoms:**
- Can make unlimited login attempts
- No rate limit errors

**Debugging Steps:**

1. **Check environment variables are set:**
```bash
# In Vercel dashboard, verify variables exist
# In local development, check .env.local
```

2. **Check Vercel function logs:**
```bash
vercel logs --follow
```

Look for:
- `✅ Vercel KV initialized with Upstash Redis` (good)
- `⚠️ Upstash Redis not configured` (bad)

3. **Test Upstash connection directly:**
```bash
# Test with curl
curl -X POST https://your-redis-name.upstash.io/set/test/hello \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"result":"OK"}
```

4. **Check rate limit headers in response:**
```bash
curl -I https://news.arcane.group/api/auth/login
```

Look for:
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 4`
- `X-RateLimit-Reset: 2025-01-27T...`

---

### Issue 4: "Connection timeout" or "Network error"

**Symptoms:**
- Upstash connection fails
- Requests timeout

**Solutions:**

1. **Check Upstash region:**
   - Should be close to Vercel deployment region
   - US East (N. Virginia) for `iad1` Vercel region

2. **Verify Upstash database is active:**
   - Go to Upstash dashboard
   - Check database status (should be "Active")

3. **Check firewall/network:**
   - Vercel should have access to Upstash (no firewall needed)
   - If using VPN, try disabling

---

## 📊 Performance Comparison

### Before (In-Memory)

```
✅ Fast (< 1ms lookup)
❌ Not distributed (each instance has own counter)
❌ Lost on function restart
❌ Attackers can bypass by triggering different instances
```

### After (Upstash Redis)

```
✅ Distributed (shared across all instances)
✅ Persistent (survives function restarts)
✅ Reliable (attackers can't bypass)
✅ Fast (< 5ms lookup with Upstash)
✅ Scalable (handles high traffic)
```

---

## 💰 Cost Analysis

### Upstash Free Tier

```
✅ 10,000 commands per day
✅ 256 MB storage
✅ 1 GB bandwidth
✅ No credit card required
```

**Estimated Usage:**
- Login attempts: ~100-500 per day
- Rate limit checks: ~200-1,000 per day
- Total: ~300-1,500 commands per day

**Verdict**: Free tier is **more than sufficient** for your needs!

### Upstash Pro (if needed)

```
💰 $0.20 per 100,000 commands
💰 $0.25 per GB storage
💰 $0.15 per GB bandwidth
```

**When to upgrade:**
- More than 10,000 commands per day
- More than 256 MB storage needed
- High traffic spikes

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Upstash Redis database created
- [ ] Environment variables set in `.env.local`
- [ ] Environment variables set in Vercel dashboard
- [ ] Code deployed to production
- [ ] Logs show "✅ Vercel KV initialized with Upstash Redis"
- [ ] Rate limiting works (6th attempt blocked)
- [ ] Upstash dashboard shows rate limit keys
- [ ] Rate limit headers present in responses
- [ ] No errors in Vercel function logs

---

## 🎉 Success Criteria

**You'll know it's working when:**

1. **Logs show Upstash connection:**
   ```
   ✅ Vercel KV initialized with Upstash Redis
   ```

2. **Rate limiting works across instances:**
   - Try from different IPs/browsers
   - All share the same rate limit counter

3. **Upstash dashboard shows activity:**
   - Keys visible in Data Browser
   - Commands counter increasing

4. **Rate limit headers present:**
   ```
   X-RateLimit-Limit: 5
   X-RateLimit-Remaining: 3
   X-RateLimit-Reset: 2025-01-27T14:30:00Z
   ```

---

## 📚 Additional Resources

**Upstash Documentation:**
- Getting Started: https://docs.upstash.com/redis
- REST API: https://docs.upstash.com/redis/features/restapi
- Vercel Integration: https://docs.upstash.com/redis/howto/vercelintegration

**Vercel KV Documentation:**
- Overview: https://vercel.com/docs/storage/vercel-kv
- Quickstart: https://vercel.com/docs/storage/vercel-kv/quickstart
- SDK Reference: https://vercel.com/docs/storage/vercel-kv/kv-reference

**Rate Limiting Best Practices:**
- OWASP: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
- Sliding Window: https://en.wikipedia.org/wiki/Sliding_window_protocol

---

## 🔐 Security Notes

1. **Keep tokens secure:**
   - Never commit `.env.local` to git
   - Store tokens in password manager
   - Rotate tokens every 6-12 months

2. **Monitor usage:**
   - Check Upstash dashboard regularly
   - Set up alerts for unusual activity
   - Review rate limit logs weekly

3. **Adjust limits as needed:**
   - Start with 5 attempts per 15 minutes
   - Increase if legitimate users are blocked
   - Decrease if attacks persist

---

## 🎯 Next Steps After Setup

1. **Monitor for 24 hours:**
   - Check Vercel logs for errors
   - Verify rate limiting works
   - Monitor Upstash usage

2. **Adjust rate limits if needed:**
   - Edit `AUTH_RATE_LIMIT_MAX_ATTEMPTS` in `.env.local`
   - Redeploy to apply changes

3. **Set up alerts:**
   - Upstash: Set up email alerts for high usage
   - Vercel: Set up error alerts

4. **Document for team:**
   - Share Upstash credentials securely
   - Document rate limit policies
   - Train team on monitoring

---

**Status**: 📝 **READY TO IMPLEMENT**  
**Time Required**: 15 minutes  
**Difficulty**: Easy  
**Impact**: High (proper distributed rate limiting)

