/**
 * UCIE Context Aggregator
 * 
 * Aggregates all available cached data for a symbol to provide
 * comprehensive context to AI services (OpenAI, Caesar, Gemini).
 * 
 * This enables AI to make better decisions by considering:
 * - Market data (price, volume, market cap)
 * - Technical indicators (RSI, MACD, trends)
 * - Sentiment analysis (social media, news)
 * - On-chain metrics (whale activity, holder distribution)
 * - Risk assessment (volatility, correlations)
 * - Previous research and predictions
 */

import { getCachedAnalysis, AnalysisType } from './cacheUtils';

/**
 * Comprehensive context for AI analysis
 */
export interface ComprehensiveContext {
  marketData: any | null;
  technical: any | null;
  sentiment: any | null;
  news: any | null;
  onChain: any | null;
  risk: any | null;
  predictions: any | null;
  defi: any | null;
  derivatives: any | null;
  research: any | null;
  dataQuality: number;
  availableData: string[];
  timestamp: string;
}

/**
 * Aggregate all available cached data for a symbol (USER-SPECIFIC)
 * 
 * @param symbol - Token symbol (e.g., 'BTC', 'ETH')
 * @param userId - User ID for data isolation (REQUIRED for security)
 * @returns Comprehensive context with all available data
 */
export async function getComprehensiveContext(
  symbol: string,
  userId?: string
): Promise<ComprehensiveContext> {
  console.log(`📊 Aggregating context for ${symbol} (user: ${userId || 'anonymous'})...`);
  
  // Fetch all available cached data in parallel (user-specific)
  const [
    marketData,
    technical,
    sentiment,
    news,
    onChain,
    risk,
    predictions,
    defi,
    derivatives,
    research
  ] = await Promise.all([
    getCachedAnalysis(symbol, 'market-data', userId),
    getCachedAnalysis(symbol, 'technical', userId),
    getCachedAnalysis(symbol, 'sentiment', userId),
    getCachedAnalysis(symbol, 'news', userId),
    getCachedAnalysis(symbol, 'on-chain', userId),
    getCachedAnalysis(symbol, 'risk', userId),
    getCachedAnalysis(symbol, 'predictions', userId),
    getCachedAnalysis(symbol, 'defi', userId),
    getCachedAnalysis(symbol, 'derivatives', userId),
    getCachedAnalysis(symbol, 'research', userId)
  ]);

  // Determine which data is available
  const availableData: string[] = [];
  if (marketData) availableData.push('market-data');
  if (technical) availableData.push('technical');
  if (sentiment) availableData.push('sentiment');
  if (news) availableData.push('news');
  if (onChain) availableData.push('on-chain');
  if (risk) availableData.push('risk');
  if (predictions) availableData.push('predictions');
  if (defi) availableData.push('defi');
  if (derivatives) availableData.push('derivatives');
  if (research) availableData.push('research');

  // Calculate overall data quality (percentage of available data)
  const dataQuality = (availableData.length / 10) * 100;

  console.log(`✅ Context aggregated: ${dataQuality.toFixed(0)}% complete (${availableData.length}/10 sources)`);
  console.log(`📊 Available: ${availableData.join(', ')}`);

  return {
    marketData,
    technical,
    sentiment,
    news,
    onChain,
    risk,
    predictions,
    defi,
    derivatives,
    research,
    dataQuality,
    availableData,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format context for AI consumption
 * Creates a structured, readable prompt with all available data
 * 
 * @param context - Comprehensive context object
 * @returns Formatted string for AI prompt
 */
export function formatContextForAI(context: ComprehensiveContext): string {
  let prompt = `# Comprehensive Analysis Context for ${context.marketData?.symbol || 'Unknown'}\n\n`;
  prompt += `**Data Quality**: ${context.dataQuality.toFixed(0)}% (${context.availableData.length}/10 sources)\n`;
  prompt += `**Available Data**: ${context.availableData.join(', ')}\n`;
  prompt += `**Timestamp**: ${new Date(context.timestamp).toLocaleString()}\n\n`;

  // Market Data Section
  if (context.marketData) {
    prompt += `## 📈 Market Data\n`;
    prompt += `- **Price**: $${context.marketData.price?.toLocaleString() || 'N/A'}\n`;
    prompt += `- **24h Change**: ${context.marketData.change24h || 'N/A'}%\n`;
    prompt += `- **24h Volume**: $${context.marketData.volume24h?.toLocaleString() || 'N/A'}\n`;
    prompt += `- **Market Cap**: $${context.marketData.marketCap?.toLocaleString() || 'N/A'}\n`;
    prompt += `- **Circulating Supply**: ${context.marketData.circulatingSupply?.toLocaleString() || 'N/A'}\n\n`;
  }

  // Technical Analysis Section
  if (context.technical) {
    prompt += `## 📊 Technical Indicators\n`;
    if (context.technical.rsi) {
      prompt += `- **RSI**: ${context.technical.rsi.value || 'N/A'} (${context.technical.rsi.signal || 'N/A'})\n`;
    }
    if (context.technical.macd) {
      prompt += `- **MACD**: ${context.technical.macd.signal || 'N/A'}\n`;
    }
    if (context.technical.trend) {
      prompt += `- **Trend**: ${context.technical.trend}\n`;
    }
    if (context.technical.multiTimeframeConsensus) {
      prompt += `- **Multi-Timeframe Consensus**: ${context.technical.multiTimeframeConsensus.overall || 'N/A'}\n`;
    }
    prompt += `\n`;
  }

  // Sentiment Analysis Section (ENHANCED for GPT-5.1)
  if (context.sentiment) {
    prompt += `## 💭 Sentiment Analysis\n`;
    prompt += `- **Overall Sentiment Score**: ${context.sentiment.overallScore || 'N/A'}/100 (${context.sentiment.sentiment || 'neutral'})\n`;
    
    // Fear & Greed Index (Primary Indicator)
    if (context.sentiment.fearGreedIndex) {
      prompt += `- **Fear & Greed Index**: ${context.sentiment.fearGreedIndex.value}/100 (${context.sentiment.fearGreedIndex.classification})\n`;
      prompt += `  - This is the primary market sentiment indicator\n`;
    }
    
    // LunarCrush Social Metrics
    if (context.sentiment.lunarCrush) {
      prompt += `- **LunarCrush Social Metrics**:\n`;
      prompt += `  - Social Score: ${context.sentiment.lunarCrush.socialScore || 'N/A'}/100\n`;
      prompt += `  - Galaxy Score: ${context.sentiment.lunarCrush.galaxyScore || 'N/A'}/100\n`;
      prompt += `  - Sentiment Score: ${context.sentiment.lunarCrush.sentimentScore || 'N/A'}/100\n`;
      prompt += `  - Social Volume: ${context.sentiment.lunarCrush.socialVolume?.toLocaleString() || 'N/A'}\n`;
      prompt += `  - Social Volume Change (24h): ${context.sentiment.lunarCrush.socialVolumeChange24h || 'N/A'}%\n`;
      prompt += `  - Social Dominance: ${context.sentiment.lunarCrush.socialDominance || 'N/A'}%\n`;
      prompt += `  - Alt Rank: ${context.sentiment.lunarCrush.altRank || 'N/A'}\n`;
      prompt += `  - Trending Score: ${context.sentiment.lunarCrush.trendingScore || 'N/A'}/100\n`;
    }
    
    // Reddit Community Sentiment
    if (context.sentiment.reddit) {
      prompt += `- **Reddit Community Sentiment**:\n`;
      prompt += `  - Mentions (24h): ${context.sentiment.reddit.mentions24h || 'N/A'}\n`;
      prompt += `  - Sentiment Score: ${context.sentiment.reddit.sentiment || 'N/A'}/100\n`;
      prompt += `  - Active Subreddits: ${context.sentiment.reddit.activeSubreddits || 'N/A'}\n`;
    }
    
    // Twitter/X Sentiment (if available)
    if (context.sentiment.twitter) {
      prompt += `- **Twitter/X Sentiment**:\n`;
      prompt += `  - Sentiment Score: ${context.sentiment.twitter.sentiment || 'N/A'}/100\n`;
      prompt += `  - Tweet Volume: ${context.sentiment.twitter.volume?.toLocaleString() || 'N/A'}\n`;
    }
    
    prompt += `- **Data Quality**: ${context.sentiment.dataQuality || 'N/A'}%\n`;
    prompt += `\n**GPT-5.1 Analysis Guidance**: Analyze sentiment trends, social volume changes, and Fear & Greed Index to assess market psychology and potential price movements.\n\n`;
  }

  // News Section
  if (context.news && context.news.articles) {
    prompt += `## 📰 Recent News (Top 5)\n`;
    context.news.articles.slice(0, 5).forEach((article: any, i: number) => {
      prompt += `${i + 1}. **${article.title}** (${article.sentiment || 'neutral'})\n`;
      if (article.summary) {
        prompt += `   ${article.summary.substring(0, 100)}...\n`;
      }
    });
    prompt += `\n`;
  }

  // On-Chain Metrics Section
  if (context.onChain) {
    prompt += `## ⛓️ On-Chain Metrics\n`;
    if (context.onChain.whaleActivity) {
      prompt += `- **Whale Activity**: ${context.onChain.whaleActivity}\n`;
    }
    if (context.onChain.exchangeFlows) {
      prompt += `- **Exchange Flows**: ${context.onChain.exchangeFlows.trend || 'N/A'}\n`;
      prompt += `  - Net Flow: $${context.onChain.exchangeFlows.netFlow?.toLocaleString() || 'N/A'}\n`;
    }
    if (context.onChain.holderConcentration) {
      prompt += `- **Holder Distribution Score**: ${context.onChain.holderConcentration.distributionScore || 'N/A'}/100\n`;
      prompt += `- **Top 10 Holders**: ${context.onChain.holderConcentration.top10Percentage || 'N/A'}%\n`;
    }
    prompt += `\n`;
  }

  // Risk Assessment Section
  if (context.risk) {
    prompt += `## ⚠️ Risk Assessment\n`;
    prompt += `- **Overall Risk Score**: ${context.risk.overallScore || 'N/A'}/100\n`;
    if (context.risk.volatility) {
      prompt += `- **30-Day Volatility**: ${context.risk.volatility.std30d || 'N/A'}%\n`;
    }
    if (context.risk.maxDrawdown) {
      prompt += `- **Historical Max Drawdown**: ${context.risk.maxDrawdown.historical || 'N/A'}%\n`;
    }
    if (context.risk.correlations) {
      prompt += `- **BTC Correlation**: ${context.risk.correlations.btc || 'N/A'}\n`;
    }
    prompt += `\n`;
  }

  // Predictions Section
  if (context.predictions) {
    prompt += `## 🔮 Price Predictions\n`;
    if (context.predictions.price24h) {
      prompt += `- **24h Prediction**: $${context.predictions.price24h.mid || 'N/A'} (±${context.predictions.price24h.confidence || 'N/A'}%)\n`;
    }
    if (context.predictions.price7d) {
      prompt += `- **7d Prediction**: $${context.predictions.price7d.mid || 'N/A'} (±${context.predictions.price7d.confidence || 'N/A'}%)\n`;
    }
    if (context.predictions.scenarios) {
      prompt += `- **Bull Case**: $${context.predictions.scenarios.bullCase?.target || 'N/A'}\n`;
      prompt += `- **Bear Case**: $${context.predictions.scenarios.bearCase?.target || 'N/A'}\n`;
    }
    prompt += `\n`;
  }

  // DeFi Metrics Section
  if (context.defi) {
    prompt += `## 🏦 DeFi Metrics\n`;
    if (context.defi.tvl !== undefined) {
      prompt += `- **Total Value Locked**: $${context.defi.tvl?.toLocaleString() || 'N/A'}\n`;
    }
    if (context.defi.protocolRevenue !== undefined) {
      prompt += `- **Protocol Revenue**: $${context.defi.protocolRevenue?.toLocaleString() || 'N/A'}\n`;
    }
    if (context.defi.utilityScore !== undefined) {
      prompt += `- **Token Utility Score**: ${context.defi.utilityScore}/100\n`;
    }
    prompt += `\n`;
  }

  // Derivatives Section
  if (context.derivatives) {
    prompt += `## 📉 Derivatives Data\n`;
    if (context.derivatives.fundingRates) {
      prompt += `- **Funding Rates**: ${context.derivatives.fundingRates.average || 'N/A'}%\n`;
    }
    if (context.derivatives.openInterest) {
      prompt += `- **Open Interest**: $${context.derivatives.openInterest.total?.toLocaleString() || 'N/A'}\n`;
    }
    if (context.derivatives.longShortRatio) {
      prompt += `- **Long/Short Ratio**: ${context.derivatives.longShortRatio.current || 'N/A'} (${context.derivatives.longShortRatio.trend || 'N/A'})\n`;
    }
    prompt += `\n`;
  }

  // Previous Research Section
  if (context.research) {
    prompt += `## 🔬 Previous Research Summary\n`;
    prompt += `${context.research.summary || 'No previous research available'}\n\n`;
    if (context.research.keyFindings && context.research.keyFindings.length > 0) {
      prompt += `**Key Findings**:\n`;
      context.research.keyFindings.forEach((finding: string, i: number) => {
        prompt += `${i + 1}. ${finding}\n`;
      });
    }
    prompt += `\n`;
  }

  return prompt;
}

/**
 * Get minimal context (for faster AI calls) (USER-SPECIFIC)
 * Only includes essential data: market, technical, sentiment
 * 
 * @param symbol - Token symbol
 * @param userId - User ID for data isolation (REQUIRED for security)
 * @returns Minimal context string
 */
export async function getMinimalContext(
  symbol: string,
  userId?: string
): Promise<string> {
  console.log(`📊 Getting minimal context for ${symbol} (user: ${userId || 'anonymous'})...`);
  
  const [marketData, technical, sentiment] = await Promise.all([
    getCachedAnalysis(symbol, 'market-data', userId),
    getCachedAnalysis(symbol, 'technical', userId),
    getCachedAnalysis(symbol, 'sentiment', userId)
  ]);

  let context = `${symbol} Quick Context:\n`;
  
  if (marketData) {
    context += `Price: $${marketData.price?.toLocaleString() || 'N/A'}, `;
    context += `24h: ${marketData.change24h || 'N/A'}%, `;
    context += `Volume: $${marketData.volume24h?.toLocaleString() || 'N/A'}\n`;
  }
  
  if (technical) {
    context += `RSI: ${technical.rsi?.value || 'N/A'}, `;
    context += `Trend: ${technical.trend || 'N/A'}, `;
    context += `Signal: ${technical.multiTimeframeConsensus?.overall || 'N/A'}\n`;
  }
  
  if (sentiment) {
    context += `Sentiment: ${sentiment.overallScore || 'N/A'}/100\n`;
  }

  console.log(`✅ Minimal context retrieved`);
  return context;
}

/**
 * Get context summary (for logging/debugging)
 * 
 * @param context - Comprehensive context object
 * @returns Summary string
 */
export function getContextSummary(context: ComprehensiveContext): string {
  return `Context for ${context.marketData?.symbol || 'Unknown'}: ${context.dataQuality.toFixed(0)}% complete (${context.availableData.join(', ')})`;
}
