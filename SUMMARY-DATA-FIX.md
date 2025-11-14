# AI Summary Data Fix - Manual Patch Required

**Issue**: The AI Summary is showing "N/A" for market data even though the data is available.

**Root Cause**: The `generateFallbackSummary` function is using wrong property names:
- Using `agg.aggregatedPrice` instead of `agg.averagePrice`
- Using `agg.aggregatedChange24h` instead of `agg.averageChange24h`
- Using `agg.aggregatedMarketCap` instead of `marketData.marketData.marketCap`

## Manual Fix Required

In `pages/api/ucie/preview-data/[symbol].ts`, find the `generateFallbackSummary` function (around line 790) and replace:

```typescript
  // ✅ FIXED: Market Data - Use correct path
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    summary += `**Market Overview:**\n`;
    summary += `- Current Price: ${agg.aggregatedPrice?.toLocaleString() || 'N/A'}\n`;
    summary += `- 24h Change: ${agg.aggregatedChange24h?.toFixed(2) || 'N/A'}%\n`;
    summary += `- Market Cap: ${agg.aggregatedMarketCap?.toLocaleString() || 'N/A'}\n\n`;
  }
```

With:

```typescript
  // ✅ FIXED: Market Data - Use correct path with actual values
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    const price = agg.averagePrice || agg.aggregatedPrice || 0;
    const change = agg.averageChange24h || agg.aggregatedChange24h || 0;
    const marketCap = collectedData.marketData.marketData?.marketCap || agg.aggregatedMarketCap || 0;
    
    summary += `**Market Overview:**\n`;
    summary += `- Current Price: $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    summary += `- 24h Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n`;
    summary += `- Market Cap: $${(marketCap / 1e9).toFixed(2)}B\n\n`;
  }
```

And replace:

```typescript
  // ✅ FIXED: Sentiment - Use correct path
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    summary += `**Social Sentiment:** ${sentiment.overallScore}/100 (${sentiment.trend})\n\n`;
  }
```

With:

```typescript
  // ✅ FIXED: Sentiment - Use correct path with actual values
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    const score = sentiment.overallScore || 0;
    const trend = sentiment.trend || 'neutral';
    summary += `**Social Sentiment:** ${score.toFixed(0)}/100 (${trend})\n\n`;
  }
```

## Already Fixed

The following have already been fixed in the `generateOpenAISummary` function:
- ✅ Market data extraction using correct property names
- ✅ Sentiment data extraction using correct property names
- ✅ Technical data extraction using correct property names

These fixes ensure the OpenAI-generated summary (when it works) will have correct data.

## Testing

After applying the fix, test with:
```bash
curl https://news.arcane.group/api/ucie/preview-data/BTC
```

Expected AI Summary should show:
- Current Price: $95,745.99 (not N/A)
- 24h Change: -2.42% (not N/A)
- Market Cap: $1909.05B (not N/A)
- Social Sentiment: 5/100 (not 0/100)
