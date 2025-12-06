/**
 * UCIE Regenerate Caesar Prompt
 * 
 * POST /api/ucie/regenerate-caesar-prompt/[symbol]
 * 
 * Regenerates Caesar AI prompt with GPT-5.1 analysis included
 * Called after GPT-5.1 analysis completes to update the prompt
 * 
 * Created: December 6, 2025
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface RegenerateRequest {
  gptAnalysis: string;
}

interface RegenerateResponse {
  success: boolean;
  caesarPrompt?: string;
  error?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<RegenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { symbol } = req.query;
  const { gptAnalysis } = req.body as RegenerateRequest;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid symbol parameter'
    });
  }

  if (!gptAnalysis) {
    return res.status(400).json({
      success: false,
      error: 'Missing gptAnalysis in request body'
    });
  }

  const normalizedSymbol = symbol.toUpperCase();
  console.log(`🔄 Regenerating Caesar prompt for ${normalizedSymbol} with GPT-5.1 analysis...`);

  try {
    // Retrieve all cached data from database
    const [marketData, sentiment, technical, news, onChain] = await Promise.all([
      getCachedAnalysis(normalizedSymbol, 'market-data'),
      getCachedAnalysis(normalizedSymbol, 'sentiment'),
      getCachedAnalysis(normalizedSymbol, 'technical'),
      getCachedAnalysis(normalizedSymbol, 'news'),
      getCachedAnalysis(normalizedSymbol, 'on-chain')
    ]);

    // Build collected data structure
    const collectedData = {
      marketData: marketData || null,
      sentiment: sentiment || null,
      technical: technical || null,
      news: news || null,
      onChain: onChain || null
    };

    // Calculate API status
    const working: string[] = [];
    const failed: string[] = [];
    
    if (marketData?.success) working.push('Market Data');
    else failed.push('Market Data');
    
    if (sentiment?.success) working.push('Sentiment');
    else failed.push('Sentiment');
    
    if (technical?.success) working.push('Technical');
    else failed.push('Technical');
    
    if (news?.success) working.push('News');
    else failed.push('News');
    
    if (onChain?.success) working.push('On-Chain');
    else failed.push('On-Chain');

    const apiStatus = {
      working,
      failed,
      total: 5,
      successRate: Math.round((working.length / 5) * 100)
    };

    // Generate Caesar prompt with GPT-5.1 analysis
    const caesarPrompt = await generateCaesarPromptPreview(
      normalizedSymbol,
      collectedData,
      apiStatus,
      gptAnalysis
    );

    console.log(`✅ Caesar prompt regenerated (${caesarPrompt.length} chars)`);

    return res.status(200).json({
      success: true,
      caesarPrompt
    });

  } catch (error) {
    console.error('❌ Failed to regenerate Caesar prompt:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate Caesar prompt'
    });
  }
}

/**
 * Generate Caesar AI Research Prompt Preview
 * (Copied from preview-data/[symbol].ts for consistency)
 */
async function generateCaesarPromptPreview(
  symbol: string,
  collectedData: any,
  apiStatus: any,
  aiAnalysis: string
): Promise<string> {
  let prompt = `# Caesar AI Research Request for ${symbol}\n\n`;
  
  prompt += `## Research Objective\n`;
  prompt += `Conduct comprehensive institutional-grade research on ${symbol} cryptocurrency, including:\n`;
  prompt += `- Technology architecture and innovation\n`;
  prompt += `- Team credentials and track record\n`;
  prompt += `- Strategic partnerships and ecosystem\n`;
  prompt += `- Competitive positioning and market dynamics\n`;
  prompt += `- Risk assessment and regulatory considerations\n`;
  prompt += `- Investment thesis and valuation analysis\n\n`;
  
  prompt += `## Available Data Context\n`;
  prompt += `Data Quality: ${apiStatus.successRate}% (${apiStatus.working.length}/${apiStatus.total} sources)\n`;
  prompt += `Working APIs: ${apiStatus.working.join(', ')}\n\n`;
  
  // Market Data
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    prompt += `### Market Data\n`;
    prompt += `- Current Price: $${(agg.averagePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    prompt += `- 24h Change: ${(agg.averageChange24h || 0) > 0 ? '+' : ''}${(agg.averageChange24h || 0).toFixed(2)}%\n`;
    prompt += `- 24h Volume: $${((agg.totalVolume24h || 0) / 1e9).toFixed(2)}B\n`;
    prompt += `- Market Cap: $${((collectedData.marketData.marketData?.marketCap || 0) / 1e9).toFixed(2)}B\n`;
    prompt += `- Data Sources: ${agg.prices?.length || 0} exchanges\n\n`;
  }
  
  // Sentiment with Deep Analysis
  if (collectedData.sentiment?.success && collectedData.sentiment?.data?.sentiment) {
    const sentiment = collectedData.sentiment.data.sentiment;
    prompt += `### Social Sentiment Analysis\n`;
    prompt += `- Overall Score: ${sentiment.overallScore || 0}/100\n`;
    prompt += `- Trend: ${sentiment.trend || 'neutral'}\n`;
    
    // Distribution breakdown
    if (sentiment.distribution) {
      const dist = sentiment.distribution;
      prompt += `- Sentiment Distribution:\n`;
      prompt += `  * Positive: ${dist.positive || 0}%\n`;
      prompt += `  * Neutral: ${dist.neutral || 0}%\n`;
      prompt += `  * Negative: ${dist.negative || 0}%\n`;
    }
    
    // Data sources
    if (collectedData.sentiment.data.sources) {
      const sources = collectedData.sentiment.data.sources;
      const sourceNames = [];
      if (sources.fearGreed) sourceNames.push('Fear & Greed Index');
      if (sources.lunarcrush) sourceNames.push('LunarCrush');
      if (sources.coinmarketcap) sourceNames.push('CoinMarketCap');
      if (sources.coingecko) sourceNames.push('CoinGecko');
      if (sources.reddit) sourceNames.push('Reddit');
      prompt += `- Data Sources: ${sourceNames.join(', ')}\n`;
    }
    prompt += `\n`;
  }
  
  // Technical Analysis
  if (collectedData.technical?.success && collectedData.technical?.indicators) {
    const indicators = collectedData.technical.indicators;
    prompt += `### Technical Analysis\n`;
    prompt += `- RSI: ${typeof indicators.rsi?.value === 'number' ? indicators.rsi.value.toFixed(2) : indicators.rsi || 'N/A'}\n`;
    prompt += `- MACD Signal: ${indicators.macd?.signal || 'neutral'}\n`;
    prompt += `- Trend Direction: ${indicators.trend?.direction || 'neutral'}\n`;
    if (indicators.trend?.strength) {
      prompt += `- Trend Strength: ${indicators.trend.strength}\n`;
    }
    if (indicators.volatility) {
      prompt += `- Volatility: ${indicators.volatility.current || 'N/A'}\n`;
    }
    prompt += `\n`;
  }
  
  // News Analysis
  if (collectedData.news?.success && collectedData.news?.articles?.length > 0) {
    prompt += `### Recent News (${collectedData.news.articles.length} articles)\n`;
    collectedData.news.articles.slice(0, 5).forEach((article: any, i: number) => {
      prompt += `${i + 1}. ${article.title}\n`;
      if (article.sentiment) {
        prompt += `   Sentiment: ${article.sentiment} (${article.sentimentScore || 0}/100)\n`;
      }
      if (article.impactScore) {
        prompt += `   Impact: ${article.impactScore}/10\n`;
      }
    });
    
    if (collectedData.news.summary) {
      prompt += `\n**News Summary:**\n`;
      prompt += `- Overall Sentiment: ${collectedData.news.summary.overallSentiment || 'neutral'}\n`;
      prompt += `- Bullish: ${collectedData.news.summary.bullishCount || 0}, Bearish: ${collectedData.news.summary.bearishCount || 0}, Neutral: ${collectedData.news.summary.neutralCount || 0}\n`;
      prompt += `- Average Impact: ${(collectedData.news.summary.averageImpact || 0).toFixed(1)}/10\n`;
    }
    prompt += `\n`;
  }
  
  // On-Chain Intelligence with Deep Analysis
  if (collectedData.onChain?.success) {
    prompt += `### On-Chain Intelligence\n`;
    
    if (collectedData.onChain.whaleActivity) {
      const whale = collectedData.onChain.whaleActivity.summary || collectedData.onChain.whaleActivity;
      prompt += `**Whale Activity:**\n`;
      prompt += `- Total Transactions: ${whale.totalTransactions || 0}\n`;
      prompt += `- Total Value: $${((whale.totalValueUSD || 0) / 1e6).toFixed(2)}M\n`;
      prompt += `- Exchange Deposits: ${whale.exchangeDeposits || 0} (selling pressure)\n`;
      prompt += `- Exchange Withdrawals: ${whale.exchangeWithdrawals || 0} (accumulation)\n`;
      const netFlow = (whale.exchangeWithdrawals || 0) - (whale.exchangeDeposits || 0);
      prompt += `- Net Flow: ${netFlow} (${netFlow > 0 ? 'BULLISH - accumulation' : netFlow < 0 ? 'BEARISH - distribution' : 'NEUTRAL'})\n`;
    }
    
    if (collectedData.onChain.networkMetrics) {
      prompt += `\n**Network Metrics:**\n`;
      prompt += `- Hash Rate: ${(collectedData.onChain.networkMetrics.hashRate || 0).toFixed(2)} TH/s\n`;
      prompt += `- Mempool Size: ${(collectedData.onChain.networkMetrics.mempoolSize || 0).toLocaleString()} transactions\n`;
    }
    prompt += `\n`;
  }
  
  // ✅ CRITICAL: AI Summary (GPT-5.1 Analysis)
  prompt += `## AI-Generated Market Summary (GPT-5.1 Enhanced Reasoning)\n`;
  prompt += `${aiAnalysis}\n\n`;
  
  // Research Instructions
  prompt += `## Research Instructions\n`;
  prompt += `Using the above data as context, conduct deep research on ${symbol} covering:\n\n`;
  prompt += `1. **Technology & Innovation** (25%)\n`;
  prompt += `   - Core technology architecture and consensus mechanism\n`;
  prompt += `   - Unique innovations and competitive advantages\n`;
  prompt += `   - Scalability, security, and decentralization trade-offs\n`;
  prompt += `   - Development activity and GitHub metrics\n`;
  prompt += `   - Roadmap and upcoming technical milestones\n\n`;
  
  prompt += `2. **Team & Leadership** (15%)\n`;
  prompt += `   - Founder backgrounds and track records\n`;
  prompt += `   - Core team credentials and expertise\n`;
  prompt += `   - Advisory board and strategic advisors\n`;
  prompt += `   - Team transparency and communication\n`;
  prompt += `   - Previous successes and failures\n\n`;
  
  prompt += `3. **Partnerships & Ecosystem** (20%)\n`;
  prompt += `   - Strategic partnerships and integrations\n`;
  prompt += `   - Institutional adoption and enterprise clients\n`;
  prompt += `   - Developer ecosystem and dApp activity\n`;
  prompt += `   - Community size and engagement\n`;
  prompt += `   - Network effects and ecosystem growth\n\n`;
  
  prompt += `4. **Competitive Analysis** (15%)\n`;
  prompt += `   - Direct competitors and market positioning\n`;
  prompt += `   - Competitive advantages and moats\n`;
  prompt += `   - Market share and growth trajectory\n`;
  prompt += `   - Differentiation factors\n`;
  prompt += `   - Threats from emerging competitors\n\n`;
  
  prompt += `5. **Risk Assessment** (15%)\n`;
  prompt += `   - Technical risks (bugs, exploits, centralization)\n`;
  prompt += `   - Regulatory risks and compliance status\n`;
  prompt += `   - Market risks (liquidity, volatility, correlation)\n`;
  prompt += `   - Operational risks (team, funding, governance)\n`;
  prompt += `   - Black swan scenarios and tail risks\n\n`;
  
  prompt += `6. **Investment Thesis** (10%)\n`;
  prompt += `   - Bull case: Key catalysts and growth drivers\n`;
  prompt += `   - Bear case: Major concerns and red flags\n`;
  prompt += `   - Valuation analysis and price targets\n`;
  prompt += `   - Risk-reward assessment\n`;
  prompt += `   - Recommended position sizing and time horizon\n\n`;
  
  prompt += `## Output Requirements\n`;
  prompt += `- Provide comprehensive, institutional-grade research (3000-5000 words)\n`;
  prompt += `- Include specific data points, metrics, and evidence\n`;
  prompt += `- Cite all sources with URLs for verification\n`;
  prompt += `- Use professional, objective tone\n`;
  prompt += `- Highlight both opportunities and risks\n`;
  prompt += `- Provide actionable insights for investors\n`;
  
  return prompt;
}

export default withOptionalAuth(handler);
