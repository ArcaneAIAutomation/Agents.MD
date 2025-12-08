# UCIE Complete Data Flow Analysis

**Created**: December 7, 2025  
**Status**: 🔍 **COMPREHENSIVE ANALYSIS** - NO CODE CHANGES  
**Purpose**: Visual documentation of complete UCIE data flow for user review  
**Priority**: CRITICAL - User must review before any code changes

---

## 📋 Executive Summary

This document provides a complete analysis of the UCIE (Universal Crypto Intelligence Engine) data flow, including:
- Complete flow from user click to Caesar prompt generation
- All API endpoints with timeouts and data structures
- Database operations and caching strategy
- GPT-5.1 analysis process with async polling
- Caesar prompt generation with all collected data
- Test results proving system understanding

**NO CODE CHANGES HAVE BEEN MADE** - This is analysis only for user review.

---

## 🎯 Complete UCIE Data Flow (User Click → Caesar Prompt)

### Phase 1: User Initiates Analysis

```
User clicks "Analyze BTC" button
    ↓
Frontend: DataPreviewModal.tsx opens
    ↓
Frontend calls: POST /api/ucie/preview-data/BTC
    ↓
Backend: preview-data/[symbol].ts handler starts
```

### Phase 2: Data Collection (Parallel API Calls)

**Timeout**: 30 seconds per API endpoint  
**Strategy**: Parallel execution with `Promise.allSettled()`  
**Caching**: Database-backed (Supabase) with TTL

```
preview-data/[symbol].ts orchestrates 5 parallel API calls:
    ├─ GET /api/ucie/market-data/BTC (timeout: 30s)
    ├─ GET /api/ucie/sentiment/BTC (timeout: 30s)
    ├─ GET /api/ucie/technical/BTC (timeout: 30s)
    ├─ GET /api/ucie/news/BTC (timeout: 30s)
    └─ GET /api/ucie/on-chain/BTC (timeout: 30s)
```


### Phase 3: Database Storage (Immediate Caching)

**Each API endpoint stores data in Supabase immediately after fetching:**

```sql
-- Table: ucie_analysis_cache
INSERT INTO ucie_analysis_cache (
    symbol,           -- 'BTC'
    analysis_type,    -- 'market-data', 'sentiment', 'technical', 'news', 'on-chain'
    data,             -- JSON data (unwrapped, no API wrappers)
    data_quality,     -- 0-100 score
    ttl,              -- Time to live in seconds
    user_id,          -- User ID for isolation (optional)
    user_email,       -- User email for tracking (optional)
    created_at,       -- Timestamp
    expires_at        -- created_at + ttl
) VALUES (...)
ON CONFLICT (symbol, analysis_type, user_id) 
DO UPDATE SET data = EXCLUDED.data, ...
```

**TTL (Time To Live) for Each Data Type:**
- Market Data: 390 seconds (6.5 minutes)
- Sentiment: 390 seconds (6.5 minutes)
- Technical: 390 seconds (6.5 minutes)
- News: 390 seconds (6.5 minutes)
- On-Chain: 390 seconds (6.5 minutes)

**Why 6.5 minutes?**
- Initial collection: 20-minute freshness rule (data must be <20 min old)
- GPT-5.1 analysis: 5-6 minutes processing time
- Caesar analysis: 30-minute freshness rule
- Buffer: Extra time for user to review preview modal


### Phase 4: GPT-5.1 Analysis (Async Processing)

**After all 5 data sources are collected and cached:**

```
preview-data/[symbol].ts calls generateAISummary()
    ↓
generateAISummary() returns plain string summary (NO job creation)
    ↓
Main handler creates GPT-5.1 job:
    POST /api/ucie/openai-summary-start/BTC
    Body: { collectedData, context }
    ↓
openai-summary-start/[symbol].ts:
    1. Creates job in database (status: 'queued')
    2. Returns jobId immediately
    3. Starts async processing with processJobAsync()
    ↓
processJobAsync() runs in background:
    1. Updates status to 'processing'
    2. Builds comprehensive prompt from collectedData
    3. Calls OpenAI Responses API with GPT-5.1
    4. Parses response with bulletproof utilities
    5. Stores result in database (status: 'completed')
```

**GPT-5.1 Job Database Table:**

```sql
-- Table: ucie_openai_jobs
CREATE TABLE ucie_openai_jobs (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    user_id INTEGER,
    status VARCHAR(20) NOT NULL,  -- 'queued', 'processing', 'completed', 'error'
    context_data JSONB,            -- { collectedData, context }
    result JSONB,                  -- GPT-5.1 analysis result
    error TEXT,                    -- Error message if failed
    progress TEXT,                 -- Status message for UI
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```


### Phase 5: Frontend Polling (Live Status Updates)

**Frontend polls for GPT-5.1 completion:**

```
DataPreviewModal.tsx:
    useEffect(() => {
        if (gptJobId) {
            const interval = setInterval(() => {
                fetch(`/api/ucie/openai-summary-poll/${gptJobId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === 'completed') {
                            setGptAnalysis(JSON.parse(data.result))
                            clearInterval(interval)
                        } else if (data.status === 'error') {
                            setError(data.error)
                            clearInterval(interval)
                        }
                        // Update elapsed time
                        setElapsedTime(data.elapsedTime)
                    })
            }, 3000) // Poll every 3 seconds
            
            return () => clearInterval(interval)
        }
    }, [gptJobId])
```

**Polling Configuration:**
- Interval: 3 seconds
- Max Duration: 30 minutes (600 attempts × 3s = 1800s)
- Timeout Handling: Shows error after 30 minutes
- Live Updates: Elapsed time counter, status messages


### Phase 6: Caesar Prompt Generation (After GPT-5.1 Completes)

**User sees "Start Caesar Deep Dive" button after GPT-5.1 completes:**

```
User clicks "Start Caesar Deep Dive (15-20 min)" button
    ↓
Frontend calls: POST /api/ucie/regenerate-caesar-prompt/BTC
    ↓
regenerate-caesar-prompt/[symbol].ts:
    1. Reads ALL data from database (30-minute freshness)
    2. Includes GPT-5.1 analysis results
    3. Formats comprehensive Caesar prompt
    4. Returns prompt for user review
    ↓
User reviews prompt in modal
    ↓
User clicks "Confirm & Start Analysis"
    ↓
Frontend calls: POST /api/ucie/caesar-research/BTC
    Body: { prompt }
    ↓
Caesar API processes for 15-20 minutes
    ↓
Results displayed to user
```

**Caesar Prompt Structure:**

```markdown
# Bitcoin (BTC) Deep Dive Analysis

## Data Collection Summary
- Market Data: ✅ 100% quality
- Sentiment: ✅ 95% quality
- Technical: ✅ 100% quality
- News: ✅ 85% quality
- On-Chain: ✅ 90% quality

## GPT-5.1 Analysis Results
[Complete GPT-5.1 analysis included here]

## Market Data
[Complete market data from database]

## Sentiment Analysis
[Complete sentiment data from database]

## Technical Indicators
[Complete technical data from database]

## News Articles
[Complete news data from database]

## On-Chain Metrics
[Complete on-chain data from database]

## Research Instructions
Analyze all provided data and generate comprehensive research report...
```



---

## 📊 API Endpoint Details with Timeouts

### 1. Market Data API (`/api/ucie/market-data/[symbol]`)

**Timeout**: 30 seconds  
**Cache TTL**: 390 seconds (6.5 minutes)  
**Data Sources**: CoinMarketCap (primary), CoinGecko (fallback), Kraken  
**Execution**: Parallel with `Promise.allSettled()`

**Request Example:**
```http
GET /api/ucie/market-data/BTC?refresh=false
```

**Response Structure:**
```json
{
  "success": true,
  "symbol": "BTC",
  "priceAggregation": {
    "averagePrice": 95234.56,
    "medianPrice": 95230.00,
    "priceSpread": 45.23,
    "dataQuality": 100,
    "prices": [
      {
        "exchange": "CoinMarketCap",
        "price": 95250.00,
        "volume24h": 28500000000,
        "success": true
      },
      {
        "exchange": "CoinGecko",
        "price": 95230.00,
        "volume24h": 28450000000,
        "success": true
      },
      {
        "exchange": "Kraken",
        "price": 95224.00,
        "volume24h": 1200000000,
        "success": true
      }
    ]
  },
  "marketData": {
    "marketCap": 1875000000000,
    "circulatingSupply": 19600000,
    "totalSupply": 21000000,
    "high24h": 96500.00,
    "low24h": 94200.00,
    "change7d": 5.2
  },
  "dataQuality": 100,
  "sources": ["CoinMarketCap", "CoinGecko", "Kraken"],
  "cached": false,
  "timestamp": "2025-12-07T14:30:00.000Z"
}
```

**Database Storage:**
```sql
-- Stored in ucie_analysis_cache
symbol: 'BTC'
analysis_type: 'market-data'
data: {
  "priceAggregation": {...},
  "marketData": {...},
  "dataQuality": 100,
  "timestamp": "2025-12-07T14:30:00.000Z",
  "sources": ["CoinMarketCap", "CoinGecko", "Kraken"]
}
ttl: 390 seconds
expires_at: 2025-12-07T14:36:30.000Z
```



### 2. Sentiment API (`/api/ucie/sentiment/[symbol]`)

**Timeout**: 30 seconds (10s per source with parallel execution)  
**Cache TTL**: 390 seconds (6.5 minutes)  
**Data Sources**: Fear & Greed Index (25%), CoinMarketCap (20%), CoinGecko (20%), LunarCrush (20%), Reddit (15%)  
**Execution**: Parallel with `Promise.allSettled()`

**Request Example:**
```http
GET /api/ucie/sentiment/BTC?refresh=false
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "overallScore": 72,
    "sentiment": "bullish",
    "sentimentDescription": "Overall market sentiment is BULLISH based on 100% of available data sources.",
    "fearGreedIndex": {
      "value": 68,
      "classification": "Greed",
      "weight": "25%",
      "description": "Market-wide sentiment indicator. 0-25 = Extreme Fear, 75-100 = Extreme Greed"
    },
    "coinMarketCap": {
      "sentimentScore": 75,
      "weight": "20%",
      "priceChange24h": 3.2,
      "priceChange7d": 5.8,
      "volumeChange24h": 12.5,
      "marketCapDominance": 54.2,
      "description": "Price momentum and volume analysis"
    },
    "coinGecko": {
      "sentimentScore": 70,
      "weight": "20%",
      "communityScore": 68,
      "developerScore": 85,
      "publicInterestScore": 4.2,
      "sentimentVotesUpPercentage": 72,
      "description": "Community engagement and developer activity"
    },
    "lunarCrush": {
      "galaxyScore": 65,
      "weight": "20%",
      "averageSentiment": 3.4,
      "totalPosts": 117,
      "totalInteractions": 402000000,
      "postTypes": {
        "tiktok-video": 90,
        "tweet": 10,
        "youtube-video": 10,
        "reddit-post": 7
      },
      "description": "Social media metrics from Twitter, Reddit, YouTube, TikTok"
    },
    "reddit": {
      "mentions24h": 45,
      "weight": "15%",
      "sentiment": 68,
      "activeSubreddits": ["cryptocurrency", "CryptoMarkets", "Bitcoin"],
      "description": "Community discussions from crypto subreddits"
    },
    "dataQuality": 100,
    "timestamp": "2025-12-07T14:30:00.000Z"
  },
  "cached": false,
  "timestamp": "2025-12-07T14:30:00.000Z"
}
```

**Key Metrics:**
- Overall Score: Weighted average (0-100)
- Fear & Greed: Always available (public API)
- LunarCrush: Social media buzz and sentiment
- Reddit: Community discussions and upvotes
- Data Quality: Percentage of sources available



### 3. Technical Analysis API (`/api/ucie/technical/[symbol]`)

**Timeout**: 30 seconds  
**Cache TTL**: 390 seconds (6.5 minutes)  
**Calculation**: Real-time from historical price data  
**Indicators**: RSI, MACD, EMA, Bollinger Bands, ATR, Stochastic

**Request Example:**
```http
GET /api/ucie/technical/BTC?timeframe=1h&refresh=false
```

**Response Structure:**
```json
{
  "success": true,
  "symbol": "BTC",
  "timeframe": "1h",
  "rsi": {
    "value": 58.5,
    "signal": "neutral",
    "overbought": false,
    "oversold": false
  },
  "macd": {
    "macd": 245.32,
    "signal": 198.45,
    "histogram": 46.87,
    "trend": "bullish",
    "crossover": "bullish"
  },
  "ema": {
    "ema9": 95100.00,
    "ema21": 94800.00,
    "ema50": 94200.00,
    "trend": "bullish",
    "alignment": "bullish"
  },
  "bollingerBands": {
    "upper": 96500.00,
    "middle": 95200.00,
    "lower": 93900.00,
    "position": "middle",
    "squeeze": false
  },
  "signals": {
    "overall": "buy",
    "confidence": 75,
    "bullishSignals": 8,
    "bearishSignals": 2,
    "neutralSignals": 2
  },
  "multiTimeframeConsensus": {
    "overall": "bullish",
    "timeframes": {
      "15m": "bullish",
      "1h": "bullish",
      "4h": "neutral",
      "1d": "bullish"
    }
  },
  "dataQuality": 100,
  "timestamp": "2025-12-07T14:30:00.000Z",
  "cached": false
}
```

**Calculation Process:**
1. Fetch historical price data (last 200 candles)
2. Calculate RSI (14-period)
3. Calculate MACD (12, 26, 9)
4. Calculate EMAs (9, 21, 50)
5. Calculate Bollinger Bands (20, 2)
6. Generate trading signals
7. Multi-timeframe consensus



### 4. News API (`/api/ucie/news/[symbol]`)

**Timeout**: 30 seconds (20s for AI assessment)  
**Cache TTL**: 390 seconds (6.5 minutes)  
**Data Sources**: LunarCrush, NewsAPI, CryptoCompare  
**AI Assessment**: GPT-4o (impact analysis)

**Request Example:**
```http
GET /api/ucie/news/BTC?refresh=false
```

**Response Structure:**
```json
{
  "success": true,
  "symbol": "BTC",
  "articles": [
    {
      "id": "article-1",
      "title": "Bitcoin Surges Past $95,000 on ETF Inflows",
      "description": "Bitcoin reached new highs as institutional investors...",
      "source": "CoinDesk",
      "url": "https://...",
      "publishedAt": "2025-12-07T13:00:00.000Z",
      "category": "market",
      "assessment": {
        "articleId": "article-1",
        "impact": "bullish",
        "impactScore": 85,
        "confidence": 90,
        "summary": "Strong institutional demand driving price higher",
        "keyPoints": [
          "Record ETF inflows of $2.1B",
          "Institutional adoption accelerating",
          "Technical breakout confirmed"
        ],
        "marketImplications": "Continued upward momentum likely",
        "timeframe": "short-term"
      }
    }
  ],
  "summary": {
    "overallSentiment": "bullish",
    "bullishCount": 12,
    "bearishCount": 3,
    "neutralCount": 5,
    "averageImpact": 72,
    "majorNews": [...]
  },
  "sources": {
    "LunarCrush": { "success": true, "articles": 8 },
    "NewsAPI": { "success": true, "articles": 10 },
    "CryptoCompare": { "success": true, "articles": 7 }
  },
  "dataQuality": 95,
  "timestamp": "2025-12-07T14:30:00.000Z",
  "cached": false
}
```

**AI Assessment Process:**
1. Fetch news from 3 sources
2. Deduplicate articles
3. Call GPT-4o for impact assessment (20s timeout)
4. Categorize by sentiment (bullish/bearish/neutral)
5. Generate summary statistics



### 5. On-Chain API (`/api/ucie/on-chain/[symbol]`)

**Timeout**: 30 seconds  
**Cache TTL**: 390 seconds (6.5 minutes)  
**Data Source**: Blockchain.com (Bitcoin only)  
**Whale Detection**: Real-time (>50 BTC transactions)

**Request Example:**
```http
GET /api/ucie/on-chain/BTC?refresh=false
```

**Response Structure:**
```json
{
  "success": true,
  "symbol": "BTC",
  "chain": "bitcoin",
  "networkMetrics": {
    "latestBlockHeight": 820450,
    "latestBlockTime": 1733582400,
    "blockTime": 10,
    "hashRate": 450000000000000000000,
    "difficulty": 72000000000000,
    "mempoolSize": 85000,
    "mempoolBytes": 125000000,
    "totalCirculating": 19600000,
    "maxSupply": 21000000,
    "marketPriceUSD": 95234.56
  },
  "whaleActivity": {
    "timeframe": "30 minutes",
    "minThreshold": "50 BTC",
    "summary": {
      "totalTransactions": 3,
      "totalValueUSD": 28570368,
      "totalValueBTC": 300,
      "largestTransaction": 150,
      "message": "3 whale transactions detected"
    }
  },
  "mempoolAnalysis": {
    "congestion": "medium",
    "averageFee": 0,
    "recommendedFee": 20
  },
  "dataQuality": 100,
  "timestamp": "2025-12-07T14:30:00.000Z"
}
```

**Whale Detection Process:**
1. Fetch unconfirmed transactions from mempool
2. Fetch recent confirmed transactions (last 30 min)
3. Scan all transactions for amounts >50 BTC
4. Calculate USD value using current BTC price
5. Aggregate statistics

**Bitcoin-Only Restriction:**
- Only BTC is supported for on-chain analysis
- ETH and other chains return 400 error
- Reason: Focus on Bitcoin-first strategy

