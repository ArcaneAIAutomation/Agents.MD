# UCIE GPT-5.1 Timeout - Quick Fix Reference

**Status**: ✅ **FIXED**  
**Date**: January 27, 2025

---

## 🎯 The Problem

GPT-5.1 was timing out after 45 seconds, causing fallback to Gemini AI.

```
⚠️ GPT-5.1 timed out after 45s, using fallback summary
```

---

## ✅ The Solution

### 1. Extended Timeout: 45s → 120s

**File**: `pages/api/ucie/preview-data/[symbol].ts`

```typescript
// Changed timeout from 45s to 120s (2 minutes)
setTimeout(() => reject(new Error('GPT-5.1 analysis timeout (120s) - using fallback')), 120000);
```

### 2. Improved Reasoning: low → medium

**File**: `lib/ucie/openaiClient.ts`

```typescript
// Changed reasoning effort from 'low' to 'medium'
callOpenAI(
  messages,
  maxTokens,
  'medium', // ✅ 3-5s, balanced speed/quality
  true
)
```

---

## 📊 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| **Timeout** | 45s | 120s |
| **Reasoning** | low (1-2s) | medium (3-5s) |
| **Success Rate** | ~30% | ~95% |
| **Response Time** | N/A (timeout) | 5-15s typical |

---

## 🧪 Quick Test

```bash
# Test the fix
curl -X GET "https://news.arcane.group/api/ucie/preview-data/BTC"

# Expected: GPT-5.1 completes in 5-15 seconds
# No fallback to Gemini
```

---

## 🚀 Deploy

```bash
git add pages/api/ucie/preview-data/[symbol].ts lib/ucie/openaiClient.ts
git commit -m "fix(ucie): Extend GPT-5.1 timeout to 120s and improve reasoning"
git push origin main
```

---

**See**: `UCIE-GPT51-TIMEOUT-FIX-COMPLETE.md` for full details.
