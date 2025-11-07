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

// In-memory cache
interface CacheEntry {
  data: MarketDataResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

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

/**
 * Get cached data if available and fresh
 */
function getCachedData(symbol: string): MarketDataResponse | null {
  const cached = cache.get(symbol.toUpperCase());
  
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;
  
  if (age > CACHE_TTL) {
    cache.delete(symbol.toUpperCase());
    return null;
  }

  return {
    ...cached.data,
    cached: true,
  };
}

/**
 * Set cache data
 */
function setCacheData(symbol: string, data: MarketDataResponse): void {
  cache.set(symbol.toUpperCase(), {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetch comprehensive market data with fallback
 */
async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  // Try CoinGecko first
  try {
    return await coinGeckoClient.getMarketData(symbol);
  } catch (error) {
    console.warn(`CoinGecko failed for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }

  // Fallback to CoinMarketCap
  try {
    return await coinMarketCapClient.getMarketData(symbol);
  } catch (error) {
    console.warn(`CoinMarketCap failed for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
  }

  return null;
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
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

  // Check cache first
  const cachedData = getCachedData(symbolUpper);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    // Fetch price aggregation from multiple exchanges (parallel)
    const priceAggregationPromise = aggregateExchangePrices(symbolUpper);
    
    // Fetch comprehensive market data (with fallback)
    const marketDataPromise = fetchMarketData(symbolUpper);

    // Wait for both with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000);
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

    // Cache the response
    setCacheData(symbolUpper, response);

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
