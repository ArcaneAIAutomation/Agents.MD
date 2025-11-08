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
 * Cache TTL: 15 minutes (for OpenAI/Caesar analysis)
 */
const CACHE_TTL = 15 * 60; // 900 seconds

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Extract and validate symbol and session ID
    const { symbol, sessionId } = req.query;
    
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

    console.log(`🔍 Caesar research request for ${normalizedSymbol}`);

    // Check database cache first
    const cachedData = await getCachedAnalysis(normalizedSymbol, 'research');
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // No cache, perform fresh research
    console.log(`🚀 Starting fresh Caesar research for ${normalizedSymbol}`);
    
    // ✅ Retrieve ALL cached data from database for Caesar context
    console.log(`📊 Retrieving all cached data for Caesar AI...`);
    const cachedData = await getAllCachedDataForCaesar(normalizedSymbol);
    
    // Build comprehensive context for Caesar
    let contextData: any = {
      // OpenAI summary of collected data
      openaiSummary: cachedData.openaiSummary?.summaryText || null,
      dataQuality: cachedData.openaiSummary?.dataQuality || 0,
      apiStatus: cachedData.openaiSummary?.apiStatus || null,
      
      // All cached analysis data
      marketData: cachedData.marketData,
      sentiment: cachedData.sentiment,
      technical: cachedData.technical,
      news: cachedData.news,
      onChain: cachedData.onChain
    };
    
    // Also retrieve phase data if session ID provided
    if (sessionId && typeof sessionId === 'string') {
      try {
        const phaseData = await getAggregatedPhaseData(sessionId, normalizedSymbol, 4);
        contextData.phaseData = phaseData;
        console.log(`📊 Retrieved phase data from ${Object.keys(phaseData).length} previous phases`);
      } catch (error) {
        console.warn('⚠️ Failed to retrieve phase data from database:', error);
      }
    }
    
    const contextSources = Object.keys(contextData).filter(k => contextData[k] !== null).length;
    console.log(`✅ Caesar AI context prepared with ${contextSources} data sources`);
    
    // Perform complete research workflow with context
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
    await setCachedAnalysis(normalizedSymbol, 'research', researchData, CACHE_TTL, 100);

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
