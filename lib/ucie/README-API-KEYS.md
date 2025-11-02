# UCIE API Key Management System

## Overview

The Universal Crypto Intelligence Engine (UCIE) uses 15+ external API services to provide comprehensive cryptocurrency analysis. This document explains how to configure, manage, and monitor these API keys.

## Quick Start

### 1. Copy Environment Variables

```bash
cp .env.example .env.local
```

### 2. Configure Required API Keys

**HIGH PRIORITY** (Required for core functionality):
- `OPENAI_API_KEY` - AI-powered analysis and predictions
- `CAESAR_API_KEY` - Deep research with source verification
- `COINMARKETCAP_API_KEY` - Primary market data source
- `ETHERSCAN_API_KEY` - On-chain analytics for Ethereum tokens
- `LUNARCRUSH_API_KEY` - Social sentiment analysis
- `NEWSAPI_KEY` - Real-time cryptocurrency news

**MEDIUM PRIORITY** (Recommended for full features):
- `COINGECKO_API_KEY` - Fallback market data (free tier available)
- `TWITTER_BEARER_TOKEN` - Twitter sentiment analysis
- `CRYPTOCOMPARE_API_KEY` - Additional news source

**LOW PRIORITY** (Optional enhancements):
- `GEMINI_API_KEY` - Alternative AI provider
- `BSCSCAN_API_KEY` - BSC token analytics
- `POLYGONSCAN_API_KEY` - Polygon token analytics
- `COINGLASS_API_KEY` - Derivatives data
- `MESSARI_API_KEY` - Fundamental data

### 3. Validate Configuration

```bash
# Check which API keys are configured
curl http://localhost:3000/api/ucie/health

# Detailed health check (includes API tests)
curl http://localhost:3000/api/ucie/health?detailed=true&checkHealth=true
```

## API Services

### AI Services

#### OpenAI GPT-4o
- **Purpose**: AI-powered analysis, predictions, and natural language processing
- **Get Key**: https://platform.openai.com/api-keys
- **Rate Limit**: 500 requests/minute
- **Cost**: ~$0.01 per request
- **Required**: Yes

#### Caesar AI
- **Purpose**: Deep research with multi-source verification
- **Get Key**: https://caesar.xyz/api
- **Rate Limit**: 10 requests/minute
- **Cost**: ~$0.05 per research job
- **Required**: Yes

#### Google Gemini
- **Purpose**: Alternative AI provider for analysis
- **Get Key**: https://aistudio.google.com/app/apikey
- **Rate Limit**: 60 requests/minute
- **Cost**: ~$0.0001 per request (Flash)
- **Required**: No

### Market Data Services

#### CoinGecko
- **Purpose**: Primary market data (free tier available)
- **Get Key**: https://www.coingecko.com/en/api/pricing (optional)
- **Rate Limit**: 50 requests/minute (free), 500 requests/minute (pro)
- **Cost**: Free tier available
- **Required**: No (but recommended)

#### CoinMarketCap
- **Purpose**: Market data with premium features
- **Get Key**: https://coinmarketcap.com/api/
- **Rate Limit**: 333 requests/day (basic)
- **Cost**: ~$10/month (basic plan)
- **Required**: Yes

### Blockchain Explorer Services

#### Etherscan
- **Purpose**: Ethereum on-chain analytics
- **Get Key**: https://etherscan.io/myapikey
- **Rate Limit**: 5 requests/second
- **Cost**: Free
- **Required**: Yes

#### BSCScan
- **Purpose**: Binance Smart Chain analytics
- **Get Key**: https://bscscan.com/myapikey
- **Rate Limit**: 5 requests/second
- **Cost**: Free
- **Required**: No

#### Polygonscan
- **Purpose**: Polygon network analytics
- **Get Key**: https://polygonscan.com/myapikey
- **Rate Limit**: 5 requests/second
- **Cost**: Free
- **Required**: No

### Social Sentiment Services

#### LunarCrush
- **Purpose**: Aggregated social sentiment from 2000+ sources
- **Get Key**: https://lunarcrush.com/developers/api
- **Rate Limit**: 50 requests/day (free), unlimited (pro)
- **Cost**: Free tier available
- **Required**: Yes

#### Twitter API
- **Purpose**: Real-time tweet analysis and sentiment
- **Get Key**: https://developer.twitter.com/en/portal/dashboard
- **Rate Limit**: 500,000 tweets/month (basic)
- **Cost**: Free tier available
- **Required**: No (but recommended)

### News Services

#### NewsAPI
- **Purpose**: Real-time cryptocurrency news aggregation
- **Get Key**: https://newsapi.org/register
- **Rate Limit**: 100 requests/day (free)
- **Cost**: Free tier available
- **Required**: Yes

#### CryptoCompare
- **Purpose**: Additional news source and market data
- **Get Key**: https://www.cryptocompare.com/cryptopian/api-keys
- **Rate Limit**: 100 requests/minute (free)
- **Cost**: Free tier available
- **Required**: No

### Derivatives Services

#### CoinGlass
- **Purpose**: Derivatives data (funding rates, open interest, liquidations)
- **Get Key**: https://www.coinglass.com/api
- **Rate Limit**: 100 requests/minute
- **Cost**: Free tier available
- **Required**: No

### DeFi Services

#### DeFiLlama
- **Purpose**: TVL and DeFi protocol metrics
- **Get Key**: Not required (public API)
- **Rate Limit**: 300 requests/minute (conservative estimate)
- **Cost**: Free
- **Required**: No

#### Messari
- **Purpose**: Fundamental data and tokenomics
- **Get Key**: https://messari.io/api
- **Rate Limit**: 20 requests/minute (free)
- **Cost**: Free tier available
- **Required**: No

## Usage

### Basic Usage

```typescript
import { apiKeyManager } from './lib/ucie/apiKeyManager';

// Get API key
const openaiKey = apiKeyManager.getApiKey('OPENAI');

// Check if key is configured
if (apiKeyManager.hasApiKey('OPENAI')) {
  // Use the API
}

// Get all configured services
const services = apiKeyManager.getConfiguredServices();
console.log('Configured services:', services);
```

### Rate Limiting

```typescript
import { rateLimiters, withRateLimit } from './lib/ucie/rateLimiters';

// Use rate limiter
await withRateLimit(rateLimiters.openai, async () => {
  // Make API call
  const response = await fetch('https://api.openai.com/v1/...');
  return response.json();
});

// Check rate limit status
const state = rateLimiters.openai.getState();
console.log(`Available tokens: ${state.availableTokens}`);
console.log(`Queue length: ${state.queueLength}`);
```

### Cost Tracking

```typescript
import { recordApiUsage, getCostReport } from './lib/ucie/costTracking';

// Record API usage
recordApiUsage('OPENAI', true, 'analysis', { symbol: 'BTC' });

// Get cost report
const report = getCostReport(30); // Last 30 days
console.log('Total cost:', report.summary.totalCost);
console.log('Daily average:', report.summary.dailyAverage);
console.log('Projected monthly:', report.summary.projectedMonthly);

// Check for alerts
report.alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.message}`);
});

// Get optimization recommendations
report.optimizations.forEach(opt => {
  console.log(`${opt.priority}: ${opt.recommendation}`);
  console.log(`Potential savings: $${opt.potentialSavings.toFixed(2)}`);
});
```

### Health Monitoring

```typescript
import { apiKeyManager } from './lib/ucie/apiKeyManager';

// Check health of a single service
const status = await apiKeyManager.checkHealth('OPENAI');
console.log(`${status.name}: ${status.available ? 'Available' : 'Unavailable'}`);
console.log(`Response time: ${status.responseTime}ms`);

// Check health of all services
const allStatuses = await apiKeyManager.checkAllHealth();
allStatuses.forEach(status => {
  console.log(`${status.name}: ${status.available ? '✓' : '✗'}`);
});

// Get system health summary
const summary = apiKeyManager.getSystemHealthSummary();
console.log(`Configured: ${summary.configuredServices}/${summary.totalServices}`);
console.log(`Available: ${summary.availableServices}/${summary.configuredServices}`);
console.log(`Missing required keys:`, summary.missingRequiredKeys);
```

## API Endpoints

### Health Check

```bash
# Basic health check
GET /api/ucie/health

# Detailed health check with API tests
GET /api/ucie/health?detailed=true&checkHealth=true
```

Response:
```json
{
  "systemHealth": {
    "totalServices": 15,
    "configuredServices": 12,
    "availableServices": 11,
    "missingRequiredKeys": ["TWITTER"],
    "totalRequests": 1234,
    "totalCost": 12.34,
    "validation": {
      "valid": true,
      "missingRequiredKeys": [],
      "warnings": ["TWITTER not configured (optional but recommended)"]
    }
  },
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

### Cost Tracking

```bash
# Get cost report for last 30 days
GET /api/ucie/costs?days=30

# Get cost report for specific service
GET /api/ucie/costs?service=OPENAI

# Export cost history as CSV
GET /api/ucie/costs?format=csv
```

Response:
```json
{
  "summary": {
    "totalCost": 45.67,
    "dailyAverage": 1.52,
    "projectedMonthly": 45.60
  },
  "breakdown": [
    {
      "serviceName": "OPENAI",
      "totalCost": 23.45,
      "requestCount": 2345,
      "averageCostPerRequest": 0.01,
      "currency": "USD"
    }
  ],
  "alerts": [
    {
      "serviceName": "OPENAI",
      "threshold": 100,
      "currentCost": 85.50,
      "percentage": 85.5,
      "severity": "warning",
      "message": "OPENAI is approaching monthly cost threshold"
    }
  ],
  "optimizations": [
    {
      "serviceName": "COINMARKETCAP",
      "currentCost": 15.00,
      "potentialSavings": 12.00,
      "recommendation": "Consider using CoinGecko as primary source",
      "priority": "high"
    }
  ]
}
```

## Cost Optimization

### Best Practices

1. **Use Free Tiers First**
   - CoinGecko (free tier) before CoinMarketCap (paid)
   - DeFiLlama (free) for TVL data
   - Blockchain explorers (free) for on-chain data

2. **Implement Caching**
   - Cache API responses for 30-60 seconds
   - Use stale-while-revalidate pattern
   - Store frequently accessed data in Redis

3. **Batch Requests**
   - Combine multiple data points in single API calls
   - Use bulk endpoints when available
   - Aggregate requests from multiple users

4. **Monitor Usage**
   - Set cost thresholds and alerts
   - Review cost reports weekly
   - Implement optimization recommendations

5. **Use Appropriate Compute Units**
   - Caesar AI: Use 1-2 compute units for standard analysis
   - Caesar AI: Reserve 5-7 compute units for deep dives
   - OpenAI: Use GPT-4o-mini for simple tasks

### Cost Thresholds

Default monthly cost thresholds:
- OpenAI: $100/month
- Caesar AI: $50/month
- CoinMarketCap: $10/month
- Others: $0 (free tiers)

Set custom thresholds:
```typescript
import { costTracker } from './lib/ucie/costTracking';

costTracker.setThreshold('OPENAI', 150); // $150/month
costTracker.setThreshold('CAESAR', 75); // $75/month
```

## Troubleshooting

### Missing Required Keys

```bash
# Check which required keys are missing
curl http://localhost:3000/api/ucie/health | jq '.systemHealth.missingRequiredKeys'
```

### Rate Limit Errors

```typescript
// Check rate limit status
import { rateLimiters } from './lib/ucie/rateLimiters';

const state = rateLimiters.openai.getState();
if (state.availableTokens === 0) {
  console.log('Rate limited, waiting for reset...');
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
}
```

### API Health Issues

```typescript
// Check API health
const status = await apiKeyManager.checkHealth('OPENAI');
if (!status.available) {
  console.error(`API unavailable: ${status.errorMessage}`);
  // Use fallback service
}
```

### High Costs

```typescript
// Get cost optimization recommendations
const report = getCostReport(30);
report.optimizations.forEach(opt => {
  if (opt.priority === 'high') {
    console.log(`HIGH PRIORITY: ${opt.recommendation}`);
    console.log(`Potential savings: $${opt.potentialSavings.toFixed(2)}/month`);
  }
});
```

## Security

### Best Practices

1. **Never commit API keys to version control**
   - Use `.env.local` for development
   - Add `.env.local` to `.gitignore`
   - Use Vercel environment variables for production

2. **Rotate keys regularly**
   - Rotate every 6-12 months
   - Rotate immediately if compromised
   - Use different keys for dev/staging/production

3. **Limit key permissions**
   - Use read-only keys when possible
   - Restrict IP addresses if supported
   - Enable rate limiting on provider side

4. **Monitor usage**
   - Set up cost alerts
   - Review usage logs weekly
   - Investigate unusual patterns

5. **Use environment-specific keys**
   - Development: Lower rate limits, test keys
   - Staging: Production-like keys with monitoring
   - Production: Full-featured keys with strict monitoring

## Support

For issues or questions:
1. Check the [UCIE Documentation](../../.kiro/specs/universal-crypto-intelligence/)
2. Review the [API Integration Guide](../../.kiro/steering/api-integration.md)
3. Check API provider documentation
4. Contact support for specific API issues

## License

This API key management system is part of the Bitcoin Sovereign Technology platform.
