# UCIE API Key Management System - Complete Guide

## Overview

The Universal Crypto Intelligence Engine (UCIE) API Key Management System provides centralized, secure management of 15+ external API services. This system includes rate limiting, health monitoring, cost tracking, and automatic fallback mechanisms.

## Features

### ✅ Implemented

1. **Centralized API Key Storage**
   - Secure environment variable management
   - Validation of required vs optional keys
   - Configuration status reporting

2. **Rate Limiting**
   - Token bucket algorithm for smooth rate limiting
   - Per-service rate limit configuration
   - Automatic token refill
   - Queue management for pending requests
   - Burst handling

3. **Health Monitoring**
   - Real-time API health checks
   - Response time tracking
   - Availability status
   - Error message reporting
   - Cached health status

4. **Cost Tracking**
   - Per-request cost recording
   - Daily/monthly cost aggregation
   - Cost alerts and thresholds
   - Cost optimization recommendations
   - Historical cost analysis
   - CSV export functionality

5. **Usage Statistics**
   - Request count tracking
   - Success/failure rates
   - Last used timestamps
   - Service-level metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Key Manager                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • API key storage and retrieval                         │  │
│  │  • Service configuration                                 │  │
│  │  • Validation and health checks                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Rate Limiters   │  │  Cost Tracker    │  │  Health Monitor  │
│  • Token bucket  │  │  • Cost entries  │  │  • API tests     │
│  • Queue mgmt    │  │  • Thresholds    │  │  • Status cache  │
│  • Auto refill   │  │  • Alerts        │  │  • Response time │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## File Structure

```
lib/ucie/
├── apiKeyManager.ts          # Core API key management
├── rateLimiters.ts            # Rate limiting implementation
├── costTracking.ts            # Cost tracking and analysis
└── README-API-KEYS.md         # Detailed documentation

pages/api/ucie/
├── health.ts                  # Health monitoring endpoint
└── costs.ts                   # Cost tracking endpoint

scripts/
└── validate-ucie-api-keys.ts  # Validation script

.env.example                   # Environment variable template
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your API keys
# See .env.example for all available keys
```

### 3. Validate Configuration

```bash
# Run validation script
npm run validate:ucie-keys
```

Expected output:
```
🔐 UCIE API Key Validation

================================================================================
1. Required API Keys
================================================================================
✓ All required API keys are configured

================================================================================
2. Configured Services
================================================================================
Configured: 12/15 services
  ✓ OpenAI GPT-4o
  ✓ Caesar AI Research
  ✓ CoinMarketCap
  ...

================================================================================
3. API Health Check
================================================================================
Testing API connectivity (this may take a few seconds)...

Available: 11/12 services
  ✓ OpenAI GPT-4o (234ms)
  ✓ Caesar AI Research (456ms)
  ...

================================================================================
6. Validation Result
================================================================================
✓ UCIE is ready to use!
All required API keys are configured and working.
```

### 4. Monitor Health

```bash
# Check API health
curl http://localhost:3000/api/ucie/health

# Detailed health check
curl http://localhost:3000/api/ucie/health?detailed=true&checkHealth=true
```

### 5. Track Costs

```bash
# Get cost report
curl http://localhost:3000/api/ucie/costs?days=30

# Export cost history
curl http://localhost:3000/api/ucie/costs?format=csv > costs.csv
```

## API Services Configuration

### Required Services (6)

1. **OpenAI GPT-4o** - AI analysis and predictions
2. **Caesar AI** - Deep research with source verification
3. **CoinMarketCap** - Primary market data
4. **Etherscan** - Ethereum on-chain analytics
5. **LunarCrush** - Social sentiment analysis
6. **NewsAPI** - Real-time cryptocurrency news

### Recommended Services (3)

7. **CoinGecko** - Fallback market data (free tier)
8. **Twitter API** - Twitter sentiment analysis
9. **CryptoCompare** - Additional news source

### Optional Services (6)

10. **Google Gemini** - Alternative AI provider
11. **BSCScan** - BSC token analytics
12. **Polygonscan** - Polygon token analytics
13. **CoinGlass** - Derivatives data
14. **DeFiLlama** - TVL and DeFi metrics (no key required)
15. **Messari** - Fundamental data

## Usage Examples

### Basic Usage

```typescript
import { apiKeyManager } from './lib/ucie/apiKeyManager';

// Get API key
const key = apiKeyManager.getApiKey('OPENAI');

// Check if configured
if (apiKeyManager.hasApiKey('OPENAI')) {
  // Use the API
}

// Get system health
const summary = apiKeyManager.getSystemHealthSummary();
console.log(`Configured: ${summary.configuredServices}/${summary.totalServices}`);
```

### Rate Limiting

```typescript
import { rateLimiters, withRateLimit } from './lib/ucie/rateLimiters';

// Use rate limiter
const result = await withRateLimit(rateLimiters.openai, async () => {
  const response = await fetch('https://api.openai.com/v1/...');
  return response.json();
});

// Check rate limit status
const state = rateLimiters.openai.getState();
console.log(`Available: ${state.availableTokens}/${state.maxTokens}`);
```

### Cost Tracking

```typescript
import { recordApiUsage, getCostReport } from './lib/ucie/costTracking';

// Record usage
recordApiUsage('OPENAI', true, 'analysis', { symbol: 'BTC' });

// Get cost report
const report = getCostReport(30);
console.log(`Total: $${report.summary.totalCost.toFixed(2)}`);
console.log(`Daily avg: $${report.summary.dailyAverage.toFixed(2)}`);
console.log(`Projected: $${report.summary.projectedMonthly.toFixed(2)}`);

// Check alerts
report.alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.message}`);
});
```

### Health Monitoring

```typescript
import { apiKeyManager } from './lib/ucie/apiKeyManager';

// Check single service
const status = await apiKeyManager.checkHealth('OPENAI');
console.log(`${status.name}: ${status.available ? 'Available' : 'Unavailable'}`);

// Check all services
const allStatuses = await apiKeyManager.checkAllHealth();
const available = allStatuses.filter(s => s.available).length;
console.log(`Available: ${available}/${allStatuses.length}`);
```

## API Endpoints

### GET /api/ucie/health

Health monitoring endpoint for all API services.

**Query Parameters:**
- `detailed` (boolean) - Include detailed information (default: false)
- `checkHealth` (boolean) - Perform live health checks (default: false)

**Response:**
```json
{
  "systemHealth": {
    "totalServices": 15,
    "configuredServices": 12,
    "availableServices": 11,
    "missingRequiredKeys": [],
    "totalRequests": 1234,
    "totalCost": 12.34,
    "validation": {
      "valid": true,
      "missingRequiredKeys": [],
      "warnings": []
    }
  },
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

### GET /api/ucie/costs

Cost tracking and analysis endpoint.

**Query Parameters:**
- `days` (number) - Number of days to analyze (default: 30, max: 365)
- `service` (string) - Filter by specific service
- `format` (string) - Response format: 'json' or 'csv' (default: 'json')

**Response:**
```json
{
  "summary": {
    "totalCost": 45.67,
    "dailyAverage": 1.52,
    "projectedMonthly": 45.60
  },
  "breakdown": [...],
  "alerts": [...],
  "optimizations": [...],
  "period": {
    "days": 30,
    "start": "2024-12-28T12:00:00.000Z",
    "end": "2025-01-27T12:00:00.000Z"
  },
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

## Cost Optimization

### Automatic Recommendations

The system provides automatic cost optimization recommendations:

1. **Use Free Tiers First**
   - Suggests using CoinGecko (free) before CoinMarketCap (paid)
   - Recommends DeFiLlama (free) for TVL data

2. **Implement Caching**
   - Identifies redundant API calls
   - Suggests caching strategies

3. **Adjust Compute Units**
   - Recommends lower compute units for Caesar AI
   - Suggests appropriate AI models for tasks

4. **Remove Unused Services**
   - Identifies configured but unused services
   - Suggests removing unnecessary API keys

### Cost Thresholds

Set monthly cost thresholds to receive alerts:

```typescript
import { costTracker } from './lib/ucie/costTracking';

// Set thresholds
costTracker.setThreshold('OPENAI', 100); // $100/month
costTracker.setThreshold('CAESAR', 50);  // $50/month

// Get alerts
const alerts = costTracker.getAlerts();
alerts.forEach(alert => {
  if (alert.severity === 'critical') {
    console.error(`CRITICAL: ${alert.message}`);
  }
});
```

## Rate Limiting

### Token Bucket Algorithm

Each API service has a token bucket rate limiter:

- **Tokens**: Represent available API calls
- **Refill Rate**: Tokens added per second
- **Max Tokens**: Maximum bucket capacity
- **Queue**: Pending requests when bucket is empty

### Configuration

Rate limits are configured per service in `apiKeyManager.ts`:

```typescript
OPENAI: {
  rateLimit: {
    maxRequests: 500,
    windowMs: 60000, // 1 minute
  }
}
```

### Usage

```typescript
import { rateLimiters } from './lib/ucie/rateLimiters';

// Acquire token (waits if necessary)
await rateLimiters.openai.acquire();
// Make API call

// Try to acquire without waiting
if (rateLimiters.openai.tryAcquire()) {
  // Make API call
} else {
  // Rate limited, handle accordingly
}
```

## Health Monitoring

### Health Check Types

1. **Cached Status** - Fast, uses last known status
2. **Live Check** - Slow, performs actual API test

### Health Check Endpoints

Each service can define a health check endpoint:

```typescript
OPENAI: {
  healthCheck: {
    endpoint: 'https://api.openai.com/v1/models',
    method: 'GET',
    expectedStatus: 200,
  }
}
```

### Monitoring Schedule

- **On-demand**: Via `/api/ucie/health?checkHealth=true`
- **Cached**: Via `/api/ucie/health` (uses last check)
- **Automatic**: Can be scheduled with cron jobs

## Security Best Practices

1. **Never commit API keys**
   - Use `.env.local` for development
   - Use Vercel environment variables for production
   - Add `.env.local` to `.gitignore`

2. **Rotate keys regularly**
   - Every 6-12 months
   - Immediately if compromised
   - Different keys per environment

3. **Limit permissions**
   - Use read-only keys when possible
   - Restrict IP addresses
   - Enable provider-side rate limiting

4. **Monitor usage**
   - Set cost alerts
   - Review logs weekly
   - Investigate unusual patterns

5. **Use environment-specific keys**
   - Development: Test keys with lower limits
   - Staging: Production-like keys
   - Production: Full-featured keys with monitoring

## Troubleshooting

### Missing Required Keys

```bash
# Check missing keys
npm run validate:ucie-keys

# Or via API
curl http://localhost:3000/api/ucie/health | jq '.systemHealth.missingRequiredKeys'
```

### Rate Limit Errors

```typescript
// Check rate limit status
const state = rateLimiters.openai.getState();
if (state.availableTokens === 0) {
  console.log('Rate limited');
  console.log(`Queue length: ${state.queueLength}`);
}
```

### API Health Issues

```typescript
// Check API health
const status = await apiKeyManager.checkHealth('OPENAI');
if (!status.available) {
  console.error(`Error: ${status.errorMessage}`);
  // Use fallback service
}
```

### High Costs

```bash
# Get cost optimization recommendations
curl http://localhost:3000/api/ucie/costs | jq '.optimizations'
```

## Testing

### Unit Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Integration Tests

```bash
# Validate API keys
npm run validate:ucie-keys

# Check health
curl http://localhost:3000/api/ucie/health?checkHealth=true

# Test rate limiting
for i in {1..10}; do
  curl http://localhost:3000/api/ucie/health
done
```

## Deployment

### Vercel Environment Variables

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all API keys from `.env.example`
3. Set for Production, Preview, and Development environments
4. Redeploy to apply changes

### Validation After Deployment

```bash
# Check production health
curl https://your-domain.com/api/ucie/health?detailed=true

# Check production costs
curl https://your-domain.com/api/ucie/costs?days=7
```

## Monitoring

### Key Metrics

- **Availability**: Percentage of services available
- **Response Time**: Average API response time
- **Request Count**: Total API requests
- **Success Rate**: Percentage of successful requests
- **Cost**: Total and per-service costs
- **Rate Limit Usage**: Token bucket utilization

### Alerts

Set up alerts for:
- Missing required API keys
- Service unavailability
- High response times (>5s)
- Cost threshold exceeded
- Rate limit exhaustion

## Support

For issues or questions:

1. Check [UCIE Documentation](./lib/ucie/README-API-KEYS.md)
2. Review [API Integration Guide](./.kiro/steering/api-integration.md)
3. Run validation script: `npm run validate:ucie-keys`
4. Check API provider status pages
5. Review Vercel function logs

## Requirements Satisfied

This implementation satisfies the following requirements:

- ✅ **13.5**: Secure API key storage and retrieval
- ✅ **14.2**: API health monitoring and cost tracking
- ✅ **Task 1.2**: Complete API key management system
  - ✅ Environment variables for 15+ services
  - ✅ Secure API key storage and retrieval
  - ✅ Rate limiter instances for each API
  - ✅ API health monitoring system
  - ✅ API cost tracking functionality

## License

Part of the Bitcoin Sovereign Technology platform.

---

**Status**: ✅ Complete and Production Ready
**Version**: 1.0.0
**Last Updated**: January 27, 2025
