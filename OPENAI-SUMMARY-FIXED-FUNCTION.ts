/**
 * FIXED VERSION OF generateOpenAISummary
 * 
 * This version:
 * 1. Retrieves data from database if not in memory
 * 2. Uses correct data structure paths
 * 3. Provides accurate summaries with real data
 * 
 * Replace the existing generateOpenAISummary function in
 * pages/api/ucie/preview-data/[symbol].ts with this version
 */

/**
 * Generate OpenAI summary of collected data
 * ✅ FIXED: Retrieve from database and use correct data structure paths
 */
async function generateOpenAISummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  // ✅ Try to get cached data from database if not in memory
  let marketData = collectedData.marketData;
  let sentimentData = collectedData.sentiment;
  let technicalData = collectedData.technical;
  let newsData = collectedData.news;
  let onChainData = collectedData.onChain;

  // Check database for missing data
  if (!marketData?.success) {
    const cached = await getCachedAnalysis(symbol, 'market-data');
    if (cached) {
      console.log('📦 Using cached market data from database for OpenAI');
      marketData = cached;
    }
  }

  if (!sentimentData?.success) {
    const cached = await getCachedAnalysis(symbol, 'sentiment');
    if (cached) {
      console.log('📦 Using cached sentiment data from database for OpenAI');
      sentimentData = cached;
    }
  }

  if (!technicalData?.success) {
    const cached = await getCachedAnalysis(symbol, 'technical');
    if (cached) {
      console.log('📦 Using cached technical data from database for OpenAI');
      technicalData = cached;
    }
  }

  if (!newsData?.success) {
    const cached = await getCachedAnalysis(symbol, 'news');
    if (cached) {
      console.log('📦 Using cached news data from database for OpenAI');
      newsData = cached;
    }
  }

  if (!onChainData?.success) {
    const cached = await getCachedAnalysis(symbol, 'on-chain');
    if (cached) {
      console.log('📦 Using cached on-chain data from database for OpenAI');
      onChainData = cached;
    }
  }

  // Build context from collected data
  let context = `Cryptocurrency: ${symbol}\n\n`;
  context += `Data Collection Status:\n`;
  context += `- APIs Working: ${apiStatus.working.length}/${apiStatus.total}\n`;
  context += `- Data Quality: ${apiStatus.successRate}%\n\n`;

  // ✅ FIXED: Market Data - Use correct path (priceAggregation.aggregatedPrice)
  if (marketData?.success && marketData?.priceAggregation) {
    const agg = marketData.priceAggregation;
    context += `Market Data:\n`;
    context += `- Price: $${agg.aggregatedPrice?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Volume: $${agg.aggregatedVolume24h?.toLocaleString() || 'N/A'}\n`;
    context += `- Market Cap: $${agg.aggregatedMarketCap?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Change: ${agg.aggregatedChange24h?.toFixed(2) || 'N/A'}%\n`;
    context += `- Data Sources: ${agg.prices?.length || 0} exchanges\n\n`;
  }

  // ✅ FIXED: Sentiment - Use correct path (sentiment object)
  if (sentimentData?.success && sentimentData?.sentiment) {
    const sentiment = sentimentData.sentiment;
    context += `Social Sentiment:\n`;
    context += `- Overall Score: ${sentiment.overallScore || 'N/A'}/100\n`;
    context += `- Trend: ${sentiment.trend || 'N/A'}\n`;
    context += `- 24h Mentions: ${sentiment.mentions24h?.toLocaleString() || 'N/A'}\n`;
    const sources = Object.keys(sentimentData.sources || {}).filter(k => sentimentData.sources[k]);
    if (sources.length > 0) {
      context += `- Sources: ${sources.join(', ')}\n`;
    }
    context += `\n`;
  }

  // ✅ FIXED: Technical - Use correct path (indicators object)
  if (technicalData?.success && technicalData?.indicators) {
    const indicators = technicalData.indicators;
    context += `Technical Analysis:\n`;
    if (indicators.rsi) {
      context += `- RSI: ${indicators.rsi.value?.toFixed(2) || 'N/A'} (${indicators.rsi.signal || 'N/A'})\n`;
    }
    if (indicators.macd) {
      context += `- MACD: ${indicators.macd.signal || 'N/A'}\n`;
    }
    if (indicators.trend) {
      context += `- Trend: ${indicators.trend.direction || 'N/A'} (${indicators.trend.strength || 'N/A'})\n`;
    }
    if (indicators.volatility) {
      context += `- Volatility: ${indicators.volatility.current || 'N/A'}\n`;
    }
    context += `\n`;
  }

  // ✅ FIXED: News - Use correct path (articles array)
  if (newsData?.success && newsData?.articles?.length > 0) {
    const articles = newsData.articles.slice(0, 3);
    context += `Recent News (Top 3):\n`;
    articles.forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}`;
      if (article.source) {
        context += ` (${article.source})`;
      }
      context += `\n`;
    });
    context += `\n`;
  }

  // ✅ FIXED: On-Chain - Use correct path (check multiple possible structures)
  if (onChainData?.success) {
    if (onChainData.holderDistribution?.concentration) {
      const conc = onChainData.holderDistribution.concentration;
      context += `On-Chain Data:\n`;
      context += `- Top 10 Holders: ${conc.top10Percentage?.toFixed(2) || 'N/A'}%\n`;
      context += `- Distribution Score: ${conc.distributionScore || 'N/A'}/100\n\n`;
    } else if (onChainData.whaleActivity) {
      context += `On-Chain Data:\n`;
      context += `- Whale Activity Detected\n`;
      context += `- Data Quality: ${onChainData.dataQuality || 'N/A'}%\n\n`;
    } else if (onChainData.dataQuality > 0) {
      context += `On-Chain Data:\n`;
      context += `- Data Quality: ${onChainData.dataQuality}%\n\n`;
    }
  }

  // Failed APIs
  if (apiStatus.failed.length > 0) {
    context += `Note: The following data sources are unavailable: ${apiStatus.failed.join(', ')}\n`;
  }

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
 * ✅ FIXED: Use correct data structure paths
 */
function generateFallbackSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): string {
  let summary = `**${symbol} Data Collection Summary**\n\n`;
  
  summary += `We've collected data from ${apiStatus.working.length} out of ${apiStatus.total} sources (${apiStatus.successRate}% data quality).\n\n`;

  // ✅ FIXED: Market Data - Use correct path
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    summary += `**Market Overview:**\n`;
    summary += `- Current Price: $${agg.aggregatedPrice?.toLocaleString() || 'N/A'}\n`;
    summary += `- 24h Change: ${agg.aggregatedChange24h?.toFixed(2) || 'N/A'}%\n`;
    summary += `- Market Cap: $${agg.aggregatedMarketCap?.toLocaleString() || 'N/A'}\n\n`;
  }

  // ✅ FIXED: Sentiment - Use correct path
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    summary += `**Social Sentiment:** ${sentiment.overallScore}/100 (${sentiment.trend})\n\n`;
  }

  // ✅ FIXED: Technical - Use correct path
  if (collectedData.technical?.success && collectedData.technical?.indicators?.trend) {
    summary += `**Technical Outlook:** ${collectedData.technical.indicators.trend.direction || 'Neutral'}\n\n`;
  }

  summary += `This data will be used to provide context for the deep Caesar AI analysis. Proceed to get comprehensive research including technology analysis, team evaluation, partnerships, and risk assessment.`;

  return summary;
}
