/**
 * UCIE Market Data API Endpoint
 * 
 * GET /api/ucie/market-data/BTC
 * 
 * Returns real-time Bitcoin price and market statistics from multiple exchanges.
 * 
 * What you'll see:
 * - Current Price: Live Bitcoin price in USD
 * - 24h Change: Price movement in the last 24 hours (percentage and dollar amount)
 * - Market Cap: Total value of all Bitcoin in circulation
 * - Volume: Total trading volume across all exchanges in 24 hours
 * - High/Low 24h: Highest and lowest prices in the last 24 hours
 * - Supply: How many Bitcoin exist (circulating) vs maximum possible (21 million)
 * 
 * Why it matters: Shows you the current market value and trading activity. Use this to
 * understand if Bitcoin is trending up or down, and how actively it's being traded.
 * 
 * Data sources: CoinGecko, CoinMarketCap, Kraken (aggregated for accuracy)
 * Cache: 3 minutes (ensures fresh data)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { aggregateExchangePrices, type PriceAggregation } from '../../../../lib/ucie/priceAggregation';
import { coinGeckoClient, coinMarketCapClient, type MarketData } from '../../../../lib/ucie/marketDataClients';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { isVeritasEnabled } from '../../../../lib/ucie/veritas/utils/featureFlags';
import { validateMarketData, type VeritasValidationResult } from '../../../../lib/ucie/veritas/validators/marketDataValidator';
import { validateBitcoinOnly } from '../../../../lib/ucie/btcOnlyValidator';

// Cache TTL: 6.5 minutes (ensures fresh data for AI analysis + buffer for preview viewing)
const CACHE_TTL = 390; // 390 seconds (6.5 minutes)

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
  veritasValidation?: VeritasValidationResult;
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

  // Validate Bitcoin-only
  const validation = validateBitcoinOnly(symbol as string);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      symbol: symbol as string || '',
      priceAggregation: {} as PriceAggregation,
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: validation.error
    });
  }

  const normalizedSymbol = validation.normalized!; // Always 'BTC'

  // Additional validation check
  if (!normalizedSymbol) {
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

  // ✅ CHECK FOR REFRESH PARAMETER: Skip cache for live data
  const forceRefresh = req.query.refresh === 'true';
  
  if (forceRefresh) {
    console.log(`🔄 LIVE DATA MODE: Bypassing cache for ${symbolUpper}`);
  }

  // Check database cache first (skip if refresh=true)
  if (!forceRefresh) {
    const cachedData = await getCachedAnalysis(symbolUpper, 'market-data', userId, userEmail);
    if (cachedData) {
      console.log(`✅ Cache hit for ${symbolUpper} market-data`);
      return res.status(200).json({
        ...cachedData,
        cached: true,
      });
    }
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

    // ✅ VERITAS PROTOCOL: Optional validation when feature flag enabled
    if (isVeritasEnabled()) {
      try {
        console.log(`🔍 Veritas Protocol enabled - validating market data for ${symbolUpper}...`);
        
        // Run validation with 5-second timeout
        const validationPromise = validateMarketData(symbolUpper, response);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Veritas validation timeout')), 5000);
        });
        
        const validation = await Promise.race([validationPromise, timeoutPromise]);
        
        // Add validation results to response (optional field)
        response.veritasValidation = validation;
        
        console.log(`✅ Veritas validation complete: confidence=${validation.confidence}%, alerts=${validation.alerts.length}`);
      } catch (error) {
        // Graceful degradation: Log error but don't fail the request
        console.warn(`⚠️ Veritas validation failed for ${symbolUpper}:`, error instanceof Error ? error.message : 'Unknown error');
        console.warn('   Continuing without validation (graceful degradation)');
        // Don't add veritasValidation field if validation fails
      }
    }

    // Cache the response in database (skip if refresh=true for live data)
    if (!forceRefresh) {
      // ✅ FIX: Store unwrapped data (no API wrappers)
      const unwrappedData = {
        priceAggregation: response.priceAggregation,
        marketData: response.marketData,
        dataQuality: response.dataQuality,
        timestamp: response.timestamp,
        sources: response.sources,
        attribution: response.attribution,
        veritasValidation: response.veritasValidation
      };
      
      await setCachedAnalysis(symbolUpper, 'market-data', unwrappedData, CACHE_TTL, overallQuality, userId, userEmail);
      console.log(`💾 Cached ${symbolUpper} market-data for ${CACHE_TTL}s (unwrapped format)`);
    } else {
      console.log(`⚡ LIVE DATA: Not caching ${symbolUpper} market-data`);
    }

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
