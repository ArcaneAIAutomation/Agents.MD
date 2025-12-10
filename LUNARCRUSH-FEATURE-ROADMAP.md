# LunarCrush Feature Integration Roadmap

**Date**: December 10, 2025  
**Status**: ✅ **READY FOR IMPLEMENTATION**  
**Priority**: **HIGH** - Unique differentiating features  
**Estimated Timeline**: 4-6 weeks for full implementation

---

## 🎯 Overview

This roadmap outlines the implementation plan for integrating LunarCrush social sentiment data into our platform. The features are prioritized by value and implementation effort.

---

## 📊 Phase 1: Quick Wins (Week 1)

**Goal**: Add immediate value with minimal development time  
**Timeline**: 5-7 hours  
**Expected Impact**: High visibility, immediate user value

### Feature 1.1: Social Sentiment Gauge
**Effort**: 2-3 hours  
**Value**: High

**Description**: Live Galaxy Score display with sentiment indicator

**Implementation**:
```typescript
// components/SocialSentimentGauge.tsx
import { useLunarCrushData } from '../hooks/useLunarCrushData';

const SocialSentimentGauge = () => {
  const { galaxyScore, sentiment, socialDominance, loading } = useLunarCrushData('BTC');
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="bitcoin-block">
      <h3 className="text-bitcoin-white font-bold mb-4">Social Sentiment</h3>
      
      {/* Galaxy Score Gauge (0-100) */}
      <div className="mb-4">
        <label className="text-bitcoin-white-60 text-sm">Galaxy Score™</label>
        <div className="relative h-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-bitcoin-orange transition-all duration-500"
            style={{ width: `${galaxyScore}%` }}
          />
        </div>
        <p className="text-bitcoin-orange font-mono text-2xl font-bold mt-2">
          {galaxyScore.toFixed(1)}/100
        </p>
      </div>
      
      {/* Sentiment Indicator */}
      <div className="mb-4">
        <label className="text-bitcoin-white-60 text-sm">Sentiment</label>
        <div className={`text-lg font-bold ${getSentimentColor(sentiment)}`}>
          {getSentimentLabel(sentiment)}
        </div>
      </div>
      
      {/* Social Dominance */}
      <div>
        <label className="text-bitcoin-white-60 text-sm">Social Dominance</label>
        <p className="text-bitcoin-white font-mono text-xl">
          {socialDominance.toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

function getSentimentColor(sentiment: number): string {
  if (sentiment >= 70) return 'text-bitcoin-orange';
  if (sentiment >= 40) return 'text-bitcoin-white';
  return 'text-bitcoin-white-60';
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 70) return '🚀 Very Bullish';
  if (sentiment >= 55) return '📈 Bullish';
  if (sentiment >= 45) return '➡️ Neutral';
  if (sentiment >= 30) return '📉 Bearish';
  return '🔻 Very Bearish';
}
```

**API Endpoint**:
```typescript
// pages/api/lunarcrush/sentiment/[symbol].ts
export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // Check cache first (5-minute TTL)
  const cached = await getCachedData(`lunarcrush:sentiment:${symbol}`);
  if (cached) return res.json(cached);
  
  // Fetch from LunarCrush
  const data = await fetch(`https://lunarcrush.com/api4/public/coins/list/v1?symbol=${symbol}`, {
    headers: { 'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}` }
  });
  
  const result = await data.json();
  const coin = result.data[0];
  
  const response = {
    galaxyScore: coin.galaxy_score,
    sentiment: coin.sentiment,
    socialDominance: coin.social_dominance,
    altRank: coin.alt_rank,
    timestamp: Date.now()
  };
  
  // Cache for 5 minutes
  await setCachedData(`lunarcrush:sentiment:${symbol}`, response, 300);
  
  return res.json(response);
}
```

**UI Location**: Main dashboard, top-right widget

---

### Feature 1.2: Viral Content Alerts
**Effort**: 3-4 hours  
**Value**: High

**Description**: Alert users when Bitcoin content goes viral (>10M interactions)

**Implementation**:
```typescript
// components/ViralContentAlert.tsx
const ViralContentAlert = () => {
  const { viralPosts, loading } = useViralContent('BTC', 10000000);
  
  if (loading || viralPosts.length === 0) return null;
  
  return (
    <div className="bitcoin-block border-2 border-bitcoin-orange">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔥</span>
        <h3 className="text-bitcoin-orange font-bold">Viral Bitcoin Content</h3>
      </div>
      
      {viralPosts.map(post => (
        <div key={post.id} className="mb-3 pb-3 border-b border-bitcoin-orange-20 last:border-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-bitcoin-white text-sm mb-1">{post.post_title}</p>
              <div className="flex items-center gap-3 text-xs text-bitcoin-white-60">
                <span>{post.post_type}</span>
                <span>•</span>
                <span>{formatInteractions(post.interactions_total)} interactions</span>
                <span>•</span>
                <span>Sentiment: {post.post_sentiment}/5</span>
              </div>
            </div>
            <a 
              href={post.post_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            >
              View →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

function formatInteractions(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
```

**API Endpoint**:
```typescript
// pages/api/lunarcrush/viral/[symbol].ts
export default async function handler(req, res) {
  const { symbol } = req.query;
  const { threshold = 10000000 } = req.query;
  
  // Fetch recent posts
  const data = await fetch(`https://lunarcrush.com/api4/public/topic/${symbol.toLowerCase()}/posts/v1`, {
    headers: { 'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}` }
  });
  
  const result = await data.json();
  
  // Filter for viral content
  const viralPosts = result.data.filter(post => 
    post.interactions_total >= threshold
  );
  
  return res.json({
    viralPosts: viralPosts.slice(0, 5), // Top 5
    threshold,
    timestamp: Date.now()
  });
}
```

**UI Location**: Alert banner at top of dashboard

---

## 📱 Phase 2: Core Features (Week 2)

**Goal**: Major feature additions with high engagement  
**Timeline**: 10-14 hours  
**Expected Impact**: Significant user engagement increase

### Feature 2.1: Social Media Feed Widget
**Effort**: 4-6 hours  
**Value**: High

**Description**: Scrollable feed of top Bitcoin posts from Twitter, Reddit, YouTube, TikTok

**Implementation**:
```typescript
// components/BitcoinSocialFeed.tsx
const BitcoinSocialFeed = () => {
  const [filter, setFilter] = useState<'all' | 'tweet' | 'reddit-post' | 'youtube-video' | 'tiktok-video'>('all');
  const { posts, loading, refresh } = useLunarCrushPosts('BTC', 50);
  
  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(p => p.post_type === filter);
  
  return (
    <div className="bitcoin-block">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-bitcoin-white font-bold">Bitcoin Social Feed</h3>
        <button 
          onClick={refresh}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterButton>
        <FilterButton active={filter === 'tweet'} onClick={() => setFilter('tweet')}>
          🐦 Twitter
        </FilterButton>
        <FilterButton active={filter === 'reddit-post'} onClick={() => setFilter('reddit-post')}>
          🤖 Reddit
        </FilterButton>
        <FilterButton active={filter === 'youtube-video'} onClick={() => setFilter('youtube-video')}>
          📺 YouTube
        </FilterButton>
        <FilterButton active={filter === 'tiktok-video'} onClick={() => setFilter('tiktok-video')}>
          🎵 TikTok
        </FilterButton>
      </div>
      
      {/* Posts Feed */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <LoadingSpinner />
        ) : (
          filteredPosts.map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

const SocialPostCard = ({ post }) => (
  <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-colors">
    <div className="flex items-start gap-3">
      {/* Creator Avatar */}
      <img 
        src={post.creator_avatar} 
        alt={post.creator_name}
        className="w-10 h-10 rounded-full"
      />
      
      <div className="flex-1 min-w-0">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-bitcoin-white font-semibold text-sm">
            {post.creator_display_name}
          </span>
          <span className="text-bitcoin-white-60 text-xs">
            @{post.creator_name}
          </span>
          <span className="text-bitcoin-white-60 text-xs">
            • {formatFollowers(post.creator_followers)} followers
          </span>
        </div>
        
        {/* Post Content */}
        <p className="text-bitcoin-white-80 text-sm mb-2 line-clamp-3">
          {post.post_title}
        </p>
        
        {/* Post Metadata */}
        <div className="flex items-center gap-3 text-xs text-bitcoin-white-60">
          <span className="capitalize">{post.post_type.replace('-', ' ')}</span>
          <span>•</span>
          <span>{formatInteractions(post.interactions_total)} interactions</span>
          <span>•</span>
          <SentimentBadge sentiment={post.post_sentiment} />
        </div>
      </div>
      
      {/* View Link */}
      <a 
        href={post.post_link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm"
      >
        View →
      </a>
    </div>
  </div>
);

const SentimentBadge = ({ sentiment }) => {
  const color = sentiment >= 4 ? 'text-bitcoin-orange' : 
                sentiment >= 3 ? 'text-bitcoin-white' : 
                'text-bitcoin-white-60';
  
  return (
    <span className={color}>
      Sentiment: {sentiment}/5
    </span>
  );
};
```

**UI Location**: Sidebar or dedicated "Social Feed" page

---

### Feature 2.2: Sentiment-Based Trading Signals
**Effort**: 6-8 hours  
**Value**: Very High

**Description**: Alert when sentiment diverges from price action

**Implementation**:
```typescript
// lib/lunarcrush/signals.ts
interface TradingSignal {
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  sentiment: number;
  priceChange24h: number;
  galaxyScore: number;
  timestamp: number;
}

export async function generateSentimentSignal(symbol: string): Promise<TradingSignal> {
  // Fetch sentiment data
  const sentiment = await fetch(`/api/lunarcrush/sentiment/${symbol}`).then(r => r.json());
  
  // Fetch price data
  const price = await fetch(`/api/market-data/${symbol}`).then(r => r.json());
  
  // Detect divergence
  const sentimentBullish = sentiment.sentiment >= 70;
  const sentimentBearish = sentiment.sentiment <= 30;
  const priceFalling = price.change24h < -5;
  const priceRising = price.change24h > 5;
  
  // Bullish Signal: Positive sentiment + falling price
  if (sentimentBullish && priceFalling) {
    return {
      type: 'BULLISH',
      confidence: 'HIGH',
      reason: 'Strong positive sentiment despite price drop - potential reversal',
      sentiment: sentiment.sentiment,
      priceChange24h: price.change24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now()
    };
  }
  
  // Bearish Signal: Negative sentiment + rising price
  if (sentimentBearish && priceRising) {
    return {
      type: 'BEARISH',
      confidence: 'HIGH',
      reason: 'Negative sentiment despite price rise - potential correction',
      sentiment: sentiment.sentiment,
      priceChange24h: price.change24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now()
    };
  }
  
  // Galaxy Score breakout
  if (sentiment.galaxyScore > 75) {
    return {
      type: 'BULLISH',
      confidence: 'MEDIUM',
      reason: 'Galaxy Score breakout above 75 - strong social momentum',
      sentiment: sentiment.sentiment,
      priceChange24h: price.change24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now()
    };
  }
  
  if (sentiment.galaxyScore < 25) {
    return {
      type: 'BEARISH',
      confidence: 'MEDIUM',
      reason: 'Galaxy Score below 25 - weak social momentum',
      sentiment: sentiment.sentiment,
      priceChange24h: price.change24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now()
    };
  }
  
  // No signal
  return {
    type: 'NEUTRAL',
    confidence: 'LOW',
    reason: 'No significant sentiment divergence detected',
    sentiment: sentiment.sentiment,
    priceChange24h: price.change24h,
    galaxyScore: sentiment.galaxyScore,
    timestamp: Date.now()
  };
}
```

**UI Component**:
```typescript
// components/SentimentTradingSignals.tsx
const SentimentTradingSignals = () => {
  const { signal, loading } = useSentimentSignal('BTC');
  
  if (loading || signal.type === 'NEUTRAL') return null;
  
  const isBullish = signal.type === 'BULLISH';
  
  return (
    <div className={`bitcoin-block border-2 ${isBullish ? 'border-bitcoin-orange' : 'border-bitcoin-white-60'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{isBullish ? '🚀' : '⚠️'}</span>
        <h3 className={`font-bold ${isBullish ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
          {signal.type} Signal Detected
        </h3>
        <span className="text-xs text-bitcoin-white-60 ml-auto">
          Confidence: {signal.confidence}
        </span>
      </div>
      
      <p className="text-bitcoin-white-80 mb-3">
        {signal.reason}
      </p>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <label className="text-bitcoin-white-60 text-xs">Sentiment</label>
          <p className="text-bitcoin-white font-mono">{signal.sentiment}/100</p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs">Price 24h</label>
          <p className={`font-mono ${signal.priceChange24h >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
            {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
          </p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs">Galaxy Score</label>
          <p className="text-bitcoin-white font-mono">{signal.galaxyScore.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};
```

**UI Location**: Alert banner or dedicated "Signals" section

---

## 🎯 Phase 3: Advanced Features (Week 3-4)

**Goal**: Advanced analytics for power users  
**Timeline**: 14-18 hours  
**Expected Impact**: Differentiation from competitors

### Feature 3.1: Influencer Tracking Dashboard
**Effort**: 6-8 hours  
**Value**: Medium

**Description**: Track top Bitcoin influencers and their post activity

---

### Feature 3.2: Social Volume vs Price Correlation
**Effort**: 8-10 hours  
**Value**: Medium

**Description**: Chart showing correlation between social volume and price movements

---

## 📋 Implementation Checklist

### API Setup
- [x] LunarCrush API key configured
- [x] Endpoint structure verified
- [x] Rate limiting understood
- [ ] Caching strategy implemented
- [ ] Error handling added

### Backend Endpoints
- [ ] `/api/lunarcrush/sentiment/[symbol]` - Real-time sentiment
- [ ] `/api/lunarcrush/posts/[symbol]` - Social media posts
- [ ] `/api/lunarcrush/viral/[symbol]` - Viral content
- [ ] `/api/lunarcrush/signals/[symbol]` - Trading signals
- [ ] `/api/lunarcrush/influencers/[symbol]` - Top influencers

### Frontend Components
- [ ] SocialSentimentGauge
- [ ] ViralContentAlert
- [ ] BitcoinSocialFeed
- [ ] SentimentTradingSignals
- [ ] InfluencerTracker
- [ ] SocialVolumeChart

### Database Schema
- [ ] `lunarcrush_sentiment` table
- [ ] `lunarcrush_posts` table
- [ ] `lunarcrush_signals` table
- [ ] Historical data collection

---

## 🎯 Success Metrics

### User Engagement
- **Target**: 30% of users interact with social features
- **Measure**: Click-through rate, time-on-feature
- **Goal**: 15% increase in time-on-site

### Trading Signal Accuracy
- **Target**: 60%+ accuracy on sentiment signals
- **Measure**: Backtest against historical data
- **Goal**: Provide actionable trading insights

### Feature Adoption
- **Target**: 50% of users view social feed in first week
- **Measure**: Feature usage analytics
- **Goal**: Become a differentiating feature

---

## 💰 Cost Analysis

### API Costs
- **Free Tier**: 100,000 requests/day (sufficient for testing)
- **Paid Tier**: $99/month for unlimited requests
- **Recommendation**: Start with free tier

### Development Costs
- **Phase 1**: 5-7 hours
- **Phase 2**: 10-14 hours
- **Phase 3**: 14-18 hours
- **Total**: 29-39 hours

### Expected ROI
- **User Engagement**: +15% time-on-site
- **Feature Differentiation**: Unique social sentiment features
- **Trading Value**: Actionable sentiment-based signals

---

## ✅ Next Steps

### This Week
1. Implement Social Sentiment Gauge (Priority 1)
2. Add Viral Content Alerts (Priority 1)
3. Set up caching infrastructure

### Next 2 Weeks
1. Build Social Media Feed Widget (Priority 2)
2. Implement Sentiment-Based Trading Signals (Priority 2)
3. Create backend API endpoints

### Next Month
1. Add Influencer Tracking Dashboard (Priority 3)
2. Build Social Volume vs Price Correlation (Priority 3)
3. Integrate with existing UCIE system

---

**Status**: ✅ **READY FOR IMPLEMENTATION**  
**Priority**: **HIGH**  
**Timeline**: 4-6 weeks  
**Expected Impact**: **SIGNIFICANT** (15%+ user engagement increase)
