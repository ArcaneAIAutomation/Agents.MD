# UCIE Social Sentiment - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure API Keys

Add these to your `.env.local` file:

```bash
# LunarCrush (REQUIRED)
LUNARCRUSH_API_KEY=your_key_here

# Twitter (REQUIRED)
TWITTER_BEARER_TOKEN=your_token_here

# Reddit (Optional - uses public API)
REDDIT_CLIENT_ID=your_id_here
REDDIT_CLIENT_SECRET=your_secret_here
```

**Get API Keys**:
- LunarCrush: https://lunarcrush.com/developers/api
- Twitter: https://developer.twitter.com/en/portal/dashboard
- Reddit: https://www.reddit.com/prefs/apps

---

### Step 2: Test the API

```bash
# Start development server
npm run dev

# Test Bitcoin sentiment
curl http://localhost:3000/api/ucie/sentiment/BTC

# Expected response:
{
  "success": true,
  "symbol": "BTC",
  "sentiment": {
    "overallScore": 65,
    "confidence": 85,
    "breakdown": {
      "lunarCrush": 70,
      "twitter": 60,
      "reddit": 65
    },
    ...
  },
  "influencers": {
    "totalInfluencers": 15,
    "topInfluencers": [...]
  },
  "dataQuality": 95
}
```

---

### Step 3: Use in Your Component

```typescript
import { useSocialSentiment } from '../hooks/useSocialSentiment';
import SocialSentimentPanel from '../components/UCIE/SocialSentimentPanel';

function MyPage() {
  const { sentiment, influencers, loading, error } = useSocialSentiment('BTC');
  
  return (
    <SocialSentimentPanel
      symbol="BTC"
      sentiment={sentiment}
      influencers={influencers}
      loading={loading}
      error={error}
    />
  );
}
```

---

## 📊 What You Get

### Overall Sentiment Score
- Range: -100 (Very Bearish) to +100 (Very Bullish)
- Weighted average from multiple sources
- Confidence percentage

### Sentiment Breakdown
- LunarCrush score (50% weight)
- Twitter score (30% weight)
- Reddit score (20% weight)

### Sentiment Trends
- 24-hour hourly trends
- 7-day daily trends
- 30-day weekly trends

### Sentiment Shifts
- Detects changes >30 points
- Shows magnitude and direction
- Identifies contributing factors

### Trending Topics
- Top hashtags and keywords
- Mention counts
- Sentiment per topic

### Key Influencers
- 10k+ follower accounts
- Impact scores (0-100)
- Recent posts
- Sentiment classification

### Volume Metrics
- 24H social volume
- 7D change percentage
- Average impact score

---

## 🎨 Component Features

### Bitcoin Sovereign Design
- Pure black backgrounds
- Orange accents
- Thin orange borders
- Monospace data displays
- Mobile-first responsive

### Interactive Elements
- Timeframe selector (24H, 7D, 30D)
- Collapsible sections
- Hover effects
- Touch-optimized

### Loading States
- Skeleton screens
- Progress indicators
- Error messages

---

## 🔧 Advanced Usage

### Multiple Symbols

```typescript
import { useMultipleSocialSentiment } from '../hooks/useSocialSentiment';

function ComparisonPage() {
  const { data, loading } = useMultipleSocialSentiment(['BTC', 'ETH', 'SOL']);
  
  return (
    <div>
      {Object.entries(data).map(([symbol, sentiment]) => (
        <div key={symbol}>
          <h2>{symbol}: {sentiment.sentiment.overallScore}</h2>
        </div>
      ))}
    </div>
  );
}
```

### Manual Refetch

```typescript
const { sentiment, refetch } = useSocialSentiment('BTC');

// Refetch on button click
<button onClick={refetch}>Refresh Sentiment</button>
```

### Custom Styling

```typescript
<SocialSentimentPanel
  symbol="BTC"
  sentiment={sentiment}
  influencers={influencers}
  className="custom-class"
/>
```

---

## 📈 Performance

### Response Times
- First request: 3-4 seconds (fetches from all sources)
- Cached request: < 100ms (5-minute cache)

### Rate Limits
- LunarCrush Free: 50 calls/day
- Twitter Basic: 500,000 tweets/month
- Reddit: 60 calls/minute (public API)

### Caching
- 5-minute TTL
- Automatic cleanup
- Cache hit indicator in response

---

## 🐛 Troubleshooting

### No Data Returned
```bash
# Check API keys
echo $LUNARCRUSH_API_KEY
echo $TWITTER_BEARER_TOKEN

# Verify keys are in .env.local
cat .env.local | grep LUNARCRUSH
cat .env.local | grep TWITTER
```

### Twitter API Errors
- Verify Bearer Token is valid
- Check rate limits (500k tweets/month)
- Ensure app has read permissions

### LunarCrush Rate Limit
- Free tier: 50 calls/day
- Upgrade to Pro for unlimited
- Use caching to reduce calls

### Sentiment Score is 0
- Symbol may not have social activity
- Check symbol is valid (e.g., BTC, ETH, not BITCOIN)
- Try a more popular token

---

## 📚 API Reference

### Endpoint
```
GET /api/ucie/sentiment/[symbol]
```

### Parameters
- `symbol` (required): Token symbol (e.g., BTC, ETH)

### Response
```typescript
{
  success: boolean;
  symbol: string;
  timestamp: string;
  sentiment: AggregatedSentiment;
  influencers: InfluencerMetrics;
  sources: {
    lunarCrush: boolean;
    twitter: boolean;
    reddit: boolean;
  };
  dataQuality: number; // 0-100
  cached: boolean;
}
```

### Error Response
```typescript
{
  success: false;
  error: string;
  symbol?: string;
}
```

---

## 🎯 Next Steps

1. **Test with Different Tokens**: Try BTC, ETH, SOL, DOGE, SHIB
2. **Customize Styling**: Match your brand colors
3. **Add Real-time Updates**: Implement WebSocket for live data
4. **Store Historical Data**: Save sentiment trends in database
5. **Integrate with Other UCIE Modules**: Combine with market data, technical analysis

---

## 📖 Full Documentation

See `UCIE-SOCIAL-SENTIMENT-COMPLETE.md` for:
- Detailed implementation guide
- All features and functions
- Requirements satisfied
- Performance metrics
- Advanced configuration

---

**Status**: ✅ Ready to Use  
**Support**: Check documentation or create an issue

