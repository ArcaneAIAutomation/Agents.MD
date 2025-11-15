/**
 * UCIE On-Chain Data API Endpoint
 * 
 * GET /api/ucie/on-chain/BTC
 * GET /api/ucie/on-chain/ETH
 * 
 * Returns comprehensive blockchain data for Bitcoin and Ethereum
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchBitcoinOnChainData } from '../../../../lib/ucie/bitcoinOnChain';
import { fetchEthereumOnChainData } from '../../../../lib/ucie/ethereumOnChain';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 2 minutes (for fresh, accurate data)
const CACHE_TTL = 2 * 60; // 120 seconds

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

  const { symbol } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Only allow BTC and ETH
  if (symbolUpper !== 'BTC' && symbolUpper !== 'ETH') {
    return res.status(400).json({
      success: false,
      error: 'Only BTC and ETH are supported at this time',
      symbol: symbolUpper
    });
  }

  try {
    // ✅ CHECK FOR REFRESH PARAMETER: Skip cache for live data
    const forceRefresh = req.query.refresh === 'true';
    
    if (forceRefresh) {
      console.log(`🔄 LIVE DATA MODE: Bypassing cache for ${symbolUpper} on-chain`);
    }

    // Check database cache first (skip if refresh=true)
    if (!forceRefresh) {
      const cachedData = await getCachedAnalysis(symbolUpper, 'on-chain');
      if (cachedData) {
        console.log(`✅ Cache hit for ${symbolUpper} on-chain`);
        return res.status(200).json({
          ...cachedData,
          cached: true
        });
      }
    }

    console.log(`[UCIE On-Chain] Fetching on-chain data for ${symbolUpper}`);

    // Fetch on-chain data based on symbol
    const onChainData = symbolUpper === 'BTC'
      ? await fetchBitcoinOnChainData()
      : await fetchEthereumOnChainData();

    // Cache the response in database (skip if refresh=true for live data)
    if (!forceRefresh) {
      await setCachedAnalysis(
        symbolUpper,
        'on-chain',
        onChainData,
        CACHE_TTL,
        onChainData.dataQuality,
        userId,
        userEmail
      );
      console.log(`💾 Cached ${symbolUpper} on-chain for ${CACHE_TTL}s`);
    } else {
      console.log(`⚡ LIVE DATA: Not caching ${symbolUpper} on-chain`);
    }

    console.log(`[UCIE On-Chain] Successfully fetched ${symbolUpper} on-chain data (quality: ${onChainData.dataQuality}%)`);

    return res.status(200).json({
      ...onChainData,
      cached: false
    });
  } catch (error) {
    console.error('[UCIE On-Chain] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch on-chain data',
      symbol: symbolUpper
    });
  }
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
