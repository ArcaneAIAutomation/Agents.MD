# UCIE API Routing Strategy
**Date**: January 27, 2025  
**Purpose**: Optimize API selection for each data type to maximize reliability and minimize costs  
**Scope**: Universal Crypto Intelligence Engine (UCIE) only

---

## Executive Summary

Based on audit of available API clients and configured API keys, here's the optimal routing strategy for each UCIE data type. This strategy **excludes Binance** as requested and prioritizes the most suitable APIs for each job.

### Available API Keys (from .env.local)

✅ **Configured and Ready:**
- OpenAI (GPT-4o) - AI analysis
- Caesar API - Deep research
- CoinGecko - Market data
- CoinMarketCap - Market data
- Kraken - Exchange data
- NewsAPI - News aggregation
- CryptoCompare - News (key missing, uses public API)
- LunarCrush - Social sentiment
- Twitter/X - Social sentiment
- CoinGlass - Derivatives data
- Etherscan/BSCScan/Polygonscan - Blockchain data
- Gemini AI - Whale analysis

❌ **Not Configured:**
- Alpha Vantage (disabled)
- Bybit, Deribit (optional derivatives)
- Messari (optional DeFi)
- Reddit (uses public API)

---

## Phase 1: Critical Data (Price, Volume, Risk)

### 1.1 Price Data (`/api/ucie/price/[symbol]`)

**Primary Source**: CoinGecko API  
**Fallback 1**: CoinMarketCap API  
**Fallback 2**: Kraken API  
**Fallback 3**: Coinbase Public API (no key required)

**Rationale:**
- CoinGecko: Best coverage (10,000+ tokens), reliable, good rate limits
- CoinMarketCap: Premium data quality, good for major tokens
- Kraken: Real-time exchange data, no regional restrictions
- Coinbase: Public API for additional coverage

**Implementation:**
```typescript
// lib/ucie/priceAggregation.ts
async function fetchPrice(symbol: string): Promise<PriceData> {
  // Layer 1: CoinGecko (primary)
  try {
    return await coinGeckoClient.getPrice(symbol);
  } catch (error) {
    console.warn('CoinGecko failed, trying CoinMarketCap...');
  }
  
  // Layer 2: CoinMarketCap (fallback)
  try {
    return await coinMarketCapClient.getPrice(symbol);
  } catch (error) {
    console.warn('CoinMarketCap failed, trying Kraken...');
  }
  
  // Layer 3: Kraken (exchange data)
  try {
    return await krakenClient.getPrice(symbol);
  } catch (error) {
    console.warn('Kraken failed, trying Coinbase...');
  }
  
  // Layer 4: Coinbase (last resort)
  return await coinbaseClient.getPrice(symbol);
}
```

### 1.2 Volume Data (`/api/ucie/volume/[symbol]`)

**Primary Source**: CoinGecko API  
**Fallback 1**: CoinMarketCap API  
**Fallback 2**: Kraken API

**Rationale:**
- CoinGecko: Aggregated volume across exchanges
- CoinMarketCap: Verified volume data
- Kraken: Real exchange volume

### 1.3 Risk Assessment (`/api/ucie/risk/[symbol]`)

**Data Sources:**
- **Historical Prices**: CoinGecko API (365 days OHLCV)
- **Market Data**: CoinGecko → CoinMarketCap fallback
- **On-Chain Data**: Etherscan API (for supported tokens)

**Current Issue**: ❌ Undefined variable `symbolUpper`  
**Fix Priority**: 🔴 CRITICAL (5 minutes)

---

## Phase 2: Important Data (News, Sentiment)

### 2.1 News Aggregation (`/api/ucie/news/[symbol]`)

**Primary Source**: NewsAPI  
**Secondary Source**: CryptoCompare (public API)  
**Tertiary Source**: Caesar API (for deep research)

**Rationale:**
- NewsAPI: Best general news coverage, 20 articles per request
- CryptoCompare: Crypto-specific news, no key required
- Caesar: Deep research for major events (use sparingly due to cost)

**Current Issue**: ⚠️ 3-second timeout too short  
**Fix**: Increase to 10 seconds

**Implementation:**
```typescript
// lib/ucie/newsFetching.ts
export async function fetchAllNews(symbol: string): Promise<NewsArticle[]> {
  const [newsAPI, cryptoCompare] = await Promise.allSettled([
    fetchNewsAPI(symbol),           // Primary: NewsAPI
    fetchCryptoCompareNews(symbol)  // Secondary: CryptoCompare
  ]);
  
  // Aggregate and deduplicate
  const articles = [
    ...(newsAPI.status === 'fulfilled' ? newsAPI.value : []),
    ...(cryptoCompare.status === 'fulfilled' ? cryptoCompare.value : [])
  ];
  
  return deduplicateAndSort(articles);
}
```

### 2.2 Social Sentiment (`/api/ucie/sentiment/[symbol]`)

**Primary Source**: LunarCrush API  
**Secondary Source**: Twitter/X API  
**Tertiary Source**: Reddit Public API

**Rationale:**
- LunarCrush: Comprehensive social metrics (social score, galaxy score, trending)
- Twitter: Real-time sentiment, influencer tracking
- Reddit: Community sentiment, subreddit analysis

**Implementation:**
```typescript
// lib/ucie/socialSentimentClients.ts
export async function fetchAggregatedSocialSentiment(symbol: string) {
  const [lunarCrush, twitter, reddit] = await Promise.allSettled([
    fetchLunarCrushData(symbol),    // Primary: Best aggregated data
    fetchTwitterMetrics(symbol),     // Secondary: Real-time tweets
    fetchRedditMetrics(symbol)       // Tertiary: Community discussions
  ]);
  
  return {
    lunarCrush: lunarCrush.status === 'fulfilled' ? lunarCrush.value : null,
    twitter: twitter.status === 'fulfilled' ? twitter.value : null,
    reddit: reddit.status === 'fulfilled' ? reddit.value : null
  };
}
```

---

## Phase 3: Enhanced Data (Technical, On-Chain, DeFi)

### 3.1 Technical Analysis (`/api/ucie/technical/[symbol]`)

**Historical Data Source**: CoinGecko API  
**Fallback**: CoinMarketCap API  
**Real-time Data**: Kraken API

**Current Issue**: ❌ Wrong CoinGecko ID mapping  
**Fix Priority**: 🔴 CRITICAL (15 minutes)

**Implementation:**
```typescript
// pages/api/ucie/technical/[symbol].ts
async function fetchHistoricalData(symbol: string): Promise<OHLCVData[]> {
  // Get correct CoinGecko ID
  const coinGeckoId = getCoinGeckoId(symbol);
  
  // Try CoinGecko first (best OHLCV data)
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/ohlc?vs_currency=usd&days=365`,
      {
        headers: { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY },
        signal: AbortSignal.timeout(10000)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return transformToOHLCV(data);
    }
  } catch (error) {
    console.warn('CoinGecko OHLCV failed, trying CoinMarketCap...');
  }
  
  // Fallback to CoinMarketCap
  try {
    return await fetchCoinMarketCapOHLCV(symbol);
  } catch (error) {
    throw new Error('Failed to fetch historical data from all sources');
  }
}

// Add CoinGecko ID mapping
function getCoinGeckoId(symbol: string): string {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'XRP': 'ripple',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AVAX': 'avalanche-2',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'VET': 'vechain',
    'ICP': 'internet-computer',
    'FIL': 'filecoin',
    'TRX': 'tron'
  };
  
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}
```

### 3.2 On-Chain Analytics (`/api/ucie/on-chain/[symbol]`)

**Primary Source**: Etherscan API (Ethereum, BSC, Polygon)  
**Secondary Source**: Blockchain.com API (Bitcoin)  
**Fallback**: Return graceful null data for unsupported tokens

**Current Issue**: ❌ Only 11 tokens supported, XRP returns 404  
**Fix Priority**: 🔴 CRITICAL (10 minutes)

**Implementation:**
```typescript
// pages/api/ucie/on-chain/[symbol].ts
export default async function handler(req, res) {
  const { symbol } = req.query;
  const symbolUpper = symbol.toUpperCase();
  
  // Check if token has contract address
  const tokenContract = TOKEN_CONTRACTS[symbolUpper];
  
  if (!tokenContract) {
    // ✅ Return graceful fallback instead of 404
    return res.status(200).json({
      success: true,
      symbol: symbolUpper,
      chain: 'unknown',
      tokenInfo: null,
      holderDistribution: {
        topHolders: [],
        concentration: {
          giniCoefficient: 0,
          top10Percentage: 0,
          top50Percentage: 0,
          top100Percentage: 0,
          distributionScore: 0
        }
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          largestTransaction: 0
        }
      },
      exchangeFlows: {
        inflow24h: 0,
        outflow24h: 0,
        netFlow: 0,
        trend: 'neutral'
      },
      smartContract: {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: [],
        warnings: ['On-chain data not available for this token'],
        strengths: [],
        auditStatus: 'not_available'
      },
      walletBehavior: {
        smartMoneyAccumulating: false,
        whaleActivity: 'neutral',
        retailSentiment: 'neutral',
        confidence: 0
      },
      dataQuality: 0,
      timestamp: new Date().toISOString(),
      message: `On-chain analysis not available for ${symbolUpper}. This token may not have a smart contract or is not supported on Ethereum/BSC/Polygon networks.`
    });
  }
  
  // Continue with normal on-chain analysis for supported tokens
  // ...
}
```

### 3.3 DeFi Metrics (`/api/ucie/defi/[symbol]`)

**Primary Source**: DeFiLlama API (no key required)  
**Secondary Source**: The Graph API (protocol-specific)  
**Tertiary Source**: Messari API (if key configured)

**Current Issue**: ⚠️ Poor error handling for non-DeFi tokens  
**Fix Priority**: 🟡 MEDIUM (5 minutes)

**Implementation:**
```typescript
// pages/api/ucie/defi/[symbol].ts
export default async function handler(req, res) {
  const { symbol } = req.query;
  const symbolUpper = symbol.toUpperCase();
  
  try {
    // Check if token is a DeFi protocol
    const isDefi = await isDeFiProtocol(symbolUpper);
    
    if (!isDefi) {
      // ✅ Return success with isDeFiProtocol: false instead of 500
      return res.status(200).json({
        success: true,
        data: {
          isDeFiProtocol: false,
          tvlAnalysis: null,
          revenueAnalysis: null,
          utilityAnalysis: null,
          developmentAnalysis: null,
          peerComparison: null,
          summary: `${symbolUpper} is not identified as a DeFi protocol.`,
          dataQuality: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Continue with DeFi analysis for protocols
    // ...
  } catch (error) {
    // Proper error handling
    console.error('DeFi API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
```

---

## Phase 4: Deep Analysis (AI Research, Predictions)

### 4.1 Predictions (`/api/ucie/predictions/[symbol]`)

**Historical Data**: CoinGecko API (365 days)  
**Market Conditions**: Technical API + Sentiment API  
**AI Analysis**: OpenAI GPT-4o

**Current Issue**: ❌ Cascading failure from Technical API  
**Fix Priority**: 🔴 CRITICAL (depends on Technical API fix)

**Implementation:**
```typescript
// pages/api/ucie/predictions/[symbol].ts
async function fetchMarketConditions(symbol: string): Promise<MarketConditions> {
  try {
    // Fetch with fallback values
    const [technical, sentiment] = await Promise.allSettled([
      fetch(`/api/ucie/technical/${symbol}`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.ok ? r.json() : null),
      fetch(`/api/ucie/sentiment/${symbol}`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.ok ? r.json() : null)
    ]);
    
    // ✅ Use fallback values if APIs fail
    const technicalData = technical.status === 'fulfilled' ? technical.value : null;
    const sentimentData = sentiment.status === 'fulfilled' ? sentiment.value : null;
    
    return {
      volatility: technicalData?.data?.volatility?.current || 50,
      trend: technicalData?.data?.trend?.direction || 'neutral',
      momentum: technicalData?.data?.indicators?.rsi ? (technicalData.data.indicators.rsi - 50) : 0,
      sentiment: sentimentData?.data?.overallScore || 0,
      technicalScore: technicalData?.data?.consensus?.score || 50,
      fundamentalScore: ((technicalData?.data?.consensus?.score || 50) + (sentimentData?.data?.overallScore || 0)) / 2
    };
  } catch (error) {
    console.error('Failed to fetch market conditions:', error);
    // Return neutral defaults
    return {
      volatility: 50,
      trend: 'neutral',
      momentum: 0,
      sentiment: 0,
      technicalScore: 50,
      fundamentalScore: 50
    };
  }
}
```

### 4.2 Caesar AI Research (`/api/ucie/research/[symbol]`)

**Primary Source**: Caesar API  
**Context Data**: Aggregated from Phases 1-3 (database)  
**Compute Units**: 5 (deep analysis)  
**Timeout**: 10 minutes (600 seconds)

**Current Issue**: ❌ Cascading failure from previous phases  
**Fix Priority**: 🔴 CRITICAL (depends on all previous fixes)

**Implementation:**
```typescript
// pages/api/ucie/research/[symbol].ts
export default async function handler(req, res) {
  const { symbol, sessionId } = req.query;
  const symbolUpper = symbol.toUpperCase();
  
  try {
    // Check database cache first
    const cachedData = await getCachedAnalysis(symbolUpper, 'research');
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Retrieve context data from database
    let contextData: any = {};
    if (sessionId && typeof sessionId === 'string') {
      try {
        contextData = await getAggregatedPhaseData(sessionId, symbolUpper, 4);
        console.log(`📊 Retrieved context from ${Object.keys(contextData).length} previous phases`);
      } catch (error) {
        console.warn('⚠️ Failed to retrieve context data:', error);
        // Continue without context rather than failing
      }
    }
    
    // Perform Caesar research with context
    const researchData = await performCryptoResearch(
      symbolUpper,
      5,      // compute units (deep analysis)
      600,    // max wait time (10 minutes)
      contextData  // context from previous phases
    );
    
    // Cache results (24 hours)
    await setCachedAnalysis(symbolUpper, 'research', researchData, 86400, 100);
    
    return res.status(200).json({
      success: true,
      data: researchData,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Caesar research error:', error);
    
    // Return error with fallback
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackData: handleResearchError(error)
    });
  }
}
```

---

## Derivatives Data (Optional Phase)

### Derivatives Metrics (`/api/ucie/derivatives/[symbol]`)

**Primary Source**: CoinGlass API  
**Secondary Source**: Kraken API (funding rates)  
**Tertiary Source**: Public exchange APIs (Bybit, Deribit if configured)

**Rationale:**
- CoinGlass: Best aggregated derivatives data (funding rates, OI, liquidations)
- Kraken: Reliable exchange data
- Public APIs: Free fallback options

**Implementation:**
```typescript
// lib/ucie/derivativesClients.ts
export class DerivativesAggregator {
  async getAllFundingRates(symbol: string): Promise<FundingRateData[]> {
    const results = await Promise.allSettled([
      this.coinGlass.getFundingRates(symbol),  // Primary: Aggregated data
      this.kraken.getFundingRate(symbol),      // Secondary: Exchange data
      // Bybit and Deribit only if keys configured
    ]);
    
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => Array.isArray(r.value) ? r.value : [r.value]);
  }
}
```

---

## API Priority Matrix

| Data Type | Primary API | Secondary API | Tertiary API | Fallback |
|-----------|-------------|---------------|--------------|----------|
| **Price** | CoinGecko | CoinMarketCap | Kraken | Coinbase |
| **Volume** | CoinGecko | CoinMarketCap | Kraken | - |
| **Historical OHLCV** | CoinGecko | CoinMarketCap | - | - |
| **News** | NewsAPI | CryptoCompare | Caesar | - |
| **Social Sentiment** | LunarCrush | Twitter/X | Reddit | - |
| **Technical Indicators** | CoinGecko (OHLCV) | CoinMarketCap | - | - |
| **On-Chain** | Etherscan | Blockchain.com | Graceful null | - |
| **DeFi Metrics** | DeFiLlama | The Graph | Messari | Graceful null |
| **Derivatives** | CoinGlass | Kraken | Public APIs | - |
| **AI Research** | Caesar | - | - | OpenAI fallback |
| **Predictions** | OpenAI GPT-4o | - | - | - |

---

## Cost Optimization Strategy

### Free APIs (No Cost)
- ✅ CoinGecko (with key: 500 calls/min)
- ✅ DeFiLlama (unlimited)
- ✅ CryptoCompare (public: 100k calls/month)
- ✅ Reddit (public API)
- ✅ Coinbase (public API)
- ✅ The Graph (public subgraphs)

### Paid APIs (Optimize Usage)
- 💰 OpenAI GPT-4o: $2.50/1M input tokens, $10/1M output tokens
- 💰 Caesar API: Variable cost per compute unit
- 💰 CoinMarketCap: $79/month (Basic plan)
- 💰 NewsAPI: $449/month (Business plan)
- 💰 LunarCrush: $99/month (Pro plan)
- 💰 Twitter/X: $100/month (Basic tier)
- 💰 CoinGlass: $49/month (Basic plan)

### Cost Reduction Tactics
1. **Cache aggressively**: 24 hours for research, 1 hour for predictions, 5 minutes for news
2. **Use free APIs first**: CoinGecko before CoinMarketCap
3. **Batch requests**: Combine multiple data points in single calls
4. **Graceful degradation**: Return partial data instead of failing
5. **Rate limit awareness**: Respect API limits to avoid overage charges

---

## Database Storage Strategy

### What to Cache in Database

**Long-term Cache (24 hours):**
- Caesar AI research results
- DeFi protocol metrics
- On-chain analytics
- Historical technical analysis

**Medium-term Cache (1 hour):**
- Price predictions
- Social sentiment aggregations
- News articles with AI analysis

**Short-term Cache (5 minutes):**
- Real-time prices
- Order book data
- Funding rates
- Liquidation data

**Session-based Storage (1 hour):**
- Phase 1-3 data for Caesar context
- Progressive loading state
- User analysis sessions

### Database Tables (Already Created)

```sql
-- ✅ ucie_analysis_cache
-- Stores all analysis results with TTL
-- Indexed on: symbol, analysis_type, expires_at

-- ✅ ucie_phase_data
-- Stores progressive loading phase data
-- Indexed on: session_id, symbol, phase_number

-- ✅ ucie_watchlist
-- User watchlist (future feature)

-- ✅ ucie_alerts
-- User alerts (future feature)
```

---

## Implementation Checklist

### Priority 1: Fix Critical API Errors (30 minutes)

- [ ] **Risk API** - Add `const symbolUpper = symbol.toUpperCase();`
- [ ] **Technical API** - Add CoinGecko ID mapping function
- [ ] **On-Chain API** - Return graceful fallback for unsupported tokens
- [ ] **DeFi API** - Return success for non-DeFi tokens
- [ ] **News API** - Increase timeout from 3s to 10s

### Priority 2: Verify Database Connection (10 minutes)

- [ ] Test `DATABASE_URL` connection from Vercel
- [ ] Verify UCIE tables exist in Supabase
- [ ] Test cache read/write operations
- [ ] Test phase data storage/retrieval

### Priority 3: Test Complete Flow (30 minutes)

- [ ] Test XRP analysis end-to-end
- [ ] Verify Phase 1-3 data storage
- [ ] Verify Phase 4 context retrieval
- [ ] Check Caesar API receives proper context
- [ ] Monitor database for stored data

### Priority 4: Optimize API Usage (ongoing)

- [ ] Implement aggressive caching
- [ ] Add request batching where possible
- [ ] Monitor API costs and usage
- [ ] Adjust cache TTLs based on data volatility

---

## Testing Commands

```bash
# Test individual endpoints
curl https://news.arcane.group/api/ucie/risk/XRP
curl https://news.arcane.group/api/ucie/technical/XRP
curl https://news.arcane.group/api/ucie/on-chain/XRP
curl https://news.arcane.group/api/ucie/defi/XRP
curl https://news.arcane.group/api/ucie/news/XRP
curl https://news.arcane.group/api/ucie/sentiment/XRP
curl https://news.arcane.group/api/ucie/predictions/XRP

# Test with session ID (after Phase 1-3 complete)
curl "https://news.arcane.group/api/ucie/research/XRP?sessionId=YOUR_SESSION_ID"

# Check database cache
curl https://news.arcane.group/api/ucie/cache-stats
```

---

## Conclusion

This API routing strategy:

1. ✅ **Excludes Binance** as requested
2. ✅ **Uses best available APIs** for each data type
3. ✅ **Implements fallback chains** for reliability
4. ✅ **Optimizes costs** with caching and free APIs
5. ✅ **Stores data in database** for Caesar context
6. ✅ **Handles errors gracefully** with fallback data

**Next Step**: Implement the 5 critical fixes identified in the audit report, then test the complete flow with XRP.

---

**Document Status**: ✅ Complete  
**Ready for Implementation**: Yes  
**Estimated Fix Time**: 1-2 hours
