/**
 * UCIE OpenAI Analysis API
 * 
 * POST /api/ucie/openai-analysis/[symbol]
 * 
 * Generates OpenAI GPT-4o analysis from cached database data.
 * This is a separate step after data collection, allowing for visual feedback.
 * 
 * Flow:
 * 1. User collects data via /api/ucie/preview-data/[symbol]
 * 2. User reviews data and clicks "Analyze with AI"
 * 3. This endpoint generates OpenAI analysis from database
 * 4. Analysis is stored in database for Caesar AI access
 * 5. User can then optionally proceed to Caesar AI deep analysis
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getCachedAnalysis, setCachedAnalysis, AnalysisType } from '../../../../lib/ucie/cacheUtils';
import { storeOpenAISummary } from '../../../../lib/ucie/openaiSummaryStorage';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface OpenAIAnalysisResponse {
  success: boolean;
  data?: {
    symbol: string;
    timestamp: string;
    analysis: string;
    dataQuality: number;
    dataAvailability: {
      marketData: boolean;
      sentiment: boolean;
      technical: boolean;
      news: boolean;
      onChain: boolean;
    };
    timing: {
      total: number;
      generation: number;
    };
  };
  error?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<OpenAIAnalysisResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid symbol parameter'
    });
  }

  const normalizedSymbol = symbol.toUpperCase();
  
  console.log(`🤖 Generating OpenAI analysis for ${normalizedSymbol}...`);

  try {
    const startTime = Date.now();

    // ✅ STEP 1: Check if analysis already exists (< 15 minutes old)
    const existingAnalysis = await getCachedAnalysis(
      normalizedSymbol,
      'openai-analysis' as AnalysisType,
      userId,
      userEmail,
      15 * 60 // 15 minutes TTL
    );

    if (existingAnalysis) {
      console.log(`✅ Returning cached OpenAI analysis (< 15 min old)`);
      return res.status(200).json({
        success: true,
        data: {
          symbol: normalizedSymbol,
          timestamp: existingAnalysis.timestamp || new Date().toISOString(),
          analysis: existingAnalysis.analysis || existingAnalysis.summary,
          dataQuality: existingAnalysis.dataQuality || 0,
          dataAvailability: existingAnalysis.dataAvailability || {},
          timing: {
            total: 0,
            generation: 0
          }
        }
      });
    }

    // ✅ STEP 2: Read all data from database
    console.log(`📦 Reading data from Supabase database...`);
    const [marketData, sentimentData, technicalData, newsData, onChainData] = await Promise.all([
      getCachedAnalysis(normalizedSymbol, 'market-data'),
      getCachedAnalysis(normalizedSymbol, 'sentiment'),
      getCachedAnalysis(normalizedSymbol, 'technical'),
      getCachedAnalysis(normalizedSymbol, 'news'),
      getCachedAnalysis(normalizedSymbol, 'on-chain')
    ]);

    // Log what we retrieved
    const dataAvailability = {
      marketData: !!marketData?.success,
      sentiment: !!sentimentData?.success,
      technical: !!technicalData?.success,
      news: !!newsData?.success,
      onChain: !!onChainData?.success
    };

    console.log(`📦 Database retrieval results:`);
    console.log(`   Market Data: ${dataAvailability.marketData ? '✅' : '❌'}`);
    console.log(`   Sentiment: ${dataAvailability.sentiment ? '✅' : '❌'}`);
    console.log(`   Technical: ${dataAvailability.technical ? '✅' : '❌'}`);
    console.log(`   News: ${dataAvailability.news ? '✅' : '❌'}`);
    console.log(`   On-Chain: ${dataAvailability.onChain ? '✅' : '❌'}`);

    // Calculate data quality
    const availableCount = Object.values(dataAvailability).filter(Boolean).length;
    const dataQuality = Math.round((availableCount / 5) * 100);

    if (dataQuality < 40) {
      return res.status(400).json({
        success: false,
        error: `Insufficient data for analysis (${dataQuality}% quality). Please collect data first via /api/ucie/preview-data/${normalizedSymbol}`
      });
    }

    // ✅ STEP 3: Build context from database data
    const context = buildAnalysisContext(
      normalizedSymbol,
      marketData,
      sentimentData,
      technicalData,
      newsData,
      onChainData,
      dataQuality
    );

    // ✅ STEP 4: Generate OpenAI analysis
    console.log(`🤖 Generating OpenAI GPT-4o analysis...`);
    const generationStart = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert cryptocurrency analyst. Provide a comprehensive analysis based on the collected data. Structure your analysis as follows:

1. **Executive Summary** (2-3 sentences)
   - Current market position and key takeaways

2. **Market Analysis**
   - Price action and volume trends
   - Market cap and liquidity assessment
   - Key support/resistance levels

3. **Technical Indicators**
   - RSI, MACD, and momentum analysis
   - Trend strength and direction
   - Volatility assessment

4. **Sentiment & Social**
   - Overall market sentiment
   - Social media trends
   - Community engagement

5. **News & Developments**
   - Recent significant news
   - Impact on price and sentiment

6. **On-Chain Metrics** (if available)
   - Holder distribution
   - Whale activity
   - Network health

7. **Risk Assessment**
   - Key risks and concerns
   - Market conditions
   - Volatility factors

8. **Outlook & Recommendations**
   - Short-term outlook (1-7 days)
   - Medium-term outlook (1-4 weeks)
   - Key levels to watch

Be professional, data-driven, and actionable. Use bullet points for clarity.`
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.7,
      max_tokens: 2000, // Comprehensive analysis
      timeout: 30000 // 30 seconds timeout
    });

    const analysis = completion.choices[0].message.content || 'Analysis generation failed';
    const generationTime = Date.now() - generationStart;
    
    console.log(`✅ OpenAI analysis generated in ${generationTime}ms`);

    // ✅ STEP 5: Store analysis in database
    console.log(`💾 Storing OpenAI analysis in database...`);
    
    const analysisData = {
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      analysis,
      dataQuality,
      dataAvailability,
      timing: {
        total: Date.now() - startTime,
        generation: generationTime
      }
    };

    // Store in ucie_analysis_cache as 'openai-analysis' type
    await setCachedAnalysis(
      normalizedSymbol,
      'openai-analysis' as AnalysisType,
      analysisData,
      15 * 60, // 15 minutes TTL
      dataQuality,
      userId,
      userEmail
    );

    // Also store using legacy storeOpenAISummary for Caesar AI compatibility
    await storeOpenAISummary(
      normalizedSymbol,
      analysis,
      dataQuality,
      {
        working: Object.keys(dataAvailability).filter(k => dataAvailability[k as keyof typeof dataAvailability]),
        failed: Object.keys(dataAvailability).filter(k => !dataAvailability[k as keyof typeof dataAvailability]),
        total: 5,
        successRate: dataQuality
      },
      dataAvailability,
      15 * 60
    );

    console.log(`✅ OpenAI analysis stored in database`);

    // ✅ STEP 6: Return analysis
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Total processing time: ${totalTime}ms`);

    return res.status(200).json({
      success: true,
      data: analysisData
    });

  } catch (error) {
    console.error('❌ OpenAI analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate OpenAI analysis'
    });
  }
}

/**
 * Build analysis context from database data
 */
function buildAnalysisContext(
  symbol: string,
  marketData: any,
  sentimentData: any,
  technicalData: any,
  newsData: any,
  onChainData: any,
  dataQuality: number
): string {
  let context = `Cryptocurrency: ${symbol}\n`;
  context += `Data Quality: ${dataQuality}%\n`;
  context += `Analysis Timestamp: ${new Date().toISOString()}\n\n`;

  // Market Data
  if (marketData?.success && marketData?.priceAggregation) {
    const agg = marketData.priceAggregation;
    context += `=== MARKET DATA ===\n`;
    context += `Current Price: $${agg.aggregatedPrice?.toLocaleString() || 'N/A'}\n`;
    context += `24h Change: ${agg.aggregatedChange24h?.toFixed(2) || 'N/A'}%\n`;
    context += `24h Volume: $${agg.aggregatedVolume24h?.toLocaleString() || 'N/A'}\n`;
    context += `Market Cap: $${agg.aggregatedMarketCap?.toLocaleString() || 'N/A'}\n`;
    context += `Data Sources: ${agg.prices?.length || 0} exchanges\n`;
    
    if (agg.prices && agg.prices.length > 0) {
      context += `Price Range: $${Math.min(...agg.prices.map((p: any) => p.price)).toLocaleString()} - $${Math.max(...agg.prices.map((p: any) => p.price)).toLocaleString()}\n`;
    }
    context += `\n`;
  }

  // Sentiment Data
  if (sentimentData?.success && sentimentData?.sentiment) {
    const sentiment = sentimentData.sentiment;
    context += `=== SOCIAL SENTIMENT ===\n`;
    context += `Overall Score: ${sentiment.overallScore || 'N/A'}/100\n`;
    context += `Trend: ${sentiment.trend || 'N/A'}\n`;
    context += `24h Mentions: ${sentiment.mentions24h?.toLocaleString() || 'N/A'}\n`;
    
    if (sentimentData.sources) {
      const activeSources = Object.keys(sentimentData.sources).filter(k => sentimentData.sources[k]);
      context += `Active Sources: ${activeSources.join(', ')}\n`;
    }
    
    if (sentiment.breakdown) {
      context += `Sentiment Breakdown:\n`;
      context += `  - Positive: ${sentiment.breakdown.positive || 0}%\n`;
      context += `  - Neutral: ${sentiment.breakdown.neutral || 0}%\n`;
      context += `  - Negative: ${sentiment.breakdown.negative || 0}%\n`;
    }
    context += `\n`;
  }

  // Technical Data
  if (technicalData?.success && technicalData?.indicators) {
    const indicators = technicalData.indicators;
    context += `=== TECHNICAL ANALYSIS ===\n`;
    
    if (indicators.rsi) {
      context += `RSI (14): ${indicators.rsi.value?.toFixed(2) || 'N/A'} (${indicators.rsi.signal || 'N/A'})\n`;
    }
    
    if (indicators.macd) {
      context += `MACD: ${indicators.macd.value?.toFixed(2) || 'N/A'}\n`;
      context += `MACD Signal: ${indicators.macd.signal || 'N/A'}\n`;
      context += `MACD Histogram: ${indicators.macd.histogram?.toFixed(2) || 'N/A'}\n`;
    }
    
    if (indicators.trend) {
      context += `Trend Direction: ${indicators.trend.direction || 'N/A'}\n`;
      context += `Trend Strength: ${indicators.trend.strength || 'N/A'}\n`;
    }
    
    if (indicators.volatility) {
      context += `Volatility: ${indicators.volatility.current || 'N/A'}\n`;
    }
    
    if (indicators.movingAverages) {
      context += `Moving Averages:\n`;
      Object.entries(indicators.movingAverages).forEach(([period, value]) => {
        context += `  - ${period}: $${(value as number)?.toLocaleString() || 'N/A'}\n`;
      });
    }
    context += `\n`;
  }

  // News Data
  if (newsData?.success && newsData?.articles?.length > 0) {
    context += `=== RECENT NEWS ===\n`;
    const articles = newsData.articles.slice(0, 5);
    articles.forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}`;
      if (article.source) {
        context += ` (${article.source})`;
      }
      if (article.publishedAt) {
        context += ` - ${new Date(article.publishedAt).toLocaleDateString()}`;
      }
      context += `\n`;
      if (article.description) {
        context += `   ${article.description.substring(0, 150)}...\n`;
      }
    });
    context += `\n`;
  }

  // On-Chain Data
  if (onChainData?.success) {
    context += `=== ON-CHAIN METRICS ===\n`;
    
    if (onChainData.holderDistribution?.concentration) {
      const conc = onChainData.holderDistribution.concentration;
      context += `Holder Distribution:\n`;
      context += `  - Top 10 Holders: ${conc.top10Percentage?.toFixed(2) || 'N/A'}%\n`;
      context += `  - Top 100 Holders: ${conc.top100Percentage?.toFixed(2) || 'N/A'}%\n`;
      context += `  - Distribution Score: ${conc.distributionScore || 'N/A'}/100\n`;
    }
    
    if (onChainData.whaleActivity) {
      context += `Whale Activity: Detected\n`;
    }
    
    if (onChainData.dataQuality) {
      context += `On-Chain Data Quality: ${onChainData.dataQuality}%\n`;
    }
    context += `\n`;
  }

  return context;
}

/**
 * API Configuration
 */
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 60, // 60 seconds for comprehensive OpenAI analysis
};

export default withOptionalAuth(handler);
