/**
 * UCIE Data Preview API
 * 
 * GET /api/ucie/preview-data/[symbol]
 * 
 * Collects data from all effective UCIE APIs and generates an OpenAI summary
 * for user review before proceeding with Caesar AI analysis.
 * 
 * Features:
 * - Parallel data collection from working APIs
 * - OpenAI GPT-4o summarization
 * - Data quality scoring
 * - User-friendly preview format
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCachedAnalysis, getCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface DataPreview {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  summary: string;
  collectedData: {
    marketData: any;
    sentiment: any;
    technical: any;
    news: any;
    onChain: any;
  };
  apiStatus: {
    working: string[];
    failed: string[];
    total: number;
    successRate: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: DataPreview;
  error?: string;
}

/**
 * Most Effective UCIE APIs (Based on audit)
 * ✅ FIX #2: Increased timeouts to reduce timeout failures
 */
const EFFECTIVE_APIS = {
  marketData: {
    endpoint: '/api/ucie/market-data',
    priority: 1,
    timeout: 10000, // ✅ Increased from 5000ms
    required: true
  },
  sentiment: {
    endpoint: '/api/ucie/sentiment',
    priority: 2,
    timeout: 10000, // ✅ Increased from 5000ms
    required: false
  },
  technical: {
    endpoint: '/api/ucie/technical',
    priority: 2,
    timeout: 10000, // ✅ Increased from 5000ms
    required: false
  },
  news: {
    endpoint: '/api/ucie/news',
    priority: 2,
    timeout: 15000, // ✅ Increased from 10000ms
    required: false
  },
  onChain: {
    endpoint: '/api/ucie/on-chain',
    priority: 3,
    timeout: 10000, // ✅ Increased from 5000ms
    required: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
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
  console.log(`📊 Collecting data preview for ${normalizedSymbol}...`);

  try {
    // Collect data from all effective APIs in parallel
    const startTime = Date.now();
    const collectedData = await collectDataFromAPIs(normalizedSymbol, req);
    const collectionTime = Date.now() - startTime;

    console.log(`✅ Data collection completed in ${collectionTime}ms`);

    // ✅ CRITICAL: Store collected data in database for OpenAI and Caesar access
    console.log(`💾 Storing API responses in database...`);
    const storagePromises = [];

    if (collectedData.marketData?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'market-data',
          collectedData.marketData,
          1800, // 30 minutes TTL
          collectedData.marketData.dataQuality || 0
        ).catch(err => console.error('Failed to cache market data:', err))
      );
    }

    if (collectedData.sentiment?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'sentiment',
          collectedData.sentiment,
          300, // 5 minutes TTL
          collectedData.sentiment.dataQuality || 0
        ).catch(err => console.error('Failed to cache sentiment:', err))
      );
    }

    if (collectedData.technical?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'technical',
          collectedData.technical,
          60, // 1 minute TTL
          collectedData.technical.dataQuality || 0
        ).catch(err => console.error('Failed to cache technical:', err))
      );
    }

    if (collectedData.news?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'news',
          collectedData.news,
          300, // 5 minutes TTL
          collectedData.news.dataQuality || 0
        ).catch(err => console.error('Failed to cache news:', err))
      );
    }

    if (collectedData.onChain?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'on-chain',
          collectedData.onChain,
          300, // 5 minutes TTL
          collectedData.onChain.dataQuality || 0
        ).catch(err => console.error('Failed to cache on-chain:', err))
      );
    }

    // Store all in parallel (non-blocking)
    Promise.allSettled(storagePromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      console.log(`💾 Stored ${successful}/${storagePromises.length} API responses in database`);
      if (failed > 0) {
        console.warn(`⚠️ Failed to store ${failed} responses`);
      }
    });

    // Calculate data quality
    const apiStatus = calculateAPIStatus(collectedData);
    const dataQuality = apiStatus.successRate;

    console.log(`📈 Data quality: ${dataQuality}%`);
    console.log(`✅ Working APIs: ${apiStatus.working.join(', ')}`);
    if (apiStatus.failed.length > 0) {
      console.log(`❌ Failed APIs: ${apiStatus.failed.join(', ')}`);
    }

    // Generate OpenAI summary
    console.log(`🤖 Generating OpenAI summary...`);
    const summaryStartTime = Date.now();
    const summary = await generateOpenAISummary(normalizedSymbol, collectedData, apiStatus);
    const summaryTime = Date.now() - summaryStartTime;

    console.log(`✅ Summary generated in ${summaryTime}ms`);

    // Build preview response
    const preview: DataPreview = {
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      dataQuality,
      summary,
      collectedData,
      apiStatus
    };

    return res.status(200).json({
      success: true,
      data: preview
    });

  } catch (error) {
    console.error('❌ Data preview error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate data preview'
    });
  }
}

/**
 * Collect data from all effective APIs
 * ✅ FIX #3: Added detailed error logging for diagnostics
 * ✅ FIX #4: Use request host instead of environment variable (CRITICAL FIX)
 */
async function collectDataFromAPIs(symbol: string, req: NextApiRequest) {
  // ✅ CRITICAL FIX: Construct base URL from request headers
  // This works in any environment without needing NEXT_PUBLIC_BASE_URL
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'];
  const baseUrl = `${protocol}://${host}`;
  
  console.log(`🔍 Collecting data for ${symbol}...`);
  console.log(`🌐 Using base URL: ${baseUrl}`);
  
  const results = await Promise.allSettled([
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.marketData.endpoint}/${symbol}`,
      EFFECTIVE_APIS.marketData.timeout
    ).catch(err => {
      console.error(`❌ Market Data failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.sentiment.endpoint}/${symbol}`,
      EFFECTIVE_APIS.sentiment.timeout
    ).catch(err => {
      console.error(`❌ Sentiment failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.technical.endpoint}/${symbol}`,
      EFFECTIVE_APIS.technical.timeout
    ).catch(err => {
      console.error(`❌ Technical failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.news.endpoint}/${symbol}`,
      EFFECTIVE_APIS.news.timeout
    ).catch(err => {
      console.error(`❌ News failed:`, err.message);
      throw err;
    }),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.onChain.endpoint}/${symbol}`,
      EFFECTIVE_APIS.onChain.timeout
    ).catch(err => {
      console.error(`❌ On-Chain failed:`, err.message);
      throw err;
    })
  ]);

  // ✅ FIX #3: Log results for each API
  const apiNames = ['Market Data', 'Sentiment', 'Technical', 'News', 'On-Chain'];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ ${apiNames[index]}: Success`);
    } else {
      console.log(`❌ ${apiNames[index]}: ${result.reason?.message || 'Failed'}`);
    }
  });

  return {
    marketData: results[0].status === 'fulfilled' ? results[0].value : null,
    sentiment: results[1].status === 'fulfilled' ? results[1].value : null,
    technical: results[2].status === 'fulfilled' ? results[2].value : null,
    news: results[3].status === 'fulfilled' ? results[3].value : null,
    onChain: results[4].status === 'fulfilled' ? results[4].value : null
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Calculate API status with proper data validation
 * ✅ FIX #1: Validate actual data existence, not just success flags
 */
function calculateAPIStatus(collectedData: any) {
  const working: string[] = [];
  const failed: string[] = [];

  // Market Data - Check for actual price data
  if (
    collectedData.marketData?.success === true &&
    collectedData.marketData?.priceAggregation?.prices?.length > 0
  ) {
    working.push('Market Data');
  } else {
    failed.push('Market Data');
  }

  // Sentiment - Check for actual sentiment data
  if (
    collectedData.sentiment?.success === true &&
    (collectedData.sentiment?.sentiment?.overallScore > 0 ||
     collectedData.sentiment?.sources?.lunarCrush === true ||
     collectedData.sentiment?.sources?.twitter === true ||
     collectedData.sentiment?.sources?.reddit === true)
  ) {
    working.push('Sentiment');
  } else {
    failed.push('Sentiment');
  }

  // Technical - Check for actual indicators
  if (
    collectedData.technical?.success === true &&
    collectedData.technical?.indicators &&
    Object.keys(collectedData.technical.indicators).length > 0
  ) {
    working.push('Technical');
  } else {
    failed.push('Technical');
  }

  // News - Check for actual articles
  if (
    collectedData.news?.success === true &&
    collectedData.news?.articles?.length > 0
  ) {
    working.push('News');
  } else {
    failed.push('News');
  }

  // On-Chain - Check for actual data quality
  if (
    collectedData.onChain?.success === true &&
    collectedData.onChain?.dataQuality > 0
  ) {
    working.push('On-Chain');
  } else {
    failed.push('On-Chain');
  }

  return {
    working,
    failed,
    total: 5,
    successRate: Math.round((working.length / 5) * 100)
  };
}

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
  maxDuration: 30, // 30 seconds for data collection and summarization
};
