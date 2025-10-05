# API Integration Guidelines

## AgentMDC Branch - Caesar API Exclusive

**IMPORTANT:** The AgentMDC branch uses **Caesar API exclusively** as the sole data source for all cryptocurrency market data, technical analysis, trade signals, and news. This is a dedicated branch for Caesar API integration testing and development.

### Primary Data Source (AgentMDC Branch Only)

#### Caesar API - Exclusive Data Source
- **Base URL**: `https://api.caesar.xyz/v1`
- **Authentication**: Bearer token in Authorization header
- **API Key**: Configured in environment variables
- **Features**: Market data, technical analysis, trade signals, news, sentiment analysis
- **Documentation**: https://docs.caesar.xyz/get-started/introduction

### Main Branch - Multi-Source Data Strategy

The main branch continues to use multiple cryptocurrency data sources with intelligent fallback mechanisms:

#### Market Data APIs (Main Branch)
- **CoinGecko API** - Primary market data source with rate limiting
- **CoinMarketCap API** - Secondary source with premium features
- **Kraken API** - Live trading data and order book analysis

#### News & Intelligence APIs (Main Branch)
- **NewsAPI** - Real-time cryptocurrency news aggregation
- **CryptoCompare** - Additional news source and market insights
- **OpenAI GPT-4o** - AI-powered analysis and trade signal generation

## Caesar API Integration (AgentMDC Branch)

### Available Endpoints

#### Market Data
```typescript
GET /api/caesar-market-data?symbol=BTC
// Returns: Real-time price, volume, market cap, technical indicators
```

#### Trade Signals
```typescript
GET /api/caesar-trade-signals?symbol=BTC
// Returns: AI-powered buy/sell signals with confidence scores
```

#### News & Sentiment
```typescript
GET /api/caesar-news?symbols=BTC,ETH&limit=15
// Returns: Cryptocurrency news with sentiment analysis
```

#### Health Monitoring
```typescript
GET /api/caesar-health
// Returns: API status, latency, uptime
```

### Caesar API Client

```typescript
import {
  getCaesarMarketData,
  getCaesarTechnicalAnalysis,
  getCaesarTradeSignals,
  getCaesarNews,
  caesarHealthCheck
} from '../utils/caesarApi';
```

### React Hooks

```typescript
import {
  useCaesarMarketData,
  useCaesarTradeSignals,
  useCaesarNews,
  useCaesarHealth
} from '../hooks/useCaesarData';
```

### Mobile-Optimized API Patterns

#### Request Optimization
```typescript
// Mobile-friendly timeout and retry logic
const fetchWithFallback = async (primaryUrl: string, fallbackUrl: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s mobile timeout
  
  try {
    const response = await fetch(primaryUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CryptoHerald/1.0' }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Primary API timeout, trying fallback...');
      return fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) });
    }
    throw error;
  }
};
```

#### Data Caching Strategy
- **Client-side caching**: 30 seconds for market data, 5 minutes for news
- **Stale-while-revalidate**: Show cached data immediately, update in background
- **Mobile bandwidth consideration**: Compress responses, minimize payload size
- **Offline support**: Cache critical data for offline viewing

### Error Handling & Fallbacks

#### API Failure Hierarchy
1. **Primary Source**: CoinGecko/CoinMarketCap with full features
2. **Secondary Source**: Alternative API with reduced features
3. **Cached Data**: Last known good data with timestamp
4. **Fallback Content**: Static data with clear indicators

#### Mobile-Specific Error States
```typescript
interface APIErrorState {
  type: 'network' | 'timeout' | 'rateLimit' | 'serverError';
  source: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  mobileOptimized: boolean;
}
```

### Rate Limiting & Performance

#### Request Management
- **Batch requests**: Combine multiple data points in single calls
- **Request queuing**: Prevent API spam on mobile networks
- **Exponential backoff**: Smart retry logic for failed requests
- **Connection awareness**: Adjust request frequency based on connection type

#### Mobile Performance Optimization
```typescript
// Adaptive request strategy based on connection
const getRequestStrategy = (connectionType: string) => {
  switch (connectionType) {
    case 'slow-2g':
      return { timeout: 30000, retries: 1, batchSize: 1 };
    case '2g':
      return { timeout: 20000, retries: 2, batchSize: 2 };
    case '3g':
      return { timeout: 15000, retries: 3, batchSize: 5 };
    default: // 4g, wifi
      return { timeout: 10000, retries: 3, batchSize: 10 };
  }
};
```

## Real-Time Data Integration

### WebSocket Connections (Future Enhancement)
- **Connection management**: Auto-reconnect with exponential backoff
- **Mobile battery optimization**: Reduce update frequency on low battery
- **Background sync**: Continue updates when app is backgrounded
- **Data compression**: Minimize bandwidth usage on mobile networks

### Polling Strategy
- **Adaptive intervals**: Faster updates on desktop, slower on mobile
- **Visibility API**: Pause updates when tab/app is not visible
- **Network-aware**: Adjust frequency based on connection quality
- **Battery-aware**: Reduce updates on low battery devices

## Data Validation & Quality

### Response Validation
```typescript
interface MarketDataResponse {
  price: number;
  change24h: number;
  volume: number;
  timestamp: string;
  source: string;
  confidence: number; // Data quality score
}

const validateMarketData = (data: any): MarketDataResponse | null => {
  if (!data || typeof data.price !== 'number' || data.price <= 0) {
    return null;
  }
  // Additional validation logic...
  return data as MarketDataResponse;
};
```

### Cross-Source Verification
- **Price deviation alerts**: Flag unusual price differences between sources
- **Timestamp validation**: Ensure data freshness across sources
- **Confidence scoring**: Rate data quality based on source reliability
- **Anomaly detection**: Identify and filter suspicious data points

## Security & API Key Management

### Environment Configuration
```bash
# Production API Keys (Vercel Environment Variables)
OPENAI_API_KEY=sk-...
COINMARKETCAP_API_KEY=...
NEWS_API_KEY=...
COINGECKO_API_KEY=... # Optional, for rate limit increases

# Development Fallbacks
DEVELOPMENT_MODE=true
MOCK_API_RESPONSES=false
```

### Request Security
- **API key rotation**: Regular key updates for production
- **Rate limit monitoring**: Track usage across all endpoints
- **Request signing**: HMAC signatures for sensitive endpoints
- **IP whitelisting**: Restrict API access to known sources

## Mobile-Specific API Considerations

### Bandwidth Optimization
- **Response compression**: Gzip/Brotli compression enabled
- **Field selection**: Request only needed data fields
- **Image optimization**: Responsive images with multiple formats
- **Lazy loading**: Load non-critical data after initial render

### Offline Capabilities
- **Service worker**: Cache API responses for offline access
- **Background sync**: Queue requests when offline, sync when online
- **Critical data priority**: Ensure essential data is always cached
- **Offline indicators**: Clear UI feedback for offline state

### Progressive Enhancement
- **Core functionality**: Basic price display without JavaScript
- **Enhanced features**: Real-time updates, charts, advanced analysis
- **Graceful degradation**: Fallback to static data when APIs fail
- **Performance budgets**: Monitor and limit API request overhead

## Monitoring & Analytics

### API Health Monitoring
```typescript
interface APIHealthMetrics {
  endpoint: string;
  responseTime: number;
  successRate: number;
  errorRate: number;
  lastSuccess: string;
  mobilePerformance: {
    averageResponseTime: number;
    timeoutRate: number;
    retryRate: number;
  };
}
```

### Performance Tracking
- **Response times**: Track API latency across different networks
- **Success rates**: Monitor API reliability and uptime
- **Error categorization**: Classify and track different error types
- **Mobile metrics**: Specific tracking for mobile device performance

### User Experience Metrics
- **Time to first data**: How quickly users see initial content
- **Interactive readiness**: When users can interact with data
- **Error recovery time**: How quickly the app recovers from API failures
- **Offline experience**: Quality of offline functionality