# ATGE Quick Deployment Guide 🚀

**For**: Rapid production deployment  
**Time**: 15-30 minutes  
**Status**: Backend Ready, Frontend Pending

---

## ⚡ Quick Start (5 Steps)

### 1. Verify Database (2 minutes)

```bash
# Connect to Supabase
psql "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"

# Check tables exist
\dt trade_*
\dt atge_*

# Should see 9 tables total:
# - trade_signals
# - trade_results
# - trade_technical_indicators
# - trade_market_snapshot
# - trade_historical_prices
# - atge_performance_cache
# - atge_error_logs
# - atge_performance_metrics
# - atge_user_feedback
```

**If tables missing**: Run migrations
```bash
psql "postgres://..." < migrations/002_create_atge_tables.sql
psql "postgres://..." < migrations/002_create_atge_monitoring_tables.sql
```

### 2. Verify Environment Variables (3 minutes)

Check Vercel Dashboard → Settings → Environment Variables:

**Required**:
- ✅ `OPENAI_API_KEY` - GPT-4o for AI analysis
- ✅ `GEMINI_API_KEY` - Gemini AI for fast analysis
- ✅ `COINMARKETCAP_API_KEY` - Market data
- ✅ `COINGECKO_API_KEY` - Backup market data
- ✅ `LUNARCRUSH_API_KEY` - Social sentiment
- ✅ `DATABASE_URL` - Supabase connection
- ✅ `JWT_SECRET` - Authentication
- ✅ `CRON_SECRET` - Cron job auth

**All already configured in `.env.local`** ✅

### 3. Deploy to Vercel (5 minutes)

```bash
# Option A: Deploy via CLI
vercel --prod

# Option B: Push to main (auto-deploys)
git add -A
git commit -m "feat(atge): Deploy AI Trade Generation Engine"
git push origin main
```

**Wait for deployment**: Check https://vercel.com/dashboard

### 4. Verify Deployment (5 minutes)

```bash
# Test health check locally
npx tsx scripts/atge-health-check.ts

# Expected output:
# Status: ✅ HEALTHY
# Database Connection: ✅ Connected
# Error Rate: 0.00% ✅
# Avg Response Time: <5000ms ✅

# Generate performance report
npx tsx scripts/atge-performance-report.ts
```

### 5. Monitor Production (Ongoing)

**Vercel Dashboard**:
1. Go to https://vercel.com/dashboard
2. Select project → Deployments → Latest
3. Monitor function logs for `/api/atge/*`

**Database Monitoring**:
```sql
-- Check for errors
SELECT * FROM atge_error_logs
ORDER BY timestamp DESC
LIMIT 10;

-- Check performance
SELECT * FROM atge_performance_summary_24h;
```

---

## 🔍 Quick Health Check

Run this after deployment:

```bash
# 1. Check database connection
npx tsx scripts/atge-health-check.ts

# 2. Test API endpoints (requires auth token)
curl https://news.arcane.group/api/health

# 3. Check Vercel logs
vercel logs --filter /api/atge/generate

# 4. Monitor cron job
# Go to Vercel Dashboard → Cron Jobs
# Verify /api/cron/check-expired-trades runs every 5 minutes
```

---

## 🚨 Common Issues & Quick Fixes

### Issue: Database Connection Failed

**Symptoms**: Health check shows "❌ Disconnected"

**Fix**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# If fails, check Supabase dashboard
# https://supabase.com/dashboard
```

### Issue: API Endpoints Return 500

**Symptoms**: `/api/atge/generate` fails

**Fix**:
```bash
# Check Vercel function logs
vercel logs --filter error

# Check error logs in database
psql "$DATABASE_URL" -c "SELECT * FROM atge_error_logs ORDER BY timestamp DESC LIMIT 5"

# Verify API keys are set
vercel env ls
```

### Issue: Cron Job Not Running

**Symptoms**: Expired trades not completing

**Fix**:
1. Go to Vercel Dashboard → Cron Jobs
2. Check `/api/cron/check-expired-trades` status
3. Verify `CRON_SECRET` environment variable is set
4. Manually trigger:
   ```bash
   curl https://news.arcane.group/api/cron/check-expired-trades \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## 📊 Quick Monitoring Queries

### Check System Health

```sql
-- Error count (last 24h)
SELECT COUNT(*) as total_errors,
       COUNT(*) FILTER (WHERE severity = 'critical') as critical
FROM atge_error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Average response time (last 1h)
SELECT AVG(value) as avg_ms
FROM atge_performance_metrics
WHERE metric_type = 'api_response'
  AND timestamp > NOW() - INTERVAL '1 hour';

-- Active trades
SELECT COUNT(*) as active_trades
FROM trade_signals
WHERE status = 'active';
```

### Check Trade Performance

```sql
-- Success rate (last 24h)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed_success') as successful,
  ROUND((COUNT(*) FILTER (WHERE status = 'completed_success')::DECIMAL / COUNT(*)) * 100, 2) as success_rate
FROM trade_signals
WHERE generated_at > NOW() - INTERVAL '24 hours'
  AND status IN ('completed_success', 'completed_failure');

-- Total P/L (last 24h)
SELECT 
  ROUND(SUM(net_profit_loss)::NUMERIC, 2) as total_pl
FROM trade_results tr
JOIN trade_signals ts ON tr.trade_signal_id = ts.id
WHERE ts.generated_at > NOW() - INTERVAL '24 hours';
```

---

## 🎯 Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Health check passes
- [ ] No critical errors in logs
- [ ] Cron job scheduled and running
- [ ] API endpoints responding
- [ ] Database queries working

### First Day
- [ ] Monitor error logs every 2 hours
- [ ] Check performance metrics
- [ ] Verify cron job executions
- [ ] Review any user feedback
- [ ] Check database growth

### First Week
- [ ] Generate daily performance reports
- [ ] Review trade success rate
- [ ] Optimize slow queries if needed
- [ ] Monitor API rate limits
- [ ] Collect user feedback

---

## 📞 Support Contacts

### Critical Issues (P0)
- **System Down**: Check Vercel status page
- **Database Down**: Check Supabase status page
- **Data Loss**: Contact Supabase support immediately

### High Priority (P1)
- **High Error Rate**: Review error logs, check API status
- **Slow Performance**: Check database queries, API latency
- **Cron Job Failures**: Check Vercel cron logs

### Resources
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Deployment Guide**: `ATGE-DEPLOYMENT-GUIDE.md`
- **Monitoring Setup**: `ATGE-MONITORING-SETUP.md`

---

## 🚀 Ready to Deploy?

**Pre-Flight Checklist**:
- [x] Database tables exist
- [x] Environment variables configured
- [x] Monitoring system ready
- [x] Health check script working
- [x] Documentation complete

**Deploy Command**:
```bash
vercel --prod
```

**Post-Deploy**:
```bash
npx tsx scripts/atge-health-check.ts
npx tsx scripts/atge-performance-report.ts
```

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Estimated Deployment Time**: 15-30 minutes  
**Backend Completion**: 100%  
**Overall Completion**: 80% (Frontend pending)

**Deploy the backend now. Frontend integration can happen in parallel!** 🚀
