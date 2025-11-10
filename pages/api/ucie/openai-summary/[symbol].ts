/**
 * OpenAI Summary API Endpoint
 * 
 * Generates a comprehensive summary of all collected UCIE data
 * using OpenAI GPT-4o for Caesar AI consumption.
 * 
 * POST /api/ucie/openai-summary/[symbol]
 * 
 * Features:
 * - Comprehensive data summarization
 * - Structured output for Caesar AI
 * - Database caching
 * - Quality scoring
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface OpenAISummaryRequest {
  collectedData: any;
  forceRefresh?: boolean;
}

interface OpenAISummaryResponse {
  success: boolean;
  summaryText: string;
  dataQuality: number;
  apiStatus: {
    marketData: boolean;
    sentiment: boolean;
    news: boolean;
    technical: boolean;
    onChain: boolean;
    risk: boolean;
    predictions: boolean;
    derivatives: boolean;
    defi: boolean;
  };
  timestamp: string;
  cached?: boolean;
  error?: string;
}

// Cache TTL: 15 minutes (same as other endpoints)
const CACHE_TTL = 15 * 60; // 900 seconds

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<OpenAISummaryResponse>
) {
  // Get user info if authenticated
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      summaryText: '',
      dataQuality: 0,
      apiStatus: {} as any,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed. Use POST.'
    });
  }
  
  const { symbol } = req.query;
  const { collectedData, forceRefresh } = req.body as OpenAISummaryRequest;
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      summaryText: '',
      dataQuality: 0,
      apiStatus: {} as any,
      timestamp: new Date().toISOString(),
      error: 'Invalid symbol parameter'
    });
  }
  
  const symbolUpper = symbol.toUpperCase();
  
  // Validate collected data
  if (!collectedData) {
    return res.status(400).json({
      success: false,
      summaryText: '',
      dataQuality: 0,
      apiStatus: {} as any,
      timestamp: new Date().toISOString(),
      error: 'Missing collectedData in request body'
    });
  }
  
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedAnalysis(symbolUpper, 'openai-summary');
      if (cached) {
        console.log(`✅ OpenAI summary cache hit for ${symbolUpper}`);
        return res.status(200).json({
          ...cached,
          cached: true
        });
      }
    }
    
    console.log(`🤖 Generating OpenAI summary for ${symbolUpper}...`);
    
    // Build API status
    const apiStatus = {
      marketData: !!collectedData.marketData,
      sentiment: !!collectedData.sentiment,
      news: !!collectedData.news,
      technical: !!collectedData.technical,
      onChain: !!collectedData.onChain,
      risk: !!collectedData.risk,
      predictions: !!collectedData.predictions,
      derivatives: !!collectedData.derivatives,
      defi: !!collectedData.defi
    };
    
    // Build comprehensive context for OpenAI
    const contextParts: string[] = [];
    
    // Market Data
    if (collectedData.marketData) {
      const md = collectedData.marketData;
      contextParts.push(`MARKET DATA:
- Current Price: $${md.priceAggregation?.prices?.vwap?.toLocaleString() || 'N/A'}
- 24h Volume: $${(md.priceAggregation?.volume24h / 1e6)?.toFixed(2) || 'N/A'}M
- Market Cap: $${(md.marketData?.marketCap / 1e9)?.toFixed(2) || 'N/A'}B
- 24h Change: ${md.priceAggregation?.change24h?.toFixed(2) || 'N/A'}%
- Data Quality: ${md.dataQuality || 0}%`);
    }
    
    // Technical Analysis
    if (collectedData.technical) {
      const tech = collectedData.technical;
      contextParts.push(`TECHNICAL ANALYSIS:
- Overall Signal: ${tech.signals?.overall || 'N/A'}
- Confidence: ${tech.signals?.confidence || 0}%
- RSI: ${tech.indicators?.rsi?.toFixed(2) || 'N/A'}
- MACD: ${tech.indicators?.macd?.histogram?.toFixed(2) || 'N/A'}
- Trend: ${tech.trend?.direction || 'N/A'}`);
    }
    
    // Sentiment
    if (collectedData.sentiment) {
      const sent = collectedData.sentiment;
      contextParts.push(`SOCIAL SENTIMENT:
- Overall Score: ${sent.sentiment?.overallScore || 0}
- Sentiment: ${sent.sentiment?.sentiment || 'N/A'}
- LunarCrush Social Score: ${sent.sentiment?.lunarCrush?.socialScore || 'N/A'}
- Twitter Mentions: ${sent.sentiment?.twitter?.mentions24h || 0}
- Reddit Mentions: ${sent.sentiment?.reddit?.mentions24h || 0}`);
    }
    
    // News
    if (collectedData.news) {
      const news = collectedData.news;
      contextParts.push(`NEWS ANALYSIS:
- Total Articles: ${news.articles?.length || 0}
- Overall Sentiment: ${news.summary?.overallSentiment || 'N/A'}
- Bullish: ${news.summary?.bullishCount || 0}
- Bearish: ${news.summary?.bearishCount || 0}
- Neutral: ${news.summary?.neutralCount || 0}
- Major News: ${news.summary?.majorNews?.length || 0} articles`);
    }
    
    // On-Chain
    if (collectedData.onChain) {
      const chain = collectedData.onChain;
      contextParts.push(`ON-CHAIN ANALYTICS:
- Whale Activity: ${chain.whaleActivity?.summary?.totalTransactions || 0} transactions
- Exchange Flows: ${chain.exchangeFlows?.trend || 'N/A'}
- Holder Distribution: Top 10 hold ${chain.holderDistribution?.top10Percentage || 0}%
- Network Activity: ${chain.networkActivity?.activeAddresses || 'N/A'} addresses`);
    }
    
    // Risk Assessment
    if (collectedData.risk) {
      const risk = collectedData.risk;
      contextParts.push(`RISK ASSESSMENT:
- Overall Risk Score: ${risk.riskScore?.overallScore || 0}/100
- Risk Level: ${risk.riskScore?.riskLevel || 'N/A'}
- Volatility (30d): ${(risk.volatilityMetrics?.annualized30d * 100)?.toFixed(2) || 'N/A'}%
- Max Drawdown: ${(risk.maxDrawdownMetrics?.expectedMaxDrawdown * 100)?.toFixed(2) || 'N/A'}%`);
    }
    
    // Predictions
    if (collectedData.predictions) {
      const pred = collectedData.predictions;
      contextParts.push(`PRICE PREDICTIONS:
- 24h Prediction: $${pred.predictions?.price24h?.mid?.toLocaleString() || 'N/A'}
- 7d Prediction: $${pred.predictions?.price7d?.mid?.toLocaleString() || 'N/A'}
- 30d Prediction: $${pred.predictions?.price30d?.mid?.toLocaleString() || 'N/A'}
- Model Accuracy: ${pred.modelPerformance?.accuracy || 0}%`);
    }
    
    // Derivatives
    if (collectedData.derivatives) {
      const deriv = collectedData.derivatives;
      contextParts.push(`DERIVATIVES:
- Overall Risk: ${deriv.overallRisk || 'N/A'}
- Funding Rate: ${deriv.fundingAnalysis?.currentRate || 'N/A'}
- Open Interest: ${deriv.openInterestAnalysis?.trend || 'N/A'}
- Liquidation Risk: ${deriv.liquidationAnalysis?.riskLevel || 'N/A'}`);
    }
    
    // DeFi
    if (collectedData.defi) {
      const defi = collectedData.defi;
      contextParts.push(`DEFI METRICS:
- Is DeFi Protocol: ${defi.isDeFiProtocol ? 'Yes' : 'No'}
- TVL: ${defi.tvlAnalysis?.currentTVL ? '$' + (defi.tvlAnalysis.currentTVL / 1e9).toFixed(2) + 'B' : 'N/A'}
- Revenue: ${defi.revenueAnalysis?.current?.revenue24h || 'N/A'}
- Utility Score: ${defi.utilityAnalysis?.utilityScore || 0}/100`);
    }
    
    const fullContext = contextParts.join('\n\n');
    
    // Generate OpenAI summary
    console.log(`📝 Sending ${fullContext.length} chars to OpenAI...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a cryptocurrency analysis expert. Summarize the provided data comprehensively for Caesar AI research. Focus on:
1. Key market metrics and trends
2. Technical signals and indicators
3. Sentiment and social metrics
4. Risk factors and opportunities
5. Price predictions and forecasts
6. Notable on-chain activity
7. Overall market outlook

Be concise but comprehensive. Use bullet points for clarity.`
        },
        {
          role: 'user',
          content: `Analyze and summarize this ${symbolUpper} data:\n\n${fullContext}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const summaryText = completion.choices[0]?.message?.content || '';
    
    console.log(`✅ OpenAI summary generated (${summaryText.length} chars)`);
    
    // Build response
    const response: OpenAISummaryResponse = {
      success: true,
      summaryText,
      dataQuality: collectedData.dataQuality || 0,
      apiStatus,
      timestamp: new Date().toISOString(),
      cached: false
    };
    
    // Store in dedicated OpenAI analysis table (REPLACES old data)
    const { storeOpenAIAnalysis } = await import('../../../../lib/ucie/analysisStorage');
    await storeOpenAIAnalysis(
      symbolUpper,
      summaryText,
      response.dataQuality,
      apiStatus,
      userId,
      userEmail
    );
    
    console.log(`✅ OpenAI analysis stored in database (replaced old data)`);
    
    // Also cache for quick retrieval
    await setCachedAnalysis(
      symbolUpper,
      'openai-summary',
      response,
      CACHE_TTL,
      response.dataQuality,
      userId,
      userEmail
    );
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error(`❌ OpenAI summary error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      summaryText: '',
      dataQuality: 0,
      apiStatus: {} as any,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to generate summary'
    });
  }
}

export default withOptionalAuth(handler);
