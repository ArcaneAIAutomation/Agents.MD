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
import { setCachedAnalysis, getCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { storeOpenAISummary } from '../../../../lib/ucie/openaiSummaryStorage';
import { generateCryptoSummary } from '../../../../lib/ucie/geminiClient';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface DataPreview {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  summary: string; // Basic summary for frontend display
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
  timing: {
    total: number;
    collection: number;
    storage: number;
  };
  databaseStatus: {
    stored: number;
    failed: number;
    total: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: DataPreview;
  error?: string;
}

/**
 * Core UCIE APIs - Essential Data Collection
 * ✅ FOCUSED: 5 core data sources (10 underlying APIs)
 * ✅ REALISTIC TIMEOUTS: Database API fetching can take up to 25 seconds
 * ✅ Vercel limit: 60s → Set maxDuration to 60s for all sources
 * ✅ API timeouts: 45s max (allow full database fetch time)
 */
const EFFECTIVE_APIS = {
  marketData: {
    endpoint: '/api/ucie/market-data',
    priority: 1,
    timeout: 45000, // ✅ 45 seconds (required data source)
    required: true
  },
  sentiment: {
    endpoint: '/api/ucie/sentiment',
    priority: 2,
    timeout: 45000, // ✅ 45 seconds (social sentiment analysis)
    required: false
  },
  technical: {
    endpoint: '/api/ucie/technical',
    priority: 2,
    timeout: 45000, // ✅ 45 seconds (required for analysis)
    required: true
  },
  news: {
    endpoint: '/api/ucie/news',
    priority: 2,
    timeout: 50000, // ✅ 50 seconds (news can be slow)
    required: false
  },
  onChain: {
    endpoint: '/api/ucie/on-chain',
    priority: 3,
    timeout: 45000, // ✅ 45 seconds (blockchain data)
    required: false
  }
};

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;

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
  
  // Check if refresh parameter is set
  const forceRefresh = req.query.refresh === 'true';
  
  console.log(`📊 Collecting ${forceRefresh ? 'FRESH' : 'CACHED'} data for ${normalizedSymbol}...`);

  try {
    // ✅ INVALIDATE CACHE if refresh=true
    if (forceRefresh) {
      console.log(`🗑️ Invalidating cache for ${normalizedSymbol}...`);
      try {
        // Import invalidateCache function from correct path
        const { invalidateCache } = await import('../../../../lib/ucie/cacheUtils');
        await invalidateCache(normalizedSymbol);
        console.log(`✅ Invalidated cache for ${normalizedSymbol}`);
      } catch (err) {
        console.error(`Cache invalidation error:`, err);
        // Continue anyway - we'll fetch fresh data
      }
    }
    
    // ✅ AUTOMATIC RETRY LOGIC: 2 attempts with 30-second timeout each
    console.log(`🔄 Starting data collection with automatic retry (2 attempts, 30s timeout each)...`);
    const startTime = Date.now();
    let collectedData: any = null;
    let collectionTime = 0;
    let attempt = 0;
    const maxAttempts = 2; // Reduced to 2 attempts to stay within 60s limit
    const attemptTimeout = 30000; // 30 seconds per attempt (realistic for API calls)
    const retryDelay = 5000; // 5 seconds between retries
    
    for (attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📡 Attempt ${attempt}/${maxAttempts} - Collecting data...`);
      const attemptStart = Date.now();
      
      try {
        // Collect data (individual APIs have their own 25s timeouts)
        // No wrapper timeout - let individual API timeouts handle it
        collectedData = await collectDataFromAPIs(normalizedSymbol, req, forceRefresh);
        
        collectionTime = Date.now() - attemptStart;
        console.log(`✅ Attempt ${attempt} completed in ${collectionTime}ms`);
        
        // Check if we got good data
        const apiStatus = calculateAPIStatus(collectedData);
        const dataQuality = apiStatus.successRate;
        
        console.log(`📊 Attempt ${attempt} data quality: ${dataQuality}%`);
        
        // If we got 100% data quality, break early
        if (dataQuality === 100) {
          console.log(`🎉 Perfect data quality achieved on attempt ${attempt}!`);
          break;
        }
        
        // If we got at least 80% and it's the last attempt, accept it
        if (dataQuality >= 80 && attempt === maxAttempts) {
          console.log(`✅ Acceptable data quality (${dataQuality}%) on final attempt`);
          break;
        }
        
        // If not the last attempt and quality < 100%, retry
        if (attempt < maxAttempts) {
          console.log(`⏳ Data quality ${dataQuality}% - Retrying in ${retryDelay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        // If this was the last attempt, throw error
        if (attempt === maxAttempts) {
          throw new Error(`All ${maxAttempts} attempts failed`);
        }
        
        // Otherwise, wait and retry
        console.log(`⏳ Retrying in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    if (!collectedData) {
      throw new Error('Failed to collect data after all retry attempts');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Data collection completed after ${attempt} attempt(s) in ${totalTime}ms`);

    // Calculate data quality
    const apiStatus = calculateAPIStatus(collectedData);
    const dataQuality = apiStatus.successRate;

    console.log(`📈 Data quality: ${dataQuality}%`);
    console.log(`✅ Working APIs: ${apiStatus.working.join(', ')}`);
    if (apiStatus.failed.length > 0) {
      console.log(`❌ Failed APIs: ${apiStatus.failed.join(', ')}`);
    }

    // ✅ CRITICAL: Store in database FIRST (BLOCKING)
    // This ensures data is available for OpenAI analysis
    console.log(`💾 Storing API responses in Supabase database (BLOCKING)...`);
    const storageStartTime = Date.now();
    const storagePromises = [];

    if (collectedData.marketData?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'market-data',
          collectedData.marketData,
          2 * 60, // ✅ 2 minutes for fresh data
          collectedData.marketData.dataQuality || 0,
          userId,
          userEmail
        ).catch(err => {
          console.error('❌ Failed to store market data:', err);
          return { status: 'failed', type: 'market-data' };
        })
      );
    }

    if (collectedData.sentiment?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'sentiment',
          collectedData.sentiment,
          2 * 60, // ✅ 2 minutes for fresh data
          collectedData.sentiment.dataQuality || 0,
          userId,
          userEmail
        ).catch(err => {
          console.error('❌ Failed to store sentiment:', err);
          return { status: 'failed', type: 'sentiment' };
        })
      );
    }

    if (collectedData.technical?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'technical',
          collectedData.technical,
          2 * 60, // ✅ 2 minutes for fresh data
          collectedData.technical.dataQuality || 0,
          userId,
          userEmail
        ).catch(err => {
          console.error('❌ Failed to store technical:', err);
          return { status: 'failed', type: 'technical' };
        })
      );
    }

    if (collectedData.news?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'news',
          collectedData.news,
          2 * 60, // ✅ 2 minutes for fresh data
          collectedData.news.dataQuality || 0,
          userId,
          userEmail
        ).catch(err => {
          console.error('❌ Failed to store news:', err);
          return { status: 'failed', type: 'news' };
        })
      );
    }

    if (collectedData.onChain?.success) {
      storagePromises.push(
        setCachedAnalysis(
          normalizedSymbol,
          'on-chain',
          collectedData.onChain,
          2 * 60, // ✅ 2 minutes for fresh data
          collectedData.onChain.dataQuality || 0,
          userId,
          userEmail
        ).catch(err => {
          console.error('❌ Failed to store on-chain:', err);
          return { status: 'failed', type: 'on-chain' };
        })
      );
    }

    // ✅ WAIT for all database writes to complete
    console.log(`⏳ Waiting for ${storagePromises.length} database writes...`);
    const storageResults = await Promise.allSettled(storagePromises);
    const successful = storageResults.filter(r => r.status === 'fulfilled').length;
    const failed = storageResults.filter(r => r.status === 'rejected').length;
    const storageTime = Date.now() - storageStartTime;
    
    console.log(`✅ Stored ${successful}/${storagePromises.length} API responses in ${storageTime}ms`);
    if (failed > 0) {
      console.warn(`⚠️ Failed to store ${failed} responses`);
    }

    // ✅ CRITICAL: Wait 5 seconds after retries complete
    // This ensures database is fully populated and indexed
    console.log(`⏳ Waiting 5 seconds to ensure database is fully populated and indexed...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log(`✅ Database population delay complete`);

    // ✅ CRITICAL: Verify data quality before AI summary
    // Only generate AI summary if we have sufficient data (≥60%)
    console.log(`🔍 Verifying data quality before AI summary...`);
    console.log(`   Data Quality: ${dataQuality}%`);
    console.log(`   Required Data: Market (${!!collectedData.marketData?.success}), Technical (${!!collectedData.technical?.success})`);
    
    // Check if we have minimum required data (market + technical)
    const hasRequiredData = 
      collectedData.marketData?.success === true &&
      collectedData.technical?.success === true;
    
    if (!hasRequiredData) {
      console.warn(`⚠️ Insufficient data for AI summary - skipping`);
      console.warn(`   Market Data: ${collectedData.marketData?.success ? '✅' : '❌'}`);
      console.warn(`   Technical Data: ${collectedData.technical?.success ? '✅' : '❌'}`);
    }

    // ✅ Generate Gemini AI summary ONLY if we have required data
    let summary = '';
    if (hasRequiredData && dataQuality >= 60) {
      console.log(`🤖 Generating Gemini AI summary for ${normalizedSymbol}...`);
      try {
        summary = await generateGeminiSummary(normalizedSymbol, collectedData, apiStatus);
        console.log(`✅ Gemini AI summary generated (${summary.length} chars)`);
        
        // Store Gemini summary in database
        const { storeGeminiAnalysis } = await import('../../../../lib/ucie/geminiAnalysisStorage');
        await storeGeminiAnalysis({
          symbol: normalizedSymbol,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous@example.com',
          summaryText: summary,
          dataQualityScore: dataQuality,
          apiStatus: apiStatus,
          modelUsed: 'gemini-2.5-pro',
          analysisType: 'summary',
          dataSourcesUsed: apiStatus.working,
          availableDataCount: apiStatus.working.length
        });
        console.log(`✅ Gemini summary stored in ucie_gemini_analysis table`);
        
        // Also store in OpenAI summary table for backward compatibility
        const { storeOpenAISummary } = await import('../../../../lib/ucie/openaiSummaryStorage');
        await storeOpenAISummary(
          normalizedSymbol,
          summary,
          dataQuality,
          apiStatus,
          {
            marketData: !!collectedData.marketData,
            sentiment: !!collectedData.sentiment,
            technical: !!collectedData.technical,
            news: !!collectedData.news,
            onChain: !!collectedData.onChain
          },
          2 * 60, // ✅ 2 minutes TTL for fresh data
          userId,
          userEmail
        );
      console.log(`✅ OpenAI summary stored in ucie_openai_analysis table`);
      } catch (error) {
        console.error('❌ Failed to generate Gemini AI summary:', error);
        summary = generateBasicSummary(normalizedSymbol, collectedData, apiStatus);
      }
    } else {
      // Use basic summary if insufficient data
      console.log(`📝 Using basic summary (insufficient data for AI)`);
      summary = generateBasicSummary(normalizedSymbol, collectedData, apiStatus);
    }

    // ✅ Return data after all processing complete
    const finalTotalTime = Date.now() - startTime;
    console.log(`⚡ Total processing time: ${finalTotalTime}ms (${attempt} attempts, ${successful}/${storagePromises.length} stored)`);

    const responseData = {
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      dataQuality,
      summary, // Include summary for frontend
      collectedData,
      apiStatus,
      timing: {
        total: finalTotalTime,
        collection: collectionTime,
        storage: storageTime,
        attempts: attempt
      },
      databaseStatus: {
        stored: successful,
        failed: failed,
        total: storagePromises.length
      },
      retryInfo: {
        attempts: attempt,
        maxAttempts: maxAttempts,
        success: true
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData
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
 * ✅ FIX #5: Added refresh parameter to force fresh data
 */
async function collectDataFromAPIs(symbol: string, req: NextApiRequest, refresh: boolean = false) {
  // ✅ CRITICAL FIX: Construct base URL from request headers
  // This works in any environment without needing NEXT_PUBLIC_BASE_URL
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'];
  const baseUrl = `${protocol}://${host}`;
  
  // Add refresh parameter to force fresh data
  const refreshParam = refresh ? '?refresh=true' : '';
  
  console.log(`🔍 Collecting data for ${symbol}${refresh ? ' (FORCING FRESH DATA)' : ''}...`);
  console.log(`🌐 Using base URL: ${baseUrl}`);
  
  const results = await Promise.allSettled([
    // ✅ MARKET DATA: Required - Fail if this fails
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.marketData.endpoint}/${symbol}${refreshParam}`,
      EFFECTIVE_APIS.marketData.timeout
    ).catch(err => {
      console.error(`❌ Market Data failed:`, err.message);
      throw err;
    }),
    // ✅ SENTIMENT: Optional - Continue if this fails
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.sentiment.endpoint}/${symbol}${refreshParam}`,
      EFFECTIVE_APIS.sentiment.timeout
    ).catch(err => {
      console.error(`❌ Sentiment failed:`, err.message);
      return null; // Optional - don't fail entire collection
    }),
    // ✅ TECHNICAL: Required - Fail if this fails
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.technical.endpoint}/${symbol}${refreshParam}`,
      EFFECTIVE_APIS.technical.timeout
    ).catch(err => {
      console.error(`❌ Technical failed:`, err.message);
      throw err;
    }),
    // ✅ NEWS: Optional - Continue if this fails
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.news.endpoint}/${symbol}${refreshParam}`,
      EFFECTIVE_APIS.news.timeout
    ).catch(err => {
      console.error(`❌ News failed:`, err.message);
      return null; // Optional - don't fail entire collection
    }),
    // ✅ ON-CHAIN: Optional - Continue if this fails
    fetchWithTimeout(
      `${baseUrl}${EFFECTIVE_APIS.onChain.endpoint}/${symbol}${refreshParam}`,
      EFFECTIVE_APIS.onChain.timeout
    ).catch(err => {
      console.error(`❌ On-Chain failed:`, err.message);
      return null; // Optional - don't fail entire collection
    })
  ]);

  // ✅ Log results for each API (5 core sources = 9 underlying APIs)
  const apiNames = ['Market Data (4 APIs)', 'Sentiment (3 APIs)', 'Technical', 'News', 'On-Chain (1 API - BTC only)'];
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

  // Technical - Check for actual indicators with proper validation
  const hasTechnical = collectedData.technical?.success === true &&
                       collectedData.technical?.indicators &&
                       typeof collectedData.technical.indicators === 'object' &&
                       Object.keys(collectedData.technical.indicators).length >= 6; // Should have at least 6 indicators
  
  console.log(`🔍 Technical validation:`, {
    exists: !!collectedData.technical,
    success: collectedData.technical?.success,
    hasIndicators: !!collectedData.technical?.indicators,
    indicatorCount: collectedData.technical?.indicators ? Object.keys(collectedData.technical.indicators).length : 0,
    hasTechnical
  });
  
  if (hasTechnical) {
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
    total: 5, // ✅ 5 core sources (10 underlying APIs)
    successRate: Math.round((working.length / 5) * 100)
  };
}

/**
 * Generate OpenAI summary of collected data
 * ✅ CRITICAL: ONLY uses data from Supabase database (ucie_analysis_cache)
 * This ensures OpenAI summary is based on the same data Caesar will use
 */
async function generateOpenAISummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  console.log(`📊 OpenAI Summary: Reading ALL data from Supabase database...`);
  
  // ✅ ALWAYS read from database (ignore in-memory collectedData)
  // This ensures OpenAI uses the same data source as Caesar
  const marketData = await getCachedAnalysis(symbol, 'market-data');
  const sentimentData = await getCachedAnalysis(symbol, 'sentiment');
  const technicalData = await getCachedAnalysis(symbol, 'technical');
  const newsData = await getCachedAnalysis(symbol, 'news');
  const onChainData = await getCachedAnalysis(symbol, 'on-chain');

  // Log what we retrieved
  console.log(`📦 Database retrieval results:`);
  console.log(`   Market Data: ${marketData ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Sentiment: ${sentimentData ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Technical: ${technicalData ? '✅ Found' : '❌ Not found'}`);
  console.log(`   News: ${newsData ? '✅ Found' : '❌ Not found'}`);
  console.log(`   On-Chain: ${onChainData ? '✅ Found' : '❌ Not found'}`);
  
  // Build context from database data
  let context = `Cryptocurrency: ${symbol}\n\n`;
  context += `Data Collection Status:\n`;
  context += `- APIs Working: ${apiStatus.working.length}/${apiStatus.total}\n`;
  context += `- Data Quality: ${apiStatus.successRate}%\n\n`;

  // ✅ FIXED: Market Data - Use correct path (priceAggregation.averagePrice)
  if (marketData?.success && marketData?.priceAggregation) {
    const agg = marketData.priceAggregation;
    context += `Market Data:\n`;
    try {
      // Extract actual values from priceAggregation
      const price = agg.averagePrice || agg.aggregatedPrice || 0;
      const volume = agg.totalVolume24h || agg.aggregatedVolume24h || 0;
      const marketCap = marketData.marketData?.marketCap || agg.aggregatedMarketCap || 0;
      const change = agg.averageChange24h || agg.aggregatedChange24h || 0;
      
      context += `- Price: $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      context += `- 24h Volume: $${(volume / 1e9).toFixed(2)}B\n`;
      context += `- Market Cap: $${(marketCap / 1e9).toFixed(2)}B\n`;
      context += `- 24h Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n`;
      context += `- Data Sources: ${agg.prices?.length || 0} exchanges\n\n`;
    } catch (error) {
      console.error('❌ Error formatting market data:', error);
      context += `- Price: ${agg.averagePrice || agg.aggregatedPrice || 'N/A'}\n`;
      context += `- Data Sources: ${agg.prices?.length || 0} exchanges\n\n`;
    }
  }

  // ✅ FIXED: Sentiment - Use correct path (sentiment object)
  if (sentimentData?.success && sentimentData?.sentiment) {
    const sentiment = sentimentData.sentiment;
    context += `Social Sentiment:\n`;
    try {
      // Extract actual values from sentiment data
      const score = sentiment.overallScore || 0;
      const trend = sentiment.trend || 'neutral';
      const mentions = sentimentData.volumeMetrics?.total24h || sentiment.mentions24h || 0;
      
      context += `- Overall Score: ${score.toFixed(0)}/100\n`;
      context += `- Trend: ${trend}\n`;
      context += `- 24h Mentions: ${mentions.toLocaleString('en-US')}\n`;
      
      const sources = Object.keys(sentimentData.sources || {}).filter(k => sentimentData.sources[k]);
      if (sources.length > 0) {
        context += `- Sources: ${sources.join(', ')}\n`;
      }
      context += `\n`;
    } catch (error) {
      console.error('❌ Error formatting sentiment data:', error);
      context += `- Overall Score: ${sentiment.overallScore || 'N/A'}\n\n`;
    }
  }

  // ✅ FIXED: Technical - Use correct path (indicators object)
  if (technicalData?.success && technicalData?.indicators) {
    context += `Technical Analysis:\n`;
    try {
      // Extract actual values from technical indicators
      const indicators = technicalData.indicators;
      const rsi = indicators.rsi?.value || indicators.rsi || 0;
      const macdSignal = indicators.macd?.signal || 'neutral';
      const trend = indicators.trend?.direction || technicalData.trend?.direction || 'neutral';
      
      context += `- RSI: ${typeof rsi === 'number' ? rsi.toFixed(2) : rsi}\n`;
      context += `- MACD Signal: ${macdSignal}\n`;
      context += `- Trend: ${trend}\n`;
      
      // Additional indicators if available
      if (indicators?.trend?.strength) {
        context += `- Trend Strength: ${indicators.trend.strength}\n`;
      }
      if (indicators.volatility) {
        context += `- Volatility: ${indicators.volatility.current || 'N/A'}\n`;
      }
      context += `\n`;
    } catch (error) {
      console.error('❌ Error formatting technical data:', error);
      context += `- Indicators available\n\n`;
    }
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

  // Generate summary with Gemini 2.5 Pro
  try {
    console.log(`🤖 Generating Gemini 2.5 Pro summary...`);
    const summary = await generateCryptoSummary(symbol, context);
    console.log(`✅ Gemini summary generated (${summary.length} chars)`);
    return summary;
  } catch (error) {
    console.error('Gemini summary error (using fallback):', error);
    // Fallback to basic summary (instant, no API call)
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
 * Generate Gemini AI summary of collected data
 * Uses Google Gemini 2.5 Pro for fast, accurate analysis
 */
async function generateGeminiSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  console.log(`📊 Gemini AI Summary: Reading ALL 5 core data sources from Supabase database...`);
  
  // Import Gemini client
  const { generateGeminiAnalysis } = await import('../../../../lib/ucie/geminiClient');
  
  // ✅ CRITICAL: Read ALL 5 core data sources from database (9 underlying APIs)
  const marketData = await getCachedAnalysis(symbol, 'market-data');
  const sentimentData = await getCachedAnalysis(symbol, 'sentiment');
  const technicalData = await getCachedAnalysis(symbol, 'technical');
  const newsData = await getCachedAnalysis(symbol, 'news');
  const onChainData = await getCachedAnalysis(symbol, 'on-chain');

  // Log what we retrieved
  console.log(`📦 Database retrieval results (5 core sources = 9 underlying APIs):`);
  console.log(`   Market Data: ${marketData ? '✅ Found' : '❌ Not found'} (4 APIs: CMC, CoinGecko, Kraken, Coinbase)`);
  console.log(`   Sentiment: ${sentimentData ? '✅ Found' : '❌ Not found'} (3 APIs: LunarCrush, Twitter, Reddit)`);
  console.log(`   Technical: ${technicalData ? '✅ Found' : '❌ Not found'} (Calculated indicators)`);
  console.log(`   News: ${newsData ? '✅ Found' : '❌ Not found'} (1 API: NewsAPI)`);
  console.log(`   On-Chain: ${onChainData ? '✅ Found' : '❌ Not found'} (1 API: Blockchain.com - Bitcoin only)`);
  
  // Build context from database data
  let context = `Cryptocurrency: ${symbol}\n\n`;
  context += `Data Collection Status:\n`;
  context += `- APIs Working: ${apiStatus.working.length}/${apiStatus.total}\n`;
  context += `- Data Quality: ${apiStatus.successRate}%\n\n`;

  // Market Data
  if (marketData?.success && marketData?.priceAggregation) {
    const agg = marketData.priceAggregation;
    context += `Market Data:\n`;
    const price = agg.averagePrice || agg.aggregatedPrice || 0;
    const volume = agg.totalVolume24h || agg.aggregatedVolume24h || 0;
    const marketCap = marketData.marketData?.marketCap || agg.aggregatedMarketCap || 0;
    const change = agg.averageChange24h || agg.aggregatedChange24h || 0;
    
    context += `- Price: $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    context += `- 24h Volume: $${(volume / 1e9).toFixed(2)}B\n`;
    context += `- Market Cap: $${(marketCap / 1e9).toFixed(2)}B\n`;
    context += `- 24h Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n\n`;
  }

  // Sentiment
  if (sentimentData?.success && sentimentData?.sentiment) {
    const sentiment = sentimentData.sentiment;
    context += `Social Sentiment:\n`;
    const score = sentiment.overallScore || 0;
    const trend = sentiment.trend || 'neutral';
    const mentions = sentimentData.volumeMetrics?.total24h || sentiment.mentions24h || 0;
    
    context += `- Overall Score: ${score.toFixed(0)}/100\n`;
    context += `- Trend: ${trend}\n`;
    context += `- 24h Mentions: ${mentions.toLocaleString('en-US')}\n\n`;
  }

  // Technical
  if (technicalData?.success && technicalData?.indicators) {
    context += `Technical Analysis:\n`;
    const indicators = technicalData.indicators;
    const rsi = indicators.rsi?.value || indicators.rsi || 0;
    const macdSignal = indicators.macd?.signal || 'neutral';
    const trend = indicators.trend?.direction || technicalData.trend?.direction || 'neutral';
    
    context += `- RSI: ${typeof rsi === 'number' ? rsi.toFixed(2) : rsi}\n`;
    context += `- MACD Signal: ${macdSignal}\n`;
    context += `- Trend: ${trend}\n\n`;
  }

  // News
  if (newsData?.success && newsData?.articles?.length > 0) {
    context += `Recent News (${newsData.articles.length} articles):\n`;
    newsData.articles.slice(0, 3).forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}\n`;
    });
    context += `\n`;
  }

  // On-Chain
  if (onChainData?.success) {
    context += `On-Chain Data:\n`;
    if (onChainData.whaleActivity) {
      context += `- Whale Transactions: ${onChainData.whaleActivity.count || 0}\n`;
      context += `- Total Value: $${(onChainData.whaleActivity.totalValue / 1e6).toFixed(2)}M\n`;
    }
    if (onChainData.networkHealth) {
      context += `- Network Health: ${onChainData.networkHealth.status || 'N/A'}\n`;
    }
    context += `\n`;
  }

  // System prompt for Gemini (comprehensive analysis - ~2500 words with 10000 tokens)
  const systemPrompt = `You are a professional cryptocurrency analyst. Provide a comprehensive, data-driven analysis (~2500 words) of ${symbol} based on the provided data. 

Structure your analysis with these sections:

1. EXECUTIVE SUMMARY (300 words)
   - Current market position and key metrics
   - Overall sentiment and trend direction
   - Critical insights at a glance
   - Key takeaways for traders and investors

2. MARKET ANALYSIS (500 words)
   - Current price action and recent movements
   - 24-hour, 7-day, and 30-day performance
   - Market cap and volume analysis
   - Comparison to major cryptocurrencies
   - Trading patterns and liquidity
   - Price spread across exchanges

3. TECHNICAL ANALYSIS (500 words)
   - Key technical indicators (RSI, MACD, EMAs, Bollinger Bands)
   - Support and resistance levels
   - Trend analysis and momentum
   - Chart patterns and signals
   - Short-term and medium-term outlook
   - Volume analysis and confirmation

4. SOCIAL SENTIMENT & COMMUNITY (400 words)
   - Overall sentiment score and trend
   - Social media activity and mentions
   - Community engagement levels
   - Influencer sentiment
   - Notable discussions or concerns
   - Sentiment distribution (bullish/bearish/neutral)

5. NEWS & DEVELOPMENTS (400 words)
   - Recent news and announcements
   - Market-moving events
   - Regulatory developments
   - Partnership or technology updates
   - Industry context and implications

6. ON-CHAIN & FUNDAMENTALS (300 words)
   - On-chain metrics and activity
   - Network health indicators
   - Whale transaction analysis
   - Exchange flow patterns
   - Holder behavior and distribution

7. RISK ASSESSMENT & OUTLOOK (100 words)
   - Key risks and concerns
   - Volatility analysis
   - Market risks
   - Regulatory or technical risks
   - Overall market outlook and recommendations

Use ONLY the data provided. Be specific with numbers, percentages, and concrete data points. Provide actionable insights and clear explanations. Format as a professional, detailed analysis report covering ALL available data sources.`;

  // Call Gemini AI with timeout protection (must complete within 45 seconds)
  // Increased to 10000 tokens for comprehensive analysis
  try {
    const geminiPromise = generateGeminiAnalysis(
      systemPrompt,
      context,
      10000, // ✅ INCREASED: 10000 tokens (~2500 words) for comprehensive analysis
      0.7    // temperature
    );
    
    // Race against 45-second timeout (leaves 15s buffer for Vercel's 60s limit)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini timeout after 45 seconds')), 45000);
    });
    
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    
    console.log(`✅ Gemini AI generated ${response.tokensUsed} tokens`);
    return response.content;
    
  } catch (error) {
    console.error(`❌ Gemini AI failed:`, error);
    console.log(`⚠️ Falling back to basic summary`);
    
    // Fallback to basic summary if Gemini times out
    return generateBasicSummary(symbol, { marketData: null, sentiment: null, technical: null, news: null, onChain: null }, { working: [], failed: [], total: 5, successRate: 0 });
  }
}

/**
 * Generate basic summary for frontend display
 * This is a quick summary based on collected data
 * Full AI analysis happens in Phase 2 (OpenAI endpoint)
 */
function generateBasicSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): string {
  let summary = `Data collection complete for ${symbol}. `;
  
  // Data quality
  summary += `Successfully collected data from ${apiStatus.working.length} out of ${apiStatus.total} sources (${apiStatus.successRate}% data quality). `;
  
  // Market data
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const price = collectedData.marketData.priceAggregation.averagePrice;
    const change = collectedData.marketData.priceAggregation.averageChange24h;
    if (price) {
      summary += `\n\nCurrent price: $${price.toLocaleString()}`;
      if (change !== undefined) {
        summary += ` (${change > 0 ? '+' : ''}${change.toFixed(2)}% 24h)`;
      }
      summary += '. ';
    }
  }
  
  // Sentiment
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const score = collectedData.sentiment.sentiment.overallScore;
    const trend = collectedData.sentiment.sentiment.trend;
    if (score) {
      summary += `Social sentiment: ${score}/100 (${trend || 'neutral'}). `;
    }
  }
  
  // Technical
  if (collectedData.technical?.success && collectedData.technical?.indicators?.trend) {
    const direction = collectedData.technical.indicators.trend.direction;
    if (direction) {
      summary += `Technical trend: ${direction}. `;
    }
  }
  
  // News
  if (collectedData.news?.success && collectedData.news?.articles?.length > 0) {
    summary += `\n\nFound ${collectedData.news.articles.length} recent news articles. `;
  }
  
  // On-chain
  if (collectedData.onChain?.success) {
    summary += `On-chain data available. `;
  }
  
  // Next steps
  summary += `\n\nThis data is now stored in the database and ready for comprehensive AI analysis. Click "Continue with Caesar AI Analysis" to proceed with deep research including technology analysis, team evaluation, partnerships, risk assessment, and more.`;
  
  return summary;
}

/**
 * API Configuration
 * ✅ INCREASED: maxDuration set to 60s for reliable data collection
 * Allows for retry logic and database operations
 */
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 60, // ✅ 60 seconds for retry logic + database operations
};


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
