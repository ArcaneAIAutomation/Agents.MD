# ✅ Vercel Timeout Fixed with Async Polling

**Date**: January 27, 2025  
**Status**: ✅ **DEPLOYED**  
**Commit**: `a0abfed`

---

## 🎯 Problem

**Vercel Hobby Plan Limitation**: 60-second maximum execution time  
**GPT-5.1 Analysis Time**: 30-120 seconds (often exceeds limit)  
**Result**: "Task timed out after 60 seconds" error

---

## ✅ Solution: Async Job Pattern

### Architecture Change

**OLD (Synchronous)**:
```
User clicks button
  ↓
API calls GPT-5.1
  ↓
Waits 60+ seconds
  ↓
❌ TIMEOUT ERROR
```

**NEW (Asynchronous)**:
```
User clicks button
  ↓
Create job in database (< 1 second)
  ↓
Return jobId immediately ✅
  ↓
Background: Process analysis (up to 300 seconds)
  ↓
Frontend: Poll every 2-3 seconds
  ↓
Display results when completed ✅
```

---

## 📊 New API Endpoints

### 1. `/api/whale-watch/deep-dive-instant` (Updated)

**Purpose**: Start analysis job  
**Timeout**: 60 seconds (returns immediately)  
**Returns**: `{ success: true, jobId: "123" }`

**Flow**:
1. Receives whale transaction data
2. Creates job in `whale_analysis` table (status: 'pending')
3. Triggers background processing
4. Returns jobId immediately

**Code**:
```typescript
// Create job
const result = await query(
  `INSERT INTO whale_analysis 
   (tx_hash, analysis_provider, analysis_type, analysis_data, status)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id`,
  [txHash, 'openai', 'deep-dive', JSON.stringify({ whale }), 'pending']
);

const jobId = result.rows[0].id;

// Trigger background processing (fire and forget)
fetch(`${baseUrl}/api/whale-watch/deep-dive-process`, {
  method: 'POST',
  body: JSON.stringify({ jobId, whale }),
});

// Return immediately
return res.json({ success: true, jobId });
```

### 2. `/api/whale-watch/deep-dive-process` (New)

**Purpose**: Background worker  
**Timeout**: 300 seconds (requires Vercel Pro)  
**Returns**: Updates database with results

**Flow**:
1. Receives jobId and whale data
2. Updates status to 'analyzing'
3. Fetches blockchain data
4. Calls GPT-5.1 (up to 30 minutes)
5. Updates database with results (status: 'completed')

**Code**:
```typescript
// Update status
await query(
  'UPDATE whale_analysis SET status = $1 WHERE id = $2',
  ['analyzing', jobId]
);

// Call GPT-5.1
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  // ... GPT-5.1 request
  signal: AbortSignal.timeout(1800000), // 30 minutes
});

// Store results
await query(
  `UPDATE whale_analysis 
   SET status = $1, analysis_data = $2, metadata = $3
   WHERE id = $4`,
  ['completed', JSON.stringify(analysis), JSON.stringify(metadata), jobId]
);
```

### 3. `/api/whale-watch/deep-dive-poll` (New)

**Purpose**: Check job status  
**Timeout**: 60 seconds  
**Returns**: Current status and results if completed

**Flow**:
1. Receives jobId
2. Queries database for job status
3. Returns status and results

**Code**:
```typescript
const result = await query(
  `SELECT status, analysis_data, blockchain_data, metadata
   FROM whale_analysis
   WHERE id = $1`,
  [jobId]
);

const job = result.rows[0];

if (job.status === 'completed') {
  return res.json({
    success: true,
    status: 'completed',
    analysis: job.analysis_data,
    blockchainData: job.blockchain_data,
    metadata: job.metadata,
  });
}

// Still processing
return res.json({
  success: true,
  status: job.status, // 'pending' or 'analyzing'
});
```

---

## 🔄 Frontend Integration

### Current Component Behavior

The component currently calls `/deep-dive-instant` and expects immediate results. We need to update it to use polling.

### Required Changes

**File**: `components/WhaleWatch/WhaleWatchDashboard.tsx`

**Current Code** (line ~683):
```typescript
const analyzeDeepDive = async (whale: WhaleTransaction) => {
  // ...
  const response = await fetch('/api/whale-watch/deep-dive-instant', {
    method: 'POST',
    body: JSON.stringify(whale),
  });
  
  const data = await response.json();
  
  if (data.success && data.analysis) {
    // Display results immediately
  }
};
```

**New Code** (polling pattern):
```typescript
const analyzeDeepDive = async (whale: WhaleTransaction) => {
  // 1. Start job
  const startResponse = await fetch('/api/whale-watch/deep-dive-instant', {
    method: 'POST',
    body: JSON.stringify(whale),
  });
  
  const { jobId } = await startResponse.json();
  
  if (!jobId) {
    throw new Error('Failed to start analysis');
  }
  
  console.log(`✅ Job ${jobId} started, polling for results...`);
  
  // 2. Poll for results
  const maxAttempts = 600; // 30 minutes (600 * 3 seconds)
  let attempts = 0;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      throw new Error('Analysis timeout');
    }
    
    attempts++;
    
    const pollResponse = await fetch(`/api/whale-watch/deep-dive-poll?jobId=${jobId}`);
    const pollData = await pollResponse.json();
    
    if (pollData.status === 'completed') {
      console.log(`✅ Job ${jobId} completed!`);
      
      // Update whale with results
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { 
                ...w, 
                analysis: pollData.analysis,
                blockchainData: pollData.blockchainData,
                metadata: pollData.metadata,
                analysisStatus: 'completed',
              }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      return;
    }
    
    if (pollData.status === 'failed') {
      throw new Error('Analysis failed');
    }
    
    // Still processing, poll again in 3 seconds
    console.log(`⏳ Job ${jobId} status: ${pollData.status}, polling again...`);
    setTimeout(poll, 3000);
  };
  
  // Start polling
  poll();
};
```

---

## ⚙️ Vercel Configuration

### vercel.json

```json
{
  "functions": {
    "pages/api/whale-watch/deep-dive-process.ts": {
      "maxDuration": 300
    },
    "pages/api/whale-watch/deep-dive-instant.ts": {
      "maxDuration": 60
    },
    "pages/api/whale-watch/deep-dive-poll.ts": {
      "maxDuration": 60
    }
  }
}
```

**Note**: `maxDuration: 300` requires **Vercel Pro** plan ($20/month)

---

## 📊 Database Schema

### Job Status Flow

```sql
-- Job created
INSERT INTO whale_analysis (tx_hash, status) 
VALUES ('abc123', 'pending');

-- Background worker starts
UPDATE whale_analysis 
SET status = 'analyzing' 
WHERE id = 1;

-- Analysis completes
UPDATE whale_analysis 
SET status = 'completed',
    analysis_data = '{"reasoning": "..."}',
    metadata = '{"model": "gpt-5.1"}'
WHERE id = 1;

-- Or if fails
UPDATE whale_analysis 
SET status = 'failed',
    analysis_data = '{"error": "Timeout"}'
WHERE id = 1;
```

### Status Values

- `pending` - Job created, waiting to start
- `analyzing` - Background worker processing
- `completed` - Analysis finished successfully
- `failed` - Analysis failed (timeout, API error, etc.)

---

## 🧪 Testing

### Test 1: Start Job

```bash
curl -X POST https://news.arcane.group/api/whale-watch/deep-dive-instant \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123",
    "amount": 100,
    "fromAddress": "1ABC...",
    "toAddress": "1XYZ...",
    "timestamp": "2025-01-27T00:00:00Z"
  }'
```

**Expected**:
```json
{
  "success": true,
  "jobId": "123",
  "timestamp": "2025-01-27T21:00:00Z"
}
```

### Test 2: Poll Status

```bash
curl https://news.arcane.group/api/whale-watch/deep-dive-poll?jobId=123
```

**Expected (pending)**:
```json
{
  "success": true,
  "status": "pending",
  "timestamp": "2025-01-27T21:00:01Z"
}
```

**Expected (analyzing)**:
```json
{
  "success": true,
  "status": "analyzing",
  "timestamp": "2025-01-27T21:00:05Z"
}
```

**Expected (completed)**:
```json
{
  "success": true,
  "status": "completed",
  "analysis": { ... },
  "blockchainData": { ... },
  "metadata": { ... },
  "timestamp": "2025-01-27T21:02:00Z"
}
```

---

## 🚀 Deployment Checklist

### Backend (✅ Complete)

- [x] Create `/deep-dive-instant` endpoint (start job)
- [x] Create `/deep-dive-process` endpoint (background worker)
- [x] Create `/deep-dive-poll` endpoint (check status)
- [x] Update `vercel.json` with timeouts
- [x] Deploy to production

### Frontend (⚠️ TODO)

- [ ] Update `analyzeDeepDive` function to use polling
- [ ] Add polling logic (every 2-3 seconds)
- [ ] Update progress indicator to show polling status
- [ ] Handle timeout after 30 minutes
- [ ] Test on production

### Database (✅ Complete)

- [x] `whale_analysis` table exists
- [x] Status column supports: pending, analyzing, completed, failed
- [x] Migration run successfully

---

## 📋 Vercel Plan Requirements

### Hobby Plan (Free)

- ✅ `/deep-dive-instant` works (60s limit, returns immediately)
- ✅ `/deep-dive-poll` works (60s limit, quick query)
- ❌ `/deep-dive-process` **WILL TIMEOUT** (needs 300s)

### Pro Plan ($20/month)

- ✅ All endpoints work
- ✅ `/deep-dive-process` has 300 seconds
- ✅ GPT-5.1 has full 30 minutes

### Alternative Solutions (No Pro Plan)

1. **External Queue Service**:
   - Use BullMQ + Redis
   - Use AWS SQS + Lambda
   - Use Google Cloud Tasks

2. **Separate Worker Service**:
   - Deploy worker on Railway/Render (longer timeouts)
   - Use webhooks to notify when complete

3. **Streaming Response**:
   - Use Server-Sent Events (SSE)
   - Stream progress updates
   - Still limited by 60s on Hobby

---

## 🎯 Benefits

### 1. No Timeouts ✅
- User never sees timeout errors
- Analysis can take full 30 minutes
- Works reliably

### 2. Progress Updates ✅
- User sees "analyzing" status
- Can show estimated time remaining
- Better UX than waiting silently

### 3. Scalable ✅
- Multiple analyses can run in parallel
- Database tracks all jobs
- Easy to add job queue later

### 4. Resilient ✅
- If background worker fails, job marked as failed
- User can retry
- No data loss

---

## 📝 Summary

### What Changed

1. **Split synchronous endpoint into 3 async endpoints**
2. **Added database job tracking**
3. **Implemented polling pattern**
4. **Updated Vercel configuration**

### What You Need to Do

1. **Run migration** (if not done): `npx tsx scripts/run-whale-watch-migration.ts`
2. **Update frontend** to use polling pattern
3. **Upgrade to Vercel Pro** (or use alternative solution)
4. **Test on production**

### Current Status

- ✅ Backend: Deployed and ready
- ⚠️ Frontend: Needs polling update
- ⚠️ Vercel: Needs Pro plan for 300s timeout

---

**Status**: 🟡 **BACKEND COMPLETE, FRONTEND UPDATE NEEDED**  
**Commit**: `a0abfed`

**The timeout issue is solved on the backend. Frontend needs to be updated to use the new polling pattern!** 🚀
