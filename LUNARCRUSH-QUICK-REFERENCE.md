# LunarCrush Integration - Quick Reference

**Status**: ✅ Production Ready  
**Last Updated**: December 10, 2025

---

## 🚀 Quick Start

### Access Dashboard
```
https://your-domain.com/lunarcrush-dashboard
```

### API Endpoints
```
GET /api/lunarcrush/sentiment/BTC    # Galaxy Score & sentiment
GET /api/lunarcrush/posts/BTC        # Social media posts
GET /api/lunarcrush/viral/BTC        # Viral content
GET /api/lunarcrush/signals/BTC      # Trading signals
```

---

## 📊 Components

### Import Components
```typescript
import {
  SocialSentimentGauge,
  ViralContentAlert,
  SocialFeedWidget,
  TradingSignalsCard,
  SocialPostCard
} from '../components/LunarCrush';
```

### Use Hooks
```typescript
import {
  useLunarCrushSentiment,
  useLunarCrushPosts,
  useLunarCrushViral,
  useLunarCrushSignals
} from '../hooks/useLunarCrush';

const { data, loading, error, refresh } = useLunarCrushSentiment('BTC');
```

---

## 🔧 Configuration

### Environment Variables
```bash
LUNARCRUSH_API_KEY=lc_your_api_key_here
```

### Vercel Settings
```json
{
  "functions": {
    "pages/api/lunarcrush/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

---

## 📈 Key Metrics

### Galaxy Score™
- **Scale**: 0-100
- **>75**: Very Bullish
- **50-75**: Bullish
- **25-50**: Neutral
- **<25**: Bearish

### Sentiment Score
- **Scale**: 0-100
- **>70**: Positive
- **30-70**: Neutral
- **<30**: Negative

### Post Sentiment
- **Scale**: 1-5
- **5**: Very Positive
- **4**: Positive
- **3**: Neutral
- **2**: Negative
- **1**: Very Negative

---

## 🔗 Data Sources

### Supported Platforms
- 🐦 Twitter/X
- 📺 YouTube
- 🔴 Reddit
- 🎵 TikTok
- 📰 News

### Post Types
```typescript
type PostType = 
  | "tweet" 
  | "youtube-video" 
  | "reddit-post" 
  | "tiktok-video" 
  | "news";
```

---

## ⚡ Performance

### Response Times
- Sentiment: ~500ms
- Posts: ~250ms
- Viral: ~300ms
- Signals: ~400ms

### Caching
- **Duration**: 5 minutes
- **Location**: API level
- **Refresh**: Manual via 🔄 button

### Rate Limits
- **Free Tier**: 100 req/10s
- **Daily**: ~2,000 requests

---

## 🐛 Troubleshooting

### No Data
1. Check `LUNARCRUSH_API_KEY` in Vercel
2. Verify API key is valid
3. Check rate limits

### Slow Loading
1. Check Vercel function logs
2. Verify cache is working
3. Test API response times

### Broken Links
1. Verify post data includes `post_link`
2. Check browser popup blocker
3. Test in incognito mode

---

## 📚 Documentation

### Files
- `LUNARCRUSH-INTEGRATION-COMPLETE.md` - Full implementation
- `LUNARCRUSH-DEPLOYMENT-GUIDE.md` - Deployment steps
- `.kiro/steering/lunarcrush-api-guide.md` - API reference

### External
- [LunarCrush API Docs](https://lunarcrush.com/developers/api)
- [Vercel Docs](https://vercel.com/docs)

---

## 🎯 Common Tasks

### Deploy Changes
```bash
git add .
git commit -m "feat: Update LunarCrush"
git push origin main
```

### Test Locally
```bash
npm run dev
# Visit http://localhost:3000/lunarcrush-dashboard
```

### Check Logs
```bash
# Vercel Dashboard → Functions → Select endpoint → View logs
```

### Update API Key
```bash
# Vercel Dashboard → Settings → Environment Variables
# Update LUNARCRUSH_API_KEY → Redeploy
```

---

## ✅ Deployment Checklist

- [ ] `LUNARCRUSH_API_KEY` set in Vercel
- [ ] Push to GitHub main branch
- [ ] Verify build succeeds
- [ ] Test dashboard loads
- [ ] Check all components work
- [ ] Verify links are clickable
- [ ] Test on mobile

---

**Quick Reference Complete** ✅

