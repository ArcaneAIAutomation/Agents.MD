# 🔄 Quantum BTC Data Pipeline Specification

**Status**: 🎯 **IMPLEMENTATION REQUIRED**  
**Priority**: **CRITICAL** - Real data needed for accurate AI analysis  
**Date**: January 27, 2025

---

## 🚨 Current Problem

**The system is using PLACEHOLDER data instead of REAL API data!**

```typescript
// ❌ CURRENT (Placeholder)
async function collectMarketData(): Promise<{ quality: number; data: any }> {
  return {
    quality: 85,
    data: {
      price: 95000,  // ← FAKE DATA
      volume: 25000000000,  // ← FAKE DATA
      marketCap: 1850000000000,  // ← FAKE DATA
    }
  };
}
```

**We need REAL data from:**
1. CoinMarketCap API
2. CoinGecko API
3. Kraken API
4. Blockchain.com API
5. LunarCrush API

---

## 🎯 Solution: Multi-Stage Data Pipeline

### **Stage 1: API Data Collection** (Parallel)
Fetch data from multiple sources simultaneously

### **Stage 2: Data Validation** (QDPP)
Verify data quality and detect anomalies

### **Stage 3: Cache Storage** (Supabase)
Store validated data in database cache

### **Stage 4: Context Aggregation** (QSIC)
Combine all data sources into comprehensive context

### **Stage 5: AI Analysis** (QSTGE)
Feed complete context to GPT-4o for trade generation

---

## 📋 Implementation Plan

### **Step 1: Create API Integration Modules**

#### **1.1 CoinMarketCap Integration**
```typescript
// lib/quantum/apis/coinmarketcap.ts
import { trackAPICall } from '../performanceMonitor';

interface CMCQuote {
  price: number;
  volume_24h: number;
  market_cap: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
}

export async function fetchCMCData(symbol: string = 'BTC'): Promise<CMCQuote> {
  return await trackAPICall(
    'CoinMarketCap',
    '/v1/cryptocurrency/quotes/latest',
    'GET',
    async () => {
      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY!,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`CMC API error: ${response.status}`);
      }
      
      const data = await response.json();
      const quote = data.data[symbol].quote.USD;
      
      return {
        price: quote.price,
        volume_24h: quote.volume_24h,
        market_cap: quote.market_cap,
        percent_change_1h: quote.percent_change_1h,
        percent_change_24h: quote.percent_change_24h,
        percent_change_7d: quote.percent_change_7d,
      };
    }
  );
}
```

#### **1.2 CoinGecko Integration**
```typescript
// lib/quantum/apis/coingecko.ts
export async function fetchCoinGeckoData(coinId: string = 'bitcoin'): Promise<any> {
  return await trackAPICall(
    'CoinGecko',
    '/api/v3/simple/price',
    'GET',
    async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        {
          headers: {
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        price: data[coinId].usd,
        market_cap: data[coinId].usd_market_cap,
        volume_24h: data[coinId].usd_24h_vol,
        percent_change_24h: data[coinId].usd_24h_change,
      };
    }
  );
}
```

#### **1.3 Kraken Integration**
```typescript
// lib/quantum/apis/kraken.ts
export async function fetchKrakenData(pair: string = 'XBTUSD'): Promise<any> {
  return await trackAPICall(
    'Kraken',
    '/0/public/Ticker',
    'GET',
    async () => {
      const response = await fetch(
        `https://api.kraken.com/0/public/Ticker?pair=${pair}`
      );
      
      if (!response.ok) {
        throw new Error(`Kraken API error: ${response.status}`);
      }
      
      const data = await response.json();
      const ticker = data.result[pair];
      
      return {
        price: parseFloat(ticker.c[0]), // Last trade price
        volume_24h: parseFloat(ticker.v[1]), // 24h volume
        high_24h: parseFloat(ticker.h[1]),
        low_24h: parseFloat(ticker.l[1]),
      };
    }
  );
}
```

#### **1.4 Blockchain.com Integration**
```typescript
// lib/quantum/apis/blockchain.ts
export async function fetchBlockchainData(): Promise<any> {
  return await trackAPICall(
    'Blockchain.com',
    '/stats',
    'GET',
    async () => {
      const response = await fetch('https://blockchain.info/stats?format=json');
      
      if (!response.ok) {
        throw new Error(`Blockchain.com API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        mempoolSize: data.n_tx_mempool || 0,
        difficulty: data.difficulty || 0,
        hashRate: data.hash_rate || 0,
        totalBTC: data.totalbc / 100000000, // Convert satoshis to BTC
      };
    }
  );
}
```

#### **1.5 LunarCrush Integration**
```typescript
// lib/quantum/apis/lunarcrush.ts
export async function fetchLunarCrushData(symbol: string = 'BTC'): Promise<any> {
  return await trackAPICall(
    'LunarCrush',
    '/v2/assets',
    'GET',
    async () => {
      const response = await fetch(
        `https://api.lunarcrush.com/v2?data=assets&symbol=${symbol}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`LunarCrush API error: ${response.status}`);
      }
      
      const data = await response.json();
      const asset = data.data[0];
      
      return {
        sentiment: asset.sentiment || 50,
        socialDominance: asset.social_dominance || 0,
        galaxyScore: asset.galaxy_score || 0,
        altRank: asset.alt_rank || 0,
        socialVolume: asset.social_volume || 0,
      };
    }
  );
}
```

---

### **Step 2: Create Data Aggregation Service**

```typescript
// lib/quantum/dataAggregator.ts
import { fetchCMCData } from './apis/coinmarketcap';
import { fetchCoinGeckoData } from './apis/coingecko';
import { fetchKrakenData } from './apis/kraken';
import { fetchBlockchainData } from './apis/blockchain';
import { fetchLunarCrushData } from './apis/lunarcrush';

export interface AggregatedMarketData {
  price: {
    cmc: number;
    coingecko: number;
    kraken: number;
    median: number;
    divergence: number; // Percentage difference between highest and lowest
  };
  volume: {
    cmc: number;
    coingecko: number;
    kraken: number;
    average: number;
  };
  marketCap: {
    cmc: number;
    coingecko: number;
    average: number;
  };
  onChain: {
    mempoolSize: number;
    difficulty: number;
    hashRate: number;
    totalBTC: number;
  };
  sentiment: {
    score: number;
    socialDominance: number;
    galaxyScore: number;
    altRank: number;
    socialVolume: number;
  };
  dataQuality: number;
  timestamp: string;
}

export async function aggregateMarketData(): Promise<AggregatedMarketData> {
  console.log('[Data Aggregator] Fetching data from all sources...');
  
  // Fetch all data in parallel
  const [cmcData, coinGeckoData, krakenData, blockchainData, lunarCrushData] = await Promise.all([
    fetchCMCData('BTC').catch(err => {
      console.error('[CMC] Error:', err);
      return null;
    }),
    fetchCoinGeckoData('bitcoin').catch(err => {
      console.error('[CoinGecko] Error:', err);
      return null;
    }),
    fetchKrakenData('XBTUSD').catch(err => {
      console.error('[Kraken] Error:', err);
      return null;
    }),
    fetchBlockchainData().catch(err => {
      console.error('[Blockchain.com] Error:', err);
      return null;
    }),
    fetchLunarCrushData('BTC').catch(err => {
      console.error('[LunarCrush] Error:', err);
      return null;
    }),
  ]);
  
  // Calculate median price
  const prices = [
    cmcData?.price,
    coinGeckoData?.price,
    krakenData?.price,
  ].filter(p => p !== null && p !== undefined) as number[];
  
  const sortedPrices = prices.sort((a, b) => a - b);
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Calculate price divergence
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceDivergence = ((maxPrice - minPrice) / medianPrice) * 100;
  
  // Calculate data quality score
  let qualityScore = 100;
  
  // Deduct points for missing data sources
  if (!cmcData) qualityScore -= 20;
  if (!coinGeckoData) qualityScore -= 15;
  if (!krakenData) qualityScore -= 15;
  if (!blockchainData) qualityScore -= 25;
  if (!lunarCrushData) qualityScore -= 25;
  
  // Deduct points for high price divergence
  if (priceDivergence > 1) qualityScore -= 10;
  if (priceDivergence > 2) qualityScore -= 20;
  
  // Deduct points for invalid on-chain data
  if (blockchainData && blockchainData.mempoolSize === 0) qualityScore -= 15;
  
  console.log(`[Data Aggregator] Quality score: ${qualityScore}%`);
  console.log(`[Data Aggregator] Price divergence: ${priceDivergence.toFixed(2)}%`);
  
  return {
    price: {
      cmc: cmcData?.price || 0,
      coingecko: coinGeckoData?.price || 0,
      kraken: krakenData?.price || 0,
      median: medianPrice,
      divergence: priceDivergence,
    },
    volume: {
      cmc: cmcData?.volume_24h || 0,
      coingecko: coinGeckoData?.volume_24h || 0,
      kraken: krakenData?.volume_24h || 0,
      average: ((cmcData?.volume_24h || 0) + (coinGeckoData?.volume_24h || 0) + (krakenData?.volume_24h || 0)) / 3,
    },
    marketCap: {
      cmc: cmcData?.market_cap || 0,
      coingecko: coinGeckoData?.market_cap || 0,
      average: ((cmcData?.market_cap || 0) + (coinGeckoData?.market_cap || 0)) / 2,
    },
    onChain: {
      mempoolSize: blockchainData?.mempoolSize || 0,
      difficulty: blockchainData?.difficulty || 0,
      hashRate: blockchainData?.hashRate || 0,
      totalBTC: blockchainData?.totalBTC || 0,
    },
    sentiment: {
      score: lunarCrushData?.sentiment || 50,
      socialDominance: lunarCrushData?.socialDominance || 0,
      galaxyScore: lunarCrushData?.galaxyScore || 0,
      altRank: lunarCrushData?.altRank || 0,
      socialVolume: lunarCrushData?.socialVolume || 0,
    },
    dataQuality: Math.max(0, qualityScore),
    timestamp: new Date().toISOString(),
  };
}
```

---

### **Step 3: Create Cache Service**

```typescript
// lib/quantum/cacheService.ts
import { query } from '../db';
import { AggregatedMarketData } from './dataAggregator';

export async function cacheMarketData(data: AggregatedMarketData): Promise<void> {
  const sql = `
    INSERT INTO quantum_btc_market_data (
      id, symbol, timestamp,
      price_median, price_cmc, price_coingecko, price_kraken, price_divergence,
      volume_average, volume_cmc, volume_coingecko, volume_kraken,
      market_cap_average, market_cap_cmc, market_cap_coingecko,
      mempool_size, difficulty, hash_rate, total_btc,
      sentiment_score, social_dominance, galaxy_score, alt_rank, social_volume,
      data_quality_score
    ) VALUES (
      gen_random_uuid(), 'BTC', $1,
      $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, $20, $21, $22,
      $23
    )
  `;
  
  await query(sql, [
    data.timestamp,
    data.price.median,
    data.price.cmc,
    data.price.coingecko,
    data.price.kraken,
    data.price.divergence,
    data.volume.average,
    data.volume.cmc,
    data.volume.coingecko,
    data.volume.kraken,
    data.marketCap.average,
    data.marketCap.cmc,
    data.marketCap.coingecko,
    data.onChain.mempoolSize,
    data.onChain.difficulty,
    data.onChain.hashRate,
    data.onChain.totalBTC,
    data.sentiment.score,
    data.sentiment.socialDominance,
    data.sentiment.galaxyScore,
    data.sentiment.altRank,
    data.sentiment.socialVolume,
    data.dataQuality,
  ]);
  
  console.log('[Cache] Market data stored successfully');
}

export async function getCachedMarketData(maxAgeMinutes: number = 5): Promise<AggregatedMarketData | null> {
  const sql = `
    SELECT * FROM quantum_btc_market_data
    WHERE symbol = 'BTC'
      AND timestamp > NOW() - INTERVAL '${maxAgeMinutes} minutes'
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  
  const result = await query(sql);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    price: {
      cmc: row.price_cmc,
      coingecko: row.price_coingecko,
      kraken: row.price_kraken,
      median: row.price_median,
      divergence: row.price_divergence,
    },
    volume: {
      cmc: row.volume_cmc,
      coingecko: row.volume_coingecko,
      kraken: row.volume_kraken,
      average: row.volume_average,
    },
    marketCap: {
      cmc: row.market_cap_cmc,
      coingecko: row.market_cap_coingecko,
      average: row.market_cap_average,
    },
    onChain: {
      mempoolSize: row.mempool_size,
      difficulty: row.difficulty,
      hashRate: row.hash_rate,
      totalBTC: row.total_btc,
    },
    sentiment: {
      score: row.sentiment_score,
      socialDominance: row.social_dominance,
      galaxyScore: row.galaxy_score,
      altRank: row.alt_rank,
      socialVolume: row.social_volume,
    },
    dataQuality: row.data_quality_score,
    timestamp: row.timestamp,
  };
}
```

---

### **Step 4: Update Trade Generation Endpoint**

Replace placeholder functions with real data pipeline:

```typescript
// pages/api/quantum/generate-btc-trade.ts

import { aggregateMarketData } from '../../../lib/quantum/dataAggregator';
import { cacheMarketData, getCachedMarketData } from '../../../lib/quantum/cacheService';

async function collectMarketData(): Promise<{ quality: number; data: AggregatedMarketData }> {
  // Check cache first (5-minute TTL)
  const cached = await getCachedMarketData(5);
  
  if (cached) {
    console.log('[Data Pipeline] Using cached market data');
    return {
      quality: cached.dataQuality,
      data: cached,
    };
  }
  
  // Fetch fresh data from all APIs
  console.log('[Data Pipeline] Fetching fresh market data from all sources');
  const aggregated = await aggregateMarketData();
  
  // Cache the data
  await cacheMarketData(aggregated);
  
  return {
    quality: aggregated.dataQuality,
    data: aggregated,
  };
}
```

---

## 🎯 Implementation Priority

### **Phase 1: Core APIs** (2-3 hours)
1. ✅ CoinMarketCap integration
2. ✅ CoinGecko integration
3. ✅ Kraken integration

### **Phase 2: On-Chain & Sentiment** (1-2 hours)
4. ✅ Blockchain.com integration
5. ✅ LunarCrush integration

### **Phase 3: Data Pipeline** (1-2 hours)
6. ✅ Data aggregation service
7. ✅ Cache service
8. ✅ Update trade generation endpoint

### **Phase 4: Testing** (1 hour)
9. ✅ Test each API individually
10. ✅ Test data aggregation
11. ✅ Test cache system
12. ✅ Test end-to-end trade generation

---

## ✅ Success Criteria

- [ ] All 5 APIs returning real data
- [ ] Data quality score calculated correctly
- [ ] Price divergence detection working
- [ ] Cache system storing data in Supabase
- [ ] Trade generation using real market data
- [ ] GPT-4o receiving comprehensive context
- [ ] No placeholder data in production

---

## 📊 Expected Data Quality

**With all APIs working:**
- Data Quality Score: 90-100%
- Price Divergence: < 1%
- Cache Hit Rate: > 80%
- API Response Time: < 2 seconds

**With some APIs failing:**
- Data Quality Score: 50-89%
- System still functional with degraded quality
- Clear warnings to user about data quality

---

**Status**: 📋 **SPECIFICATION COMPLETE - READY FOR IMPLEMENTATION**  
**Next Step**: Implement Phase 1 (Core APIs)  
**Estimated Time**: 5-8 hours total

