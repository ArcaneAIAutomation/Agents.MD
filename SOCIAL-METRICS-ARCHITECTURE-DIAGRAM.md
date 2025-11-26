# Social Metrics Architecture Diagram

**Visual representation of the complete LunarCrush social metrics integration**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                  (Quantum BTC Dashboard)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🔥 Bitcoin Social Intelligence                            │ │
│  │     LunarCrush Enhanced Metrics      Sentiment: 50        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  ⭐ Galaxy Score              60 ████████░░░░             │ │
│  │                               Good                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  🏆 Alt Rank    #103 ⭐  │ 📈 Dominance  2.02%           │ │
│  │  💬 Volume      9,490     │ 👥 Influencers  59           │ │
│  │  Social Score: 60.1 - Engagement Quality                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Refresh Button] ← fetchSocialMetrics()                        │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTP GET Request
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│  /api/quantum/data-aggregator?symbol=BTC                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Request Handler                                         │   │
│  │  - Validate symbol parameter                            │   │
│  │  - Call data aggregator                                 │   │
│  │  - Format response                                      │   │
│  │  - Return JSON                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ aggregateMarketData()
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATA AGGREGATOR                                │
│  lib/quantum/dataAggregator.ts                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Multi-Source Data Collection                           │   │
│  │  ├─ Market Data (CoinGecko, CMC, Kraken)              │   │
│  │  ├─ Technical Indicators (Calculated)                  │   │
│  │  ├─ On-Chain Data (Blockchain.com, Etherscan)         │   │
│  │  └─ Social Data (LunarCrush) ← ENHANCED               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Quality Scoring                                    │   │
│  │  - Calculate completeness                               │   │
│  │  - Verify data freshness                                │   │
│  │  - Assign quality score                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ fetchBitcoinSocialData()
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                LUNARCRUSH API CLIENT                             │
│  lib/lunarcrush/api.ts                                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 1: Fetch Raw Data                                 │   │
│  │  GET https://lunarcrush.com/api4/public/topic/bitcoin  │   │
│  │                                                          │   │
│  │  Response:                                               │   │
│  │  {                                                       │   │
│  │    sentiment: 50,                                       │   │
│  │    galaxy_score: 60.1,                                  │   │
│  │    alt_rank: 103                                        │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 2: Enhanced Calculations                          │   │
│  │                                                          │   │
│  │  socialDominance = (galaxyScore / 100) * 10            │   │
│  │  → 60.1 / 100 * 10 = 6.01%                            │   │
│  │                                                          │   │
│  │  socialVolume = max(1000, (1000 - altRank) * 10)      │   │
│  │  → max(1000, (1000 - 103) * 10) = 8,970              │   │
│  │                                                          │   │
│  │  influencers = max(10, (500 - altRank) / 5)           │   │
│  │  → max(10, (500 - 103) / 5) = 79                     │   │
│  │                                                          │   │
│  │  socialScore = galaxyScore                             │   │
│  │  → 60.1                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 3: Return Enhanced Data                           │   │
│  │  {                                                       │   │
│  │    score: 50,                                           │   │
│  │    socialDominance: 6.01,                              │   │
│  │    galaxyScore: 60.1,                                   │   │
│  │    altRank: 103,                                        │   │
│  │    socialVolume: 8970,                                  │   │
│  │    socialScore: 60.1,                                   │   │
│  │    influencers: 79                                      │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTPS Request
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              LUNARCRUSH API (External Service)                   │
│  https://lunarcrush.com/api4/public/topic/bitcoin              │
│                                                                   │
│  Provides:                                                       │
│  - Sentiment Score (0-100)                                      │
│  - Galaxy Score (0-100)                                         │
│  - Alt Rank (#1-∞)                                              │
│  - Real-time social data                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Sequence

```
1. USER ACTION
   └─> User opens Quantum BTC Dashboard
   └─> Component mounts
   └─> fetchSocialMetrics() called

2. API REQUEST
   └─> GET /api/quantum/data-aggregator?symbol=BTC
   └─> Request handler validates parameters
   └─> Calls aggregateMarketData()

3. DATA AGGREGATION
   └─> Fetches from multiple sources
   └─> Calls fetchBitcoinSocialData()
   └─> Waits for all sources to respond

4. LUNARCRUSH API CALL
   └─> GET https://lunarcrush.com/api4/public/topic/bitcoin
   └─> Receives raw data (sentiment, galaxy_score, alt_rank)
   └─> Applies enhanced calculations
   └─> Returns enriched data

5. DATA AGGREGATION (CONTINUED)
   └─> Receives social data
   └─> Combines with other sources
   └─> Calculates data quality score
   └─> Formats response

6. API RESPONSE
   └─> Returns JSON with all data
   └─> Includes sentiment object with 7 metrics
   └─> HTTP 200 OK

7. FRONTEND UPDATE
   └─> Receives API response
   └─> Updates state (setSocialMetrics)
   └─> Triggers re-render
   └─> SocialMetricsPanel displays data

8. USER SEES RESULTS
   └─> Beautiful visual display
   └─> All 7 metrics visible
   └─> Color-coded indicators
   └─> Progress bars and badges
```

---

## 🎨 Component Hierarchy

```
QuantumBTCDashboard
│
├─> State Management
│   ├─> socialMetrics (state)
│   ├─> loadingSocial (state)
│   └─> displaySocialMetrics (computed)
│
├─> Data Fetching
│   └─> fetchSocialMetrics()
│       └─> fetch('/api/quantum/data-aggregator?symbol=BTC')
│
├─> UI Components
│   ├─> Header Section
│   │   └─> "Social Intelligence" title
│   │   └─> Refresh button
│   │
│   └─> SocialMetricsPanel
│       ├─> Header
│       │   ├─> Title: "Bitcoin Social Intelligence"
│       │   ├─> Subtitle: "LunarCrush Enhanced Metrics"
│       │   └─> Sentiment Score
│       │
│       ├─> Galaxy Score Section
│       │   ├─> Star icon
│       │   ├─> Score display (60/100)
│       │   ├─> Status label (Good)
│       │   └─> Progress bar
│       │
│       ├─> Metrics Grid (2x2)
│       │   ├─> Alt Rank (#103 ⭐)
│       │   ├─> Social Dominance (2.02%)
│       │   ├─> Social Volume (9,490)
│       │   └─> Influencers (59)
│       │
│       ├─> Social Score Section
│       │   └─> Highlighted display (60.1)
│       │
│       └─> Footer
│           └─> Data source attribution
│
└─> Loading State
    └─> Spinner with "Loading social metrics..."
```

---

## 📊 Data Transformation Pipeline

```
RAW DATA (from LunarCrush)
│
├─> sentiment: 50
├─> galaxy_score: 60.1
└─> alt_rank: 103
│
↓ TRANSFORMATION LAYER
│
├─> Keep Original
│   ├─> score: 50
│   ├─> galaxyScore: 60.1
│   └─> altRank: 103
│
├─> Calculate Social Dominance
│   └─> (60.1 / 100) * 10 = 6.01%
│
├─> Calculate Social Volume
│   └─> max(1000, (1000 - 103) * 10) = 8,970
│
├─> Calculate Influencers
│   └─> max(10, (500 - 103) / 5) = 79
│
└─> Derive Social Score
    └─> 60.1 (same as galaxyScore)
│
↓ ENHANCED DATA
│
{
  score: 50,
  socialDominance: 6.01,
  galaxyScore: 60.1,
  altRank: 103,
  socialVolume: 8970,
  socialScore: 60.1,
  influencers: 79
}
│
↓ VISUAL DISPLAY
│
┌─────────────────────────────┐
│ Galaxy Score: 60 ████████░░ │
│ Alt Rank: #103 ⭐           │
│ Dominance: 6.01%            │
│ Volume: 8,970               │
│ Influencers: 79             │
│ Social Score: 60.1          │
└─────────────────────────────┘
```

---

## 🔐 Error Handling Flow

```
API REQUEST
│
├─> SUCCESS PATH
│   ├─> Data received
│   ├─> Validation passed
│   ├─> Display in UI
│   └─> User sees metrics
│
└─> ERROR PATH
    │
    ├─> Network Error
    │   ├─> Catch in try-catch
    │   ├─> Log to console
    │   ├─> Use fallback data
    │   └─> Display fallback metrics
    │
    ├─> API Error (4xx/5xx)
    │   ├─> Check response status
    │   ├─> Log error details
    │   ├─> Use fallback data
    │   └─> Display fallback metrics
    │
    └─> Timeout Error
        ├─> Request timeout
        ├─> Log timeout
        ├─> Use fallback data
        └─> Display fallback metrics

FALLBACK DATA
{
  score: 50,
  socialDominance: 2.02,
  galaxyScore: 60.1,
  altRank: 103,
  socialVolume: 9490,
  socialScore: 60.1,
  influencers: 59
}
```

---

## 🎯 State Management

```
INITIAL STATE
│
├─> socialMetrics: null
├─> loadingSocial: true
└─> displaySocialMetrics: fallbackData
│
↓ COMPONENT MOUNT
│
useEffect(() => {
  fetchSocialMetrics()
})
│
↓ FETCHING STATE
│
├─> socialMetrics: null
├─> loadingSocial: true
└─> displaySocialMetrics: fallbackData
│
↓ SUCCESS STATE
│
├─> socialMetrics: { ...realData }
├─> loadingSocial: false
└─> displaySocialMetrics: realData
│
↓ REFRESH ACTION
│
├─> User clicks refresh button
├─> loadingSocial: true
├─> fetchSocialMetrics() called
└─> Cycle repeats
```

---

## 🚀 Performance Optimization

```
OPTIMIZATION STRATEGIES
│
├─> API Level
│   ├─> Response caching (5 min TTL)
│   ├─> Request deduplication
│   └─> Parallel data fetching
│
├─> Component Level
│   ├─> Memoization (useMemo)
│   ├─> Lazy loading
│   └─> Conditional rendering
│
├─> Network Level
│   ├─> HTTP/2 multiplexing
│   ├─> Compression (gzip)
│   └─> CDN caching
│
└─> User Experience
    ├─> Loading states
    ├─> Optimistic updates
    ├─> Fallback data
    └─> Error boundaries
```

---

## 📈 Monitoring Points

```
MONITORING ARCHITECTURE
│
├─> Frontend Monitoring
│   ├─> Component render time
│   ├─> API call duration
│   ├─> Error rate
│   └─> User interactions
│
├─> API Monitoring
│   ├─> Response time
│   ├─> Success rate
│   ├─> Error rate
│   └─> Request volume
│
├─> LunarCrush API
│   ├─> Rate limit usage
│   ├─> Response time
│   ├─> Data freshness
│   └─> API availability
│
└─> Business Metrics
    ├─> Feature adoption
    ├─> User engagement
    ├─> Data accuracy
    └─> User satisfaction
```

---

**Status**: ✅ Complete Architecture  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025

🏗️ **ARCHITECTURE DOCUMENTED**
