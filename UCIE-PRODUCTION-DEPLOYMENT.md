# UCIE Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Universal Crypto Intelligence Engine (UCIE) to production on Vercel.

**Status**: 🟡 Ready for Deployment  
**Last Updated**: January 2025  
**Target Environment**: Vercel Production (news.arcane.group)

---

## Pre-Deployment Checklist

### ✅ Environment Configuration

- [x] All API keys configured in `.env.local`
- [x] API keys documented in `UCIE-VERCEL-ENV-SETUP.md`
- [ ] All API keys added to Vercel environment variables
- [ ] Redis (Upstash) configured for production caching
- [ ] Supabase production database tables created
- [ ] Monitoring tools configured (Sentry, LogRocket)

### ✅ Code Quality

- [x] All UCIE components built and tested
- [x] Security tests passing (`__tests__/security/ucie-security.test.ts`)
- [ ] Unit tests written for core utilities
- [ ] Integration tests passing
- [ ] Performance tests completed
- [ ] Mobile optimization verified

### ✅ Documentation

- [x] API integration guide created
- [x] Environment setup documented
- [ ] User guide written
- [ ] Developer documentation complete
- [ ] Troubleshooting guide created

---

## Step 1: Configure Production Environment Variables

### 1.1 Navigate to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **Agents.MD**
3. Go to **Settings** → **Environment Variables**

### 1.2 Add Critical API Keys

Copy all variables from `UCIE-VERCEL-ENV-SETUP.md` and add them to Vercel:

**Blockchain Explorer APIs:**
```bash
ETHERSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2
BSCSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2
POLYGONSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2
```

**Social Sentiment APIs:**
```bash
LUNARCRUSH_API_KEY=r1pe78gm2tohk3mwp36cqj7hvmhhln82d856ck5
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAABfK5AEAAAAARfdLBBxO4WpoP6xWSbcwIGL%2Flg8%3Da6P1toyhhdev46d9AzsgAVt5WvSfPK9zuqD8wjWEpFoiJQlWar
TWITTER_ACCESS_TOKEN=3082600481-KsTyOVdM2xPNDY6cmoLkyZ5scuBagcuxt6VtSdg
TWITTER_ACCESS_TOKEN_SECRET=26BlLFspdcoSBAgmJlgYLhkeZDrL5qYhOrtwN56bScNZ9
```

**Derivatives APIs:**
```bash
COINGLASS_API_KEY=84f2fb0a47f54d00a5108047a098dd74
```

**Configuration Settings:**
```bash
# UCIE Feature Flags
ENABLE_UCIE=true
UCIE_CACHE_TTL=300
UCIE_MAX_CONCURRENT_REQUESTS=10

# Caesar Configuration
CAESAR_COMPUTE_UNITS_DEFAULT=2
CAESAR_MAX_TIMEOUT=600000
```

### 1.3 Verify Existing Variables

Ensure these are already configured:
- ✅ `OPENAI_API_KEY`
- ✅ `CAESAR_API_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `COINMARKETCAP_API_KEY`
- ✅ `COINGECKO_API_KEY`
- ✅ `NEWS_API_KEY`
- ✅ `DATABASE_URL`
- ✅ `KV_REST_API_URL` (Redis)
- ✅ `KV_REST_API_TOKEN` (Redis)

---

## Step 2: Set Up Production Caching (Redis)

### 2.1 Verify Upstash Redis Configuration

The Redis instance is already configured:

```bash
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
```

### 2.2 Test Redis Connection

Create a test script to verify Redis is working:

```typescript
// scripts/test-redis-connection.ts
import { kv } from '@vercel/kv';

async function testRedis() {
  try {
    // Test write
    await kv.set('ucie:test', 'Hello UCIE', { ex: 60 });
    
    // Test read
    const value = await kv.get('ucie:test');
    console.log('✅ Redis connection successful:', value);
    
    // Test delete
    await kv.del('ucie:test');
    console.log('✅ Redis operations working');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

testRedis();
```

Run: `npx tsx scripts/test-redis-connection.ts`

### 2.3 Configure Cache TTL Values

Update `lib/ucie/cache.ts` with production TTL values:

```typescript
export const CACHE_TTL = {
  MARKET_DATA: 30,        // 30 seconds
  TECHNICAL: 60,          // 1 minute
  NEWS: 300,              // 5 minutes
  SENTIMENT: 300,         // 5 minutes
  ON_CHAIN: 300,          // 5 minutes
  DERIVATIVES: 300,       // 5 minutes
  DEFI: 3600,             // 1 hour
  RESEARCH: 86400,        // 24 hours
  PREDICTIONS: 3600,      // 1 hour
  RISK: 3600,             // 1 hour
};
```

---

## Step 3: Set Up Production Database

### 3.1 Create UCIE Database Tables

Run the migration script to create UCIE-specific tables:

```sql
-- migrations/ucie_tables.sql

-- Analysis cache table
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  data JSONB NOT NULL,
  data_quality_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT ucie_analysis_cache_symbol_key UNIQUE (symbol)
);

CREATE INDEX idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
CREATE INDEX idx_ucie_cache_expires ON ucie_analysis_cache(expires_at);

-- Watchlist table
CREATE TABLE IF NOT EXISTS ucie_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ucie_watchlist_user_symbol_key UNIQUE (user_id, symbol)
);

CREATE INDEX idx_ucie_watchlist_user ON ucie_watchlist(user_id);
CREATE INDEX idx_ucie_watchlist_symbol ON ucie_watchlist(symbol);

-- Alerts table
CREATE TABLE IF NOT EXISTS ucie_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'sentiment_change', 'whale_tx'
  threshold DECIMAL,
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ucie_alerts_user ON ucie_alerts(user_id);
CREATE INDEX idx_ucie_alerts_symbol ON ucie_alerts(symbol);
CREATE INDEX idx_ucie_alerts_enabled ON ucie_alerts(enabled);

-- Cost tracking table
CREATE TABLE IF NOT EXISTS ucie_api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  symbol VARCHAR(10)
);

CREATE INDEX idx_ucie_costs_api ON ucie_api_costs(api_name);
CREATE INDEX idx_ucie_costs_timestamp ON ucie_api_costs(timestamp);
CREATE INDEX idx_ucie_costs_user ON ucie_api_costs(user_id);

-- Analysis history table
CREATE TABLE IF NOT EXISTS ucie_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  symbol VARCHAR(10) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  data_quality_score INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ucie_history_user ON ucie_analysis_history(user_id);
CREATE INDEX idx_ucie_history_symbol ON ucie_analysis_history(symbol);
CREATE INDEX idx_ucie_history_created ON ucie_analysis_history(created_at);
```

### 3.2 Run Migration

```bash
npx tsx scripts/run-ucie-migration.ts
```

### 3.3 Verify Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ucie_%';
```

Expected output:
- `ucie_analysis_cache`
- `ucie_watchlist`
- `ucie_alerts`
- `ucie_api_costs`
- `ucie_analysis_history`

---

## Step 4: Configure Monitoring & Error Tracking

### 4.1 Set Up Sentry (Error Tracking)

1. Create Sentry account at https://sentry.io
2. Create new project: "UCIE Production"
3. Get DSN from project settings
4. Add to Vercel environment variables:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=ucie-v1.0.0
```

5. Install Sentry SDK:

```bash
npm install @sentry/nextjs
```

6. Initialize Sentry in `pages/_app.tsx`:

```typescript
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}
```

### 4.2 Set Up Performance Monitoring

Add Web Vitals tracking:

```typescript
// lib/ucie/monitoring.ts
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    });
  }
}
```

### 4.3 Set Up API Cost Tracking

The cost tracking utility is already implemented in `lib/ucie/costTracking.ts`. Verify it's being called in all API routes.

### 4.4 Create Monitoring Dashboard

Add environment variables for monitoring:

```bash
# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_ENDPOINT=/api/analytics/track

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
WEB_VITALS_ENDPOINT=/api/analytics/web-vitals

# Cost Tracking
ENABLE_COST_TRACKING=true
COST_ALERT_THRESHOLD=500
```

---

## Step 5: Update Vercel Configuration

### 5.1 Update `vercel.json`

Add UCIE-specific configuration:

```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    },
    "pages/api/ucie/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/ucie/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=300, stale-while-revalidate=600"
        }
      ]
    }
  ]
}
```

### 5.2 Configure CDN for Static Assets

Ensure static assets are optimized:

```json
{
  "images": {
    "domains": ["news.arcane.group"],
    "formats": ["image/avif", "image/webp"],
    "minimumCacheTTL": 86400
  }
}
```

---

## Step 6: Pre-Deployment Testing

### 6.1 Run All Tests

```bash
# Security tests
npm test -- __tests__/security/ucie-security.test.ts

# Unit tests (when implemented)
npm test -- __tests__/ucie/

# Integration tests (when implemented)
npm test -- __tests__/integration/ucie/
```

### 6.2 Test API Endpoints Locally

```bash
# Start development server
npm run dev

# Test UCIE health endpoint
curl http://localhost:3000/api/ucie/health

# Test analysis endpoint
curl http://localhost:3000/api/ucie/analyze/BTC
```

### 6.3 Verify Environment Variables

```bash
npm run validate:ucie-keys
```

Expected output:
```
✅ All critical UCIE API keys configured
✅ Redis connection successful
✅ Database connection successful
✅ Caesar API key valid
```

---

## Step 7: Deploy to Production

### 7.1 Commit and Push Changes

```bash
git add .
git commit -m "🚀 UCIE: Production deployment ready"
git push origin main
```

### 7.2 Monitor Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **Agents.MD** project
3. Go to **Deployments** tab
4. Watch deployment progress
5. Check build logs for errors

### 7.3 Verify Deployment

Once deployed, test production endpoints:

```bash
# Health check
curl https://news.arcane.group/api/ucie/health

# Test analysis (replace with actual token)
curl https://news.arcane.group/api/ucie/analyze/BTC
```

---

## Step 8: Post-Deployment Verification

### 8.1 Smoke Tests

Run critical path tests:

1. ✅ UCIE search page loads
2. ✅ Token search autocomplete works
3. ✅ Analysis page loads for BTC
4. ✅ Market data displays correctly
5. ✅ Technical indicators calculate
6. ✅ News feed loads
7. ✅ Export functionality works

### 8.2 Performance Verification

Check performance metrics:

1. ✅ Initial page load < 2 seconds
2. ✅ Complete analysis < 15 seconds
3. ✅ Cache hit rate > 80%
4. ✅ API success rate > 99%

### 8.3 Monitor Error Rates

Check Sentry dashboard for:
- Error rate < 1%
- No critical errors
- Response times within targets

---

## Step 9: Enable UCIE in Production

### 9.1 Add UCIE to Navigation

Update `components/Header.tsx` to include UCIE link:

```typescript
<Link href="/ucie" className="nav-link">
  UCIE
</Link>
```

### 9.2 Update Mobile Menu

Add UCIE to hamburger menu in `components/Navigation.tsx`.

### 9.3 Create Landing Page Banner

Add announcement banner to homepage promoting UCIE.

---

## Rollback Plan

If issues occur after deployment:

### Option 1: Instant Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find previous stable deployment
3. Click **...** → **Promote to Production**

### Option 2: Disable UCIE

Set environment variable:

```bash
ENABLE_UCIE=false
```

Then redeploy.

### Option 3: Emergency Fix

1. Fix issue locally
2. Test thoroughly
3. Deploy hotfix:

```bash
git add .
git commit -m "🔥 HOTFIX: [description]"
git push origin main
```

---

## Monitoring Checklist (First 24 Hours)

- [ ] Check error rates every hour
- [ ] Monitor API costs
- [ ] Verify cache hit rates
- [ ] Check response times
- [ ] Monitor user feedback
- [ ] Review Sentry errors
- [ ] Check database performance
- [ ] Verify Redis is working
- [ ] Monitor API rate limits

---

## Success Metrics

### Day 1 Targets
- ✅ Zero critical errors
- ✅ < 1% error rate
- ✅ 95%+ uptime
- ✅ < 15s average analysis time
- ✅ 10+ successful analyses

### Week 1 Targets
- ✅ 100+ unique analyses
- ✅ 50+ unique tokens analyzed
- ✅ 99%+ uptime
- ✅ < 0.5% error rate
- ✅ Positive user feedback

### Month 1 Targets
- ✅ 1,000+ analyses
- ✅ 500+ unique tokens
- ✅ 99.9%+ uptime
- ✅ 4.5+ star rating
- ✅ Featured in crypto media

---

## Troubleshooting

### Issue: API Keys Not Working

**Symptoms**: 401 errors, missing data

**Solution**:
1. Verify keys in Vercel dashboard
2. Check key format (no extra spaces)
3. Verify rate limits not exceeded
4. Check API provider status

### Issue: Slow Response Times

**Symptoms**: Analysis takes > 15 seconds

**Solution**:
1. Check Redis cache hit rate
2. Verify API timeouts are appropriate
3. Check database query performance
4. Review Vercel function logs

### Issue: High Error Rates

**Symptoms**: > 1% error rate

**Solution**:
1. Check Sentry for error patterns
2. Review API fallback mechanisms
3. Verify database connections
4. Check Redis availability

---

## Next Steps After Deployment

1. **Monitor Performance**: Watch metrics for first 24 hours
2. **Gather Feedback**: Collect user feedback and bug reports
3. **Optimize**: Identify and fix bottlenecks
4. **Document**: Update documentation based on real usage
5. **Plan Phase 2**: Prioritize next features based on feedback

---

**Deployment Status**: 🟡 Ready for Production  
**Last Updated**: January 2025  
**Next Review**: After deployment complete
