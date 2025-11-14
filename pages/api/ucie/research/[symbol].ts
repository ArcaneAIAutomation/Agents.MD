/**
 * UCIE Caesar Research API Endpoint
 * 
 * GET /api/ucie/research/[symbol]
 * 
 * Initiates Caesar AI research for a cryptocurrency token,
 * polls for completion, and returns structured results.
 * 
 * Features:
 * - Automatic research job creation
 * - Polling with timeout (max 10 minutes)
 * - Result parsing and structuring
 * - 24-hour caching
 * - Error handling with fallback
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  performCryptoResearch,
  handleResearchError,
  UCIECaesarResearch
} from '../../../../lib/ucie/caesarClient';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { getAggregatedPhaseData } from '../../../../lib/ucie/phaseDataStorage';
import { getAllCachedDataForCaesar } from '../../../../lib/ucie/openaiSummaryStorage';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

/**
 * API Response Types
 */
interface SuccessResponse {
  success: true;
  data: UCIECaesarResearch;
  cached: boolean;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  fallbackData?: UCIECaesarResearch;
}

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * Cache TTL: 2 minutes (for fresh, accurate data)
 */
const CACHE_TTL = 2 * 60; // 120 seconds

/**
 * Validate token symbol
 */
function validateSymbol(symbol: string): boolean {
  // Only allow alphanumeric characters, max 10 chars
  const symbolRegex = /^[A-Z0-9]{1,10}$/i;
  return symbolRegex.test(symbol);
}

/**
 * Main API Handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse | any>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  // Support both GET (check status) and POST (start analysis)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.'
    });
  }

  try {
    // Extract and validate symbol and session ID
    const { symbol, sessionId } = req.query;
    
    // ✅ NEW: Extract collected data from request body (if POST)
    const { collectedData } = req.body || {};
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol parameter'
      });
    }

    const normalizedSymbol = symbol.toUpperCase();

    // Validate symbol format
    if (!validateSymbol(normalizedSymbol)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol format. Use alphanumeric characters only (max 10 chars)'
      });
    }

    console.log(`🔍 Caesar research request for ${normalizedSymbol} (${req.method})`);

    // Handle GET with jobId - check status
    if (req.method === 'GET' && req.query.jobId) {
      const jobId = req.query.jobId as string;
      console.log(`📊 Checking status for job ${jobId}`);
      
      try {
        const { getCaesarResearchStatus } = await import('../../../../lib/ucie/caesarClient');
        const status = await getCaesarResearchStatus(jobId);
        
        // If completed, try to get the full research
        if (status.status === 'completed') {
          const { Caesar } = await import('../../../../utils/caesarClient');
          const { parseCaesarResearch, generateCryptoResearchQuery } = await import('../../../../lib/ucie/caesarClient');
          
          const job = await Caesar.getResearch(jobId);
          
          // Get context data for query generation
          const allCachedData = await getAllCachedDataForCaesar(normalizedSymbol);
          const contextData: any = {
            openaiSummary: allCachedData.openaiSummary?.summaryText || null,
            dataQuality: allCachedData.openaiSummary?.dataQuality || 0,
            apiStatus: allCachedData.openaiSummary?.apiStatus || null,
            marketData: allCachedData.marketData,
            sentiment: allCachedData.sentiment,
            technical: allCachedData.technical,
            news: allCachedData.news,
            onChain: allCachedData.onChain
          };
          
          const query = generateCryptoResearchQuery(normalizedSymbol, contextData);
          const research = parseCaesarResearch(job, query);
          
          // Cache the results
          await setCachedAnalysis(normalizedSymbol, 'research', research, CACHE_TTL, 100, userId, userEmail);
          
          return res.status(200).json({
            success: true,
            status: 'completed',
            progress: 100,
            data: research
          });
        }
        
        // Return status
        return res.status(200).json({
          success: true,
          status: status.status,
          progress: status.progress,
          estimatedTimeRemaining: status.estimatedTimeRemaining
        });
      } catch (error) {
        console.error(`❌ Failed to check job status:`, error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check job status'
        });
      }
    }

    // Check database cache first
    const cachedResearch = await getCachedAnalysis(normalizedSymbol, 'research');
    if (cachedResearch) {
      return res.status(200).json({
        success: true,
        data: cachedResearch,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // No cache, perform fresh research
    console.log(`🚀 Starting fresh Caesar research for ${normalizedSymbol}`);
    
    let allCachedData: any;
    let dataSource: 'preview' | 'database' = 'database';
    
    // ✅ PRIORITY 1: Use collected data from preview if available (BYPASS DATABASE)
    if (collectedData) {
      console.log(`📊 Using collected data from preview modal (BYPASSING DATABASE)...`);
      dataSource = 'preview';
      
      // Transform preview data structure to match expected format
      allCachedData = {
        openaiSummary: {
          summaryText: collectedData.summary || null,
          dataQuality: collectedData.dataQuality || 0,
          apiStatus: collectedData.apiStatus || null
        },
        marketData: collectedData.marketData || null,
        sentiment: collectedData.sentiment || null,
        technical: collectedData.technical || null,
        news: collectedData.news || null,
        onChain: collectedData.onChain || null
      };
      
      console.log(`✅ Using fresh data from preview (data quality: ${collectedData.dataQuality}%)`);
    } else {
      // ✅ FALLBACK: Retrieve data from Supabase database
      console.log(`📊 No preview data provided, retrieving from Supabase database...`);
      allCachedData = await getAllCachedDataForCaesar(normalizedSymbol);
    }
    
    // ✅ VALIDATION: Check if we have sufficient data
    const hasOpenAISummary = !!allCachedData.openaiSummary;
    const hasMarketData = !!allCachedData.marketData;
    const hasSentiment = !!allCachedData.sentiment;
    const hasTechnical = !!allCachedData.technical;
    const hasNews = !!allCachedData.news;
    const hasOnChain = !!allCachedData.onChain;
    
    const availableDataSources = [
      hasOpenAISummary && 'OpenAI Summary',
      hasMarketData && 'Market Data',
      hasSentiment && 'Sentiment',
      hasTechnical && 'Technical',
      hasNews && 'News',
      hasOnChain && 'On-Chain'
    ].filter(Boolean);
    
    console.log(`📦 Data availability for ${normalizedSymbol} (source: ${dataSource.toUpperCase()}):`);
    console.log(`   OpenAI Summary: ${hasOpenAISummary ? '✅' : '❌'}`);
    console.log(`   Market Data: ${hasMarketData ? '✅' : '❌'}`);
    console.log(`   Sentiment: ${hasSentiment ? '✅' : '❌'}`);
    console.log(`   Technical: ${hasTechnical ? '✅' : '❌'}`);
    console.log(`   News: ${hasNews ? '✅' : '❌'}`);
    console.log(`   On-Chain: ${hasOnChain ? '✅' : '❌'}`);
    console.log(`   Total: ${availableDataSources.length}/6 sources available`);
    
    // ✅ DETAILED DATA LOGGING: Log what data we actually have
    if (hasOpenAISummary) {
      console.log(`   📝 OpenAI Summary length: ${allCachedData.openaiSummary?.summaryText?.length || 0} chars`);
      console.log(`   📊 Data Quality: ${allCachedData.openaiSummary?.dataQuality || 0}%`);
    }
    if (hasMarketData) {
      // Log the ACTUAL structure to understand what we're working with
      console.log(`   💰 Market Data STRUCTURE:`, JSON.stringify(Object.keys(allCachedData.marketData), null, 2));
      console.log(`   💰 Market Data SAMPLE:`, JSON.stringify(allCachedData.marketData, null, 2).substring(0, 500));
    }
    if (hasSentiment) {
      console.log(`   😊 Sentiment STRUCTURE:`, JSON.stringify(Object.keys(allCachedData.sentiment), null, 2));
      console.log(`   😊 Sentiment SAMPLE:`, JSON.stringify(allCachedData.sentiment, null, 2).substring(0, 300));
    }
    if (hasTechnical) {
      console.log(`   📈 Technical STRUCTURE:`, JSON.stringify(Object.keys(allCachedData.technical), null, 2));
      console.log(`   📈 Technical SAMPLE:`, JSON.stringify(allCachedData.technical, null, 2).substring(0, 300));
    }
    if (hasNews) {
      console.log(`   📰 News: ${allCachedData.news?.articles?.length || 0} articles available`);
    }
    if (hasOnChain) {
      console.log(`   ⛓️ On-Chain STRUCTURE:`, JSON.stringify(Object.keys(allCachedData.onChain), null, 2));
    }
    
    // ✅ FAIL IMMEDIATELY if critical data is missing
    if (!hasOpenAISummary) {
      console.error(`❌ CRITICAL: OpenAI summary not found (source: ${dataSource}) for ${normalizedSymbol}`);
      return res.status(400).json({
        success: false,
        error: `OpenAI summary not available. Please run data collection first by clicking the ${normalizedSymbol} button and waiting for the preview modal.`
      });
    }
    
    if (availableDataSources.length < 3) {
      console.error(`❌ CRITICAL: Insufficient data (source: ${dataSource}) - ${availableDataSources.length}/6 sources`);
      return res.status(400).json({
        success: false,
        error: `Insufficient data. Only ${availableDataSources.length}/6 sources available. Please run data collection first.`
      });
    }
    
    console.log(`✅ Sufficient data available from ${dataSource.toUpperCase()} for Caesar analysis`);
    
    // ✅ BUILD COMPREHENSIVE CONTEXT FOR CAESAR FROM COLLECTED DATA
    console.log(`🔨 Building comprehensive context for Caesar AI from ${dataSource.toUpperCase()}...`);
    
    let contextData: any = {
      // OpenAI summary of collected data
      openaiSummary: allCachedData.openaiSummary?.summaryText || null,
      dataQuality: allCachedData.openaiSummary?.dataQuality || 0,
      apiStatus: allCachedData.openaiSummary?.apiStatus || null,
      
      // All cached analysis data (from database)
      marketData: allCachedData.marketData,
      sentiment: allCachedData.sentiment,
      technical: allCachedData.technical,
      news: allCachedData.news,
      onChain: allCachedData.onChain
    };
    
    // ✅ VERIFY DATA COMPLETENESS: Log detailed information about each data source
    console.log(`📋 Context data verification:`);
    
    if (contextData.openaiSummary) {
      console.log(`   ✅ OpenAI Summary: ${contextData.openaiSummary.length} chars`);
    } else {
      console.log(`   ❌ OpenAI Summary: MISSING`);
    }
    
    if (contextData.marketData) {
      const keys = Object.keys(contextData.marketData);
      console.log(`   ✅ Market Data: ${keys.length} fields (${keys.join(', ')})`);
    } else {
      console.log(`   ❌ Market Data: MISSING`);
    }
    
    if (contextData.sentiment) {
      const keys = Object.keys(contextData.sentiment);
      console.log(`   ✅ Sentiment: ${keys.length} fields (${keys.join(', ')})`);
    } else {
      console.log(`   ❌ Sentiment: MISSING`);
    }
    
    if (contextData.technical) {
      const keys = Object.keys(contextData.technical);
      console.log(`   ✅ Technical: ${keys.length} fields (${keys.join(', ')})`);
    } else {
      console.log(`   ❌ Technical: MISSING`);
    }
    
    if (contextData.news) {
      const articleCount = contextData.news.articles?.length || 0;
      console.log(`   ✅ News: ${articleCount} articles`);
    } else {
      console.log(`   ❌ News: MISSING`);
    }
    
    if (contextData.onChain) {
      const keys = Object.keys(contextData.onChain);
      console.log(`   ✅ On-Chain: ${keys.length} fields (${keys.join(', ')})`);
      
      // Log detailed on-chain data
      if (contextData.onChain.holderDistribution) {
        console.log(`      - Holder Distribution: ${contextData.onChain.holderDistribution.topHolders?.length || 0} holders`);
      }
      if (contextData.onChain.whaleActivity) {
        console.log(`      - Whale Activity: ${contextData.onChain.whaleActivity.summary?.totalTransactions || 0} transactions`);
      }
      if (contextData.onChain.exchangeFlows) {
        console.log(`      - Exchange Flows: ${contextData.onChain.exchangeFlows.trend || 'N/A'}`);
      }
      if (contextData.onChain.smartContract) {
        console.log(`      - Smart Contract: Score ${contextData.onChain.smartContract.score || 0}/100`);
      }
    } else {
      console.log(`   ❌ On-Chain: MISSING`);
    }
    
    // Also retrieve phase data if session ID provided
    if (sessionId && typeof sessionId === 'string') {
      try {
        const phaseData = await getAggregatedPhaseData(sessionId, normalizedSymbol, 4);
        contextData.phaseData = phaseData;
        const phaseCount = Object.keys(phaseData).length;
        console.log(`📊 Retrieved phase data from ${phaseCount} previous phases`);
        
        // Log phase data details
        Object.keys(phaseData).forEach(phase => {
          const phaseKeys = Object.keys(phaseData[phase]);
          console.log(`   - Phase ${phase}: ${phaseKeys.length} data points`);
        });
      } catch (error) {
        console.warn('⚠️ Failed to retrieve phase data from database:', error);
      }
    }
    
    const contextSources = Object.keys(contextData).filter(k => contextData[k] !== null).length;
    console.log(`✅ Caesar AI context prepared with ${contextSources} data sources`);
    
    // ✅ CALCULATE TOTAL DATA SIZE
    const contextSize = JSON.stringify(contextData).length;
    console.log(`📦 Total context size: ${(contextSize / 1024).toFixed(2)} KB`);
    
    // If POST, just start the job and return jobId
    if (req.method === 'POST') {
      const { createCryptoResearch, generateCryptoResearchQuery } = await import('../../../../lib/ucie/caesarClient');
      
      // Generate the query to return to frontend
      const query = generateCryptoResearchQuery(normalizedSymbol, contextData);
      
      const { jobId, status } = await createCryptoResearch(
        normalizedSymbol,
        5, // compute units
        contextData
      );
      
      console.log(`✅ Caesar research job created: ${jobId}`);
      
      return res.status(200).json({
        success: true,
        jobId,
        status,
        query, // Include the query so frontend can display it
        message: 'Caesar analysis started. Poll with GET request using jobId parameter.'
      });
    }
    
    // If GET without jobId, perform complete research workflow (legacy behavior)
    // - Create research job (5 compute units for deep analysis)
    // - Poll for completion (max 10 minutes = 600 seconds)
    // - Parse and structure results
    const researchData = await performCryptoResearch(
      normalizedSymbol,
      5,  // compute units
      600, // max wait time (10 minutes)
      contextData // pass ALL context data (OpenAI summary + cached data + phase data)
    );

    // Cache the results in database (24 hours)
    await setCachedAnalysis(normalizedSymbol, 'research', researchData, CACHE_TTL, 100, userId, userEmail);

    // Return success response
    return res.status(200).json({
      success: true,
      data: researchData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Caesar research API error:', error);

    // Generate fallback data
    const fallbackData = handleResearchError(error);

    // Return error with fallback
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallbackData
    });
  }
}

// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);

/**
 * API Configuration
 * Increase timeout for long-running research jobs
 * 
 * Note: Vercel serverless function timeout limits:
 * - Hobby: 10 seconds
 * - Pro: 60 seconds
 * - Enterprise: 900 seconds (15 minutes)
 * 
 * For 10-minute polling with 60-second intervals, ensure you have Pro or Enterprise plan.
 * The function will poll Caesar API every 60 seconds for up to 10 minutes.
 */
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 600, // 10 minutes (requires Vercel Pro or Enterprise)
};
