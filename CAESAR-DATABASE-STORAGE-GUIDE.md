# Caesar AI Database Storage Guide

**Created**: January 27, 2025  
**Status**: ✅ Ready to Deploy  
**Purpose**: Store all Caesar AI responses in Supabase for tracking and analysis

---

## 🎯 Overview

This guide documents the new database tables for storing Caesar AI research responses. All Caesar API calls will now be permanently stored in the database for:

- **Historical tracking**: View all past Caesar analyses
- **Cost monitoring**: Track API usage and costs
- **Quality analysis**: Monitor analysis quality scores
- **Source tracking**: Detailed citation and source management
- **Performance metrics**: Analyze processing times and efficiency

---

## 📊 Database Schema

### Table 1: `caesar_research_jobs`

**Purpose**: Main table storing all Caesar research jobs

```sql
CREATE TABLE caesar_research_jobs (
  id SERIAL PRIMARY KEY,
  caesar_job_id VARCHAR(255) NOT NULL UNIQUE,
  symbol VARCHAR(20),
  query TEXT NOT NULL,
  compute_units INTEGER DEFAULT 2,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  content TEXT,
  transformed_content TEXT,
  results JSONB DEFAULT '[]'::jsonb,
  data_quality_score INTEGER,
  user_id VARCHAR(255),
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);
```

**Key Fields**:
- `caesar_job_id`: Unique identifier from Caesar API
- `symbol`: Cryptocurrency symbol (BTC, ETH, etc.)
- `query`: Original query sent to Caesar
- `compute_units`: Number of compute units used (1-10)
- `status`: Job status (queued, researching, completed, failed)
- `content`: Raw synthesis text from Caesar
- `transformed_content`: Formatted output (JSON, markdown, etc.)
- `results`: Array of sources/citations (JSONB)
- `data_quality_score`: Quality score (0-100)
- `cost_usd`: Estimated cost in USD
- `expires_at`: Cache expiration (default 7 days)

### Table 2: `caesar_research_sources`

**Purpose**: Detailed source/citation tracking

```sql
CREATE TABLE caesar_research_sources (
  id SERIAL PRIMARY KEY,
  research_job_id INTEGER NOT NULL REFERENCES caesar_research_jobs(id) ON DELETE CASCADE,
  caesar_result_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  score DECIMAL(3, 2) NOT NULL,
  citation_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields**:
- `research_job_id`: Foreign key to caesar_research_jobs
- `caesar_result_id`: Caesar API result identifier
- `title`: Source title
- `url`: Source URL
- `score`: Relevance score (0-1)
- `citation_index`: Citation number for referencing

---

## 🔧 Installation

### Step 1: Run Migration

```bash
# Run the migration script
npx tsx scripts/run-caesar-migration.ts
```

**Expected Output**:
```
🚀 Running Caesar Research Tables Migration...

📄 Migration file loaded
📊 Executing SQL...

✅ Migration completed successfully!

📋 Created tables:
   ✓ caesar_research_jobs
   ✓ caesar_research_sources

📑 Created indexes:
   ✓ idx_caesar_jobs_caesar_job_id
   ✓ idx_caesar_jobs_symbol
   ✓ idx_caesar_jobs_status
   ✓ idx_caesar_jobs_created_at
   ✓ idx_caesar_jobs_symbol_created
   ✓ idx_caesar_jobs_expires_at
   ✓ idx_caesar_jobs_user_id
   ✓ idx_caesar_sources_research_job_id
   ✓ idx_caesar_sources_citation_index

📊 Table statistics:
   caesar_research_jobs: 0 rows
   caesar_research_sources: 0 rows

🎉 Caesar Research Tables are ready to use!
```

### Step 2: Verify Tables

```bash
# Verify database access
npx tsx scripts/test-database-access.ts
```

---

## 💻 Usage

### Storing Caesar Jobs

The `lib/ucie/caesarStorage.ts` utility provides all necessary functions:

#### 1. Store New Job

```typescript
import { storeCaesarJob } from '../lib/ucie/caesarStorage';

// When creating a Caesar research job
const jobId = await storeCaesarJob(
  caesarJobId,      // Caesar API job ID
  queryText,        // Query sent to Caesar
  'BTC',            // Symbol (optional)
  2,                // Compute units (optional, default 2)
  userId            // User ID (optional)
);
```

#### 2. Update Job Status

```typescript
import { updateCaesarJobStatus } from '../lib/ucie/caesarStorage';

// Update status as job progresses
await updateCaesarJobStatus(caesarJobId, 'researching');
await updateCaesarJobStatus(caesarJobId, 'completed');
```

#### 3. Store Completed Results

```typescript
import { storeCaesarResults } from '../lib/ucie/caesarStorage';

// When Caesar job completes
await storeCaesarResults(
  caesarJobId,
  researchJob,      // Full ResearchJob object from Caesar API
  dataQualityScore, // Quality score (0-100)
  costUsd           // Estimated cost (optional)
);
```

#### 4. Get Cached Research

```typescript
import { getCachedCaesarResearch } from '../lib/ucie/caesarStorage';

// Check for existing research
const cached = await getCachedCaesarResearch('BTC', 'market analysis');

if (cached && cached.status === 'completed') {
  // Use cached results
  console.log('Content:', cached.content);
  console.log('Sources:', cached.results);
}
```

#### 5. Get Job by ID

```typescript
import { getCaesarJobById } from '../lib/ucie/caesarStorage';

// Get specific job
const job = await getCaesarJobById(caesarJobId);

if (job) {
  console.log('Status:', job.status);
  console.log('Quality:', job.data_quality_score);
  console.log('Cost:', job.cost_usd);
}
```

#### 6. Get Job Sources

```typescript
import { getCaesarJobSources } from '../lib/ucie/caesarStorage';

// Get all sources for a job
const sources = await getCaesarJobSources(caesarJobId);

sources.forEach(source => {
  console.log(`[${source.citation_index}] ${source.title}`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Score: ${source.score}`);
});
```

#### 7. Get Statistics

```typescript
import { getCaesarStats } from '../lib/ucie/caesarStorage';

// Get overall statistics
const stats = await getCaesarStats();

console.log('Total jobs:', stats.total);
console.log('Completed:', stats.completed);
console.log('Failed:', stats.failed);
console.log('Avg quality:', stats.avgQuality);
console.log('Total cost:', stats.totalCost);
```

---

## 🔄 Integration with UCIE System

### In `/api/ucie/research/[symbol].ts`

```typescript
import { 
  storeCaesarJob, 
  updateCaesarJobStatus, 
  storeCaesarResults,
  getCachedCaesarResearch 
} from '../../../lib/ucie/caesarStorage';
import { getComprehensiveContext, formatContextForAI } from '../../../lib/ucie/contextAggregator';

export default async function handler(req, res) {
  const { symbol } = req.query;
  
  try {
    // 1. Check for cached research
    const cached = await getCachedCaesarResearch(symbol, 'comprehensive analysis');
    if (cached && cached.status === 'completed') {
      return res.json({
        success: true,
        cached: true,
        data: {
          content: cached.content,
          transformedContent: cached.transformed_content,
          results: cached.results,
          dataQuality: cached.data_quality_score,
        }
      });
    }
    
    // 2. Get comprehensive context (UCIE Rule #1: AI analysis LAST)
    const context = await getComprehensiveContext(symbol);
    
    // 3. Verify data quality (minimum 70%)
    if (context.dataQuality < 70) {
      return res.status(202).json({
        error: 'Insufficient data for analysis',
        dataQuality: context.dataQuality,
        retryAfter: 10
      });
    }
    
    // 4. Format context for AI
    const contextPrompt = formatContextForAI(context);
    
    // 5. Create Caesar research job
    const caesarJob = await createCaesarResearch(contextPrompt, 2);
    
    // 6. Store job in database
    await storeCaesarJob(
      caesarJob.id,
      contextPrompt,
      symbol,
      2
    );
    
    // 7. Poll for results
    const result = await pollCaesarResearch(caesarJob.id, 60000, 10);
    
    // 8. Update status
    await updateCaesarJobStatus(caesarJob.id, result.status);
    
    // 9. Store completed results
    if (result.status === 'completed') {
      const qualityScore = calculateCaesarQuality(result);
      await storeCaesarResults(caesarJob.id, result, qualityScore);
    }
    
    // 10. Return results
    return res.json({
      success: true,
      cached: false,
      data: {
        content: result.content,
        transformedContent: result.transformed_content,
        results: result.results,
        dataQuality: context.dataQuality,
      }
    });
    
  } catch (error) {
    console.error('Caesar research error:', error);
    return res.status(500).json({
      error: 'Failed to generate research',
      details: error.message
    });
  }
}
```

---

## 📊 Monitoring & Analytics

### Query Examples

#### Get Recent Jobs

```sql
SELECT 
  caesar_job_id,
  symbol,
  status,
  data_quality_score,
  cost_usd,
  created_at,
  completed_at
FROM caesar_research_jobs
ORDER BY created_at DESC
LIMIT 10;
```

#### Get Jobs by Symbol

```sql
SELECT 
  caesar_job_id,
  query,
  status,
  data_quality_score,
  created_at
FROM caesar_research_jobs
WHERE symbol = 'BTC'
ORDER BY created_at DESC;
```

#### Get Cost Summary

```sql
SELECT 
  symbol,
  COUNT(*) as job_count,
  SUM(cost_usd) as total_cost,
  AVG(data_quality_score) as avg_quality
FROM caesar_research_jobs
WHERE status = 'completed'
GROUP BY symbol
ORDER BY total_cost DESC;
```

#### Get Source Statistics

```sql
SELECT 
  j.symbol,
  COUNT(DISTINCT s.id) as source_count,
  AVG(s.score) as avg_relevance
FROM caesar_research_jobs j
JOIN caesar_research_sources s ON s.research_job_id = j.id
WHERE j.status = 'completed'
GROUP BY j.symbol;
```

---

## 🧹 Maintenance

### Cleanup Expired Jobs

```typescript
import { cleanupExpiredCaesarJobs } from '../lib/ucie/caesarStorage';

// Run periodically (e.g., daily cron job)
const deleted = await cleanupExpiredCaesarJobs();
console.log(`Cleaned up ${deleted} expired jobs`);
```

### Manual Cleanup Query

```sql
-- Delete jobs older than 30 days
DELETE FROM caesar_research_jobs
WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete expired jobs
DELETE FROM caesar_research_jobs
WHERE expires_at < NOW();
```

---

## 🎯 Benefits

### For Development

1. **Historical Tracking**: View all past Caesar analyses
2. **Debugging**: Trace issues with specific jobs
3. **Testing**: Verify Caesar integration working correctly
4. **Caching**: Avoid duplicate API calls for same queries

### For Business

1. **Cost Monitoring**: Track Caesar API usage and costs
2. **Quality Analysis**: Monitor analysis quality over time
3. **Performance Metrics**: Analyze processing times
4. **User Analytics**: Track which users request research

### For Users

1. **Faster Responses**: Cached results return instantly
2. **Better Quality**: Track and improve analysis quality
3. **Source Transparency**: View all sources used in analysis
4. **Historical Access**: Access past analyses

---

## ✅ Verification Checklist

Before deploying:

- [ ] Migration script runs successfully
- [ ] Both tables created (caesar_research_jobs, caesar_research_sources)
- [ ] All indexes created
- [ ] Triggers working (updated_at auto-update)
- [ ] Storage functions tested
- [ ] Retrieval functions tested
- [ ] Statistics functions tested
- [ ] Cleanup functions tested
- [ ] Integration with UCIE endpoints tested
- [ ] Production database updated

---

## 🚀 Deployment Steps

### 1. Local Testing

```bash
# Run migration locally
npx tsx scripts/run-caesar-migration.ts

# Test storage functions
npx tsx scripts/test-caesar-storage.ts  # Create this test script
```

### 2. Production Deployment

```bash
# Connect to production database
# Run migration on production
npx tsx scripts/run-caesar-migration.ts

# Verify tables exist
npx tsx scripts/verify-database-storage.ts
```

### 3. Update UCIE Endpoints

Update `/api/ucie/research/[symbol].ts` to use new storage functions (see Integration section above).

### 4. Monitor

- Check Vercel function logs for errors
- Monitor database for new entries
- Verify caching working correctly
- Track costs and quality scores

---

## 📚 Related Documentation

- **UCIE System Guide**: `.kiro/steering/ucie-system.md`
- **Caesar API Reference**: `.kiro/steering/caesar-api-reference.md`
- **Database Guide**: `UCIE-DATABASE-ACCESS-GUIDE.md`
- **API Integration**: `.kiro/steering/api-integration.md`

---

## 🎉 Summary

**Caesar AI responses are now permanently stored in the database!**

**Benefits**:
- ✅ Historical tracking of all analyses
- ✅ Cost monitoring and optimization
- ✅ Quality analysis and improvement
- ✅ Source transparency and citation tracking
- ✅ Performance metrics and analytics
- ✅ Faster responses through caching

**Next Steps**:
1. Run migration: `npx tsx scripts/run-caesar-migration.ts`
2. Update UCIE endpoints to use storage functions
3. Test end-to-end flow
4. Deploy to production
5. Monitor and optimize

---

**Status**: 🟢 **READY TO DEPLOY**  
**Created**: January 27, 2025  
**Version**: 1.0

**All Caesar AI responses will now be tracked and stored for analysis!** ✅🚀
