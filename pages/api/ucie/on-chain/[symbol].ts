/**
 * UCIE On-Chain Data API Endpoint
 * 
 * GET /api/ucie/on-chain/BTC
 * 
 * Returns comprehensive blockchain data for Bitcoin only
 * Note: Etherscan removed - only Bitcoin on-chain data via Blockchain.com
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchBitcoinOnChainData } from '../../../../lib/ucie/bitcoinOnChain';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 5 minutes (blockchain data updates every block)
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

  const { symbol } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Only allow BTC (Etherscan removed)
  if (symbolUpper !== 'BTC') {
    return res.status(400).json({
      success: false,
      error: 'Only BTC is supported. Etherscan has been removed from UCIE.',
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

    console.log(`[UCIE On-Chain] Fetching Bitcoin on-chain data from Blockchain.com`);

    // Fetch Bitcoin on-chain data only (Etherscan removed)
    const onChainData = await fetchBitcoinOnChainData();
    
    // ✅ ENHANCEMENT: Add AI-powered analysis of on-chain data
    console.log(`🤖 Adding AI analysis to on-chain data...`);
    try {
      const { analyzeOnChainData } = await import('../../../../lib/ucie/onChainAnalysis');
      const aiInsights = await analyzeOnChainData(onChainData);
      onChainData.aiInsights = aiInsights;
      console.log(`✅ AI on-chain analysis complete`);
    } catch (error) {
      console.error(`⚠️ AI on-chain analysis failed:`, error);
      // Continue without AI insights
    }

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
