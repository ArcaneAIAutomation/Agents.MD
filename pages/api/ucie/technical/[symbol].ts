/**
 * UCIE Technical Analysis API Endpoint
 * 
 * GET /api/ucie/technical/BTC?timeframe=1h
 * GET /api/ucie/technical/ETH?timeframe=4h
 * 
 * Returns comprehensive technical analysis with real-time indicators
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateTechnicalIndicators } from '../../../../lib/ucie/technicalAnalysis';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 5 minutes (technical indicators recalculate periodically)
const CACHE_TTL = 5 * 60; // 300 seconds

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
      await setCachedAnalysis(
        cacheKey,
        'technical',
        technicalData,
        CACHE_TTL,
        technicalData.dataQuality,
        userId,
        userEmail
      );
      console.log(`💾 Cached ${cacheKey} technical for ${CACHE_TTL}s`);
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
