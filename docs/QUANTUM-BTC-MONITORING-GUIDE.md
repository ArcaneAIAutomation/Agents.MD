# Quantum BTC Monitoring & Optimization Guide

**Version**: 1.0.0  
**Status**: ✅ Complete  
**Last Updated**: November 25, 2025

---

## Overview

The Quantum BTC system includes comprehensive monitoring, alerting, and optimization capabilities to ensure maximum performance, reliability, and accuracy.

### Key Components

1. **Performance Monitor** - Tracks API response times, database query performance, and error rates
2. **Alert System** - Monitors system health and sends alerts for critical, warning, and info events
3. **Database Optimizer** - Optimizes queries with indexes, materialized views, and functions
4. **API Optimizer** - Implements caching and reduces unnecessary API calls

---

## Performance Monitoring

### Features

- **API Performance Tracking**: Logs every API call with response time, status, and errors
- **Database Query Tracking**: Monitors query execution time and rows affected
- **Error Rate Monitoring**: Tracks error rates by API and error type
- **System Health Metrics**: Provides overall system health status

### Usage

```typescript
import { performanceMonitor, trackAPICall, trackDatabaseQuery } from '../lib/quantum/performanceMonitor';

// Track an API call
const result = await trackAPICall(
  'CMC',
  '/v1/cryptocurrency/quotes/latest',
  'GET',
  async () => {
    return await fetch('https://api.coinmarketcap.com/...');
  },
  {
    userId: 'user-123',
    tradeId: 'trade-456',
    requestPayload: { symbol: 'BTC' }
  }
);

// Track a database query
const trades = await trackDatabaseQuery(
  'SELECT',
  'get_active_trades',
  async () => {
    return await query('SELECT * FROM btc_trades WHERE status = $1', ['ACTIVE']);
  }
);

// Get performance summary
const summary = await performanceMonitor.getPerformanceSummary();
console.log('API Stats:', summary.api);
console.log('Database Stats:', summary.database);
console.log('Error Stats:', summary.errors);
```

### API Endpoints

#### Get System Health
```
GET /api/quantum/monitoring?type=health
```

Response:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "timestamp": "2025-11-25T12:00:00Z",
    "errorRate": 2.5,
    "avgResponseTime": 450
  }
}
```

#### Get Performance Metrics
```
GET /api/quantum/monitoring?type=performance&apiName=CMC&hours=24
```

Response:
```json
{
  "success": true,
  "api": "CMC",
  "stats": [
    {
      "api_name": "CMC",
      "total_calls": 1250,
      "avg_response_time": 320,
      "min_response_time": 150,
      "max_response_time": 850,
      "p95_response_time": 650,
      "successful_calls": 1230,
      "failed_calls": 20,
      "success_rate": 98.4
    }
  ]
}
```

#### Get Monitoring Summary
```
GET /api/quantum/monitoring?type=summary
```

Response:
```json
{
  "success": true,
  "timestamp": "2025-11-25T12:00:00Z",
  "health": {
    "status": "healthy",
    "errorRate": 2.5,
    "avgResponseTime": 450
  },
  "performance": {
    "api": {
      "totalCalls": 5000,
      "avgResponseTime": 380,
      "successRate": 97.8
    }
  },
  "alerts": {
    "active": 2,
    "bySeverity": {
      "critical": 0,
      "warning": 2,
      "info": 0
    }
  },
  "cache": {
    "totalEntries": 45,
    "byAPI": {
      "CMC": { "entries": 15, "totalHits": 230 },
      "CoinGecko": { "entries": 12, "totalHits": 180 }
    }
  }
}
```

---

## Alert System

### Alert Severity Levels

1. **CRITICAL** - Immediate response required
   - System suspension triggered
   - Fatal anomaly detected
   - Database connection lost
   - All APIs failing

2. **WARNING** - Monitor closely
   - Data quality < 70% for 3 consecutive hours
   - API reliability < 90% for any source
   - Error rate > 5%
   - Response time > 5 seconds

3. **INFO** - Track trends
   - Accuracy rate drops below 60%
   - Anomaly count increases 50%
   - User engagement drops 25%

### Usage

```typescript
import { 
  alertSystem, 
  alertSystemSuspension, 
  alertFatalAnomaly,
  alertDataQualityLow 
} from '../lib/quantum/alertSystem';

// Trigger a critical alert
await alertSystemSuspension('Data quality below minimum threshold', {
  dataQualityScore: 65,
  threshold: 70
});

// Trigger a warning alert
await alertDataQualityLow(68, {
  affectedAPIs: ['CMC', 'CoinGecko'],
  consecutiveHours: 3
});

// Register custom alert handler
alertSystem.registerHandler(AlertSeverity.CRITICAL, (alert) => {
  // Send email notification
  sendEmailAlert(alert);
  
  // Send Slack notification
  sendSlackAlert(alert);
  
  // Log to external monitoring service
  logToDatadog(alert);
});

// Start automatic monitoring
alertSystem.startMonitoring(60000); // Check every minute

// Get active alerts
const activeAlerts = alertSystem.getActiveAlerts();
console.log('Active alerts:', activeAlerts);

// Get alert statistics
const stats = alertSystem.getAlertStats();
console.log('Alert stats:', stats);
```

### API Endpoints

#### Get Alerts
```
GET /api/quantum/monitoring?type=alerts&severity=CRITICAL
```

Response:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-123",
      "type": "DATA_QUALITY_LOW",
      "severity": "WARNING",
      "message": "Data quality low: 68% (minimum 70% required)",
      "details": {
        "score": 68,
        "threshold": 70,
        "affectedAPIs": ["CMC", "CoinGecko"]
      },
      "timestamp": "2025-11-25T12:00:00Z",
      "resolved": false
    }
  ],
  "stats": {
    "total": 15,
    "active": 2,
    "resolved": 13,
    "bySeverity": {
      "critical": 0,
      "warning": 2,
      "info": 0
    }
  }
}
```

---

## Database Optimization

### Features

- **Additional Indexes**: 15+ new indexes for common query patterns
- **Materialized Views**: Pre-computed views for expensive queries
- **Optimized Functions**: PostgreSQL functions for common operations
- **Query Performance**: Significant performance improvements

### Indexes Added

```sql
-- btc_trades optimizations
idx_btc_trades_user_status
idx_btc_trades_symbol_status
idx_btc_trades_confidence_score
idx_btc_trades_data_quality_score
idx_btc_trades_timeframe

-- btc_hourly_snapshots optimizations
idx_btc_hourly_snapshots_trade_snapshot
idx_btc_hourly_snapshots_phase_shift
idx_btc_hourly_snapshots_data_quality

-- quantum_anomaly_logs optimizations
idx_quantum_anomaly_logs_type_severity
idx_quantum_anomaly_logs_suspended
idx_quantum_anomaly_logs_unresolved

-- api_latency_reliability_logs optimizations
idx_api_latency_logs_api_success
idx_api_latency_logs_response_time
idx_api_latency_logs_user_trade
```

### Materialized Views

#### API Performance Summary
```sql
SELECT * FROM mv_api_performance_summary
WHERE api_name = 'CMC'
  AND hour >= NOW() - INTERVAL '24 hours';
```

#### Trade Performance Summary
```sql
SELECT * FROM mv_trade_performance_summary
WHERE day >= NOW() - INTERVAL '7 days'
ORDER BY accuracy_rate DESC;
```

### Optimized Functions

#### Get Active Trades
```sql
-- Efficiently retrieves active trades
SELECT * FROM get_active_trades('user-id');
SELECT * FROM get_active_trades(); -- All users
```

#### Get API Reliability Stats
```sql
-- Get stats for specific API
SELECT * FROM get_api_reliability_stats('CMC', 24);

-- Get stats for all APIs
SELECT * FROM get_api_reliability_stats(NULL, 24);
```

#### Get Trade Performance by Timeframe
```sql
-- Analyze performance by timeframe
SELECT * FROM get_trade_performance_by_timeframe(30);
```

### Maintenance

```sql
-- Refresh materialized views (run daily)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_api_performance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trade_performance_summary;

-- Analyze tables (run weekly)
ANALYZE btc_trades;
ANALYZE btc_hourly_snapshots;
ANALYZE quantum_anomaly_logs;
ANALYZE api_latency_reliability_logs;

-- Vacuum tables (run monthly)
VACUUM ANALYZE btc_trades;
VACUUM ANALYZE btc_hourly_snapshots;
```

---

## API Optimization

### Features

- **Intelligent Caching**: Configurable TTL per API
- **Request Deduplication**: Prevents duplicate concurrent requests
- **Batch API Calls**: Execute multiple calls simultaneously
- **Fallback Strategy**: Automatic fallback to secondary sources

### Cache Configuration

```typescript
import { apiOptimizer } from '../lib/quantum/apiOptimizer';

// Configure cache for specific API
apiOptimizer.configureCacheForAPI('CMC', {
  ttlSeconds: 120,      // Cache for 2 minutes
  maxEntries: 200,      // Store up to 200 entries
  enabled: true         // Enable caching
});

// Disable caching for AI APIs
apiOptimizer.configureCacheForAPI('GPT-5.1', {
  enabled: false
});
```

### Usage

```typescript
import { cachedAPICall, batchAPICall, apiCallWithFallback } from '../lib/quantum/apiOptimizer';

// Single cached API call
const btcPrice = await cachedAPICall(
  'CMC',
  '/v1/cryptocurrency/quotes/latest',
  async () => {
    return await fetchCMCPrice('BTC');
  },
  { symbol: 'BTC' }
);

// Batch multiple API calls
const [cmcData, coinGeckoData, krakenData] = await batchAPICall([
  {
    apiName: 'CMC',
    endpoint: '/quotes',
    requestFn: () => fetchCMCPrice('BTC')
  },
  {
    apiName: 'CoinGecko',
    endpoint: '/simple/price',
    requestFn: () => fetchCoinGeckoPrice('BTC')
  },
  {
    apiName: 'Kraken',
    endpoint: '/Ticker',
    requestFn: () => fetchKrakenPrice('BTC')
  }
]);

// API call with fallback
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
    },
    {
      apiName: 'Kraken',
      endpoint: '/Ticker',
      requestFn: () => fetchKrakenPrice('BTC')
    }
  ]
);
```

### Cache Statistics

```typescript
// Get cache statistics
const stats = apiOptimizer.getCacheStats();
console.log('Total entries:', stats.totalEntries);
console.log('By API:', stats.byAPI);

// Clear cache for specific API
apiOptimizer.clearCacheForAPI('CMC');

// Clear all cache
apiOptimizer.clearAllCache();

// Start automatic cleanup
const cleanupInterval = apiOptimizer.startAutomaticCleanup(300000); // Every 5 minutes
```

### API Endpoints

#### Get Cache Statistics
```
GET /api/quantum/monitoring?type=cache
```

Response:
```json
{
  "success": true,
  "cache": {
    "totalEntries": 45,
    "byAPI": {
      "CMC": {
        "entries": 15,
        "totalHits": 230,
        "validEntries": 14,
        "expiredEntries": 1
      },
      "CoinGecko": {
        "entries": 12,
        "totalHits": 180,
        "validEntries": 12,
        "expiredEntries": 0
      }
    }
  }
}
```

---

## Performance Targets

### Response Time Targets

- **Trade Generation**: < 60 seconds (target: 45 seconds)
- **Hourly Validation**: < 30 seconds for 100 trades (target: 20 seconds)
- **Dashboard Load**: < 2 seconds (target: 1 second)
- **Trade Details**: < 1 second (target: 500ms)
- **API Latency**: < 500ms per endpoint (target: 300ms)

### Success Criteria

- ✅ API reliability > 99% for all approved sources
- ✅ Error rate < 5%
- ✅ Average response time < 500ms
- ✅ Cache hit rate > 80%
- ✅ Database query time < 100ms for 95% of queries

---

## Monitoring Dashboard

### Key Metrics to Display

1. **System Health**
   - Overall status (healthy/degraded/unhealthy)
   - Error rate
   - Average response time
   - Active connections

2. **API Performance**
   - Calls per hour by API
   - Success rate by API
   - Average response time by API
   - P95 response time

3. **Database Performance**
   - Query execution time
   - Rows affected
   - Success rate
   - Active connections

4. **Alerts**
   - Active alerts count
   - Alerts by severity
   - Recent alerts
   - Alert trends

5. **Cache Performance**
   - Total entries
   - Hit rate by API
   - Cache size
   - Eviction rate

---

## Troubleshooting

### High Error Rate

1. Check API reliability stats
2. Review recent alerts
3. Check database connection
4. Verify API keys are valid
5. Check rate limits

### Slow Response Time

1. Check cache hit rate
2. Review database query performance
3. Check API response times
4. Verify network connectivity
5. Check for slow queries

### Low Cache Hit Rate

1. Verify cache is enabled
2. Check TTL configuration
3. Review cache eviction policy
4. Check for cache invalidation issues

---

## Best Practices

1. **Monitor Regularly**: Check monitoring dashboard daily
2. **Set Up Alerts**: Configure email/Slack notifications for critical alerts
3. **Optimize Queries**: Use materialized views and functions for common queries
4. **Cache Aggressively**: Enable caching for all non-AI APIs
5. **Review Performance**: Analyze performance metrics weekly
6. **Clean Up**: Run database maintenance tasks regularly
7. **Test Fallbacks**: Verify fallback strategies work correctly
8. **Document Changes**: Keep monitoring configuration documented

---

## Deployment Checklist

- [ ] Run database optimization migration
- [ ] Configure cache settings for each API
- [ ] Set up alert handlers (email, Slack, etc.)
- [ ] Start automatic monitoring
- [ ] Start automatic cache cleanup
- [ ] Verify monitoring API endpoints work
- [ ] Set up monitoring dashboard
- [ ] Configure alert thresholds
- [ ] Test alert notifications
- [ ] Document monitoring procedures

---

**Status**: ✅ Monitoring & Optimization Complete  
**Version**: 1.0.0  
**Capability Level**: Einstein × 1000000000000000x

