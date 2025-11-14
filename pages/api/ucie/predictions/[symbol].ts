/**
 * UCIE Predictive Modeling API Endpoint
 * 
 * Generates price predictions, pattern matching, and scenario analysis
 * Caches results for 1 hour
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePricePredictions, type PredictionResult, type HistoricalPrice } from '../../../../lib/ucie/pricePrediction';
import { detectPatterns, matchHistoricalPatterns, type PatternMatchingResult } from '../../../../lib/ucie/patternMatching';
import { generateMultiTimeframeScenarios, type ScenarioAnalysis, type MarketConditions } from '../../../../lib/ucie/scenarioAnalysis';
import { calculateModelPerformance, storePrediction, type ModelPerformance } from '../../../../lib/ucie/modelAccuracy';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface PredictionsResponse {
  success: boolean;
  data?: {
    symbol: string;
    currentPrice: number;
    predictions: PredictionResult;
    patternMatching: PatternMatchingResult;
    scenarios: {
      '24h': ScenarioAnalysis;
      '7d': ScenarioAnalysis;
      '30d': ScenarioAnalysis;
    };
    modelPerformance: ModelPerformance;
    dataQuality: number;
    lastUpdated: string;
  };
  error?: string;
  cached?: boolean;
}

// Cache TTL: 2 minutes (for fresh, accurate data)
const CACHE_TTL = 2 * 60; // 120 seconds

/**
 * Get CoinGecko ID from symbol
 */
async function getCoinGeckoId(symbol: string): Promise<string> {
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'VET': 'vechain'
  };
  
  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Fetch real historical price data from CoinGecko
 */
async function fetchHistoricalPrices(symbol: string): Promise<HistoricalPrice[]> {
  try {
    const coinGeckoId = await getCoinGeckoId(symbol);
    const days = 365;
    
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
    
    const response = await fetch(
      `${baseUrl}/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      { headers, signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform CoinGecko data to OHLCV format
    const prices: HistoricalPrice[] = data.prices.map((price: number[], index: number) => {
      const timestamp = price[0];
      const close = price[1];
      const volume = data.total_volumes[index]?.[1] || 0;
      
      // Estimate OHLC from daily close price (±2% range)
      const high = close * 1.02;
      const low = close * 0.98;
      const open = low + (high - low) * 0.5;
      
      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume
      };
    });
    
    console.log(`✅ Fetched ${prices.length} days of real historical data for ${symbol}`);
    return prices;
    
  } catch (error) {
    console.error(`❌ Failed to fetch historical prices for ${symbol}:`, error);
    throw new Error(`Unable to fetch historical price data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch real market conditions from other UCIE endpoints
 */
async function fetchMarketConditions(symbol: string): Promise<MarketConditions> {
  try {
    // Fetch technical analysis data
    const technicalPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ucie/technical/${symbol}`, {
      signal: AbortSignal.timeout(20000) // Increased from 5s to 20s
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    
    // Fetch sentiment data
    const sentimentPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ucie/sentiment/${symbol}`, {
      signal: AbortSignal.timeout(20000) // Increased from 5s to 20s
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    
    const [technical, sentiment] = await Promise.all([technicalPromise, sentimentPromise]);
    
    // Extract real market conditions
    const volatility = technical?.data?.volatility?.current || 50;
    const trend = technical?.data?.trend?.direction || 'neutral';
    const rsi = technical?.data?.indicators?.rsi || 50;
    const momentum = rsi - 50; // Convert RSI to momentum (-50 to +50)
    const sentimentScore = sentiment?.data?.overallScore || 0;
    const technicalScore = technical?.data?.consensus?.score || 50;
    
    // Calculate fundamental score from available data
    const fundamentalScore = (technicalScore + sentimentScore) / 2;
    
    console.log(`✅ Fetched real market conditions for ${symbol}`);
    
    return {
      volatility,
      trend: trend as 'bullish' | 'bearish' | 'neutral',
      momentum,
      sentiment: sentimentScore,
      technicalScore,
      fundamentalScore
    };
    
  } catch (error) {
    console.error(`❌ Failed to fetch market conditions for ${symbol}:`, error);
    throw new Error(`Unable to fetch market conditions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main API handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<PredictionsResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { symbol } = req.query;

    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol parameter'
      });
    }

    const symbolUpper = symbol.toUpperCase();

    // Check database cache
    const cachedData = await getCachedAnalysis(symbolUpper, 'predictions');
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Fetch historical price data
    const historicalPrices = await fetchHistoricalPrices(symbolUpper);
    const currentPrice = historicalPrices[historicalPrices.length - 1].close;
    const closePrices = historicalPrices.map(p => p.close);

    // Generate price predictions
    const predictions = await generatePricePredictions(
      symbolUpper,
      historicalPrices,
      currentPrice
    );

    // Detect chart patterns
    const patterns = detectPatterns(closePrices);
    const currentPattern = patterns.length > 0 ? patterns[0] : null;

    // Match historical patterns
    const patternMatching = await matchHistoricalPatterns(
      closePrices,
      currentPattern
    );

    // Fetch market conditions
    const marketConditions = await fetchMarketConditions(symbolUpper);

    // Generate scenario analysis
    const scenarios = await generateMultiTimeframeScenarios(
      symbolUpper,
      currentPrice,
      marketConditions
    );

    // Calculate model performance
    const modelPerformance = await calculateModelPerformance(symbolUpper);

    // Store predictions for future validation
    await Promise.all([
      storePrediction({
        symbol: symbolUpper,
        predictionTimestamp: Date.now(),
        targetTimestamp: Date.now() + 24 * 60 * 60 * 1000,
        timeframe: '24h',
        predictedPrice: predictions.predictions.price24h.mid,
        currentPrice,
        confidence: predictions.predictions.price24h.confidence,
        methodology: predictions.predictions.price24h.methodology,
        validated: false
      }),
      storePrediction({
        symbol: symbolUpper,
        predictionTimestamp: Date.now(),
        targetTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        timeframe: '7d',
        predictedPrice: predictions.predictions.price7d.mid,
        currentPrice,
        confidence: predictions.predictions.price7d.confidence,
        methodology: predictions.predictions.price7d.methodology,
        validated: false
      }),
      storePrediction({
        symbol: symbolUpper,
        predictionTimestamp: Date.now(),
        targetTimestamp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        timeframe: '30d',
        predictedPrice: predictions.predictions.price30d.mid,
        currentPrice,
        confidence: predictions.predictions.price30d.confidence,
        methodology: predictions.predictions.price30d.methodology,
        validated: false
      })
    ]);

    // Prepare response
    const responseData = {
      symbol: symbolUpper,
      currentPrice,
      predictions,
      patternMatching,
      scenarios,
      modelPerformance,
      dataQuality: predictions.dataQuality,
      lastUpdated: new Date().toISOString()
    };

    // Cache the response in database
    await setCachedAnalysis(symbolUpper, 'predictions', responseData, CACHE_TTL, predictions.dataQuality, userId, userEmail);

    // Return response
    return res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    console.error('Predictions API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Clean up expired cache entries (run periodically)
 */
export function cleanupCache(): void {
  const now = Date.now();
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Clean up cache every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 10 * 60 * 1000);
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
