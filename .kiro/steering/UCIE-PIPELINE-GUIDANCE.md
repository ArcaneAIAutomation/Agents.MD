# UCIE Pipeline Guidance - Authoritative Reference

**Last Updated**: January 2, 2026  
**Status**: ✅ **AUTHORITATIVE GUIDANCE**  
**Priority**: CRITICAL - Follow this document for all UCIE work  
**Purpose**: Guarantee data flows correctly through every stage without crashes, undefined values, or shape mismatches

---

## 🎯 Overview

This document defines the complete UCIE (Universal Crypto Intelligence Engine) pipeline from start to finish. It ensures:
- ✅ Data flows correctly through every stage
- ✅ Final aggregated dataset is ALWAYS fed correctly into GPT
- ✅ No crashes, undefined values, or shape mismatches
- ✅ Arrays are ALWAYS arrays, never objects or undefined

---

## 📊 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UCIE PIPELINE FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: Session Initialization                                            │
│  ├─ Generate UUID for session tracking                                      │
│  ├─ Create job record in Supabase                                           │
│  └─ Initialize heartbeat mechanism                                          │
│                                                                              │
│  STAGE 2: Raw API Collection (Parallel)                                     │
│  ├─ Market Data (CoinGecko, CoinMarketCap, Kraken)                         │
│  ├─ Sentiment (Fear & Greed, LunarCrush, CMC, CoinGecko, Reddit)           │
│  ├─ Technical Indicators (RSI, MACD, EMA, Bollinger Bands)                 │
│  ├─ News (NewsAPI, CryptoCompare)                                          │
│  └─ On-Chain (Etherscan, Blockchain.com)                                   │
│                                                                              │
│  STAGE 3: Supabase Storage (Strict Schema)                                  │
│  ├─ Store each data source with quality score                              │
│  ├─ Use setCachedAnalysis() utility                                        │
│  └─ Verify storage success (minimum 2 sources)                             │
│                                                                              │
│  STAGE 4: Gate Check (CRITICAL)                                             │
│  ├─ MIN_STORAGE_SUCCESS = 2                                                │
│  ├─ MIN_DATA_QUALITY = 70%                                                 │
│  └─ MIN_DB_VERIFICATION = 3                                                │
│                                                                              │
│  STAGE 5: Modular GPT Analysis (9 Analyses)                                 │
│  ├─ Market Analysis                                                         │
│  ├─ Technical Analysis                                                      │
│  ├─ Sentiment Analysis                                                      │
│  ├─ News Analysis (with market context)                                    │
│  ├─ On-Chain Analysis                                                       │
│  ├─ Risk Analysis                                                           │
│  ├─ Predictions Analysis                                                    │
│  ├─ DeFi Analysis                                                           │
│  └─ Executive Summary (combines all)                                        │
│                                                                              │
│  STAGE 6: Final Storage & Response                                          │
│  ├─ Store complete analysis in Supabase                                    │
│  ├─ Update job status to 'completed'                                       │
│  └─ Return render-safe output                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Stage 1: Session Initialization

### Purpose
Create a unique session identifier and job record for tracking the analysis pipeline.

### Implementation

```typescript
// Generate unique job ID
const jobId = crypto.randomUUID();

// Create job record in Supabase
const { error: insertError } = await supabase
  .from('ucie_openai_jobs')
  .insert({
    id: jobId,
    symbol: symbol.toUpperCase(),
    status: 'processing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress: 0,
    current_step: 'initializing'
  });

// Initialize heartbeat (updates every 15 seconds)
const heartbeatInterval = setInterval(async () => {
  await supabase
    .from('ucie_openai_jobs')
    .update({ 
      updated_at: new Date().toISOString(),
      heartbeat: new Date().toISOString()
    })
    .eq('id', jobId);
}, 15000);
```

### Validation Rules
- ✅ Job ID must be valid UUID
- ✅ Symbol must be uppercase (e.g., 'BTC', 'ETH')
- ✅ Initial status must be 'processing'
- ✅ Heartbeat must update every 15 seconds

---

## 🔧 Stage 2: Raw API Collection

### Purpose
Fetch data from all configured API sources in parallel.

### Data Sources (5 Primary)

| Source | APIs Used | TTL | Quality Weight |
|--------|-----------|-----|----------------|
| Market Data | CoinGecko, CoinMarketCap, Kraken | 5 min | 25% |
| Sentiment | Fear & Greed, LunarCrush, CMC, CoinGecko, Reddit | 5 min | 20% |
| Technical | Calculated from price data | 1 min | 20% |
| News | NewsAPI, CryptoCompare | 5 min | 15% |
| On-Chain | Etherscan, Blockchain.com | 5 min | 20% |

### Implementation Pattern

```typescript
// Parallel data fetching with Promise.allSettled
const [marketResult, sentimentResult, technicalResult, newsResult, onChainResult] = 
  await Promise.allSettled([
    fetchMarketData(symbol),
    fetchSentimentData(symbol),
    fetchTechnicalData(symbol),
    fetchNewsData(symbol),
    fetchOnChainData(symbol)
  ]);

// Process results with null safety
const marketData = marketResult.status === 'fulfilled' ? marketResult.value : null;
const sentimentData = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
const technicalData = technicalResult.status === 'fulfilled' ? technicalResult.value : null;
const newsData = newsResult.status === 'fulfilled' ? newsResult.value : null;
const onChainData = onChainResult.status === 'fulfilled' ? onChainResult.value : null;
```

### Validation Rules
- ✅ Use `Promise.allSettled()` (NOT `Promise.all()`) to prevent cascade failures
- ✅ Always check `result.status === 'fulfilled'` before accessing value
- ✅ Default to `null` for failed fetches, NOT `undefined`
- ✅ Log all failures with detailed error messages

---

## 🔧 Stage 3: Supabase Storage

### Purpose
Store all fetched data in Supabase with quality scores for later retrieval.

### Required Utility Functions

```typescript
import { getCachedAnalysis, setCachedAnalysis } from '../lib/ucie/cacheUtils';
```

### Implementation Pattern

```typescript
// Store each data source with quality score
const storageResults = await Promise.allSettled([
  setCachedAnalysis(symbol, 'market-data', marketData, 300, calculateQuality(marketData)),
  setCachedAnalysis(symbol, 'sentiment', sentimentData, 300, calculateQuality(sentimentData)),
  setCachedAnalysis(symbol, 'technical', technicalData, 60, calculateQuality(technicalData)),
  setCachedAnalysis(symbol, 'news', newsData, 300, calculateQuality(newsData)),
  setCachedAnalysis(symbol, 'on-chain', onChainData, 300, calculateQuality(onChainData))
]);

// Count successful storage operations
const successfulStorage = storageResults.filter(r => r.status === 'fulfilled').length;
```

### setCachedAnalysis Signature

```typescript
async function setCachedAnalysis(
  symbol: string,      // e.g., 'BTC'
  type: string,        // e.g., 'market-data', 'sentiment', 'technical', 'news', 'on-chain'
  data: any,           // The data to cache
  ttlSeconds: number,  // Time-to-live in seconds
  qualityScore: number // 0-100 quality score
): Promise<boolean>
```

### Validation Rules
- ✅ Use `setCachedAnalysis()` utility (NEVER direct database queries)
- ✅ Calculate quality score for each data source
- ✅ Track successful storage count
- ✅ Minimum 2 successful storage operations required

---

## 🔧 Stage 4: Gate Check (CRITICAL)

### Purpose
Verify data quality meets minimum thresholds before proceeding to GPT analysis.

### Gate Check Constants

```typescript
const MIN_STORAGE_SUCCESS = 2;    // Minimum successful storage operations
const MIN_DATA_QUALITY = 70;      // Minimum overall data quality percentage
const MIN_DB_VERIFICATION = 3;    // Minimum database verifications
```

### Implementation Pattern

```typescript
// Calculate overall data quality
const dataQuality = calculateOverallQuality({
  marketData,
  sentimentData,
  technicalData,
  newsData,
  onChainData
});

// Gate check
if (successfulStorage < MIN_STORAGE_SUCCESS) {
  throw new Error(`Insufficient storage: ${successfulStorage}/${MIN_STORAGE_SUCCESS}`);
}

if (dataQuality < MIN_DATA_QUALITY) {
  throw new Error(`Insufficient data quality: ${dataQuality}%/${MIN_DATA_QUALITY}%`);
}

// Verify data in database
const verificationCount = await verifyDatabaseStorage(symbol);
if (verificationCount < MIN_DB_VERIFICATION) {
  throw new Error(`Insufficient DB verification: ${verificationCount}/${MIN_DB_VERIFICATION}`);
}
```

### Quality Calculation

```typescript
function calculateOverallQuality(data: any): number {
  const sources = [
    { data: data.marketData, weight: 25 },
    { data: data.sentimentData, weight: 20 },
    { data: data.technicalData, weight: 20 },
    { data: data.newsData, weight: 15 },
    { data: data.onChainData, weight: 20 }
  ];
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const source of sources) {
    if (source.data && !source.data.error) {
      totalWeight += source.weight;
      weightedScore += source.weight;
    }
  }
  
  return totalWeight > 0 ? Math.round((weightedScore / 100) * 100) : 0;
}
```

### Validation Rules
- ✅ NEVER proceed to GPT analysis if gate check fails
- ✅ Return 202 status with retry instructions if data quality insufficient
- ✅ Log all gate check failures with detailed reasons

---

## 🔧 Stage 5: Modular GPT Analysis

### Purpose
Perform 9 separate GPT analyses using o1-mini with Responses API.

### Model Configuration

```typescript
// Valid model names (January 2026)
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'o1-mini';
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

// Valid reasoning effort values: 'low', 'medium', 'high'
// ⚠️ DO NOT USE: 'minimal', 'none' (these are INVALID)
const REASONING_EFFORT = process.env.REASONING_EFFORT || 'low';
```

### 9 Modular Analyses

| Analysis | Data Source | Timeout | Purpose |
|----------|-------------|---------|---------|
| Market | market-data | 30s | Price trends, volume, market cap |
| Technical | technical | 30s | RSI, MACD, trend signals |
| Sentiment | sentiment | 30s | Fear & Greed, social metrics |
| News | news + context | 30s | Headlines, market impact |
| On-Chain | on-chain | 30s | Whale activity, network stats |
| Risk | calculated | 30s | Volatility, risk factors |
| Predictions | calculated | 30s | Price forecasts |
| DeFi | defi | 30s | TVL, protocol metrics |
| Executive Summary | ALL | 30s | Comprehensive synthesis |

### Implementation Pattern

```typescript
// Import utilities
const OpenAI = (await import('openai')).default;
const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');

// Initialize client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout per request
  maxRetries: 0   // We handle retries ourselves
});

// Call o1-mini with Responses API
const completion = await (openai as any).responses.create({
  model: OPENAI_MODEL,
  reasoning: { effort: REASONING_EFFORT },
  input: `You are a cryptocurrency analyst. ${prompt}`
});

// Bulletproof extraction
const responseText = extractResponseText(completion, true); // Debug mode
validateResponseText(responseText, OPENAI_MODEL, completion);

// Parse JSON response
const analysis = JSON.parse(responseText);
```

### Error Handling Pattern

```typescript
async function analyzeDataSource(
  apiKey: string,
  model: string,
  symbol: string,
  dataType: string,
  data: any,
  instructions: string
): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ... analysis logic ...
      return JSON.parse(responseText);
      
    } catch (error) {
      console.error(`❌ ${dataType} analysis attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // ✅ CRITICAL: Return error object instead of throwing
        // This allows other analyses to continue even if one fails
        return {
          error: 'Analysis failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          dataType: dataType,
          timestamp: new Date().toISOString()
        };
      }
      
      // Exponential backoff
      const backoffMs = 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}
```

### Validation Rules
- ✅ Use `o1-mini` model (NOT fictional `gpt-5-mini` or `gpt-5.1`)
- ✅ Use Responses API with `reasoning: { effort: 'low' }`
- ✅ Use `extractResponseText()` for bulletproof parsing
- ✅ Use `validateResponseText()` for validation
- ✅ Return error objects instead of throwing (graceful degradation)
- ✅ Implement 3-retry logic with exponential backoff
- ✅ 30-second timeout per analysis

---

## 🔧 Stage 6: Normalization Layer (CRITICAL)

### Purpose
Ensure ALL arrays are arrays, NEVER objects or undefined, before rendering and final GPT calls.

### The Iron Rule

```typescript
// ✅ CORRECT: Always use (array || []).map()
const items = (data.items || []).map(item => item.name);

// ❌ WRONG: Direct access without null check
const items = data.items.map(item => item.name); // WILL CRASH if items is undefined
```

### Normalization Patterns

```typescript
// Pattern 1: Array access with fallback
const articles = (newsData?.articles || []);
const indicators = (technicalData?.indicators || []);
const transactions = (onChainData?.transactions || []);

// Pattern 2: Nested array access
const keyInsights = (analysis?.key_insights || analysis?.keyInsights || []);
const riskFactors = (analysis?.risk_factors || analysis?.riskFactors || []);

// Pattern 3: Object property access with fallback
const confidence = analysis?.confidence ?? analysis?.confidenceScore ?? 0;
const sentiment = analysis?.sentiment ?? analysis?.overallSentiment ?? 'neutral';

// Pattern 4: Safe iteration
{(items || []).map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

### Field Mapping Helper

```typescript
// Helper function for flexible field matching
function getFieldValue(obj: any, ...keys: string[]): any {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
}

// Usage
const confidence = getFieldValue(analysis, 'confidence', 'confidenceScore', 'score') || 0;
const insights = getFieldValue(analysis, 'key_insights', 'keyInsights', 'insights') || [];
```

### Validation Rules
- ✅ ALWAYS use `(array || [])` pattern before `.map()`, `.filter()`, `.reduce()`
- ✅ ALWAYS use optional chaining `?.` for nested property access
- ✅ ALWAYS provide fallback values with `??` or `||`
- ✅ NEVER assume array fields exist
- ✅ NEVER assume object properties exist

---

## 🔧 Stage 7: Final Aggregation Prompt Build

### Purpose
Build comprehensive prompt for executive summary using `formatContextForAI()`.

### Context Aggregator Usage

```typescript
import { getComprehensiveContext, formatContextForAI } from '../lib/ucie/contextAggregator';

// Get all cached data from database
const context = await getComprehensiveContext(symbol);

// Verify data quality
if (context.dataQuality < MIN_DATA_QUALITY) {
  throw new Error(`Insufficient data quality: ${context.dataQuality}%`);
}

// Format for AI consumption
const formattedContext = formatContextForAI(context);
```

### formatContextForAI Output Structure

```typescript
// Returns structured string with all data sources:
`
=== COMPREHENSIVE ${symbol} ANALYSIS CONTEXT ===
Generated: ${timestamp}
Data Quality: ${dataQuality}%
Available Sources: ${availableData.join(', ')}

=== MARKET DATA ===
${JSON.stringify(marketData, null, 2)}

=== TECHNICAL INDICATORS ===
${JSON.stringify(technical, null, 2)}

=== SENTIMENT DATA ===
${JSON.stringify(sentiment, null, 2)}

=== NEWS DATA ===
${JSON.stringify(news, null, 2)}

=== ON-CHAIN DATA ===
${JSON.stringify(onChain, null, 2)}

=== RISK ASSESSMENT ===
${JSON.stringify(risk, null, 2)}

=== PREDICTIONS ===
${JSON.stringify(predictions, null, 2)}

=== DEFI METRICS ===
${JSON.stringify(defi, null, 2)}

=== DERIVATIVES DATA ===
${JSON.stringify(derivatives, null, 2)}
`
```

### Validation Rules
- ✅ Use `getComprehensiveContext()` to retrieve all cached data
- ✅ Use `formatContextForAI()` to build structured prompt
- ✅ Verify data quality before proceeding
- ✅ Include all available data sources in prompt

---

## 🔧 Stage 8: Final GPT Analysis (Executive Summary)

### Purpose
Generate comprehensive executive summary combining all modular analyses.

### Implementation

```typescript
async function generateExecutiveSummary(
  apiKey: string,
  model: string,
  symbol: string,
  analysisSummary: any,
  formattedContext?: string
): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const OpenAI = (await import('openai')).default;
      const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
      
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000,
        maxRetries: 0
      });
      
      // Build prompt with comprehensive context
      const prompt = formattedContext 
        ? buildEnhancedPrompt(symbol, analysisSummary, formattedContext)
        : buildBasicPrompt(symbol, analysisSummary);
      
      // Call o1-mini with Responses API
      const completion = await (openai as any).responses.create({
        model: model,
        reasoning: { effort: process.env.REASONING_EFFORT || 'low' },
        input: `You are a cryptocurrency analyst. Synthesize all analyses into comprehensive executive summary. Respond with JSON only.\n\n${prompt}`
      });
      
      // Bulletproof extraction
      const summaryText = extractResponseText(completion, true);
      validateResponseText(summaryText, model, completion);
      
      return JSON.parse(summaryText);
      
    } catch (error) {
      if (attempt === maxRetries) {
        // Return error object instead of throwing
        return {
          error: 'Executive summary generation failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          summary: 'Unable to generate executive summary due to API error',
          timestamp: new Date().toISOString()
        };
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Expected Output Structure

```typescript
interface ExecutiveSummary {
  summary: string;                    // 2-3 paragraph synthesis
  confidence: number;                 // 0-100
  recommendation: string;             // "Buy" | "Hold" | "Sell" with reasoning
  key_insights: string[];             // Array of key insights
  market_outlook: string;             // 24-48 hour outlook
  risk_factors: string[];             // Array of risk factors
  opportunities: string[];            // Array of opportunities
  data_quality_assessment?: string;   // Optional quality assessment
}
```

### Validation Rules
- ✅ Include `formattedContext` for enhanced analysis
- ✅ Return error object on failure (graceful degradation)
- ✅ Validate JSON structure before returning
- ✅ Ensure all array fields are arrays

---

## 🔧 Stage 9: Render-Safe Output

### Purpose
Ensure final output is safe for frontend rendering without crashes.

### Output Normalization

```typescript
// Normalize final analysis for rendering
function normalizeAnalysisForRendering(analysis: any): ModularAnalysis {
  return {
    // Metadata
    modelUsed: analysis.modelUsed || 'o1-mini',
    reasoningEffort: analysis.reasoningEffort || 'low',
    isUsingFallback: analysis.isUsingFallback || false,
    
    // Modular analyses (ensure all are objects, not undefined)
    market: analysis.market || { error: 'No market analysis available' },
    technical: analysis.technical || { error: 'No technical analysis available' },
    sentiment: analysis.sentiment || { error: 'No sentiment analysis available' },
    news: analysis.news || { error: 'No news analysis available' },
    onChain: analysis.onChain || { error: 'No on-chain analysis available' },
    risk: analysis.risk || { error: 'No risk analysis available' },
    predictions: analysis.predictions || { error: 'No predictions available' },
    defi: analysis.defi || { error: 'No DeFi analysis available' },
    executiveSummary: analysis.executiveSummary || { error: 'No executive summary available' },
    
    // Ensure arrays are arrays
    key_insights: Array.isArray(analysis.key_insights) ? analysis.key_insights : [],
    risk_factors: Array.isArray(analysis.risk_factors) ? analysis.risk_factors : [],
    opportunities: Array.isArray(analysis.opportunities) ? analysis.opportunities : [],
    
    // Timestamps
    timestamp: analysis.timestamp || new Date().toISOString(),
    completedAt: analysis.completedAt || new Date().toISOString()
  };
}
```

### Frontend Rendering Pattern

```typescript
// Safe rendering with null checks
function AnalysisCard({ analysis }: { analysis: any }) {
  // Use helper function for flexible field matching
  const confidence = getFieldValue(analysis, 'confidence', 'confidenceScore', 'score') || 0;
  const insights = getFieldValue(analysis, 'key_insights', 'keyInsights', 'insights') || [];
  const summary = getFieldValue(analysis, 'summary', 'analysis', 'content') || 'No analysis available';
  
  return (
    <div>
      <p>Confidence: {confidence}%</p>
      <p>{summary}</p>
      <ul>
        {(insights || []).map((insight, index) => (
          <li key={index}>{insight}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Validation Rules
- ✅ Normalize all analysis objects before storing
- ✅ Ensure all array fields are arrays (use `Array.isArray()`)
- ✅ Provide fallback values for all fields
- ✅ Use `getFieldValue()` helper for flexible field matching
- ✅ Always use `(array || []).map()` pattern in JSX

---

## 🚨 Debugging Requirements

### Console Logging Standards

```typescript
// Stage markers
console.log(`🚀 [UCIE] Starting pipeline for ${symbol}`);
console.log(`📊 [Stage 2] Fetching data from ${sourceCount} sources...`);
console.log(`💾 [Stage 3] Storing ${successCount}/${totalCount} sources in Supabase`);
console.log(`🔍 [Stage 4] Gate check: Quality=${dataQuality}%, Storage=${storageCount}`);
console.log(`🤖 [Stage 5] Starting modular GPT analysis...`);
console.log(`✅ [UCIE] Pipeline completed in ${duration}ms`);

// Error logging
console.error(`❌ [Stage X] Error:`, error.message);
console.error(`❌ [Stage X] Stack:`, error.stack);

// Model logging (CRITICAL for debugging)
console.log(`🤖 ========================================`);
console.log(`🤖 OPENAI MODEL CONFIGURATION`);
console.log(`🤖 Model: ${model}`);
console.log(`🤖 Reasoning Effort: ${reasoningEffort}`);
console.log(`🤖 Fallback Model: ${fallbackModel}`);
console.log(`🤖 Is Using Fallback: ${isUsingFallback}`);
console.log(`🤖 ========================================`);
```

### Required Vercel Logs

When debugging UCIE issues, check Vercel function logs for:
1. Model configuration block (shows which model is being used)
2. Gate check results (shows data quality and storage counts)
3. Individual analysis completion times
4. Error messages with stack traces

---

## 📋 Environment Variables

### Required Variables

```bash
# OpenAI Configuration (CRITICAL)
OPENAI_API_KEY=sk-...                    # Your OpenAI API key
OPENAI_MODEL=o1-mini                     # Valid: o1-mini, o1-preview
OPENAI_FALLBACK_MODEL=gpt-4o-mini        # Valid: gpt-4o-mini, gpt-4o
REASONING_EFFORT=low                     # Valid: low, medium, high

# ⚠️ DO NOT USE THESE (INVALID):
# OPENAI_MODEL=gpt-5-mini                # FICTIONAL - DOES NOT EXIST
# OPENAI_MODEL=gpt-5.1                   # FICTIONAL - DOES NOT EXIST
# REASONING_EFFORT=minimal               # INVALID - USE 'low' INSTEAD
```

### Vercel Environment Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add/Update:
   - `OPENAI_MODEL` = `o1-mini`
   - `OPENAI_FALLBACK_MODEL` = `gpt-4o-mini`
   - `REASONING_EFFORT` = `low`
3. Redeploy for changes to take effect

---

## ✅ Validation Checklist

Before deploying any UCIE changes:

### Code Validation
- [ ] All array accesses use `(array || [])` pattern
- [ ] All object accesses use optional chaining `?.`
- [ ] All fallback values provided with `??` or `||`
- [ ] Error objects returned instead of throwing
- [ ] 3-retry logic with exponential backoff implemented
- [ ] 30-second timeout per GPT call

### Model Validation
- [ ] Using `o1-mini` (NOT `gpt-5-mini` or `gpt-5.1`)
- [ ] Using Responses API with `reasoning: { effort: 'low' }`
- [ ] Using `extractResponseText()` for parsing
- [ ] Using `validateResponseText()` for validation

### Data Flow Validation
- [ ] Gate check enforced (MIN_STORAGE_SUCCESS=2, MIN_DATA_QUALITY=70%)
- [ ] All data stored in Supabase before GPT analysis
- [ ] `formatContextForAI()` used for comprehensive prompts
- [ ] Final output normalized before storage

### Environment Validation
- [ ] `OPENAI_MODEL=o1-mini` in Vercel
- [ ] `OPENAI_FALLBACK_MODEL=gpt-4o-mini` in Vercel
- [ ] `REASONING_EFFORT=low` in Vercel

---

## 📚 Related Documentation

- **UCIE System Steering**: `.kiro/steering/ucie-system.md`
- **OpenAI Integration**: `.kiro/steering/openai-integration.md`
- **Cache Utilities**: `lib/ucie/cacheUtils.ts`
- **Context Aggregator**: `lib/ucie/contextAggregator.ts`
- **Preview Data Endpoint**: `pages/api/ucie/preview-data/[symbol].ts`
- **OpenAI Summary Endpoint**: `pages/api/ucie/openai-summary-start/[symbol].ts`

---

**Status**: ✅ **AUTHORITATIVE GUIDANCE**  
**Version**: 1.0.0  
**Last Updated**: January 2, 2026  
**Owner**: UCIE Development Team

**Follow this document for all UCIE pipeline work. No exceptions.**
