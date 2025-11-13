# ATGE Production Monitoring Guide

**Last Updated**: January 27, 2025  
**Status**: ✅ Complete  
**Version**: 1.0.0

---

## Overview

The AI Trade Generation Engine (ATGE) includes a comprehensive production monitoring system that tracks:
- **Error Tracking**: All errors with severity levels and context
- **API Performance**: Response times and slow operations
- **Database Performance**: Query times and trade statistics
- **User Feedback**: Ratings, comments, and feature requests

---

## Architecture

### Database Tables

#### 1. `atge_error_logs`
Stores all errors that occur in the system.

**Columns**:
- `id` (UUID) - Primary key
- `timestamp` (TIMESTAMP) - When error occurred
- `error_type` (VARCHAR) - Type: api, database, generation, backtesting, analysis, frontend
- `error_message` (TEXT) - Error message
- `error_stack` (TEXT) - Stack trace
- `user_id` (UUID) - User who encountered error (nullable)
- `trade_signal_id` (UUID) - Related trade signal (nullable)
- `context` (JSONB) - Additional context
- `severity` (VARCHAR) - Severity: low, medium, high, critical

**Indexes**:
- `idx_atge_error_logs_timestamp` - For time-based queries
- `idx_atge_error_logs_error_type` - For filtering by type
- `idx_atge_error_logs_severity` - For filtering by severity

#### 2. `atge_performance_metrics`
Stores performance measurements for all operations.

**Columns**:
- `id` (UUID) - Primary key
- `timestamp` (TIMESTAMP) - When metric was recorded
- `metric_type` (VARCHAR) - Type: api_response, database_query, generation_time, backtest_time, analysis_time
- `metric_name` (VARCHAR) - Name of operation
- `value` (DECIMAL) - Measured value
- `unit` (VARCHAR) - Unit: ms, seconds, count
- `user_id` (UUID) - User who triggered operation (nullable)
- `trade_signal_id` (UUID) - Related trade signal (nullable)
- `metadata` (JSONB) - Additional metadata

**Indexes**:
- `idx_atge_performance_metrics_timestamp` - For time-based queries
- `idx_atge_performance_metrics_metric_type` - For filtering by type
- `idx_atge_performance_metrics_value` - For finding slowest operations

#### 3. `atge_user_feedback`
Stores user feedback and ratings.

**Columns**:
- `id` (UUID) - Primary key
- `timestamp` (TIMESTAMP) - When feedback was submitted
- `user_id` (UUID) - User who submitted feedback
- `feedback_type` (VARCHAR) - Type: trade_accuracy, ui_experience, performance, feature_request, bug_report
- `rating` (INTEGER) - Rating 1-5 (nullable)
- `comment` (TEXT) - User comment (nullable)
- `trade_signal_id` (UUID) - Related trade signal (nullable)
- `metadata` (JSONB) - Additional metadata

**Indexes**:
- `idx_atge_user_feedback_timestamp` - For time-based queries
- `idx_atge_user_feedback_user_id` - For user-specific queries
- `idx_atge_user_feedback_feedback_type` - For filtering by type
- `idx_atge_user_feedback_rating` - For rating analysis

---

## API Endpoints

### 1. Get Monitoring Statistics

```
GET /api/atge/monitoring/stats?timeRange=24h
```

**Query Parameters**:
- `timeRange` (optional): '1h' | '24h' | '7d' | '30d' (default: '24h')

**Response**:
```json
{
  "success": true,
  "timeRange": "24h",
  "stats": {
    "errors": {
      "total": 15,
      "byType": {
        "api": 5,
        "database": 3,
        "generation": 7
      },
      "bySeverity": {
        "low": 8,
        "medium": 5,
        "high": 2,
        "critical": 0
      },
      "recentErrors": [...]
    },
    "performance": {
      "averageApiResponseTime": 245.5,
      "averageDatabaseQueryTime": 12.3,
      "averageGenerationTime": 8500.0,
      "averageBacktestTime": 15000.0,
      "averageAnalysisTime": 120000.0,
      "slowestOperations": [...]
    },
    "database": {
      "totalTrades": 1250,
      "activeTrades": 45,
      "completedTrades": 1205,
      "averageTradeSuccessRate": 67.5
    },
    "userFeedback": {
      "totalFeedback": 89,
      "averageRating": 4.2,
      "byType": {
        "trade_accuracy": 45,
        "ui_experience": 20,
        "performance": 15,
        "feature_request": 9
      },
      "recentFeedback": [...]
    }
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### 2. Submit User Feedback

```
POST /api/atge/monitoring/feedback
```

**Request Body**:
```json
{
  "feedbackType": "trade_accuracy",
  "rating": 5,
  "comment": "Great trade signal! Hit TP2 in 3 hours.",
  "tradeSignalId": "uuid-here",
  "metadata": {
    "profitPercentage": 8.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

---

## Monitoring Functions

### Error Tracking

```typescript
import { logError, trackError } from '../lib/atge/monitoring';

// Manual error logging
await logError({
  timestamp: new Date(),
  errorType: 'api',
  errorMessage: 'Failed to fetch market data',
  errorStack: error.stack,
  userId: 'user-uuid',
  context: { symbol: 'BTC', endpoint: '/api/market-data' },
  severity: 'high'
});

// Automatic error tracking wrapper
try {
  // Your code
} catch (error) {
  await trackError('api', error as Error, { symbol: 'BTC' }, 'high');
  throw error;
}
```

### Performance Tracking

```typescript
import { trackPerformance } from '../lib/atge/monitoring';

// Track performance of any async operation
const result = await trackPerformance(
  'fetch_market_data',
  'api_response',
  async () => {
    return await fetchMarketData('BTC');
  },
  { symbol: 'BTC', userId: 'user-uuid' }
);
```

### User Feedback

```typescript
import { logUserFeedback } from '../lib/atge/monitoring';

await logUserFeedback({
  timestamp: new Date(),
  userId: 'user-uuid',
  feedbackType: 'trade_accuracy',
  rating: 5,
  comment: 'Excellent trade signal!',
  tradeSignalId: 'trade-uuid'
});
```

---

## Monitoring Dashboard

### React Component

```typescript
import MonitoringDashboard from '../components/ATGE/MonitoringDashboard';

function AdminPage() {
  return (
    <div>
      <h1>ATGE Monitoring</h1>
      <MonitoringDashboard />
    </div>
  );
}
```

### Features

1. **Error Statistics**
   - Total errors by time range
   - Breakdown by error type
   - Breakdown by severity
   - Recent errors with details

2. **Performance Metrics**
   - Average API response time
   - Average database query time
   - Average generation time
   - Average backtesting time
   - Average analysis time
   - Slowest operations list

3. **Database Statistics**
   - Total trades
   - Active trades
   - Completed trades
   - Success rate

4. **User Feedback**
   - Total feedback count
   - Average rating
   - Breakdown by feedback type
   - Recent feedback with comments

---

## Alerting

### Critical Error Alerts

When a critical error occurs, the system can send alerts via:
- Email (implement with Resend/SendGrid)
- Slack (implement with Slack webhooks)
- PagerDuty (implement with PagerDuty API)

**Implementation**:
```typescript
// In lib/atge/monitoring.ts
async function sendCriticalErrorAlert(error: ErrorLog): Promise<void> {
  // TODO: Implement alert system
  // Example: Send email
  await sendEmail({
    to: 'admin@example.com',
    subject: '🚨 ATGE Critical Error',
    body: `
      Error Type: ${error.errorType}
      Message: ${error.errorMessage}
      Time: ${error.timestamp}
      User: ${error.userId}
      Trade: ${error.tradeSignalId}
    `
  });
}
```

---

## Performance Thresholds

### Recommended Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Response Time | > 500ms | > 1000ms |
| Database Query Time | > 100ms | > 500ms |
| Generation Time | > 15s | > 30s |
| Backtesting Time | > 30s | > 60s |
| Analysis Time | > 3min | > 5min |
| Error Rate | > 5% | > 10% |
| Success Rate | < 60% | < 50% |

### Monitoring Alerts

Set up alerts when metrics exceed thresholds:

```typescript
// Example: Check if API response time is too high
const stats = await getPerformanceStats('1h');
if (stats.averageApiResponseTime > 1000) {
  await sendAlert({
    severity: 'critical',
    message: `API response time is ${stats.averageApiResponseTime}ms (threshold: 1000ms)`
  });
}
```

---

## Database Maintenance

### Cleanup Old Data

To prevent database bloat, periodically clean up old monitoring data:

```sql
-- Delete error logs older than 90 days
DELETE FROM atge_error_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Delete performance metrics older than 30 days
DELETE FROM atge_performance_metrics 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Keep user feedback indefinitely (or set your own retention)
```

### Scheduled Cleanup Job

Create a cron job to run cleanup:

```typescript
// pages/api/cron/cleanup-monitoring-data.ts
export default async function handler(req, res) {
  // Verify CRON_SECRET
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Delete old data
  await query(`DELETE FROM atge_error_logs WHERE timestamp < NOW() - INTERVAL '90 days'`);
  await query(`DELETE FROM atge_performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days'`);

  return res.status(200).json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-monitoring-data",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Best Practices

### 1. Error Logging

- **Always log errors** with appropriate severity
- **Include context** (user ID, trade ID, symbol, etc.)
- **Log stack traces** for debugging
- **Don't log sensitive data** (passwords, API keys, etc.)

### 2. Performance Tracking

- **Track all critical operations** (API calls, database queries, AI generation)
- **Use consistent metric names** for easy analysis
- **Include metadata** for filtering and analysis
- **Don't track trivial operations** (simple calculations, etc.)

### 3. User Feedback

- **Make feedback easy** to submit
- **Encourage feedback** after trade completion
- **Respond to feedback** when appropriate
- **Use feedback** to improve the system

### 4. Monitoring Dashboard

- **Check daily** for critical errors
- **Review performance trends** weekly
- **Analyze user feedback** regularly
- **Set up alerts** for critical issues

---

## Troubleshooting

### High Error Rate

1. Check recent errors in monitoring dashboard
2. Identify common error types
3. Review error context and stack traces
4. Fix underlying issues
5. Deploy fixes and monitor

### Slow Performance

1. Check slowest operations in monitoring dashboard
2. Identify bottlenecks (API, database, AI)
3. Optimize slow operations
4. Add caching where appropriate
5. Monitor improvements

### Low Success Rate

1. Review failed trades in database
2. Analyze AI reasoning for failed trades
3. Check market conditions during failures
4. Adjust AI parameters if needed
5. Monitor success rate improvements

---

## Integration Checklist

- [x] Database tables created
- [x] Monitoring functions implemented
- [x] API endpoints created
- [x] React dashboard component created
- [x] Error tracking integrated into generate API
- [x] Performance tracking integrated into generate API
- [ ] Alert system implemented (email/Slack)
- [ ] Cleanup cron job configured
- [ ] Monitoring dashboard deployed
- [ ] Team trained on monitoring system

---

## Next Steps

1. **Run database migration** to create monitoring tables
2. **Deploy monitoring API endpoints** to production
3. **Integrate monitoring** into all ATGE functions
4. **Set up alerts** for critical errors
5. **Configure cleanup cron job** for data retention
6. **Train team** on monitoring dashboard usage
7. **Establish monitoring routine** (daily checks, weekly reviews)

---

**Status**: ✅ Monitoring System Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025

