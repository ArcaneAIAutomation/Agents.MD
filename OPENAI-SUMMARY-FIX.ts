/**
 * FIXED VERSION of generateOpenAISummary function
 * 
 * Replace the existing function in pages/api/ucie/preview-data/[symbol].ts
 * with this corrected version that uses the actual API response structures.
 */

/**
 * Generate OpenAI summary of collected data
 * ✅ FIXED: Use correct response structures (data at root level, not nested under .data)
 */
async function generateOpenAISummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  // Build context from collected data
  let context = `Cryptocurrency: ${symbol}\n\n`;
  context += `Data Collection Status:\n`;
  context += `- APIs Working: ${apiStatus.working.length}/${apiStatus.total}\n`;
  context += `- Data Quality: ${apiStatus.successRate}%\n\n`;

  // Market Data
  // ✅ FIX: Use correct response structure (priceAggregation at root level)
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const priceAgg = collectedData.marketData.priceAggregation;
    const marketData = collectedData.marketData.marketData;
    
    context += `Market Data:\n`;
    context += `- Price: $${priceAgg.vwap?.toLocaleString() || priceAgg.averagePrice?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Volume: $${priceAgg.totalVolume24h?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Change: ${priceAgg.averageChange24h?.toFixed(2) || 'N/A'}%\n`;
    if (marketData) {
      context += `- Market Cap: $${marketData.marketCap?.toLocaleString() || 'N/A'}\n`;
      context += `- High 24h: $${marketData.high24h?.toLocaleString() || 'N/A'}\n`;
      context += `- Low 24h: $${marketData.low24h?.toLocaleString() || 'N/A'}\n`;
    }
    context += `\n`;
  }

  // Sentiment
  // ✅ FIX: Data is at root level, not under .data
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    context += `Social Sentiment:\n`;
    context += `- Overall Score: ${sentiment.overallScore || 'N/A'}/100\n`;
    context += `- Trend: ${sentiment.trend || 'N/A'}\n`;
    context += `- 24h Mentions: ${sentiment.mentions24h?.toLocaleString() || 'N/A'}\n\n`;
  }

  // Technical
  // ✅ FIX: Data is at root level, not under .data
  if (collectedData.technical?.success && collectedData.technical?.indicators) {
    const technical = collectedData.technical;
    context += `Technical Analysis:\n`;
    context += `- RSI: ${technical.indicators?.rsi?.value || 'N/A'}\n`;
    context += `- MACD Signal: ${technical.tradingSignals?.signal || 'N/A'}\n`;
    context += `- Trend: ${technical.multiTimeframe?.overall?.direction || 'N/A'}\n`;
    context += `- Current Price: $${technical.currentPrice?.toLocaleString() || 'N/A'}\n\n`;
  }

  // News
  // ✅ FIX: Articles are at root level, not under .data
  if (collectedData.news?.success && collectedData.news?.articles?.length > 0) {
    const articles = collectedData.news.articles.slice(0, 3);
    context += `Recent News (Top 3):\n`;
    articles.forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}\n`;
    });
    context += `\n`;
  }

  // On-Chain
  // ✅ FIX: Data is at root level, not under .data
  if (collectedData.onChain?.success && collectedData.onChain?.holderDistribution) {
    const onChain = collectedData.onChain;
    if (onChain.holderDistribution?.concentration) {
      const conc = onChain.holderDistribution.concentration;
      context += `On-Chain Data:\n`;
      context += `- Top 10 Holders: ${conc.top10Percentage?.toFixed(2) || 'N/A'}%\n`;
      context += `- Distribution Score: ${conc.distributionScore || 'N/A'}/100\n\n`;
    }
  }

  // Failed APIs
  if (apiStatus.failed.length > 0) {
    context += `Note: The following data sources are unavailable: ${apiStatus.failed.join(', ')}\n`;
  }

  // Log the context being sent to OpenAI (for debugging)
  console.log(`📝 OpenAI Context:\n${context}`);

  // Generate summary with OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a cryptocurrency analyst. Summarize the collected data in a clear, concise format for a user who is about to proceed with deep AI analysis. Focus on:
1. Current market status (price, volume, sentiment)
2. Key technical indicators and trends
3. Notable news or developments
4. Data quality and completeness
5. What the user can expect from the deep analysis

Keep the summary to 3-4 paragraphs, professional but accessible. Use bullet points for key metrics.`
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content || 'Summary generation failed';

  } catch (error) {
    console.error('OpenAI summary error:', error);
    // Fallback to basic summary
    return generateFallbackSummary(symbol, collectedData, apiStatus);
  }
}

/**
 * Generate fallback summary if OpenAI fails
 * ✅ FIXED: Use correct response structures
 */
function generateFallbackSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): string {
  let summary = `**${symbol} Data Collection Summary**\n\n`;
  
  summary += `We've collected data from ${apiStatus.working.length} out of ${apiStatus.total} sources (${apiStatus.successRate}% data quality).\n\n`;

  // ✅ FIX: Use correct response structure
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const priceAgg = collectedData.marketData.priceAggregation;
    summary += `**Market Overview:**\n`;
    summary += `- Current Price: $${priceAgg.vwap?.toLocaleString() || priceAgg.averagePrice?.toLocaleString() || 'N/A'}\n`;
    summary += `- 24h Change: ${priceAgg.averageChange24h?.toFixed(2) || 'N/A'}%\n`;
    if (collectedData.marketData.marketData) {
      summary += `- Market Cap: $${collectedData.marketData.marketData.marketCap?.toLocaleString() || 'N/A'}\n`;
    }
    summary += `\n`;
  }

  // ✅ FIX: Use correct response structure
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    summary += `**Social Sentiment:** ${sentiment.overallScore}/100 (${sentiment.trend})\n\n`;
  }

  // ✅ FIX: Use correct response structure
  if (collectedData.technical?.success && collectedData.technical?.multiTimeframe) {
    summary += `**Technical Outlook:** ${collectedData.technical.multiTimeframe.overall?.direction || 'Neutral'}\n\n`;
  }

  summary += `This data will be used to provide context for the deep Caesar AI analysis. Proceed to get comprehensive research including technology analysis, team evaluation, partnerships, and risk assessment.`;

  return summary;
}
