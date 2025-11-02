# UCIE Market Data - Testing Guide

## 🧪 Testing Overview

This guide provides comprehensive testing instructions for the UCIE Market Data Integration (Task 3).

---

## 1. Manual Testing

### Test the API Endpoint

```bash
# Test Bitcoin
curl http://localhost:3000/api/ucie/market-data/BTC | jq

# Test Ethereum
curl http://localhost:3000/api/ucie/market-data/ETH | jq

# Test invalid symbol
curl http://localhost:3000/api/ucie/market-data/INVALID | jq

# Test cache (run twice quickly)
curl http://localhost:3000/api/ucie/market-data/BTC | jq '.cached'
curl http://localhost:3000/api/ucie/market-data/BTC | jq '.cached'
```

### Expected Response Structure

```json
{
  "success": true,
  "symbol": "BTC",
  "priceAggregation": {
    "symbol": "BTC",
    "prices": [
      {
        "exchange": "CoinGecko",
        "price": 95000.00,
        "volume24h": 50000000000,
        "change24h": 2.5,
        "timestamp": "2025-01-27T...",
        "success": true
      }
    ],
    "vwap": 95123.45,
    "averagePrice": 95100.00,
    "highestPrice": 95200.00,
    "lowestPrice": 95000.00,
    "priceVariance": 200.00,
    "priceVariancePercentage": 0.21,
    "totalVolume24h": 250000000000,
    "averageChange24h": 2.3,
    "arbitrageOpportunities": [],
    "dataQuality": 95.5,
    "timestamp": "2025-01-27T...",
    "fetchDuration": 1234
  },
  "marketData": {
    "marketCap": 1850000000000,
    "circulatingSupply": 19500000,
    "totalSupply": 21000000,
    "high24h": 96000.00,
    "low24h": 94000.00,
    "change7d": 5.2
  },
  "dataQuality": 96.2,
  "sources": ["CoinGecko", "CoinMarketCap", "Binance", "Kraken", "Coinbase"],
  "cached": false,
  "timestamp": "2025-01-27T..."
}
```

---

## 2. Component Testing

### Test MarketDataPanel Component

Create a test page: `pages/test-market-data.tsx`

```tsx
import { useState, useEffect } from 'react';
import MarketDataPanel from '../components/UCIE/MarketDataPanel';

export default function TestMarketData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ucie/market-data/BTC');
      const json = await res.json();
      
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-bitcoin-white">Loading...</div>;
  if (error) return <div className="p-8 text-bitcoin-orange">Error: {error}</div>;
  if (!data) return <div className="p-8 text-bitcoin-white">No data</div>;

  return (
    <div className="min-h-screen bg-bitcoin-black p-8">
      <h1 className="text-4xl font-bold text-bitcoin-white mb-8">
        Market Data Test
      </h1>
      
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
    </div>
  );
}
```

Visit: `http://localhost:3000/test-market-data`

---

## 3. Unit Testing

### Test API Clients

Create: `__tests__/lib/ucie/marketDataClients.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  coinGeckoClient,
  binanceClient,
  krakenClient,
} from '../../../lib/ucie/marketDataClients';

describe('Market Data Clients', () => {
  it('should fetch BTC price from CoinGecko', async () => {
    const price = await coinGeckoClient.getPrice('BTC');
    
    expect(price.symbol).toBe('BTC');
    expect(price.price).toBeGreaterThan(0);
    expect(price.source).toBe('coingecko');
  }, 15000);

  it('should fetch BTC price from Binance', async () => {
    const price = await binanceClient.getPrice('BTC');
    
    expect(price.symbol).toBe('BTC');
    expect(price.price).toBeGreaterThan(0);
    expect(price.source).toBe('binance');
  }, 10000);

  it('should fetch BTC order book from Kraken', async () => {
    const orderBook = await krakenClient.getOrderBook('BTC', 10);
    
    expect(orderBook.symbol).toBe('BTC');
    expect(orderBook.bids.length).toBeGreaterThan(0);
    expect(orderBook.asks.length).toBeGreaterThan(0);
  }, 10000);
});
```

### Test Price Aggregation

Create: `__tests__/lib/ucie/priceAggregation.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  aggregateExchangePrices,
  getBestPrice,
  hasSignificantDiscrepancy,
} from '../../../lib/ucie/priceAggregation';

describe('Price Aggregation', () => {
  it('should aggregate prices from multiple exchanges', async () => {
    const aggregation = await aggregateExchangePrices('BTC');
    
    expect(aggregation.symbol).toBe('BTC');
    expect(aggregation.vwap).toBeGreaterThan(0);
    expect(aggregation.prices.length).toBeGreaterThan(0);
    expect(aggregation.dataQuality).toBeGreaterThan(0);
    expect(aggregation.fetchDuration).toBeLessThan(3000);
  }, 15000);

  it('should calculate VWAP correctly', async () => {
    const aggregation = await aggregateExchangePrices('BTC');
    
    expect(aggregation.vwap).toBeGreaterThan(0);
    expect(aggregation.vwap).toBeCloseTo(aggregation.averagePrice, -2);
  }, 15000);

  it('should detect arbitrage opportunities', async () => {
    const aggregation = await aggregateExchangePrices('BTC');
    
    // May or may not have opportunities
    expect(Array.isArray(aggregation.arbitrageOpportunities)).toBe(true);
    
    if (aggregation.arbitrageOpportunities.length > 0) {
      const opp = aggregation.arbitrageOpportunities[0];
      expect(opp.spreadPercentage).toBeGreaterThanOrEqual(2);
      expect(opp.sellPrice).toBeGreaterThan(opp.buyPrice);
    }
  }, 15000);

  it('should get best buy and sell prices', async () => {
    const aggregation = await aggregateExchangePrices('BTC');
    
    const bestBuy = getBestPrice(aggregation, 'buy');
    const bestSell = getBestPrice(aggregation, 'sell');
    
    expect(bestBuy).not.toBeNull();
    expect(bestSell).not.toBeNull();
    
    if (bestBuy && bestSell) {
      expect(bestSell.price).toBeGreaterThanOrEqual(bestBuy.price);
    }
  }, 15000);
});
```

Run tests:
```bash
npm test -- marketDataClients.test.ts
npm test -- priceAggregation.test.ts
```

---

## 4. Integration Testing

### Test API Endpoint

Create: `__tests__/pages/api/ucie/market-data.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Market Data API', () => {
  const baseUrl = 'http://localhost:3000';

  it('should return market data for BTC', async () => {
    const res = await fetch(`${baseUrl}/api/ucie/market-data/BTC`);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.symbol).toBe('BTC');
    expect(data.priceAggregation).toBeDefined();
    expect(data.dataQuality).toBeGreaterThan(0);
  }, 20000);

  it('should cache responses', async () => {
    const res1 = await fetch(`${baseUrl}/api/ucie/market-data/ETH`);
    const data1 = await res1.json();
    
    const res2 = await fetch(`${baseUrl}/api/ucie/market-data/ETH`);
    const data2 = await res2.json();
    
    expect(data1.cached).toBe(false);
    expect(data2.cached).toBe(true);
  }, 20000);

  it('should handle invalid symbols', async () => {
    const res = await fetch(`${baseUrl}/api/ucie/market-data/INVALID123`);
    const data = await res.json();
    
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  }, 20000);

  it('should reject non-GET requests', async () => {
    const res = await fetch(`${baseUrl}/api/ucie/market-data/BTC`, {
      method: 'POST',
    });
    const data = await res.json();
    
    expect(res.status).toBe(405);
    expect(data.success).toBe(false);
  }, 20000);
});
```

---

## 5. Performance Testing

### Test Response Times

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Test 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:3000/api/ucie/market-data/BTC

# Expected results:
# - Mean response time: <500ms (with cache)
# - 95th percentile: <2000ms
# - No failed requests
```

### Test Cache Performance

```javascript
// test-cache-performance.js
async function testCachePerformance() {
  const symbol = 'BTC';
  const iterations = 10;
  
  console.log('Testing cache performance...\n');
  
  // First request (cache miss)
  const start1 = Date.now();
  const res1 = await fetch(`http://localhost:3000/api/ucie/market-data/${symbol}`);
  const data1 = await res1.json();
  const time1 = Date.now() - start1;
  
  console.log(`First request (cache miss): ${time1}ms`);
  console.log(`Cached: ${data1.cached}\n`);
  
  // Subsequent requests (cache hits)
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const res = await fetch(`http://localhost:3000/api/ucie/market-data/${symbol}`);
    const data = await res.json();
    const time = Date.now() - start;
    times.push(time);
    
    console.log(`Request ${i + 1} (cache hit): ${time}ms, Cached: ${data.cached}`);
  }
  
  const avgCacheHit = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\nAverage cache hit time: ${avgCacheHit.toFixed(2)}ms`);
  console.log(`Speedup: ${(time1 / avgCacheHit).toFixed(2)}x`);
}

testCachePerformance();
```

Run: `node test-cache-performance.js`

---

## 6. Mobile Testing

### Responsive Design

Test on these viewports:
- **Mobile**: 375x667 (iPhone SE)
- **Mobile**: 390x844 (iPhone 14)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080

### Touch Targets

Verify all interactive elements are ≥48px:
- Refresh button
- Table rows (hover)
- Arbitrage opportunity cards

### Performance

Test on mobile network:
- Throttle to "Fast 3G" in DevTools
- Verify <5 second load time
- Check auto-refresh doesn't overwhelm

---

## 7. Accessibility Testing

### WCAG AA Compliance

```bash
# Install axe-core
npm install --save-dev @axe-core/cli

# Run accessibility audit
npx axe http://localhost:3000/test-market-data
```

### Manual Checks

- [ ] All text has 4.5:1 contrast ratio
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader announces updates
- [ ] Color not sole indicator

---

## 8. Error Handling Testing

### Test API Failures

```javascript
// Temporarily break API keys in .env.local
COINMARKETCAP_API_KEY=invalid_key

// Test fallback behavior
curl http://localhost:3000/api/ucie/market-data/BTC | jq '.dataQuality'

// Should still return data from other sources
// Data quality should be lower but >0
```

### Test Network Errors

```javascript
// Use DevTools to simulate offline
// Or use network throttling

// Component should show error state
// API should return graceful error
```

---

## 9. Load Testing

### Concurrent Requests

```javascript
// test-load.js
async function loadTest() {
  const concurrency = 50;
  const symbol = 'BTC';
  
  console.log(`Testing ${concurrency} concurrent requests...\n`);
  
  const start = Date.now();
  const promises = Array(concurrency).fill(null).map(() =>
    fetch(`http://localhost:3000/api/ucie/market-data/${symbol}`)
      .then(res => res.json())
  );
  
  const results = await Promise.all(promises);
  const duration = Date.now() - start;
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total time: ${duration}ms`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average: ${(duration / concurrency).toFixed(2)}ms per request`);
}

loadTest();
```

---

## 10. Checklist

### Before Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests meet targets
- [ ] Mobile responsive on all devices
- [ ] Accessibility audit passes
- [ ] Error handling works correctly
- [ ] Cache behavior verified
- [ ] API rate limits respected
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

### Performance Targets

- [ ] Price aggregation: <2 seconds
- [ ] API response (cached): <500ms
- [ ] API response (uncached): <3 seconds
- [ ] Data quality score: >80%
- [ ] Cache hit rate: >80%

### Quality Targets

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Accessibility: WCAG AA
- [ ] Mobile: Works on 320px+
- [ ] Browser: Chrome, Firefox, Safari

---

## 📊 Test Results Template

```markdown
# Market Data Integration - Test Results

**Date**: January 27, 2025
**Tester**: [Your Name]
**Environment**: Development

## Unit Tests
- ✅ API Clients: 3/3 passing
- ✅ Price Aggregation: 4/4 passing

## Integration Tests
- ✅ API Endpoint: 4/4 passing
- ✅ Component Rendering: Pass

## Performance Tests
- ✅ Response Time: 1.2s avg (target: <2s)
- ✅ Cache Hit: 150ms avg (target: <500ms)
- ✅ Data Quality: 92% avg (target: >80%)

## Mobile Tests
- ✅ iPhone SE (375px): Pass
- ✅ iPhone 14 (390px): Pass
- ✅ iPad (768px): Pass

## Accessibility
- ✅ WCAG AA: Pass
- ✅ Keyboard Nav: Pass
- ✅ Screen Reader: Pass

## Issues Found
- None

## Recommendations
- Consider adding WebSocket for real-time updates
- Add more exchanges for better coverage
- Implement Redis for distributed caching
```

---

**Testing Status**: ✅ Ready for Testing  
**Coverage Target**: >80%  
**Performance Target**: <2s response time  
**Quality Target**: WCAG AA compliance
