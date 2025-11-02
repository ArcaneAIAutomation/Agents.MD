# Deploy UCIE to Production - Quick Guide

**Time Required**: 15 minutes  
**Status**: Ready to deploy immediately

---

## ✅ What's Already Done

- ✅ All code implemented and tested
- ✅ Database tables defined
- ✅ API endpoints created
- ✅ CI/CD pipeline configured
- ✅ Environment variables documented
- ✅ No TypeScript errors

---

## 🚀 3-Step Deployment

### Step 1: Run Database Migration (2 minutes)

Go to [Supabase SQL Editor](https://supabase.com/dashboard) and run:

```sql
-- Copy and paste from migrations/ucie_tables.sql
-- Or run this verification query to check if tables exist:

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'ucie_%';

-- Expected result: 5 tables
-- ucie_alerts
-- ucie_analysis_cache
-- ucie_analysis_history
-- ucie_api_costs
-- ucie_watchlist
```

If tables don't exist, run the full migration from `migrations/ucie_tables.sql`.

---

### Step 2: Deploy to Production (5 minutes)

```bash
# Commit and push
git add .
git commit -m "feat: Complete UCIE production deployment infrastructure"
git push origin main

# GitHub Actions will automatically:
# 1. Run linting and type checks
# 2. Run security tests
# 3. Run unit tests
# 4. Build the application
# 5. Deploy to Vercel production
# 6. Run smoke tests
```

Monitor deployment at: https://github.com/ArcaneAIAutomation/Agents.MD/actions

---

### Step 3: Verify Deployment (3 minutes)

```bash
# Test health check
curl https://news.arcane.group/api/ucie/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "apis": { ... }
  }
}

# Test metrics
curl https://news.arcane.group/api/ucie/metrics

# Expected: 200 OK with metrics data
```

---

## 🎯 What You Get

### New API Endpoints
1. **`GET /api/ucie/health`** - System health monitoring
2. **`GET /api/ucie/metrics`** - Usage analytics
3. **`GET /api/ucie/watchlist`** - Get user's watchlist
4. **`POST /api/ucie/watchlist`** - Add to watchlist
5. **`DELETE /api/ucie/watchlist?symbol=BTC`** - Remove from watchlist
6. **`GET /api/ucie/alerts`** - Get user's alerts
7. **`POST /api/ucie/alerts`** - Create alert
8. **`PATCH /api/ucie/alerts`** - Update alert
9. **`DELETE /api/ucie/alerts?alertId=UUID`** - Delete alert

### Database Functions
- Complete watchlist management
- Custom alert system
- Analysis history tracking
- API cost monitoring

---

## 📋 Post-Deployment Checklist

After deployment completes:

- [ ] Health check returns 200 OK
- [ ] Metrics endpoint returns data
- [ ] Database tables exist (5 tables)
- [ ] GitHub Actions workflow passed
- [ ] No errors in Vercel logs
- [ ] UCIE page loads successfully

---

## 🆘 Troubleshooting

### If health check fails:
```bash
# Check Vercel logs
vercel logs --prod

# Check database connection
# Go to Supabase dashboard and verify connection
```

### If deployment fails:
```bash
# Check GitHub Actions logs
# Go to: https://github.com/ArcaneAIAutomation/Agents.MD/actions

# Common issues:
# - TypeScript errors (already checked ✅)
# - Missing environment variables (already configured ✅)
# - Build errors (already tested ✅)
```

### If tables don't exist:
```bash
# Run migration script locally
npx tsx scripts/run-ucie-migration.ts

# Or manually run SQL in Supabase
```

---

## 🎉 Success!

Once all checks pass, UCIE is fully deployed with:
- ✅ Complete analysis engine
- ✅ Watchlist functionality
- ✅ Custom alerts
- ✅ Health monitoring
- ✅ Usage analytics
- ✅ Automated deployments

**Next**: Start using UCIE at https://news.arcane.group/ucie

---

**Questions?** Check `UCIE-DEPLOYMENT-IMPLEMENTATION-COMPLETE.md` for details.

**Last Updated**: January 27, 2025
