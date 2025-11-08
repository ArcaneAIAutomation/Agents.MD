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
 */
const EFFECTIVE_APIS = {
  marketData: {
    endpoint: '/api/ucie/market-data',
    priority: 1,
    timeout: 5000,
    required: true
  },
  sentiment: {
    endpoint: '/api/ucie/sentiment',
    priority: 2,
    timeout: 5000,
    required: false
  },
  technical: {
    endpoint: '/api/ucie/technical',
    priority: 2,
    timeout: 5000,
    required: false
  },
  news: {
    endpoint: '/api/ucie/news',
    priority: 2,
    timeout: 10000, // Increased timeout for news
    required: false
  },
  onChain: {
    endpoint: '/api/ucie/on-chain',
    priority: 3,
    timeout: 5000,
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
    const collectedData = await collectDataFromAPIs(normalizedSymbol);
    const collectionTime = Date.now() - startTime;

    console.log(`✅ Data collection completed in ${collectionTime}ms`);

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
 */
async function collectDataFromAPIs(symbol: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const results = await Promise.allSettled([
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.marketData.endpoint}/${symbol}`,
      EFFECTIVE_APIS.marketData.timeout
    ),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.sentiment.endpoint}/${symbol}`,
      EFFECTIVE_APIS.sentiment.timeout
    ),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.technical.endpoint}/${symbol}`,
      EFFECTIVE_APIS.technical.timeout
    ),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.news.endpoint}/${symbol}`,
      EFFECTIVE_APIS.news.timeout
    ),
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.onChain.endpoint}/${symbol}`,
      EFFECTIVE_APIS.onChain.timeout
    )
  ]);

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
 * Calculate API status
 */
function calculateAPIStatus(collectedData: any) {
  const apis = Object.keys(collectedData);
  const working: string[] = [];
  const failed: string[] = [];

  for (const api of apis) {
    if (collectedData[api] && collectedData[api].success !== false) {
      working.push(api);
    } else {
      failed.push(api);
    }
  }

  return {
    working,
    failed,
    total: apis.length,
    successRate: Math.round((working.length / apis.length) * 100)
  };
}

/**
 * Generate OpenAI summary of collected data
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
  if (collectedData.marketData?.data) {
    const market = collectedData.marketData.data;
    context += `Market Data:\n`;
    context += `- Price: $${market.price?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Volume: $${market.volume24h?.toLocaleString() || 'N/A'}\n`;
    context += `- Market Cap: $${market.marketCap?.toLocaleString() || 'N/A'}\n`;
    context += `- 24h Change: ${market.priceChange24h?.toFixed(2) || 'N/A'}%\n\n`;
  }

  // Sentiment
  if (collectedData.sentiment?.data) {
    const sentiment = collectedData.sentiment.data;
    context += `Social Sentiment:\n`;
    context += `- Overall Score: ${sentiment.overallScore || 'N/A'}/100\n`;
    context += `- Trend: ${sentiment.trend || 'N/A'}\n`;
    context += `- 24h Mentions: ${sentiment.mentions24h?.toLocaleString() || 'N/A'}\n\n`;
  }

  // Technical
  if (collectedData.technical?.data) {
    const technical = collectedData.technical.data;
    context += `Technical Analysis:\n`;
    context += `- RSI: ${technical.indicators?.rsi?.value || 'N/A'}\n`;
    context += `- MACD Signal: ${technical.macd?.signal || 'N/A'}\n`;
    context += `- Trend: ${technical.trend?.direction || 'N/A'}\n`;
    context += `- Volatility: ${technical.volatility?.current || 'N/A'}\n\n`;
  }

  // News
  if (collectedData.news?.data?.articles) {
    const articles = collectedData.news.data.articles.slice(0, 3);
    context += `Recent News (Top 3):\n`;
    articles.forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}\n`;
    });
    context += `\n`;
  }

  // On-Chain
  if (collectedData.onChain?.data) {
    const onChain = collectedData.onChain.data;
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
 */
function generateFallbackSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): string {
  let summary = `**${symbol} Data Collection Summary**\n\n`;
  
  summary += `We've collected data from ${apiStatus.working.length} out of ${apiStatus.total} sources (${apiStatus.successRate}% data quality).\n\n`;

  if (collectedData.marketData?.data) {
    const market = collectedData.marketData.data;
    summary += `**Market Overview:**\n`;
    summary += `- Current Price: $${market.price?.toLocaleString() || 'N/A'}\n`;
    summary += `- 24h Change: ${market.priceChange24h?.toFixed(2) || 'N/A'}%\n`;
    summary += `- Market Cap: $${market.marketCap?.toLocaleString() || 'N/A'}\n\n`;
  }

  if (collectedData.sentiment?.data) {
    summary += `**Social Sentiment:** ${collectedData.sentiment.data.overallScore}/100 (${collectedData.sentiment.data.trend})\n\n`;
  }

  if (collectedData.technical?.data) {
    summary += `**Technical Outlook:** ${collectedData.technical.data.trend?.direction || 'Neutral'}\n\n`;
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
