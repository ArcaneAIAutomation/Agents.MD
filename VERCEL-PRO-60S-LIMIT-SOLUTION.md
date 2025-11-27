# Vercel Pro 60-Second Limit - UCIE Solution

**Date**: November 27, 2025  
**Status**: 🚨 **CRITICAL CORRECTION**  
**Priority**: **MAXIMUM**

---

## 🚨 Critical Discovery

**Vercel Pro Limit**: **60 seconds maximum** for Node.js Serverless Functions  
**NOT 900 seconds** as initially assumed

### Vercel Plan Limits

| Plan | Max Duration | Cost |
|------|--------------|------|
| **Hobby** | 10 seconds | Free |
| **Pro** | **60 seconds** | $20/month |
| **Enterprise** | 900 seconds (15 min) | Custom pricing |

**Source**: https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration

---

## ❌ Why Previous Approach Failed

### The Problem
```json
{
  "functions": {
    "pages/api/ucie/**/*.ts": {
      "maxDuration": 900  // ❌ INVALID for Pro plan
    }
  }
}
```

**Error**: "Set the value ≤ 60 seconds for Node Serverless Functions on Pro"

### UCIE Requirements
- Phase 1-3: Data Collection (8-10 minutes)
- Phase 4: AI Analysis (3-5 minutes)
- **Total**: 11-16 minutes

**60 seconds is NOT enough for synchronous execution!**

---

## ✅ Solution: Async Polling Pattern

### Architecture Overview

Instead of one long-running function, we split UCIE into:

1. **Start Endpoint** (< 60s): Initiates data collection, returns job ID
2. **Background Processing**: Continues in database/queue
3. **Poll Endpoint** (< 10s): Checks job status
4. **Result Endpoint** (< 10s): Returns completed analysis

### Implementation Pattern

```typescript
// 1. START: Initiate UCIE analysis
POST /api/ucie/start/[symbol]
→ Returns: { jobId, status: 'started' }
→ Duration: < 5 seconds

// 2. POLL: Check progress
GET /api/ucie/status/[jobId]
→ Returns: { status: 'processing', progress: 45% }
→ Duration: < 2 seconds
→ Client polls every 3-5 seconds

// 3. RESULT: Get completed analysis
GET /api/ucie/result/[jobId]
→ Returns: { status: 'completed', data: {...} }
→ Duration: < 5 seconds
```

---

## 🔧 Implementation Strategy

### Option 1: Database-Backed Queue (Recommended)

**Use existing Supabase database as job queue**

```typescript
// Table: ucie_jobs
CREATE TABLE ucie_jobs (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10),
  status VARCHAR(20), -- 'queued', 'processing', 'completed', 'failed'
  progress INTEGER,   -- 0-100
  phase VARCHAR(50),  -- 'market-data', 'sentiment', 'ai-analysis'
  result JSONB,
  error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);

// Workflow:
// 1. /api/ucie/start → Insert job with status='queued'
// 2. Cron job processes queue every minute
// 3. /api/ucie/status → Read job status
// 4. /api/ucie/result → Read completed result
```

**Advantages**:
- ✅ No additional infrastructure
- ✅ Uses existing database
- ✅ Simple to implement
- ✅ Reliable and persistent

**Disadvantages**:
- ⚠️ Cron jobs run every minute (not real-time)
- ⚠️ Requires polling from client

### Option 2: Vercel Cron + Database

**Use Vercel Cron to process UCIE jobs**

```typescript
// pages/api/cron/process-ucie-jobs.ts
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get pending jobs
  const jobs = await query(
    'SELECT * FROM ucie_jobs WHERE status = $1 LIMIT 5',
    ['queued']
  );
  
  // Process each job (within 60s limit)
  for (const job of jobs) {
    await processUCIEJob(job);
  }
  
  return res.json({ processed: jobs.length });
}

// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-ucie-jobs",
      "schedule": "* * * * *"  // Every minute
    }
  ]
}
```

**Advantages**:
- ✅ Automated processing
- ✅ No manual triggers needed
- ✅ Scales with job queue

**Disadvantages**:
- ⚠️ Limited to 60s per cron execution
- ⚠️ Must process jobs in chunks

### Option 3: External Queue Service

**Use external service like Upstash QStash or AWS SQS**

**Advantages**:
- ✅ True background processing
- ✅ No time limits
- ✅ Scalable

**Disadvantages**:
- ❌ Additional cost
- ❌ More complex setup
- ❌ External dependency

---

## 📋 Recommended Implementation

### Phase 1: Quick Fix (Database + Cron)

**Implement async polling with existing infrastructure**

#### 1. Create Job Table

```sql
-- migrations/ucie_jobs.sql
CREATE TABLE IF NOT EXISTS ucie_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  phase VARCHAR(50),
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_ucie_jobs_status ON ucie_jobs(status);
CREATE INDEX idx_ucie_jobs_symbol ON ucie_jobs(symbol);
CREATE INDEX idx_ucie_jobs_created ON ucie_jobs(created_at);
```

#### 2. Start Endpoint

```typescript
// pages/api/ucie/start/[symbol].ts
export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // Create job
  const job = await queryOne(
    `INSERT INTO ucie_jobs (symbol, status, phase) 
     VALUES ($1, $2, $3) 
     RETURNING id, status, created_at`,
    [symbol.toUpperCase(), 'queued', 'initializing']
  );
  
  return res.json({
    success: true,
    jobId: job.id,
    status: job.status,
    message: 'UCIE analysis started. Poll /api/ucie/status/{jobId} for progress.'
  });
}

export const config = { maxDuration: 10 };
```

#### 3. Status Endpoint

```typescript
// pages/api/ucie/status/[jobId].ts
export default async function handler(req, res) {
  const { jobId } = req.query;
  
  const job = await queryOne(
    'SELECT id, symbol, status, progress, phase, error, created_at, updated_at FROM ucie_jobs WHERE id = $1',
    [jobId]
  );
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  return res.json({
    jobId: job.id,
    symbol: job.symbol,
    status: job.status,
    progress: job.progress,
    phase: job.phase,
    error: job.error,
    createdAt: job.created_at,
    updatedAt: job.updated_at
  });
}

export const config = { maxDuration: 5 };
```

#### 4. Result Endpoint

```typescript
// pages/api/ucie/result/[jobId].ts
export default async function handler(req, res) {
  const { jobId } = req.query;
  
  const job = await queryOne(
    'SELECT * FROM ucie_jobs WHERE id = $1',
    [jobId]
  );
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(202).json({
      message: 'Analysis not yet complete',
      status: job.status,
      progress: job.progress
    });
  }
  
  return res.json({
    success: true,
    jobId: job.id,
    symbol: job.symbol,
    status: job.status,
    result: job.result,
    completedAt: job.completed_at
  });
}

export const config = { maxDuration: 10 };
```

#### 5. Cron Processor

```typescript
// pages/api/cron/process-ucie-jobs.ts
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get next queued job
  const job = await queryOne(
    `UPDATE ucie_jobs 
     SET status = 'processing', updated_at = NOW() 
     WHERE id = (
       SELECT id FROM ucie_jobs 
       WHERE status = 'queued' 
       ORDER BY created_at ASC 
       LIMIT 1
     ) 
     RETURNING *`
  );
  
  if (!job) {
    return res.json({ message: 'No jobs to process' });
  }
  
  try {
    // Process job in phases (within 60s limit)
    await processUCIEJobPhase(job);
    
    return res.json({ 
      success: true, 
      jobId: job.id,
      phase: job.phase 
    });
  } catch (error) {
    // Mark job as failed
    await query(
      `UPDATE ucie_jobs 
       SET status = 'failed', error = $1, updated_at = NOW() 
       WHERE id = $2`,
      [error.message, job.id]
    );
    
    return res.status(500).json({ error: error.message });
  }
}

export const config = { maxDuration: 60 };

async function processUCIEJobPhase(job: any) {
  const { id, symbol, phase } = job;
  
  // Phase 1: Market Data (15-20s)
  if (phase === 'initializing' || phase === 'market-data') {
    await updateJobPhase(id, 'market-data', 10);
    const marketData = await fetchMarketData(symbol);
    await cacheData(symbol, 'market-data', marketData);
    await updateJobPhase(id, 'sentiment', 25);
    return;
  }
  
  // Phase 2: Sentiment (15-20s)
  if (phase === 'sentiment') {
    const sentiment = await fetchSentiment(symbol);
    await cacheData(symbol, 'sentiment', sentiment);
    await updateJobPhase(id, 'technical', 40);
    return;
  }
  
  // Phase 3: Technical (15-20s)
  if (phase === 'technical') {
    const technical = await fetchTechnical(symbol);
    await cacheData(symbol, 'technical', technical);
    await updateJobPhase(id, 'on-chain', 55);
    return;
  }
  
  // Phase 4: On-Chain (15-20s)
  if (phase === 'on-chain') {
    const onChain = await fetchOnChain(symbol);
    await cacheData(symbol, 'on-chain', onChain);
    await updateJobPhase(id, 'ai-analysis', 70);
    return;
  }
  
  // Phase 5: AI Analysis (30-40s)
  if (phase === 'ai-analysis') {
    const context = await getComprehensiveContext(symbol);
    const analysis = await callAI(context);
    await cacheData(symbol, 'research', analysis);
    
    // Mark complete
    await query(
      `UPDATE ucie_jobs 
       SET status = 'completed', progress = 100, result = $1, 
           completed_at = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [JSON.stringify(analysis), id]
    );
  }
}
```

#### 6. Add Cron Job

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-ucie-jobs",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 🎯 Client-Side Implementation

### React Hook for Polling

```typescript
// hooks/useUCIEAnalysis.ts
import { useState, useEffect } from 'react';

export function useUCIEAnalysis(symbol: string) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const startAnalysis = async () => {
    try {
      setStatus('starting');
      const response = await fetch(`/api/ucie/start/${symbol}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setJobId(data.jobId);
        setStatus('queued');
      } else {
        setError(data.error);
        setStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };
  
  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'error') {
      return;
    }
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ucie/status/${jobId}`);
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.status === 'completed') {
          // Fetch result
          const resultResponse = await fetch(`/api/ucie/result/${jobId}`);
          const resultData = await resultResponse.json();
          setResult(resultData.result);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setError(data.error);
          clearInterval(pollInterval);
        }
      } catch (err) {
        setError(err.message);
        setStatus('error');
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [jobId, status]);
  
  return {
    startAnalysis,
    status,
    progress,
    result,
    error,
    isLoading: status === 'queued' || status === 'processing'
  };
}
```

### Usage Example

```typescript
function UCIEDashboard({ symbol }: { symbol: string }) {
  const { startAnalysis, status, progress, result, error, isLoading } = useUCIEAnalysis(symbol);
  
  return (
    <div>
      {status === 'idle' && (
        <button onClick={startAnalysis}>
          Start UCIE Analysis
        </button>
      )}
      
      {isLoading && (
        <div>
          <p>Status: {status}</p>
          <progress value={progress} max={100} />
          <p>{progress}% complete</p>
        </div>
      )}
      
      {status === 'completed' && result && (
        <div>
          <h2>Analysis Complete!</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div>
          <p>Error: {error}</p>
          <button onClick={startAnalysis}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Expected Performance

### Timeline

```
User clicks "Analyze" → Job created (< 5s)
                      ↓
Cron runs (every 1 min) → Process Phase 1 (< 60s)
                      ↓
Cron runs (every 1 min) → Process Phase 2 (< 60s)
                      ↓
Cron runs (every 1 min) → Process Phase 3 (< 60s)
                      ↓
Cron runs (every 1 min) → Process Phase 4 (< 60s)
                      ↓
Cron runs (every 1 min) → Process Phase 5 (< 60s)
                      ↓
Analysis complete (5-7 minutes total)
```

### Metrics

| Metric | Value |
|--------|-------|
| Total Time | 5-7 minutes |
| User Wait | 5-7 minutes (with progress) |
| Function Duration | < 60s per phase |
| Polling Frequency | Every 3 seconds |
| Success Rate | 95%+ expected |

---

## ✅ Deployment Steps

1. **Update vercel.json** (set maxDuration to 60)
2. **Create ucie_jobs table** (run migration)
3. **Implement start/status/result endpoints**
4. **Implement cron processor**
5. **Update frontend** (use polling hook)
6. **Test end-to-end**
7. **Deploy to production**

---

## 🎯 Success Criteria

- ✅ All functions complete within 60 seconds
- ✅ UCIE analysis completes in 5-7 minutes
- ✅ User sees progress updates
- ✅ No timeout errors
- ✅ 95%+ success rate

---

**Status**: 🟡 **REQUIRES IMPLEMENTATION**  
**Priority**: **CRITICAL**  
**Estimated Time**: 4-6 hours

**This is the correct approach for Vercel Pro!** 🚀
