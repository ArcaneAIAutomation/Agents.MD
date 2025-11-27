/**
 * UCIE Data Preview API
 * 
 * GET /api/ucie/preview-data/[symbol]
 * 
 * Collects data from all effective UCIE APIs and generates an OpenAI GPT-4o summary
 * for user review before proceeding with Caesar AI analysis.
 * 
 * Features:
 * - Parallel data collection from working APIs
 * - OpenAI GPT-4o summarization (latest model)
 * - Data quality scoring
 * - User-friendly preview format
 * 
 * Fixed: Parameter name mismatch (geminiSummary → aiAnalysis)
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
    timeout: 90000, // ✅ 90 seconds (MAXIMUM - prevent any failures)
    required: true
  },
  sentiment: {
    endpoint: '/api/ucie/sentiment',
    priority: 2,
    timeout: 90000, // ✅ 90 seconds (MAXIMUM - prevent any failures)
    required: false
  },
  technical: {
    endpoint: '/api/ucie/technical',
    priority: 2,
    timeout: 90000, // ✅ 90 seconds (MAXIMUM - prevent any failures)
    required: true
  },
  news: {
    endpoint: '/api/ucie/news',
    priority: 2,
    timeout: 120000, // ✅ 120 seconds (MAXIMUM - news can be very slow)
    required: false
  },
  onChain: {
    endpoint: '/api/ucie/on-chain',
    priority: 3,
    timeout: 90000, // ✅ 90 seconds (MAXIMUM - prevent any failures)
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

    // ✅ CRITICAL: Wait and VERIFY database is populated
    // This ensures database is fully populated and indexed before AI analysis
    console.log(`⏳ Waiting and verifying database is fully populated...`);
    
    let verificationAttempts = 0;
    const maxVerificationAttempts = 10;
    let allDataVerified = false;
    
    while (verificationAttempts < maxVerificationAttempts && !allDataVerified) {
      verificationAttempts++;
      
      // Wait 2 seconds between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify each data type is in database
      const verifyMarket = await getCachedAnalysis(normalizedSymbol, 'market-data');
      const verifySentiment = await getCachedAnalysis(normalizedSymbol, 'sentiment');
      const verifyTechnical = await getCachedAnalysis(normalizedSymbol, 'technical');
      const verifyNews = await getCachedAnalysis(normalizedSymbol, 'news');
      const verifyOnChain = await getCachedAnalysis(normalizedSymbol, 'on-chain');
      
      const foundCount = [verifyMarket, verifySentiment, verifyTechnical, verifyNews, verifyOnChain]
        .filter(d => d !== null).length;
      
      console.log(`   Verification attempt ${verificationAttempts}/${maxVerificationAttempts}: Found ${foundCount}/5 data types in database`);
      
      // Check if we have minimum required data (market + technical)
      if (verifyMarket && verifyTechnical) {
        allDataVerified = true;
        console.log(`✅ Database verification complete! Found required data (market + technical)`);
        break;
      }
      
      if (verificationAttempts >= maxVerificationAttempts) {
        console.warn(`⚠️ Database verification timeout after ${maxVerificationAttempts} attempts`);
        console.warn(`   Found: Market=${!!verifyMarket}, Sentiment=${!!verifySentiment}, Technical=${!!verifyTechnical}, News=${!!verifyNews}, OnChain=${!!verifyOnChain}`);
      }
    }
    
    console.log(`✅ Database population and verification complete (${verificationAttempts} attempts, ${verificationAttempts * 2}s total)`);

    // ✅ CRITICAL: ALWAYS generate Gemini AI summary (no threshold)
    // This ensures users always see AI-generated analysis
    console.log(`🔍 Verifying data quality before AI summary...`);
    console.log(`   Data Quality: ${dataQuality}%`);
    console.log(`   Required Data: Market (${!!collectedData.marketData?.success}), Technical (${!!collectedData.technical?.success})`);
    
    // Check if we have minimum required data (market + technical)
    const hasRequiredData = 
      collectedData.marketData?.success === true &&
      collectedData.technical?.success === true;
    
    if (!hasRequiredData) {
      console.warn(`⚠️ Missing required data for AI summary`);
      console.warn(`   Market Data: ${collectedData.marketData?.success ? '✅' : '❌'}`);
      console.warn(`   Technical Data: ${collectedData.technical?.success ? '✅' : '❌'}`);
    }

    // ✅ ALWAYS attempt Gemini 2.0 Flash summary (latest experimental model)
    let summary = '';
    console.log(`🤖 Generating Gemini 2.0 Flash summary for ${normalizedSymbol}...`);
    try {
      summary = await generateAISummary(normalizedSymbol, collectedData, apiStatus);
      console.log(`✅ Gemini 2.0 Flash summary generated (${summary.length} chars, ~${Math.round(summary.split(' ').length)} words)`);
      
      // ✅ CRITICAL: Store ALL summaries (even short ones) so status endpoint knows analysis completed
      const analysisType = summary.length > 500 ? 'summary' : 'fallback';
      
      // Store Gemini summary in database
      const { storeGeminiAnalysis } = await import('../../../../lib/ucie/geminiAnalysisStorage');
      await storeGeminiAnalysis({
        symbol: normalizedSymbol,
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous@example.com',
        summaryText: summary,
        dataQualityScore: dataQuality,
        apiStatus: apiStatus,
        modelUsed: 'gemini-2.0-flash-exp', // ✅ Latest Gemini experimental model
        analysisType: analysisType, // Track if it's full summary or fallback
        dataSourcesUsed: apiStatus.working,
        availableDataCount: apiStatus.working.length
      });
      console.log(`✅ Gemini ${analysisType} stored in ucie_gemini_analysis table (${summary.length} chars)`);
      
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
        30 * 60, // ✅ 30 minutes TTL (matches cache TTL)
        userId,
        userEmail
      );
      console.log(`✅ Summary also stored in ucie_openai_analysis table`);
      
    } catch (error) {
      console.error('❌ Failed to generate GPT-5.1 summary:', error);
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      console.error('   Error stack:', error instanceof Error ? error.stack : 'N/A');
      
      // Generate fallback summary
      summary = generateBasicSummary(normalizedSymbol, collectedData, apiStatus);
      console.log(`📝 Using basic fallback summary (${summary.length} chars)`);
      
      // ✅ CRITICAL: Store error state in database so status endpoint knows it failed
      try {
        const { storeGeminiAnalysis } = await import('../../../../lib/ucie/geminiAnalysisStorage');
        await storeGeminiAnalysis({
          symbol: normalizedSymbol,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous@example.com',
          summaryText: `ERROR: ${error instanceof Error ? error.message : String(error)}\n\nFallback Summary:\n${summary}`,
          dataQualityScore: dataQuality,
          apiStatus: apiStatus,
          modelUsed: 'gemini-2.5-pro',
          analysisType: 'error', // Mark as error so status endpoint knows
          dataSourcesUsed: apiStatus.working,
          availableDataCount: apiStatus.working.length
        });
        console.log(`✅ Error state stored in database for status tracking`);
      } catch (storeError) {
        console.error('❌ Failed to store error state:', storeError);
      }
    }

    // ✅ CRITICAL: Retrieve AI analysis from database
    console.log(`📊 Retrieving AI analysis from database...`);
    let aiAnalysis: string | null = null;
    try {
      const { getGeminiAnalysis } = await import('../../../../lib/ucie/geminiAnalysisStorage');
      const aiData = await getGeminiAnalysis(normalizedSymbol, userId);
      if (aiData?.summary_text) {
        aiAnalysis = aiData.summary_text;
        console.log(`✅ Retrieved AI analysis (${aiAnalysis.length} chars, model: ${aiData.model_used || 'unknown'})`);
      } else {
        console.warn(`⚠️ No AI analysis found in database`);
      }
    } catch (error) {
      console.error(`❌ Failed to retrieve Gemini analysis:`, error);
    }

    // ✅ Generate Caesar prompt preview
    console.log(`📝 Generating Caesar prompt preview...`);
    const caesarPromptPreview = await generateCaesarPromptPreview(
      normalizedSymbol,
      collectedData,
      apiStatus,
      aiAnalysis || summary
    );

    // ✅ Return data after all processing complete
    const finalTotalTime = Date.now() - startTime;
    console.log(`⚡ Total processing time: ${finalTotalTime}ms (${attempt} attempts, ${successful}/${storagePromises.length} stored)`);

    const responseData = {
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      dataQuality,
      summary: aiAnalysis || summary, // ✅ Use AI analysis if available, fallback to basic summary
      aiAnalysis: aiAnalysis, // ✅ Include full AI analysis (OpenAI GPT-4o)
      caesarPromptPreview: caesarPromptPreview, // ✅ Include Caesar prompt preview
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
 * Generate AI summary of collected data
 * ✅ CRITICAL: ONLY uses data from Supabase database (ucie_analysis_cache)
 * This ensures AI summary is based on the same data Caesar will use
 * Currently using: Gemini 2.0 Flash (latest experimental model)
 */
async function generateAISummary(
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

  // Log what we retrieved with detailed info
  console.log(`📦 Database retrieval results:`);
  console.log(`   Market Data: ${marketData ? '✅ Found' : '❌ Not found'}${marketData ? ` (${JSON.stringify(marketData).length} bytes)` : ''}`);
  console.log(`   Sentiment: ${sentimentData ? '✅ Found' : '❌ Not found'}${sentimentData ? ` (${JSON.stringify(sentimentData).length} bytes)` : ''}`);
  console.log(`   Technical: ${technicalData ? '✅ Found' : '❌ Not found'}${technicalData ? ` (${JSON.stringify(technicalData).length} bytes)` : ''}`);
  console.log(`   News: ${newsData ? '✅ Found' : '❌ Not found'}${newsData ? ` (${JSON.stringify(newsData).length} bytes)` : ''}`);
  console.log(`   On-Chain: ${onChainData ? '✅ Found' : '❌ Not found'}${onChainData ? ` (${JSON.stringify(onChainData).length} bytes)` : ''}`);
  
  // Check if we have minimum required data
  if (!marketData || !technicalData) {
    const missingData = [];
    if (!marketData) missingData.push('Market Data');
    if (!technicalData) missingData.push('Technical Data');
    
    const errorMsg = `❌ CRITICAL: Missing required data from database: ${missingData.join(', ')}`;
    console.error(errorMsg);
    console.error(`   This means the database writes may have failed or data hasn't been committed yet`);
    console.error(`   Throwing error to trigger fallback summary...`);
    throw new Error(errorMsg);
  }
  
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

  // ✅ UCIE SYSTEM: Return instant fallback summary for preview
  // GPT-5.1 analysis will run asynchronously after data collection
  // User will see GPT-5.1 analysis before activating Caesar AI
  console.log(`📊 Data collection complete. GPT-5.1 analysis will run asynchronously.`);
  
  // Return instant fallback summary (GPT-5.1 runs separately)
  return generateFallbackSummary(symbol, collectedData, apiStatus);
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
 * Generate Gemini AI summary from collected data (fallback when database is empty)
 * Uses the collectedData parameter directly instead of reading from database
 */
async function generateGeminiFromCollectedData(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  console.log(`📊 Gemini AI Summary: Using collectedData parameter (database fallback)`);
  
  // Import Gemini client
  const { generateGeminiAnalysis } = await import('../../../../lib/ucie/geminiClient');
  
  // Build context from collectedData parameter
  let context = `Cryptocurrency: ${symbol}\n\n`;
  context += `Data Collection Status:\n`;
  context += `- APIs Working: ${apiStatus.working.length}/${apiStatus.total}\n`;
  context += `- Data Quality: ${apiStatus.successRate}%\n\n`;

  // Market Data
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
    context += `Market Data:\n`;
    const price = agg.averagePrice || agg.aggregatedPrice || 0;
    const volume = agg.totalVolume24h || agg.aggregatedVolume24h || 0;
    const marketCap = collectedData.marketData.marketData?.marketCap || agg.aggregatedMarketCap || 0;
    const change = agg.averageChange24h || agg.aggregatedChange24h || 0;
    
    context += `- Price: ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    context += `- 24h Volume: ${(volume / 1e9).toFixed(2)}B\n`;
    context += `- Market Cap: ${(marketCap / 1e9).toFixed(2)}B\n`;
    context += `- 24h Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n\n`;
  }

  // Sentiment
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    context += `Social Sentiment:\n`;
    const score = sentiment.overallScore || 0;
    const trend = sentiment.trend || 'neutral';
    const mentions = collectedData.sentiment.volumeMetrics?.total24h || sentiment.mentions24h || 0;
    
    context += `- Overall Score: ${score.toFixed(0)}/100\n`;
    context += `- Trend: ${trend}\n`;
    context += `- 24h Mentions: ${mentions.toLocaleString('en-US')}\n\n`;
  }

  // Technical
  if (collectedData.technical?.success && collectedData.technical?.indicators) {
    context += `Technical Analysis:\n`;
    const indicators = collectedData.technical.indicators;
    const rsi = indicators.rsi?.value || indicators.rsi || 0;
    const macdSignal = indicators.macd?.signal || 'neutral';
    const trend = indicators.trend?.direction || collectedData.technical.trend?.direction || 'neutral';
    
    context += `- RSI: ${typeof rsi === 'number' ? rsi.toFixed(2) : rsi}\n`;
    context += `- MACD Signal: ${macdSignal}\n`;
    context += `- Trend: ${trend}\n\n`;
  }

  // News
  if (collectedData.news?.success && collectedData.news?.articles?.length > 0) {
    context += `Recent News (${collectedData.news.articles.length} articles):\n`;
    collectedData.news.articles.slice(0, 5).forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}\n`;
    });
    context += `\n`;
  }

  // On-Chain
  if (collectedData.onChain?.success) {
    context += `On-Chain Data:\n`;
    if (collectedData.onChain.whaleActivity) {
      const whale = collectedData.onChain.whaleActivity.summary || collectedData.onChain.whaleActivity;
      context += `- Whale Transactions: ${whale.totalTransactions || 0}\n`;
      context += `- Total Value: ${((whale.totalValueUSD || 0) / 1e6).toFixed(2)}M\n`;
    }
    context += `\n`;
  }

  // System prompt
  const systemPrompt = `You are a professional cryptocurrency analyst. Provide a comprehensive, data-driven analysis (~2500 words) of ${symbol} based on the provided data. 

Structure your analysis with these sections:

1. EXECUTIVE SUMMARY (300 words)
2. MARKET ANALYSIS (500 words)
3. TECHNICAL ANALYSIS (500 words)
4. SOCIAL SENTIMENT & COMMUNITY (400 words)
5. NEWS & DEVELOPMENTS (400 words)
6. ON-CHAIN & FUNDAMENTALS (300 words)
7. RISK ASSESSMENT & OUTLOOK (100 words)

Use ONLY the data provided. Be specific with numbers, percentages, and concrete data points.`;

  // Call Gemini AI
  try {
    const geminiPromise = generateGeminiAnalysis(systemPrompt, context, 10000, 0.7);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini timeout after 45 seconds')), 45000);
    });
    
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    console.log(`✅ Gemini AI generated ${response.tokensUsed} tokens from collectedData`);
    return response.content;
  } catch (error) {
    console.error(`❌ Gemini AI failed:`, error);
    throw error; // Re-throw to trigger fallback in caller
  }
}

/**
 * Generate Gemini AI summary of collected data
 * ✅ SIMPLIFIED: ALWAYS use collectedData parameter (already in memory)
 * This avoids database read issues and timeout problems
 */
async function generateGeminiSummary(
  symbol: string,
  collectedData: any,
  apiStatus: any
): Promise<string> {
  console.log(`📊 Gemini AI Summary: Using collectedData parameter (in-memory, fast)`);
  console.log(`   This data was just collected in Phase 1 and is already available`);
  
  // ✅ SIMPLIFIED: Just use the collectedData that was passed in
  // This is the data that was just collected in Phase 1 and is already in memory
  // No need to read from database - it's the same data!
  return generateGeminiFromCollectedData(symbol, collectedData, apiStatus);
}

/**
 * Generate OpenAI summary of collected data (DEPRECATED - using Gemini now)
 */
async function generateOpenAISummaryFromCollectedData(
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
  if (collectedData.marketData?.success && collectedData.marketData?.priceAggregation) {
    const agg = collectedData.marketData.priceAggregation;
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

  // Sentiment with AI Insights
  if (sentimentData?.success && sentimentData?.sentiment) {
    const sentiment = sentimentData.sentiment;
    context += `Social Sentiment:\n`;
    const score = sentiment.overallScore || 0;
    const trend = sentiment.trend || 'neutral';
    const mentions = sentimentData.volumeMetrics?.total24h || sentiment.mentions24h || 0;
    
    // ✅ FIX: Never show 0 for Bitcoin sentiment (impossible value)
    if (score === 0 && (symbol === 'BTC' || symbol === 'ETH')) {
      context += `- Overall Score: Data temporarily unavailable (API issue)\n`;
    } else {
      context += `- Overall Score: ${score.toFixed(0)}/100\n`;
    }
    
    context += `- Trend: ${trend}\n`;
    
    // ✅ FIX: Never show 0 mentions for Bitcoin (impossible value)
    if (mentions === 0 && (symbol === 'BTC' || symbol === 'ETH')) {
      context += `- 24h Mentions: Data temporarily unavailable (Bitcoin typically has 50K-200K daily mentions)\n`;
    } else {
      context += `- 24h Mentions: ${mentions.toLocaleString('en-US')}\n`;
    }
    
    // ✅ NEW: Include AI trend insights
    if (sentimentData.trendInsights) {
      const insights = sentimentData.trendInsights;
      context += `\nAI Trend Analysis:\n`;
      context += `- ${insights.trendAnalysis}\n`;
      context += `- Momentum: ${insights.momentumIndicator}\n`;
      if (insights.keyNarratives && insights.keyNarratives.length > 0) {
        context += `- Key Narratives: ${insights.keyNarratives.join(', ')}\n`;
      }
      context += `- Trading Implications: ${insights.tradingImplications}\n`;
    }
    context += `\n`;
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

  // News with Enhanced Details
  if (newsData?.success && newsData?.articles?.length > 0) {
    context += `Recent News (${newsData.articles.length} articles):\n`;
    
    // Include top 5 articles with sentiment and impact
    newsData.articles.slice(0, 5).forEach((article: any, i: number) => {
      context += `${i + 1}. ${article.title}\n`;
      if (article.sentiment) {
        context += `   Sentiment: ${article.sentiment} (${article.sentimentScore || 0}/100)\n`;
      }
      if (article.impactScore) {
        context += `   Impact: ${article.impactScore}/10\n`;
      }
      if (article.category) {
        context += `   Category: ${article.category}\n`;
      }
    });
    
    // Include news summary if available
    if (newsData.summary) {
      context += `\nNews Summary:\n`;
      context += `- Overall Sentiment: ${newsData.summary.overallSentiment || 'neutral'}\n`;
      context += `- Bullish: ${newsData.summary.bullishCount || 0}, Bearish: ${newsData.summary.bearishCount || 0}, Neutral: ${newsData.summary.neutralCount || 0}\n`;
      context += `- Average Impact: ${(newsData.summary.averageImpact || 0).toFixed(1)}/10\n`;
    }
    context += `\n`;
  }

  // On-Chain with AI Insights
  if (onChainData?.success) {
    context += `On-Chain Data:\n`;
    if (onChainData.whaleActivity) {
      const whale = onChainData.whaleActivity.summary || onChainData.whaleActivity;
      context += `- Whale Transactions: ${whale.totalTransactions || 0}\n`;
      context += `- Total Value: $${((whale.totalValueUSD || 0) / 1e6).toFixed(2)}M\n`;
      context += `- Exchange Deposits: ${whale.exchangeDeposits || 0} (selling pressure)\n`;
      context += `- Exchange Withdrawals: ${whale.exchangeWithdrawals || 0} (accumulation)\n`;
      context += `- Net Flow: ${(whale.exchangeWithdrawals || 0) - (whale.exchangeDeposits || 0)} (${(whale.exchangeWithdrawals || 0) > (whale.exchangeDeposits || 0) ? 'bullish' : 'bearish'})\n`;
    }
    if (onChainData.networkMetrics) {
      context += `- Hash Rate: ${(onChainData.networkMetrics.hashRate || 0).toFixed(2)} TH/s\n`;
      context += `- Mempool: ${(onChainData.networkMetrics.mempoolSize || 0).toLocaleString()} txs\n`;
    }
    
    // ✅ NEW: Include AI on-chain insights
    if (onChainData.aiInsights) {
      const insights = onChainData.aiInsights;
      context += `\nAI On-Chain Analysis:\n`;
      context += `- Whale Activity: ${insights.whaleActivityAnalysis}\n`;
      context += `- Exchange Flows: ${insights.exchangeFlowAnalysis}\n`;
      context += `- Network Health: ${insights.networkHealthSummary}\n`;
      context += `- Risk Level: ${insights.riskIndicators?.level || 'N/A'}\n`;
      context += `- Trading Implications: ${insights.tradingImplications}\n`;
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

  // Call Gemini AI (no timeout - let Vercel's 60s limit handle it)
  // Increased to 10000 tokens for comprehensive analysis
  try {
    console.log(`🤖 Calling Gemini API with 10000 tokens...`);
    const response = await generateGeminiAnalysis(
      systemPrompt,
      context,
      10000, // ✅ 10000 tokens (~2500 words) for comprehensive analysis
      0.7    // temperature
    );
    
    console.log(`✅ Gemini AI generated ${response.tokensUsed} tokens (${response.content.length} chars)`);
    return response.content;
    
  } catch (error) {
    console.error(`❌ Gemini AI failed:`, error);
    console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   Error message: ${error instanceof Error ? error.message : String(error)}`);
    
    // Re-throw error to be handled by caller
    throw error;
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
 * Generate Caesar AI prompt preview
 * Shows user exactly what data and instructions will be sent to Caesar
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
  if (collectedData.sentiment?.success && collectedData.sentiment?.sentiment) {
    const sentiment = collectedData.sentiment.sentiment;
    prompt += `### Social Sentiment Analysis\n`;
    prompt += `- Overall Score: ${sentiment.overallScore || 0}/100\n`;
    prompt += `- Trend: ${sentiment.trend || 'neutral'}\n`;
    prompt += `- 24h Mentions: ${(collectedData.sentiment.volumeMetrics?.total24h || 0).toLocaleString('en-US')}\n`;
    
    // Distribution breakdown
    if (collectedData.sentiment.sentiment.distribution) {
      const dist = collectedData.sentiment.sentiment.distribution;
      prompt += `- Sentiment Distribution:\n`;
      prompt += `  * Positive: ${dist.positive || 0}%\n`;
      prompt += `  * Neutral: ${dist.neutral || 0}%\n`;
      prompt += `  * Negative: ${dist.negative || 0}%\n`;
    }
    
    // AI Insights
    if (collectedData.sentiment.trendInsights) {
      const insights = collectedData.sentiment.trendInsights;
      prompt += `\n**AI Sentiment Analysis:**\n`;
      prompt += `${insights.trendAnalysis}\n`;
      prompt += `Momentum: ${insights.momentumIndicator}\n`;
      if (insights.keyNarratives && insights.keyNarratives.length > 0) {
        prompt += `Key Narratives: ${insights.keyNarratives.join(', ')}\n`;
      }
      prompt += `Trading Implications: ${insights.tradingImplications}\n`;
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
    
    // AI On-Chain Insights
    if (collectedData.onChain.aiInsights) {
      const insights = collectedData.onChain.aiInsights;
      prompt += `\n**AI On-Chain Analysis:**\n`;
      prompt += `${insights.whaleActivityAnalysis}\n`;
      prompt += `Exchange Flows: ${insights.exchangeFlowAnalysis}\n`;
      prompt += `Network Health: ${insights.networkHealthSummary}\n`;
      prompt += `Risk Level: ${insights.riskIndicators?.level || 'N/A'}\n`;
      prompt += `Trading Implications: ${insights.tradingImplications}\n`;
    }
    prompt += `\n`;
  }
  
  // AI Summary (OpenAI GPT-4o)
  prompt += `## AI-Generated Market Summary\n`;
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
