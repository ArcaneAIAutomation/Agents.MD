# UCIE Deployment - Quick Start Guide

## 🚀 Fast Track to Production

This is your quick reference for deploying UCIE to production. For detailed instructions, see the individual setup guides.

---

## 📋 Prerequisites

- ✅ Vercel account with Pro plan ($20/month)
- ✅ Supabase PostgreSQL database (already configured)
- ✅ GitHub repository with Actions enabled
- ✅ All API keys configured (see `UCIE-VERCEL-ENV-SETUP.md`)

---

## ⚡ 30-Minute Setup

### Step 1: Upstash Redis (5 minutes)

```bash
# 1. Go to https://upstash.com and create account
# 2. Create database: "ucie-production-cache"
# 3. Copy REST API credentials
# 4. Add to Vercel environment variables:

UPSTASH_REDIS_REST_URL=https://redis-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AaBbCcDd...
UCIE_CACHE_ENABLED=true
UCIE_CACHE_DEFAULT_TTL=300
```

### Step 2: Database Tables (10 minutes)

```bash
# 1. Go to Supabase SQL Editor
# 2. Copy SQL from UCIE-PRODUCTION-DATABASE-SETUP.md
# 3. Run migration script
# 4. Verify tables created:

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'ucie_%';

# Expected: ucie_analysis_cache, ucie_watchlist, ucie_alerts
```

### Step 3: Monitoring (10 minutes)

```bash
# 1. Create Sentry account at https://sentry.io
# 2. Create project: "ucie-production"
# 3. Install Sentry:

npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs

# 4. Add to Vercel:
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# 5. Enable Vercel Analytics in dashboard
# 6. Add Plausible script to _document.tsx
```

### Step 4: GitHub Actions (5 minutes)

```bash
# 1. Copy workflows from UCIE-DEPLOYMENT-PIPELINE.md
# 2. Create .github/workflows/ directory
# 3. Add pr-checks.yml and deploy.yml
# 4. Add GitHub secrets:

VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
SLACK_WEBHOOK=... (optional)
```

---

## 🧪 Testing (15 minutes)

```bash
# 1. Test cache
curl http://localhost:3000/api/ucie/cache-test

# 2. Test database
curl -X POST http://localhost:3000/api/ucie/watchlist \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"symbol":"BTC"}'

# 3. Test health check
curl http://localhost:3000/api/ucie/health

# 4. Test full analysis
curl http://localhost:3000/api/ucie/analyze/BTC
```

---

## 🚢 Deploy (5 minutes)

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Add UCIE production infrastructure"
git push origin main

# 2. Vercel auto-deploys
# 3. Monitor deployment in Vercel dashboard
# 4. Verify health checks pass:

curl https://news.arcane.group/api/ucie/health
```

---

## ✅ Post-Deployment Checklist

- [ ] Health check returns 200
- [ ] Cache is working (check Redis dashboard)
- [ ] Database tables accessible
- [ ] Sentry receiving events
- [ ] Vercel Analytics tracking
- [ ] GitHub Actions workflows active
- [ ] All API keys working
- [ ] UCIE page loads successfully
- [ ] Analysis completes in <15 seconds
- [ ] No errors in Sentry

---

## 📚 Full Documentation

| Document | Purpose | Time |
|----------|---------|------|
| `UCIE-PRODUCTION-CACHE-SETUP.md` | Redis caching | 2-3 hours |
| `UCIE-PRODUCTION-DATABASE-SETUP.md` | Database tables | 1-2 hours |
| `UCIE-MONITORING-SETUP.md` | Error tracking | 3-4 hours |
| `UCIE-DEPLOYMENT-PIPELINE.md` | CI/CD pipeline | 2-3 hours |
| `UCIE-USER-GUIDE.md` | User documentation | Reference |
| `UCIE-DEPLOYMENT-COMPLETE.md` | Complete overview | Reference |

---

## 🆘 Quick Troubleshooting

### Cache not working
```bash
# Check Redis connection
curl https://news.arcane.group/api/ucie/cache-stats

# Verify environment variables
echo $UPSTASH_REDIS_REST_URL
```

### Database errors
```bash
# Check tables exist
SELECT * FROM ucie_analysis_cache LIMIT 1;

# Check connection
SELECT 1;
```

### Deployment fails
```bash
# Check Vercel logs
vercel logs

# Check GitHub Actions
# Go to Actions tab in GitHub
```

### High error rate
```bash
# Check Sentry dashboard
# Review error patterns
# Check API key status
```

---

## 💰 Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| Upstash Redis | $1.25 |
| Sentry | $26.00 |
| Plausible | $19.00 |
| API Keys | $319.00 |
| **Total** | **$365.25** |

---

## 📞 Support

- **Documentation**: See individual setup guides
- **Issues**: GitHub Issues
- **Email**: support@arcane.group
- **Discord**: [Join community](https://discord.gg/arcane)

---

## 🎯 Success Criteria

- ✅ All services configured
- ✅ Health checks passing
- ✅ Cache hit rate >80%
- ✅ Analysis time <15s
- ✅ Error rate <1%
- ✅ Uptime >99.9%

---

**Ready to deploy? Start with Step 1!** 🚀

**Last Updated**: January 27, 2025
