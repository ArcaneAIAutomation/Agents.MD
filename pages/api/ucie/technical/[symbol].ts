/**
 * UCIE Technical Analysis API Endpoint
 * 
 * GET /api/ucie/technical/BTC?timeframe=1h
 * 
 * Returns technical indicators that traders use to predict price movements.
 * 
 * What you'll see:
 * - RSI (Relative Strength Index): Shows if Bitcoin is overbought (>70) or oversold (<30)
 * - MACD: Momentum indicator showing trend strength and direction
 * - Moving Averages (EMA): Average prices over time to identify trends
 * - Bollinger Bands: Price volatility bands showing potential breakout zones
 * - Support/Resistance: Key price levels where Bitcoin tends to bounce or break through
 * - Trading Signals: Buy/Sell recommendations based on technical patterns
 * 
 * Why it matters: Technical analysis helps identify entry and exit points for trades.
 * These indicators show momentum, trend direction, and potential reversal points.
 * 
 * Timeframes: 15m (short-term), 1h (intraday), 4h (swing), 1d (long-term)
 * Cache: 3 minutes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateTechnicalIndicators } from '../../../../lib/ucie/technicalAnalysis';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 6.5 minutes (ensures fresh data for AI analysis + buffer for preview viewing)
const CACHE_TTL = 390; // 390 seconds (6.5 minutes)

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { symbol, timeframe } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase() as 'BTC' | 'ETH';

  // Only allow BTC and ETH
  if (symbolUpper !== 'BTC' && symbolUpper !== 'ETH') {
    return res.status(400).json({
      success: false,
      error: 'Only BTC and ETH are supported at this time',
      symbol: symbolUpper
    });
  }

  // Validate timeframe
  const validTimeframes = ['1h', '4h', '1d'];
  const tf = (timeframe as string) || '1h';
  
  if (!validTimeframes.includes(tf)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid timeframe. Must be one of: 1h, 4h, 1d',
      symbol: symbolUpper
    });
  }

  try {
    // ✅ CHECK FOR REFRESH PARAMETER: Skip cache for live data
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `${symbolUpper}-${tf}`;
    
    if (forceRefresh) {
      console.log(`🔄 LIVE DATA MODE: Bypassing cache for ${cacheKey} technical`);
    }

    // Check database cache first (skip if refresh=true)
    if (!forceRefresh) {
      const cachedData = await getCachedAnalysis(cacheKey, 'technical');
      if (cachedData) {
        console.log(`✅ Cache hit for ${cacheKey} technical`);
        return res.status(200).json({
          success: true,
          ...cachedData,
          cached: true
        });
      }
    }

    console.log(`[UCIE Technical] Calculating indicators for ${symbolUpper} (${tf})`);

    // Calculate technical indicators
    const technicalData = await calculateTechnicalIndicators(
      symbolUpper,
      tf as '1h' | '4h' | '1d'
    );

    // Cache the response in database (skip if refresh=true for live data)
    if (!forceRefresh) {
      // ✅ FIX: Store unwrapped data (no API wrappers)
      const unwrappedData = {
        rsi: technicalData.rsi,
        macd: technicalData.macd,
        ema: technicalData.ema,
        bollingerBands: technicalData.bollingerBands,
        atr: technicalData.atr,
        stochastic: technicalData.stochastic,
        signals: technicalData.signals,
        multiTimeframeConsensus: technicalData.multiTimeframeConsensus,
        dataQuality: technicalData.dataQuality,
        timestamp: technicalData.timestamp
      };
      
      await setCachedAnalysis(
        cacheKey,
        'technical',
        unwrappedData,
        CACHE_TTL,
        technicalData.dataQuality,
        userId,
        userEmail
      );
      console.log(`💾 Cached ${cacheKey} technical for ${CACHE_TTL}s (unwrapped format)`);
    } else {
      console.log(`⚡ LIVE DATA: Not caching ${cacheKey} technical`);
    }

    console.log(`[UCIE Technical] ${symbolUpper} signal: ${technicalData.signals.overall} (${technicalData.signals.confidence}% confidence)`);

    return res.status(200).json({
      success: true,
      ...technicalData,
      cached: false
    });
  } catch (error) {
    console.error('[UCIE Technical] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate technical indicators',
      symbol: symbolUpper
    });
  }
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
