# UCIE Caesar Integration Guide

**Date**: January 27, 2025  
**Status**: ⏳ Not Started (3 hours estimated)  
**Priority**: MEDIUM (Optional Enhancement)  
**Depends On**: Modular Analysis (✅ Complete)

---

## 🎯 Overview

Integrate Caesar API to provide deep dive analysis using all 9 modular analyses as context. This creates a "mega-prompt" that leverages Caesar's research capabilities for comprehensive market intelligence.

---

## 📋 Implementation Plan

### Step 1: Create Mega-Prompt Builder (30 minutes)

**File**: `lib/ucie/caesarMegaPrompt.ts`

```typescript
/**
 * Build Caesar mega-prompt from modular analysis
 * Combines all 9 analyses into structured context
 */

interface ModularAnalysis {
  marketAnalysis?: any;
  technicalAnalysis?: any;
  sentimentAnalysis?: any;
  newsAnalysis?: any;
  onChainAnalysis?: any;
  riskAnalysis?: any;
  predictionsAnalysis?: any;
  defiAnalysis?: any;
  executiveSummary?: any;
}

export function buildCaesarMegaPrompt(
  symbol: string,
  modularAnalysis: ModularAnalysis
): string {
  const sections: string[] = [];
  
  // Header
  sections.push(`# Deep Dive Analysis Request for ${symbol}`);
  sections.push('');
  sections.push('I have completed a comprehensive modular analysis of this cryptocurrency. Please synthesize these insights into a deep research report with citations.');
  sections.push('');
  
  // Executive Summary
  if (modularAnalysis.executiveSummary) {
    sections.push('## Executive Summary');
    sections.push(JSON.stringify(modularAnalysis.executiveSummary, null, 2));
    sections.push('');
  }
  
  // Market Analysis
  if (modularAnalysis.marketAnalysis) {
    sections.push('## Market Analysis');
    sections.push(JSON.stringify(modularAnalysis.marketAnalysis, null, 2));
    sections.push('');
  }
  
  // Technical Analysis
  if (modularAnalysis.technicalAnalysis) {
    sections.push('## Technical Analysis');
    sections.push(JSON.stringify(modularAnalysis.technicalAnalysis, null, 2));
    sections.push('');
  }
  
  // Sentiment Analysis
  if (modularAnalysis.sentimentAnalysis) {
    sections.push('## Sentiment Analysis');
    sections.push(JSON.stringify(modularAnalysis.sentimentAnalysis, null, 2));
    sections.push('');
  }
  
  // News Analysis
  if (modularAnalysis.newsAnalysis) {
    sections.push('## News Analysis');
    sections.push(JSON.stringify(modularAnalysis.newsAnalysis, null, 2));
    sections.push('');
  }
  
  // On-Chain Analysis
  if (modularAnalysis.onChainAnalysis) {
    sections.push('## On-Chain Analysis');
    sections.push(JSON.stringify(modularAnalysis.onChainAnalysis, null, 2));
    sections.push('');
  }
  
  // Risk Analysis
  if (modularAnalysis.riskAnalysis) {
    sections.push('## Risk Analysis');
    sections.push(JSON.stringify(modularAnalysis.riskAnalysis, null, 2));
    sections.push('');
  }
  
  // Predictions Analysis
  if (modularAnalysis.predictionsAnalysis) {
    sections.push('## Predictions Analysis');
    sections.push(JSON.stringify(modularAnalysis.predictionsAnalysis, null, 2));
    sections.push('');
  }
  
  // DeFi Analysis
  if (modularAnalysis.defiAnalysis) {
    sections.push('## DeFi Analysis');
    sections.push(JSON.stringify(modularAnalysis.defiAnalysis, null, 2));
    sections.push('');
  }
  
  // Research Request
  sections.push('## Research Request');
  sections.push('');
  sections.push('Based on the above analyses, please provide:');
  sections.push('');
  sections.push('1. **Deep Market Context**: Historical trends, market cycles, macro factors');
  sections.push('2. **Competitive Analysis**: How this asset compares to alternatives');
  sections.push('3. **Fundamental Analysis**: Technology, team, adoption, use cases');
  sections.push('4. **Risk Assessment**: Regulatory, technical, market risks');
  sections.push('5. **Investment Thesis**: Bull case, bear case, neutral case');
  sections.push('6. **Price Targets**: Short-term (1-7 days), medium-term (1-3 months), long-term (6-12 months)');
  sections.push('7. **Action Items**: Specific recommendations for traders/investors');
  sections.push('');
  sections.push('Please cite all sources and provide confidence levels for each conclusion.');
  
  return sections.join('\n');
}

/**
 * Format Caesar response for frontend display
 */
export interface CaesarDeepDive {
  content: string;
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
    citation: number;
  }>;
  confidence: number;
  timestamp: string;
}

export function formatCaesarResponse(caesarResponse: any): CaesarDeepDive {
  return {
    content: caesarResponse.content || '',
    sources: (caesarResponse.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      relevance: result.score,
      citation: result.citation_index
    })),
    confidence: calculateConfidence(caesarResponse),
    timestamp: new Date().toISOString()
  };
}

function calculateConfidence(response: any): number {
  // Calculate confidence based on number of sources and relevance scores
  const sources = response.results || [];
  if (sources.length === 0) return 0;
  
  const avgRelevance = sources.reduce((sum: number, s: any) => sum + s.score, 0) / sources.length;
  const sourceCount = Math.min(sources.length / 10, 1); // Max 10 sources = 100%
  
  return Math.round((avgRelevance * 0.7 + sourceCount * 0.3) * 100);
}
```

---

### Step 2: Create Caesar API Endpoint (1 hour)

**File**: `pages/api/ucie/caesar-deep-dive/[symbol].ts`

```typescript
/**
 * UCIE Caesar Deep Dive
 * 
 * POST /api/ucie/caesar-deep-dive/[symbol]
 * 
 * Starts Caesar research job with mega-prompt from modular analysis
 * Returns jobId for polling
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { buildCaesarMegaPrompt, formatCaesarResponse } from '../../../../lib/ucie/caesarMegaPrompt';

interface StartResponse {
  success: boolean;
  caesarJobId?: string;
  status?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StartResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;
  const { modularAnalysis } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol'
    });
  }

  if (!modularAnalysis) {
    return res.status(400).json({
      success: false,
      error: 'Missing modular analysis'
    });
  }

  try {
    const symbolUpper = symbol.toUpperCase();
    
    // Build mega-prompt
    const megaPrompt = buildCaesarMegaPrompt(symbolUpper, modularAnalysis);
    
    console.log(`🔬 Starting Caesar deep dive for ${symbolUpper}...`);
    console.log(`📝 Mega-prompt length: ${megaPrompt.length} characters`);
    
    // Call Caesar API
    const caesarApiKey = process.env.CAESAR_API_KEY;
    if (!caesarApiKey) {
      throw new Error('CAESAR_API_KEY not configured');
    }
    
    const caesarResponse = await fetch('https://api.caesar.xyz/research', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${caesarApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: megaPrompt,
        compute_units: 5, // Deep research (5 minutes)
        system_prompt: 'You are a cryptocurrency research analyst. Provide comprehensive analysis with citations.'
      })
    });
    
    if (!caesarResponse.ok) {
      throw new Error(`Caesar API error: ${caesarResponse.status}`);
    }
    
    const caesarData = await caesarResponse.json();
    const caesarJobId = caesarData.id;
    
    console.log(`✅ Caesar job created: ${caesarJobId}`);
    
    // Store Caesar job in database
    await query(
      `INSERT INTO ucie_caesar_jobs (symbol, caesar_job_id, status, mega_prompt, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [symbolUpper, caesarJobId, 'queued', megaPrompt]
    );
    
    return res.status(200).json({
      success: true,
      caesarJobId: caesarJobId,
      status: 'queued'
    });

  } catch (error) {
    console.error('Failed to start Caesar deep dive:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start deep dive'
    });
  }
}
```

**File**: `pages/api/ucie/caesar-deep-dive-poll/[jobId].ts`

```typescript
/**
 * Poll Caesar deep dive job status
 * 
 * GET /api/ucie/caesar-deep-dive-poll/[jobId]
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { formatCaesarResponse } from '../../../../lib/ucie/caesarMegaPrompt';

interface PollResponse {
  success: boolean;
  status: string;
  result?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PollResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'error',
      error: 'Method not allowed'
    });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'error',
      error: 'Invalid job ID'
    });
  }

  try {
    // Get Caesar job from database
    const result = await query(
      'SELECT * FROM ucie_caesar_jobs WHERE caesar_job_id = $1',
      [jobId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 'error',
        error: 'Job not found'
      });
    }
    
    const job = result.rows[0];
    
    // If already completed, return cached result
    if (job.status === 'completed' && job.result) {
      return res.status(200).json({
        success: true,
        status: 'completed',
        result: JSON.parse(job.result)
      });
    }
    
    // Poll Caesar API
    const caesarApiKey = process.env.CAESAR_API_KEY;
    if (!caesarApiKey) {
      throw new Error('CAESAR_API_KEY not configured');
    }
    
    const caesarResponse = await fetch(`https://api.caesar.xyz/research/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${caesarApiKey}`
      }
    });
    
    if (!caesarResponse.ok) {
      throw new Error(`Caesar API error: ${caesarResponse.status}`);
    }
    
    const caesarData = await caesarResponse.json();
    const status = caesarData.status;
    
    // Update database
    await query(
      'UPDATE ucie_caesar_jobs SET status = $1, updated_at = NOW() WHERE caesar_job_id = $2',
      [status, jobId]
    );
    
    // If completed, format and store result
    if (status === 'completed') {
      const formattedResult = formatCaesarResponse(caesarData);
      
      await query(
        'UPDATE ucie_caesar_jobs SET result = $1, completed_at = NOW() WHERE caesar_job_id = $2',
        [JSON.stringify(formattedResult), jobId]
      );
      
      return res.status(200).json({
        success: true,
        status: 'completed',
        result: formattedResult
      });
    }
    
    // Still processing
    return res.status(200).json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('Failed to poll Caesar job:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to poll job'
    });
  }
}
```

---

### Step 3: Frontend Integration (1 hour)

**File**: `components/UCIE/DataPreviewModal.tsx` (Add to existing file)

```typescript
// Add to state
const [caesarJobId, setCaesarJobId] = useState<string | null>(null);
const [caesarStatus, setCaesarStatus] = useState<'idle' | 'queued' | 'researching' | 'completed' | 'error'>('idle');
const [caesarResult, setCaesarResult] = useState<any>(null);

// Add Caesar deep dive function
const startCaesarDeepDive = async () => {
  if (!preview?.aiAnalysis) {
    alert('Please generate AI analysis first');
    return;
  }
  
  try {
    setCaesarStatus('queued');
    
    // Parse modular analysis
    const modularAnalysis = JSON.parse(preview.aiAnalysis);
    
    // Start Caesar job
    const response = await fetch(`/api/ucie/caesar-deep-dive/${symbol}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modularAnalysis })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setCaesarJobId(data.caesarJobId);
      setCaesarStatus('queued');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to start Caesar deep dive:', error);
    setCaesarStatus('error');
  }
};

// Add Caesar polling effect
useEffect(() => {
  if (!caesarJobId || caesarStatus === 'completed' || caesarStatus === 'error') {
    return;
  }
  
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/ucie/caesar-deep-dive-poll/${caesarJobId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        setCaesarStatus('completed');
        setCaesarResult(data.result);
        clearInterval(pollInterval);
      } else if (data.status === 'error') {
        setCaesarStatus('error');
        clearInterval(pollInterval);
      } else {
        setCaesarStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to poll Caesar job:', error);
      setCaesarStatus('error');
      clearInterval(pollInterval);
    }
  }, 10000); // Poll every 10 seconds
  
  return () => clearInterval(pollInterval);
}, [caesarJobId, caesarStatus]);

// Add Caesar UI section (after modular analysis display)
{gptStatus === 'completed' && preview?.aiAnalysis && (
  <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
    <h3 className="text-xl font-bold text-bitcoin-white mb-4">
      🔬 Deep Dive Research
    </h3>
    
    {caesarStatus === 'idle' && (
      <button
        onClick={startCaesarDeepDive}
        className="bg-bitcoin-orange text-bitcoin-black px-6 py-3 rounded-lg font-bold hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
      >
        Start Caesar Deep Dive (5 minutes)
      </button>
    )}
    
    {caesarStatus === 'queued' && (
      <div className="text-bitcoin-white-80">
        <p>🔄 Caesar research queued...</p>
      </div>
    )}
    
    {caesarStatus === 'researching' && (
      <div className="text-bitcoin-white-80">
        <p>🔬 Caesar is researching... (this takes 2-5 minutes)</p>
      </div>
    )}
    
    {caesarStatus === 'completed' && caesarResult && (
      <div className="space-y-4">
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
          <h4 className="text-lg font-bold text-bitcoin-orange mb-4">
            Research Report
          </h4>
          <div className="text-bitcoin-white-80 whitespace-pre-wrap">
            {caesarResult.content}
          </div>
          
          {caesarResult.sources && caesarResult.sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
              <h5 className="text-sm font-bold text-bitcoin-white-60 mb-3">
                Sources ({caesarResult.sources.length})
              </h5>
              <div className="space-y-2">
                {caesarResult.sources.map((source: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">[{source.citation}]</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bitcoin-white-80 hover:text-bitcoin-orange underline"
                    >
                      {source.title}
                    </a>
                    <span className="text-bitcoin-white-60 text-xs">
                      ({Math.round(source.relevance * 100)}% relevant)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-bitcoin-white-60">
            Confidence: {caesarResult.confidence}% • 
            Generated at {new Date(caesarResult.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    )}
    
    {caesarStatus === 'error' && (
      <div className="text-red-500">
        <p>❌ Caesar research failed. Please try again.</p>
      </div>
    )}
  </div>
)}
```

---

### Step 4: Database Migration (15 minutes)

**File**: `migrations/004_ucie_caesar_jobs.sql`

```sql
-- UCIE Caesar Jobs Table
-- Stores Caesar deep dive research jobs

CREATE TABLE IF NOT EXISTS ucie_caesar_jobs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  caesar_job_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  mega_prompt TEXT,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ucie_caesar_jobs_symbol ON ucie_caesar_jobs(symbol);
CREATE INDEX idx_ucie_caesar_jobs_caesar_job_id ON ucie_caesar_jobs(caesar_job_id);
CREATE INDEX idx_ucie_caesar_jobs_status ON ucie_caesar_jobs(status);
CREATE INDEX idx_ucie_caesar_jobs_created_at ON ucie_caesar_jobs(created_at DESC);

-- Comments
COMMENT ON TABLE ucie_caesar_jobs IS 'Stores Caesar deep dive research jobs for UCIE';
COMMENT ON COLUMN ucie_caesar_jobs.caesar_job_id IS 'Caesar API job ID for polling';
COMMENT ON COLUMN ucie_caesar_jobs.mega_prompt IS 'Combined modular analysis prompt sent to Caesar';
COMMENT ON COLUMN ucie_caesar_jobs.result IS 'Formatted Caesar research result with sources';
```

---

### Step 5: Testing (30 minutes)

**Test Script**: `scripts/test-caesar-integration.ts`

```typescript
/**
 * Test Caesar integration end-to-end
 */

async function testCaesarIntegration() {
  console.log('🧪 Testing Caesar Integration...\n');
  
  // Step 1: Generate modular analysis
  console.log('Step 1: Generating modular analysis...');
  const startResponse = await fetch('http://localhost:3000/api/ucie/openai-summary-start/BTC', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collectedData: { /* mock data */ },
      context: { /* mock context */ }
    })
  });
  
  const startData = await startResponse.json();
  console.log(`✅ Job created: ${startData.jobId}\n`);
  
  // Step 2: Wait for modular analysis to complete
  console.log('Step 2: Waiting for modular analysis...');
  let modularAnalysis;
  while (true) {
    const pollResponse = await fetch(`http://localhost:3000/api/ucie/openai-summary-poll/${startData.jobId}`);
    const pollData = await pollResponse.json();
    
    if (pollData.status === 'completed') {
      modularAnalysis = pollData.result;
      console.log(`✅ Modular analysis complete\n`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  // Step 3: Start Caesar deep dive
  console.log('Step 3: Starting Caesar deep dive...');
  const caesarResponse = await fetch('http://localhost:3000/api/ucie/caesar-deep-dive/BTC', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modularAnalysis })
  });
  
  const caesarData = await caesarResponse.json();
  console.log(`✅ Caesar job created: ${caesarData.caesarJobId}\n`);
  
  // Step 4: Poll Caesar job
  console.log('Step 4: Polling Caesar job...');
  while (true) {
    const pollResponse = await fetch(`http://localhost:3000/api/ucie/caesar-deep-dive-poll/${caesarData.caesarJobId}`);
    const pollData = await pollResponse.json();
    
    if (pollData.status === 'completed') {
      console.log(`✅ Caesar research complete\n`);
      console.log('Result:', JSON.stringify(pollData.result, null, 2));
      break;
    }
    
    console.log(`⏳ Status: ${pollData.status}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n🎉 Caesar integration test complete!');
}

testCaesarIntegration();
```

---

## 📊 Expected Results

### Mega-Prompt Example
```
# Deep Dive Analysis Request for BTC

I have completed a comprehensive modular analysis of this cryptocurrency. Please synthesize these insights into a deep research report with citations.

## Executive Summary
{
  "summary": "Bitcoin shows strong bullish momentum...",
  "confidence": 85,
  "recommendation": "Buy - Strong fundamentals and technical setup"
}

## Market Analysis
{
  "price_trend": "Bullish",
  "current_price_analysis": "BTC trading at $95,000...",
  ...
}

[... 7 more sections ...]

## Research Request

Based on the above analyses, please provide:

1. **Deep Market Context**: Historical trends, market cycles, macro factors
2. **Competitive Analysis**: How this asset compares to alternatives
3. **Fundamental Analysis**: Technology, team, adoption, use cases
4. **Risk Assessment**: Regulatory, technical, market risks
5. **Investment Thesis**: Bull case, bear case, neutral case
6. **Price Targets**: Short-term (1-7 days), medium-term (1-3 months), long-term (6-12 months)
7. **Action Items**: Specific recommendations for traders/investors

Please cite all sources and provide confidence levels for each conclusion.
```

### Caesar Response Example
```json
{
  "content": "Based on the comprehensive analysis provided...\n\n**Deep Market Context**\nBitcoin is currently in a bull market phase [1]...\n\n**Competitive Analysis**\nCompared to Ethereum and other altcoins [2]...\n\n[... detailed research report ...]",
  "sources": [
    {
      "title": "Bitcoin Market Cycle Analysis",
      "url": "https://example.com/article",
      "relevance": 0.92,
      "citation": 1
    },
    {
      "title": "Crypto Market Comparison 2025",
      "url": "https://example.com/comparison",
      "relevance": 0.88,
      "citation": 2
    }
  ],
  "confidence": 87,
  "timestamp": "2025-01-27T14:30:00Z"
}
```

---

## 🎯 Success Criteria

- [ ] Mega-prompt builder creates structured context from modular analysis
- [ ] Caesar API call succeeds with mega-prompt
- [ ] Polling works correctly (10-second intervals)
- [ ] Results are formatted and stored in database
- [ ] Frontend displays Caesar research with sources
- [ ] Citations are clickable and properly formatted
- [ ] Loading states work correctly
- [ ] Error handling is robust
- [ ] Bitcoin Sovereign styling applied throughout

---

## 🚀 Deployment

### Environment Variables
```bash
# Add to Vercel
CAESAR_API_KEY=your_caesar_api_key_here
```

### Database Migration
```bash
# Run migration
npx tsx scripts/run-migrations.ts
```

### Testing
```bash
# Test locally
npm run dev
npx tsx scripts/test-caesar-integration.ts
```

### Deploy
```bash
# Deploy to production
git add -A
git commit -m "feat(ucie): Add Caesar deep dive integration"
git push origin main
```

---

## 📋 Checklist

- [ ] Create `lib/ucie/caesarMegaPrompt.ts`
- [ ] Create `pages/api/ucie/caesar-deep-dive/[symbol].ts`
- [ ] Create `pages/api/ucie/caesar-deep-dive-poll/[jobId].ts`
- [ ] Update `components/UCIE/DataPreviewModal.tsx`
- [ ] Create `migrations/004_ucie_caesar_jobs.sql`
- [ ] Run database migration
- [ ] Create `scripts/test-caesar-integration.ts`
- [ ] Test end-to-end locally
- [ ] Add CAESAR_API_KEY to Vercel
- [ ] Deploy to production
- [ ] Test in production

---

## 🎉 Conclusion

Caesar integration will provide deep dive research capabilities leveraging all 9 modular analyses. This creates a comprehensive research report with citations, giving users the ultimate cryptocurrency intelligence.

**Estimated Time**: 3 hours  
**Priority**: MEDIUM (Optional Enhancement)  
**Value**: HIGH (Comprehensive research with citations)

