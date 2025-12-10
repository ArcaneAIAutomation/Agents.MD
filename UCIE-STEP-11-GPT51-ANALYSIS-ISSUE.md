# UCIE Step 11: GPT-5.1 Analysis Issue

**Date**: December 10, 2025  
**Status**: ⚠️ **BLOCKED** - Async processing stuck  
**Job ID**: 73  
**Symbol**: BTC

---

## Issue Summary

The GPT-5.1 analysis job (ID: 73) is stuck in "processing" status for over 3 minutes with no progress updates.

### Symptoms

1. **Status**: Stuck at "processing" 
2. **Progress**: "Analyzing market data..." (first step)
3. **Elapsed Time**: 201+ seconds (over 3 minutes)
4. **Last Update**: 2025-12-10T21:55:22.823Z (no updates since)

### Root Cause Analysis

**Problem**: The async processing function (`processJobAsync`) is likely hitting Vercel's function timeout or crashing silently.

**Evidence**:
1. Job status hasn't changed from "processing" in 3+ minutes
2. Progress message stuck on first step ("Analyzing market data...")
3. Timestamp not updating (suggests function stopped executing)
4. No error status in database (suggests timeout, not caught exception)

### Technical Details

**File**: `pages/api/ucie/openai-summary-start/[symbol].ts`

**Processing Flow**:
```typescript
// 1. Job created with status "queued"
const jobId = result.rows[0].id;

// 2. Async processing started (fire-and-forget)
processJobAsync(jobId, symbolUpper, collectedData, context).catch(err => {
  console.error(`❌ Job ${jobId} processing failed:`, err);
});

// 3. Response returned immediately
return res.status(200).json({ jobId, status: 'queued' });
```

**Async Processing Steps**:
```typescript
async function processJobAsync(jobId, symbol, collectedData, context) {
  // Update status to "processing"
  await query('UPDATE ucie_openai_jobs SET status = $1...', ['processing']);
  
  // STEP 1: Analyze Market Data (STUCK HERE)
  modularAnalysis.marketAnalysis = await analyzeDataSource(...);
  
  // STEP 2-8: Other analyses (never reached)
  // ...
}
```

**analyzeDataSource Implementation**:
```typescript
async function analyzeDataSource(...) {
  // 30-second timeout per data source
  const timeoutMs = 30000;
  
  // Standard Chat Completions API (not Responses API)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model, // 'gpt-5.1'
      messages: [...],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    }),
    signal: controller.signal
  });
}
```

### Potential Issues

1. **Vercel Function Timeout**:
   - Default: 10 seconds (Hobby plan)
   - Pro: 60 seconds (configured in vercel.json)
   - Max: 900 seconds (15 minutes, Pro plan)
   - **Current**: Likely hitting 60-second timeout

2. **OpenAI API Issues**:
   - Model `gpt-5.1` might not exist or require different API
   - Should use Responses API with `reasoning` parameter
   - Standard Chat Completions might not support `gpt-5.1`

3. **Silent Failure**:
   - Async function crashes without updating database
   - No error logged because function times out
   - Job stuck in "processing" forever

4. **Database Connection**:
   - Async function might lose database connection
   - Progress updates fail silently
   - Job status never updates

---

## Recommended Fixes

### Fix 1: Increase Vercel Timeout (Immediate)

**File**: `vercel.json`

```json
{
  "functions": {
    "pages/api/ucie/openai-summary-start/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

### Fix 2: Use Correct GPT-5.1 API (Critical)

**File**: `pages/api/ucie/openai-summary-start/[symbol].ts`

```typescript
// ❌ WRONG: Standard Chat Completions
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  body: JSON.stringify({
    model: 'gpt-5.1',
    messages: [...]
  })
});

// ✅ CORRECT: Use OpenAI SDK with Responses API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

const completion = await openai.chat.completions.create({
  model: 'gpt-5.1',
  messages: [...],
  reasoning: {
    effort: 'low' // Fast analysis for modular approach
  },
  temperature: 0.7,
  max_tokens: 800,
  response_format: { type: 'json_object' }
});

const responseText = extractResponseText(completion, true);
```

### Fix 3: Add Comprehensive Error Handling

```typescript
async function processJobAsync(jobId, symbol, collectedData, context) {
  try {
    // Update status to processing
    await query('UPDATE ucie_openai_jobs SET status = $1...', ['processing']);
    
    // Process with timeout protection
    const processingPromise = performModularAnalysis(...);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Processing timeout')), 240000) // 4 minutes
    );
    
    const result = await Promise.race([processingPromise, timeoutPromise]);
    
    // Update with success
    await query('UPDATE ucie_openai_jobs SET status = $1, result = $2...', 
      ['completed', JSON.stringify(result)]);
    
  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    
    // Update with error
    await query('UPDATE ucie_openai_jobs SET status = $1, error = $2...', 
      ['error', error.message]);
  }
}
```

### Fix 4: Add Progress Heartbeat

```typescript
// Update progress every 10 seconds to show job is alive
let progressInterval: NodeJS.Timeout;

try {
  progressInterval = setInterval(async () => {
    await query('UPDATE ucie_openai_jobs SET updated_at = NOW() WHERE id = $1', [jobId]);
  }, 10000);
  
  // Process job...
  
} finally {
  if (progressInterval) clearInterval(progressInterval);
}
```

---

## Testing Plan

### Test 1: Check Vercel Logs

1. Go to Vercel Dashboard → Deployments
2. Click latest deployment → Functions
3. Find `/api/ucie/openai-summary-start/BTC` function
4. Check logs for errors or timeouts

### Test 2: Test with Shorter Timeout

```typescript
// Temporarily reduce timeout to test error handling
const timeoutMs = 5000; // 5 seconds (should fail fast)
```

### Test 3: Test with GPT-4o Fallback

```typescript
// Use working model to isolate GPT-5.1 issue
const model = 'gpt-4o'; // Instead of 'gpt-5.1'
```

### Test 4: Manual Database Check

```sql
-- Check job status directly
SELECT id, symbol, status, progress, error, created_at, updated_at
FROM ucie_openai_jobs
WHERE id = 73;

-- Check if job is truly stuck
SELECT 
  id, 
  status, 
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM ucie_openai_jobs
WHERE id = 73;
```

---

## Next Steps

1. **Immediate**: Check Vercel logs for actual error
2. **Short-term**: Implement Fix 2 (correct GPT-5.1 API usage)
3. **Medium-term**: Implement Fix 3 (error handling) and Fix 4 (heartbeat)
4. **Long-term**: Consider using background job queue (Bull, BullMQ)

---

## Alternative Approach: Use GPT-4o for Now

Since GPT-5.1 might require special API access, we can:

1. **Fallback to GPT-4o**: Use proven working model
2. **Test modular analysis**: Verify the approach works
3. **Upgrade to GPT-5.1**: Once API access is confirmed

```typescript
// Temporary fallback
const model = process.env.OPENAI_GPT51_ENABLED === 'true' ? 'gpt-5.1' : 'gpt-4o';
```

---

**Status**: ⚠️ **INVESTIGATION REQUIRED**  
**Priority**: **HIGH** - Blocking UCIE completion  
**Estimated Fix Time**: 2-4 hours

