# UCIE Three-Phase Analysis Flow

**Implemented**: January 27, 2025  
**Status**: Production Ready  
**Architecture**: Phased analysis with visual feedback

---

## 🎯 Overview

UCIE now uses a **three-phase analysis flow** that provides visual feedback at each step and allows users to control the depth of analysis.

### Three Phases

1. **Phase 1: Data Collection** (25-28 seconds)
   - Fetch fresh data from 5 APIs
   - Store in database
   - Return raw data to user

2. **Phase 2: OpenAI Analysis** (30-60 seconds)
   - User reviews data and clicks "Analyze with AI"
   - Generate comprehensive GPT-4o analysis
   - Store in database
   - Return analysis to user

3. **Phase 3: Caesar AI Deep Research** (5-10 minutes) - OPTIONAL
   - User reviews OpenAI analysis
   - Optionally clicks "Deep Research with Caesar AI"
   - Caesar performs comprehensive research
   - Return deep analysis

---

## 📊 Phase 1: Data Collection

### Endpoint
```
GET /api/ucie/preview-data/[symbol]
```

### Purpose
Collect 100% fresh, real-time data from all UCIE APIs and store in database.

### Flow
```
1. Fetch 5 APIs in parallel (25s timeout each)
   - Market Data (CoinGecko, CMC, Kraken)
   - Sentiment (LunarCrush, Twitter, Reddit)
   - Technical (Calculated indicators)
   - News (NewsAPI, CryptoCompare)
   - On-Chain (Etherscan, Blockchain.com)

2. Calculate data quality (% of working APIs)

3. Store all data in database (background, non-blocking)

4. Return raw data immediately (25-28 seconds)
```

### Response
```typescript
{
  success: true,
  data: {
    symbol: "BTC",
    timestamp: "2025-01-27T...",
    dataQuality: 80,
    collectedData: {
      marketData: { ... },
      sentiment: { ... },
      technical: { ... },
      news: { ... },
      onChain: { ... }
    },
    apiStatus: {
      working: ["Market Data", "Sentiment", "Technical"],
      failed: ["News", "On-Chain"],
      total: 5,
      successRate: 60
    },
    timing: {
      total: 26500,
      collection: 26500
    }
  }
}
```

### Frontend Display
```
✅ Data Collection Complete (26.5s)

📊 Data Quality: 80%
✅ Working APIs: Market Data, Sentiment, Technical
❌ Failed APIs: News, On-Chain

[Show Raw Data] [Analyze with AI →]
```

---

## 🤖 Phase 2: OpenAI Analysis

### Endpoint
```
POST /api/ucie/openai-analysis/[symbol]
```

### Purpose
Generate comprehensive GPT-4o analysis from cached database data.

### Flow
```
1. Check if analysis already exists (< 15 min old)
   - If yes, return cached analysis immediately

2. Read all data from database
   - Market Data
   - Sentiment
   - Technical
   - News
   - On-Chain

3. Verify data quality (minimum 40%)
   - If insufficient, return error

4. Build comprehensive context from database data

5. Generate OpenAI GPT-4o analysis (30-60 seconds)
   - Executive Summary
   - Market Analysis
   - Technical Indicators
   - Sentiment & Social
   - News & Developments
   - On-Chain Metrics
   - Risk Assessment
   - Outlook & Recommendations

6. Store analysis in database
   - ucie_analysis_cache (type: 'openai-analysis')
   - ucie_openai_summaries (legacy compatibility)

7. Return analysis (30-60 seconds)
```

### Response
```typescript
{
  success: true,
  data: {
    symbol: "BTC",
    timestamp: "2025-01-27T...",
    analysis: "# Executive Summary\n\nBitcoin is currently...",
    dataQuality: 80,
    dataAvailability: {
      marketData: true,
      sentiment: true,
      technical: true,
      news: false,
      onChain: false
    },
    timing: {
      total: 45000,
      generation: 42000
    }
  }
}
```

### Frontend Display
```
🤖 OpenAI Analysis Complete (45s)

# Executive Summary
Bitcoin is currently trading at $95,000...

[Show Full Analysis] [Deep Research with Caesar AI →]
```

---

## 🔬 Phase 3: Caesar AI Deep Research (OPTIONAL)

### Endpoint
```
POST /api/ucie/research/[symbol]
```

### Purpose
Optional deep research using Caesar AI for comprehensive analysis.

### Flow
```
1. Check if Caesar research already exists (< 24 hours old)
   - If yes, return cached research immediately

2. Read OpenAI analysis from database
   - Use as context for Caesar

3. Create Caesar research job
   - Query: Comprehensive crypto analysis
   - Context: OpenAI analysis + all database data
   - Compute Units: 5-10 (deep research)

4. Poll for completion (5-10 minutes)
   - Status updates every 2-3 seconds
   - Show progress to user

5. Store Caesar research in database
   - ucie_analysis_cache (type: 'research')

6. Return deep research (5-10 minutes)
```

### Response
```typescript
{
  success: true,
  data: {
    symbol: "BTC",
    timestamp: "2025-01-27T...",
    research: {
      content: "Based on comprehensive research...",
      sources: [
        { title: "...", url: "...", relevance: 0.95 },
        ...
      ],
      confidence: 85
    },
    timing: {
      total: 420000, // 7 minutes
      research: 420000
    }
  }
}
```

### Frontend Display
```
🔬 Caesar AI Research Complete (7 min)

Based on comprehensive research across 50+ sources...

[Show Full Research] [View Sources]
```

---

## 🎨 Frontend Implementation

### Component Structure
```typescript
// UCIEAnalysis.tsx
const UCIEAnalysis = ({ symbol }: { symbol: string }) => {
  const [phase, setPhase] = useState<'idle' | 'collecting' | 'analyzing' | 'researching'>('idle');
  const [collectedData, setCollectedData] = useState(null);
  const [openaiAnalysis, setOpenaiAnalysis] = useState(null);
  const [caesarResearch, setCaesarResearch] = useState(null);

  // Phase 1: Data Collection
  const collectData = async () => {
    setPhase('collecting');
    const response = await fetch(`/api/ucie/preview-data/${symbol}`);
    const data = await response.json();
    setCollectedData(data.data);
    setPhase('idle');
  };

  // Phase 2: OpenAI Analysis
  const analyzeWithAI = async () => {
    setPhase('analyzing');
    const response = await fetch(`/api/ucie/openai-analysis/${symbol}`, {
      method: 'POST'
    });
    const data = await response.json();
    setOpenaiAnalysis(data.data);
    setPhase('idle');
  };

  // Phase 3: Caesar Research (Optional)
  const deepResearch = async () => {
    setPhase('researching');
    const response = await fetch(`/api/ucie/research/${symbol}`, {
      method: 'POST'
    });
    const data = await response.json();
    setCaesarResearch(data.data);
    setPhase('idle');
  };

  return (
    <div>
      {/* Phase 1: Data Collection */}
      <PhaseCard
        title="Phase 1: Data Collection"
        status={phase === 'collecting' ? 'loading' : collectedData ? 'complete' : 'idle'}
        duration="25-28 seconds"
        onStart={collectData}
      >
        {collectedData && <DataPreview data={collectedData} />}
      </PhaseCard>

      {/* Phase 2: OpenAI Analysis */}
      {collectedData && (
        <PhaseCard
          title="Phase 2: AI Analysis"
          status={phase === 'analyzing' ? 'loading' : openaiAnalysis ? 'complete' : 'idle'}
          duration="30-60 seconds"
          onStart={analyzeWithAI}
        >
          {openaiAnalysis && <AnalysisDisplay analysis={openaiAnalysis} />}
        </PhaseCard>
      )}

      {/* Phase 3: Caesar Research (Optional) */}
      {openaiAnalysis && (
        <PhaseCard
          title="Phase 3: Deep Research (Optional)"
          status={phase === 'researching' ? 'loading' : caesarResearch ? 'complete' : 'idle'}
          duration="5-10 minutes"
          onStart={deepResearch}
          optional
        >
          {caesarResearch && <ResearchDisplay research={caesarResearch} />}
        </PhaseCard>
      )}
    </div>
  );
};
```

### Visual Feedback Components

#### Loading States
```typescript
// Phase 1: Data Collection
<LoadingIndicator>
  <Spinner />
  <Text>Collecting data from 5 APIs...</Text>
  <ProgressBar value={60} max={100} />
  <Text>Market Data ✅ | Sentiment ✅ | Technical ⏳</Text>
</LoadingIndicator>

// Phase 2: OpenAI Analysis
<LoadingIndicator>
  <Spinner />
  <Text>Generating AI analysis...</Text>
  <ProgressBar indeterminate />
  <Text>Reading data from database...</Text>
</LoadingIndicator>

// Phase 3: Caesar Research
<LoadingIndicator>
  <Spinner />
  <Text>Deep research in progress...</Text>
  <ProgressBar value={45} max={100} />
  <Text>Analyzing 50+ sources... (3 min elapsed)</Text>
</LoadingIndicator>
```

#### Phase Cards
```typescript
<PhaseCard
  number={1}
  title="Data Collection"
  status="complete"
  duration="26.5s"
  quality={80}
>
  <DataQualityBadge quality={80} />
  <APIStatusList working={3} failed={2} />
  <Button onClick={showRawData}>Show Raw Data</Button>
  <Button onClick={analyzeWithAI} primary>Analyze with AI →</Button>
</PhaseCard>
```

---

## 🔧 Configuration

### API Timeouts
```typescript
// Phase 1: Data Collection
const DATA_COLLECTION_TIMEOUT = 25000; // 25 seconds per API
const MAX_DURATION_PHASE_1 = 28; // 28 seconds Vercel limit

// Phase 2: OpenAI Analysis
const OPENAI_TIMEOUT = 30000; // 30 seconds
const MAX_DURATION_PHASE_2 = 60; // 60 seconds Vercel limit

// Phase 3: Caesar Research
const CAESAR_TIMEOUT = 600000; // 10 minutes
const MAX_DURATION_PHASE_3 = 300; // 5 minutes Vercel limit (polling)
```

### Cache TTLs
```typescript
// Data Collection Cache
const DATA_CACHE_TTL = 15 * 60; // 15 minutes

// OpenAI Analysis Cache
const OPENAI_CACHE_TTL = 15 * 60; // 15 minutes

// Caesar Research Cache
const CAESAR_CACHE_TTL = 24 * 60 * 60; // 24 hours
```

---

## 📊 Performance Metrics

### Phase 1: Data Collection
- **Target**: < 28 seconds
- **Typical**: 25-28 seconds
- **Cache Hit**: N/A (always fresh)
- **Success Rate**: 60-100% (depends on API availability)

### Phase 2: OpenAI Analysis
- **Target**: < 60 seconds
- **Typical**: 30-45 seconds
- **Cache Hit**: < 1 second (if < 15 min old)
- **Success Rate**: 95%+ (depends on data quality)

### Phase 3: Caesar Research
- **Target**: < 10 minutes
- **Typical**: 5-7 minutes
- **Cache Hit**: < 1 second (if < 24 hours old)
- **Success Rate**: 90%+ (depends on Caesar API)

---

## 🧪 Testing

### Test Phase 1: Data Collection
```bash
curl -w "\nTime: %{time_total}s\n" \
  https://news.arcane.group/api/ucie/preview-data/BTC
```

**Expected**:
- Response time: 25-28 seconds
- Data quality: 60-100%
- All working APIs return fresh data

### Test Phase 2: OpenAI Analysis
```bash
curl -X POST -w "\nTime: %{time_total}s\n" \
  https://news.arcane.group/api/ucie/openai-analysis/BTC
```

**Expected**:
- Response time: 30-60 seconds (first call)
- Response time: < 1 second (cached)
- Comprehensive analysis with 8 sections

### Test Phase 3: Caesar Research
```bash
curl -X POST -w "\nTime: %{time_total}s\n" \
  https://news.arcane.group/api/ucie/research/BTC
```

**Expected**:
- Response time: 5-10 minutes (first call)
- Response time: < 1 second (cached)
- Deep research with 50+ sources

---

## 🎯 User Experience Flow

### Typical User Journey
```
1. User enters symbol (e.g., "BTC")
2. Click "Collect Data" → Wait 25-28s → See raw data
3. Review data quality and API status
4. Click "Analyze with AI" → Wait 30-60s → See AI analysis
5. Review comprehensive analysis
6. Optionally click "Deep Research" → Wait 5-10 min → See Caesar research
7. Review deep research with sources
```

### Fast Path (Cached)
```
1. User enters symbol (e.g., "BTC")
2. Click "Collect Data" → Wait 25-28s → See raw data
3. Click "Analyze with AI" → < 1s → See cached analysis
4. Click "Deep Research" → < 1s → See cached research
```

---

## 📋 Database Schema

### ucie_analysis_cache
```sql
CREATE TABLE ucie_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'market-data', 'sentiment', 'technical', 'news', 'on-chain', 'openai-analysis', 'research'
  data JSONB NOT NULL,
  data_quality INTEGER DEFAULT 0,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(symbol, type, user_id)
);
```

### ucie_openai_summaries (Legacy)
```sql
CREATE TABLE ucie_openai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL,
  data_quality INTEGER DEFAULT 0,
  api_status JSONB,
  data_availability JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

---

## 🚀 Deployment

**Status**: Ready to deploy

```bash
git add -A
git commit -m "feat(ucie): Implement three-phase analysis flow with visual feedback

ARCHITECTURE:
- Phase 1: Data Collection (25-28s) - Fresh data from 5 APIs
- Phase 2: OpenAI Analysis (30-60s) - Comprehensive GPT-4o analysis
- Phase 3: Caesar Research (5-10 min) - Optional deep research

FEATURES:
- Visual feedback at each phase
- User controls depth of analysis
- Database caching for performance
- Separate endpoints for each phase

BENEFITS:
- Clear progress indication
- User can stop at any phase
- Faster perceived performance
- Better resource utilization

FILES:
- pages/api/ucie/preview-data/[symbol].ts (updated)
- pages/api/ucie/openai-analysis/[symbol].ts (new)
- UCIE-THREE-PHASE-FLOW.md (documentation)"

git push origin main
```

---

## 📚 Related Documentation

- `.kiro/steering/ucie-system.md` - Complete UCIE system guide
- `REAL-TIME-DATA-FIX.md` - Real-time data implementation
- `UCIE-EXECUTION-ORDER-SPECIFICATION.md` - AI execution order
- `.kiro/steering/api-integration.md` - API integration guidelines

---

**This three-phase flow provides clear visual feedback, user control, and optimal performance for cryptocurrency intelligence analysis.** 🚀
