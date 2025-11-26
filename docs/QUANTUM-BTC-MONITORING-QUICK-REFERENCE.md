# Quantum BTC Monitoring - Quick Reference

**Version**: 1.0.0  
**Last Updated**: November 25, 2025

---

## 🚀 Quick Start

### Import Modules

```typescript
// Performance Monitoring
import { performanceMonitor, trackAPICall, trackDatabaseQuery } from '../lib/quantum/performanceMonitor';

// Alert System
import { alertSystem, alertDataQualityLow, alertSystemSuspension } from '../lib/quantum/alertSystem';

// API Optimizer
import { apiOptimizer, cachedAPICall, apiCallWithFallback } from '../lib/quantum/apiOptimizer';
```

---

## 📊 Performance Monitoring

### Track API Call

```typescript
const result = await trackAPICall(
  'CMC',                    // API name
  '/v1/quotes',             // Endpoint
  'GET',                    // HTTP method
  async () => {             // Request function
    return await fetch('...');
  },
  {                         // Optional context
    userId: 'user-123',
    tradeId: 'trade-456'
  }
);
```

### Track Database Query

```typescript
const trades = await trackDatabaseQuery(
  'SELECT',                 // Query type
  'get_active_trades',      // Query name
  async () => {             // Query function
    return await query('SELECT * FROM btc_trades...');
  }
);
```

### Get Performance Summary

```typescript
const summary = await performanceMonitor.getPerformanceSummary();
console.log('API Stats:', summary.api);
console.log('Database Stats:', summary.database);
console.log('Error Stats:', summary.errors);
```

---

## 🚨 Alert System

### Trigger Alerts

```typescript
// Critical alert
await alertSystemSuspension('Data quality below threshold', {
  dataQualityScore: 65
});

// Warning alert
await alertDataQualityLow(68, {
  affectedAPIs: ['CMC', 'CoinGecko']
});
```

### Register Custom Handler

```typescript
alertSystem.registerHandler(AlertSeverity.CRITICAL, (alert) => {
  sendEmailAlert(alert);
  sendSlackAlert(alert);
});
```

### Start Monitoring

```typescript
alertSystem.startMonitoring(60000); // Check every minute
```

### Get Alerts

```typescript
const activeAlerts = alertSystem.getActiveAlerts();
const criticalAlerts = alertSystem.getAlertsBySeverity(AlertSeverity.CRITICAL);
const stats = alertSystem.getAlertStats();
```

---

## 💾 API Optimization

### Cached API Call

```typescript
const price = await cachedAPICall(
  'CMC',                    // API name
  '/quotes',                // Endpoint
  async () => {             // Request function
    return await fetchCMCPrice('BTC');
  },
  { symbol: 'BTC' }         // Optional params
);
```

### API Call with Fallback

```typescript
const price = await apiCallWithFallback(
  {
    apiName: 'CMC',
    endpoint: '/quotes',
    requestFn: () => fetchCMCPrice('BTC')
  },
  [
    {
      apiName: 'CoinGecko',
      endpoint: '/simple/price',
      requestFn: () => fetchCoinGeckoPrice('BTC')
    }
  ]
);
```

### Configure Cache

```typescript
apiOptimizer.configureCacheForAPI('CMC', {
  ttlSeconds: 120,
  maxEntries: 200,
  enabled: true
});
```

### Cache Management

```typescript
// Get stats
const stats = apiOptimizer.getCacheStats();

// Clear cache
apiOptimizer.clearCacheForAPI('CMC');
apiOptimizer.clearAllCache();

// Start cleanup
apiOptimizer.startAutomaticCleanup(300000); // Every 5 minutes
```

---

## 🗄️ Database Optimization

### Use Optimized Functions

```typescript
// Get active trades
const trades = await query('SELECT * FROM get_active_trades($1)', [userId]);

// Get API reliability
const stats = await query('SELECT * FROM get_api_reliability_stats($1, $2)', ['CMC', 24]);

// Get trade performance
const performance = await query('SELECT * FROM get_trade_performance_by_timeframe($1)', [30]);
```

### Query Materialized Views

```typescript
// API performance summary
const apiPerf = await query(`
  SELECT * FROM mv_api_performance_summary
  WHERE api_name = $1 AND hour >= NOW() - INTERVAL '24 hours'
`, ['CMC']);

// Trade performance summary
const tradePerf = await query(`
  SELECT * FROM mv_trade_performance_summary
  WHERE day >= NOW() - INTERVAL '7 days'
  ORDER BY accuracy_rate DESC
`);
```

### Refresh Materialized Views

```sql
-- Run daily
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_api_performance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trade_performance_summary;
```

---

## 🌐 API Endpoints

### Health Check

```bash
curl http://localhost:3000/api/quantum/monitoring?type=health
```

### Performance Metrics

```bash
curl http://localhost:3000/api/quantum/monitoring?type=performance&apiName=CMC&hours=24
```

### Alerts

```bash
curl http://localhost:3000/api/quantum/monitoring?type=alerts&severity=CRITICAL
```

### Cache Stats

```bash
curl http://localhost:3000/api/quantum/monitoring?type=cache
```

### Summary

```bash
curl http://localhost:3000/api/quantum/monitoring?type=summary
```

---

## 🎯 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API Latency | < 500ms | > 10s |
| Database Query | < 100ms | > 1s |
| Error Rate | < 5% | > 50% |
| Cache Hit Rate | > 80% | < 50% |
| API Reliability | > 99% | < 90% |

---

## 🚨 Alert Severity Levels

### CRITICAL (Immediate Response)
- System suspension
- Fatal anomaly
- Database connection lost
- All APIs failing

### WARNING (Monitor Closely)
- Data quality < 70% for 3 hours
- API reliability < 90%
- Error rate > 5%
- Response time > 5s

### INFO (Track Trends)
- Accuracy rate < 60%
- Anomaly count +50%
- User engagement -25%

---

## 🔧 Common Tasks

### Start Monitoring

```typescript
// Start alert monitoring
alertSystem.startMonitoring(60000);

// Start cache cleanup
apiOptimizer.startAutomaticCleanup(300000);
```

### Check System Health

```typescript
const health = await performanceMonitor.getSystemHealth();
console.log('Status:', health.errorRate < 5 ? 'healthy' : 'degraded');
```

### Clear Cache

```typescript
// Clear specific API
apiOptimizer.clearCacheForAPI('CMC');

// Clear all
apiOptimizer.clearAllCache();
```

### Get Statistics

```typescript
// Performance
const perfSummary = await performanceMonitor.getPerformanceSummary();

// Alerts
const alertStats = alertSystem.getAlertStats();

// Cache
const cacheStats = apiOptimizer.getCacheStats();
```

---

## 📋 Maintenance Tasks

### Daily
- Check monitoring dashboard
- Review active alerts
- Verify cache hit rates
- Check error rates

### Weekly
- Analyze performance trends
- Review alert thresholds
- Optimize cache TTL
- Run ANALYZE on tables

### Monthly
- Refresh materialized views
- Run VACUUM on tables
- Review and archive old logs
- Update monitoring documentation

---

## 🐛 Troubleshooting

### High Error Rate
1. Check `performanceMonitor.getErrorStats()`
2. Review `alertSystem.getActiveAlerts()`
3. Check API reliability stats
4. Verify API keys

### Slow Response Time
1. Check cache hit rate
2. Review database query performance
3. Check API response times
4. Verify network connectivity

### Low Cache Hit Rate
1. Verify cache is enabled
2. Check TTL configuration
3. Review cache eviction policy
4. Check for cache invalidation

---

## 📚 Documentation

- **Full Guide**: `docs/QUANTUM-BTC-MONITORING-GUIDE.md`
- **Task Complete**: `docs/QUANTUM-BTC-TASK-12-COMPLETE.md`
- **This Reference**: `docs/QUANTUM-BTC-MONITORING-QUICK-REFERENCE.md`

---

**Status**: ✅ Ready for Production  
**Capability Level**: Einstein × 1000000000000000x

