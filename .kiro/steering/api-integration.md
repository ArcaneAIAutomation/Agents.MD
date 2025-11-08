# API Integration Guidelines

## Multi-Source Data Strategy

**Current Status (November 2025)**: The platform uses multiple cryptocurrency data sources with intelligent fallback mechanisms and comprehensive API coverage.

#### Market Data APIs (✅ All Working)
- **CoinMarketCap API** - Primary market data source (paid plan)
- **CoinGecko API** - Secondary source with rate limiting
- **Kraken API** - Live trading data and order book analysis

#### News & Intelligence APIs (✅ All Working)
- **NewsAPI** - Real-time cryptocurrency news aggregation
- **Caesar API** - Advanced research and market intelligence
- **OpenAI GPT-4o** - AI-powered analysis and trade signal generation

#### Social Sentiment APIs (✅ All Working)
- **LunarCrush API** - Social metrics, sentiment, galaxy score
- **Twitter/X API** - Tweet analysis and influencer tracking
- **Reddit API** - Community sentiment analysis

#### DeFi APIs (✅ Working)
- **DeFiLlama API** - TVL data, protocol metrics (public API)

#### Blockchain APIs (✅ All Working)
- **Etherscan API V2** - Ethereum blockchain data (migrated from V1)
- **BSCScan API V2** - Binance Smart Chain data
- **Polygonscan API V2** - Polygon network data
- **Blockchain.com API** - Bitcoin blockchain data

#### AI APIs (✅ All Working)
- **OpenAI GPT-4o** - Advanced market analysis
- **Gemini AI** - Fast whale transaction analysis

#### Derivatives APIs (⚠️ Limited)
- **CoinGlass API** - Requires paid plan upgrade (free tier exhausted)
- **Binance Futures** - Recommended fallback (public API)

## API Status Summary (November 2025)

### Working APIs: 13/14 (92.9%)
- ✅ Market Data: CoinMarketCap, CoinGecko, Kraken
- ✅ News: NewsAPI, Caesar API
- ✅ Social: LunarCrush, Twitter/X, Reddit
- ✅ DeFi: DeFiLlama
- ✅ Blockchain: Etherscan V2, Blockchain.com
- ✅ AI: OpenAI, Gemini
- ❌ Derivatives: CoinGlass (requires upgrade)

### Recent Fixes (November 2025)
- ✅ Etherscan migrated from V1 to V2 API
- ✅ DeFi endpoint fixed (removed undefined functions)
- ✅ Comprehensive API testing implemented

## Caesar API Integration

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

#### Whale Watch (✅ Live in Production)
```typescript
GET /api/whale-watch/detect?threshold=50
// Returns: List of large Bitcoin transactions above threshold

POST /api/whale-watch/analyze
// Body: { txHash, amount, fromAddress, toAddress, ... }
// Returns: { success, jobId } - Starts Caesar AI research job

GET /api/whale-watch/analysis/[jobId]
// Returns: { status, analysis, sources } - Poll for analysis results
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

### API Protection Patterns

#### Analysis Lock System (Whale Watch)
To prevent API spam from multiple simultaneous requests:

```typescript
// 1. Track active analysis state
const [analyzingTx, setAnalyzingTx] = useState<string | null>(null);
const hasActiveAnalysis = (
  whaleData?.whales.some(w => w.analysisStatus === 'analyzing') || 
  analyzingTx !== null
);

// 2. Guard clause at function start
const analyzeTransaction = async (whale: WhaleTransaction) => {
  // STOP execution if any analysis is active
  if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
    console.log('⚠️ Analysis already in progress, ignoring click');
    return;
  }
  
  // 3. Immediately set state before API call
  setAnalyzingTx(whale.txHash);
  // Update status to 'analyzing' immediately
  // ... then make API call
};

// 4. Disable UI with pointer-events
<div 
  className={isDisabled ? 'pointer-events-none opacity-50' : ''}
  style={isDisabled ? { pointerEvents: 'none' } : undefined}
>
```

**Key Principles:**
- Guard clause prevents function execution
- Immediate state updates before async operations
- Pointer events disabled on UI elements
- Visual feedback (greyed out, disabled buttons)
- Clear user messaging about why actions are blocked

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