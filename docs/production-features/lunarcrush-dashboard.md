# LunarCrush Dashboard Feature Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: MEDIUM  
**Dependencies**: LunarCrush API v4

---

## Overview

LunarCrush Dashboard provides real-time social sentiment analysis for Bitcoin, including Galaxy Score™, social media feeds, viral content detection, and sentiment-based trading signals.

---

## Features

### Core Capabilities
- **Galaxy Score™ Gauge**: Proprietary social + market metric (0-100 scale)
- **Social Media Feed**: Posts from Twitter, YouTube, Reddit, TikTok, News
- **Viral Content Detection**: Automatic detection of posts >10M interactions
- **Trading Signals**: Bullish/Bearish/Neutral signals with confidence scoring
- **Source Verification**: All posts link to original sources

### Data Sources
- Twitter/X posts and engagement
- YouTube videos and comments
- Reddit posts and discussions
- TikTok videos
- News articles

---

## Technical Architecture

### API Endpoints

```typescript
// Get sentiment data
GET /api/lunarcrush/sentiment/[symbol]
// Returns: { galaxyScore, sentiment, sources, dataQuality }

// Get social posts
GET /api/lunarcrush/posts/[symbol]
// Returns: { posts: Post[], totalInteractions, averageSentiment }

// Get viral content
GET /api/lunarcrush/viral/[symbol]
// Returns: { viralPosts: Post[], threshold: number }

// Get trading signals
GET /api/lunarcrush/signals/[symbol]
// Returns: { signal, confidence, reasoning, sources }
```

### LunarCrush API Endpoints Used

```typescript
// Topic posts (VERIFIED WORKING)
GET /api4/public/topic/bitcoin/posts/v1
// Returns: 118+ posts with sentiment scores

// Coins list (market data)
GET /api4/public/coins/list/v1
// Returns: price, volume, market cap, galaxy score

// Coin details
GET /api4/public/coins/BTC/v1
// Returns: detailed Bitcoin metrics
```

### Data Flow

```
1. User opens LunarCrush Dashboard
   ↓
2. Frontend calls sentiment endpoint
   ↓
3. Backend queries LunarCrush API
   ↓
4. Posts filtered and sentiment calculated
   ↓
5. Results cached for 5 minutes
   ↓
6. Dashboard displays:
   - Galaxy Score gauge
   - Social feed with filters
   - Viral content alerts
   - Trading signals
```

---

## Configuration

### Environment Variables

```bash
# Required
LUNARCRUSH_API_KEY=lc_your_api_key_here
```

### Vercel Configuration

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

### Cache Settings

```typescript
const SENTIMENT_CACHE_TTL = 300;  // 5 minutes
const POSTS_CACHE_TTL = 300;      // 5 minutes
const RATE_LIMIT = 100;           // requests per 10 seconds (free tier)
```

---

## Components

### Frontend Components

```
components/LunarCrush/
├── SocialSentimentGauge.tsx   # Galaxy Score visualization
├── ViralContentAlert.tsx      # Viral content notifications
├── SocialFeedWidget.tsx       # Scrollable social feed
├── TradingSignalsCard.tsx     # Sentiment-based signals
├── SocialPostCard.tsx         # Individual post display
└── index.ts                   # Component exports
```

### React Hooks

```typescript
// hooks/useLunarCrush.ts
export const useLunarCrushSentiment = (symbol: string) => {...};
export const useLunarCrushPosts = (symbol: string, filter?: string) => {...};
export const useLunarCrushViral = (symbol: string) => {...};
export const useLunarCrushSignals = (symbol: string) => {...};
```

---

## Post Schema

```typescript
interface LunarCrushPost {
  id: string;
  post_type: 'tiktok-video' | 'tweet' | 'youtube-video' | 'reddit-post' | 'news';
  post_title: string;
  post_created: number;           // Unix timestamp
  post_sentiment: number;         // 1-5 scale
  post_link: string;              // Direct link to source
  post_image: string | null;
  interactions_total: number;
  creator_id: string;
  creator_name: string;
  creator_display_name: string;
  creator_followers: string;
  creator_avatar: string;
}
```

---

## Galaxy Score™

The Galaxy Score™ is LunarCrush's proprietary metric combining:
- Social volume
- Social engagement
- Social sentiment
- Market performance
- Spam filtering

### Score Interpretation

| Score | Interpretation | Signal |
|-------|----------------|--------|
| 80-100 | Very Bullish | Strong Buy |
| 60-79 | Bullish | Buy |
| 40-59 | Neutral | Hold |
| 20-39 | Bearish | Sell |
| 0-19 | Very Bearish | Strong Sell |

---

## Trading Signals

```typescript
interface TradingSignal {
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;  // 0-100
  reasoning: string;
  sources: {
    galaxyScore: number;
    sentimentScore: number;
    socialVolume: number;
    viralContent: boolean;
  };
  timestamp: string;
}
```

---

## Error Handling

### Fallback Strategy

1. **Primary**: LunarCrush API
2. **Secondary**: Cached data (if available)
3. **Final**: Error message with retry option

### Error States

```typescript
// API failure
{ error: 'api_failure', message: 'LunarCrush API unavailable' }

// Rate limit
{ error: 'rate_limit', retryAfter: 10 }

// Invalid API key
{ error: 'unauthorized', message: 'Invalid API key' }
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API response time | < 1s | ~500ms |
| Posts per request | 100+ | 118 |
| Cache hit rate | > 80% | ~85% |
| Data quality | 100% | 100% |

---

## Troubleshooting

### Common Issues

**Issue**: No data displayed
- Check LUNARCRUSH_API_KEY is set in Vercel
- Verify API key is valid
- Check rate limits not exceeded

**Issue**: 401 Unauthorized
- Verify API key is correct (no extra spaces)
- Redeploy after adding environment variable

**Issue**: Slow loading
- Check Vercel function logs
- Verify cache is working
- Check LunarCrush API response times

### Debug Commands

```bash
# Test sentiment endpoint
curl https://your-domain.com/api/lunarcrush/sentiment/BTC

# Test posts endpoint
curl https://your-domain.com/api/lunarcrush/posts/BTC
```

---

## Related Documentation

- **Steering**: `.kiro/steering/lunarcrush-api-guide.md`
- **API Status**: `.kiro/steering/api-status.md`
- **Integration**: `LUNARCRUSH-INTEGRATION-COMPLETE.md`
