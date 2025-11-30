/**
 * UCIE Staged Data Collection API Endpoint
 * 
 * GET /api/ucie/collect-all-data/[symbol]
 * 
 * Collects ALL UCIE data in stages to prevent timeouts:
 * - Stage 1: Market Data + Technical (fast)
 * - Stage 2: Sentiment + Risk (medium)
 * - Stage 3: News (slow)
 * - Stage 4: On-Chain + Predictions + Derivatives + DeFi (optional)
 * 
 * All data is cached in Supabase database for Caesar AI analysis.
 * 
 * Features:
 * - Staged collection prevents timeout
 * - Automatic retry on failure
 * - Database caching for all data
 * - Progress tracking
 * - Partial success handling
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface CollectionProgress {
  stage: number;
  totalStages: number;
  currentTask: string;
  completed: string[];
  failed: string[];
}

interface CollectionResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  progress: CollectionProgress;
  data: {
    marketData: any | null;
    technical: any | null;
    sentiment: any | null;
    risk: any | null;
    news: any | null;
    onChain: any | null;
    predictions: any | null;
    derivatives: any | null;
    defi: any | null;
  };
  dataQuality: number;
  cached: boolean;
  error?: string;
}

// Cache TTL: 7 minutes (aggregated data collection + buffer for preview viewing)
const CACHE_TTL = 420; // 420 seconds (7 minutes)

/**
 * Fetch with timeout and retry
 */
async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  retries: number = 2
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`🔄 Fetching ${url} (attempt ${attempt + 1}/${retries + 1})`);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${url}`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`⚠️ Attempt ${attempt + 1} failed for ${url}:`, lastError.message);
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Calculate overall data quality
 */
function calculateDataQuality(data: any): number {
  const qualities: number[] = [];
  
  if (data.marketData?.dataQuality) qualities.push(data.marketData.dataQuality);
  if (data.technical?.dataQuality) qualities.push(data.technical.dataQuality);
  if (data.sentiment?.dataQuality) qualities.push(data.sentiment.dataQuality);
  if (data.news?.dataQuality) qualities.push(data.news.dataQuality);
  if (data.risk?.dataQualityScore) qualities.push(data.risk.dataQualityScore);
  if (data.onChain?.dataQuality) qualities.push(data.onChain.dataQuality);
  if (data.predictions?.dataQuality) qualities.push(data.predictions.dataQuality);
  if (data.derivatives?.dataQuality) qualities.push(data.derivatives.dataQuality);
  if (data.defi?.dataQuality) qualities.push(data.defi.dataQuality);
  
  if (qualities.length === 0) return 0;
  
  return Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length);
}

/**
 * Main API handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<CollectionResponse>
) {
  // Get user info if authenticated
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      progress: {
        stage: 0,
        totalStages: 4,
        currentTask: 'Invalid method',
        completed: [],
        failed: []
      },
      data: {
        marketData: null,
        technical: null,
        sentiment: null,
        risk: null,
        news: null,
        onChain: null,
        predictions: null,
        derivatives: null,
        defi: null
      },
      dataQuality: 0,
      cached: false,
      error: 'Method not allowed'
    });
  }
  
  const { symbol, force } = req.query;
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      progress: {
        stage: 0,
        totalStages: 4,
        currentTask: 'Validation failed',
        completed: [],
        failed: []
      },
      data: {
        marketData: null,
        technical: null,
        sentiment: null,
        risk: null,
        news: null,
        onChain: null,
        predictions: null,
        derivatives: null,
        defi: null
      },
      dataQuality: 0,
      cached: false,
      error: 'Invalid symbol parameter'
    });
  }
  
  const symbolUpper = symbol.toUpperCase();
  const forceRefresh = force === 'true';
  
  console.log(`🚀 Starting staged data collection for ${symbolUpper} (force: ${forceRefresh})`);
  
  try {
    // Check if we have complete cached data (unless force refresh)
    if (!forceRefresh) {
      const cachedComplete = await getCachedAnalysis(symbolUpper, 'market-data', userId, userEmail);
      if (cachedComplete) {
        console.log(`✅ Using cached data for ${symbolUpper}`);
        // Return cached data if available
        return res.status(200).json({
          success: true,
          symbol: symbolUpper,
          timestamp: new Date().toISOString(),
          progress: {
            stage: 4,
            totalStages: 4,
            currentTask: 'Complete (cached)',
            completed: ['all'],
            failed: []
          },
          data: cachedComplete,
          dataQuality: calculateDataQuality(cachedComplete),
          cached: true
        });
      }
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://news.arcane.group';
    const completed: string[] = [];
    const failed: string[] = [];
    const collectedData: any = {
      marketData: null,
      technical: null,
      sentiment: null,
      risk: null,
      news: null,
      onChain: null,
      predictions: null,
      derivatives: null,
      defi: null
    };
    
    // ============================================================================
    // STAGE 1: Fast endpoints (Market Data + Technical) - 30s each
    // ============================================================================
    console.log(`📊 STAGE 1/4: Fetching market data and technical analysis...`);
    
    try {
      collectedData.marketData = await fetchWithRetry(
        `${baseUrl}/api/ucie/market-data/${symbolUpper}`,
        30000,
        2
      );
      completed.push('market-data');
      console.log(`✅ Market data collected`);
    } catch (error) {
      console.error(`❌ Market data failed:`, error);
      failed.push('market-data');
    }
    
    try {
      collectedData.technical = await fetchWithRetry(
        `${baseUrl}/api/ucie/technical/${symbolUpper}`,
        30000,
        2
      );
      completed.push('technical');
      console.log(`✅ Technical analysis collected`);
    } catch (error) {
      console.error(`❌ Technical analysis failed:`, error);
      failed.push('technical');
    }
    
    // ============================================================================
    // STAGE 2: Medium endpoints (Sentiment + Risk) - 30s each
    // ============================================================================
    console.log(`📊 STAGE 2/4: Fetching sentiment and risk analysis...`);
    
    try {
      collectedData.sentiment = await fetchWithRetry(
        `${baseUrl}/api/ucie/sentiment/${symbolUpper}`,
        30000,
        2
      );
      completed.push('sentiment');
      console.log(`✅ Sentiment analysis collected`);
    } catch (error) {
      console.error(`❌ Sentiment analysis failed:`, error);
      failed.push('sentiment');
    }
    
    try {
      collectedData.risk = await fetchWithRetry(
        `${baseUrl}/api/ucie/risk/${symbolUpper}`,
        30000,
        2
      );
      completed.push('risk');
      console.log(`✅ Risk assessment collected`);
    } catch (error) {
      console.error(`❌ Risk assessment failed:`, error);
      failed.push('risk');
    }
    
    // ============================================================================
    // STAGE 3: Slow endpoint (News) - 90s with retries
    // ============================================================================
    console.log(`📊 STAGE 3/4: Fetching news (this may take longer)...`);
    
    try {
      collectedData.news = await fetchWithRetry(
        `${baseUrl}/api/ucie/news/${symbolUpper}`,
        90000,
        2
      );
      completed.push('news');
      console.log(`✅ News collected`);
    } catch (error) {
      console.error(`❌ News failed:`, error);
      failed.push('news');
    }
    
    // ============================================================================
    // STAGE 4: Optional endpoints (On-Chain, Predictions, Derivatives, DeFi)
    // ============================================================================
    console.log(`📊 STAGE 4/4: Fetching optional data sources...`);
    
    // On-Chain (only for BTC and ETH)
    if (symbolUpper === 'BTC' || symbolUpper === 'ETH') {
      try {
        collectedData.onChain = await fetchWithRetry(
          `${baseUrl}/api/ucie/on-chain/${symbolUpper}`,
          30000,
          2
        );
        completed.push('on-chain');
        console.log(`✅ On-chain data collected`);
      } catch (error) {
        console.error(`❌ On-chain data failed:`, error);
        failed.push('on-chain');
      }
    }
    
    // Predictions
    try {
      collectedData.predictions = await fetchWithRetry(
        `${baseUrl}/api/ucie/predictions/${symbolUpper}`,
        30000,
        2
      );
      completed.push('predictions');
      console.log(`✅ Predictions collected`);
    } catch (error) {
      console.error(`❌ Predictions failed:`, error);
      failed.push('predictions');
    }
    
    // Derivatives (may fail if CoinGlass requires upgrade)
    try {
      collectedData.derivatives = await fetchWithRetry(
        `${baseUrl}/api/ucie/derivatives/${symbolUpper}`,
        30000,
        1 // Only 1 retry for derivatives
      );
      completed.push('derivatives');
      console.log(`✅ Derivatives collected`);
    } catch (error) {
      console.error(`❌ Derivatives failed (expected if CoinGlass requires upgrade):`, error);
      failed.push('derivatives');
    }
    
    // DeFi
    try {
      collectedData.defi = await fetchWithRetry(
        `${baseUrl}/api/ucie/defi/${symbolUpper}`,
        30000,
        2
      );
      completed.push('defi');
      console.log(`✅ DeFi data collected`);
    } catch (error) {
      console.error(`❌ DeFi data failed:`, error);
      failed.push('defi');
    }
    
    // ============================================================================
    // Calculate data quality and cache results
    // ============================================================================
    const dataQuality = calculateDataQuality(collectedData);
    
    console.log(`📊 Data collection complete for ${symbolUpper}:`);
    console.log(`   ✅ Completed: ${completed.length} sources (${completed.join(', ')})`);
    console.log(`   ❌ Failed: ${failed.length} sources (${failed.join(', ')})`);
    console.log(`   📈 Data quality: ${dataQuality}%`);
    
    // Cache each data source individually in database
    const cachePromises: Promise<void>[] = [];
    
    if (collectedData.marketData) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'market-data',
          collectedData.marketData,
          CACHE_TTL,
          collectedData.marketData.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.technical) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'technical',
          collectedData.technical,
          CACHE_TTL,
          collectedData.technical.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.sentiment) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'sentiment',
          collectedData.sentiment,
          CACHE_TTL,
          collectedData.sentiment.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.risk) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'risk',
          collectedData.risk,
          CACHE_TTL,
          collectedData.risk.dataQualityScore,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.news) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'news',
          collectedData.news,
          CACHE_TTL,
          collectedData.news.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.onChain) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'on-chain',
          collectedData.onChain,
          CACHE_TTL,
          collectedData.onChain.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.predictions) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'predictions',
          collectedData.predictions,
          CACHE_TTL,
          collectedData.predictions.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.derivatives) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'derivatives',
          collectedData.derivatives,
          CACHE_TTL,
          collectedData.derivatives.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    if (collectedData.defi) {
      cachePromises.push(
        setCachedAnalysis(
          symbolUpper,
          'defi',
          collectedData.defi,
          CACHE_TTL,
          collectedData.defi.dataQuality,
          userId,
          userEmail
        )
      );
    }
    
    // Wait for all cache operations to complete
    await Promise.allSettled(cachePromises);
    console.log(`✅ All data cached in Supabase database`);
    
    // Return response
    return res.status(200).json({
      success: completed.length >= 3, // At least 3 sources must succeed
      symbol: symbolUpper,
      timestamp: new Date().toISOString(),
      progress: {
        stage: 4,
        totalStages: 4,
        currentTask: 'Complete',
        completed,
        failed
      },
      data: collectedData,
      dataQuality,
      cached: false
    });
    
  } catch (error) {
    console.error(`❌ Staged data collection error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      timestamp: new Date().toISOString(),
      progress: {
        stage: 0,
        totalStages: 4,
        currentTask: 'Failed',
        completed: [],
        failed: ['all']
      },
      data: {
        marketData: null,
        technical: null,
        sentiment: null,
        risk: null,
        news: null,
        onChain: null,
        predictions: null,
        derivatives: null,
        defi: null
      },
      dataQuality: 0,
      cached: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// Export with optional authentication middleware
export default withOptionalAuth(handler);

/**
 * API Configuration
 * Set max duration to 180 seconds (3 minutes) for staged collection
 */
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  maxDuration: 180, // 3 minutes
};
