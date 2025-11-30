# UCIE Sentiment API - Quick Reference

**Status**: ✅ Code Fixed | ⚠️ API Key Limited  
**Data Quality**: 65% (Fear & Greed + Reddit working)

---

## 🚀 Quick Test

```bash
# Debug LunarCrush response
npx tsx scripts/debug-lunarcrush-response.ts

# Test UCIE Sentiment API
curl "http://localhost:3000/api/ucie/sentiment/BTC?refresh=true"
```

---

## 📊 What's Working

| Source | Status | Data |
|--------|--------|------|
| Fear & Greed Index | ✅ | Market sentiment (0-100) |
| Reddit | ✅ | Mentions, post sentiment |
| LunarCrush | ⚠️ | galaxy_score, alt_rank only |

---

## ❌ What's Missing

LunarCrush social metrics (requires paid API tier):
- `interactions_24h` (social volume)
- `posts_active_24h` (mentions)
- `creators_active_24h` (contributors)
- `social_dominance`
- `sentiment` scores

---

## 💡 Solution

**Option 1**: Upgrade LunarCrush API key
- Visit: https://lunarcrush.com/pricing
- Get tier with social metrics
- Update `LUNARCRUSH_API_KEY` in Vercel
- Result: 100% data quality

**Option 2**: Use current system (65% quality)
- Fear & Greed provides market sentiment
- Reddit provides community sentiment
- LunarCrush provides social ranking
- System fully operational

---

## 📁 Key Files

**Modified**:
- `pages/api/ucie/sentiment/[symbol].ts` - Fixed v4 integration

**Created**:
- `scripts/debug-lunarcrush-response.ts` - Debug tool
- `scripts/test-lunarcrush-v4-fields.ts` - Test tool
- `LUNARCRUSH-V4-INTEGRATION-GUIDE.md` - Full docs
- `UCIE-SENTIMENT-LUNARCRUSH-DIAGNOSIS.md` - Analysis
- `UCIE-SENTIMENT-FIX-SUMMARY.md` - Summary

---

## 🎯 Current Response

```json
{
  "success": true,
  "data": {
    "overallScore": 55,
    "sentiment": "neutral",
    "fearGreedIndex": { "value": 45 },
    "lunarCrush": {
      "galaxyScore": 48.9,
      "altRank": 59,
      "socialVolume": 0,
      "hasCompleteData": false
    },
    "reddit": { "mentions24h": 15 },
    "dataQuality": 65
  }
}
```

---

**The code is fixed. The missing data is due to API key tier limitations.** ✅
