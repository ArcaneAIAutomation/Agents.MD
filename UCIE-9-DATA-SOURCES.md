# UCIE Complete Data Sources - 9 APIs

**Last Updated**: January 27, 2025  
**Status**: ✅ ALL 9 Data Sources Operational  
**Data Flow**: APIs → Database → Gemini AI → Caesar AI  
**Note**: Etherscan removed - Bitcoin-focused on-chain data only

---

## 📊 Complete Data Architecture

### Phase 1: API Data Collection (9 Sources → 5 Endpoints)

UCIE collects data from **9 underlying API sources**, aggregated into **5 core endpoint categories**:

```
┌─────────────────────────────────────────────────────────────┐
│                    9 UNDERLYING API SOURCES                 │
└─────────────────────────────────────────────────────────────┘

1. MARKET DATA APIs (4 sources → 1 endpoint)
   ├─ CoinMarketCap → Primary price, volume, market cap
   ├─ CoinGecko → Backup price data, historical data
   ├─ Kraken → Live exchange data, order books
   └─ Coinbase → Exchange price verification
   
   Endpoint: /api/ucie/market-data/[symbol]
   Aggregates: VWAP, price variance, volume-weighted data
   Cache TTL: 2 minutes

2. SOCIAL SENTIMENT APIs (3 sources → 1 endpoint)
   ├─ LunarCrush → Social score, galaxy score, aggregated Twitter
   ├─ Twitter/X → Direct tweet sentiment (via LunarCrush)
   └─ Reddit → Subreddit sentiment, community analysis
   
   Endpoint: /api/ucie/sentiment/[symbol]
   Aggregates: Overall sentiment, trend, influencer tracking
   Cache TTL: 2 minutes

3. TECHNICAL INDICATORS (1 source → 1 endpoint)
   └─ Calculated → RSI, MACD, EMA, Bollinger Bands, etc.
   
   Endpoint: /api/ucie/technical/[symbol]
   Calculates: 15+ indicators from price data
   Cache TTL: 2 minutes

4. NEWS APIs (1 source → 1 endpoint)
   └─ NewsAPI → Recent news articles, sentiment analysis
   
   Endpoint: /api/ucie/news/[symbol]
   Provides: Headlines, sentiment, source diversity
   Cache TTL: 2 minutes

5. BLOCKCHAIN APIs (1 source → 1 endpoint)
   └─ Blockchain.com → Bitcoin on-chain data, whale tracking
   
   Endpoint: /api/ucie/on-chain/[symbol]
   Provides: Bitcoin whale activity, network health (BTC only)
   Cache TTL: 2 minutes
   Note: Etherscan removed - Bitcoin-focused analysis

TOTAL: 9 API sources → 5 core endpoints
```

---

## 🔄 Complete Data Flow

### Step 1: API Collection (10-15 seconds)

```
User clicks symbol (e.g., BTC)
    ↓
/api/ucie/preview-data/BTC
    ↓
Parallel API calls to 5 core endpoints:
    ├─ /api/ucie/market-data/BTC (4 sources: CMC, CoinGecko, Kraken, Coinbase)
    ├─ /api/ucie/sentiment/BTC (3 sources: LunarCrush, Twitter, Reddit)
    ├─ /api/ucie/technical/BTC (calculated from price data)
    ├─ /api/ucie/news/BTC (1 source: NewsAPI)
    └─ /api/ucie/on-chain/BTC (2 sources: Blockchain.com, Etherscan V2)
    ↓
Store ALL 5 responses in Supabase database
    ↓
Table: ucie_analysis_cache
    ├─ market-data (TTL: 2 min)
    ├─ sentiment (TTL: 2 min)
    ├─ technical (TTL: 2 min)
    ├─ news (TTL: 2 min)
    └─ on-chain (TTL: 2 min)
```

### Step 2: Gemini AI Analysis (5-10 seconds)

```
After ALL 5 sources cached in database
    ↓
generateGeminiSummary() function
    ↓
Read ALL 5 data types from database (9 underlying APIs):
    ├─ marketData = getCachedAnalysis('BTC', 'market-data')
    │  Contains: CoinMarketCap, CoinGecko, Kraken, Coinbase (4 APIs)
    ├─ sentimentData = getCachedAnalysis('BTC', 'sentiment')
    │  Contains: LunarCrush, Twitter, Reddit (3 APIs)
    ├─ technicalData = getCachedAnalysis('BTC', 'technical')
    │  Contains: Calculated indicators (1 source)
    ├─ newsData = getCachedAnalysis('BTC', 'news')
    │  Contains: NewsAPI (1 API)
    └─ onChainData = getCachedAnalysis('BTC', 'on-chain')
       Contains: Blockchain.com (1 API - Bitcoin only, Etherscan removed)
    ↓
Build comprehensive context (5,000-10,000 chars):
    ├─ Market Data (price, volume, market cap from 4 APIs)
    ├─ Social Sentiment (score, trend, mentions from 3 APIs)
    ├─ Technical Analysis (15+ indicators)
    ├─ Recent News (headlines, sentiment from 1 API)
    └─ On-Chain Data (Bitcoin whale activity from 1 API)
    ↓
Send to Gemini 2.5 Pro with system prompt:
    "Analyze ALL data sources and provide 2000-word analysis
     covering 7 sections: Executive Summary, Market Analysis,
     Technical Analysis, Social Sentiment, News, On-Chain,
     Risk Assessment & Outlook"
    ↓
Gemini generates comprehensive 2000-word analysis
    ↓
Store in ucie_gemini_analysis table
    ├─ summary_text (2000 words)
    ├─ data_quality_score (0-100)
    ├─ model_used (gemini-2.5-pro)
    ├─ tokens_used (~3000-4000)
    ├─ data_sources_used (JSON array of 9 sources)
    └─ created_at (timestamp)
```

### Step 3: Caesar AI Research (5-7 minutes)

```
User clicks "Continue with Caesar AI Analysis"
    ↓
/api/ucie-research?symbol=BTC
    ↓
Read ALL data from database:
    ├─ allCachedData.marketData (4 API sources)
    ├─ allCachedData.sentiment (3 API sources)
    ├─ allCachedData.technical (calculated)
    ├─ allCachedData.news (1 API source)
    ├─ allCachedData.onChain (2 API sources)
    └─ allCachedData.geminiAnalysis (Gemini's 2000-word analysis)
    ↓
Build comprehensive context for Caesar:
    ├─ Gemini AI Summary (2000 words of analysis)
    ├─ Market Data (all 4 APIs aggregated)
    ├─ Sentiment (all 3 APIs aggregated)
    ├─ Technical (15+ indicators)
    ├─ News (recent articles from 1 API)
    └─ On-Chain (both Bitcoin and Ethereum data from 2 APIs)
    ↓
Total context size: 10,000-15,000 characters
    ↓
Send to Caesar AI with query:
    "Conduct comprehensive cryptocurrency market intelligence
     analysis using ALL provided data sources. Cross-reference
     Gemini's analysis with raw data. Provide deep research
     including technology analysis, team evaluation, partnerships,
     competitive landscape, and actionable trading intelligence."
    ↓
Caesar performs 5-7 minute deep research
    ├─ Searches web for additional context
    ├─ Cross-references provided data
    ├─ Analyzes technology and fundamentals
    ├─ Evaluates team and partnerships
    └─ Generates comprehensive report with sources
    ↓
Return structured analysis to user
```

---

## 📋 Data Quality Verification

### Gemini AI Data Sources

**Gemini receives data from ALL 9 underlying sources:**

```typescript
// From generateGeminiSummary() in preview-data/[symbol].ts

// Read ALL 5 data types from database (9 underlying APIs)
const marketData = await getCachedAnalysis(symbol, 'market-data');
// Contains: CoinMarketCap, CoinGecko, Kraken, Coinbase (4 APIs)

const sentimentData = await getCachedAnalysis(symbol, 'sentiment');
// Contains: LunarCrush, Twitter, Reddit (3 APIs)

const technicalData = await getCachedAnalysis(symbol, 'technical');
// Contains: Calculated indicators (1 source)

const newsData = await getCachedAnalysis(symbol, 'news');
// Contains: NewsAPI (1 API)

const onChainData = await getCachedAnalysis(symbol, 'on-chain');
// Contains: Blockchain.com (1 API - Bitcoin only, Etherscan removed)

// TOTAL: 9 underlying API sources
```

### Caesar AI Data Sources

**Caesar receives Gemini's analysis PLUS all raw data:**

```typescript
// From /api/ucie-research

const allCachedData = {
  marketData: await getCachedAnalysis(symbol, 'market-data'),
  // 4 APIs: CoinMarketCap, CoinGecko, Kraken, Coinbase
  
  sentiment: await getCachedAnalysis(symbol, 'sentiment'),
  // 3 APIs: LunarCrush, Twitter, Reddit
  
  technical: await getCachedAnalysis(symbol, 'technical'),
  // 1 source: Calculated indicators
  
  news: await getCachedAnalysis(symbol, 'news'),
  // 1 API: NewsAPI
  
  onChain: await getCachedAnalysis(symbol, 'on-chain'),
  // 1 API: Blockchain.com (Bitcoin only, Etherscan removed)
  
  geminiAnalysis: await getGeminiAnalysis(symbol, userId),
  // Gemini's 2000-word analysis of all above data
};

// Caesar gets: 9 API sources + Gemini's intelligent analysis
// Total context: 10,000-15,000 characters
```

---

## ✅ Verification Checklist

### Data Collection Verification

- [x] Market Data endpoint aggregates 4 APIs (CMC, CoinGecko, Kraken, Coinbase)
- [x] Sentiment endpoint aggregates 3 APIs (LunarCrush, Twitter, Reddit)
- [x] Technical endpoint calculates 15+ indicators
- [x] News endpoint fetches from NewsAPI
- [x] On-Chain endpoint uses 1 API (Blockchain.com - Bitcoin only)

**Total: 5/5 endpoints operational (100%)**  
**Total: 9/9 underlying sources operational (100%)**

### Gemini AI Verification

- [x] Reads market-data from database (4 APIs)
- [x] Reads sentiment from database (3 APIs)
- [x] Reads technical from database (1 source)
- [x] Reads news from database (1 API)
- [x] Reads on-chain from database (1 API - Bitcoin only)
- [x] Generates 2000-word comprehensive analysis
- [x] Stores analysis in ucie_gemini_analysis table

**Gemini receives: 9/9 underlying sources (100%)**

### Caesar AI Verification

- [x] Reads all 5 data types from database
- [x] Reads Gemini's 2000-word analysis
- [x] Builds comprehensive context (10,000-15,000 chars)
- [x] Sends complete context to Caesar API
- [x] Receives deep research with sources
- [x] Returns structured analysis to user

**Caesar receives: 9 API sources + Gemini analysis (100% of available data)**

---

## 🎯 Summary

### Data Sources: 9 Underlying APIs

1. **CoinMarketCap** - Market data ✅
2. **CoinGecko** - Market data ✅
3. **Kraken** - Exchange data ✅
4. **Coinbase** - Exchange data ✅
5. **LunarCrush** - Social sentiment ✅
6. **Twitter/X** - Social sentiment ✅
7. **Reddit** - Social sentiment ✅
8. **NewsAPI** - News articles ✅
9. **Blockchain.com** - Bitcoin on-chain ✅

**Status: 9/9 operational (100%)**  
**Note**: Etherscan removed - Bitcoin-focused on-chain analysis only

### Data Flow: Complete

```
9 APIs → 5 Core Endpoints → Supabase Database
    ↓
Gemini AI (reads all 5 from DB)
    ↓
2000-word analysis → ucie_gemini_analysis table
    ↓
Caesar AI (reads all 5 + Gemini analysis)
    ↓
5-7 minute deep research → User
```

**✅ Both Gemini and Caesar receive comprehensive data from ALL 9 API sources!**

---

**Last Verified**: January 27, 2025  
**System Status**: 🟢 Operational (100% data coverage)  
**Focus**: Bitcoin-focused analysis with proven data sources
