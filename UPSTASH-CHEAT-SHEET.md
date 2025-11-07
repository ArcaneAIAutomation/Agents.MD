# ⚡ Upstash Redis Cheat Sheet

**Quick reference for Upstash Redis setup and management**

---

## 🚀 Setup (Copy-Paste Ready)

### 1. Create Database
```
URL: https://console.upstash.com/
Name: agents-md-rate-limit
Type: Regional
Region: US East (N. Virginia)
```

### 2. Vercel Environment Variables
```bash
# Add these 4 variables (all environments):
UPSTASH_REDIS_REST_URL=https://your-redis-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
KV_REST_API_URL=https://your-redis-name.upstash.io
KV_REST_API_TOKEN=your-token-here
```

### 3. Deploy
```bash
vercel --prod
```

---

## ✅ Verification Commands

### Check Logs
```bash
vercel logs --follow | grep "Vercel KV"
```

**Expected**: `✅ Vercel KV initialized with Upstash Redis`

### Test Rate Limiting
```bash
# Try 6 times (6th should fail)
for i in {1..6}; do
  curl -X POST https://news.arcane.group/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done
```

**Expected 6th response**: `429 Too Many Requests`

### Test Upstash Connection
```bash
curl -X POST https://your-redis-name.upstash.io/set/test/hello \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: `{"result":"OK"}`

---

## 🔍 Troubleshooting

### Problem: In-memory fallback

**Check:**
```bash
# Verify env vars exist
vercel env ls | grep UPSTASH

# Check URL format
echo $UPSTASH_REDIS_REST_URL
# Should start with https://
```

**Fix:**
1. Add environment variables to Vercel
2. Redeploy: `vercel --prod`

### Problem: Rate limiting not working

**Check:**
```bash
# Test with curl and check headers
curl -I https://news.arcane.group/api/auth/login

# Look for:
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 4
```

**Fix:**
1. Check Upstash dashboard (database active?)
2. Check Vercel logs for errors
3. Verify credentials are correct

---

## 📊 Monitoring

### Upstash Dashboard
```
URL: https://console.upstash.com/redis
Check: Commands/day, Storage, Bandwidth
```

### Vercel Logs
```bash
# Real-time logs
vercel logs --follow

# Filter for rate limiting
vercel logs | grep "ratelimit"
```

### Rate Limit Keys
```
Format: ratelimit:/api/auth/login:user@example.com
Location: Upstash Dashboard → Data Browser
```

---

## 💰 Usage Limits

### Free Tier
```
Commands: 10,000/day
Storage: 256 MB
Bandwidth: 1 GB/month
```

### Your Usage (Estimated)
```
Commands: ~300-1,500/day (3-15% of limit)
Storage: < 1 MB (< 1% of limit)
Bandwidth: < 10 MB/month (< 1% of limit)
```

**Verdict**: Free tier is perfect ✅

---

## 🔐 Security

### Rate Limit Configuration
```typescript
// In middleware/rateLimit.ts
maxAttempts: 5              // 5 attempts
windowMs: 15 * 60 * 1000    // 15 minutes
```

### Adjust Limits
```bash
# Edit .env.local
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

# Redeploy
vercel --prod
```

---

## 📚 Quick Links

| Resource | URL |
|----------|-----|
| Upstash Console | https://console.upstash.com/ |
| Upstash Docs | https://docs.upstash.com/redis |
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel KV Docs | https://vercel.com/docs/storage/vercel-kv |

---

## 🎯 Common Commands

### View Rate Limit Keys
```bash
# In Upstash dashboard
Data Browser → Search: ratelimit:*
```

### Clear Rate Limit
```bash
# Delete specific key
curl -X POST https://your-redis-name.upstash.io/del/ratelimit:login:user@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Key Expiration
```bash
# Get TTL (time to live)
curl -X POST https://your-redis-name.upstash.io/ttl/ratelimit:login:user@example.com \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Emergency Procedures

### Disable Rate Limiting (Emergency)
```bash
# Remove env vars from Vercel
vercel env rm UPSTASH_REDIS_REST_URL
vercel env rm UPSTASH_REDIS_REST_TOKEN

# Redeploy (will fall back to in-memory)
vercel --prod
```

### Re-enable Rate Limiting
```bash
# Add env vars back
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Redeploy
vercel --prod
```

---

## 📋 Checklist

### Setup
- [ ] Upstash account created
- [ ] Redis database created
- [ ] Credentials copied
- [ ] Added to Vercel
- [ ] Deployed to production

### Verification
- [ ] Logs show Upstash connection
- [ ] Rate limiting works (6th attempt blocked)
- [ ] Upstash dashboard shows keys
- [ ] No errors in logs

### Monitoring
- [ ] Upstash usage < 80%
- [ ] No connection errors
- [ ] Rate limit headers present
- [ ] Performance acceptable

---

**Time**: 15 minutes  
**Cost**: $0  
**Status**: Ready to implement ✅

