# UCIE Data Replacement System

**Date**: January 27, 2025  
**Status**: ✅ Implemented  
**Feature**: Automatic data replacement with every query

---

## 🎯 Overview

The UCIE system now **automatically replaces** old data in Supabase with freshly fetched API data on every query. This ensures Caesar AI always gets the most current information.

---

## 📊 New Database Tables

### 1. OpenAI Analysis Table (`ucie_openai_analysis`)

Stores OpenAI/ChatGPT summaries with automatic replacement.

**Schema**:
```sql
CREATE TABLE ucie_openai_analysis (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  
  -- OpenAI Summary
  summary_text TEXT NOT NULL,
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- API Status
  api_status JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One analysis per symbol per user
  UNIQUE(symbol, user_id)
);
```

**Features**:
- UPSERT on conflict (replaces old data)
- Tracks which APIs succeeded/failed
- Data quality scoring
- Automatic timestamp updates

### 2. Caesar Research Table (`ucie_caesar_research`)

Stores complete Caesar AI research results with automatic replacement.

**Schema**:
```sql
CREATE TABLE ucie_caesar_research (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
  user_email VARCHAR(255),
  
  -- Caesar AI Job Info
  job_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  
  -- Research Results (FULL analysis)
  research_data JSONB NOT NULL DEFAULT '{}',
  
  -- Analysis Components
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  recommendation VARCHAR(50),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Sources
  sources JSONB DEFAULT '[]',
  source_count INTEGER DEFAULT 0,
  
  -- Quality Metrics
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  analysis_depth VARCHAR(50),
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One research per symbol per user
  UNIQUE(symbol, user_id)
);
```

**Features**:
- UPSERT on conflict (replaces old data)
- Stores COMPLETE Caesar AI analysis
- Tracks job status and timing
- Source citations
- Quality metrics

---

## 🔄 Data Replacement Flow

### Complete Flow with Automatic Replacement

```
User clicks BTC/ETH button
    ↓
1. INVALIDATE OLD CACHE
   - Clear ucie_analysis_cache for all types
   - Ensures fresh data collection
    ↓
2. FETCH FRESH API DATA (parallel)
   - Market Data → REPLACE in ucie_analysis_cache
   - Sentiment → REPLACE in ucie_analysis_cache
   - News → REPLACE in ucie_analysis_cache
   - Technical → REPLACE in ucie_analysis_cache
   - On-Chain → REPLACE in ucie_analysis_cache
   - Risk → REPLACE in ucie_analysis_cache
   - Predictions → REPLACE in ucie_analysis_cache
   - Derivatives → REPLACE in ucie_analysis_cache
   - DeFi → REPLACE in ucie_analysis_cache
    ↓
3. GENERATE OPENAI SUMMARY
   - Aggregate all fresh data
   - Call OpenAI GPT-4o
   - REPLACE in ucie_openai_analysis table
    ↓
4. SHOW PREVIEW TO USER
   - Display fresh data summary
   - User confirms to continue
    ↓
5. CAESAR AI ANALYSIS
   - Retrieve ALL fresh data from database
   - Include OpenAI summary
   - Call Caesar AI
   - REPLACE in ucie_caesar_research table
    ↓
6. DISPLAY COMPLETE ANALYSIS
   - Show Caesar AI results
   - All data is fresh and current
```

---

## 💾 Storage Functions

### OpenAI Analysis Storage

**File**: `lib/ucie/analysisStorage.ts`

```typescript
// Store OpenAI analysis (REPLACES old data)
await storeOpenAIAnalysis(
  symbol,
  summaryText,
  dataQualityScore,
  apiStatus,
  userId,
  userEmail
);

// Get OpenAI analysis
const openai = await getOpenAIAnalysis(symbol, userId);
```

**How it works**:
```sql
INSERT INTO ucie_openai_analysis (...)
VALUES (...)
ON CONFLICT (symbol, user_id) 
DO UPDATE SET
  summary_text = EXCLUDED.summary_text,
  data_quality_score = EXCLUDED.data_quality_score,
  api_status = EXCLUDED.api_status,
  updated_at = NOW()
```

### Caesar Research Storage

```typescript
// Store Caesar research (REPLACES old data)
await storeCaesarResearch(
  symbol,
  jobId,
  status,
  researchData,
  userId,
  userEmail,
  {
    executiveSummary,
    keyFindings,
    opportunities,
    risks,
    recommendation,
    confidenceScore,
    sources,
    dataQualityScore,
    analysisDepth,
    startedAt,
    completedAt,
    durationSeconds
  }
);

// Get Caesar research
const caesar = await getCaesarResearch(symbol, userId);

// Update status
await updateCaesarResearchStatus(symbol, 'completed', userId, {
  completedAt: new Date(),
  durationSeconds: 420
});
```

**How it works**:
```sql
INSERT INTO ucie_caesar_research (...)
VALUES (...)
ON CONFLICT (symbol, user_id)
DO UPDATE SET
  job_id = EXCLUDED.job_id,
  status = EXCLUDED.status,
  research_data = EXCLUDED.research_data,
  executive_summary = EXCLUDED.executive_summary,
  -- ... all fields updated
  updated_at = NOW()
```

---

## 🎯 Key Features

### 1. Automatic Replacement

**Before**: Old data might be used  
**After**: Every query replaces old data with fresh data

**Implementation**: UPSERT (INSERT ... ON CONFLICT UPDATE)

### 2. Complete Caesar Storage

**Before**: Caesar analysis not stored  
**After**: FULL Caesar AI analysis stored in database

**Includes**:
- Complete research data (JSONB)
- Executive summary
- Key findings
- Opportunities
- Risks
- Recommendation
- Confidence score
- Sources with citations
- Quality metrics
- Timing information

### 3. OpenAI Summary Storage

**Before**: OpenAI summary in cache only  
**After**: Dedicated table for OpenAI analysis

**Includes**:
- Complete summary text
- Data quality score
- API status (which APIs worked/failed)
- Timestamps

### 4. User Isolation

**Feature**: Each user gets their own data

**Implementation**: `UNIQUE(symbol, user_id)` constraint

**Benefit**: Multi-user support without data conflicts

---

## 📋 Migration

### Run Migration

```bash
# Run the migration
npx tsx scripts/run-migrations.ts

# Or manually
psql $DATABASE_URL -f migrations/005_openai_caesar_tables.sql
```

### Verify Tables

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('ucie_openai_analysis', 'ucie_caesar_research');

-- Check table structure
\d ucie_openai_analysis
\d ucie_caesar_research
```

---

## 🔄 Usage Examples

### Example 1: Store OpenAI Analysis

```typescript
import { storeOpenAIAnalysis } from '../lib/ucie/analysisStorage';

// After generating OpenAI summary
await storeOpenAIAnalysis(
  'BTC',
  'Comprehensive summary of Bitcoin analysis...',
  95,
  {
    marketData: true,
    sentiment: true,
    news: true,
    technical: true,
    onChain: true,
    risk: true,
    predictions: true,
    derivatives: false,
    defi: false
  },
  userId,
  userEmail
);

console.log('✅ OpenAI analysis stored (replaced old data)');
```

### Example 2: Store Caesar Research

```typescript
import { storeCaesarResearch } from '../lib/ucie/analysisStorage';

// After Caesar AI completes
await storeCaesarResearch(
  'BTC',
  'caesar-job-123',
  'completed',
  {
    // FULL Caesar AI response
    content: '...',
    transformed_content: '...',
    results: [...]
  },
  userId,
  userEmail,
  {
    executiveSummary: 'Bitcoin shows strong bullish momentum...',
    keyFindings: [
      'Price broke above $95,000 resistance',
      'On-chain metrics show accumulation',
      'Institutional interest increasing'
    ],
    opportunities: [
      'Potential breakout to $100,000',
      'Strong support at $90,000'
    ],
    risks: [
      'Overbought RSI on daily chart',
      'Potential profit-taking at ATH'
    ],
    recommendation: 'BUY',
    confidenceScore: 85,
    sources: [
      { title: 'Source 1', url: '...', score: 0.95 },
      { title: 'Source 2', url: '...', score: 0.88 }
    ],
    dataQualityScore: 95,
    analysisDepth: 'comprehensive',
    startedAt: new Date('2025-01-27T10:00:00Z'),
    completedAt: new Date('2025-01-27T10:07:00Z'),
    durationSeconds: 420
  }
);

console.log('✅ Caesar research stored (replaced old data)');
```

### Example 3: Retrieve Complete Analysis

```typescript
import { getCompleteAnalysis } from '../lib/ucie/analysisStorage';

// Get both OpenAI and Caesar analysis
const analysis = await getCompleteAnalysis('BTC', userId);

if (analysis) {
  console.log('OpenAI Summary:', analysis.openai?.summaryText);
  console.log('Caesar Status:', analysis.caesar?.status);
  console.log('Caesar Recommendation:', analysis.caesar?.recommendation);
  console.log('Confidence:', analysis.caesar?.confidenceScore);
}
```

---

## ✅ Benefits

### 1. Always Fresh Data
- Every query fetches new API data
- Old data automatically replaced
- No stale information

### 2. Complete Storage
- Full Caesar AI analysis stored
- OpenAI summaries preserved
- All metadata tracked

### 3. Easy Retrieval
- Simple functions to get data
- User-specific isolation
- Fast database queries

### 4. Audit Trail
- Timestamps for all updates
- Track when data was fetched
- Monitor analysis frequency

### 5. Multi-User Support
- Each user gets their own data
- No conflicts between users
- Privacy maintained

---

## 🎉 Summary

**The UCIE system now:**

✅ **Replaces old data** with fresh API data on every query  
✅ **Stores OpenAI summaries** in dedicated table  
✅ **Stores complete Caesar AI analysis** with all details  
✅ **Uses UPSERT** for automatic replacement  
✅ **Tracks metadata** (timestamps, quality, sources)  
✅ **Supports multiple users** with data isolation  

**Result**: Caesar AI always gets the most current, comprehensive data for analysis.

---

**Status**: ✅ **IMPLEMENTED**  
**Migration**: `migrations/005_openai_caesar_tables.sql`  
**Storage**: `lib/ucie/analysisStorage.ts`  
**Ready**: Production deployment

**Every query now replaces old data with fresh data. Caesar AI gets the best possible context.** 🚀
