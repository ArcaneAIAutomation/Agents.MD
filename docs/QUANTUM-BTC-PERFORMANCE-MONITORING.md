# Quantum BTC Performance Monitoring System

**Version**: 1.0.0  
**Status**: ✅ Implemented  
**Requirements**: 14.1-14.10

---

## Overview

The Quantum BTC Performance Monitoring System provides comprehensive tracking of:
- **API Response Times**: Track latency for all external API calls
- **Database Query Performance**: Monitor query execution times and success rates
- **Error Rates**: Track and categorize errors across the system
- **System Health**: Overall system health metrics and status

---

## Architecture

### Components

1. **Performance Monitor** (`lib/quantum/performanceMonitor.ts`)
   - Singleton class for centralized monitoring
   - In-memory metrics storage (last 100 per endpoint)
   - Database persistence for long-term analysis

2. **API Tracking Utilities**
   - `trackAPICall()` - Wrap API calls with performance tracking
   - `trackDatabaseQuery()` - Wrap database queries with performance tracking

3. **Metrics Endpoint** (`pages/api/quantum/performance-metrics.ts`)
   - GET endpoint for retrieving performance metrics
   - Aggregates data from database and in-memory cache

---

## Database Schema

### `api_latency_reliability_logs` Table

Stores all API call metrics for analysis:

```sql
CREATE TABLE api_latency_reliability_logs (
  id UUID PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  error_type VARCHAR(100),
  request_id VARCHAR(100),
  user_id UUID,
  trade_id UUID,
  request_payload JSONB,
  response_size_bytes INTEGER,
  retry_count INTEGER DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_api_latency_logs_api_name` - Query by API name
- `idx_api_latency_logs_requested_at` - Query by time range
- `idx_api_latency_logs_success` - Query by success status
- `idx_api_latency_logs_status_code` - Query by HTTP status
- `idx_api_latency_logs_trade_id` - Query by trade ID

---

## Usage

### Tracking API Calls

Wrap any API call with `trackAPICall()`:

```typescript
import { trackAPICall } from '../../../lib/quantum/performanceMonitor';

// Track API call performance
const data = await trackAPICall(
  'CoinMarketCap',           // API name
  '/v1/cryptocurrency/quotes/latest',  // Endpoint
  'GET',                     // HTTP method
  async () => {
    // Your API call here
    return await fetch('https://api.coinmarketcap.com/...');
  },
  {
    userId: 'user-123',      // Optional context
    tradeId: 'trade-456',
    requestPayload: { symbol: 'BTC' }
  }
);
```

### Tracking Database Queries

Wrap database queries with `trackDatabaseQuery()`:

```typescript
import { trackDatabaseQuery } from '../../../lib/quantum/performanceMonitor';

// Track database query performance
const result = await trackDatabaseQuery(
  'SELECT',                  // Query type
  'fetch_active_trades',     // Query name
  async () => {
    // Your database query here
    return await query('SELECT * FROM btc_trades WHERE status = $1', ['ACTIVE']);
  }
);
```

### Retrieving Metrics

#### Get Performance Summary

```typescript
import { performanceMonitor } from '../../../lib/quantum/performanceMonitor';

const summary = await performanceMonitor.getPerformanceSummary();

console.log(summary);
// {
//   timestamp: '2025-01-27T12:00:00Z',
//   api: {
//     stats: [...],
//     totalCalls: 1234,
//     avgResponseTime: 456,
//     overallSuccessRate: 98.5
//   },
//   database: { ... },
//   errors: { ... },
//   health: { ... }
// }
```

#### Get API Statistics

```typescript
// Get stats for specific API
const apiStats = await performanceMonitor.getAPIStats('CoinMarketCap', 24);

// Get stats for all APIs
const allStats = await performanceMonitor.getAPIStats(undefined, 24);
```

#### Get System Health

```typescript
const health = await performanceMonitor.getSystemHealth();

console.log(health);
// {
//   timestamp: '2025-01-27T12:00:00Z',
//   errorRate: 1.5,
//   avgResponseTime: 456,
//   activeConnections: undefined,
//   cpuUsage: undefined,
//   memoryUsage: undefined
// }
```

---

## API Endpoints

### GET /api/quantum/performance-metrics

Returns comprehensive performance metrics.

**Query Parameters**:
- `hours` (optional): Time range in hours (default: 24)

**Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-27T12:00:00Z",
  "metrics": {
    "api": {
      "totalCalls": 1234,
      "avgResponseTime": 456,
      "successRate": 98.5,
      "byAPI": [
        {
          "name": "CoinMarketCap",
          "totalCalls": 500,
          "avgResponseTime": 320,
          "minResponseTime": 150,
          "maxResponseTime": 1200,
          "p95ResponseTime": 800,
          "successRate": 99.2,
          "successfulCalls": 496,
          "failedCalls": 4
        }
      ]
    },
    "database": {
      "totalQueries": 567,
      "avgExecutionTime": 45,
      "successRate": 100,
      "byQueryType": { ... }
    },
    "errors": {
      "totalErrors": 18,
      "errorRate": 1.5,
      "byType": {
        "CoinMarketCap:TimeoutError": 5,
        "OpenAI:RateLimitError": 3
      }
    },
    "health": {
      "status": "healthy",
      "avgResponseTime": 456,
      "errorRate": 1.5,
      "uptime": 99.8
    }
  }
}
```

**Health Status**:
- `healthy`: < 1000ms response time, < 5% error rate
- `degraded`: < 3000ms response time, < 15% error rate
- `unhealthy`: >= 3000ms response time or >= 15% error rate

---

## Integration Examples

### Example 1: Trade Generation Endpoint

```typescript
// pages/api/quantum/generate-btc-trade.ts
import { trackAPICall, trackDatabaseQuery, performanceMonitor } from '../../../lib/quantum/performanceMonitor';

export default async function handler(req, res) {
  try {
    // Track market data API call
    const marketData = await trackAPICall(
      'CoinMarketCap',
      '/v1/cryptocurrency/quotes/latest',
      'GET',
      async () => await fetchMarketData()
    );

    // Track database insert
    await trackDatabaseQuery(
      'INSERT',
      'store_btc_trade',
      async () => await query('INSERT INTO btc_trades ...', [...])
    );

    return res.status(200).json({ success: true });

  } catch (error) {
    // Track error
    await performanceMonitor.trackAPICall({
      apiName: 'Quantum-BTC',
      endpoint: '/api/quantum/generate-btc-trade',
      httpMethod: 'POST',
      responseTimeMs: Date.now() - startTime,
      statusCode: 500,
      success: false,
      errorMessage: error.message,
      errorType: error.name,
    });

    return res.status(500).json({ success: false });
  }
}
```

### Example 2: Monitoring Dashboard

```typescript
// pages/api/quantum/monitoring-dashboard.ts
import { performanceMonitor } from '../../../lib/quantum/performanceMonitor';

export default async function handler(req, res) {
  const summary = await performanceMonitor.getPerformanceSummary();

  return res.status(200).json({
    success: true,
    dashboard: {
      apiPerformance: summary.api,
      databasePerformance: summary.database,
      errorMetrics: summary.errors,
      systemHealth: summary.health
    }
  });
}
```

---

## Metrics Collected

### API Metrics
- **Response Time**: Min, max, average, P95
- **Success Rate**: Percentage of successful calls
- **Error Rate**: Percentage of failed calls
- **Call Volume**: Total number of calls
- **Error Types**: Categorized by error type

### Database Metrics
- **Execution Time**: Query execution duration
- **Rows Affected**: Number of rows returned/modified
- **Success Rate**: Percentage of successful queries
- **Query Types**: Categorized by operation (SELECT, INSERT, UPDATE, DELETE)

### Error Metrics
- **Total Errors**: Count of all errors
- **Error Rate**: Percentage of failed operations
- **Error Types**: Categorized by API and error type
- **Error Trends**: Historical error patterns

### Health Metrics
- **System Status**: healthy, degraded, or unhealthy
- **Average Response Time**: Overall system responsiveness
- **Error Rate**: Overall system reliability
- **Uptime**: Percentage of successful operations

---

## Performance Targets

### Response Time Targets
- **API Calls**: < 1000ms average
- **Database Queries**: < 100ms average
- **Trade Generation**: < 60 seconds total
- **Hourly Validation**: < 30 seconds total

### Reliability Targets
- **API Success Rate**: > 95%
- **Database Success Rate**: > 99%
- **Overall Uptime**: > 99.5%
- **Error Rate**: < 5%

---

## Monitoring Best Practices

### 1. Always Track External API Calls
```typescript
// ✅ GOOD
const data = await trackAPICall('API', '/endpoint', 'GET', async () => await fetch(...));

// ❌ BAD
const data = await fetch(...); // No tracking
```

### 2. Always Track Database Operations
```typescript
// ✅ GOOD
const result = await trackDatabaseQuery('SELECT', 'query_name', async () => await query(...));

// ❌ BAD
const result = await query(...); // No tracking
```

### 3. Track Errors Explicitly
```typescript
// ✅ GOOD
catch (error) {
  await performanceMonitor.trackAPICall({
    apiName: 'MyAPI',
    endpoint: '/endpoint',
    httpMethod: 'POST',
    responseTimeMs: duration,
    statusCode: 500,
    success: false,
    errorMessage: error.message,
    errorType: error.name,
  });
}

// ❌ BAD
catch (error) {
  console.error(error); // No tracking
}
```

### 4. Include Context When Available
```typescript
// ✅ GOOD
await trackAPICall('API', '/endpoint', 'GET', apiCall, {
  userId: user.id,
  tradeId: trade.id,
  requestPayload: { symbol: 'BTC' }
});

// ⚠️ OK (but less useful)
await trackAPICall('API', '/endpoint', 'GET', apiCall);
```

---

## Troubleshooting

### High Response Times

**Symptoms**: Average response time > 1000ms

**Possible Causes**:
1. External API slowness
2. Database query inefficiency
3. Network latency
4. High system load

**Solutions**:
1. Check API stats: `performanceMonitor.getAPIStats()`
2. Identify slow APIs and implement caching
3. Optimize database queries with indexes
4. Implement request timeouts and retries

### High Error Rates

**Symptoms**: Error rate > 5%

**Possible Causes**:
1. API rate limiting
2. Network connectivity issues
3. Invalid requests
4. Service outages

**Solutions**:
1. Check error stats: `performanceMonitor.getErrorStats()`
2. Implement exponential backoff for retries
3. Add fallback data sources
4. Improve error handling and validation

### Database Performance Issues

**Symptoms**: Database queries > 100ms average

**Possible Causes**:
1. Missing indexes
2. Large result sets
3. Complex queries
4. Connection pool exhaustion

**Solutions**:
1. Check database stats: `performanceMonitor.getDatabaseStats()`
2. Add indexes for frequently queried columns
3. Implement pagination for large result sets
4. Optimize query structure

---

## Future Enhancements

### Phase 2
- [ ] Real-time alerting for performance degradation
- [ ] Automatic scaling based on load
- [ ] Predictive performance analysis
- [ ] Custom performance dashboards

### Phase 3
- [ ] Machine learning for anomaly detection
- [ ] Automated performance optimization
- [ ] Distributed tracing across services
- [ ] Advanced visualization tools

---

## Testing

Run performance monitor tests:

```bash
npm test -- __tests__/lib/quantum/performanceMonitor.test.ts --run
```

**Expected Results**:
- ✅ All 8 tests should pass
- ✅ API call tracking works
- ✅ Database query tracking works
- ✅ Error rate calculation is accurate
- ✅ System health metrics are returned

---

## Summary

The Quantum BTC Performance Monitoring System provides:

✅ **Comprehensive Tracking**: API calls, database queries, errors  
✅ **Real-Time Metrics**: In-memory cache for instant access  
✅ **Historical Analysis**: Database persistence for trends  
✅ **Easy Integration**: Simple wrapper functions  
✅ **Production Ready**: Tested and documented  

**Status**: ✅ **COMPLETE** - Ready for production use

---

**Requirements Satisfied**: 14.1-14.10  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
