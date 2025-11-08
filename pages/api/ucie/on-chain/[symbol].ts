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

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    // Check database cache first
    const cachedData = await getCachedAnalysis(symbolUpper, 'on-chain');
    if (cachedData) {
      console.log(`[UCIE On-Chain] Cache hit for ${symbolUpper}`);
      return res.status(200).json({
        ...cachedData,
        cached: true
      });
    }

    console.log(`[UCIE On-Chain] Fetching on-chain data for ${symbolUpper}`);

    // Fetch on-chain data based on symbol
    const onChainData = symbolUpper === 'BTC'
      ? await fetchBitcoinOnChainData()
      : await fetchEthereumOnChainData();

    // Cache the response in database
    await setCachedAnalysis(
      symbolUpper,
      'on-chain',
      onChainData,
      CACHE_TTL,
      onChainData.dataQuality
    );

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
