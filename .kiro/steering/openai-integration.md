# OpenAI Integration Guide - Bitcoin Sovereign Technology

**Last Updated**: January 1, 2026  
**Status**: ✅ Active - Production Ready  
**Scope**: Cryptocurrency analysis, trade signals, market intelligence  
**Primary API**: Responses API  
**Primary Model**: `o1-mini`

---

## 🎯 Overview

This guide documents OpenAI integration patterns for the Bitcoin Sovereign Technology platform. We use OpenAI's **Responses API** with the `o1-mini` model for cryptocurrency market analysis, trade signal generation, and intelligent data processing.

**Key Principle**: OpenAI is used for **analysis and insights**, not data fetching. Always fetch data first, then analyze with AI.

---

## 📊 Current Implementation Status

### Models in Production

| Model | Use Cases | Status | Performance |
|-------|-----------|--------|-------------|
| `o1-mini` | UCIE modular analysis, news sentiment, trade signals | ✅ Primary | Fast, cost-effective |
| `gpt-4o-mini` | Fallback, legacy endpoints | ✅ Backup | 600-900ms |

### API Pattern

**We use the Responses API with reasoning:**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 0   // We handle retries ourselves
});

// ✅ CORRECT: Use Responses API with reasoning
const completion = await (openai as any).responses.create({
  model: 'o1-mini',
  reasoning: { effort: 'low' },
  input: 'Your prompt here'
});
```

---

## 🚨 Critical Rules

### Rule #1: Data First, AI Second

**NEVER call OpenAI before data is ready.**

```typescript
// ❌ WRONG - AI called before data
const analysis = await openai.responses.create({...});
const marketData = await fetchMarketData(); // Too late!

// ✅ CORRECT - Data first, then AI
const marketData = await fetchMarketData();
const sentiment = await fetchSentiment();
const technical = await fetchTechnical();

// Now call AI with complete context
const analysis = await (openai as any).responses.create({
  model: 'o1-mini',
  reasoning: { effort: 'low' },
  input: `Analyze: ${JSON.stringify({marketData, sentiment, technical})}`
});
```

### Rule #2: Use Utility Functions

**ALWAYS use our bulletproof extraction utilities:**

```typescript
import { extractResponseText, validateResponseText } from '../utils/openai';

const completion = await (openai as any).responses.create({
  model: 'o1-mini',
  reasoning: { effort: 'low' },
  input: prompt
});

// ✅ Bulletproof extraction (handles all edge cases)
const responseText = extractResponseText(completion, true); // true = debug mode
validateResponseText(responseText, 'o1-mini', completion);

// Now parse
const analysis = JSON.parse(responseText);
```

**Why?** These utilities handle:
- Different response formats
- Null content
- Malformed JSON
- Empty responses
- API errors

### Rule #3: UCIE System Integration

**For UCIE features, follow the UCIE system rules:**

1. **AI Analysis Happens LAST** - Only after ALL data cached in database
2. **Database is Source of Truth** - Use `getCachedAnalysis()` and `setCachedAnalysis()`
3. **Data Quality Check** - Minimum 70% quality before AI analysis
4. **Context Aggregation** - Use `getComprehensiveContext()` for AI calls

**See**: `.kiro/steering/ucie-system.md` for complete UCIE documentation.

---

## 🎨 Model Selection Guide

### When to Use `o1-mini`

**Best for:**
- ✅ Fast analysis
- ✅ Modular analysis (market, technical, sentiment)
- ✅ News sentiment classification
- ✅ Cost-effective at scale
- ✅ UCIE modular analysis (9 separate analyses)

**Configuration:**
```typescript
const completion = await (openai as any).responses.create({
  model: 'o1-mini',
  reasoning: { effort: 'low' },
  input: prompt
});
```

### Reasoning Effort Levels

| Effort | Use Cases |
|--------|-----------|
| `low` | Quick analysis, sentiment classification, simple summaries |
| `medium` | Standard analysis, moderate complexity, multi-factor decisions |
| `high` | Deep analysis, strategic recommendations, complex reasoning |

**For UCIE modular analysis, use `low` for speed.**

**⚠️ IMPORTANT**: Valid reasoning effort values are `low`, `medium`, `high` only. The value `minimal` is NOT valid and will cause API errors.

### Fallback Strategy

```typescript
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'o1-mini';
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

try {
  const completion = await (openai as any).responses.create({
    model: OPENAI_MODEL,
    reasoning: { effort: 'low' },
    input: prompt
  });
} catch (error) {
  console.error('Primary model failed, trying fallback...');
  
  // Fallback to Chat Completions API with gpt-4o-mini
  const completion = await openai.chat.completions.create({
    model: OPENAI_FALLBACK_MODEL,
    messages: [{ role: 'user', content: prompt }]
  });
}
```

---

## 💻 Implementation Patterns

### Pattern 1: UCIE Modular Analysis

**Use case**: Analyze specific data source (market, technical, sentiment, news)

```typescript
// pages/api/ucie/openai-summary-start/[symbol].ts

async function analyzeDataSource(
  apiKey: string,
  model: string,
  symbol: string,
  dataType: string,
  data: any,
  instructions: string
): Promise<any> {
  const OpenAI = (await import('openai')).default;
  const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
  
  const openai = new OpenAI({
    apiKey: apiKey,
    timeout: 30000,
    maxRetries: 0
  });
  
  const prompt = `Analyze ${symbol} ${dataType}:

${JSON.stringify(data, null, 2)}

${instructions}

Respond with valid JSON only.`;
  
  // ✅ Use Responses API with low reasoning effort
  const completion = await (openai as any).responses.create({
    model: model,
    reasoning: { effort: process.env.REASONING_EFFORT || 'low' },
    input: `You are a cryptocurrency analyst. Analyze ${dataType} and respond with concise JSON.\n\n${prompt}`
  });
  
  // ✅ Bulletproof extraction
  const analysisText = extractResponseText(completion, true);
  validateResponseText(analysisText, model, completion);
  
  return JSON.parse(analysisText);
}
```

### Pattern 2: News Analysis with Context

**Use case**: Analyze news with market, technical, and sentiment context

```typescript
async function analyzeNewsWithContext(
  apiKey: string,
  model: string,
  symbol: string,
  context: any
): Promise<any> {
  const OpenAI = (await import('openai')).default;
  const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
  
  const openai = new OpenAI({
    apiKey: apiKey,
    timeout: 30000,
    maxRetries: 0
  });
  
  const prompt = `Analyze ${symbol} news articles in the context of current market conditions:

**MARKET CONTEXT:**
- Current Price: ${context.marketContext.currentPrice}
- 24h Change: ${context.marketContext.priceChange24h}

**NEWS ARTICLES:**
${JSON.stringify(context.news?.articles || [], null, 2)}

Provide JSON with sentiment analysis and market impact assessment.`;
  
  // ✅ Use Responses API with low reasoning effort
  const completion = await (openai as any).responses.create({
    model: model,
    reasoning: { effort: process.env.REASONING_EFFORT || 'low' },
    input: `You are a cryptocurrency news analyst. Respond with JSON only.\n\n${prompt}`
  });
  
  const analysisText = extractResponseText(completion, true);
  validateResponseText(analysisText, model, completion);
  
  return JSON.parse(analysisText);
}
```

### Pattern 3: Executive Summary

**Use case**: Synthesize all modular analyses into comprehensive overview

```typescript
async function generateExecutiveSummary(
  apiKey: string,
  model: string,
  symbol: string,
  analysisSummary: any
): Promise<any> {
  const OpenAI = (await import('openai')).default;
  const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
  
  const openai = new OpenAI({
    apiKey: apiKey,
    timeout: 30000,
    maxRetries: 0
  });
  
  const prompt = `Generate executive summary for ${symbol} based on these analyses:

${JSON.stringify(analysisSummary, null, 2)}

Provide JSON with:
{
  "summary": "2-3 paragraph executive summary",
  "confidence": 85,
  "recommendation": "Buy|Hold|Sell with reasoning",
  "key_insights": ["insight 1", "insight 2"],
  "risk_factors": ["risk 1", "risk 2"]
}`;
  
  // ✅ Use Responses API with low reasoning effort
  const completion = await (openai as any).responses.create({
    model: model,
    reasoning: { effort: process.env.REASONING_EFFORT || 'low' },
    input: `You are a cryptocurrency analyst. Synthesize all analyses into comprehensive executive summary. Respond with JSON only.\n\n${prompt}`
  });
  
  const summaryText = extractResponseText(completion, true);
  validateResponseText(summaryText, model, completion);
  
  return JSON.parse(summaryText);
}
```

---

## 🎯 Prompt Engineering Best Practices

### System Instructions in Input

**Include role and format instructions in the input:**

```typescript
// ✅ GOOD - Clear role and expectations in input
const completion = await (openai as any).responses.create({
  model: 'o1-mini',
  reasoning: { effort: 'low' },
  input: `You are a cryptocurrency analyst specializing in Bitcoin. Analyze market data and provide actionable insights. Always respond with valid JSON containing: analysis, confidence, recommendation, risks.

${prompt}`
});
```

### Structured Data

**Structure data clearly in prompts:**

```typescript
// ✅ GOOD - Structured and clear
const prompt = `Analyze Bitcoin market conditions:

MARKET DATA:
- Price: $${price}
- 24h Change: ${change24h}%
- Volume: $${volume}

TECHNICAL INDICATORS:
- RSI: ${rsi}
- MACD: ${macd}
- Trend: ${trend}

TASK: Provide trade recommendation with confidence score and reasoning.

Respond with valid JSON only.`;
```

---

## ⚡ Performance Optimization

### Timeout Configuration

```typescript
// Environment variables
OPENAI_TIMEOUT=30000           // 30 seconds (default)
OPENAI_MODEL=o1-mini           // Primary model (valid: o1-mini, o1-preview)
OPENAI_FALLBACK_MODEL=gpt-4o-mini  // Fallback model
REASONING_EFFORT=low           // Valid values: low, medium, high

// Implementation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
  maxRetries: 0 // We handle retries ourselves
});
```

### Parallel Processing

```typescript
// ✅ GOOD - Analyze multiple sources in parallel
const analyses = await Promise.all([
  analyzeDataSource(apiKey, model, symbol, 'Market', marketData, instructions),
  analyzeDataSource(apiKey, model, symbol, 'Technical', technicalData, instructions),
  analyzeDataSource(apiKey, model, symbol, 'Sentiment', sentimentData, instructions)
]);
```

### Caching Strategy

```typescript
// Cache AI analysis results
await setCachedAnalysis(symbol, 'openai-analysis', result, 3600, 100);
// TTL: 3600 seconds (1 hour)
// Quality: 100 (AI analysis is always high quality)

// Check cache before calling OpenAI
const cached = await getCachedAnalysis(symbol, 'openai-analysis');
if (cached) {
  return cached; // Skip expensive API call
}
```

---

## 🛡️ Error Handling

### Comprehensive Error Handling with Retries

```typescript
async function callOpenAIWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error;
  const model = process.env.OPENAI_MODEL || 'o1-mini';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await (openai as any).responses.create({
        model: model,
        reasoning: { effort: process.env.REASONING_EFFORT || 'low' },
        input: prompt
      });
      
      const responseText = extractResponseText(completion, true);
      validateResponseText(responseText, model, completion);
      
      return JSON.parse(responseText);
      
    } catch (error) {
      lastError = error;
      console.error(`OpenAI attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw error; // Authentication errors
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

### Graceful Degradation

```typescript
try {
  const analysis = await callOpenAI(data);
  return { success: true, analysis };
} catch (error) {
  console.error('OpenAI analysis failed:', error);
  
  // Return error object instead of throwing
  return {
    success: false,
    error: 'Analysis failed',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    data: data,
    message: 'Data available, AI analysis unavailable'
  };
}
```

---

## 📊 Monitoring & Logging

### Request Logging

```typescript
console.log(`🚀 [OpenAI] Starting analysis for ${symbol}`);
console.log(`📊 [OpenAI] Model: ${model}`);
console.log(`📏 [OpenAI] Prompt length: ${prompt.length} characters`);

const startTime = Date.now();
const completion = await (openai as any).responses.create({...});
const duration = Date.now() - startTime;

console.log(`✅ [OpenAI] Completed in ${duration}ms`);
```

---

## 📋 Environment Configuration

### Required Variables

```bash
# .env.local

# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-proj-...

# Model Configuration
# Valid models for Responses API: o1-mini, o1-preview
# Valid fallback models: gpt-4o-mini, gpt-4o
OPENAI_MODEL=o1-mini
OPENAI_FALLBACK_MODEL=gpt-4o-mini

# Reasoning Effort (REQUIRED for Responses API)
# Valid values: low, medium, high
# ⚠️ "minimal" is NOT valid and will cause errors
REASONING_EFFORT=low

# Timeout Configuration
OPENAI_TIMEOUT=30000

# Feature Flags
USE_REAL_AI_ANALYSIS=true
ENABLE_AI_NEWS_ANALYSIS=true
```

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "pages/api/ucie/openai-summary-start/[symbol].ts": {
      "maxDuration": 300,
      "memory": 1024
    }
  }
}
```

---

## 🚀 Deployment Checklist

Before deploying OpenAI features:

- [ ] `OPENAI_API_KEY` set in Vercel environment variables
- [ ] `OPENAI_MODEL=o1-mini` set in Vercel environment variables
- [ ] `OPENAI_FALLBACK_MODEL=gpt-4o-mini` set in Vercel environment variables
- [ ] `REASONING_EFFORT=low` set in Vercel environment variables (valid: low, medium, high)
- [ ] Timeout values appropriate for Vercel plan (30s free, 300s Pro)
- [ ] Error handling implemented with graceful degradation
- [ ] Caching strategy in place to reduce API calls
- [ ] Logging and monitoring configured
- [ ] UCIE system rules followed (if applicable)

---

## 📚 Additional Resources

### Internal Documentation
- **UCIE System**: `.kiro/steering/ucie-system.md`
- **API Integration**: `.kiro/steering/api-integration.md`
- **Utility Functions**: `utils/openai.ts`

### Project Examples
- **UCIE Modular Analysis**: `pages/api/ucie/openai-summary-start/[symbol].ts`

---

**Status**: ✅ Production Ready  
**Last Updated**: January 1, 2026  
**Primary Model**: `o1-mini`  
**Fallback Model**: `gpt-4o-mini`  
**API**: Responses API with `reasoning: { effort: 'low' }`

**⚠️ IMPORTANT MODEL NOTES**:
- Valid Responses API models: `o1-mini`, `o1-preview`
- Valid fallback models: `gpt-4o-mini`, `gpt-4o`
- Valid reasoning effort values: `low`, `medium`, `high`
- **DO NOT USE**: `gpt-5-mini`, `gpt-5.1`, `minimal` (these are fictional/invalid)

**Remember**: Data first, AI second. Always fetch and cache data before calling OpenAI!
