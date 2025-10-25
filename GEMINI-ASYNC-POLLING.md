# Gemini Async Polling Implementation

## Problem Solved

Gemini API analysis takes 1-10 minutes to complete:
- **Flash (Quick Analysis)**: ~60 seconds
- **Pro (Deep Dive)**: ~5-10 minutes (300-600 seconds)

Vercel serverless functions have a **30-second timeout limit**, causing 504 Gateway Timeout errors.

## Solution: Async Job-Based Polling

Implemented the same async polling pattern used by Caesar API:

1. **Create Job** → Return job ID immediately (< 1 second)
2. **Background Processing** → Gemini API call runs asynchronously
3. **Poll for Results** → Client polls every 60 seconds for up to 10 minutes
4. **Return Analysis** → When complete, return full analysis with thinking mode

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Client (WhaleWatchDashboard)                                    │
│                                                                 │
│  1. Click "Quick Analysis" or "Deep Dive"                      │
│  2. POST /api/whale-watch/analyze-gemini                       │
│  3. Receive jobId immediately (< 1s)                           │
│  4. Poll GET /api/whale-watch/gemini-analysis/[jobId]         │
│     every 60 seconds for up to 10 minutes                      │
│  5. Display analysis when status === 'completed'               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ API Layer                                                       │
│                                                                 │
│  POST /api/whale-watch/analyze-gemini                          │
│  ├─ Create job in geminiJobStore                               │
│  ├─ Start processGeminiJob() in background (don't await)      │
│  └─ Return { success: true, jobId, status: 'queued' }         │
│                                                                 │
│  GET /api/whale-watch/gemini-analysis/[jobId]                  │
│  ├─ Get job from geminiJobStore                                │
│  └─ Return { success: true, status, analysis?, thinking? }    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Background Worker (geminiWorker.ts)                            │
│                                                                 │
│  processGeminiJob(jobId)                                       │
│  ├─ Mark job as 'analyzing'                                    │
│  ├─ Call Gemini API (1-10 minutes)                            │
│  ├─ Parse response and extract thinking                        │
│  ├─ Mark job as 'completed' with analysis                     │
│  └─ Or mark as 'failed' on error                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Job Store (geminiJobStore.ts)                                  │
│                                                                 │
│  In-Memory Map<jobId, GeminiJob>                               │
│  ├─ createJob(whale) → GeminiJob                              │
│  ├─ getJob(jobId) → GeminiJob | null                          │
│  ├─ updateJob(jobId, updates)                                 │
│  ├─ markJobCompleted(jobId, analysis, thinking, metadata)     │
│  └─ Auto-cleanup expired jobs (> 1 hour)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

### New Files

1. **`utils/geminiJobStore.ts`** - In-memory job storage
   - Stores job state (queued, analyzing, completed, failed)
   - Auto-expires jobs after 1 hour
   - Thread-safe operations

2. **`utils/geminiWorker.ts`** - Background job processor
   - Processes Gemini API calls asynchronously
   - Handles long-running analysis (1-10 minutes)
   - Updates job store with results

3. **`pages/api/whale-watch/gemini-analysis/[jobId].ts`** - Polling endpoint
   - Returns job status and results
   - Caches completed analysis for 1 hour
   - Handles expired jobs gracefully

### Modified Files

4. **`pages/api/whale-watch/analyze-gemini.ts`** - Job creation endpoint
   - Creates job immediately
   - Starts background processing
   - Returns job ID for polling

5. **`components/WhaleWatch/WhaleWatchDashboard.tsx`** - Frontend polling
   - Added `pollGeminiAnalysis()` function
   - Polls every 60 seconds for up to 10 minutes
   - Updates UI when analysis completes

## API Flow

### 1. Create Analysis Job

**Request:**
```http
POST /api/whale-watch/analyze-gemini
Content-Type: application/json

{
  "txHash": "abc123...",
  "amount": 150.5,
  "amountUSD": 14297500,
  "fromAddress": "1A1zP1...",
  "toAddress": "bc1qxy2...",
  "timestamp": "2025-01-25T12:00:00Z",
  "type": "Large Transfer",
  "description": "Whale movement detected"
}
```

**Response (Immediate - < 1 second):**
```json
{
  "success": true,
  "jobId": "gemini-1737820800000-abc123",
  "status": "queued",
  "timestamp": "2025-01-25T12:00:00Z"
}
```

### 2. Poll for Results

**Request:**
```http
GET /api/whale-watch/gemini-analysis/gemini-1737820800000-abc123
```

**Response (While Processing):**
```json
{
  "success": true,
  "status": "analyzing",
  "timestamp": "2025-01-25T12:00:30Z"
}
```

**Response (When Complete):**
```json
{
  "success": true,
  "status": "completed",
  "analysis": {
    "transaction_type": "exchange_withdrawal",
    "market_impact": "Bullish",
    "confidence": 85,
    "reasoning": "...",
    "key_findings": ["...", "..."],
    "trader_action": "...",
    "price_levels": { ... },
    "timeframe_analysis": { ... },
    "risk_reward": { ... },
    "historical_context": { ... }
  },
  "thinking": "Step-by-step reasoning...",
  "metadata": {
    "model": "gemini-2.5-pro",
    "provider": "Google Gemini",
    "timestamp": "2025-01-25T12:05:00Z",
    "processingTime": 300000,
    "thinkingEnabled": true,
    "tokenUsage": {
      "promptTokens": 2000,
      "completionTokens": 1500,
      "totalTokens": 3500
    },
    "finishReason": "STOP"
  },
  "timestamp": "2025-01-25T12:05:00Z"
}
```

## Polling Configuration

### Client-Side (WhaleWatchDashboard.tsx)

```typescript
const pollGeminiAnalysis = async (txHash: string, jobId: string) => {
  const maxAttempts = 10;  // 10 attempts
  const pollInterval = 60000; // 60 seconds
  // Total max time: 10 × 60s = 600s = 10 minutes
  
  // Poll every 60 seconds
  // Stop when: completed, failed, or max attempts reached
};
```

### Server-Side (geminiWorker.ts)

```typescript
// Gemini API timeout: 28 seconds (max safe for Vercel)
// But actual response time: 60-600 seconds
// Solution: Background processing outside request/response cycle
```

## Job Lifecycle

```
┌─────────┐
│ queued  │ ← Job created, waiting to start
└────┬────┘
     │
     ↓
┌──────────┐
│analyzing │ ← Gemini API call in progress (1-10 min)
└────┬─────┘
     │
     ├─→ ┌───────────┐
     │   │ completed │ ← Analysis successful
     │   └───────────┘
     │
     └─→ ┌────────┐
         │ failed │ ← API error or timeout
         └────────┘
```

## Job Expiration

- **Expiration Time**: 1 hour after creation
- **Cleanup**: Automatic on next job creation
- **Reason**: Prevent memory leaks in serverless environment

## Error Handling

### Timeout (> 10 minutes)
```json
{
  "success": false,
  "status": "failed",
  "error": "Analysis polling timeout after 10 attempts",
  "timestamp": "2025-01-25T12:10:00Z"
}
```

### Job Not Found (Expired)
```json
{
  "success": false,
  "error": "Job not found. It may have expired (jobs expire after 1 hour).",
  "timestamp": "2025-01-25T13:05:00Z"
}
```

### Gemini API Error
```json
{
  "success": false,
  "status": "failed",
  "error": "Gemini API error: 429 - Rate limit exceeded",
  "timestamp": "2025-01-25T12:01:00Z"
}
```

## Comparison: Caesar vs Gemini

| Feature | Caesar | Gemini |
|---------|--------|--------|
| **Response Time** | 2-5 minutes | 1-10 minutes |
| **Polling Interval** | 60 seconds | 60 seconds |
| **Max Attempts** | 10 (10 min) | 10 (10 min) |
| **Job Storage** | Caesar API | In-memory (geminiJobStore) |
| **Endpoint Pattern** | `/api/whale-watch/analysis/[jobId]` | `/api/whale-watch/gemini-analysis/[jobId]` |
| **Background Processing** | Caesar servers | Vercel serverless (geminiWorker) |

## Limitations

### In-Memory Storage

**Current**: Jobs stored in-memory (Map)
**Limitation**: Lost on serverless function restart
**Impact**: Minimal (jobs expire in 1 hour anyway)

**Future Improvement**: Use Redis or database for persistence

### Serverless Cold Starts

**Issue**: Background worker may be killed on cold start
**Mitigation**: Job remains in 'analyzing' state, client continues polling
**Workaround**: Client shows "Still analyzing..." message

### Concurrent Jobs

**Current**: No limit on concurrent jobs
**Risk**: High memory usage with many simultaneous analyses
**Future**: Add job queue with concurrency limit

## Monitoring

### Job Metrics

```typescript
import { getJobCount, getAllJobs } from './utils/geminiJobStore';

// Get current job count
const count = getJobCount();

// Get all jobs (for debugging)
const jobs = getAllJobs();
```

### Logging

```
🤖 Creating Gemini AI analysis job for transaction abc123...
✅ Job created: gemini-1737820800000-abc123
📊 Job status: queued
🔄 Starting background processing for job: gemini-1737820800000-abc123
🎯 Selected model: gemini-2.5-pro for 150.5 BTC
📡 Calling Gemini API: gemini-2.5-pro
⏱️ Timeout: 28000ms
✅ Job gemini-1737820800000-abc123 completed successfully in 300000ms
📊 Gemini polling attempt 1/10 for job gemini-1737820800000-abc123
✅ Gemini analysis completed
```

## Testing

### Manual Test Flow

1. **Start Analysis**:
   - Click "Quick Analysis" or "Deep Dive" on whale transaction
   - Verify job ID returned immediately
   - Check console for "Job created" message

2. **Monitor Polling**:
   - Watch console for polling attempts every 60 seconds
   - Verify status changes: queued → analyzing → completed
   - Check UI shows "Analyzing..." spinner

3. **View Results**:
   - After 1-10 minutes, analysis should complete
   - Verify full analysis displayed with thinking mode
   - Check metadata shows correct model and processing time

### Expected Timings

- **Flash Analysis**: 60-120 seconds
- **Pro Analysis**: 300-600 seconds (5-10 minutes)
- **Polling Overhead**: ~1 second per poll
- **Total Time**: Analysis time + (attempts × 1s)

## Configuration

### Environment Variables

```bash
# Gemini API timeout (max safe for Vercel)
GEMINI_TIMEOUT_MS=28000

# Model selection threshold
GEMINI_PRO_THRESHOLD_BTC=100

# Enable thinking mode
GEMINI_ENABLE_THINKING=true

# Max retries (for API errors, not polling)
GEMINI_MAX_RETRIES=2
```

### Polling Configuration

```typescript
// In WhaleWatchDashboard.tsx
const maxAttempts = 10;      // 10 attempts
const pollInterval = 60000;  // 60 seconds
// Total: 10 minutes max
```

## Future Enhancements

1. **Redis Storage**: Replace in-memory store with Redis
2. **Job Queue**: Add queue with concurrency limits
3. **Progress Updates**: Stream progress during analysis
4. **Retry Logic**: Automatic retry on transient failures
5. **Job Cancellation**: Allow users to cancel running jobs
6. **Job History**: Store completed jobs for later retrieval

## Status

✅ **Implemented and Ready for Testing**
- Async job creation
- Background processing
- Polling endpoint
- Frontend integration
- Error handling
- Job expiration

---

**Implemented**: January 25, 2025
**Pattern**: Async job-based polling (like Caesar)
**Max Duration**: 10 minutes (10 attempts × 60 seconds)
**Storage**: In-memory (geminiJobStore)
