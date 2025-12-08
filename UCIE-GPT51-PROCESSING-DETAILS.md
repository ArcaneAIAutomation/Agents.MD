# UCIE GPT-5.1 Processing Details

**Created**: December 7, 2025  
**Status**: 🤖 **GPT-5.1 ANALYSIS INTERNALS**  
**Purpose**: Complete documentation of GPT-5.1 async processing

---

## 🤖 GPT-5.1 Analysis Process

### Overview

GPT-5.1 analysis runs asynchronously to avoid Vercel timeout limits:
- **Job Creation**: Instant (<100ms)
- **Processing**: Async (1-3 minutes)
- **Polling**: Frontend checks every 3 seconds
- **Max Duration**: 30 minutes (600 attempts × 3s)

### Architecture Pattern

```
User clicks "Analyze BTC"
    ↓
POST /api/ucie/preview-data/BTC
    ├─ Collects data from 5 APIs (parallel)
    ├─ Stores in database (immediate)
    └─ Creates GPT-5.1 job
        ↓
POST /api/ucie/openai-summary-start/BTC
    ├─ Creates job in database (status: 'queued')
    ├─ Returns jobId immediately
    └─ Starts processJobAsync() (fire and forget)
        ↓
processJobAsync() runs in background:
    ├─ Updates status to 'processing'
    ├─ Builds comprehensive prompt
    ├─ Calls OpenAI Responses API
    ├─ Parses response with bulletproof utilities
    └─ Stores result in database (status: 'completed')
        ↓
Frontend polls GET /api/ucie/openai-summary-poll/[jobId]
    ├─ Every 3 seconds
    ├─ Shows elapsed time
    ├─ Updates status message
    └─ Displays result when complete
```

---

## 📝 Prompt Construction

### Data Aggregation

```typescript
const allData = {
  marketData: collectedData?.marketData || null,
  technical: collectedData?.technical || null,
  sentiment: collectedData?.sentiment || null,
  news: collectedData?.news || null,
  onChain: collectedData?.onChain || null,
  risk: collectedData?.risk || null,
  predictions: collectedData?.predictions || null,
  defi: collectedData?.defi || null,
  openaiSummary: {
    dataQuality: collectedData?.dataQuality || 0
  }
};
```

### Prompt Template

```typescript
const prompt = `You are an expert cryptocurrency market analyst. Analyze ${symbol} using the following comprehensive data:

📊 MARKET DATA:
${allData.marketData ? JSON.stringify(allData.marketData, null, 2) : 'Not available'}

📈 TECHNICAL ANALYSIS:
${allData.technical ? JSON.stringify(allData.technical, null, 2) : 'Not available'}

💬 SENTIMENT ANALYSIS:
${allData.sentiment ? JSON.stringify(allData.sentiment, null, 2) : 'Not available'}

📰 NEWS:
${allData.news ? JSON.stringify(allData.news, null, 2) : 'Not available'}

⛓️ ON-CHAIN DATA:
${allData.onChain ? JSON.stringify(allData.onChain, null, 2) : 'Not available'}

🎯 RISK ASSESSMENT:
${allData.risk ? JSON.stringify(allData.risk, null, 2) : 'Not available'}

🔮 PREDICTIONS:
${allData.predictions ? JSON.stringify(allData.predictions, null, 2) : 'Not available'}

💰 DEFI METRICS:
${allData.defi ? JSON.stringify(allData.defi, null, 2) : 'Not available'}

Provide comprehensive JSON analysis with these exact fields:
{
  "summary": "Executive summary (2-3 paragraphs)",
  "confidence": 85,
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "market_outlook": "24-48 hour outlook",
  "risk_factors": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "technical_summary": "Technical indicator summary",
  "sentiment_summary": "Social sentiment summary",
  "recommendation": "Buy|Hold|Sell with reasoning"
}

Be specific, actionable, and data-driven.`;
```

**Prompt Characteristics**:
- Length: 5,000-15,000 characters (depending on data)
- Format: Structured sections with emojis
- Data: Complete JSON from all 5 sources
- Instructions: Specific JSON schema required
- Tone: Professional, data-driven, actionable

---

## 🔌 OpenAI Responses API Call

### API Configuration

```typescript
const model = 'gpt-5.1';
const reasoningEffort = 'low'; // Fast response (1-2 seconds)

const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: model,
    input: `You are an expert cryptocurrency analyst. Analyze this data and respond only with valid JSON.\n\n${prompt}`,
    reasoning: {
      effort: reasoningEffort // low = 1-2 seconds
    },
    text: {
      verbosity: 'medium'
    },
    max_output_tokens: 4000,
  }),
  signal: AbortSignal.timeout(180000), // 3 MINUTES (180 seconds)
});
```

### Reasoning Effort Levels

| Effort | Duration | Use Case | Cost |
|--------|----------|----------|------|
| **low** | 1-2s | Quick analysis, simple categorization | $ |
| **medium** | 3-5s | Balanced analysis, market insights | $$ |
| **high** | 5-10s | Deep analysis, complex reasoning | $$$ |

**UCIE Uses**: `low` (1-2 seconds)
- Fast response for user experience
- Sufficient for structured data analysis
- Cost-effective for high-volume usage

### Timeout Configuration

```typescript
signal: AbortSignal.timeout(180000) // 3 MINUTES
```

**Why 3 minutes?**
- GPT-5.1 with low reasoning: 1-2 seconds typical
- Network latency: 500ms-1s
- Retry buffer: 1-2 minutes
- Safety margin: Prevents infinite hangs

---

## 🛡️ Bulletproof Response Parsing

### Extraction Process

```typescript
// Import utility functions
const { extractResponseText, validateResponseText } = await import('../../../utils/openai');

// Extract text from response (handles multiple formats)
const analysisText = extractResponseText(data, true); // true = debug mode

// Validate text is not empty
validateResponseText(analysisText, model, data);
```

### Response Formats Handled

1. **Standard Chat Completions API**:
```json
{
  "choices": [{
    "message": {
      "content": "JSON analysis here..."
    }
  }]
}
```

2. **Responses API (simple)**:
```json
{
  "output_text": "JSON analysis here..."
}
```

3. **Responses API (complex)**:
```json
{
  "output": [{
    "content": [{
      "type": "text",
      "text": "JSON analysis here..."
    }]
  }]
}
```

### JSON Parsing with Cleanup

```typescript
let analysis: any;

try {
  // Try direct parse first
  analysis = JSON.parse(analysisText);
  console.log(`✅ Direct JSON parse succeeded`);
  
} catch (parseError) {
  console.warn(`⚠️ Initial JSON parse failed, engaging cleanup...`);
  
  try {
    // Clean up common issues
    let cleanedText = analysisText.trim()
      .replace(/^```json\s*/i, '')        // Remove ```json
      .replace(/^```\s*/i, '')            // Remove ```
      .replace(/\s*```$/i, '')            // Remove trailing ```
      .replace(/^[^{]*({)/s, '$1')        // Remove text before {
      .replace(/(})[^}]*$/s, '$1')        // Remove text after }
      .replace(/,(\s*])/g, '$1')          // Remove trailing commas in arrays
      .replace(/,(\s*})/g, '$1')          // Remove trailing commas in objects
      .replace(/(\d+)\.(\s*[,\]}])/g, '$1$2') // Fix decimal issues
      .replace(/,\s*,/g, ',');            // Remove double commas
    
    analysis = JSON.parse(cleanedText);
    console.log(`✅ JSON parse succeeded after cleanup`);
    
  } catch (cleanupError) {
    console.error(`❌ All parsing attempts failed`);
    throw new Error(`Invalid JSON from ${model}`);
  }
}

// Validate structure
if (!analysis || typeof analysis !== 'object') {
  throw new Error('Parsed analysis is not a valid object');
}
```

### Error Handling

```typescript
try {
  // ... GPT-5.1 processing ...
  
} catch (error) {
  let errorMessage = 'Analysis failed';
  
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('abort')) {
      errorMessage = 'Analysis timed out after 3 minutes';
    } else if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API key issue';
    } else {
      errorMessage = error.message;
    }
  }
  
  // Update job status to error
  await query(
    `UPDATE ucie_openai_jobs 
     SET status = $1, error = $2, updated_at = NOW(), completed_at = NOW()
     WHERE id = $3`,
    ['error', errorMessage, jobId]
  );
}
```

---

## 📊 Database Storage

### Job Creation

```sql
INSERT INTO ucie_openai_jobs (
  symbol,
  user_id,
  status,
  context_data,
  created_at,
  updated_at
) VALUES (
  'BTC',
  123,
  'queued',
  '{"collectedData": {...}, "context": {...}}',
  NOW(),
  NOW()
) RETURNING id, status;
```

### Status Updates

```sql
-- Processing started
UPDATE ucie_openai_jobs 
SET status = 'processing',
    progress = 'Analyzing with GPT-5.1...',
    updated_at = NOW()
WHERE id = 456;

-- Analysis completed
UPDATE ucie_openai_jobs 
SET status = 'completed',
    result = '{"summary": "...", "confidence": 85, ...}',
    progress = 'Analysis complete!',
    updated_at = NOW(),
    completed_at = NOW()
WHERE id = 456;

-- Analysis failed
UPDATE ucie_openai_jobs 
SET status = 'error',
    error = 'Analysis timed out after 3 minutes',
    updated_at = NOW(),
    completed_at = NOW()
WHERE id = 456;
```

### Result Storage

```json
{
  "summary": "Bitcoin shows strong bullish momentum with institutional demand driving prices higher. Technical indicators confirm uptrend with RSI at 58.5 (neutral) and MACD showing bullish crossover. Social sentiment is positive at 72/100 with Fear & Greed Index at 68 (Greed). On-chain metrics show 3 whale transactions totaling $28.5M in the last 30 minutes, indicating accumulation.",
  
  "confidence": 85,
  
  "key_insights": [
    "Institutional ETF inflows reached $2.1B, driving price above $95,000",
    "Technical breakout confirmed with all EMAs aligned bullishly",
    "Social sentiment strongly positive with 117 posts and 402M interactions",
    "Whale accumulation detected with 3 large transactions (>50 BTC each)",
    "Fear & Greed Index at 68 indicates market greed but not extreme"
  ],
  
  "market_outlook": "Short-term outlook is bullish with continued upward momentum likely over the next 24-48 hours. Price may test $96,500 resistance level. Watch for profit-taking at psychological $100,000 level.",
  
  "risk_factors": [
    "Overbought conditions may trigger short-term correction",
    "High leverage in derivatives markets increases volatility risk",
    "Regulatory uncertainty remains a long-term concern"
  ],
  
  "opportunities": [
    "Breakout above $96,500 could trigger momentum to $100,000",
    "Institutional adoption accelerating with ETF demand",
    "On-chain metrics support continued accumulation phase"
  ],
  
  "technical_summary": "All major indicators bullish. RSI at 58.5 (neutral, room to run). MACD bullish crossover. EMAs aligned (9>21>50). Bollinger Bands middle position. Multi-timeframe consensus: bullish.",
  
  "sentiment_summary": "Overall sentiment 72/100 (bullish). Fear & Greed Index 68 (Greed). LunarCrush Galaxy Score 65. Reddit mentions up 45 in 24h. Social volume increasing.",
  
  "recommendation": "BUY - Strong bullish momentum supported by technical, sentiment, and on-chain data. Entry: $95,000-$95,500. Target: $96,500-$98,000. Stop-loss: $93,500."
}
```

---

## ⏱️ Performance Metrics

### Typical Processing Times

| Phase | Duration | Notes |
|-------|----------|-------|
| Job Creation | 50-100ms | Database insert |
| Prompt Building | 10-50ms | String concatenation |
| OpenAI API Call | 1-2 seconds | GPT-5.1 with low reasoning |
| Response Parsing | 10-50ms | JSON extraction and cleanup |
| Database Storage | 50-100ms | Result update |
| **Total** | **1.5-2.5 seconds** | End-to-end |

### Polling Behavior

```typescript
// Frontend polling configuration
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_ATTEMPTS = 600;   // 30 minutes (600 × 3s = 1800s)

useEffect(() => {
  if (!gptJobId) return;
  
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    
    if (attempts > MAX_ATTEMPTS) {
      clearInterval(interval);
      setError('Analysis timed out after 30 minutes');
      return;
    }
    
    const response = await fetch(`/api/ucie/openai-summary-poll/${gptJobId}`);
    const data = await response.json();
    
    if (data.status === 'completed') {
      setGptAnalysis(JSON.parse(data.result));
      clearInterval(interval);
    } else if (data.status === 'error') {
      setError(data.error);
      clearInterval(interval);
    }
    
    setElapsedTime(data.elapsedTime);
  }, POLL_INTERVAL);
  
  return () => clearInterval(interval);
}, [gptJobId]);
```

---

## 🔍 Debugging & Monitoring

### Console Logging

```typescript
console.log(`🚀 Starting GPT-5.1 analysis for ${symbol}...`);
console.log(`✅ Job created: ${jobId}`);
console.log(`🔥 Starting async job processing for ${jobId}...`);
console.log(`🔄 Job ${jobId}: Processing ${symbol} analysis...`);
console.log(`✅ Job ${jobId}: Status updated to 'processing'`);
console.log(`📡 Calling OpenAI Responses API with ${model} (reasoning: ${reasoningEffort})...`);
console.log(`✅ ${model} Responses API responded in ${openaiTime}ms with status ${response.status}`);
console.log(`✅ Got ${model} response text (${analysisText.length} chars)`);
console.log(`✅ Direct JSON parse succeeded`);
console.log(`✅ Analysis object validated, keys: ${Object.keys(analysis).join(', ')}`);
console.log(`✅ Job ${jobId} completed in ${processingTime}ms`);
console.log(`✅ Job ${jobId}: Analysis completed and stored`);
```

### Error Logging

```typescript
console.error(`❌ Job ${jobId} FAILED after ${processingTime}ms:`, error);
console.error(`❌ ${model} Responses API error: ${response.status}`, errorText);
console.error(`❌ All parsing attempts failed`);
console.error(`❌ Failed to update job status:`, dbError);
```

### Database Monitoring

```sql
-- Check job status distribution
SELECT status, COUNT(*) as count
FROM ucie_openai_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check average processing time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - created_at))) as min_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_seconds
FROM ucie_openai_jobs
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Check error rate
SELECT 
  COUNT(CASE WHEN status = 'error' THEN 1 END) * 100.0 / COUNT(*) as error_rate_percent
FROM ucie_openai_jobs
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

**Status**: ✅ **COMPLETE GPT-5.1 PROCESSING DOCUMENTATION**  
**Model**: GPT-5.1 with Responses API  
**Reasoning**: Low effort (1-2 seconds)  
**Timeout**: 3 minutes (180 seconds)  
**Polling**: 3-second intervals, 30-minute max  
**Success Rate**: >95% (target)
