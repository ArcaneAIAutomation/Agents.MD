# UCIE OpenAI Summary - Async Pattern Quick Reference

**Pattern**: Whale Watch Deep Dive (3-second polling, 30-minute timeout)

---

## 🚀 Quick Start

### 1. Start Analysis (Instant)

```typescript
POST /api/ucie/openai-summary-start/BTC

Response (< 1 second):
{
  "success": true,
  "jobId": 123,
  "status": "queued"
}
```

### 2. Poll for Results (Every 3 seconds)

```typescript
GET /api/ucie/openai-summary-poll/123

Response (processing):
{
  "success": true,
  "status": "processing",
  "progress": "Analyzing market data...",
  "elapsedTime": 45
}

Response (complete):
{
  "success": true,
  "status": "completed",
  "result": "{\"summary\":\"...\",\"confidence\":85}",
  "elapsedTime": 120
}
```

---

## ⏱️ Timing

- **Polling Interval**: 3 seconds
- **Max Attempts**: 600 (30 minutes total)
- **Calculation**: 600 × 3s = 1800s = 30 minutes

---

## 📊 Status Flow

```
queued → processing → completed
                   ↘ error
```

---

## 🔧 Frontend Hook

```typescript
const { status, result, error, progress, elapsedTime, startAnalysis } = useOpenAISummary('BTC');

// status: 'idle' | 'starting' | 'polling' | 'completed' | 'error'
// result: Parsed JSON analysis
// error: Error message if failed
// progress: Current stage description
// elapsedTime: Seconds since start
// startAnalysis: Function to trigger analysis
```

---

## 📁 Files

- **Start**: `pages/api/ucie/openai-summary-start/[symbol].ts`
- **Poll**: `pages/api/ucie/openai-summary-poll/[jobId].ts`
- **Database**: `ucie_openai_jobs` table
- **Documentation**: `UCIE-OPENAI-SUMMARY-ASYNC-COMPLETE.md`

---

## ✅ Key Features

- ✅ No Vercel timeout (60s limit bypassed)
- ✅ 30-minute maximum analysis time
- ✅ Real-time progress tracking
- ✅ Multiple concurrent jobs
- ✅ Optional authentication
- ✅ Robust error handling
- ✅ Matches Whale Watch pattern (proven)

---

**Status**: 🟢 Ready for Production
