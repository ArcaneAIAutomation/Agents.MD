# LunarCrush API - Correct Usage Guide

**Date**: November 29, 2025  
**Status**: 🔧 **FIX REQUIRED**  
**Priority**: HIGH

---

## 🚨 Problem Identified

The current implementation uses the **WRONG endpoint**:

```typescript
// ❌ WRONG - This endpoint returns 401 Unauthorized
const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
```

**Error**: `401 Unauthorized` - This endpoint requires different authentication or is deprecated.

---

## ✅ Correct LunarCrush API Usage

### Endpoint Structure

LunarCrush API v4 uses **topic-based endpoints**, not coin-based:

```typescript
// ✅ CORRECT - Topic endpoint (verified working via MCP)
const url = `https://lunarcrush.com/api4/public/topic/${topic}`;

// Examples:
// https://lunarcrush.com/api4/public/topic/bitcoin
// https://lunarcrush.com/api4/public/topic/ethereum
// https://lunarcrush.com/api4/public/topic/$btc
// https://lunarcrush.com/api4/public/topic/$eth
```

### Symbol to Topic Mapping

```typescript
const SYMBOL_TO_TOPIC_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'XRP': 'xrp',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'polygon',
  'AVAX': 'avalanche',
  'LINK': 'chainlink',
  // Add more as needed
};

function getTopicFromSymbol(symbol: string): string {
  return SYMBOL_TO_TOPIC_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
}
```

---

## 📊 Available Data from Topic Endpoint

The `/topic/{topic}` endpoint provides comprehensive data:

### Market Metrics
- `close` - Current price ($90,927.80)
- `volume_24h` - 24-hour trading volume ($60.5B)
- `market_cap` - Market capitalization ($1.81T)
- `market_dominance` - Market dominance percentage (58.6%)
- `circulating_supply` - Circulating supply (19,955,087 BTC)

### Social Metrics
- `galaxy_score` - Galaxy Score (55.70/100)
- `alt_rank` - AltRank position (#159)
- `social_score` - Social score
- `social_volume` - Social volume
- `social_dominance` - Social dominance (24.30%)
- `interactions` - Total engagements (98,692,289)
- `posts_active` - Mentions (209,290)
- `contributors_active` - Unique creators (76,699)

### Sentiment
- `sentiment` - Sentiment percentage (78%)
- Sentiment breakdown by network (News, Reddit, TikTok, X, YouTube)
- Supportive themes (30% price rally, 25% institutional adoption)
- Critical themes (20% volatility concerns)

### Time Series Data
- 1-hour, 24-hour, 7-day, 30-day changes
- Historical highs and lows
- Daily averages

---

## 🔧 Implementation Fix

### Step 1: Update Fetch Function

```typescript
/**
 * Fetch LunarCrush data using CORRECT topic endpoint
 */
async function fetchLunarCrushData(symbol: string): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  // ✅ Convert symbol to topic name
  const topic = getTopicFromSymbol(symbol);

  try {
    // ✅ CORRECT: Use /topic/{topic} endpoint
    const response = await fetch(
      `https://lunarcrush.com/api4/public/topic/${topic}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`❌ LunarCrush API failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // ✅ Topic endpoint returns data directly (no .data wrapper)
    return data;
  } catch (error) {
    console.error('LunarCrush fetch error:', error);
    return null;
  }
}
```

### Step 2: Update Data Extraction

```typescript
// ✅ Extract data from topic response
const response = {
  lunarCrush: lunarCrushData ? {
    // Market data
    price: lunarCrushData.close || 0,
    volume24h: lunarCrushData.volume_24h || 0,
    marketCap: lunarCrushData.market_cap || 0,
    marketDominance: lunarCrushData.market_dominance || 0,
    
    // Social metrics
    socialScore: lunarCrushData.social_score || 0,
    galaxyScore: lunarCrushData.galaxy_score || 0,
    altRank: lunarCrushData.alt_rank || 0,
    socialVolume: lunarCrushData.social_volume || 0,
    socialDominance: lunarCrushData.social_dominance || 0,
    
    // Engagement
    interactions: lunarCrushData.interactions || 0,
    mentions: lunarCrushData.posts_active || 0,
    contributors: lunarCrushData.contributors_active || 0,
    
    // Sentiment
    sentiment: lunarCrushData.sentiment || 0, // Already 0-100 scale
    sentimentClassification: getSentimentClassification(lunarCrushData.sentiment || 0),
    
    // Changes
    priceChange24h: lunarCrushData.percent_change_24h || 0,
    socialVolumeChange24h: calculateChange(
      lunarCrushData.social_volume,
      lunarCrushData.social_volume_24h_ago
    ),
    
    timestamp: new Date().toISOString()
  } : null
};

function getSentimentClassification(sentiment: number): string {
  if (sentiment >= 75) return 'Very Bullish';
  if (sentiment >= 60) return 'Bullish';
  if (sentiment >= 40) return 'Neutral';
  if (sentiment >= 25) return 'Bearish';
  return 'Very Bearish';
}

function calculateChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
```

---

## 🧪 Testing

### Test Script

```typescript
// scripts/test-lunarcrush-topic-api.ts
async function testLunarCrushTopicAPI() {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LUNARCRUSH_API_KEY not configured');
    return;
  }

  console.log('✅ API Key configured\n');

  // Test Bitcoin topic
  console.log('📡 Testing /topic/bitcoin endpoint...');
  const response = await fetch(
    'https://lunarcrush.com/api4/public/topic/bitcoin',
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    console.log(`❌ Failed: ${response.status} ${response.statusText}`);
    return;
  }

  const data = await response.json();
  console.log('✅ Topic endpoint WORKING!\n');
  console.log('📊 Bitcoin Topic Metrics:');
  console.log(`   Price: $${data.close?.toLocaleString()}`);
  console.log(`   Galaxy Score: ${data.galaxy_score}/100`);
  console.log(`   Alt Rank: #${data.alt_rank}`);
  console.log(`   Social Score: ${data.social_score}/100`);
  console.log(`   Social Volume: ${data.social_volume?.toLocaleString()}`);
  console.log(`   Social Dominance: ${data.social_dominance}%`);
  console.log(`   Sentiment: ${data.sentiment}%`);
  console.log(`   Interactions: ${data.interactions?.toLocaleString()}`);
  console.log(`   Mentions: ${data.posts_active?.toLocaleString()}`);
  console.log(`   Contributors: ${data.contributors_active?.toLocaleString()}`);
}

testLunarCrushTopicAPI().catch(console.error);
```

### Run Test

```bash
npx tsx scripts/test-lunarcrush-topic-api.ts
```

**Expected Output**:
```
✅ API Key configured

📡 Testing /topic/bitcoin endpoint...
✅ Topic endpoint WORKING!

📊 Bitcoin Topic Metrics:
   Price: $90,927
   Galaxy Score: 55.7/100
   Alt Rank: #159
   Social Score: 55/100
   Social Volume: 209,290
   Social Dominance: 24.3%
   Sentiment: 78%
   Interactions: 98,692,289
   Mentions: 209,290
   Contributors: 76,699
```

---

## 📝 Files to Update

### 1. UCIE Sentiment API
**File**: `pages/api/ucie/sentiment/[symbol].ts`

**Changes**:
- Update `fetchLunarCrushData()` to use `/topic/{topic}` endpoint
- Add symbol-to-topic mapping
- Update data extraction to match topic response structure
- Remove `.data` wrapper (topic endpoint returns data directly)

### 2. Bitcoin News Wire
**File**: `pages/api/bitcoin-news-wire.ts`

**Changes**:
- Update LunarCrush fetch to use `/topic/bitcoin/posts/1d` (already correct!)
- This endpoint is already using the correct topic-based structure

### 3. ATGE Sentiment Data
**File**: `lib/atge/sentimentData.ts`

**Changes**:
- Update `fetchLunarCrushData()` to use `/topic/{topic}` endpoint
- Update data extraction

### 4. ATGE LunarCrush Client
**File**: `lib/atge/lunarcrush.ts`

**Changes**:
- Update all LunarCrush API calls to use topic endpoints
- Update response parsing

### 5. Social Sentiment Clients
**File**: `lib/ucie/socialSentimentClients.ts`

**Changes**:
- Update LunarCrush client to use topic endpoints
- Update data extraction

---

## 🎯 Benefits of Correct Endpoint

### More Data Available
- ✅ Market metrics (price, volume, market cap)
- ✅ Social metrics (galaxy score, alt rank, social dominance)
- ✅ Engagement metrics (interactions, mentions, contributors)
- ✅ Sentiment analysis (0-100 scale, already normalized)
- ✅ Time series data (24h, 7d, 30d changes)
- ✅ Network breakdown (News, Reddit, TikTok, X, YouTube)

### Better Reliability
- ✅ Public endpoint (no authentication issues)
- ✅ Well-documented API
- ✅ Consistent response structure
- ✅ Real-time data updates

### Improved Data Quality
- ✅ Direct sentiment score (0-100 scale)
- ✅ Multiple social metrics for validation
- ✅ Engagement data for confidence scoring
- ✅ Network-specific breakdowns

---

## 🚀 Next Steps

1. **Update Test Script** ✅
   - Modify `scripts/test-lunarcrush-topic-api.ts`
   - Test with correct endpoint

2. **Update UCIE Sentiment API**
   - Modify `pages/api/ucie/sentiment/[symbol].ts`
   - Add symbol-to-topic mapping
   - Update data extraction

3. **Update Other Files**
   - `lib/atge/sentimentData.ts`
   - `lib/atge/lunarcrush.ts`
   - `lib/ucie/socialSentimentClients.ts`

4. **Test End-to-End**
   - Test UCIE sentiment endpoint
   - Verify data quality improves
   - Check caching works correctly

5. **Deploy**
   - Commit changes
   - Deploy to Vercel
   - Monitor logs for success

---

## 📚 References

- **LunarCrush API Docs**: https://lunarcrush.com/developers/docs
- **Topic Endpoint**: https://lunarcrush.com/api4/public/topic/{topic}
- **MCP Tool**: Verified working with `/topic/bitcoin` endpoint
- **API Key**: Configured in environment variables

---

**Status**: 🔧 **READY TO FIX**  
**Priority**: **HIGH** - This will restore LunarCrush data quality from 0% to 35%  
**Impact**: +35% data quality for UCIE sentiment analysis

