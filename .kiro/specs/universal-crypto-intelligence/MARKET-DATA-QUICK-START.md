# UCIE Market Data Integration - Quick Start Guide

## 🚀 Quick Start

### 1. Environment Setup

Add these API keys to your `.env.local`:

```bash
# Optional - for higher rate limits
COINGECKO_API_KEY=your_coingecko_pro_key

# Required for CoinMarketCap fallback
COINMARKETCAP_API_KEY=your_coinmarketcap_key
```

### 2. API Usage

```typescript
// Fetch market data for Bitcoin
const response = await fetch('/api/ucie/market-data/BTC');
const data = await response.json();

if (data.success) {
  console.log('VWAP:', data.priceAggregation.vwap);
  console.log('Quality:', data.dataQuality);
  console.log('Arbitrage:', data.priceAggregation.arbitrageOpportunities);
}
```

### 3. Component Usage

```tsx
import MarketDataPanel from '@/components/UCIE/MarketDataPanel';
import { useState, useEffect } from 'react';

function MyPage() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await fetch('/api/ucie/market-data/BTC');
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <MarketDataPanel
      symbol="BTC"
      aggregation={data.priceAggregation}
      marketCap={data.marketData?.marketCap}
      circulatingSupply={data.marketData?.circulatingSupply}
      totalSupply={data.marketData?.totalSupply}
      onRefresh={fetchData}
      autoRefresh={true}
      refreshInterval={5000}
    />
  );
}
```

## 📊 Supported Exchanges

1. **CoinGecko** - Primary data source
2. **CoinMarketCap** - Fallback source
3. **Binance** - Real-time prices
4. **Kraken** - Order book data
5. **Coinbase** - Additional coverage

## 🎯 Key Features

### Price Aggregation
- **VWAP**: Volume-weighted average price
- **Average**: Simple average across exchanges
- **Range**: High/low prices
- **Variance**: Price discrepancy detection

### Arbitrage Detection
- Identifies spreads >2%
- Calculates potential profit
- Provides buy/sell recommendations
- Sorted by profitability

### Data Quality
- 0-100 quality score
- Based on success rate and variance
- Color-coded indicators
- Source attribution

### Caching
- 30-second in-memory cache
- Automatic invalidation
- Cache hit indicator
- Reduces API calls

## 🔧 API Client Usage

```typescript
import {
  coinGeckoClient,
  binanceClient,
  krakenClient,
} from '@/lib/ucie/marketDataClients';

// Get price from specific exchange
const btcPrice = await binanceClient.getPrice('BTC');
console.log(btcPrice.price);

// Get order book
const orderBook = await krakenClient.getOrderBook('BTC', 100);
console.log(orderBook.bids, orderBook.asks);

// Get comprehensive market data
const marketData = await coinGeckoClient.getMarketData('BTC');
console.log(marketData.marketCap, marketData.volume24h);
```

## 📈 Price Aggregation Functions

```typescript
import {
  aggregateExchangePrices,
  getBestPrice,
  hasSignificantDiscrepancy,
  getPriceSummary,
} from '@/lib/ucie/priceAggregation';

// Aggregate prices from all exchanges
const aggregation = await aggregateExchangePrices('BTC');

// Get best buy price (lowest)
const bestBuy = getBestPrice(aggregation, 'buy');
console.log(`Buy at ${bestBuy?.exchange}: $${bestBuy?.price}`);

// Get best sell price (highest)
const bestSell = getBestPrice(aggregation, 'sell');
console.log(`Sell at ${bestSell?.exchange}: $${bestSell?.price}`);

// Check for significant discrepancy
if (hasSignificantDiscrepancy(aggregation)) {
  console.log('Warning: Price variance >2%');
}

// Get human-readable summary
console.log(getPriceSummary(aggregation));
```

## 🎨 Styling

All components use **Bitcoin Sovereign** design system:

- **Colors**: Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Fonts**: Inter (UI), Roboto Mono (data)
- **Borders**: Thin orange (1-2px)
- **Mobile**: Touch-optimized (48px min)
- **Contrast**: WCAG AA compliant

## ⚡ Performance

- **Price Aggregation**: <2 seconds
- **API Response**: <3 seconds (cached)
- **Cache TTL**: 30 seconds
- **Timeout**: 15 seconds max
- **Parallel Fetching**: All exchanges simultaneously

## 🛡️ Error Handling

```typescript
try {
  const data = await fetch('/api/ucie/market-data/BTC');
  const json = await data.json();
  
  if (!json.success) {
    console.error('API Error:', json.error);
    // Handle error
  }
  
  if (json.dataQuality < 60) {
    console.warn('Low data quality:', json.dataQuality);
    // Show warning to user
  }
  
} catch (error) {
  console.error('Network error:', error);
  // Show error message
}
```

## 📱 Mobile Optimization

- **Responsive Grid**: 1 column (mobile) → 4 columns (desktop)
- **Touch Targets**: 48px minimum
- **Auto-Refresh**: Configurable interval
- **Loading States**: Spinner and disabled states
- **Overflow**: Horizontal scroll for tables

## 🔍 Debugging

```typescript
// Enable detailed logging
const aggregation = await aggregateExchangePrices('BTC');

console.log('Successful exchanges:', 
  aggregation.prices.filter(p => p.success).length
);

console.log('Failed exchanges:', 
  aggregation.prices.filter(p => !p.success).map(p => ({
    exchange: p.exchange,
    error: p.error
  }))
);

console.log('Fetch duration:', aggregation.fetchDuration, 'ms');
console.log('Data quality:', aggregation.dataQuality, '%');
```

## 🚨 Common Issues

### Issue: API Rate Limit Exceeded
**Solution**: Add API keys to `.env.local` for higher limits

### Issue: Timeout Errors
**Solution**: Check network connection, increase timeout in client

### Issue: Low Data Quality
**Solution**: Check API keys, verify exchange availability

### Issue: No Arbitrage Opportunities
**Solution**: Normal - only shows when spread >2%

## 📚 Type Definitions

```typescript
interface PriceAggregation {
  symbol: string;
  prices: ExchangePrice[];
  vwap: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  priceVariance: number;
  priceVariancePercentage: number;
  totalVolume24h: number;
  averageChange24h: number;
  arbitrageOpportunities: ArbitrageOpportunity[];
  dataQuality: number;
  timestamp: string;
  fetchDuration: number;
}

interface ExchangePrice {
  exchange: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  potentialProfit: number;
}
```

## 🎯 Next Steps

1. **Test the API**: `curl http://localhost:3000/api/ucie/market-data/BTC`
2. **Add Component**: Import and use `MarketDataPanel`
3. **Customize**: Adjust refresh interval, styling
4. **Monitor**: Check data quality scores
5. **Optimize**: Add more exchanges, tune caching

## 📖 Documentation

- **Full Spec**: `.kiro/specs/universal-crypto-intelligence/`
- **Requirements**: `requirements.md`
- **Design**: `design.md`
- **Tasks**: `tasks.md`
- **Summary**: `TASK-3-IMPLEMENTATION-SUMMARY.md`

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
