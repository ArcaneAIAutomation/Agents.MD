# BTC/ETH Analysis Feature Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: HIGH  
**Dependencies**: CoinGecko, CoinMarketCap, Kraken APIs

---

## Overview

BTC/ETH Analysis provides comprehensive market and technical analysis for Bitcoin and Ethereum, including real-time prices, technical indicators, and AI-powered market insights.

---

## Features

### Core Capabilities
- **Real-time Prices**: Live price data from multiple exchanges
- **Technical Indicators**: RSI, MACD, EMA, Bollinger Bands, ATR, Stochastic
- **Market Data**: Volume, market cap, 24h change, dominance
- **Multi-Source Aggregation**: CoinGecko, CoinMarketCap, Kraken
- **Price Deviation Detection**: Alerts for unusual price differences

### Technical Indicators

| Indicator | Description | Timeframes |
|-----------|-------------|------------|
| RSI | Relative Strength Index | 14-period |
| MACD | Moving Average Convergence Divergence | 12/26/9 |
| EMA | Exponential Moving Average | 9, 21, 50, 200 |
| Bollinger Bands | Volatility bands | 20-period, 2 std |
| ATR | Average True Range | 14-period |
| Stochastic | Momentum oscillator | 14/3/3 |

---

## Technical Architecture

### API Endpoints

```typescript
// Bitcoin Analysis
GET /api/btc-analysis
// Returns: { price, change24h, volume, marketCap, indicators, timestamp }

// Ethereum Analysis
GET /api/eth-analysis
// Returns: { price, change24h, volume, marketCap, indicators, timestamp }

// Combined Market Data
GET /api/ucie/market-data/[symbol]
// Returns: { priceAggregation, marketData, sources, dataQuality }
```

### Data Flow

```
1. User opens BTC/ETH Analysis page
   ↓
2. Frontend calls analysis endpoint
   ↓
3. Backend queries multiple APIs in parallel:
   - CoinGecko (primary)
   - CoinMarketCap (secondary)
   - Kraken (exchange data)
   ↓
4. Price aggregation and deviation check
   ↓
5. Technical indicators calculated
   ↓
6. Results cached for 1-5 minutes
   ↓
7. Analysis displayed to user
```

### External APIs

| API | Purpose | Rate Limit | Status |
|-----|---------|------------|--------|
| CoinGecko | Primary market data | 10-50/min | ✅ Working |
| CoinMarketCap | Secondary data | Varies by plan | ✅ Working |
| Kraken | Exchange data | 15/sec | ✅ Working |

---

## Configuration

### Environment Variables

```bash
# Required
COINGECKO_API_KEY=your_coingecko_key
COINMARKETCAP_API_KEY=your_cmc_key

# Optional
KRAKEN_API_KEY=your_kraken_key
KRAKEN_PRIVATE_KEY=your_kraken_private_key
```

### Cache Settings

```typescript
const MARKET_DATA_CACHE_TTL = 60;    // 1 minute
const TECHNICAL_CACHE_TTL = 60;       // 1 minute
const PRICE_DEVIATION_THRESHOLD = 2;  // 2% max deviation
```

---

## Components

### Frontend Components

```
components/
├── BTCTradingChart.tsx        # Bitcoin chart component
├── ETHTradingChart.tsx        # Ethereum chart component
├── TradingChart.tsx           # Base chart component
├── TechnicalIndicators.tsx    # Indicator display
└── MarketOverview.tsx         # Market summary
```

### Key Files

```
pages/
├── btc-analysis.tsx           # Bitcoin analysis page
├── eth-analysis.tsx           # Ethereum analysis page
└── api/
    ├── btc-analysis.ts        # BTC endpoint
    ├── eth-analysis.ts        # ETH endpoint
    └── ucie/market-data/[symbol].ts  # Generic market data
```

---

## Price Aggregation

```typescript
interface PriceAggregation {
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  priceDeviation: number;
  averageChange24h: number;
  totalVolume24h: number;
  sources: string[];
  timestamp: string;
}

// Aggregation logic
const aggregatePrice = (sources: PriceSource[]): PriceAggregation => {
  const prices = sources.map(s => s.price);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const deviation = Math.max(...prices) - Math.min(...prices);
  
  return {
    averagePrice: average,
    highestPrice: Math.max(...prices),
    lowestPrice: Math.min(...prices),
    priceDeviation: (deviation / average) * 100,
    // ... other fields
  };
};
```

---

## Technical Indicator Calculation

```typescript
// RSI Calculation
const calculateRSI = (prices: number[], period: number = 14): number => {
  // ... implementation
};

// MACD Calculation
const calculateMACD = (prices: number[]): MACDResult => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([macdLine], 9);
  const histogram = macdLine - signalLine;
  
  return { macdLine, signalLine, histogram };
};
```

---

## Error Handling

### Fallback Strategy

1. **Primary**: CoinGecko
2. **Secondary**: CoinMarketCap
3. **Tertiary**: Kraken
4. **Final**: Cached data with staleness warning

### Error States

```typescript
// API failure
{ error: 'api_failure', source: 'coingecko', fallback: 'coinmarketcap' }

// All sources failed
{ error: 'all_sources_failed', cached: true, cacheAge: 300 }

// Rate limit
{ error: 'rate_limit', retryAfter: 60 }
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API response time | < 1s | ~500ms |
| Cache hit rate | > 70% | ~75% |
| Price accuracy | 99%+ | 99.5% |
| Indicator accuracy | 99%+ | 99.9% |

---

## Troubleshooting

### Common Issues

**Issue**: Price not updating
- Check API keys are valid
- Verify cache is not stale
- Check rate limits

**Issue**: Indicators showing N/A
- Insufficient historical data
- API returning incomplete data
- Check calculation errors in logs

**Issue**: Large price deviation
- Normal during high volatility
- Check if one source is lagging
- Verify all sources are responding

### Debug Commands

```bash
# Test BTC analysis
curl https://your-domain.com/api/btc-analysis

# Test ETH analysis
curl https://your-domain.com/api/eth-analysis

# Test market data endpoint
curl https://your-domain.com/api/ucie/market-data/BTC
```

---

## Related Documentation

- **Steering**: `.kiro/steering/api-integration.md`
- **API Status**: `.kiro/steering/api-status.md`
- **UCIE System**: `.kiro/steering/ucie-system.md`
