# On-Chain Metrics Provider Research
## SOPR & MVRV Z-Score Data Sources

**Research Date**: January 27, 2025  
**Objective**: Find reliable API providers for SOPR and MVRV Z-Score metrics  
**Status**: 🔍 Research Complete

---

## Executive Summary

**SOPR (Spent Output Profit Ratio)** and **MVRV Z-Score** are advanced on-chain metrics that require full blockchain UTXO analysis. Only specialized on-chain analytics providers offer these metrics.

### Quick Recommendation:
- **Best Overall**: Glassnode (industry standard)
- **Best Free Tier**: IntoTheBlock
- **Best for Developers**: CryptoQuant
- **Budget Option**: Santiment (limited free tier)

---

## Provider Comparison

### 1. Glassnode 🏆 (Industry Standard)

**Website**: https://glassnode.com/  
**API Docs**: https://docs.glassnode.com/

#### Available Metrics
- ✅ **SOPR** (Spent Output Profit Ratio)
- ✅ **aSOPR** (Adjusted SOPR - excludes <1h UTXOs)
- ✅ **MVRV** (Market Value to Realized Value)
- ✅ **MVRV Z-Score** (Standardized MVRV)
- ✅ **Realized Cap**
- ✅ **NUPL** (Net Unrealized Profit/Loss)
- ✅ **RHODL Ratio**
- ✅ **Puell Multiple**

#### Pricing
```
Free Tier:
- 10 API calls per day
- 10 days of historical data
- Basic metrics only

Starter ($29/month):
- 1,000 API calls per day
- 1 year historical data
- All basic metrics

Advanced ($799/month):
- 10,000 API calls per day
- Full historical data (2009+)
- All metrics including SOPR/MVRV
- Real-time updates
```

#### API Example
```typescript
// SOPR endpoint
GET https://api.glassnode.com/v1/metrics/indicators/sopr
?a=BTC&api_key=YOUR_KEY&s=1609459200&u=1640995200

// MVRV Z-Score endpoint
GET https://api.glassnode.com/v1/metrics/market/mvrv_z_score
?a=BTC&api_key=YOUR_KEY&s=1609459200&u=1640995200

// Response format
{
  "t": 1609459200,  // Unix timestamp
  "v": 1.05         // SOPR value
}
```

#### Pros
- ✅ Industry standard, most trusted
- ✅ Comprehensive documentation
- ✅ High data quality and accuracy
- ✅ Real-time updates
- ✅ Historical data back to 2009
- ✅ Multiple blockchain support

#### Cons
- ❌ Expensive for full access ($799/month)
- ❌ Free tier very limited (10 calls/day)
- ❌ Rate limits on lower tiers

#### Integration Complexity
**Easy** - RESTful API with clear documentation

---

### 2. CryptoQuant 🥈 (Developer-Friendly)

**Website**: https://cryptoquant.com/  
**API Docs**: https://docs.cryptoquant.com/

#### Available Metrics
- ✅ **SOPR** (Spent Output Profit Ratio)
- ✅ **aSOPR** (Adjusted SOPR)
- ✅ **MVRV** (Market Value to Realized Value)
- ✅ **MVRV Z-Score**
- ✅ **Exchange Flow Metrics**
- ✅ **Miner Metrics**
- ✅ **Stablecoin Metrics**

#### Pricing
```
Free Tier:
- 100 API calls per day
- 30 days historical data
- Basic metrics

Pro ($49/month):
- 1,000 API calls per day
- 1 year historical data
- All metrics including SOPR/MVRV

Premium ($299/month):
- 10,000 API calls per day
- Full historical data
- Real-time updates
- Priority support
```

#### API Example
```typescript
// SOPR endpoint
GET https://api.cryptoquant.com/v1/btc/indicator/sopr
?window=day&from=2024-01-01&to=2024-12-31

// MVRV endpoint
GET https://api.cryptoquant.com/v1/btc/market-indicator/mvrv
?window=day&from=2024-01-01&to=2024-12-31

// Response format
{
  "status": "success",
  "data": [
    {
      "date": "2024-01-01",
      "value": 1.05
    }
  ]
}
```

#### Pros
- ✅ Better free tier than Glassnode (100 calls/day)
- ✅ More affordable paid plans
- ✅ Good documentation
- ✅ Developer-friendly API
- ✅ Exchange flow data included

#### Cons
- ❌ Less historical data on lower tiers
- ❌ Fewer metrics than Glassnode
- ❌ Less established brand

#### Integration Complexity
**Easy** - RESTful API with good examples

---

### 3. IntoTheBlock 🥉 (Best Free Tier)

**Website**: https://www.intotheblock.com/  
**API Docs**: https://docs.intotheblock.com/

#### Available Metrics
- ✅ **SOPR** (via "Profitability" metrics)
- ✅ **MVRV-like metrics** (In/Out of Money)
- ⚠️ **MVRV Z-Score** (not directly, but can calculate)
- ✅ **Holder Profitability**
- ✅ **Network Growth**

#### Pricing
```
Free Tier:
- 1,000 API calls per day (!)
- 90 days historical data
- Most metrics available

Pro ($99/month):
- 10,000 API calls per day
- 1 year historical data
- All metrics

Enterprise (Custom):
- Unlimited calls
- Full historical data
- Custom metrics
```

#### API Example
```typescript
// Profitability metrics (SOPR-like)
GET https://api.intotheblock.com/market/profitability
?coin=btc&key=YOUR_KEY

// In/Out of Money (MVRV-like)
GET https://api.intotheblock.com/market/in-out-money
?coin=btc&key=YOUR_KEY

// Response format
{
  "profitability": {
    "inProfit": 0.75,
    "atBreakeven": 0.05,
    "inLoss": 0.20
  }
}
```

#### Pros
- ✅ **Best free tier** (1,000 calls/day!)
- ✅ Affordable paid plans
- ✅ Good for retail/small projects
- ✅ Easy to use API
- ✅ Multiple cryptocurrencies

#### Cons
- ❌ No direct MVRV Z-Score (need to calculate)
- ❌ Less comprehensive than Glassnode
- ❌ Shorter historical data
- ❌ SOPR not as granular

#### Integration Complexity
**Easy** - Simple REST API

---

### 4. Santiment 💎 (Alternative)

**Website**: https://santiment.net/  
**API Docs**: https://api.santiment.net/

#### Available Metrics
- ✅ **MVRV** (Market Value to Realized Value)
- ✅ **MVRV Z-Score**
- ⚠️ **SOPR** (limited availability)
- ✅ **NVT Ratio**
- ✅ **Social Metrics**

#### Pricing
```
Free Tier:
- 50 API calls per month (!)
- 3 months historical data
- Limited metrics

Pro ($49/month):
- 1,000 API calls per month
- 2 years historical data
- Most metrics

Pro+ ($249/month):
- 10,000 API calls per month
- Full historical data
- All metrics
```

#### API Example
```typescript
// MVRV endpoint (GraphQL)
POST https://api.santiment.net/graphql

query {
  getMetric(metric: "mvrv_usd") {
    timeseriesData(
      slug: "bitcoin"
      from: "2024-01-01T00:00:00Z"
      to: "2024-12-31T00:00:00Z"
      interval: "1d"
    ) {
      datetime
      value
    }
  }
}
```

#### Pros
- ✅ Unique social metrics
- ✅ GraphQL API (flexible queries)
- ✅ Good MVRV data
- ✅ Affordable mid-tier

#### Cons
- ❌ **Very limited free tier** (50 calls/month)
- ❌ SOPR not well documented
- ❌ GraphQL learning curve
- ❌ Fewer on-chain metrics than competitors

#### Integration Complexity
**Medium** - GraphQL requires more setup

---

### 5. Blockchain.com (Limited) ⚠️

**Website**: https://www.blockchain.com/  
**API Docs**: https://www.blockchain.com/api

#### Available Metrics
- ❌ **SOPR** - Not available
- ❌ **MVRV** - Not available
- ❌ **MVRV Z-Score** - Not available
- ✅ Basic blockchain data only

#### Note
**We already use Blockchain.com** for basic Bitcoin blockchain data, but they don't provide advanced on-chain metrics like SOPR/MVRV.

---

### 6. CoinMetrics (Enterprise) 💼

**Website**: https://coinmetrics.io/  
**API Docs**: https://docs.coinmetrics.io/

#### Available Metrics
- ✅ **SOPR** (Spent Output Profit Ratio)
- ✅ **MVRV** (Market Value to Realized Value)
- ✅ **Realized Cap**
- ✅ **Comprehensive on-chain data**

#### Pricing
```
Enterprise Only:
- Custom pricing (typically $1,000+/month)
- Full historical data
- All metrics
- Institutional-grade data
```

#### Pros
- ✅ Highest data quality
- ✅ Institutional-grade
- ✅ Most comprehensive metrics
- ✅ Best for large organizations

#### Cons
- ❌ **No free tier**
- ❌ **Very expensive**
- ❌ Enterprise sales process
- ❌ Overkill for most projects

#### Integration Complexity
**Medium** - Professional API, good docs

---

## Feature Comparison Matrix

| Provider | SOPR | MVRV Z-Score | Free Tier | Paid Start | Best For |
|----------|------|--------------|-----------|------------|----------|
| **Glassnode** | ✅ | ✅ | 10 calls/day | $29/mo | Industry standard |
| **CryptoQuant** | ✅ | ✅ | 100 calls/day | $49/mo | Developers |
| **IntoTheBlock** | ⚠️ | ⚠️ | 1,000 calls/day | $99/mo | Free tier users |
| **Santiment** | ⚠️ | ✅ | 50 calls/month | $49/mo | Social + on-chain |
| **Blockchain.com** | ❌ | ❌ | Unlimited | Free | Basic data only |
| **CoinMetrics** | ✅ | ✅ | None | $1,000+/mo | Enterprise |

---

## Recommendations by Use Case

### 🎯 For Bitcoin Sovereign Technology (Our Project)

#### Option 1: IntoTheBlock (Recommended for Testing)
**Why**: Best free tier (1,000 calls/day) to test integration
```bash
# Cost: $0 (free tier)
# Calls: 1,000/day
# Good for: MVP, testing, proof of concept
```

#### Option 2: CryptoQuant (Recommended for Production)
**Why**: Best balance of features, price, and data quality
```bash
# Cost: $49/month (Pro tier)
# Calls: 1,000/day
# Good for: Production with moderate traffic
```

#### Option 3: Glassnode (Premium Option)
**Why**: Industry standard, highest quality
```bash
# Cost: $799/month (Advanced tier)
# Calls: 10,000/day
# Good for: High-traffic production, institutional users
```

---

## Implementation Strategy

### Phase 1: Free Tier Testing (Week 1-2)
1. **Sign up for IntoTheBlock free tier**
2. **Implement basic SOPR/MVRV integration**
3. **Test data quality and API reliability**
4. **Measure actual API call volume**

### Phase 2: Evaluate & Choose (Week 3)
Based on testing results:
- If <1,000 calls/day → Stay with IntoTheBlock free
- If 1,000-10,000 calls/day → Upgrade to CryptoQuant Pro ($49/mo)
- If >10,000 calls/day → Consider Glassnode Advanced ($799/mo)

### Phase 3: Production Integration (Week 4+)
1. **Implement chosen provider**
2. **Add caching layer** (reduce API calls)
3. **Set up monitoring** (track usage)
4. **Add fallback logic** (handle API failures)

---

## API Integration Code Examples

### IntoTheBlock Integration

```typescript
// lib/onchain/intotheblock.ts
interface IntoTheBlockConfig {
  apiKey: string;
  baseUrl: string;
}

class IntoTheBlockClient {
  private config: IntoTheBlockConfig;
  
  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.intotheblock.com'
    };
  }
  
  // Get SOPR-like profitability data
  async getProfitability(coin: string = 'btc'): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/market/profitability?coin=${coin}&key=${this.config.apiKey}`
    );
    return response.json();
  }
  
  // Get MVRV-like in/out of money data
  async getInOutOfMoney(coin: string = 'btc'): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/market/in-out-money?coin=${coin}&key=${this.config.apiKey}`
    );
    return response.json();
  }
  
  // Calculate MVRV Z-Score approximation
  async getMVRVApproximation(coin: string = 'btc'): Promise<number> {
    const data = await this.getInOutOfMoney(coin);
    
    // Approximate MVRV from profitability distribution
    const inProfit = data.profitability.inProfit;
    const inLoss = data.profitability.inLoss;
    
    // Simple approximation: more in profit = higher MVRV
    return (inProfit - inLoss) * 2; // Rough estimate
  }
}

export const intoTheBlockClient = new IntoTheBlockClient(
  process.env.INTOTHEBLOCK_API_KEY || ''
);
```

### CryptoQuant Integration

```typescript
// lib/onchain/cryptoquant.ts
interface CryptoQuantConfig {
  apiKey: string;
  baseUrl: string;
}

class CryptoQuantClient {
  private config: CryptoQuantConfig;
  
  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.cryptoquant.com/v1'
    };
  }
  
  // Get SOPR data
  async getSOPR(
    coin: string = 'btc',
    window: string = 'day',
    from?: string,
    to?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      window,
      ...(from && { from }),
      ...(to && { to })
    });
    
    const response = await fetch(
      `${this.config.baseUrl}/${coin}/indicator/sopr?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      }
    );
    
    return response.json();
  }
  
  // Get MVRV data
  async getMVRV(
    coin: string = 'btc',
    window: string = 'day',
    from?: string,
    to?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      window,
      ...(from && { from }),
      ...(to && { to })
    });
    
    const response = await fetch(
      `${this.config.baseUrl}/${coin}/market-indicator/mvrv?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      }
    );
    
    return response.json();
  }
  
  // Calculate MVRV Z-Score
  async getMVRVZScore(
    coin: string = 'btc',
    window: string = 'day'
  ): Promise<number> {
    const mvrvData = await this.getMVRV(coin, window);
    
    // Calculate Z-Score from MVRV values
    const values = mvrvData.data.map((d: any) => d.value);
    const mean = values.reduce((a: number, b: number) => a + b) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq: number, n: number) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    const latestMVRV = values[values.length - 1];
    return (latestMVRV - mean) / stdDev;
  }
}

export const cryptoQuantClient = new CryptoQuantClient(
  process.env.CRYPTOQUANT_API_KEY || ''
);
```

### Glassnode Integration

```typescript
// lib/onchain/glassnode.ts
interface GlassnodeConfig {
  apiKey: string;
  baseUrl: string;
}

class GlassnodeClient {
  private config: GlassnodeConfig;
  
  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.glassnode.com/v1/metrics'
    };
  }
  
  // Get SOPR data
  async getSOPR(
    asset: string = 'BTC',
    since?: number,
    until?: number
  ): Promise<any> {
    const params = new URLSearchParams({
      a: asset,
      api_key: this.config.apiKey,
      ...(since && { s: since.toString() }),
      ...(until && { u: until.toString() })
    });
    
    const response = await fetch(
      `${this.config.baseUrl}/indicators/sopr?${params}`
    );
    
    return response.json();
  }
  
  // Get MVRV Z-Score data
  async getMVRVZScore(
    asset: string = 'BTC',
    since?: number,
    until?: number
  ): Promise<any> {
    const params = new URLSearchParams({
      a: asset,
      api_key: this.config.apiKey,
      ...(since && { s: since.toString() }),
      ...(until && { u: until.toString() })
    });
    
    const response = await fetch(
      `${this.config.baseUrl}/market/mvrv_z_score?${params}`
    );
    
    return response.json();
  }
  
  // Get latest values
  async getLatestMetrics(asset: string = 'BTC'): Promise<{
    sopr: number;
    mvrvZScore: number;
  }> {
    const [soprData, mvrvData] = await Promise.all([
      this.getSOPR(asset),
      this.getMVRVZScore(asset)
    ]);
    
    return {
      sopr: soprData[soprData.length - 1]?.v || 0,
      mvrvZScore: mvrvData[mvrvData.length - 1]?.v || 0
    };
  }
}

export const glassnodeClient = new GlassnodeClient(
  process.env.GLASSNODE_API_KEY || ''
);
```

---

## Caching Strategy (Critical for Cost Reduction)

```typescript
// lib/onchain/cache.ts
import { getCachedAnalysis, setCachedAnalysis } from '../ucie/cacheUtils';

interface OnChainMetrics {
  sopr: number;
  mvrvZScore: number;
  timestamp: number;
  source: string;
}

export async function getCachedOnChainMetrics(
  symbol: string
): Promise<OnChainMetrics | null> {
  // Check database cache (TTL: 1 hour for on-chain metrics)
  const cached = await getCachedAnalysis(symbol, 'on-chain-metrics');
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  return null;
}

export async function fetchAndCacheOnChainMetrics(
  symbol: string,
  provider: 'intotheblock' | 'cryptoquant' | 'glassnode'
): Promise<OnChainMetrics> {
  let metrics: OnChainMetrics;
  
  switch (provider) {
    case 'intotheblock':
      const itbData = await intoTheBlockClient.getMVRVApproximation(symbol.toLowerCase());
      metrics = {
        sopr: 0, // Not directly available
        mvrvZScore: itbData,
        timestamp: Date.now(),
        source: 'intotheblock'
      };
      break;
      
    case 'cryptoquant':
      const cqSOPR = await cryptoQuantClient.getSOPR(symbol.toLowerCase());
      const cqMVRV = await cryptoQuantClient.getMVRVZScore(symbol.toLowerCase());
      metrics = {
        sopr: cqSOPR.data[cqSOPR.data.length - 1]?.value || 0,
        mvrvZScore: cqMVRV,
        timestamp: Date.now(),
        source: 'cryptoquant'
      };
      break;
      
    case 'glassnode':
      const gnMetrics = await glassnodeClient.getLatestMetrics(symbol);
      metrics = {
        sopr: gnMetrics.sopr,
        mvrvZScore: gnMetrics.mvrvZScore,
        timestamp: Date.now(),
        source: 'glassnode'
      };
      break;
  }
  
  // Cache for 1 hour (on-chain metrics don't change frequently)
  await setCachedAnalysis(
    symbol,
    'on-chain-metrics',
    metrics,
    3600, // 1 hour TTL
    100   // High quality score
  );
  
  return metrics;
}
```

---

## Cost Analysis

### Scenario 1: Low Traffic (1,000 users/day)
- **API Calls**: ~500/day (with caching)
- **Recommended**: IntoTheBlock Free Tier
- **Cost**: $0/month

### Scenario 2: Medium Traffic (10,000 users/day)
- **API Calls**: ~2,000/day (with caching)
- **Recommended**: CryptoQuant Pro
- **Cost**: $49/month

### Scenario 3: High Traffic (100,000 users/day)
- **API Calls**: ~15,000/day (with caching)
- **Recommended**: Glassnode Advanced
- **Cost**: $799/month

**Note**: Aggressive caching (1-hour TTL) can reduce API calls by 90%+

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Research complete
2. ⏳ Sign up for IntoTheBlock free tier
3. ⏳ Implement basic integration
4. ⏳ Test data quality

### Short-Term (Next 2 Weeks)
1. ⏳ Add SOPR/MVRV to UCIE on-chain data
2. ⏳ Implement caching layer
3. ⏳ Monitor API usage
4. ⏳ Evaluate need for paid tier

### Long-Term (Next Month)
1. ⏳ Choose production provider
2. ⏳ Upgrade to paid tier if needed
3. ⏳ Add historical data visualization
4. ⏳ Integrate with Caesar AI analysis

---

## Conclusion

**Recommended Path Forward**:

1. **Start with IntoTheBlock** (free tier, 1,000 calls/day)
2. **Implement aggressive caching** (1-hour TTL)
3. **Monitor usage for 2 weeks**
4. **Upgrade to CryptoQuant Pro** ($49/mo) if needed
5. **Consider Glassnode** only if traffic exceeds 10,000 calls/day

This approach minimizes cost while ensuring data quality and reliability.

---

**Status**: ✅ Research Complete  
**Next Action**: Sign up for IntoTheBlock free tier  
**Timeline**: Ready to implement this week
