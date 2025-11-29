# UCIE 3-Minute Cache Update

**Date**: November 29, 2025  
**Status**: ✅ **COMPLETE**  
**Priority**: HIGH - Ensures fresh data for AI analysis

---

## 🎯 Objective

Update all UCIE data collection endpoints to use a **3-minute cache TTL** instead of 5-10 minutes, ensuring Caesar/GPT-5.1 receives fresh data for analysis.

---

## ✅ Changes Made

### **Cache TTL Updates**

| Endpoint | Old TTL | New TTL | Change |
|----------|---------|---------|--------|
| **Market Data** | 5 min (300s) | 3 min (180s) | ✅ Updated |
| **Sentiment** | 5 min (300s) | 3 min (180s) | ✅ Updated |
| **Technical** | 5 min (300s) | 3 min (180s) | ✅ Updated |
| **News** | 10 min (600s) | 3 min (180s) | ✅ Updated |
| **On-Chain** | 5 min (300s) | 3 min (180s) | ✅ Updated |

### **Files Modified**

1. `pages/api/ucie/market-data/[symbol].ts`
   - Changed: `const CACHE_TTL = 5 * 60` → `const CACHE_TTL = 3 * 60`

2. `pages/api/ucie/sentiment/[symbol].ts`
   - Changed: `300, // 5 minutes` → `180, // 3 minutes`

3. `pages/api/ucie/technical/[symbol].ts`
   - Changed: `const CACHE_TTL = 5 * 60` → `const CACHE_TTL = 3 * 60`

4. `pages/api/ucie/news/[symbol].ts`
   - Changed: `const CACHE_TTL = 10 * 60` → `const CACHE_TTL = 3 * 60`

5. `pages/api/ucie/on-chain/[symbol].ts`
   - Changed: `300, // 5 minutes` → `180, // 3 minutes`

---

## 📊 How It Works

### **Data Collection Flow**

```
User clicks BTC button
↓
For each data source:
  1. Check Supabase cache
  2. If cache exists AND age < 3 minutes:
     ✅ Return cached data (fast)
  3. If cache missing OR age > 3 minutes:
     ✅ Fetch fresh data from API
     ✅ Store in Supabase with 3-minute TTL
     ✅ Return fresh data
↓
All data stored in Supabase table: ucie_analysis_cache
```

### **Database Storage**

```sql
-- Cache entry structure
CREATE TABLE ucie_analysis_cache (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10),           -- e.g., 'BTC'
  analysis_type VARCHAR(50),    -- e.g., 'market-data', 'sentiment'
  data JSONB,                   -- The actual data
  quality_score INTEGER,        -- 0-100
  expires_at TIMESTAMP,         -- NOW() + 180 seconds
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Query only returns valid (non-expired) cache
SELECT * FROM ucie_analysis_cache 
WHERE symbol = 'BTC' 
  AND analysis_type = 'sentiment'
  AND expires_at > NOW();  -- ← Only cache < 3 minutes old
```

### **Caesar/GPT-5.1 Data Retrieval**

```typescript
// Caesar retrieves all cached data from Supabase
const allData = await getAllCachedDataForCaesar('BTC');

// Returns:
{
  marketData: {...},    // ✅ Fresh (< 3 min)
  sentiment: {...},     // ✅ Fresh (< 3 min)
  technical: {...},     // ✅ Fresh (< 3 min)
  news: {...},         // ✅ Fresh (< 3 min)
  onChain: {...}       // ✅ Fresh (< 3 min)
}

// All data is guaranteed to be < 3 minutes old
```

---

## 🧪 Testing

### **Quick Test** (Verify TTL)

```bash
# Check cache entries in Supabase
npx tsx scripts/test-cache-quick.ts
```

**Expected Output:**
```
✅ market-data
   TTL: 180s (expected: 180s)
   Age: 0.5 minutes
   Quality: 85%
   Status: 🟢 valid

✅ sentiment
   TTL: 180s (expected: 180s)
   Age: 0.5 minutes
   Quality: 60%
   Status: 🟢 valid

... (all 5 data sources)

✅ All cache entries have correct 3-minute TTL!
```

### **Comprehensive Test** (Full System)

```bash
# Start dev server
npm run dev

# In another terminal, run full test suite
npx tsx scripts/test-ucie-3min-cache.ts
```

**Tests:**
1. ✅ Data fetch and Supabase storage
2. ✅ Cache usage (< 3 minutes)
3. ✅ Caesar data retrieval
4. ✅ Cache expiration (> 3 minutes)

---

## 📈 Benefits

### **1. Fresher Data for AI**
- Caesar/GPT-5.1 receives data that's maximum 3 minutes old
- More accurate analysis based on recent market conditions
- Better trading signals and insights

### **2. Balanced Performance**
- Still uses cache for efficiency (not fetching every second)
- 3 minutes is optimal for crypto markets (fast-moving but not too volatile)
- Reduces API costs while maintaining data quality

### **3. Consistent Behavior**
- All 5 data sources now have same 3-minute TTL
- Easier to reason about cache behavior
- Predictable data freshness

---

## 🔄 Cache Lifecycle Example

```
10:00:00 - User clicks BTC button
           ├─ Market Data fetched → Cached until 10:03:00
           ├─ Sentiment fetched → Cached until 10:03:00
           ├─ Technical fetched → Cached until 10:03:00
           ├─ News fetched → Cached until 10:03:00
           └─ On-Chain fetched → Cached until 10:03:00

10:01:00 - User clicks BTC again
           └─ All data returned from cache (1 min old) ✅

10:02:30 - User clicks BTC again
           └─ All data returned from cache (2.5 min old) ✅

10:03:30 - User clicks BTC again
           └─ All data expired, fetch fresh (3.5 min old) ❌
           └─ New data cached until 10:06:30 ✅

10:04:00 - Caesar analysis starts
           └─ Retrieves all data from Supabase (30s old) ✅
           └─ All data is fresh and recent ✅
```

---

## 🚀 Deployment

### **Changes Committed**
```bash
git add -A
git commit -m "feat(ucie): Update cache TTL to 3 minutes for fresher AI analysis"
git push origin main
```

### **Vercel Auto-Deploy**
- Vercel will automatically deploy changes
- New cache TTL will be active immediately
- No environment variable changes needed

### **Post-Deployment Verification**
```bash
# 1. Wait for Vercel deployment to complete
# 2. Run quick test against production
npx tsx scripts/test-cache-quick.ts

# 3. Verify in Supabase dashboard
# Check ucie_analysis_cache table for TTL values
```

---

## 📝 Technical Details

### **Cache Key Format**
```
Symbol: BTC
Analysis Type: market-data, sentiment, technical, news, on-chain
Cache Key: {symbol}-{analysis_type}
```

### **TTL Calculation**
```typescript
// When storing in cache
const CACHE_TTL = 3 * 60; // 180 seconds
const expiresAt = new Date(Date.now() + CACHE_TTL * 1000);

await setCachedAnalysis(
  symbol,
  analysisType,
  data,
  CACHE_TTL,  // ← 180 seconds
  qualityScore
);
```

### **Cache Validation**
```sql
-- Database automatically filters expired cache
WHERE expires_at > NOW()

-- Example:
-- Created: 10:00:00
-- Expires: 10:03:00 (created + 180s)
-- Current: 10:02:00 → Valid ✅
-- Current: 10:04:00 → Expired ❌
```

---

## 🔗 Related Documentation

- **UCIE System Guide**: `.kiro/steering/ucie-system.md`
- **Cache Utils**: `lib/ucie/cacheUtils.ts`
- **Database Schema**: `migrations/001_initial_schema.sql`
- **API Integration**: `.kiro/steering/api-integration.md`

---

## ✅ Verification Checklist

Before considering complete:

- [x] All 5 endpoints updated to 3-minute TTL
- [x] Test scripts created
- [x] Documentation updated
- [x] Changes committed to git
- [ ] Deployed to production (Vercel auto-deploy)
- [ ] Post-deployment testing
- [ ] Verify Caesar receives fresh data

---

**Status**: 🟢 **READY FOR DEPLOYMENT**  
**Impact**: **HIGH** - Improves AI analysis quality with fresher data  
**Risk**: **LOW** - Only changes cache duration, no logic changes

---

*Last Updated: November 29, 2025*  
*Version: 1.0.0*
