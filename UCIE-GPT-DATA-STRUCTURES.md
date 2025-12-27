# UCIE GPT-5.1 Analysis - Data Structures & Component Interactions

**Last Updated**: January 27, 2025  
**Purpose**: Detailed reference for data shapes and component communication

---

## 📦 Data Structures

### 1. Frontend Request (DataPreviewModal → API)

**Sent to**: `POST /api/ucie/openai-summary-start/[symbol]`

```typescript
interface AnalysisStartRequest {
  collectedData: {
    marketData: {
      success: boolean;
      priceAggregation?: {
        prices: Array<{ source: string; price: number }>;
        vwap: number;
      };
      price?: number;
      volume24h?: number;
      marketCap?: number;
      change24h?: number;
    };
    sentiment: {
      success: boolean;
      overallScore?: number;
      fearGreedIndex?: number;
      lunarCrush?: any;
      reddit?: any;
      coinMarketCap?: any;
      coinGecko?: any;
      dataQuality?: number;
    };
    technical: {
      success: boolean;
      indicators?: {
        rsi?: number;
        macd?: number;
        ema?: number;
        bollingerBands?: any;
      };
      signals?: any;
    };
    news: {
      success: boolean;
      articles?: Array<{
        title: string;
        description: string;
        url: string;
        source: string;
        publishedAt: string;
        sentiment?: string;
      }>;
    };
    onChain: {
      success: boolean;
      networkMetrics?: any;
      whaleActivity?: any;
      mempoolAnalysis?: any;
      dataQuality?: number;
    };
  };
  context: {
    marketData: any;
    technical: any;
    sentiment: any;
    news: any;
    onChain: any;
    dataQuality: number;
    availableData: string[];
    timestamp: string;
  };
}
```

### 2. Backend Response (API → Frontend)

**From**: `POST /api/ucie/openai-summary-start/[symbol]`

```typescript
interface AnalysisStartResponse {
  success: boolean;
  jobId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  timestamp: string;
}

// Example:
{
  "success": true,
  "jobId": "123",
  "status": "queued",
  "timestamp": "2025-01-27T14:30:00Z"
}
```

### 3. Polling Response (API → Frontend)

**From**: `GET /api/ucie/openai-summary-poll/[jobId]`

```typescript
interface PollResponse {
  success: boolean;
  status: 'queued' | 'processing' | 'completed' | 'error';
  result?: string; // JSON string of ModularAnalysis
  error?: string;
  progress?: string;
  timestamp: string;
  elapsedTime?: number;
}

// Example (Processing):
{
  "success": true,
  "status": "processing",
  "progress": "Analyzing technical indicators...",
  "timestamp": "2025-01-27T14:32:00Z",
  "elapsedTime": 120
}

// Example (Completed):
{
  "success": true,
  "status": "completed",
  "result": "{\"marketAnalysis\": {...}, \"technicalAnalysis\": {...}, ...}",
  "timestamp": "2025-01-27T14:35:00Z",
  "elapsedTime": 300
}
```

### 4. Modular Analysis Result (Stored in DB)

**Stored in**: `ucie_openai_jobs.result` (JSONB column)

```typescript
interface ModularAnalysis {
  marketAnalysis?: {
    price_trend: 'bullish' | 'bearish' | 'neutral';
    current_price_analysis: string;
    volume_analysis: string;
    market_cap_insights: string;
    key_metrics: string[];
  };
  
  technicalAnalysis?: {
    technical_outlook: 'bullish' | 'bearish' | 'neutral';
    rsi_signal: string;
    macd_signal: string;
    moving_average_trend: string;
    support_resistance_levels: string[];
  };
  
  sentimentAnalysis?: {
    overall_sentiment: 'bullish' | 'bearish' | 'neutral';
    fear_greed_interpretation: string;
    social_volume_trend: string;
    key_sentiment_drivers: string[];
  };
  
  newsAnalysis?: {
    news_sentiment: 'positive' | 'negative' | 'neutral';
    potential_market_impact: string;
    key_headlines: string[];
    important_developments: string[];
  };
  
  onChainAnalysis?: {
    on_chain_signals: 'bullish' | 'bearish' | 'neutral';
    whale_activity_summary: string;
    network_health: string;
    transaction_trends: string;
  };
  
  riskAnalysis?: {
    risk_level: 'low' | 'medium' | 'high';
    volatility_assessment: string;
    key_risks: string[];
    risk_mitigation_strategies: string[];
  };
  
  predictionsAnalysis?: {
    short_term_outlook: string;
    medium_term_outlook: string;
    prediction_confidence: string;
    key_price_levels: string[];
  };
  
  defiAnalysis?: {
    tvl_analysis: string;
    defi_adoption_trend: string;
    protocol_health: string;
    defi_opportunities: string[];
  };
  
  executiveSummary?: {
    summary: string;
    confidence: number; // 0-100
    recommendation: 'Buy' | 'Hold' | 'Sell';
    key_insights: string[];
  };
  
  timestamp: string; // ISO 8601
  processingTime: number; // milliseconds
}
```

### 5. Frontend Display Data (ModularAnalysisDisplay Props)

```typescript
interface ModularAnalysisDisplayProps {
  analysis: ModularAnalysis;
}

// Component receives parsed ModularAnalysis and renders:
// - Executive Summary (prominent)
// - 8 Analysis Cards (market, technical, sentiment, news, on-chain, risk, predictions, defi)
// - Processing time footer
```

---

## 🔄 Component Communication Flow

### DataPreviewModal.tsx

**State Management**:
```typescript
const [gptJobId, setGptJobId] = useState<number | null>(null);
const [gptStatus, setGptStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'error'>('idle');
const [gptProgress, setGptProgress] = useState<string>('');
const [gptElapsedTime, setGptElapsedTime] = useState<number>(0);
const [preview, setPreview] = useState<DataPreview | null>(null);
```

**Key Functions**:

1. **fetchDataPreview()**
   - Calls `/api/ucie/preview-data/[symbol]?refresh=true`
   - Sets `preview` state with collected data
   - Extracts `gptJobId` if analysis already started

2. **handlePreviewContinue(preview)**
   - Called when user clicks "Continue"
   - Stores preview data
   - Extracts `gptJobId` from response
   - Sets `gptJobId` → triggers polling useEffect

3. **Polling useEffect**
   - Triggered when `gptJobId` changes
   - Polls every 3 seconds
   - Updates `gptStatus`, `gptProgress`, `gptElapsedTime`
   - When completed, parses result and displays ModularAnalysisDisplay

**Rendering**:
```typescript
// While polling
<div>
  <p>GPT-5.1 Analysis in Progress...</p>
  <p>{gptProgress}</p>
  <p>Elapsed: {gptElapsedTime}s</p>
</div>

// When completed
<ModularAnalysisDisplay analysis={parsedAnalysis} />

// When error
<div>
  <p>Analysis failed: {gptProgress}</p>
</div>
```

### ModularAnalysisDisplay.tsx

**Props**:
```typescript
interface ModularAnalysisDisplayProps {
  analysis: ModularAnalysis;
}
```

**Rendering Logic**:
```typescript
function ModularAnalysisDisplay({ analysis }: ModularAnalysisDisplayProps) {
  // 1. Render Executive Summary (if available)
  if (analysis.executiveSummary) {
    return (
      <div className="bg-bitcoin-orange-10 border-2 border-bitcoin-orange">
        <h3>Executive Summary</h3>
        <p>{analysis.executiveSummary.summary}</p>
        <div>Confidence: {analysis.executiveSummary.confidence}%</div>
        <div>Recommendation: {analysis.executiveSummary.recommendation}</div>
        <ul>
          {analysis.executiveSummary.key_insights.map(insight => (
            <li>{insight}</li>
          ))}
        </ul>
      </div>
    );
  }

  // 2. Render each analysis card
  return (
    <div className="space-y-6">
      {analysis.marketAnalysis && <AnalysisCard title="Market Analysis" data={analysis.marketAnalysis} />}
      {analysis.technicalAnalysis && <AnalysisCard title="Technical Analysis" data={analysis.technicalAnalysis} />}
      {analysis.sentimentAnalysis && <AnalysisCard title="Sentiment Analysis" data={analysis.sentimentAnalysis} />}
      {analysis.newsAnalysis && <AnalysisCard title="News Analysis" data={analysis.newsAnalysis} />}
      {analysis.onChainAnalysis && <AnalysisCard title="On-Chain Analysis" data={analysis.onChainAnalysis} />}
      {analysis.riskAnalysis && <AnalysisCard title="Risk Analysis" data={analysis.riskAnalysis} />}
      {analysis.predictionsAnalysis && <AnalysisCard title="Predictions Analysis" data={analysis.predictionsAnalysis} />}
      {analysis.defiAnalysis && <AnalysisCard title="DeFi Analysis" data={analysis.defiAnalysis} />}
    </div>
  );
}
```

### AnalysisCard.tsx (Reusable Component)

**Props**:
```typescript
interface AnalysisCardProps {
  title: string;
  icon: string;
  data: any;
  fields: Array<{ label: string; key: string }>;
  listFields?: Array<{ label: string; key: string }>;
}
```

**Rendering**:
```typescript
function AnalysisCard({ title, icon, data, fields, listFields }: AnalysisCardProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
      <h4 className="text-lg font-bold text-bitcoin-orange mb-3">
        <span>{icon}</span>
        {title}
      </h4>
      
      {/* Regular fields */}
      {fields.map(field => (
        <div key={field.key}>
          <span className="text-bitcoin-white-60 text-sm">{field.label}:</span>
          <p className="text-bitcoin-white-80">{data[field.key]}</p>
        </div>
      ))}
      
      {/* List fields */}
      {listFields?.map(field => (
        <div key={field.key}>
          <span className="text-bitcoin-white-60 text-sm">{field.label}:</span>
          <ul className="mt-1 space-y-1">
            {data[field.key]?.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-bitcoin-orange">•</span>
                <span className="text-bitcoin-white-80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔌 API Implementation Details

### analyzeDataSource() Function

**Purpose**: Analyze single data source with OpenAI

**Signature**:
```typescript
async function analyzeDataSource(
  apiKey: string,
  model: string,
  symbol: string,
  dataType: string,
  data: any,
  instructions: string,
  formattedContext?: string
): Promise<any>
```

**Process**:
1. Import OpenAI SDK
2. Initialize OpenAI client with 30s timeout
3. Build prompt with data and instructions
4. Call OpenAI Responses API with `gpt-5-mini` model
5. Extract response text using `extractResponseText()`
6. Validate response using `validateResponseText()`
7. Parse JSON and return
8. On error, return error object (don't throw)

**Error Handling**:
```typescript
// Retry up to 3 times with exponential backoff
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    // OpenAI API call
    return parsed;
  } catch (error) {
    if (attempt === 3) {
      return { error: 'Analysis failed', errorMessage: error.message };
    }
    await sleep(1000 * attempt); // Exponential backoff
  }
}
```

### generateExecutiveSummary() Function

**Purpose**: Combine all analyses into executive summary

**Signature**:
```typescript
async function generateExecutiveSummary(
  apiKey: string,
  model: string,
  symbol: string,
  analysisSummary: any,
  formattedContext?: string
): Promise<any>
```

**Prompt**:
```
Generate executive summary for [symbol] based on these analyses:
[All 8 analyses as JSON]

Provide JSON with:
{
  "summary": "2-3 paragraph executive summary",
  "confidence": 85,
  "recommendation": "Buy|Hold|Sell with reasoning",
  "key_insights": ["insight 1", "insight 2"],
  "risk_factors": ["risk 1", "risk 2"]
}
```

---

## 💾 Database Operations

### Create Job

```sql
INSERT INTO ucie_openai_jobs (symbol, user_id, status, context_data, created_at, updated_at)
VALUES ('BTC', 'user-123', 'queued', '{"collectedData": {...}, "context": {...}}', NOW(), NOW())
RETURNING id, status;
```

### Update Status to Processing

```sql
UPDATE ucie_openai_jobs 
SET status = 'processing', progress = 'Analyzing market data...', updated_at = NOW()
WHERE id = 123;
```

### Heartbeat (Keep Alive)

```sql
UPDATE ucie_openai_jobs 
SET updated_at = NOW()
WHERE id = 123;
```

### Store Results

```sql
UPDATE ucie_openai_jobs 
SET status = 'completed',
    result = '{"marketAnalysis": {...}, ...}',
    progress = 'Analysis complete!',
    updated_at = NOW(),
    completed_at = NOW()
WHERE id = 123;
```

### Mark as Error

```sql
UPDATE ucie_openai_jobs 
SET status = 'error', 
    error = 'Analysis timed out',
    updated_at = NOW(),
    completed_at = NOW()
WHERE id = 123;
```

### Retrieve Job Status

```sql
SELECT id, symbol, status, result, error, progress, created_at, updated_at, completed_at
FROM ucie_openai_jobs
WHERE id = 123 AND (user_id = 'user-123' OR user_id IS NULL);
```

---

## 🎯 Null Safety Patterns

### Frontend Null Checks

```typescript
// Safe access to nested properties
const confidence = analysis?.executiveSummary?.confidence ?? 0;
const summary = analysis?.executiveSummary?.summary || 'No summary available';
const insights = analysis?.executiveSummary?.key_insights || [];

// Safe array mapping
{insights.map((insight: string, i: number) => (
  <li key={i}>{insight}</li>
))}

// Safe object iteration
{Object.entries(analysis || {}).map(([key, value]) => (
  <div key={key}>{value}</div>
))}
```

### Backend Null Checks

```typescript
// Check data exists before accessing
if (!data || typeof data !== 'object') {
  return null;
}

// Safe property access
const price = data?.price || data?.marketData?.price || 0;

// Safe array access
const articles = Array.isArray(data?.articles) ? data.articles : [];

// Safe JSON parsing
try {
  const parsed = JSON.parse(data.result);
} catch (error) {
  return { error: 'Invalid JSON' };
}
```

---

## 📊 Example Complete Flow

### 1. User Clicks "Continue" in DataPreviewModal

```typescript
// Frontend sends:
POST /api/ucie/openai-summary-start/BTC
{
  "collectedData": {
    "marketData": { "success": true, "price": 95000, ... },
    "sentiment": { "success": true, "overallScore": 75, ... },
    "technical": { "success": true, "rsi": 65, ... },
    "news": { "success": true, "articles": [...] },
    "onChain": { "success": true, "networkMetrics": {...} }
  },
  "context": { ... }
}
```

### 2. Backend Creates Job and Starts Processing

```typescript
// Backend response:
{
  "success": true,
  "jobId": "123",
  "status": "queued",
  "timestamp": "2025-01-27T14:30:00Z"
}

// Backend starts processJobAsync(123, 'BTC', collectedData, context)
// - Creates heartbeat interval
// - Updates status to 'processing'
// - Starts 9 modular analyses
```

### 3. Frontend Polls Every 3 Seconds

```typescript
// Poll 1 (at 3s):
GET /api/ucie/openai-summary-poll/123
Response: { "status": "processing", "progress": "Analyzing market data...", "elapsedTime": 3 }

// Poll 2 (at 6s):
GET /api/ucie/openai-summary-poll/123
Response: { "status": "processing", "progress": "Analyzing technical indicators...", "elapsedTime": 6 }

// ... more polls ...

// Poll 35 (at 105s):
GET /api/ucie/openai-summary-poll/123
Response: {
  "status": "completed",
  "result": "{\"marketAnalysis\": {...}, \"technicalAnalysis\": {...}, ...}",
  "elapsedTime": 105
}
```

### 4. Frontend Displays Results

```typescript
// Parse result
const analysis = JSON.parse(data.result);

// Render ModularAnalysisDisplay
<ModularAnalysisDisplay analysis={analysis} />

// Displays:
// - Executive Summary (prominent)
// - Market Analysis Card
// - Technical Analysis Card
// - Sentiment Analysis Card
// - News Analysis Card
// - On-Chain Analysis Card
// - Risk Analysis Card
// - Predictions Analysis Card
// - DeFi Analysis Card
```

---

## 🔍 Debugging Checklist

- [ ] Check `gptJobId` is set correctly
- [ ] Verify polling interval is 3 seconds
- [ ] Confirm status transitions: queued → processing → completed
- [ ] Check result is valid JSON
- [ ] Verify all 9 analyses are present
- [ ] Confirm ModularAnalysisDisplay renders without errors
- [ ] Check null safety for all nested properties
- [ ] Verify database stores result correctly
- [ ] Check elapsed time is reasonable (60-100s)
- [ ] Confirm error handling works on timeout

---

**Status**: ✅ Complete  
**Last Verified**: January 27, 2025
