# ATGE Monitoring - Quick Reference

**Quick access guide for production monitoring**

---

## 🚀 Quick Start

### 1. Run Database Migration
```bash
npx tsx scripts/run-atge-monitoring-migration.ts
```

### 2. Access Monitoring Dashboard
```
https://your-domain.com/admin/atge-monitoring
```

### 3. Check API Endpoints
```bash
# Get monitoring stats
curl https://your-domain.com/api/atge/monitoring/stats?timeRange=24h

# Submit feedback
curl -X POST https://your-domain.com/api/atge/monitoring/feedback \
  -H "Content-Type: application/json" \
  -d '{"feedbackType":"trade_accuracy","rating":5}'
```

---

## 📊 Key Metrics

### Error Tracking
- **Total Errors**: Count of all errors in time range
- **Critical Errors**: Errors requiring immediate attention
- **Error Types**: api, database, generation, backtesting, analysis, frontend
- **Severity Levels**: low, medium, high, critical

### Performance Metrics
- **API Response Time**: < 500ms (good), < 1000ms (acceptable)
- **Database Query Time**: < 100ms (good), < 500ms (acceptable)
- **Generation Time**: < 15s (good), < 30s (acceptable)
- **Backtesting Time**: < 30s (good), < 60s (acceptable)
- **Analysis Time**: < 3min (good), < 5min (acceptable)

### Database Statistics
- **Total Trades**: All trades ever generated
- **Active Trades**: Trades currently within timeframe
- **Completed Trades**: Trades that have been backtested
- **Success Rate**: % of trades that hit profit targets

### User Feedback
- **Average Rating**: 1-5 stars
- **Feedback Types**: trade_accuracy, ui_experience, performance, feature_request, bug_report

---

## 🔧 Common Tasks

### Check Recent Errors
```typescript
import { getRecentErrors } from '../lib/atge/monitoring';

const errors = await getRecentErrors(10);
console.log(errors);
```

### Track Performance
```typescript
import { trackPerformance } from '../lib/atge/monitoring';

const result = await trackPerformance(
  'operation_name',
  'api_response',
  async () => {
    // Your operation
  }
);
```

### Log Error
```typescript
import { trackError } from '../lib/atge/monitoring';

try {
  // Your code
} catch (error) {
  await trackError('api', error as Error, { context: 'data' }, 'high');
}
```

### Submit Feedback
```typescript
import { logUserFeedback } from '../lib/atge/monitoring';

await logUserFeedback({
  timestamp: new Date(),
  userId: 'user-uuid',
  feedbackType: 'trade_accuracy',
  rating: 5,
  comment: 'Great signal!'
});
```

---

## 🚨 Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API Response | > 500ms | > 1000ms | Optimize API calls |
| DB Query | > 100ms | > 500ms | Add indexes, optimize queries |
| Error Rate | > 5% | > 10% | Investigate and fix errors |
| Success Rate | < 60% | < 50% | Review AI parameters |
| Critical Errors | > 0 | > 5 | Immediate investigation |

---

## 📈 Daily Monitoring Routine

### Morning Check (5 minutes)
1. Open monitoring dashboard
2. Check for critical errors (should be 0)
3. Review error count (should be < 10 per day)
4. Check success rate (should be > 60%)
5. Review any user feedback

### Weekly Review (30 minutes)
1. Analyze error trends
2. Review performance metrics
3. Identify slow operations
4. Read user feedback
5. Plan improvements

### Monthly Analysis (2 hours)
1. Generate comprehensive report
2. Analyze success rate trends
3. Review all user feedback
4. Identify patterns in failures
5. Plan major improvements

---

## 🔍 Troubleshooting

### High Error Rate
1. Check `atge_error_logs` table
2. Group by `error_type` and `severity`
3. Review recent errors
4. Fix underlying issues
5. Monitor improvements

### Slow Performance
1. Check `atge_performance_metrics` table
2. Find slowest operations
3. Optimize bottlenecks
4. Add caching
5. Monitor improvements

### Low Success Rate
1. Query failed trades
2. Review AI reasoning
3. Check market conditions
4. Adjust parameters
5. Monitor improvements

---

## 📝 SQL Queries

### Recent Critical Errors
```sql
SELECT * FROM atge_recent_critical_errors
ORDER BY timestamp DESC
LIMIT 10;
```

### Performance Summary
```sql
SELECT * FROM atge_performance_summary_24h;
```

### User Feedback Summary
```sql
SELECT * FROM atge_feedback_summary;
```

### Error Rate by Hour
```sql
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as error_count
FROM atge_error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Slowest Operations Today
```sql
SELECT 
  metric_name,
  AVG(value) as avg_time,
  MAX(value) as max_time,
  COUNT(*) as count
FROM atge_performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_name
ORDER BY avg_time DESC
LIMIT 10;
```

---

## 🎯 Success Criteria

### Healthy System
- ✅ 0 critical errors
- ✅ < 10 errors per day
- ✅ API response < 500ms average
- ✅ Success rate > 60%
- ✅ Average rating > 4.0

### Warning Signs
- ⚠️ 1-5 critical errors
- ⚠️ 10-50 errors per day
- ⚠️ API response 500-1000ms
- ⚠️ Success rate 50-60%
- ⚠️ Average rating 3.0-4.0

### Critical Issues
- 🚨 > 5 critical errors
- 🚨 > 50 errors per day
- 🚨 API response > 1000ms
- 🚨 Success rate < 50%
- 🚨 Average rating < 3.0

---

## 📞 Support

### Documentation
- Full Guide: `ATGE-MONITORING-GUIDE.md`
- API Docs: `/api/atge/monitoring/*`
- Database Schema: `migrations/002_create_atge_monitoring_tables.sql`

### Contact
- Technical Issues: Check error logs first
- Feature Requests: Submit via feedback API
- Critical Errors: Check alert system

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
