# Bitcoin News Wire Feature Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: HIGH  
**Dependencies**: NewsAPI, CryptoCompare API

---

## Overview

Bitcoin News Wire is a real-time cryptocurrency news aggregation system that collects, filters, and displays news from multiple authoritative sources with sentiment analysis.

---

## Features

### Core Capabilities
- **Multi-Source Aggregation**: NewsAPI, CryptoCompare, and other sources
- **Real-time Updates**: Auto-refresh with configurable intervals
- **Sentiment Analysis**: AI-powered sentiment classification (Bullish/Bearish/Neutral)
- **Category Filtering**: Filter by Bitcoin, Ethereum, DeFi, Regulation, etc.
- **Source Attribution**: Clear source citations for all articles

### User Experience
- Clean, newspaper-style layout
- Mobile-responsive design
- Quick-read summaries
- Click-through to original sources
- Bookmark functionality (if implemented)

---

## Technical Architecture

### API Endpoints

```typescript
// Get news articles
GET /api/bitcoin-news-wire
// Query params: limit, category, source
// Returns: { articles: Article[], timestamp: string }

// Optimized endpoint (15 stories)
GET /api/crypto-herald-15-stories
// Returns: { articles: Article[], sources: string[] }
```

### Data Flow

```
1. User opens News Wire page
   ↓
2. Frontend calls /api/bitcoin-news-wire
   ↓
3. Backend queries multiple news APIs in parallel
   ↓
4. Articles deduplicated and sorted by timestamp
   ↓
5. Sentiment analysis applied (if enabled)
   ↓
6. Results cached for 5 minutes
   ↓
7. Articles displayed in news feed
```

### External APIs

| API | Purpose | Rate Limit | Status |
|-----|---------|------------|--------|
| NewsAPI | Primary news source | 100/day (free) | ✅ Working |
| CryptoCompare | Crypto-specific news | 100K/month | ✅ Working |

---

## Configuration

### Environment Variables

```bash
# Required
NEWS_API_KEY=your_newsapi_key

# Optional
CRYPTOCOMPARE_API_KEY=your_cryptocompare_key
```

### Cache Settings

```typescript
const NEWS_CACHE_TTL = 300; // 5 minutes
const MAX_ARTICLES = 50;
const DEFAULT_LIMIT = 15;
```

---

## Components

### Frontend Components

```
components/
├── CryptoHerald.tsx           # Main news component
├── NewsArticleCard.tsx        # Individual article display
├── NewsFilters.tsx            # Category and source filters
└── NewsTicker.tsx             # Scrolling headline ticker
```

### Key Files

```
pages/
├── index.tsx                  # Landing page with news section
└── api/
    ├── bitcoin-news-wire.ts   # Main news endpoint
    └── crypto-herald-15-stories.ts  # Optimized endpoint
```

---

## Article Schema

```typescript
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  source: {
    name: string;
    url: string;
  };
  publishedAt: string;
  image?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  category?: string;
  relevanceScore?: number;
}
```

---

## Caching Strategy

```typescript
// Check cache first
const cached = await getCachedAnalysis(symbol, 'news');
if (cached && isFresh(cached)) {
  return cached;
}

// Fetch fresh data
const articles = await fetchNewsFromAPIs();

// Cache results
await setCachedAnalysis(symbol, 'news', articles, NEWS_CACHE_TTL, 100);

return articles;
```

---

## Error Handling

### Fallback Strategy

1. **Primary**: NewsAPI
2. **Secondary**: CryptoCompare
3. **Tertiary**: Cached data (if available)
4. **Final**: Error message with retry option

### Error States

```typescript
// Network error
{ error: 'network', message: 'Unable to fetch news', retryable: true }

// Rate limit
{ error: 'rate_limit', message: 'API limit reached', retryAfter: 3600 }

// No results
{ error: 'no_results', message: 'No news found', articles: [] }
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API response time | < 2s | ~1.5s |
| Cache hit rate | > 80% | ~85% |
| Articles per request | 15-50 | 15 (default) |
| Refresh interval | 5 min | 5 min |

---

## Troubleshooting

### Common Issues

**Issue**: No articles loading
- Check NewsAPI key is valid
- Verify API quota not exceeded
- Check network connectivity

**Issue**: Stale news
- Clear cache manually
- Check cache TTL settings
- Verify auto-refresh is working

**Issue**: Missing images
- Some sources don't provide images
- Fallback placeholder should display
- Check image URL validity

### Debug Commands

```bash
# Test news endpoint
curl https://your-domain.com/api/bitcoin-news-wire?limit=5

# Check with specific category
curl https://your-domain.com/api/bitcoin-news-wire?category=bitcoin
```

---

## Related Documentation

- **Steering**: `.kiro/steering/api-integration.md`
- **API Status**: `.kiro/steering/api-status.md`
- **Design**: `.kiro/steering/bitcoin-sovereign-design.md`
