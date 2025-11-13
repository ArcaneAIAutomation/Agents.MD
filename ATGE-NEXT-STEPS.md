# ATGE Next Steps - Bitcoin Focus

**Date**: January 27, 2025  
**Status**: Database Schema Ready  
**Focus**: Bitcoin (BTC) only

---

## ✅ What's Complete

1. **Tasks Document Updated**
   - Bitcoin-only focus clearly stated
   - Task 2.3.1 updated for Bitcoin
   - Phase 1 updated to reflect 6 tables

2. **Database Schema Created**
   - `migrations/002_create_atge_tables.sql` (600+ lines)
   - 6 tables with complete structure
   - LunarCrush social intelligence columns
   - Performance tracking built-in
   - Indexes, triggers, views, functions

3. **Migration Script Created**
   - `scripts/run-atge-migration.ts`
   - Automated migration execution
   - Verification of all components

---

## 🎯 Immediate Next Steps

### Step 1: Run Database Migration (5 minutes)

```bash
# Option 1: Using the script (recommended)
npx tsx scripts/run-atge-migration.ts

# Option 2: Using psql directly
psql $DATABASE_URL -f migrations/002_create_atge_tables.sql

# Option 3: Using Supabase SQL Editor
# Copy contents of migrations/002_create_atge_tables.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

**Expected Output**:
```
✅ trade_signals
✅ trade_results
✅ trade_technical_indicators
✅ trade_market_snapshot
✅ trade_historical_prices
✅ atge_performance_cache
✅ vw_complete_trades (view)
✅ calculate_atge_performance() (function)
✅ 20+ indexes created
✅ 3 triggers created
```

### Step 2: Verify Database (2 minutes)

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'trade_%' OR table_name LIKE 'atge_%';

-- Check view exists
SELECT * FROM vw_complete_trades LIMIT 1;

-- Check function exists
SELECT calculate_atge_performance('00000000-0000-0000-0000-000000000000');

-- Check LunarCrush columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'trade_market_snapshot' 
AND column_name LIKE '%galaxy%' OR column_name LIKE '%social%';
```

### Step 3: Implement Task 2.3.1 - LunarCrush Integration (2-3 hours)

**File**: `lib/atge/sentimentData.ts`

**What to do**:

1. **Import LunarCrush MCP tools**:
   ```typescript
   import { mcp_LunarCrush_Topic, mcp_LunarCrush_Topic_Posts } from '@/mcp';
   ```

2. **Replace `fetchLunarCrushData()` function**:
   ```typescript
   async function fetchLunarCrushData(symbol: string) {
     // Use mcp_LunarCrush_Topic instead of REST API
     const data = await mcp_LunarCrush_Topic({ topic: 'bitcoin' });
     
     return {
       // Existing fields
       socialScore: data.social_score || 50,
       galaxyScore: data.galaxy_score || 50,
       altRank: data.alt_rank || 0,
       sentiment: determineSentiment(data),
       
       // NEW: Add comprehensive LunarCrush data
       socialDominance: data.social_dominance || 0,
       sentimentDistribution: {
         positive: data.sentiment?.positive || 0,
         negative: data.sentiment?.negative || 0,
         neutral: data.sentiment?.neutral || 0
       },
       socialVolume24h: {
         posts: data.posts_24h || 0,
         interactions: data.interactions_24h || 0,
         contributors: data.contributors_24h || 0
       },
       correlationScore: data.correlation_score || 0
     };
   }
   ```

3. **Add influential posts fetcher**:
   ```typescript
   async function fetchInfluentialPosts(symbol: string) {
     const posts = await mcp_LunarCrush_Topic_Posts({
       topic: 'bitcoin',
       interval: '1d'
     });
     
     // Get top 5 posts by engagement
     const topPosts = posts
       .sort((a, b) => b.engagement - a.engagement)
       .slice(0, 5);
     
     return topPosts.map(post => ({
       text: post.text,
       engagement: post.engagement,
       sentiment: post.sentiment,
       creator: post.creator
     }));
   }
   ```

4. **Update return type**:
   ```typescript
   interface SentimentData {
     lunarCrush: {
       socialScore: number;
       galaxyScore: number;
       altRank: number;
       sentiment: 'bullish' | 'bearish' | 'neutral';
       
       // NEW: Comprehensive social intelligence
       socialDominance: number;
       sentimentDistribution: {
         positive: number;
         negative: number;
         neutral: number;
       };
       socialVolume24h: {
         posts: number;
         interactions: number;
         contributors: number;
       };
       correlationScore: number;
       influentialPosts: Array<{
         text: string;
         engagement: number;
         sentiment: string;
         creator: string;
       }>;
     } | null;
     // ... rest of interface
   }
   ```

5. **Update `getSentimentData()` to fetch posts**:
   ```typescript
   export async function getSentimentData(symbol: string): Promise<SentimentData> {
     const [lunarCrush, twitter, reddit, influentialPosts] = await Promise.all([
       fetchLunarCrushData(symbol),
       fetchTwitterSentiment(symbol),
       fetchRedditSentiment(symbol),
       fetchInfluentialPosts(symbol)
     ]);
     
     // Add posts to lunarCrush data
     if (lunarCrush) {
       lunarCrush.influentialPosts = influentialPosts;
     }
     
     // ... rest of function
   }
   ```

### Step 4: Update Database Utilities (1-2 hours)

**File**: `lib/atge/database.ts`

**What to do**:

1. **Create `storeMarketSnapshot()` function**:
   ```typescript
   export async function storeMarketSnapshot(
     tradeSignalId: string,
     marketData: any,
     sentimentData: SentimentData,
     onChainData: any
   ) {
     const snapshot = {
       trade_signal_id: tradeSignalId,
       
       // Price data
       current_price: marketData.price,
       price_change_24h: marketData.change24h,
       market_cap: marketData.marketCap,
       volume_24h: marketData.volume24h,
       
       // Sentiment
       fear_greed_index: marketData.fearGreedIndex,
       social_sentiment_score: sentimentData.aggregateSentiment.score,
       
       // LunarCrush social intelligence
       galaxy_score: sentimentData.lunarCrush?.galaxyScore,
       alt_rank: sentimentData.lunarCrush?.altRank,
       social_dominance: sentimentData.lunarCrush?.socialDominance,
       sentiment_positive: sentimentData.lunarCrush?.sentimentDistribution.positive,
       sentiment_negative: sentimentData.lunarCrush?.sentimentDistribution.negative,
       sentiment_neutral: sentimentData.lunarCrush?.sentimentDistribution.neutral,
       social_volume_24h: sentimentData.lunarCrush?.socialVolume24h.posts + 
                          sentimentData.lunarCrush?.socialVolume24h.interactions,
       social_posts_24h: sentimentData.lunarCrush?.socialVolume24h.posts,
       social_interactions_24h: sentimentData.lunarCrush?.socialVolume24h.interactions,
       social_contributors_24h: sentimentData.lunarCrush?.socialVolume24h.contributors,
       correlation_score: sentimentData.lunarCrush?.correlationScore,
       
       // On-chain
       whale_transactions_24h: onChainData.whaleCount,
       exchange_inflow_24h: onChainData.exchangeInflow,
       exchange_outflow_24h: onChainData.exchangeOutflow,
       
       // Data quality
       data_quality_score: calculateDataQuality(marketData, sentimentData, onChainData),
       data_sources: JSON.stringify({
         market: marketData.source,
         sentiment: ['lunarcrush', 'twitter', 'reddit'],
         onChain: onChainData.source
       })
     };
     
     await query(
       `INSERT INTO trade_market_snapshot (
         trade_signal_id, current_price, price_change_24h, market_cap, volume_24h,
         fear_greed_index, social_sentiment_score,
         galaxy_score, alt_rank, social_dominance,
         sentiment_positive, sentiment_negative, sentiment_neutral,
         social_volume_24h, social_posts_24h, social_interactions_24h, social_contributors_24h,
         correlation_score,
         whale_transactions_24h, exchange_inflow_24h, exchange_outflow_24h,
         data_quality_score, data_sources
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
       )`,
       [
         snapshot.trade_signal_id,
         snapshot.current_price,
         snapshot.price_change_24h,
         snapshot.market_cap,
         snapshot.volume_24h,
         snapshot.fear_greed_index,
         snapshot.social_sentiment_score,
         snapshot.galaxy_score,
         snapshot.alt_rank,
         snapshot.social_dominance,
         snapshot.sentiment_positive,
         snapshot.sentiment_negative,
         snapshot.sentiment_neutral,
         snapshot.social_volume_24h,
         snapshot.social_posts_24h,
         snapshot.social_interactions_24h,
         snapshot.social_contributors_24h,
         snapshot.correlation_score,
         snapshot.whale_transactions_24h,
         snapshot.exchange_inflow_24h,
         snapshot.exchange_outflow_24h,
         snapshot.data_quality_score,
         snapshot.data_sources
       ]
     );
   }
   ```

2. **Create other database functions** (see Task 1.3 in tasks.md)

### Step 5: Test Integration (30 minutes)

```typescript
// Test script: scripts/test-atge-lunarcrush.ts
import { getSentimentData } from '../lib/atge/sentimentData';
import { storeMarketSnapshot } from '../lib/atge/database';

async function test() {
  console.log('Testing LunarCrush integration...\n');
  
  // Fetch sentiment data
  const sentiment = await getSentimentData('BTC');
  
  console.log('✅ Sentiment data fetched');
  console.log('   Galaxy Score:', sentiment.lunarCrush?.galaxyScore);
  console.log('   AltRank:', sentiment.lunarCrush?.altRank);
  console.log('   Social Dominance:', sentiment.lunarCrush?.socialDominance);
  console.log('   Sentiment:', sentiment.lunarCrush?.sentimentDistribution);
  console.log('   Social Volume:', sentiment.lunarCrush?.socialVolume24h);
  console.log('   Correlation:', sentiment.lunarCrush?.correlationScore);
  console.log('   Influential Posts:', sentiment.lunarCrush?.influentialPosts?.length);
  
  // Test database storage
  const testTradeId = '00000000-0000-0000-0000-000000000000';
  await storeMarketSnapshot(testTradeId, {}, sentiment, {});
  
  console.log('\n✅ Data stored in database');
}

test();
```

---

## 📋 Task Checklist

### Phase 1: Database (Immediate)
- [x] Create migration file
- [ ] Run migration on Supabase
- [ ] Verify all tables created
- [ ] Verify indexes created
- [ ] Verify triggers working
- [ ] Verify view working
- [ ] Verify function working

### Phase 2: LunarCrush Integration (Next)
- [ ] Update `fetchLunarCrushData()` to use MCP
- [ ] Add `fetchInfluentialPosts()` function
- [ ] Update `SentimentData` interface
- [ ] Update `getSentimentData()` function
- [ ] Test LunarCrush data fetching
- [ ] Verify all metrics extracted correctly

### Phase 3: Database Utilities (After Phase 2)
- [ ] Create `storeTradeSignal()` function
- [ ] Create `storeMarketSnapshot()` function (with LunarCrush data)
- [ ] Create `storeTechnicalIndicators()` function
- [ ] Create `storeTradeResults()` function
- [ ] Create `fetchTradeSignal()` function
- [ ] Create `fetchAllTrades()` function
- [ ] Create `updateTradeStatus()` function
- [ ] Test all database functions

### Phase 4: AI Integration (After Phase 3)
- [ ] Update AI prompt with LunarCrush context
- [ ] Weight social signals at 30-40% of decision
- [ ] Test AI trade generation with social data
- [ ] Verify AI uses social intelligence effectively

### Phase 5: Frontend (After Phase 4)
- [ ] Create LunarCrush metrics component
- [ ] Add to trade generation interface
- [ ] Add to trade detail modal
- [ ] Add to performance dashboard
- [ ] Test UI displays all metrics correctly

---

## 🎯 Success Criteria

### Database
- ✅ All 6 tables exist
- ✅ All indexes created
- ✅ All triggers working
- ✅ View returns complete data
- ✅ Function calculates stats correctly

### LunarCrush Integration
- ✅ Galaxy Score extracted (0-100)
- ✅ AltRank extracted
- ✅ Social dominance extracted
- ✅ Sentiment distribution extracted
- ✅ Social volume metrics extracted
- ✅ Correlation score extracted
- ✅ Influential posts extracted (top 5)
- ✅ All data stored in database

### AI Integration
- ✅ AI prompt includes social context
- ✅ Social signals weighted at 30-40%
- ✅ Trade decisions consider social intelligence
- ✅ AI reasoning mentions social factors

### Frontend
- ✅ LunarCrush metrics displayed
- ✅ Social intelligence visible in trade cards
- ✅ Performance dashboard shows social correlation
- ✅ Trade detail modal shows social analysis

---

## 📊 Expected Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Run migration | 5 min | ⏳ Next |
| 1 | Verify database | 2 min | ⏳ Next |
| 2 | Update sentimentData.ts | 2-3 hours | ⏳ Pending |
| 3 | Create database utilities | 1-2 hours | ⏳ Pending |
| 4 | Update AI prompt | 30 min | ⏳ Pending |
| 5 | Create UI components | 2-3 hours | ⏳ Pending |
| 5 | Test end-to-end | 1 hour | ⏳ Pending |

**Total Estimated Time**: 8-12 hours

---

## 🚀 Quick Start Commands

```bash
# 1. Run migration
npx tsx scripts/run-atge-migration.ts

# 2. Test LunarCrush integration (after implementing Task 2.3.1)
npx tsx scripts/test-atge-lunarcrush.ts

# 3. Test database utilities (after implementing Task 1.3)
npx tsx scripts/test-atge-database.ts

# 4. Run full ATGE test suite (after all implementation)
npx tsx scripts/test-atge-complete.ts
```

---

## 📚 Documentation References

- **Tasks**: `.kiro/specs/ai-trade-generation-engine/tasks.md`
- **Requirements**: `.kiro/specs/ai-trade-generation-engine/requirements.md`
- **Design**: `.kiro/specs/ai-trade-generation-engine/design.md`
- **Migration**: `migrations/002_create_atge_tables.sql`
- **Update Summary**: `ATGE-BITCOIN-FOCUS-UPDATE.md`

---

**Status**: 🟢 Ready to Begin Implementation  
**Next Action**: Run database migration  
**Priority**: HIGH - Foundation for all ATGE features
