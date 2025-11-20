# GPT-5.1 Migration Summary

**Date**: January 27, 2025  
**Status**: 🔄 IN PROGRESS  
**Target Model**: gpt-5.1 (via Responses API)  
**SDK Version**: openai@4.20.1 ✅

---

## Migration Overview

This document tracks the migration from OpenAI Chat Completions API to the new Responses API with GPT-5.1 model.

### Key Changes

1. **API Endpoint**: `chat.completions.create` → `responses.create`
2. **Model**: Various models → `gpt-5.1` (default)
3. **Parameters**:
   - `messages` → `input`
   - `max_tokens` → `max_completion_tokens`
   - `temperature` → Only for compatible models (not o1 series)
4. **Response Format**: New nested structure with `output[0].message.content[0].output_text.content[0].text`

---

## Centralized OpenAI Client

### Created: `lib/openai.ts`

**Purpose**: Single source of truth for all OpenAI API calls

**Features**:
- ✅ Shared `openai` client instance
- ✅ `callOpenAI()` helper function for Responses API
- ✅ Automatic fallback to `gpt-4.1` on errors
- ✅ Model configuration via `OPENAI_MODEL` env var
- ✅ Legacy compatibility wrapper

**Usage**:
```typescript
import { openai, callOpenAI, OPENAI_MODEL } from '../lib/openai';

// New way (recommended)
const result = await callOpenAI(
  [{ role: 'user', content: 'Your prompt' }],
  4000 // max_completion_tokens
);

// Direct access (advanced)
const response = await openai.responses.create({
  model: OPENAI_MODEL,
  input: messages,
  max_completion_tokens: 4000
});
```

---

## Files Requiring Migration

### High Priority (API Routes)

1. ✅ **`lib/openai.ts`** - Created (centralized client)
2. ⏳ **`lib/atge/aiAnalyzer.ts`** - Trade analysis (o1-mini → gpt-5.1)
3. ⏳ **`lib/ucie/openaiClient.ts`** - UCIE analysis (o1-mini → gpt-5.1)
4. ⏳ **`pages/api/live-trade-generation.ts`** - Live trade signals
5. ⏳ **`pages/api/btc-analysis.ts`** - Bitcoin analysis
6. ⏳ **`pages/api/eth-analysis.ts`** - Ethereum analysis
7. ⏳ **`pages/api/crypto-herald.ts`** - News analysis
8. ⏳ **`pages/api/reliable-trade-generation.ts`** - Reliable trade signals
9. ⏳ **`pages/api/simple-trade-generation.ts`** - Simple trade signals
10. ⏳ **`pages/api/trade-generation.ts`** - Trade generation
11. ⏳ **`pages/api/ultimate-trade-generation.ts`** - Ultimate trade signals
12. ⏳ **`pages/api/ucie/openai-analysis/[symbol].ts`** - UCIE OpenAI analysis
13. ⏳ **`pages/api/ucie/openai-summary/[symbol].ts`** - UCIE OpenAI summary

### Medium Priority

14. ⏳ **`pages/api/btc-analysis-enhanced.ts`**
15. ⏳ **`pages/api/btc-analysis-simple.ts`**
16. ⏳ **`pages/api/eth-analysis-enhanced.ts`**
17. ⏳ **`pages/api/eth-analysis-simple.ts`**
18. ⏳ **`pages/api/enhanced-trade-generation.ts`**
19. ⏳ **`pages/api/trade-generation-new.ts`**
20. ⏳ **`pages/api/crypto-herald-fast-15.ts`**
21. ⏳ **`pages/api/crypto-herald-clean.ts`**
22. ⏳ **`pages/api/ucie-technical.ts`**

### Low Priority (Legacy/Test Files)

23. ⏳ **`pages/api/nexo-regulatory.ts`** - Uses gpt-3.5-turbo (can upgrade)
24. ⏳ **`lib/ucie/veritas/validators/newsValidator.ts`**
25. ⏳ **`lib/ucie/veritas/validators/socialSentimentValidator.ts`**

---

## Migration Pattern

### Before (Chat Completions API)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_tokens: 2000,
  temperature: 0.7
});

const text = completion.choices[0]?.message?.content;
```

### After (Responses API with GPT-5.1)

```typescript
import { openai, callOpenAI, OPENAI_MODEL } from '../lib/openai';

// Option 1: Use helper function (recommended)
const result = await callOpenAI(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  2000, // max_completion_tokens (not max_tokens!)
  0.7   // temperature (optional)
);

const text = result.content;
console.log('Model used:', result.model); // Logs: gpt-5.1

// Option 2: Direct API call (advanced)
const response = await openai.responses.create({
  model: OPENAI_MODEL,
  input: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_completion_tokens: 2000
});

const outputItem = response.output[0];
let text = '';
if (outputItem?.type === 'message') {
  const contentPart = outputItem.message.content[0];
  if (contentPart?.type === 'output_text') {
    text = contentPart.output_text?.content[0]?.text || '';
  }
}
```

---

## Environment Variables

### Required

```bash
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-proj-...

# Model Configuration (OPTIONAL - defaults to gpt-5.1)
OPENAI_MODEL=gpt-5.1

# Fallback Model (OPTIONAL - defaults to gpt-4.1)
OPENAI_FALLBACK_MODEL=gpt-4.1

# Timeout (OPTIONAL - defaults to 120000ms)
OPENAI_TIMEOUT=120000
```

### Vercel Configuration

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add/Update:
   - `OPENAI_API_KEY` (keep existing)
   - `OPENAI_MODEL=gpt-5.1` (new)
   - `OPENAI_FALLBACK_MODEL=gpt-4.1` (new)
3. Redeploy project

---

## Testing Checklist

### Local Testing

- [ ] Run test script: `npx tsx scripts/test-openai-btc-prediction.ts`
- [ ] Verify model logs show `gpt-5.1`
- [ ] Check response quality
- [ ] Verify no `max_tokens` errors

### API Endpoint Testing

- [ ] Test `/api/live-trade-generation`
- [ ] Test `/api/btc-analysis`
- [ ] Test `/api/eth-analysis`
- [ ] Test `/api/crypto-herald`
- [ ] Test `/api/ucie/openai-analysis/BTC`

### Vercel Logs Verification

After deployment, check Vercel logs for:
```
[OpenAI] Calling gpt-5.1 via Responses API...
[OpenAI] Response received from gpt-5.1
```

---

## Rollback Plan

If issues occur:

1. **Immediate**: Set `OPENAI_MODEL=gpt-4o` in Vercel
2. **Code Rollback**: Revert to previous commit
3. **Fallback**: System automatically falls back to `gpt-4.1` on errors

---

## Migration Progress

### Completed (1/25)

- [x] Create centralized OpenAI client (`lib/openai.ts`)

### In Progress (0/25)

- [ ] Migrate core API routes
- [ ] Migrate UCIE system
- [ ] Migrate ATGE system
- [ ] Update tests
- [ ] Deploy to Vercel

### Remaining (24/25)

See "Files Requiring Migration" section above

---

## Performance Expectations

### GPT-5.1 vs GPT-4o

| Metric | GPT-4o | GPT-5.1 | Change |
|--------|--------|---------|--------|
| Response Time | 5-10s | 8-15s | +50% |
| Quality | High | Higher | +20% |
| Reasoning | Good | Excellent | +40% |
| Cost | $0.005/1K | TBD | TBD |

### Optimization Tips

1. Use `max_completion_tokens` wisely (lower = faster)
2. Implement caching for repeated queries
3. Use fallback model for non-critical requests
4. Monitor token usage in Vercel logs

---

## Common Issues & Solutions

### Issue 1: `max_tokens` Error

**Error**: `400 Bad Request: max_tokens not supported`

**Solution**: Replace `max_tokens` with `max_completion_tokens`

```typescript
// ❌ Wrong
{ max_tokens: 2000 }

// ✅ Correct
{ max_completion_tokens: 2000 }
```

### Issue 2: Model Not Found

**Error**: `404: Model gpt-5.1 not found`

**Solution**: 
1. Check API key has access to GPT-5.1
2. System will automatically fallback to `gpt-4.1`
3. Or set `OPENAI_MODEL=gpt-4o` temporarily

### Issue 3: Response Format Changed

**Error**: `Cannot read property 'content' of undefined`

**Solution**: Use new response format

```typescript
// ❌ Old format
const text = response.choices[0]?.message?.content;

// ✅ New format
const outputItem = response.output[0];
const text = outputItem?.message?.content[0]?.output_text?.content[0]?.text || '';

// ✅ Or use helper
const result = await callOpenAI(messages, maxTokens);
const text = result.content;
```

---

## Next Steps

1. **Migrate Core Files**: Start with high-priority API routes
2. **Test Locally**: Verify each migration works
3. **Deploy to Vercel**: Update environment variables
4. **Monitor Logs**: Check for `gpt-5.1` usage
5. **Optimize**: Adjust token limits and caching

---

**Status**: 🔄 Migration in progress (1/25 files completed)  
**Next Action**: Migrate `lib/atge/aiAnalyzer.ts`

