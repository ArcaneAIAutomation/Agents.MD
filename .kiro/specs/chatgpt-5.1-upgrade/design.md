# ChatGPT-5.1 Upgrade Design

## Overview

This document outlines the technical design for upgrading from GPT-4o to ChatGPT-5.1 (gpt-chatgpt-5.1-latest) across the platform. The upgrade focuses on the AI Trade Generation Engine (ATGE) while maintaining backward compatibility and providing easy rollback capabilities.

---

## Architecture Changes

### Current Architecture (GPT-4o)

```
┌─────────────────────────────────────────────────────────────┐
│                    ATGE Trade Generation                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Fetch Market Data (CoinMarketCap, CoinGecko, Kraken)   │
│  2. Calculate Technical Indicators (RSI, MACD, EMA, etc.)   │
│  3. Gather Sentiment Data (LunarCrush, Twitter, Reddit)     │
│  4. Collect On-Chain Data (Blockchain.com, Etherscan)       │
│                                                              │
│  5. Build Comprehensive Context (String formatting)         │
│                                                              │
│  6. Call OpenAI API                                          │
│     ┌──────────────────────────────────────┐               │
│     │ Model: "gpt-4o" (hardcoded)          │               │
│     │ Temperature: 0.5                      │               │
│     │ Response Format: json_object          │               │
│     └──────────────────────────────────────┘               │
│                                                              │
│  7. Parse JSON Response                                      │
│  8. Validate Trade Signal                                    │
│  9. Store in Database (aiModelVersion: "gpt-4o")            │
│                                                              │
│  Fallback: Gemini AI if GPT-4o fails                        │
└─────────────────────────────────────────────────────────────┘
```

### New Architecture (ChatGPT-5.1)

```
┌─────────────────────────────────────────────────────────────┐
│                    ATGE Trade Generation                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Fetch Market Data (CoinMarketCap, CoinGecko, Kraken)   │
│  2. Calculate Technical Indicators (RSI, MACD, EMA, etc.)   │
│  3. Gather Sentiment Data (LunarCrush, Twitter, Reddit)     │
│  4. Collect On-Chain Data (Blockchain.com, Etherscan)       │
│                                                              │
│  5. Build Comprehensive Context (String formatting)         │
│                                                              │
│  6. Call OpenAI API                                          │
│     ┌──────────────────────────────────────┐               │
│     │ Model: process.env.OPENAI_MODEL      │ ← NEW         │
│     │ Default: "gpt-chatgpt-5.1-latest"    │ ← NEW         │
│     │ Temperature: 0.5                      │               │
│     │ Response Format: json_object          │               │
│     └──────────────────────────────────────┘               │
│                                                              │
│  7. Parse JSON Response                                      │
│  8. Validate Trade Signal                                    │
│  9. Store in Database (aiModelVersion: from API)            │ ← NEW
│                                                              │
│  Fallback: Gemini AI if ChatGPT-5.1 fails                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Model Configuration Module

**Location**: `lib/atge/aiGenerator.ts`

**Current Implementation**:
```typescript
body: JSON.stringify({
  model: 'gpt-4o',  // Hardcoded
  messages: [...],
  response_format: { type: 'json_object' },
  temperature: 0.5,
  max_tokens: 1000
})
```

**New Implementation**:
```typescript
// Get model from environment variable with fallback
const MODEL = process.env.OPENAI_MODEL || 'gpt-chatgpt-5.1-latest';

body: JSON.stringify({
  model: MODEL,  // Dynamic from env var
  messages: [...],
  response_format: { type: 'json_object' },
  temperature: 0.5,
  max_tokens: 1000
})
```

**Benefits**:
- ✅ No code changes needed to switch models
- ✅ Easy rollback via environment variable
- ✅ Supports testing different models
- ✅ Maintains backward compatibility

---

### 2. Model Version Tracking

**Location**: `lib/atge/aiGenerator.ts`

**Current Implementation**:
```typescript
return {
  // ... trade signal fields
  aiModelVersion: 'gpt-4o'  // Hardcoded
};
```

**New Implementation**:
```typescript
// Extract actual model from API response
const modelUsed = data.model || MODEL;

return {
  // ... trade signal fields
  aiModelVersion: modelUsed  // Dynamic from API response
};
```

**Benefits**:
- ✅ Accurate tracking of which model generated each trade
- ✅ Supports performance comparison between models
- ✅ Enables filtering and analytics by model version

---

### 3. Environment Variable Configuration

**Location**: `.env.local`

**Current Configuration**:
```bash
OPENAI_MODEL=gpt-4o-2024-08-06
```

**New Configuration**:
```bash
# OpenAI Model Configuration
# Options:
#   - gpt-chatgpt-5.1-latest (recommended - latest ChatGPT model)
#   - gpt-4o (fallback - previous stable model)
OPENAI_MODEL=gpt-chatgpt-5.1-latest
```

**Vercel Environment Variables**:
```
OPENAI_MODEL = gpt-chatgpt-5.1-latest
```

---

### 4. Fallback Strategy

**No changes required** - existing fallback to Gemini AI remains unchanged:

```typescript
try {
  // Try ChatGPT-5.1 first
  const signal = await generateWithGPT4o(context, symbol);
  // Function name stays "generateWithGPT4o" for backward compatibility
  // but now uses ChatGPT-5.1 via OPENAI_MODEL env var
  
  if (validateTradeSignal(signal)) {
    return signal;
  }
} catch (gptError) {
  console.error('[ATGE] ChatGPT-5.1 failed, trying Gemini:', gptError);
  
  // Fallback to Gemini
  const signal = await generateWithGemini(context, symbol);
  
  if (validateTradeSignal(signal)) {
    return signal;
  }
}
```

---

## Data Model Changes

### Database Schema

**No schema changes required** - existing `aiModelVersion` field supports any string value:

```sql
CREATE TABLE atge_trade_signals (
  id UUID PRIMARY KEY,
  -- ... other fields
  ai_model_version VARCHAR(100),  -- Supports "gpt-4o" or "gpt-chatgpt-5.1-latest"
  -- ... other fields
);
```

### Trade Signal Interface

**No interface changes required** - existing TypeScript interface supports any model version:

```typescript
interface TradeSignal {
  // ... other fields
  aiModelVersion: string;  // Can be "gpt-4o" or "gpt-chatgpt-5.1-latest"
  // ... other fields
}
```

---

## API Changes

### OpenAI API Call

**Current**:
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4o',  // Hardcoded
    messages: [...],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 1000
  })
});
```

**New**:
```typescript
const MODEL = process.env.OPENAI_MODEL || 'gpt-chatgpt-5.1-latest';

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: MODEL,  // Dynamic from env var
    messages: [...],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 1000
  })
});

// Extract actual model used from response
const modelUsed = data.model || MODEL;
```

---

## Testing Strategy

### Unit Tests

1. **Model Configuration Test**
   ```typescript
   test('should use OPENAI_MODEL from environment', () => {
     process.env.OPENAI_MODEL = 'gpt-chatgpt-5.1-latest';
     const model = getOpenAIModel();
     expect(model).toBe('gpt-chatgpt-5.1-latest');
   });
   
   test('should default to gpt-chatgpt-5.1-latest', () => {
     delete process.env.OPENAI_MODEL;
     const model = getOpenAIModel();
     expect(model).toBe('gpt-chatgpt-5.1-latest');
   });
   ```

2. **Model Version Tracking Test**
   ```typescript
   test('should store correct model version', async () => {
     const signal = await generateTradeSignal(context);
     expect(signal.aiModelVersion).toBe('gpt-chatgpt-5.1-latest');
   });
   ```

### Integration Tests

1. **End-to-End Trade Generation**
   - Generate trade signal with ChatGPT-5.1
   - Verify JSON structure is valid
   - Verify all fields are populated
   - Verify model version is stored correctly

2. **Fallback Test**
   - Simulate ChatGPT-5.1 failure
   - Verify Gemini AI fallback activates
   - Verify trade signal is still generated

3. **Rollback Test**
   - Set OPENAI_MODEL to "gpt-4o"
   - Generate trade signal
   - Verify GPT-4o is used
   - Verify model version is "gpt-4o"

### Performance Tests

1. **Response Time Comparison**
   - Generate 10 signals with GPT-4o
   - Generate 10 signals with ChatGPT-5.1
   - Compare average response times
   - Verify ChatGPT-5.1 is within acceptable range

2. **Success Rate Comparison**
   - Generate 100 signals with GPT-4o
   - Generate 100 signals with ChatGPT-5.1
   - Compare success rates (valid JSON)
   - Verify ChatGPT-5.1 ≥ 95% success rate

---

## Deployment Plan

### Phase 1: Development Environment (Day 1)

1. Update `.env.local`:
   ```bash
   OPENAI_MODEL=gpt-chatgpt-5.1-latest
   ```

2. Update `lib/atge/aiGenerator.ts`:
   - Replace hardcoded `'gpt-4o'` with `process.env.OPENAI_MODEL || 'gpt-chatgpt-5.1-latest'`
   - Update model version tracking to use API response

3. Test locally:
   - Generate 5 test trade signals
   - Verify all signals are valid
   - Verify model version is stored correctly

### Phase 2: Documentation Updates (Day 1)

1. Update all documentation files:
   - `.kiro/specs/ai-trade-generation-engine/requirements.md`
   - `.kiro/specs/ai-trade-generation-engine/design.md`
   - `ATGE-TRADE-CALCULATION-FLOW.md`
   - `AI-SETUP-GUIDE.md`
   - `.kiro/steering/ucie-system.md`
   - `.kiro/steering/api-integration.md`

2. Update README and setup guides

### Phase 3: Staging Deployment (Day 2)

1. Deploy to Vercel staging environment
2. Set environment variable:
   ```
   OPENAI_MODEL = gpt-chatgpt-5.1-latest
   ```
3. Run integration tests
4. Monitor for 24 hours

### Phase 4: Production Deployment (Day 3)

1. Deploy to Vercel production
2. Set environment variable:
   ```
   OPENAI_MODEL = gpt-chatgpt-5.1-latest
   ```
3. Monitor performance metrics
4. Compare with GPT-4o baseline

### Phase 5: Monitoring (Ongoing)

1. Track success rates by model version
2. Track response times by model version
3. Monitor error rates
4. Collect user feedback

---

## Rollback Plan

If ChatGPT-5.1 has issues:

1. **Immediate Rollback** (< 5 minutes):
   - Update Vercel environment variable:
     ```
     OPENAI_MODEL = gpt-4o
     ```
   - No code deployment needed
   - System automatically uses GPT-4o

2. **Verify Rollback**:
   - Generate test trade signal
   - Verify model version is "gpt-4o"
   - Verify signal quality is acceptable

3. **Investigate Issues**:
   - Review error logs
   - Check API response times
   - Analyze failed signals
   - Contact OpenAI support if needed

---

## Performance Expectations

### Response Time
- **Target**: 3-8 seconds (same as GPT-4o)
- **Maximum**: 10 seconds
- **Fallback**: Activate Gemini if > 10 seconds

### Success Rate
- **Target**: ≥ 95% valid JSON responses
- **Minimum**: ≥ 90% valid JSON responses
- **Fallback**: Activate Gemini if < 90%

### Cost
- **Expected**: Similar to GPT-4o (pay-per-use)
- **Monitor**: Track API usage and costs
- **Alert**: If costs increase > 20%

---

## Security Considerations

### API Key Management
- ✅ API key stored in environment variables (not in code)
- ✅ API key not logged or exposed in responses
- ✅ API key rotated regularly

### Model Version Validation
- ✅ Validate model version from API response
- ✅ Log unexpected model versions
- ✅ Alert if model version changes unexpectedly

### Rate Limiting
- ✅ Existing rate limiting remains in place (60s cooldown, 20 trades/day)
- ✅ Monitor for API rate limit errors
- ✅ Implement exponential backoff if needed

---

## Monitoring and Alerting

### Key Metrics

1. **Model Usage**
   - Count of trades by model version
   - Percentage using ChatGPT-5.1 vs GPT-4o vs Gemini

2. **Performance**
   - Average response time by model
   - 95th percentile response time
   - Success rate by model

3. **Errors**
   - API errors by model
   - JSON parsing errors by model
   - Validation errors by model

### Alerts

1. **Critical**
   - ChatGPT-5.1 success rate < 90%
   - Average response time > 10 seconds
   - API error rate > 10%

2. **Warning**
   - ChatGPT-5.1 success rate < 95%
   - Average response time > 8 seconds
   - API error rate > 5%

---

## Success Criteria

The upgrade is successful when:

1. ✅ 100% of new trades use ChatGPT-5.1 (when OPENAI_MODEL is set)
2. ✅ Success rate ≥ 95% for valid JSON responses
3. ✅ Average response time ≤ 8 seconds
4. ✅ No increase in error rates
5. ✅ Model version correctly stored in database
6. ✅ Rollback capability verified and working
7. ✅ All documentation updated
8. ✅ No user-reported issues after 7 days

---

## References

- OpenAI ChatGPT-5.1 Documentation: https://platform.openai.com/docs/guides/latest-model
- Current Implementation: `lib/atge/aiGenerator.ts`
- ATGE Requirements: `.kiro/specs/ai-trade-generation-engine/requirements.md`
- Environment Variables Guide: `AGENTMDC-VERCEL-SETUP.md`
