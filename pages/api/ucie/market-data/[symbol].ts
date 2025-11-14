/**
 * UCIE Market Data API Endpoint
 * 
 * Fetches and aggregates cryptocurrency market data from multiple sources
 * with caching, fallback mechanisms, and error handling.
 * 
 * Endpoint: GET /api/ucie/market-data/[symbol]
 * 
 * Features:
 * - Multi-source data fetching with fallback
 * - 30-second cache TTL
 * - Data quality scoring
 * - Graceful error handling
 * - Comprehensive market metrics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { aggregateExchangePrices, type PriceAggregation } from '../../../../lib/ucie/priceAggregation';
import { coinGeckoClient, coinMarketCapClient, type MarketData } from '../../../../lib/ucie/marketDataClients';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 2 minutes (for fresh, accurate data)
const CACHE_TTL = 2 * 60; // 120 seconds

export interface MarketDataResponse {
  success: boolean;
  symbol: string;
  priceAggregation: PriceAggregation;
  marketData?: {
    marketCap: number;
    circulatingSupply: number;
    totalSupply: number;
    high24h: number;
    low24h: number;
    change7d: number;
  };
  dataQuality: number;
  sources: string[];
  cached: boolean;
  timestamp: string;
  attribution?: {
    provider: string;
    url: string;
    message: string;
  };
  error?: string;
}

// Cache functions removed - now using database cache via cacheUtils

/**
 * Fetch comprehensive market data with improved fallback
 * ✅ IMPROVED: Better error handling and CoinMarketCap priority for reliability
 */
async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  const errors: string[] = [];
  
  // Try CoinMarketCap FIRST (more reliable, paid API)
  try {
    console.log(`📊 Trying CoinMarketCap for ${symbol}...`);
    const data = await coinMarketCapClient.getMarketData(symbol);
    console.log(`✅ CoinMarketCap success for ${symbol}`);
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`❌ CoinMarketCap failed for ${symbol}:`, errorMsg);
    errors.push(`CoinMarketCap: ${errorMsg}`);
  }

  // Fallback to CoinGecko (free API, may be rate-limited)
  try {
    console.log(`📊 Trying CoinGecko for ${symbol}...`);
    const data = await coinGeckoClient.getMarketData(symbol);
    console.log(`✅ CoinGecko success for ${symbol}`);
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`❌ CoinGecko failed for ${symbol}:`, errorMsg);
    errors.push(`CoinGecko: ${errorMsg}`);
  }

  // Log all failures
  console.error(`❌ All market data sources failed for ${symbol}:`, errors.join(', '));
  return null;
}

/**
 * Main API handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<MarketDataResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      priceAggregation: {} as PriceAggregation,
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed',
    });
  }

  const { symbol } = req.query;

  // Validate symbol parameter
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      priceAggregation: {} as PriceAggregation,
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Invalid or missing symbol parameter',
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;

  // Check database cache first
  const cachedData = await getCachedAnalysis(symbolUpper, 'market-data', userId, userEmail);
  if (cachedData) {
    return res.status(200).json({
      ...cachedData,
      cached: true,
    });
  }

  try {
    // Fetch price aggregation from multiple exchanges (parallel)
    const priceAggregationPromise = aggregateExchangePrices(symbolUpper);
    
    // Fetch comprehensive market data (with fallback)
    const marketDataPromise = fetchMarketData(symbolUpper);

    // Wait for both with increased timeout (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });

    const [priceAggregation, marketData] = await Promise.race([
      Promise.all([priceAggregationPromise, marketDataPromise]),
      timeoutPromise,
    ]);

    // Calculate overall data quality
    const priceQuality = priceAggregation.dataQuality;
    const marketDataQuality = marketData ? 100 : 0;
    const overallQuality = (priceQuality * 0.7) + (marketDataQuality * 0.3);

    // Determine sources used
    const sources: string[] = [];
    priceAggregation.prices.forEach(p => {
      if (p.success && !sources.includes(p.exchange)) {
        sources.push(p.exchange);
      }
    });
    if (marketData) {
      sources.push(marketData.source);
    }

    // Build response
    const response: MarketDataResponse = {
      success: true,
      symbol: symbolUpper,
      priceAggregation,
      marketData: marketData ? {
        marketCap: marketData.marketCap,
        circulatingSupply: marketData.circulatingSupply,
        totalSupply: marketData.totalSupply,
        high24h: marketData.high24h,
        low24h: marketData.low24h,
        change7d: marketData.change7d,
      } : undefined,
      dataQuality: overallQuality,
      sources,
      cached: false,
      timestamp: new Date().toISOString(),
      attribution: {
        provider: 'CoinGecko',
        url: 'https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral',
        message: 'Market data powered by CoinGecko'
      },
    };

    // Cache the response in database
    await setCachedAnalysis(symbolUpper, 'market-data', response, CACHE_TTL, overallQuality, userId, userEmail);

    return res.status(200).json(response);

  } catch (error) {
    console.error(`Market data API error for ${symbolUpper}:`, error);

    // Return error response
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      priceAggregation: {} as PriceAggregation,
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
