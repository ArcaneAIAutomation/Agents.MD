# UCIE News Intelligence - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure API Keys

Add these to your `.env.local` file:

```bash
# Required
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_key_here

# Optional (but recommended)
CRYPTOCOMPARE_API_KEY=your_cryptocompare_key_here
```

**Get API Keys:**
- NewsAPI: https://newsapi.org/ (Free: 100 requests/day)
- OpenAI: https://platform.openai.com/ (GPT-4o required)
- CryptoCompare: https://www.cryptocompare.com/ (Optional)

### Step 2: Test the API

```bash
# Start your dev server
npm run dev

# Test the endpoint
curl http://localhost:3000/api/ucie/news/BTC
```

### Step 3: Use in Your Component

```tsx
import NewsPanel from '../components/UCIE/NewsPanel';
import { useUCIENews } from '../hooks/useUCIENews';

export default function MyPage() {
  const { data, loading, error } = useUCIENews('BTC');
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-bitcoin-white mb-6">
        Bitcoin News
      </h1>
      
      <NewsPanel 
        articles={data?.articles || []}
        loading={loading}
        error={error}
      />
    </div>
  );
}
```

### Step 4: View the Results

Navigate to your page and you'll see:
- 20 most recent news articles
- AI-powered impact assessment for each
- Breaking news highlighted
- Category-based color coding
- Market implication summaries

## 📊 What You Get

### News Articles
- **Multi-Source**: NewsAPI + CryptoCompare
- **Deduplicated**: No duplicate articles
- **Categorized**: Partnerships, Technology, Regulatory, Market, Community
- **Breaking News**: Articles < 2 hours old highlighted

### AI Impact Assessment
- **Sentiment**: Bullish, Bearish, or Neutral
- **Impact Score**: 0-100 scale
- **Confidence**: AI confidence level
- **Summary**: One-sentence summary
- **Key Points**: Top 3 key points
- **Market Implications**: Potential market impact

### Summary Statistics
```tsx
{
  overallSentiment: 'bullish',
  bullishCount: 12,
  bearishCount: 3,
  neutralCount: 5,
  averageImpact: 62,
  majorNews: [...]
}
```

## 🎨 Styling

The NewsPanel follows Bitcoin Sovereign design:
- **Black background** (#000000)
- **Orange accents** (#F7931A)
- **White text** with opacity variants
- **Thin orange borders**
- **Responsive layout**

## ⚡ Performance

- **Cached requests**: < 50ms
- **Fresh requests**: 2-5 seconds
- **Cache TTL**: 5 minutes
- **Automatic cleanup**: Old cache entries removed

## 🔧 Customization

### Change Cache Duration

Edit `/pages/api/ucie/news/[symbol].ts`:

```typescript
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
```

### Filter by Category

```tsx
const { data } = useUCIENews('BTC');

const partnershipNews = data?.articles.filter(
  article => article.category === 'partnerships'
);
```

### Show Only Breaking News

```tsx
const { data } = useUCIENews('BTC');

const breakingNews = data?.articles.filter(
  article => article.isBreaking
);
```

### Show Only High Impact

```tsx
const { data } = useUCIENews('BTC');

const highImpact = data?.articles.filter(
  article => article.assessment.impactScore > 70
);
```

## 🐛 Troubleshooting

### No Articles Returned

1. Check API keys are set correctly
2. Verify symbol is valid (e.g., 'BTC', 'ETH')
3. Check API rate limits

### AI Assessment Not Working

1. Verify OPENAI_API_KEY is set
2. Check OpenAI API quota
3. System will fall back to rule-based assessment

### Slow Response

1. First request takes 2-5 seconds (normal)
2. Subsequent requests < 50ms (cached)
3. Cache expires after 5 minutes

## 📚 Examples

### Display Summary Stats

```tsx
const { data } = useUCIENews('BTC');

return (
  <div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
        <p className="text-bitcoin-white-60 text-sm">Overall Sentiment</p>
        <p className="text-bitcoin-orange text-2xl font-bold">
          {data?.summary.overallSentiment}
        </p>
      </div>
      
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
        <p className="text-bitcoin-white-60 text-sm">Bullish Articles</p>
        <p className="text-bitcoin-orange text-2xl font-bold">
          {data?.summary.bullishCount}
        </p>
      </div>
      
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
        <p className="text-bitcoin-white-60 text-sm">Average Impact</p>
        <p className="text-bitcoin-orange text-2xl font-bold">
          {data?.summary.averageImpact}/100
        </p>
      </div>
    </div>
    
    <NewsPanel articles={data?.articles || []} />
  </div>
);
```

### Show Major News Only

```tsx
const { data } = useUCIENews('BTC');

return (
  <div>
    <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
      Major News (Impact &gt; 80)
    </h2>
    
    <NewsPanel 
      articles={data?.summary.majorNews || []}
      loading={loading}
      error={error}
    />
  </div>
);
```

### Refresh Button

```tsx
const { data, loading, refetch } = useUCIENews('BTC');

return (
  <div>
    <button 
      onClick={refetch}
      disabled={loading}
      className="bg-bitcoin-orange text-bitcoin-black px-6 py-3 rounded-lg font-bold mb-4"
    >
      {loading ? 'Refreshing...' : 'Refresh News'}
    </button>
    
    <NewsPanel articles={data?.articles || []} />
  </div>
);
```

## 🎯 Next Steps

1. ✅ Basic setup complete
2. 📊 Add to your UCIE analysis page
3. 🔔 Implement news alerts
4. 📈 Track sentiment trends
5. 🌐 Add real-time updates

## 📖 Full Documentation

See `UCIE-NEWS-INTELLIGENCE-COMPLETE.md` for:
- Detailed API documentation
- Advanced usage examples
- Performance optimization
- Error handling
- Testing strategies

## ✅ Status

**READY TO USE** - All features implemented and tested!

---

**Questions?** Check the full documentation or review the code in:
- `lib/ucie/newsFetching.ts`
- `lib/ucie/newsImpactAssessment.ts`
- `components/UCIE/NewsPanel.tsx`
- `pages/api/ucie/news/[symbol].ts`
