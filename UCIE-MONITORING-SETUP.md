# UCIE Monitoring and Error Tracking Setup

## Overview

This document provides complete instructions for setting up production monitoring, error tracking, and analytics for the Universal Crypto Intelligence Engine (UCIE).

**Status**: 🟡 Ready for Setup  
**Priority**: Critical - Required for production observability  
**Tools**: Sentry (errors), Vercel Analytics (performance), Plausible (privacy-focused analytics)

---

## Monitoring Stack

### 1. **Sentry** - Error Tracking and Performance Monitoring
- Real-time error tracking
- Performance monitoring (Web Vitals)
- Release tracking
- User feedback
- **Cost**: Free tier (5,000 errors/month), Pro ($26/month for 50k errors)

### 2. **Vercel Analytics** - Web Vitals and Performance
- Core Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Geographic performance data
- **Cost**: Free with Vercel Pro ($20/month)

### 3. **Plausible Analytics** - Privacy-Focused User Analytics
- Page views and unique visitors
- Traffic sources and referrers
- No cookies, GDPR compliant
- **Cost**: $9/month (10k pageviews), $19/month (100k pageviews)

---

## Step 1: Set Up Sentry

### 1.1 Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up with GitHub or email
3. Create a new organization
4. Create a new project:
   - **Platform**: Next.js
   - **Project Name**: `ucie-production`
   - **Alert Frequency**: Real-time

### 1.2 Install Sentry SDK

```bash
npm install @sentry/nextjs
```

### 1.3 Initialize Sentry

Run the Sentry wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will create:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.js`

### 1.4 Configure Sentry

Update `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% in production (adjust based on traffic)
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', 'news.arcane.group'],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        // Ignore network errors
        if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
          return null;
        }
      }
    }
    return event;
  },
});
```

Update `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Server-specific configuration
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

### 1.5 Add Environment Variables

Add to `.env.local` and Vercel:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-name
SENTRY_PROJECT=ucie-production
```

---

## Step 2: Instrument UCIE Code

### 2.1 Add Error Tracking to API Routes

Update `pages/api/ucie/analyze/[symbol].ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  
  // Start Sentry transaction
  const transaction = Sentry.startTransaction({
    op: 'ucie.analyze',
    name: `Analyze ${symbol}`,
  });
  
  try {
    // Your analysis logic here
    const analysis = await fetchComprehensiveAnalysis(symbol as string);
    
    // Track success
    Sentry.addBreadcrumb({
      category: 'ucie',
      message: `Successfully analyzed ${symbol}`,
      level: 'info',
      data: {
        symbol,
        dataQualityScore: analysis.dataQualityScore,
      },
    });
    
    res.status(200).json(analysis);
  } catch (error) {
    // Capture error with context
    Sentry.captureException(error, {
      tags: {
        symbol: symbol as string,
        endpoint: 'analyze',
      },
      contexts: {
        analysis: {
          symbol,
          timestamp: new Date().toISOString(),
        },
      },
    });
    
    res.status(500).json({ error: 'Analysis failed' });
  } finally {
    transaction.finish();
  }
}
```

### 2.2 Add Performance Monitoring

Create `lib/ucie/monitoring.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

export function trackAPICall(
  apiName: string,
  operation: string,
  duration: number,
  success: boolean
) {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${apiName} ${operation}`,
    level: success ? 'info' : 'error',
    data: {
      apiName,
      operation,
      duration,
      success,
    },
  });
  
  // Track as metric
  Sentry.metrics.distribution('api.call.duration', duration, {
    tags: {
      api: apiName,
      operation,
      success: success.toString(),
    },
  });
}

export function trackCacheOperation(
  operation: 'get' | 'set' | 'invalidate',
  hit: boolean,
  latency: number
) {
  Sentry.metrics.distribution('cache.latency', latency, {
    tags: {
      operation,
      hit: hit.toString(),
    },
  });
}

export function trackAnalysisMetrics(
  symbol: string,
  duration: number,
  dataQualityScore: number,
  phase: string
) {
  Sentry.metrics.distribution('analysis.duration', duration, {
    tags: {
      symbol,
      phase,
    },
  });
  
  Sentry.metrics.gauge('analysis.quality_score', dataQualityScore, {
    tags: {
      symbol,
    },
  });
}
```

### 2.3 Add User Context

Update `components/auth/AuthProvider.tsx`:

```typescript
import * as Sentry from '@sentry/nextjs';

useEffect(() => {
  if (user) {
    // Set user context for Sentry
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}, [user]);
```

---

## Step 3: Set Up Vercel Analytics

### 3.1 Enable Vercel Analytics

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **Agents.MD**
3. Go to **Analytics** tab
4. Click **Enable Analytics**
5. Upgrade to Vercel Pro if needed ($20/month)

### 3.2 Add Analytics Component

Update `pages/_app.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### 3.3 Install Packages

```bash
npm install @vercel/analytics @vercel/speed-insights
```

---

## Step 4: Set Up Plausible Analytics

### 4.1 Create Plausible Account

1. Go to [https://plausible.io](https://plausible.io)
2. Sign up for an account
3. Add your website: `news.arcane.group`
4. Choose plan based on traffic

### 4.2 Add Plausible Script

Update `pages/_document.tsx`:

```typescript
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Plausible Analytics */}
        <script
          defer
          data-domain="news.arcane.group"
          src="https://plausible.io/js/script.js"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 4.3 Track Custom Events

```typescript
// Track UCIE analysis
declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, any> }) => void;
  }
}

export function trackUCIEAnalysis(symbol: string, duration: number) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('UCIE Analysis', {
      props: {
        symbol,
        duration,
      },
    });
  }
}
```

---

## Step 5: Create Monitoring Dashboard

### 5.1 Create Health Check Endpoint

Create `pages/api/ucie/health.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      redis: 'unknown',
      database: 'unknown',
      apis: {} as Record<string, string>,
    },
  };

  // Check Redis
  try {
    if (redis) {
      await redis.ping();
      checks.checks.redis = 'healthy';
    } else {
      checks.checks.redis = 'not_configured';
    }
  } catch (error) {
    checks.checks.redis = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check Database
  try {
    const { query } = await import('../../../lib/db');
    await query('SELECT 1');
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check API Keys
  const apiKeys = {
    caesar: process.env.CAESAR_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    etherscan: process.env.ETHERSCAN_API_KEY,
    lunarcrush: process.env.LUNARCRUSH_API_KEY,
    twitter: process.env.TWITTER_BEARER_TOKEN,
    coinglass: process.env.COINGLASS_API_KEY,
  };

  Object.entries(apiKeys).forEach(([name, key]) => {
    checks.checks.apis[name] = key ? 'configured' : 'missing';
    if (!key) checks.status = 'degraded';
  });

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
}
```

### 5.2 Create Metrics Endpoint

Create `pages/api/ucie/metrics.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get cache statistics
    const cacheStats = await query(`
      SELECT 
        COUNT(*) as total_cached,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cached,
        AVG(data_quality_score) as avg_quality_score
      FROM ucie_analysis_cache
    `);

    // Get watchlist statistics
    const watchlistStats = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_with_watchlist,
        COUNT(*) as total_watchlist_items,
        COUNT(DISTINCT symbol) as unique_symbols
      FROM ucie_watchlist
    `);

    // Get alert statistics
    const alertStats = await query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_alerts,
        COUNT(DISTINCT user_id) as users_with_alerts
      FROM ucie_alerts
    `);

    res.status(200).json({
      timestamp: new Date().toISOString(),
      cache: cacheStats.rows[0],
      watchlist: watchlistStats.rows[0],
      alerts: alertStats.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## Step 6: Configure Alerts

### 6.1 Sentry Alerts

1. Go to Sentry project settings
2. Click **Alerts** → **Create Alert Rule**
3. Create alerts for:

**High Error Rate Alert:**
- Condition: Error count > 10 in 5 minutes
- Action: Email team, Slack notification

**Performance Degradation Alert:**
- Condition: P95 response time > 5 seconds
- Action: Email team

**Critical Error Alert:**
- Condition: Any error with level "fatal"
- Action: Immediate email, SMS

### 6.2 Vercel Alerts

1. Go to Vercel project settings
2. Click **Notifications**
3. Enable:
   - Deployment failures
   - Performance degradation
   - Error rate spikes

### 6.3 Uptime Monitoring

Use a service like:
- **UptimeRobot** (free, 50 monitors)
- **Pingdom** (paid, advanced features)
- **Better Uptime** (modern, developer-friendly)

Monitor:
- `https://news.arcane.group/api/ucie/health` (every 5 minutes)
- `https://news.arcane.group/ucie` (every 5 minutes)

---

## Step 7: Create Monitoring Documentation

### 7.1 Runbook for Common Issues

Create `UCIE-RUNBOOK.md`:

```markdown
# UCIE Production Runbook

## Common Issues and Solutions

### Issue: High Error Rate

**Symptoms**: Sentry alert for >10 errors in 5 minutes

**Investigation**:
1. Check Sentry dashboard for error patterns
2. Check `/api/ucie/health` endpoint
3. Review Vercel function logs

**Solutions**:
- If API rate limit: Increase cache TTL
- If database timeout: Check Supabase status
- If Redis down: Restart Redis or use fallback

### Issue: Slow Performance

**Symptoms**: P95 response time >5 seconds

**Investigation**:
1. Check Vercel Analytics for slow endpoints
2. Check cache hit rate (should be >80%)
3. Review API response times

**Solutions**:
- Increase cache TTL for slow endpoints
- Optimize database queries
- Add more aggressive caching

### Issue: Cache Miss Rate High

**Symptoms**: Cache hit rate <50%

**Investigation**:
1. Check `/api/ucie/cache-stats`
2. Review cache TTL values
3. Check Redis memory usage

**Solutions**:
- Increase TTL for stable data
- Implement cache warming
- Increase Redis memory limit
```

---

## Success Criteria

- ✅ Sentry configured and tracking errors
- ✅ Vercel Analytics enabled
- ✅ Plausible Analytics tracking pageviews
- ✅ Health check endpoint working
- ✅ Metrics endpoint providing data
- ✅ Alerts configured for critical issues
- ✅ Monitoring dashboard accessible
- ✅ Runbook created for common issues

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Sentry | Pro (50k errors) | $26 |
| Vercel Analytics | Pro | $20 (included in Vercel Pro) |
| Plausible | 100k pageviews | $19 |
| UptimeRobot | Free | $0 |
| **Total** | | **$45/month** |

---

## Next Steps

1. ✅ **Complete this setup** (Task 20.3)
2. ⏳ **Create deployment pipeline** (Task 20.4)
3. ⏳ **Create user documentation** (Task 20.5)

---

**Last Updated**: January 27, 2025  
**Status**: 🟡 Ready for Implementation  
**Estimated Time**: 3-4 hours  
**Priority**: Critical
