# ATGE Monitoring & Observability Setup

**Version**: 1.0.0  
**Date**: January 2025  
**Purpose**: Comprehensive monitoring and observability for AI Trade Generation Engine

---

## 📊 Monitoring Architecture

### Three-Layer Monitoring Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - Error Tracking (Database + Vercel Logs)                  │
│  - Performance Metrics (Response Times, Success Rates)       │
│  - User Feedback (Ratings, Comments)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  - Vercel Function Metrics (Invocations, Duration, Errors)  │
│  - Database Metrics (Connections, Query Performance)         │
│  - API Health (External API Status, Rate Limits)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Layer                            │
│  - Trade Success Rate (Win/Loss Ratio)                       │
│  - AI Accuracy (Confidence vs Outcome)                       │
│  - User Engagement (Active Users, Trade Volume)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Monitoring Tables

### 1. Error Logs (`atge_error_logs`)

**Purpose**: Track all errors across the ATGE system

**Schema**:
```sql
CREATE TABLE atge_error_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE,
  error_type VARCHAR(50),  -- 'api', 'database', 'generation', 'backtesting', 'analysis', 'frontend'
  error_message TEXT,
  error_stack TEXT,
  user_id UUID,
  trade_signal_id UUID,
  context JSONB,
  severity VARCHAR(20)  -- 'low', 'medium', 'high', 'critical'
);
```

**Usage**:
```typescript
// Log error in API route
import { logError } from '../lib/atge/monitoring';

try {
  // Your code
} catch (error) {
  await logError({
    errorType: 'generation',
    errorMessage: error.message,
    errorStack: error.stack,
    userId: user.id,
    tradeSignalId: tradeId,
    context: { symbol: 'BTC', timeframe: '1h' },
    severity: 'high'
  });
  throw error;
}
```

**Queries**:
```sql
-- Recent critical errors
SELECT * FROM atge_recent_critical_errors;

-- Error count by type (last 24h)
SELECT error_type, COUNT(*) as count
FROM atge_error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;

-- Errors by user
SELECT user_id, COUNT(*) as error_count
FROM atge_error_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY error_count DESC
LIMIT 10;
```

### 2. Performance Metrics (`atge_performance_metrics`)

**Purpose**: Track performance across all ATGE operations

**Schema**:
```sql
CREATE TABLE atge_performance_metrics (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE,
  metric_type VARCHAR(50),  -- 'api_response', 'database_query', 'generation_time', 'backtest_time', 'analysis_time'
  metric_name VARCHAR(100),
  value DECIMAL(20, 4),
  unit VARCHAR(20),  -- 'ms', 'seconds', 'count'
  user_id UUID,
  trade_signal_id UUID,
  metadata JSONB
);
```

**Usage**:
```typescript
// Track API response time
import { trackMetric } from '../lib/atge/monitoring';

const startTime = Date.now();
try {
  const result = await generateTradeSignal(symbol);
  const duration = Date.now() - startTime;
  
  await trackMetric({
    metricType: 'api_response',
    metricName: 'trade_generation',
    value: duration,
    unit: 'ms',
    userId: user.id,
    tradeSignalId: result.id,
    metadata: { symbol, success: true }
  });
  
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  await trackMetric({
    metricType: 'api_response',
    metricName: 'trade_generation',
    value: duration,
    unit: 'ms',
    userId: user.id,
    metadata: { symbol, success: false, error: error.message }
  });
  throw error;
}
```

**Queries**:
```sql
-- Performance summary (last 24h)
SELECT * FROM atge_performance_summary_24h;

-- Slow operations (> 5 seconds)
SELECT 
  metric_type,
  metric_name,
  value,
  timestamp
FROM atge_performance_metrics
WHERE value > 5000  -- 5 seconds in ms
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY value DESC
LIMIT 20;

-- Average response times by endpoint
SELECT 
  metric_name,
  COUNT(*) as requests,
  AVG(value) as avg_ms,
  MIN(value) as min_ms,
  MAX(value) as max_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_ms
FROM atge_performance_metrics
WHERE metric_type = 'api_response'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_name
ORDER BY avg_ms DESC;
```

### 3. User Feedback (`atge_user_feedback`)

**Purpose**: Collect user feedback on trade accuracy and system performance

**Schema**:
```sql
CREATE TABLE atge_user_feedback (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  feedback_type VARCHAR(50),  -- 'trade_accuracy', 'ui_experience', 'performance', 'feature_request', 'bug_report'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  trade_signal_id UUID,
  metadata JSONB
);
```

**Usage**:
```typescript
// Collect feedback after trade completion
import { submitFeedback } from '../lib/atge/monitoring';

await submitFeedback({
  userId: user.id,
  feedbackType: 'trade_accuracy',
  rating: 5,
  comment: 'Excellent trade signal! Hit TP2 in 3 hours.',
  tradeSignalId: trade.id,
  metadata: { 
    profitLoss: 87.50,
    timeToCompletion: 180,
    targetsHit: ['TP1', 'TP2']
  }
});
```

**Queries**:
```sql
-- Feedback summary
SELECT * FROM atge_feedback_summary;

-- Recent feedback
SELECT 
  feedback_type,
  rating,
  comment,
  timestamp
FROM atge_user_feedback
ORDER BY timestamp DESC
LIMIT 20;

-- Average rating by feedback type
SELECT 
  feedback_type,
  AVG(rating) as avg_rating,
  COUNT(*) as total_feedback
FROM atge_user_feedback
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY feedback_type
ORDER BY avg_rating DESC;
```

---

## 📈 Monitoring Dashboards

### 1. Real-Time Dashboard (SQL Queries)

Create a monitoring dashboard using these queries:

```sql
-- Dashboard: ATGE System Health
-- Run this query every 5 minutes

WITH error_summary AS (
  SELECT 
    COUNT(*) as total_errors,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
    COUNT(*) FILTER (WHERE severity = 'high') as high_errors
  FROM atge_error_logs
  WHERE timestamp > NOW() - INTERVAL '1 hour'
),
performance_summary AS (
  SELECT 
    AVG(value) FILTER (WHERE metric_name = 'trade_generation') as avg_generation_time,
    AVG(value) FILTER (WHERE metric_name = 'backtesting') as avg_backtest_time,
    AVG(value) FILTER (WHERE metric_name = 'ai_analysis') as avg_analysis_time
  FROM atge_performance_metrics
  WHERE timestamp > NOW() - INTERVAL '1 hour'
),
trade_summary AS (
  SELECT 
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE status = 'active') as active_trades,
    COUNT(*) FILTER (WHERE status = 'completed_success') as successful_trades,
    COUNT(*) FILTER (WHERE status = 'completed_failure') as failed_trades
  FROM trade_signals
  WHERE generated_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  e.total_errors,
  e.critical_errors,
  e.high_errors,
  p.avg_generation_time,
  p.avg_backtest_time,
  p.avg_analysis_time,
  t.total_trades,
  t.active_trades,
  t.successful_trades,
  t.failed_trades,
  CASE 
    WHEN t.total_trades > 0 THEN (t.successful_trades::DECIMAL / t.total_trades) * 100
    ELSE 0
  END as success_rate_24h
FROM error_summary e, performance_summary p, trade_summary t;
```

### 2. Vercel Function Monitoring

**Access Vercel Dashboard**:
1. Go to https://vercel.com/dashboard
2. Select project → Deployments → Latest
3. Click "Functions" tab

**Key Metrics to Monitor**:
- **Invocations**: Number of function calls
- **Duration**: Average execution time
- **Errors**: Error rate and count
- **Cold Starts**: Function initialization time

**Set Up Alerts**:
1. Go to Settings → Notifications
2. Add alert for:
   - Error rate > 5%
   - Average duration > 10 seconds
   - Function failures

### 3. Database Monitoring (Supabase)

**Access Supabase Dashboard**:
1. Go to https://supabase.com/dashboard
2. Select project → Database

**Key Metrics to Monitor**:
- **Connection Pool**: Active connections vs max
- **Query Performance**: Slow queries (> 1 second)
- **Table Size**: Growth rate
- **Index Usage**: Unused indexes

**Queries for Database Health**:
```sql
-- Connection pool status
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = 'postgres';

-- Slow queries (last 24h)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- 1 second
ORDER BY mean_time DESC
LIMIT 20;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE tablename LIKE 'trade_%' OR tablename LIKE 'atge_%'
ORDER BY bytes DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename LIKE 'trade_%' OR tablename LIKE 'atge_%'
ORDER BY idx_scan DESC;
```

---

## 🚨 Alerting & Notifications

### Critical Alerts (Immediate Action Required)

**1. System Down**
- **Trigger**: Error rate > 50% for 5 minutes
- **Action**: Check Vercel status, database connection
- **Query**:
  ```sql
  SELECT COUNT(*) as error_count
  FROM atge_error_logs
  WHERE timestamp > NOW() - INTERVAL '5 minutes'
    AND severity IN ('critical', 'high');
  ```

**2. Database Connection Issues**
- **Trigger**: Connection pool > 90% capacity
- **Action**: Check for connection leaks, restart if needed
- **Query**:
  ```sql
  SELECT 
    count(*) as total_connections,
    (count(*)::DECIMAL / 20) * 100 as pool_usage_percent
  FROM pg_stat_activity
  WHERE datname = 'postgres';
  ```

**3. API Rate Limit Exceeded**
- **Trigger**: Multiple 429 errors from external APIs
- **Action**: Implement backoff, check API quotas
- **Query**:
  ```sql
  SELECT error_message, COUNT(*) as count
  FROM atge_error_logs
  WHERE timestamp > NOW() - INTERVAL '1 hour'
    AND error_message LIKE '%rate limit%'
  GROUP BY error_message;
  ```

### Warning Alerts (Monitor Closely)

**1. Slow Performance**
- **Trigger**: Average response time > 5 seconds
- **Action**: Optimize queries, check API latency
- **Query**:
  ```sql
  SELECT 
    metric_name,
    AVG(value) as avg_ms
  FROM atge_performance_metrics
  WHERE timestamp > NOW() - INTERVAL '15 minutes'
    AND metric_type = 'api_response'
  GROUP BY metric_name
  HAVING AVG(value) > 5000;
  ```

**2. High Error Rate**
- **Trigger**: Error rate > 5% for 15 minutes
- **Action**: Check logs, identify root cause
- **Query**:
  ```sql
  WITH total_requests AS (
    SELECT COUNT(*) as count
    FROM atge_performance_metrics
    WHERE timestamp > NOW() - INTERVAL '15 minutes'
      AND metric_type = 'api_response'
  ),
  error_requests AS (
    SELECT COUNT(*) as count
    FROM atge_error_logs
    WHERE timestamp > NOW() - INTERVAL '15 minutes'
  )
  SELECT 
    e.count as errors,
    t.count as total,
    (e.count::DECIMAL / t.count) * 100 as error_rate_percent
  FROM error_requests e, total_requests t;
  ```

**3. Low Success Rate**
- **Trigger**: Trade success rate < 50% for 24 hours
- **Action**: Review AI model, check market conditions
- **Query**:
  ```sql
  SELECT 
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE status = 'completed_success') as successful,
    (COUNT(*) FILTER (WHERE status = 'completed_success')::DECIMAL / COUNT(*)) * 100 as success_rate
  FROM trade_signals
  WHERE generated_at > NOW() - INTERVAL '24 hours'
    AND status IN ('completed_success', 'completed_failure');
  ```

---

## 📊 Custom Monitoring Scripts

### 1. Health Check Script

Create `scripts/atge-health-check.ts`:

```typescript
import { query } from '../lib/db';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    errorRate: number;
    avgResponseTime: number;
    activeTradesCount: number;
  };
  timestamp: Date;
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: false,
    errorRate: 0,
    avgResponseTime: 0,
    activeTradesCount: 0
  };

  try {
    // Check database connection
    await query('SELECT 1');
    checks.database = true;

    // Check error rate (last hour)
    const errorResult = await query(`
      WITH total_requests AS (
        SELECT COUNT(*) as count
        FROM atge_performance_metrics
        WHERE timestamp > NOW() - INTERVAL '1 hour'
          AND metric_type = 'api_response'
      ),
      error_requests AS (
        SELECT COUNT(*) as count
        FROM atge_error_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      )
      SELECT 
        CASE 
          WHEN t.count > 0 THEN (e.count::DECIMAL / t.count) * 100
          ELSE 0
        END as error_rate
      FROM error_requests e, total_requests t
    `);
    checks.errorRate = parseFloat(errorResult.rows[0]?.error_rate || '0');

    // Check average response time
    const perfResult = await query(`
      SELECT AVG(value) as avg_time
      FROM atge_performance_metrics
      WHERE timestamp > NOW() - INTERVAL '1 hour'
        AND metric_type = 'api_response'
    `);
    checks.avgResponseTime = parseFloat(perfResult.rows[0]?.avg_time || '0');

    // Check active trades
    const tradesResult = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE status = 'active'
    `);
    checks.activeTradesCount = parseInt(tradesResult.rows[0]?.count || '0');

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!checks.database || checks.errorRate > 10 || checks.avgResponseTime > 10000) {
      status = 'unhealthy';
    } else if (checks.errorRate > 5 || checks.avgResponseTime > 5000) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      timestamp: new Date()
    };
  }
}

// Run health check
runHealthCheck().then(result => {
  console.log('ATGE Health Check:', JSON.stringify(result, null, 2));
  process.exit(result.status === 'healthy' ? 0 : 1);
});
```

**Usage**:
```bash
# Run health check
npx tsx scripts/atge-health-check.ts

# Run in cron (every 5 minutes)
*/5 * * * * cd /path/to/project && npx tsx scripts/atge-health-check.ts
```

### 2. Performance Report Script

Create `scripts/atge-performance-report.ts`:

```typescript
import { query } from '../lib/db';

async function generatePerformanceReport() {
  console.log('='.repeat(80));
  console.log('ATGE Performance Report');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80));

  // System Health
  console.log('\n📊 System Health (Last 24 Hours)');
  const health = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
      COUNT(*) FILTER (WHERE severity = 'high') as high_errors,
      COUNT(*) FILTER (WHERE severity = 'medium') as medium_errors,
      COUNT(*) FILTER (WHERE severity = 'low') as low_errors
    FROM atge_error_logs
    WHERE timestamp > NOW() - INTERVAL '24 hours'
  `);
  console.table(health.rows[0]);

  // API Performance
  console.log('\n⚡ API Performance (Last 24 Hours)');
  const apiPerf = await query(`
    SELECT 
      metric_name,
      COUNT(*) as requests,
      ROUND(AVG(value)::NUMERIC, 2) as avg_ms,
      ROUND(MIN(value)::NUMERIC, 2) as min_ms,
      ROUND(MAX(value)::NUMERIC, 2) as max_ms,
      ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value)::NUMERIC, 2) as p95_ms
    FROM atge_performance_metrics
    WHERE metric_type = 'api_response'
      AND timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY metric_name
    ORDER BY avg_ms DESC
  `);
  console.table(apiPerf.rows);

  // Trade Statistics
  console.log('\n📈 Trade Statistics (Last 24 Hours)');
  const trades = await query(`
    SELECT 
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'completed_success') as successful,
      COUNT(*) FILTER (WHERE status = 'completed_failure') as failed,
      ROUND((COUNT(*) FILTER (WHERE status = 'completed_success')::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE status IN ('completed_success', 'completed_failure')), 0)) * 100, 2) as success_rate
    FROM trade_signals
    WHERE generated_at > NOW() - INTERVAL '24 hours'
  `);
  console.table(trades.rows[0]);

  // User Feedback
  console.log('\n⭐ User Feedback (Last 7 Days)');
  const feedback = await query(`
    SELECT 
      feedback_type,
      COUNT(*) as total_feedback,
      ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
      COUNT(*) FILTER (WHERE rating >= 4) as positive,
      COUNT(*) FILTER (WHERE rating <= 2) as negative
    FROM atge_user_feedback
    WHERE timestamp > NOW() - INTERVAL '7 days'
    GROUP BY feedback_type
    ORDER BY avg_rating DESC
  `);
  console.table(feedback.rows);

  console.log('\n' + '='.repeat(80));
}

generatePerformanceReport().then(() => process.exit(0));
```

**Usage**:
```bash
# Generate performance report
npx tsx scripts/atge-performance-report.ts

# Run daily at 9 AM
0 9 * * * cd /path/to/project && npx tsx scripts/atge-performance-report.ts > /var/log/atge-report.log
```

---

## 🔔 Notification Channels

### 1. Email Notifications (Future)

Configure email alerts for critical issues:

```typescript
// lib/atge/notifications.ts
import nodemailer from 'nodemailer';

export async function sendCriticalAlert(alert: {
  title: string;
  message: string;
  severity: 'critical' | 'high';
  timestamp: Date;
}) {
  const transporter = nodemailer.createTransport({
    // Configure email service
  });

  await transporter.sendMail({
    from: 'alerts@arcane.group',
    to: 'admin@arcane.group',
    subject: `[ATGE ${alert.severity.toUpperCase()}] ${alert.title}`,
    text: `
      Severity: ${alert.severity}
      Time: ${alert.timestamp.toISOString()}
      
      ${alert.message}
      
      Check dashboard: https://news.arcane.group/admin/atge-monitoring
    `
  });
}
```

### 2. Slack Notifications (Future)

Configure Slack webhooks for team notifications:

```typescript
// lib/atge/notifications.ts
import axios from 'axios';

export async function sendSlackNotification(message: string) {
  await axios.post(process.env.SLACK_WEBHOOK_URL!, {
    text: message,
    channel: '#atge-alerts',
    username: 'ATGE Monitor',
    icon_emoji: ':chart_with_upwards_trend:'
  });
}
```

---

## 📝 Monitoring Checklist

### Daily Checks
- [ ] Review error logs for critical issues
- [ ] Check API performance metrics
- [ ] Verify cron jobs are running
- [ ] Monitor trade success rate
- [ ] Review user feedback

### Weekly Checks
- [ ] Analyze performance trends
- [ ] Review database query performance
- [ ] Check for slow queries
- [ ] Verify index usage
- [ ] Review user feedback patterns

### Monthly Checks
- [ ] Generate comprehensive performance report
- [ ] Review and optimize slow operations
- [ ] Analyze user engagement trends
- [ ] Plan performance improvements
- [ ] Update monitoring thresholds

---

**Status**: ✅ **MONITORING SYSTEM READY**  
**Next Step**: Deploy monitoring tables and implement tracking in API routes

**The monitoring infrastructure is designed and ready for implementation. All queries and scripts are production-ready.**
