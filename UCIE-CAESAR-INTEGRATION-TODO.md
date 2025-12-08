# UCIE Caesar Integration - TODO List

**Date**: December 8, 2025  
**Status**: ⏳ **NOT STARTED**  
**Priority**: 🚀 **HIGH** - Final piece of modular analysis system  
**Estimated Time**: 2-3 hours

---

## 📊 Current Status

### ✅ Complete (100%)
- **Backend**: Modular analysis system (`pages/api/ucie/openai-summary-start/[symbol].ts`)
- **Frontend**: ModularAnalysisDisplay, AnalysisCard, parsing logic (`components/UCIE/DataPreviewModal.tsx`)

### ❌ Not Started (0%)
- **Caesar Integration**: 3 API endpoints + button + results display

---

## 🎯 What Needs to Be Built

### 1. Caesar Mega-Prompt Endpoint ⏳

**File**: `pages/api/ucie/caesar-mega-prompt/[symbol].ts`

**Purpose**: Generate comprehensive Caesar prompt from modular analysis

**Endpoint**: `POST /api/ucie/caesar-mega-prompt/[symbol]`

**Request Body**:
```typescript
{
  modularAnalysis: ModularAnalysis
}
```

**Response**:
```typescript
{
  success: true,
  caesarPrompt: string // Comprehensive prompt combining all 9 analyses
}
```

**Implementation**:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { symbol } = req.query;
  const { modularAnalysis } = req.body;
  
  if (!modularAnalysis) {
    return res.status(400).json({ error: 'Missing modularAnalysis' });
  }
  
  // Build comprehensive Caesar prompt
  const caesarPrompt = `
# Comprehensive ${symbol} Analysis Request

Perform deep institutional-grade research and analysis for ${symbol} using the following comprehensive data:

## EXECUTIVE SUMMARY
${JSON.stringify(modularAnalysis.executiveSummary, null, 2)}

## MARKET ANALYSIS
${JSON.stringify(modularAnalysis.marketAnalysis, null, 2)}

## TECHNICAL ANALYSIS
${JSON.stringify(modularAnalysis.technicalAnalysis, null, 2)}

## SENTIMENT ANALYSIS
${JSON.stringify(modularAnalysis.sentimentAnalysis, null, 2)}

## NEWS ANALYSIS
${JSON.stringify(modularAnalysis.newsAnalysis, null, 2)}

## ON-CHAIN ANALYSIS
${JSON.stringify(modularAnalysis.onChainAnalysis, null, 2)}

## RISK ANALYSIS
${JSON.stringify(modularAnalysis.riskAnalysis, null, 2)}

## PREDICTIONS ANALYSIS
${JSON.stringify(modularAnalysis.predictionsAnalysis, null, 2)}

## DEFI ANALYSIS
${JSON.stringify(modularAnalysis.defiAnalysis, null, 2)}

---

## RESEARCH REQUIREMENTS

Please provide:

1. **Comprehensive Analysis**: Synthesize all data sources into cohesive insights
2. **Source Citations**: Include references to specific data points and external sources
3. **Risk Assessment**: Detailed risk factors and mitigation strategies
4. **Market Outlook**: 
   - Short-term (24-48 hours)
   - Medium-term (1-2 weeks)
   - Long-term (1-3 months)
5. **Trading Recommendations**: Specific entry/exit points with reasoning
6. **Confidence Levels**: Assign confidence scores (0-100%) to each recommendation
7. **Alternative Scenarios**: 
   - Bull case (optimistic scenario)
   - Bear case (pessimistic scenario)
   - Base case (most likely scenario)
8. **Key Catalysts**: Events that could significantly impact price
9. **Comparative Analysis**: How ${symbol} compares to similar assets
10. **Institutional Perspective**: What institutional investors should consider

Format the response as a comprehensive research report with clear sections, actionable insights, and source citations.
`;
  
  return res.status(200).json({
    success: true,
    caesarPrompt: caesarPrompt.trim()
  });
}
```

**Testing**:
```bash
curl -X POST http://localhost:3000/api/ucie/caesar-mega-prompt/BTC \
  -H "Content-Type: application/json" \
  -d '{"modularAnalysis": {...}}'
```

---

### 2. Caesar Deep Dive Endpoint ⏳

**File**: `pages/api/ucie/caesar-deep-dive/[symbol].ts`

**Purpose**: Start Caesar research job with mega-prompt

**Endpoint**: `POST /api/ucie/caesar-deep-dive/[symbol]`

**Request Body**:
```typescript
{
  caesarPrompt: string
}
```

**Response**:
```typescript
{
  success: true,
  jobId: string,
  status: 'queued'
}
```

**Implementation**:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { symbol } = req.query;
  const { caesarPrompt } = req.body;
  
  if (!caesarPrompt) {
    return res.status(400).json({ error: 'Missing caesarPrompt' });
  }
  
  const caesarApiKey = process.env.CAESAR_API_KEY;
  if (!caesarApiKey) {
    return res.status(500).json({ error: 'Caesar API key not configured' });
  }
  
  try {
    console.log(`🚀 Starting Caesar deep dive for ${symbol}...`);
    
    // Create Caesar research job
    const response = await fetch('https://api.caesar.xyz/research', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${caesarApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: caesarPrompt,
        compute_units: 5, // Deep analysis (5-10 minutes)
        system_prompt: 'You are an institutional-grade cryptocurrency analyst. Provide comprehensive research with source citations, confidence levels, and actionable insights.'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Caesar API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Caesar job created: ${data.id}, status: ${data.status}`);
    
    return res.status(200).json({
      success: true,
      jobId: data.id,
      status: data.status
    });
    
  } catch (error) {
    console.error('❌ Caesar deep dive error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start Caesar analysis'
    });
  }
}
```

**Testing**:
```bash
curl -X POST http://localhost:3000/api/ucie/caesar-deep-dive/BTC \
  -H "Content-Type: application/json" \
  -d '{"caesarPrompt": "..."}'
```

---

### 3. Caesar Polling Endpoint ⏳

**File**: `pages/api/ucie/caesar-poll/[jobId].ts`

**Purpose**: Poll Caesar research job for results

**Endpoint**: `GET /api/ucie/caesar-poll/[jobId]`

**Response**:
```typescript
{
  success: true,
  status: 'queued' | 'researching' | 'completed' | 'failed',
  content: string | null,           // Final synthesis
  transformed_content: string | null, // Post-processed content
  results: Array<{                  // Source citations
    id: string,
    score: number,
    title: string,
    url: string,
    citation_index: number
  }>
}
```

**Implementation**:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid jobId' });
  }
  
  const caesarApiKey = process.env.CAESAR_API_KEY;
  if (!caesarApiKey) {
    return res.status(500).json({ error: 'Caesar API key not configured' });
  }
  
  try {
    console.log(`📡 Polling Caesar job ${jobId}...`);
    
    const response = await fetch(`https://api.caesar.xyz/research/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${caesarApiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Caesar API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Caesar job ${jobId} status: ${data.status}`);
    
    return res.status(200).json({
      success: true,
      status: data.status,
      content: data.content || null,
      transformed_content: data.transformed_content || null,
      results: data.results || []
    });
    
  } catch (error) {
    console.error('❌ Caesar poll error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to poll Caesar job'
    });
  }
}
```

**Testing**:
```bash
curl http://localhost:3000/api/ucie/caesar-poll/[jobId]
```

---

### 4. Caesar Deep Dive Button ⏳

**File**: `components/UCIE/DataPreviewModal.tsx`

**Location**: Add to `ModularAnalysisDisplay` component (after DeFi Analysis Card)

**Implementation**:
```typescript
// Add this after the DeFi Analysis Card (around line 340)

{/* Caesar Deep Dive Button */}
<div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-6 text-center">
  <h3 className="text-xl font-bold text-bitcoin-white mb-3">
    Want Even Deeper Insights?
  </h3>
  <p className="text-bitcoin-white-80 mb-4">
    Caesar AI can perform comprehensive institutional-grade research with source citations
  </p>
  <button
    onClick={() => handleCaesarDeepDive(analysis)}
    disabled={caesarLoading}
    className={`font-bold uppercase tracking-wider px-8 py-4 rounded-lg transition-all min-h-[48px] ${
      caesarLoading
        ? 'bg-bitcoin-black text-bitcoin-white-60 border-2 border-bitcoin-white-60 cursor-not-allowed opacity-50'
        : 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95'
    }`}
  >
    {caesarLoading ? (
      <>
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-bitcoin-white-60 border-t-transparent mr-2"></div>
        Starting Caesar Analysis...
      </>
    ) : (
      '🔬 Deep Dive with Caesar AI (15-20 min)'
    )}
  </button>
</div>
```

---

### 5. Caesar Deep Dive Handler ⏳

**File**: `components/UCIE/DataPreviewModal.tsx`

**Location**: Add to component state and handlers

**Implementation**:
```typescript
// Add to component state (around line 420)
const [caesarLoading, setCaesarLoading] = useState(false);
const [caesarJobId, setCaesarJobId] = useState<string | null>(null);
const [caesarStatus, setCaesarStatus] = useState<'idle' | 'queued' | 'researching' | 'completed' | 'failed'>('idle');
const [caesarResults, setCaesarResults] = useState<any>(null);

// Add handler function (around line 600)
const handleCaesarDeepDive = async (modularAnalysis: ModularAnalysis) => {
  setCaesarLoading(true);
  
  try {
    console.log('🚀 Starting Caesar deep dive...');
    
    // Step 1: Generate Caesar mega-prompt
    const promptResponse = await fetch(`/api/ucie/caesar-mega-prompt/${symbol}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modularAnalysis })
    });
    
    if (!promptResponse.ok) {
      throw new Error('Failed to generate Caesar prompt');
    }
    
    const promptData = await promptResponse.json();
    console.log('✅ Caesar prompt generated');
    
    // Step 2: Start Caesar deep dive
    const diveResponse = await fetch(`/api/ucie/caesar-deep-dive/${symbol}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caesarPrompt: promptData.caesarPrompt })
    });
    
    if (!diveResponse.ok) {
      throw new Error('Failed to start Caesar analysis');
    }
    
    const diveData = await diveResponse.json();
    console.log(`✅ Caesar job started: ${diveData.jobId}`);
    
    // Step 3: Start polling
    setCaesarJobId(diveData.jobId);
    setCaesarStatus('queued');
    
  } catch (error) {
    console.error('❌ Caesar deep dive error:', error);
    alert('Failed to start Caesar analysis. Please try again.');
  } finally {
    setCaesarLoading(false);
  }
};
```

---

### 6. Caesar Polling Logic ⏳

**File**: `components/UCIE/DataPreviewModal.tsx`

**Location**: Add useEffect for polling

**Implementation**:
```typescript
// Add useEffect for Caesar polling (around line 650)
useEffect(() => {
  if (!caesarJobId || caesarStatus === 'completed' || caesarStatus === 'failed') {
    return;
  }
  
  console.log(`🔄 Starting Caesar polling for job ${caesarJobId}`);
  
  let shouldStopPolling = false;
  
  const pollInterval = setInterval(async () => {
    if (shouldStopPolling) {
      clearInterval(pollInterval);
      return;
    }
    
    try {
      console.log(`📡 Polling Caesar job ${caesarJobId}...`);
      
      const response = await fetch(`/api/ucie/caesar-poll/${caesarJobId}`);
      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Caesar status: ${data.status}`);
      
      // Update status
      setCaesarStatus(data.status);
      
      // Check if completed
      if (data.status === 'completed' && data.content) {
        console.log('🎉 Caesar analysis completed!');
        shouldStopPolling = true;
        clearInterval(pollInterval);
        setCaesarResults({
          content: data.content,
          transformed_content: data.transformed_content,
          results: data.results
        });
      }
      
      // Check if failed
      if (data.status === 'failed') {
        console.error('❌ Caesar analysis failed');
        shouldStopPolling = true;
        clearInterval(pollInterval);
        alert('Caesar analysis failed. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Caesar polling error:', error);
      shouldStopPolling = true;
      clearInterval(pollInterval);
    }
  }, 5000); // Poll every 5 seconds
  
  return () => {
    shouldStopPolling = true;
    clearInterval(pollInterval);
  };
}, [caesarJobId, caesarStatus]);
```

---

### 7. Caesar Results Display ⏳

**File**: `components/UCIE/DataPreviewModal.tsx`

**Location**: Add after ModularAnalysisDisplay

**Implementation**:
```typescript
// Add Caesar Results Display component (around line 350)
function CaesarResultsDisplay({ results }: { results: any }) {
  return (
    <div className="space-y-6 mt-8 pt-8 border-t-2 border-bitcoin-orange">
      <div className="bg-bitcoin-orange-10 border-2 border-bitcoin-orange rounded-lg p-6">
        <h2 className="text-3xl font-bold text-bitcoin-orange mb-4 flex items-center gap-2">
          <span>🔬</span>
          Caesar AI Deep Dive Research
        </h2>
        
        {/* Main Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-bitcoin-white-80 leading-relaxed whitespace-pre-wrap">
            {results.content}
          </div>
        </div>
        
        {/* Source Citations */}
        {results.results && results.results.length > 0 && (
          <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
            <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
              📚 Source Citations
            </h3>
            <div className="space-y-3">
              {results.results.map((source: any, index: number) => (
                <div key={source.id} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-bitcoin-orange font-bold text-lg">
                      [{source.citation_index}]
                    </span>
                    <div className="flex-1">
                      <h4 className="text-bitcoin-white font-semibold mb-1">
                        {source.title}
                      </h4>
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bitcoin-orange text-sm hover:underline"
                      >
                        {source.url}
                      </a>
                      <div className="mt-2 text-xs text-bitcoin-white-60">
                        Relevance Score: {(source.score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add to ModularAnalysisDisplay component (after all analysis cards)
{caesarResults && <CaesarResultsDisplay results={caesarResults} />}
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Test caesar-mega-prompt endpoint
  - [ ] Verify prompt generation
  - [ ] Check all 9 analyses included
  - [ ] Verify prompt formatting
- [ ] Test caesar-deep-dive endpoint
  - [ ] Verify job creation
  - [ ] Check jobId returned
  - [ ] Verify status is 'queued'
- [ ] Test caesar-poll endpoint
  - [ ] Verify polling works
  - [ ] Check status updates
  - [ ] Verify results returned when complete

### Frontend Testing
- [ ] Test Caesar button appears
- [ ] Test button click triggers analysis
- [ ] Test loading state displays
- [ ] Test polling works correctly
- [ ] Test results display properly
- [ ] Test source citations display
- [ ] Test error handling

### End-to-End Testing
- [ ] Complete flow: BTC analysis → Caesar deep dive → Results
- [ ] Complete flow: ETH analysis → Caesar deep dive → Results
- [ ] Complete flow: SOL analysis → Caesar deep dive → Results
- [ ] Test with failed Caesar job
- [ ] Test with timeout
- [ ] Test with network error

---

## 📊 Success Criteria

### Functionality
- ✅ Caesar mega-prompt generates correctly
- ✅ Caesar job starts successfully
- ✅ Polling works without errors
- ✅ Results display properly
- ✅ Source citations show correctly
- ✅ Error handling works

### Performance
- ✅ Prompt generation <1s
- ✅ Job creation <2s
- ✅ Polling interval 5s
- ✅ Total time 15-20 minutes (Caesar processing)

### User Experience
- ✅ Clear button to trigger analysis
- ✅ Loading states visible
- ✅ Progress indicators work
- ✅ Results easy to read
- ✅ Sources easy to access
- ✅ Error messages clear

---

## 🚀 Implementation Timeline

### Hour 1: Backend Endpoints
- [ ] Create caesar-mega-prompt endpoint (20 min)
- [ ] Create caesar-deep-dive endpoint (20 min)
- [ ] Create caesar-poll endpoint (20 min)

### Hour 2: Frontend Integration
- [ ] Add Caesar button to ModularAnalysisDisplay (15 min)
- [ ] Add Caesar handler function (15 min)
- [ ] Add Caesar polling logic (15 min)
- [ ] Add Caesar results display (15 min)

### Hour 3: Testing & Refinement
- [ ] Test all endpoints (20 min)
- [ ] Test frontend integration (20 min)
- [ ] Test end-to-end flow (20 min)

**Total Estimated Time**: 3 hours

---

## 📚 Documentation

**To Create**:
- [ ] `UCIE-CAESAR-INTEGRATION-COMPLETE.md` - Implementation summary
- [ ] `UCIE-CAESAR-TESTING-GUIDE.md` - Testing procedures
- [ ] `UCIE-CAESAR-USER-GUIDE.md` - User documentation

**To Update**:
- [ ] `UCIE-MODULAR-ANALYSIS-COMPLETE.md` - Add Caesar integration section
- [ ] `UCIE-MODULAR-ANALYSIS-NEXT-STEPS.md` - Mark Caesar as complete
- [ ] `.kiro/steering/ucie-system.md` - Add Caesar integration details

---

## 🎯 Priority Actions (RIGHT NOW)

### 1. Create Backend Endpoints (1 hour)
```bash
# Create files
touch pages/api/ucie/caesar-mega-prompt/[symbol].ts
touch pages/api/ucie/caesar-deep-dive/[symbol].ts
touch pages/api/ucie/caesar-poll/[jobId].ts

# Implement endpoints (copy code from above)
```

### 2. Update Frontend (1 hour)
```bash
# Edit DataPreviewModal.tsx
# - Add Caesar button
# - Add Caesar handler
# - Add Caesar polling
# - Add Caesar results display
```

### 3. Test End-to-End (1 hour)
```bash
# Start dev server
npm run dev

# Test with BTC
# 1. Click BTC in UCIE
# 2. Wait for modular analysis
# 3. Click "Deep Dive with Caesar"
# 4. Wait 15-20 minutes
# 5. Verify results display
```

---

**Status**: ⏳ **READY TO IMPLEMENT** - All requirements defined  
**Next Action**: Create 3 backend endpoints (1 hour)  
**Timeline**: 3 hours to complete Caesar integration

---

*This is the final piece to complete the modular analysis system!* 🚀
