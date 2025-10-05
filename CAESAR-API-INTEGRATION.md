# Caesar API Integration - AgentMDC Branch

## Overview

The AgentMDC branch is configured to use **Caesar API exclusively** as the primary data source for all cryptocurrency market data, technical analysis, trade signals, and news.

## Configuration

### Environment Variables

```bash
# Caesar API Configuration
CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
NEXT_PUBLIC_CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
USE_CAESAR_API_ONLY=true
```

### API Base URL

```
https://api.caesar.xyz/v1
```

## Features

### 1. Market Data
- Real-time cryptocurrency prices
- 24h price changes and volume
- Market capitalization
- High/low prices

**Endpoint:** `/api/caesar-market-data?symbol=BTC`

### 2. Technical Analysis
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- EMA (Exponential Moving Averages)
- Bollinger Bands
- Trend signals and recommendations

**Endpoint:** `/api/caesar-market-data?symbol=BTC`

### 3. Trade Signals
- AI-powered buy/sell signals
- Confidence scores
- Entry prices, stop loss, take profit levels
- Detailed reasoning for each signal
- Multiple timeframe analysis

**Endpoint:** `/api/caesar-trade-signals?symbol=BTC`

### 4. News & Sentiment
- Real-time cryptocurrency news
- Sentiment analysis (positive/negative/neutral)
- Impact assessment (high/medium/low)
- Source attribution
- Symbol-specific filtering

**Endpoint:** `/api/caesar-news?symbols=BTC,ETH&limit=15`

### 5. Health Monitoring
- API status checks
- Latency monitoring
- Uptime tracking

**Endpoint:** `/api/caesar-health`

## Usage

### React Hooks

```typescript
import { 
  useCaesarMarketData, 
  useCaesarTradeSignals, 
  useCaesarNews,
  useCaesarHealth 
} from '../hooks/useCaesarData';

// Market data with auto-refresh
const { data, loading, error, refetch } = useCaesarMarketData({ 
  symbol: 'BTC',
  refreshInterval: 30000 // 30 seconds
});

// Trade signals
const { data: signals } = useCaesarTradeSignals({ 
  symbol: 'BTC',
  refreshInterval: 60000 // 1 minute
});

// News feed
const { data: news } = useCaesarNews(['BTC', 'ETH'], 15, 300000);

// API health
const { health } = useCaesarHealth(60000);
```

### Direct API Calls

```typescript
import {
  getCaesarMarketData,
  getCaesarTechnicalAnalysis,
  getCaesarTradeSignals,
  getCaesarNews,
  getCaesarHistoricalData,
  getCaesarOrderBook,
  caesarHealthCheck
} from '../utils/caesarApi';

// Fetch market data
const marketData = await getCaesarMarketData('BTC');

// Fetch technical analysis
const analysis = await getCaesarTechnicalAnalysis('BTC', '1h');

// Fetch trade signals
const signals = await getCaesarTradeSignals('BTC');

// Fetch news
const news = await getCaesarNews(['BTC', 'ETH'], 15);

// Health check
const health = await caesarHealthCheck();
```

### Components

```typescript
import CaesarDashboard from '../components/CaesarDashboard';

// Full dashboard with market data, signals, and news
<CaesarDashboard symbol="BTC" />
```

## API Response Formats

### Market Data Response
```json
{
  "success": true,
  "data": {
    "market": {
      "symbol": "BTC",
      "price": 45000,
      "change24h": 2.5,
      "volume24h": 25000000000,
      "marketCap": 850000000000,
      "high24h": 46000,
      "low24h": 44000,
      "timestamp": "2024-01-01T00:00:00Z"
    },
    "technical": {
      "indicators": {
        "rsi": 65.5,
        "macd": { "value": 150, "signal": 120, "histogram": 30 },
        "ema": { "ema20": 44500, "ema50": 43000, "ema200": 40000 }
      },
      "signals": {
        "trend": "bullish",
        "strength": 75,
        "recommendation": "buy"
      }
    }
  },
  "source": "Caesar API",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Trade Signals Response
```json
{
  "success": true,
  "signals": [
    {
      "symbol": "BTC",
      "action": "buy",
      "confidence": 0.85,
      "entryPrice": 45000,
      "stopLoss": 43500,
      "takeProfit": [46500, 48000, 50000],
      "reasoning": "Strong bullish momentum with RSI confirmation...",
      "timeframe": "4h",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "source": "Caesar API",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### News Response
```json
{
  "success": true,
  "news": [
    {
      "id": "news-123",
      "title": "Bitcoin Reaches New All-Time High",
      "summary": "Bitcoin surpasses $50,000 mark...",
      "sentiment": "positive",
      "impact": "high",
      "source": "CoinDesk",
      "url": "https://...",
      "publishedAt": "2024-01-01T00:00:00Z",
      "relatedSymbols": ["BTC"]
    }
  ],
  "source": "Caesar API",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

All API calls include comprehensive error handling:

```typescript
try {
  const data = await getCaesarMarketData('BTC');
} catch (error) {
  // Errors include:
  // - API key not configured
  // - Network timeouts (15s default)
  // - HTTP errors (4xx, 5xx)
  // - Invalid responses
  console.error('Caesar API error:', error.message);
}
```

## Mobile Optimization

- **Timeout Management**: 15s timeout for mobile connections
- **Auto-retry**: Failed requests automatically retry with backoff
- **Caching**: Client-side caching reduces API calls
- **Progressive Loading**: Show cached data while fetching updates
- **Bandwidth Awareness**: Optimized payload sizes for mobile

## Performance

- **Refresh Intervals**:
  - Market Data: 30 seconds
  - Trade Signals: 60 seconds
  - News: 5 minutes
  - Health Check: 1 minute

- **Caching Strategy**:
  - Client-side caching with stale-while-revalidate
  - Background updates without blocking UI
  - Offline support with last known data

## Testing

```bash
# Test Caesar API health
curl http://localhost:3000/api/caesar-health

# Test market data
curl http://localhost:3000/api/caesar-market-data?symbol=BTC

# Test trade signals
curl http://localhost:3000/api/caesar-trade-signals?symbol=BTC

# Test news
curl http://localhost:3000/api/caesar-news?symbols=BTC,ETH&limit=10
```

## Documentation

Official Caesar API Documentation: https://docs.caesar.xyz/get-started/introduction

## Branch Strategy

This Caesar API integration is **exclusive to the AgentMDC branch**. The main branch continues to use the original multi-source API strategy. Never merge AgentMDC to main without explicit permission.

## Support

For Caesar API issues:
- Check API health: `/api/caesar-health`
- Review error logs in browser console
- Verify API key configuration in `.env.local`
- Consult Caesar API documentation

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced charting with Caesar historical data
- [ ] Portfolio tracking integration
- [ ] Custom alert system based on Caesar signals
- [ ] Multi-exchange arbitrage detection
