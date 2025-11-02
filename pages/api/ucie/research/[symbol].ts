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
 * In-memory cache for research results
 * Key: symbol, Value: { data, timestamp }
 */
const researchCache = new Map<string, { data: UCIECaesarResearch; timestamp: number }>();

/**
 * Cache TTL: 24 hours (in milliseconds)
 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached research if available and not expired
 */
function getCachedResearch(symbol: string): UCIECaesarResearch | null {
  const cached = researchCache.get(symbol.toUpperCase());
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  const age = now - cached.timestamp;
  
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    researchCache.delete(symbol.toUpperCase());
    return null;
  }
  
  console.log(`✅ Cache hit for ${symbol} (age: ${Math.floor(age / 1000)}s)`);
  return cached.data;
}

/**
 * Store research in cache
 */
function setCachedResearch(symbol: string, data: UCIECaesarResearch): void {
  researchCache.set(symbol.toUpperCase(), {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached research for ${symbol}`);
}

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
    // Extract and validate symbol
    const { symbol } = req.query;
    
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

    // Check cache first
    const cachedData = getCachedResearch(normalizedSymbol);
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
    
    // Perform complete research workflow
    // - Create research job (5 compute units for deep analysis)
    // - Poll for completion (max 10 minutes = 600 seconds)
    // - Parse and structure results
    const researchData = await performCryptoResearch(
      normalizedSymbol,
      5,  // compute units
      600 // max wait time (10 minutes)
    );

    // Cache the results
    setCachedResearch(normalizedSymbol, researchData);

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
 */
export const config = {
  api: {
    responseLimit: false,
    // Vercel serverless function timeout: 10 seconds (Hobby), 60 seconds (Pro)
    // We need to handle long research jobs with polling
  }
};
