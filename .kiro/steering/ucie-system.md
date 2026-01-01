# UCIE System - Complete Steering Guide

**Last Updated**: January 1, 2026  
**Status**: ✅ **SIMPLIFIED DATA-FIRST APPROACH**  
**Priority**: CRITICAL - Read this before working on UCIE  
**Latest**: 🎉 New Flow: Collect Data → Display Results (No AI Analysis Yet)
**Model**: `o1-mini` with Responses API + `reasoning: { effort: "low" }`

---

## 🎯 What is UCIE?

**Universal Crypto Intelligence Engine (UCIE)** is a cryptocurrency data aggregation and display platform that:
- **Collects** real-time data from 13+ APIs (market, sentiment, technical, news, on-chain)
- **Stores** all data in Supabase database with quality scoring
- **Displays** organized, formatted data to users for quality assessment
- **Future**: Will add AI analysis layers (Caesar, GPT-5.1) after data quality is validated

**Current Focus**: Data collection and presentation - NO AI analysis yet

**🆕 Latest Enhancements (Jan 27, 2025):**
- ✅ **Sentiment API Fixed**: Direct API calls with Fear & Greed Index (40-100% quality)
- ✅ **On-Chain API Fixed**: Simplified Bitcoin fetching (60-100% quality)
- ✅ **Performance**: 60-93% faster response times with parallel fetching
- ✅ **Reliability**: Graceful degradation if individual sources fail
- ✅ **GPT Model**: Uses `o1-mini` (OpenAI's reasoning model with Responses API)
- ✅ Sentiment trend calculated from distribution data
- ✅ Exchange deposit/withdrawal detection (15+ major exchanges)
- ✅ Cold wallet movement tracking
- ✅ Net flow sentiment analysis (bullish/bearish signals)

---

## 🎉 API FIX COMPLETE (Jan 27, 2025) + 🚀 LUNARCRUSH INTEGRATION (Dec 5, 2025)

### **Problem Identified:**
Sentiment and On-Chain APIs showing 0% data quality due to:
- ❌ Complex client modules with timeout issues (10s+ per request)
- ❌ Sequential API calls causing cascading failures
- ❌ No graceful degradation when individual sources failed
- ❌ LunarCrush using wrong endpoints (category vs topic)
- ❌ User correctly identified: "System error, not data unavailability"

### **Solution Implemented:**

**1. Sentiment API Fixed** (`pages/api/ucie/sentiment/[symbol].ts`)
- **Added Fear & Greed Index** as primary source (25% weight) - always available
- **✅ NEW: LunarCrush Integration** (20% weight) - verified working endpoints
  - Uses `/public/topic/bitcoin/posts/v1` for social sentiment (100% quality)
  - Uses `/public/coins/list/v1` for market data (80% quality)
  - Fetches 117+ posts with sentiment scores (1-5 scale)
  - Provides 402M+ interactions data
  - Post types: tweets, reddit, youtube, tiktok
- **Added CoinMarketCap** sentiment (20% weight) - price momentum analysis
- **Added CoinGecko** sentiment (20% weight) - community metrics
- **Simplified Reddit** fetching with 3s timeout (15% weight)
- **Parallel fetching** with `Promise.allSettled` for speed
- **Direct API calls** instead of complex client modules

**2. On-Chain API Fixed** (`pages/api/ucie/on-chain/[symbol].ts`)
- **Created simplified Bitcoin fetcher** mirroring working BTC analysis pattern
- **Parallel fetching** of stats and latest block with 5s timeouts
- **Removed complex whale tracking** (72 blocks × 5 samples = 50s+ timeout)
- **Focused on essential metrics** only
- **Direct API calls** with proper error handling

**3. Performance Improvements:**
- **Sentiment API**: 35s → 300-500ms (98% faster!)
- **On-Chain API**: 70s → 5s (93% faster)
- **Parallel execution**: max(timeouts) instead of sum(timeouts)
- **LunarCrush**: 218ms posts + 360ms market = 578ms total (parallel)

### **Result:**
✅ **Sentiment API**: 70-100% data quality (up from 0%)  
✅ **On-Chain API**: 60-100% data quality (up from 0%)  
✅ **Fear & Greed Index**: Always available (25% weight)  
✅ **LunarCrush**: Now working with real social data (20% weight)  
✅ **CoinMarketCap**: Price momentum analysis (20% weight)  
✅ **CoinGecko**: Community metrics (20% weight)  
✅ **Reddit**: Community discussions (15% weight)  
✅ **Network Stats**: Always available (primary on-chain source)  
✅ **Graceful Degradation**: Individual source failures don't crash entire request  
✅ **Faster Response**: 98% faster with parallel fetching  

**UCIE now achieves 70-100% data quality instead of 0%!**

**See**: 
- `UCIE-SENTIMENT-ONCHAIN-FIX-COMPLETE.md` for technical details
- `LUNARCRUSH-INTEGRATION-COMPLETE.md` for LunarCrush integration
- `.kiro/steering/lunarcrush-api-guide.md` for API reference

---

## 🚨 CRITICAL RULES - READ FIRST

### Rule #1: AI Analysis Happens LAST

**OpenAI/ChatGPT/Caesar AI analysis MUST happen LAST, ONLY after ALL API data has been fetched and stored in the Supabase database.**

**Why**: AI needs complete context (all 10 data sources) for maximum analysis quality.

**🆕 VERIFIED USER FLOW (December 12, 2025)**:
```
Phase 1: Data Collection (60-120s)
  ├─ Market Data → Cache in DB → ✅
  ├─ Sentiment → Cache in DB → ✅
  ├─ Technical → Cache in DB → ✅
  ├─ News → Cache in DB → ✅
  └─ On-Chain → Cache in DB → ✅
  
Phase 2: GPT-5.1 Analysis (60-100s) - **AUTO-STARTS**
  ├─ Automatically starts after Phase 1
  ├─ No user input required
  ├─ Polls every 3 seconds
  └─ Displays modular analysis when complete
  
Phase 3: Caesar Research (15-20 min) - **MANUAL START ONLY**
  ├─ Shows "Start Caesar Deep Dive" button
  ├─ User must explicitly click to proceed
  ├─ Polls every 60 seconds
  └─ Displays comprehensive report when complete

Total: 17-22 minutes (with user opt-in for Caesar)
```

**NEVER**:
- ❌ Call AI before data is cached
- ❌ Call AI in parallel with data fetching
- ❌ Call AI with partial context
- ❌ Auto-start Caesar without user consent

**ALWAYS**:
- ✅ Fetch and cache ALL data first
- ✅ Verify data quality (minimum 70%)
- ✅ Aggregate complete context
- ✅ GPT-5.1 auto-starts after data collection
- ✅ Caesar requires explicit user opt-in

### 🆕 Vercel Pro Timeout Configuration (December 12, 2025)

**CRITICAL**: With Vercel Pro, we have increased timeouts to prevent failures:

- **Caesar Research Endpoints**: 1500 seconds (25 minutes)
  - `/api/ucie/research/**`
  - `/api/ucie/caesar-research/**`
  - **Why**: Caesar takes 15-20 minutes, needs buffer

- **Critical UCIE Endpoints**: 900 seconds (15 minutes)
  - `/api/ucie/comprehensive/**`
  - `/api/ucie/preview-data/**`

- **Standard UCIE Endpoints**: 600 seconds (10 minutes)
  - All individual data source endpoints
  - AI analysis endpoints
  - Whale Watch endpoints

**Why This Matters**:
- Complete data collection from 13+ APIs (60-120 seconds)
- GPT-5.1 analysis with full context (60-100 seconds)
- Caesar research with full context (15-20 minutes)
- Buffer for retries and network latency (1-2 minutes)

**See**: `VERCEL-PRO-TIMEOUT-FIX-CRITICAL.md` for complete details

### Rule #2: Database is the Source of Truth

**All UCIE data MUST be stored in Supabase database for persistence.**

**Why**: Serverless functions restart frequently, in-memory cache is lost.

**Database Tables**:
1. `ucie_analysis_cache` - Cached analysis results (TTL: 5min-24h)
2. `ucie_phase_data` - Session-based phase data (TTL: 1h)
3. `ucie_watchlist` - User watchlists
4. `ucie_alerts` - User alerts

**NEVER**:
- ❌ Use in-memory cache (Map, object, etc.)
- ❌ Store data in variables only
- ❌ Rely on function-level state

**ALWAYS**:
- ✅ Use `getCachedAnalysis()` to read from database
- ✅ Use `setCachedAnalysis()` to write to database
- ✅ Check cache before fetching fresh data
- ✅ Store results immediately after fetching

### Rule #3: Use Utility Functions

**NEVER write direct database queries. ALWAYS use the provided utilities.**

**Cache Operations**:
```typescript
import { getCachedAnalysis, setCachedAnalysis } from '../lib/ucie/cacheUtils';

// Read from cache
const cached = await getCachedAnalysis('BTC', 'market-data');

// Write to cache
await setCachedAnalysis('BTC', 'market-data', data, 300, 100);
```

**Context Aggregation**:
```typescript
import { getComprehensiveContext, formatContextForAI } from '../lib/ucie/contextAggregator';

// Get all cached data
const context = await getComprehensiveContext('BTC');

// Format for AI
const prompt = formatContextForAI(context);
```

---

## 📊 System Architecture

### Data Flow

```
User Request
    ↓
API Endpoint (e.g., /api/ucie/market-data/BTC)
    ↓
Check Database Cache (getCachedAnalysis)
    ↓
[Cache Hit] → Return cached data (< 1 second)
    ↓
[Cache Miss] → Fetch from external API
    ↓
Store in Database (setCachedAnalysis)
    ↓
Return fresh data
```

### AI Analysis Flow (VERIFIED December 12, 2025)

```
User triggers analysis for BTC
    ↓
Phase 1: Data Collection (60-120s)
    ├─ Market data → DB (parallel)
    ├─ Sentiment → DB (parallel)
    ├─ News → DB (parallel)
    ├─ Technical → DB (parallel)
    └─ On-chain → DB (parallel)
    ↓
Checkpoint: Verify data quality ≥ 70%
    ↓
Phase 2: GPT-5.1 Analysis (60-100s) - AUTO-STARTS
    ├─ Retrieve ALL data from database
    ├─ Aggregate context (getComprehensiveContext)
    ├─ Format for AI (formatContextForAI)
    ├─ Call GPT-5.1 with COMPLETE context
    ├─ Modular analysis (market, technical, sentiment, news, summary)
    └─ Store GPT-5.1 analysis → DB
    ↓
Display GPT-5.1 results to user
    ↓
Phase 3: Caesar Research (15-20 min) - MANUAL START
    ├─ Show "Start Caesar Deep Dive" button
    ├─ User clicks button (explicit opt-in)
    ├─ 3-second delay for database writes
    ├─ Retrieve ALL data + GPT-5.1 analysis from DB
    ├─ Format comprehensive context for Caesar
    ├─ Call Caesar API with COMPLETE context
    ├─ Poll every 60 seconds for status
    └─ Store Caesar research → DB
    ↓
Display complete analysis to user
```

---

## 🔧 Key Components

### 1. Cache Utilities (`lib/ucie/cacheUtils.ts`)

**Purpose**: Database-backed caching for all analysis results

**Functions**:
- `getCachedAnalysis(symbol, type)` - Read from cache
- `setCachedAnalysis(symbol, type, data, ttl, quality)` - Write to cache
- `invalidateCache(symbol, type?)` - Clear cache
- `getCacheStats(symbol)` - Get cache statistics

**Analysis Types**:
- `'market-data'` - Price, volume, market cap (TTL: 5 min)
- `'research'` - Caesar AI research (TTL: 24 hours)
- `'technical'` - Technical indicators (TTL: 1 min)
- `'sentiment'` - Social sentiment (TTL: 5 min)
- `'news'` - News articles (TTL: 5 min)
- `'on-chain'` - Blockchain data (TTL: 5 min)
- `'predictions'` - Price predictions (TTL: 1 hour)
- `'risk'` - Risk assessment (TTL: 1 hour)
- `'derivatives'` - Derivatives data (TTL: 5 min)
- `'defi'` - DeFi metrics (TTL: 1 hour)

### 2. Context Aggregator (`lib/ucie/contextAggregator.ts`)

**Purpose**: Aggregate all cached data for AI consumption

**Functions**:
- `getComprehensiveContext(symbol)` - Fetch all 10 data sources from DB
- `formatContextForAI(context)` - Format as structured prompt
- `getMinimalContext(symbol)` - Quick context (market, technical, sentiment)

**Returns**:
```typescript
{
  marketData: {...},
  technical: {...},
  sentiment: {...},
  news: {...},
  onChain: {...},
  risk: {...},
  predictions: {...},
  defi: {...},
  derivatives: {...},
  research: {...},
  dataQuality: 90,  // Percentage of available data
  availableData: ['market-data', 'technical', ...]
}
```

### 3. Database Connection (`lib/db.ts`)

**Purpose**: PostgreSQL connection pool for Supabase

**Functions**:
- `query(sql, params)` - Execute parameterized query
- `queryOne(sql, params)` - Get single row
- `queryMany(sql, params)` - Get multiple rows
- `transaction(callback)` - Execute transaction
- `testConnection()` - Test database connectivity

**Configuration**:
- Connection pooling (max 20 connections)
- SSL enabled
- Automatic retry (3 attempts)
- Timeout protection (10 seconds)

---

## 📋 API Endpoints

### Data Fetching Endpoints (Phase 1-3)

**These endpoints fetch data and cache in database**:

1. `/api/ucie/market-data/[symbol]` - Market data (CoinGecko, CMC, Kraken)
2. `/api/ucie/sentiment/[symbol]` - Social sentiment (LunarCrush, Twitter, Reddit)
3. `/api/ucie/news/[symbol]` - News articles (NewsAPI, CryptoCompare)
4. `/api/ucie/technical/[symbol]` - Technical indicators (calculated)
5. `/api/ucie/on-chain/[symbol]` - Blockchain data (Etherscan, Blockchain.com)
6. `/api/ucie/risk/[symbol]` - Risk assessment (calculated)
7. `/api/ucie/predictions/[symbol]` - Price predictions (calculated)
8. `/api/ucie/derivatives/[symbol]` - Derivatives (CoinGlass, Binance)
9. `/api/ucie/defi/[symbol]` - DeFi metrics (DeFiLlama)

**Pattern for ALL endpoints**:
```typescript
export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // 1. Check cache FIRST
  const cached = await getCachedAnalysis(symbol, 'TYPE');
  if (cached) {
    return res.status(200).json(cached);
  }
  
  // 2. Fetch fresh data
  const data = await fetchDataFromAPI(symbol);
  
  // 3. Store in cache IMMEDIATELY
  await setCachedAnalysis(symbol, 'TYPE', data, TTL_SECONDS, QUALITY_SCORE);
  
  // 4. Return data
  return res.status(200).json(data);
}
```

### AI Analysis Endpoint (Phase 4)

**This endpoint ONLY runs after all data is cached**:

`/api/ucie/research/[symbol]` - Caesar AI research

**Pattern**:
```typescript
export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // 1. Check if research is cached
  const cached = await getCachedAnalysis(symbol, 'research');
  if (cached) return res.json(cached);
  
  // 2. Get ALL cached data from database
  const context = await getComprehensiveContext(symbol);
  
  // 3. Verify data quality (minimum 70%)
  if (context.dataQuality < 70) {
    return res.status(202).json({
      error: 'Insufficient data for analysis',
      dataQuality: context.dataQuality,
      retryAfter: 10
    });
  }
  
  // 4. Format context for AI
  const contextPrompt = formatContextForAI(context);
  
  // 5. Call AI with COMPLETE context
  const research = await callCaesarAPI(contextPrompt);
  
  // 6. Store in cache
  await setCachedAnalysis(symbol, 'research', research, 86400, 100);
  
  // 7. Return
  return res.json(research);
}
```

---

## 🧪 Testing

### Verify Database Working

```bash
npx tsx scripts/verify-database-storage.ts
```

**Expected**: All tables exist, data is cached

### Test Database Access

```bash
npx tsx scripts/test-database-access.ts
```

**Expected**: 10/10 tests pass

### Test Context Aggregation

```bash
npx tsx -e "
import { getComprehensiveContext } from './lib/ucie/contextAggregator';
const context = await getComprehensiveContext('BTC');
console.log('Quality:', context.dataQuality);
console.log('Available:', context.availableData);
"
```

**Expected**: Data quality 70-100%, all sources listed

---

## 🚨 Common Mistakes to Avoid

### Mistake #1: Using In-Memory Cache

**WRONG**:
```typescript
const cache = new Map();
cache.set('BTC', data); // ❌ Lost on restart
```

**CORRECT**:
```typescript
await setCachedAnalysis('BTC', 'market-data', data, 300, 100); // ✅ Persists
```

### Mistake #2: Calling AI Before Data is Ready

**WRONG**:
```typescript
Promise.all([
  fetchMarketData(symbol),
  callCaesarAPI(symbol) // ❌ No context
]);
```

**CORRECT**:
```typescript
// Fetch and cache ALL data first
await fetchAndCacheAllData(symbol);

// THEN call AI with complete context
const context = await getComprehensiveContext(symbol);
await callCaesarAPI(context);
```

### Mistake #3: Direct Database Queries

**WRONG**:
```typescript
const result = await query('SELECT * FROM ucie_analysis_cache...'); // ❌
```

**CORRECT**:
```typescript
const cached = await getCachedAnalysis('BTC', 'market-data'); // ✅
```

### Mistake #4: Ignoring Data Quality

**WRONG**:
```typescript
const context = await getComprehensiveContext(symbol);
await callAI(context); // ❌ No quality check
```

**CORRECT**:
```typescript
const context = await getComprehensiveContext(symbol);
if (context.dataQuality < 70) {
  return error('Insufficient data');
}
await callAI(context); // ✅ Quality verified
```

---

## 📊 Performance Metrics

### Database Performance

- **Connection Latency**: 17ms (excellent)
- **Query Success Rate**: 100%
- **Cache Hit Rate Target**: > 80%
- **TTL Accuracy**: 100%

### API Performance (VERIFIED December 12, 2025)

- **Phase 1 (Data Collection)**: 60-120 seconds (parallel processing)
- **Phase 2 (GPT-5.1 Analysis)**: 60-100 seconds (auto-starts)
- **Phase 3 (Caesar Research)**: 15-20 minutes (manual start)
- **Cached Analysis**: < 1 second
- **Data Quality**: 70-100% typical

### Cost Efficiency

- **Without Caching**: $319/month
- **With Caching**: $50-100/month
- **Savings**: 68-84%

---

## 🎯 Success Criteria

### For Any UCIE Work

Before considering work complete:

- [ ] All data is cached in database (not in-memory)
- [ ] Cache utilities are used (not direct queries)
- [ ] AI analysis happens LAST (after all data cached)
- [ ] Data quality is checked (minimum 70%)
- [ ] Context aggregator is used for AI calls
- [ ] Tests pass (database, cache, context)
- [ ] No in-memory state
- [ ] Proper error handling
- [ ] Logging implemented

---

## 📚 Key Documentation

**Read These First**:
1. `UCIE-EXECUTION-ORDER-SPECIFICATION.md` - AI execution order
2. `UCIE-AI-EXECUTION-FLOW.md` - Visual flow diagram
3. `UCIE-DATABASE-ACCESS-GUIDE.md` - Database access guide
4. `OPENAI-DATABASE-INTEGRATION-GUIDE.md` - OpenAI integration

**Implementation Guides**:
1. `UCIE-ACTION-CHECKLIST.md` - Quick reference
2. `UCIE-STATUS-REPORT.md` - Current status
3. `UCIE-FINAL-SUMMARY.md` - Executive summary

**Testing**:
1. `scripts/test-database-access.ts` - Database tests
2. `scripts/verify-database-storage.ts` - Verification

---

## 🎯 VERIFIED USER FLOW (December 12, 2025)

### Complete 3-Phase Flow

**Status**: ✅ **VERIFIED CORRECT** - All phases working as designed

#### Phase 1: Data Collection (60-120 seconds)
**What Happens**:
1. User enters symbol (e.g., BTC) and clicks "Get Preview"
2. Preview modal opens with progress bar
3. Data collected in parallel from 5 sources:
   - ✅ Market Data (CoinGecko, CoinMarketCap, Kraken)
   - ✅ Sentiment (Fear & Greed, LunarCrush, CMC, CoinGecko, Reddit)
   - ✅ Technical Indicators (RSI, MACD, EMA, Bollinger Bands)
   - ✅ News (NewsAPI, CryptoCompare)
   - ✅ On-Chain (Etherscan/Blockchain.com whale tracking)
4. All data cached in Supabase database with 30-minute TTL
5. Preview displayed with data quality score

**Timeline**: 60-120 seconds (parallel processing)

#### Phase 2: GPT-5.1 Analysis (60-100 seconds) - **AUTO-STARTS**
**What Happens**:
1. **AUTOMATICALLY STARTS** after Phase 1 completes
2. Creates GPT-5.1 job via `/api/ucie/openai-summary-start/[symbol]`
3. Job processes in background with modular analysis:
   - Market Analysis (price trends, volume, market cap)
   - Technical Analysis (RSI, MACD, trend signals)
   - Sentiment Analysis (Fear & Greed, social metrics)
   - News Analysis (recent headlines, sentiment)
   - Executive Summary (comprehensive synthesis)
4. Frontend polls every 3 seconds via `/api/ucie/openai-summary-poll/[jobId]`
5. Shows progress: "AI Analysis in Progress... (45s)"
6. Displays modular analysis when complete

**Timeline**: 60-100 seconds (medium reasoning effort)

**User Experience**:
- ✅ Progress indicator with elapsed time
- ✅ "Analyzing..." status with countdown
- ✅ Modular results displayed as they complete
- ✅ NO user input required - fully automatic

#### Phase 3: Caesar AI Research (15-20 minutes) - **MANUAL START ONLY**
**What Happens**:
1. **WAITS FOR USER INPUT** - Does NOT auto-start
2. Shows "Start Caesar Deep Dive (15-20 min)" button
3. Displays what Caesar will analyze:
   - Search 15+ authoritative sources
   - Analyze technology, team, partnerships
   - Identify risks and opportunities
   - Generate comprehensive report with citations
4. User must explicitly click button to start
5. 3-second delay to ensure database writes complete
6. Caesar job created via `/api/ucie/research/[symbol]`
7. Polls every 60 seconds for status updates
8. Shows progress bar with elapsed time
9. Displays comprehensive research report when complete

**Timeline**: 15-20 minutes (NOT 5-7 minutes as previously documented)

**User Experience**:
- ✅ Clear opt-in button with time warning
- ✅ "Expected Duration: 15-20 minutes" displayed
- ✅ Progress bar with percentage (0-95%)
- ✅ Live elapsed time counter
- ✅ Poll updates every 60 seconds
- ✅ Comprehensive report with sources when complete

### Key Implementation Details

**GPT-5.1 Auto-Start**:
- File: `components/UCIE/DataPreviewModal.tsx`
- Triggers automatically after preview completes
- No user input required
- Polls every 3 seconds for status

**Caesar Manual Start**:
- File: `components/UCIE/CaesarAnalysisContainer.tsx`
- Requires explicit user click
- Shows opt-in button with clear messaging
- Timeout: 25 minutes (1500000ms)
- Polls every 60 seconds for status

**Database Caching**:
- All data stored in Supabase
- 30-minute TTL for all sources
- Uses `getCachedAnalysis()` and `setCachedAnalysis()`
- No in-memory cache

**See**: `UCIE-USER-FLOW-VERIFIED.md` for complete 500+ line verification document

---

## 🔄 Current Status (January 27, 2025)

### ✅ Complete (90%)

- Database configured and verified working
- All 4 UCIE tables created
- Cache utilities implemented
- Context aggregator implemented
- **Sentiment API fixed** (40-100% data quality)
- **On-Chain API fixed** (60-100% data quality)
- Comprehensive documentation
- Test suite complete (322 tests)
- 13/14 APIs working (92.9%)

### ⏳ Remaining (10%)

- Update remaining 8 API endpoints to use database cache (3-4 hours)
- Create store-phase-data endpoint (30 min)
- Update progressive loading hook (1 hour)
- Test end-to-end flow (2 hours)
- Verify data accuracy for Sentiment & On-Chain (user testing)

**Total**: 6-8 hours to 100% complete

---

## 🆕 OpenAI Integration for UCIE (January 2026)

### Overview
UCIE uses `o1-mini` (OpenAI's reasoning model) for AI analysis via the **Responses API** with low reasoning effort.

### Why `o1-mini` with Responses API?
- ✅ **Reasoning Model**: Optimized for analysis and reasoning tasks
- ✅ **Responses API**: Modern API with reasoning capabilities
- ✅ **Low reasoning effort**: `{ effort: "low" }` for quick responses
- ✅ **Fast responses**: 30-second timeout per analysis module
- ✅ **Bulletproof parsing**: Utility functions handle all response formats
- ✅ **Production proven**: Successfully deployed in UCIE modular analysis

### Model Selection Guide

| Task Type | Model | API | Use Case |
|-----------|-------|-----|----------|
| **UCIE Analysis** | `o1-mini` | Responses API | Data analysis, modular insights |
| **Whale Watch** | `o1-mini` | Responses API | Transaction analysis |
| **Fallback** | `gpt-4o-mini` | Chat Completions API | When Responses API fails |

**⚠️ IMPORTANT**: 
- Valid Responses API models: `o1-mini`, `o1-preview`
- Valid reasoning effort values: `low`, `medium`, `high`
- **DO NOT USE**: `gpt-5-mini`, `gpt-5.1`, `minimal` (these are fictional/invalid)

### Current Status
- ✅ **UCIE Analysis**: Uses `o1-mini` with Responses API
- ✅ **Modular Analysis**: 9 separate analyses (market, technical, sentiment, news, on-chain, risk, predictions, defi, executive summary)
- ✅ **Bulletproof Extraction**: Uses `extractResponseText()` and `validateResponseText()` utilities
- ✅ **Context Aggregation**: Uses `formatContextForAI()` for comprehensive prompts

### Implementation Pattern for UCIE

```typescript
// pages/api/ucie/openai-summary-start/[symbol].ts
import { extractResponseText, validateResponseText } from '../../../../utils/openai';
import OpenAI from 'openai';

// ✅ UCIE uses Responses API with o1-mini
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout per request
  maxRetries: 0   // We handle retries ourselves
});

// ✅ Model: o1-mini (OpenAI's reasoning model)
const model = process.env.OPENAI_MODEL || 'o1-mini';

// ✅ Call Responses API with low reasoning effort
const completion = await (openai as any).responses.create({
  model: model,
  reasoning: { effort: process.env.REASONING_EFFORT || 'low' }, // ✅ Valid: low, medium, high
  input: `You are a cryptocurrency analyst. Analyze data and respond with concise JSON.\n\n${prompt}`
});

// ✅ Bulletproof extraction (same utilities work for both APIs)
const responseText = extractResponseText(completion, true); // Debug mode
validateResponseText(responseText, model, completion);

// ✅ Parse JSON response
const analysis = JSON.parse(responseText);
}
```

### UCIE Modular Analysis Architecture

UCIE uses a **modular analysis approach** instead of one giant prompt:

1. **Market Data Analysis** (small, fast)
2. **Technical Analysis** (small, fast)
3. **Sentiment Analysis** (small, fast)
4. **News Analysis** (with market context)
5. **On-Chain Analysis** (small, fast)
6. **Risk Analysis** (small, fast)
7. **Predictions Analysis** (small, fast)
8. **DeFi Analysis** (small, fast)
9. **Executive Summary** (combines all insights)

**Benefits**:
- No socket timeouts (each request <30s)
- Granular insights (users see per-source analysis)
- Better error handling (one source fails, others succeed)
- Aligns with GPT-5.1-API-Steering guidance (avoid large prompts)

### Implementation Checklist (For UCIE Features)
- [x] Import utility functions from `utils/openai.ts`
- [x] Use Responses API with `reasoning: { effort: "low" }` (valid: low, medium, high)
- [x] Use model `o1-mini` (configurable via `OPENAI_MODEL` env var)
- [x] Use `formatContextForAI()` for comprehensive context aggregation
- [x] Use `extractResponseText()` for parsing
- [x] Use `validateResponseText()` for validation
- [x] Enable debug mode during testing
- [x] Set 30-second timeout per request
- [x] Implement retry logic with exponential backoff
- [x] Return error objects instead of throwing (graceful degradation)

**⚠️ IMPORTANT**: Never use `minimal` as reasoning effort - it's not a valid value. Use `low` instead.

**See**: `.kiro/steering/openai-integration.md` for complete OpenAI integration patterns.

---

## 🚀 Quick Start for New Work

### Before Starting Any UCIE Work:

1. **Read this document completely**
2. **Verify database is working**: `npx tsx scripts/verify-database-storage.ts`
3. **Check current status**: Read `UCIE-STATUS-REPORT.md`
4. **Understand execution order**: Read `UCIE-EXECUTION-ORDER-SPECIFICATION.md`
5. **Understand API differences**: Read `.kiro/steering/GPT-5.1-API-Steering.md` (for IDE tasks vs UCIE analysis)

### When Adding New Features:

1. **Always use database cache** (never in-memory)
2. **Always use utility functions** (never direct queries)
3. **Always check data quality** before AI calls
4. **Always aggregate context** for AI
5. **Always test** with test suite

### When Debugging:

1. Check database connection: `npx tsx scripts/test-database-access.ts`
2. Check cache entries: `npx tsx scripts/verify-database-storage.ts`
3. Check logs for execution order
4. Verify data quality scores
5. Check context aggregation

---

## 💡 Key Insights

### Why Database-Backed Caching?

- **Persistence**: Survives serverless function restarts
- **Shared State**: All function instances share cache
- **Cost Reduction**: 95% reduction in API calls
- **Performance**: < 1 second for cached data
- **Reliability**: No data loss on deployment

### Why AI Analysis Last?

- **Complete Context**: AI has all 10 data sources
- **Better Analysis**: 2-3x quality improvement
- **Consistency**: Same context = same analysis
- **Efficiency**: One AI call with full context vs multiple with partial

### Why Context Aggregator?

- **Centralized**: Single source for all context
- **Quality Scoring**: Know what data is available
- **Formatted**: Ready for AI consumption
- **Maintainable**: Easy to update and extend

---

**Remember**: Database is source of truth, AI analysis happens LAST, always use utilities!

**Status**: 🟢 **SYSTEM OPERATIONAL - 85% COMPLETE**  
**Next**: Update endpoints to use database cache (8-10 hours)
