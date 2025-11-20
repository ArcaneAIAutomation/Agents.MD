# GPT-5.1 Migration Progress

**Date**: January 27, 2025  
**Status**: 🔄 IN PROGRESS  
**Completed**: 4/25 files (16%)

---

## ✅ Completed Migrations

### 1. `lib/openai.ts` - Centralized Client ✅
- Created shared OpenAI client
- Implemented `callOpenAI()` helper for Responses API
- Added automatic fallback to gpt-4.1
- Model configuration via environment variables

### 2. `lib/atge/aiAnalyzer.ts` - Trade Analyzer ✅
- Migrated from `chat.completions.create` to `callOpenAI()`
- Changed `max_output_tokens` to `max_completion_tokens`
- Updated response parsing for new format
- Implemented fallback chain

### 3. `lib/ucie/openaiClient.ts` - UCIE Client ✅
- Migrated to Responses API
- Simplified timeout handling
- Updated error handling
- Removed manual fetch calls

### 4. `pages/api/live-trade-generation.ts` - Live Trades ✅
- Migrated to `callOpenAI()`
- Updated imports
- Changed response parsing

---

## 🔄 Next Priority Files

### High Priority API Routes (Need Migration)

1. **`pages/api/btc-analysis.ts`** - Bitcoin analysis
2. **`pages/api/eth-analysis.ts`** - Ethereum analysis  
3. **`pages/api/crypto-herald.ts`** - News analysis
4. **`pages/api/reliable-trade-generation.ts`** - Reliable trades
5. **`pages/api/simple-trade-generation.ts`** - Simple trades
6. **`pages/api/trade-generation.ts`** - Trade generation
7. **`pages/api/ultimate-trade-generation.ts`** - Ultimate trades
8. **`pages/api/ucie/openai-analysis/[symbol].ts`** - UCIE analysis
9. **`pages/api/ucie/openai-summary/[symbol].ts`** - UCIE summary

### Medium Priority

10. **`pages/api/btc-analysis-enhanced.ts`**
11. **`pages/api/btc-analysis-simple.ts`**
12. **`pages/api/eth-analysis-enhanced.ts`**
13. **`pages/api/eth-analysis-simple.ts`**
14. **`pages/api/enhanced-trade-generation.ts`**
15. **`pages/api/trade-generation-new.ts`**
16. **`pages/api/crypto-herald-fast-15.ts`**
17. **`pages/api/crypto-herald-clean.ts`**
18. **`pages/api/ucie-technical.ts`**

### Low Priority

19. **`pages/api/nexo-regulatory.ts`** - Uses gpt-3.5-turbo
20. **`lib/ucie/veritas/validators/newsValidator.ts`**
21. **`lib/ucie/veritas/validators/socialSentimentValidator.ts`**

---

## Migration Pattern Reference

### Before (Old API)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  max_tokens: 2000,
  temperature: 0.7
});

const text = completion.choices[0]?.message?.content;
```

### After (New API)
```typescript
import { callOpenAI, OPENAI_MODEL } from '../../lib/openai';

console.log(`[API] Using model: ${OPENAI_MODEL}`);

const result = await callOpenAI(
  [...messages],
  2000, // max_completion_tokens
  0.7   // temperature
);

const text = result.content;
console.log(`[API] Response from: ${result.model}`);
```

---

## Key Changes Checklist

For each file:
- [ ] Replace `import OpenAI from 'openai'` with `import { callOpenAI, OPENAI_MODEL } from '../../lib/openai'`
- [ ] Remove local `openai` client initialization
- [ ] Replace `openai.chat.completions.create()` with `callOpenAI()`
- [ ] Change `max_tokens` to `max_completion_tokens` (2nd parameter)
- [ ] Update response parsing: `completion.choices[0]?.message?.content` → `result.content`
- [ ] Add model logging: `console.log('Model:', result.model)`
- [ ] Test the endpoint

---

## Environment Variables

### Production (Vercel)
```bash
OPENAI_API_KEY=sk-proj-... (existing)
OPENAI_MODEL=gpt-5.1 (new - add this)
OPENAI_FALLBACK_MODEL=gpt-4.1 (new - add this)
```

### Local (.env.local)
```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5.1
OPENAI_FALLBACK_MODEL=gpt-4.1
```

---

## Testing Commands

```bash
# Test OpenAI integration
npx tsx scripts/test-openai-btc-prediction.ts

# Test specific API endpoint
curl http://localhost:3000/api/live-trade-generation?symbol=BTC

# Check Vercel logs for model usage
vercel logs --follow
```

---

## Deployment Checklist

Before deploying:
- [ ] All files migrated
- [ ] Local testing passed
- [ ] Environment variables set in Vercel
- [ ] No `max_tokens` references remain
- [ ] All imports updated
- [ ] Model logging added

After deploying:
- [ ] Check Vercel logs for "gpt-5.1"
- [ ] Test all API endpoints
- [ ] Monitor for errors
- [ ] Verify response quality

---

**Next Action**: Continue migrating remaining API routes starting with `btc-analysis.ts`

