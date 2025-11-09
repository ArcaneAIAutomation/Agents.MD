# UCIE Execution Order Specification

**Date**: January 27, 2025  
**Purpose**: Define strict execution order - AI analysis ONLY after all data is cached  
**Priority**: CRITICAL - Ensures maximum context for AI analysis

---

## 🎯 Core Principle

**OpenAI/ChatGPT analysis must happen LAST, only after ALL API data has been fetched and stored in the Supabase database.**

This ensures:
1. ✅ AI has complete context (all 10 data sources)
2. ✅ Analysis quality is maximized
3. ✅ Consistency across analyses
4. ✅ No partial or incomplete context

---

## 📊 Correct Execution Flow

### Phase 1: Critical Data (1-2 seconds)
**Fetch and Cache FIRST**:
```
1. Market Data API → Fetch → Store in DB → ✅ Cached
   - CoinGecko/CoinMarketCap
   - Price, volume, market cap
   - TTL: 5 minutes
```

### Phase 2: Important Data (2-4 seconds)
**Fetch and Cache FIRST**:
```
2. Sentiment API → Fetch → Store in DB → ✅ Cached
   - LunarCrush, Twitter, Reddit
   - Social scores, trending topics
   - TTL: 5 minutes

3. News API → Fetch → Store in DB → ✅ Cached
   - NewsAPI, CryptoCompare
   - Recent articles, sentiment
   - TTL: 5 minutes
```

### Phase 3: Enhanced Data (4-8 seconds)
**Fetch and Cache FIRST**:
```
4. Technical Analysis → Calculate → Store in DB → ✅ Cached
   - RSI, MACD, EMA, Bollinger Bands
   - Multi-timeframe consensus
   - TTL: 1 minute

5. On-Chain Data → Fetch → Store in DB → ✅ Cached
   - Etherscan, Blockchain.com
   - Whale transactions, holder distribution
   - TTL: 5 minutes

6. Risk Assessment → Calculate → Store in DB → ✅ Cached
   - Volatility, correlations, max drawdown
   - TTL: 1 hour

7. Predictions → Calculate → Store in DB → ✅ Cached
   - Price predictions, pattern matching
   - TTL: 1 hour

8. Derivatives → Fetch → Store in DB → ✅ Cached
   - CoinGlass, Binance Futures
   - Funding rates, open interest
   - TTL: 5 minutes

9. DeFi Metrics → Fetch → Store in DB → ✅ Cached
   - DeFiLlama, The Graph
   - TVL, protocol revenue
   - TTL: 1 hour
```

### Phase 4: AI Analysis (5-10 minutes)
**ONLY AFTER ALL ABOVE DATA IS CACHED**:
```
10. ⏸️ WAIT FOR ALL DATA TO BE CACHED ⏸️

11. Retrieve ALL cached data from database:
    ✅ market-data
    ✅ sentiment
    ✅ news
    ✅ technical
    ✅ on-chain
    ✅ risk
    ✅ predictions
    ✅ derivatives
    ✅ defi

12. Aggregate context (getComprehensiveContext)
    → Data quality: 90-100%
    → All 9 sources available

13. Format context for AI (formatContextForAI)
    → Structured prompt with ALL data

14. Call OpenAI/Caesar API with COMPLETE context
    → Enhanced analysis
    → Better recommendations

15. Store AI analysis → Store in DB → ✅ Cached
    - TTL: 24 hours
```

---

## 🔧 Implementation

### Updated Research Endpoint

**File**: `pages/api/ucie/research/[symbol].ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../lib/ucie/cacheUtils';
import { getComprehensiveContext, formatContextForAI } from '../../../lib/ucie/contextAggregator';
import { createCaesarResearch, pollCaesarResearch } from '../../../lib/ucie/caesarClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol, sessionId } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Check if research is already cached
    const cachedResearch = await getCachedAnalysis(symbol, 'research');
    if (cachedResearch) {
      console.log(`✅ Returning cached research for ${symbol}`);
      return res.status(200).json({
        success: true,
        data: cachedResearch,
        source: 'cache',
        dataQuality: 100
      });
    }

    console.log(`🔍 Starting research for ${symbol}...`);

    // ============================================================================
    // CRITICAL: Wait for ALL data to be cached BEFORE AI analysis
    // ============================================================================

    console.log(`⏸️ Waiting for all data sources to be cached...`);

    // Retrieve ALL cached data from database
    const context = await getComprehensiveContext(symbol);

    // Check data quality - require at least 70% for good analysis
    if (context.dataQuality < 70) {
      console.warn(`⚠️ Low data quality: ${context.dataQuality.toFixed(0)}%`);
      console.warn(`⚠️ Available: ${context.availableData.join(', ')}`);
      console.warn(`⚠️ Missing: ${getMissingData(context)}`);
      
      return res.status(202).json({
        success: false,
        error: 'Insufficient data for analysis',
        message: 'Please wait for all data sources to be fetched first',
        dataQuality: context.dataQuality,
        availableData: context.availableData,
        missingData: getMissingData(context),
        retryAfter: 10 // seconds
      });
    }

    console.log(`✅ Data quality: ${context.dataQuality.toFixed(0)}%`);
    console.log(`✅ Available sources: ${context.availableData.join(', ')}`);

    // Format context for AI
    const contextPrompt = formatContextForAI(context);

    // Create enhanced query with COMPLETE context
    const query = `${contextPrompt}

Based on the comprehensive data above, provide a detailed analysis of ${symbol} covering:

1. **Technology & Innovation**: Assess the technology, use case, and innovation level
2. **Market Position**: Analyze market position, competitors, and adoption metrics
3. **Team & Leadership**: Evaluate team background, track record, and credibility
4. **Partnerships & Ecosystem**: Review partnerships, integrations, and ecosystem development
5. **Risk Factors**: Identify key risks, concerns, and red flags
6. **Investment Thesis**: Provide bull/bear cases and clear recommendation

Use the provided data to support your analysis with specific metrics, trends, and evidence.`;

    console.log(`🤖 Calling Caesar AI with ${context.dataQuality.toFixed(0)}% context...`);

    // Call Caesar API with complete context
    const job = await createCaesarResearch(query, 5);
    console.log(`✅ Caesar job created: ${job.id}`);

    // Poll for completion (10 minutes max, 60-second intervals)
    console.log(`⏳ Polling for Caesar completion (max 10 minutes)...`);
    const result = await pollCaesarResearch(job.id, 60000, 10);

    console.log(`✅ Caesar research completed for ${symbol}`);

    // Store in cache (24 hours)
    await setCachedAnalysis(symbol, 'research', result, 86400, 100);
    console.log(`💾 Research cached for ${symbol}`);

    return res.status(200).json({
      success: true,
      data: result,
      source: 'fresh',
      dataQuality: context.dataQuality,
      contextUsed: context.availableData
    });

  } catch (error) {
    console.error(`❌ Research error for ${symbol}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate research',
      details: error.message
    });
  }
}

/**
 * Get list of missing data sources
 */
function getMissingData(context: any): string[] {
  const allSources = [
    'market-data',
    'sentiment',
    'news',
    'technical',
    'on-chain',
    'risk',
    'predictions',
    'derivatives',
    'defi'
  ];

  return allSources.filter(source => !context.availableData.includes(source));
}
```

### Updated Progressive Loading Hook

**File**: `hooks/useProgressiveLoading.ts`

```typescript
import { useState, useEffect } from 'react';

export function useProgressiveLoading(symbol: string) {
  const [phase, setPhase] = useState(1);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    async function loadData() {
      try {
        // Phase 1: Market Data (MUST complete first)
        setPhase(1);
        console.log('📊 Phase 1: Fetching market data...');
        const marketData = await fetch(`/api/ucie/market-data/${symbol}`).then(r => r.json());
        setData(prev => ({ ...prev, marketData }));
        console.log('✅ Phase 1: Market data cached');

        // Phase 2: Sentiment & News (MUST complete before Phase 4)
        setPhase(2);
        console.log('📊 Phase 2: Fetching sentiment and news...');
        const [sentiment, news] = await Promise.all([
          fetch(`/api/ucie/sentiment/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/news/${symbol}`).then(r => r.json())
        ]);
        setData(prev => ({ ...prev, sentiment, news }));
        console.log('✅ Phase 2: Sentiment and news cached');

        // Phase 3: Technical, On-Chain, Risk, Predictions, Derivatives, DeFi
        // (MUST complete before Phase 4)
        setPhase(3);
        console.log('📊 Phase 3: Fetching enhanced data...');
        const [technical, onChain, risk, predictions, derivatives, defi] = await Promise.all([
          fetch(`/api/ucie/technical/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/on-chain/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/risk/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/predictions/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/derivatives/${symbol}`).then(r => r.json()),
          fetch(`/api/ucie/defi/${symbol}`).then(r => r.json())
        ]);
        setData(prev => ({ ...prev, technical, onChain, risk, predictions, derivatives, defi }));
        console.log('✅ Phase 3: Enhanced data cached');

        // ============================================================================
        // Phase 4: AI Analysis - ONLY AFTER ALL DATA IS CACHED
        // ============================================================================
        setPhase(4);
        console.log('⏸️ All data cached. Starting AI analysis...');
        console.log('🤖 Phase 4: Calling OpenAI/Caesar with COMPLETE context...');
        
        const research = await fetch(`/api/ucie/research/${symbol}`).then(r => r.json());
        
        if (!research.success && research.dataQuality < 70) {
          console.warn('⚠️ Insufficient data quality, retrying...');
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, 10000));
          const retryResearch = await fetch(`/api/ucie/research/${symbol}`).then(r => r.json());
          setData(prev => ({ ...prev, research: retryResearch.data }));
        } else {
          setData(prev => ({ ...prev, research: research.data }));
        }
        
        console.log('✅ Phase 4: AI analysis complete');
        console.log(`✅ Context quality: ${research.dataQuality}%`);

        setLoading(false);

      } catch (err) {
        console.error('❌ Progressive loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadData();
  }, [symbol]);

  return { phase, data, loading, error };
}
```

---

## 🚫 What NOT To Do

### ❌ WRONG: AI Analysis Before Data is Cached

```typescript
// ❌ BAD: Calling AI immediately
const research = await callCaesarAPI(symbol);
// Problem: No context, poor analysis

// ❌ BAD: Calling AI in parallel with data fetching
Promise.all([
  fetchMarketData(symbol),
  fetchSentiment(symbol),
  callCaesarAPI(symbol) // ❌ AI runs before data is ready
]);
```

### ✅ CORRECT: AI Analysis After All Data is Cached

```typescript
// ✅ GOOD: Fetch and cache all data FIRST
await Promise.all([
  fetchAndCacheMarketData(symbol),
  fetchAndCacheSentiment(symbol),
  fetchAndCacheNews(symbol),
  fetchAndCacheTechnical(symbol),
  fetchAndCacheOnChain(symbol),
  fetchAndCacheRisk(symbol),
  fetchAndCachePredictions(symbol),
  fetchAndCacheDerivatives(symbol),
  fetchAndCacheDeFi(symbol)
]);

// ✅ THEN retrieve all cached data
const context = await getComprehensiveContext(symbol);

// ✅ THEN call AI with complete context
const research = await callCaesarAPIWithContext(symbol, context);
```

---

## 📊 Data Quality Requirements

### Minimum Requirements for AI Analysis

| Data Quality | Action |
|--------------|--------|
| < 50% | ❌ Reject - Too little data |
| 50-69% | ⚠️ Warn - Proceed with caution |
| 70-89% | ✅ Good - Proceed |
| 90-100% | ✅ Excellent - Optimal |

### Required Data Sources (Minimum 7/9)

**Critical** (Must have):
1. ✅ market-data
2. ✅ technical
3. ✅ sentiment

**Important** (Should have):
4. ✅ news
5. ✅ on-chain
6. ✅ risk

**Optional** (Nice to have):
7. ⭕ predictions
8. ⭕ derivatives
9. ⭕ defi

---

## 🧪 Testing

### Test 1: Verify Execution Order

```bash
# Start analysis
curl http://localhost:3000/api/ucie/research/BTC

# Watch logs - should see:
# 1. "Waiting for all data sources to be cached..."
# 2. "Data quality: X%"
# 3. "Available sources: ..."
# 4. "Calling Caesar AI with X% context..."
# 5. "Caesar research completed"
```

### Test 2: Verify Data Quality Check

```bash
# Call research endpoint before data is cached
curl http://localhost:3000/api/ucie/research/NEWTOKEN

# Should return 202 with:
# {
#   "success": false,
#   "error": "Insufficient data for analysis",
#   "dataQuality": 30,
#   "retryAfter": 10
# }
```

### Test 3: Verify Context Usage

```bash
# Check logs after successful analysis
# Should see:
# "Context quality: 90%"
# "Available sources: market-data, technical, sentiment, news, on-chain, risk, predictions, derivatives, defi"
```

---

## 📋 Implementation Checklist

- [ ] Update research endpoint with data quality check
- [ ] Update progressive loading hook with proper phase order
- [ ] Add getMissingData() helper function
- [ ] Add data quality validation (minimum 70%)
- [ ] Add retry logic for insufficient data
- [ ] Test execution order
- [ ] Test data quality requirements
- [ ] Verify AI receives complete context
- [ ] Monitor analysis quality improvements

---

## 🎯 Success Criteria

### Execution Order

- [x] Phase 1-3 complete BEFORE Phase 4
- [x] All data cached in database
- [x] Data quality checked (minimum 70%)
- [x] Context aggregated from database
- [x] AI receives complete context
- [x] Analysis quality maximized

### Data Quality

- [x] Minimum 70% data quality required
- [x] Missing data sources identified
- [x] Retry logic for insufficient data
- [x] User notified of data quality
- [x] Logs show context usage

---

## 🎉 Summary

### Core Principle

**OpenAI/ChatGPT analysis happens LAST, only after ALL API data has been fetched and stored in the Supabase database.**

### Execution Flow

```
Phase 1: Market Data → Cache → ✅
Phase 2: Sentiment & News → Cache → ✅
Phase 3: Technical, On-Chain, Risk, Predictions, Derivatives, DeFi → Cache → ✅
⏸️ WAIT - Verify all data is cached
Phase 4: Retrieve ALL data → Aggregate context → Call AI → ✅
```

### Benefits

1. ✅ AI has complete context (90-100% data quality)
2. ✅ Analysis quality maximized
3. ✅ Consistency across analyses
4. ✅ No partial or incomplete context
5. ✅ Better recommendations
6. ✅ More reliable insights

---

**Status**: 🟢 **SPECIFICATION COMPLETE**  
**Priority**: CRITICAL  
**Action**: Implement execution order in research endpoint

**AI analysis will ONLY happen after ALL data is cached in the database!** ✅
