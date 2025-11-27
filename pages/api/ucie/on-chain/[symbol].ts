/**
 * UCIE On-Chain Analysis API Endpoint
 * 
 * GET /api/ucie/on-chain/BTC
 * GET /api/ucie/on-chain/ETH
 * 
 * Returns comprehensive blockchain analysis with:
 * - Network metrics (hash rate, difficulty, mempool)
 * - Whale activity with exchange flow detection
 * - Holder distribution
 * - Exchange flows (deposits/withdrawals)
 * 
 * Uses database-backed caching (TTL: 5 minutes)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { fetchBitcoinOnChainData } from '../../../../lib/ucie/bitcoinOnChain';
import { fetchEthereumOnChainData } from '../../../../lib/ucie/ethereumOnChain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const symbolUpper = symbol.toUpperCase();

  try {
    console.log(`⛓️ UCIE On-Chain API called for ${symbolUpper}`);

    // 1. Check cache first (5 minute TTL)
    const cached = await getCachedAnalysis(symbolUpper, 'on-chain');
    if (cached) {
      console.log(`✅ Cache hit for ${symbolUpper}/on-chain`);
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`❌ Cache miss for ${symbolUpper}/on-chain - fetching fresh data`);

    // 2. Fetch on-chain data based on symbol
    let onChainData;
    
    if (symbolUpper === 'BTC' || symbolUpper === 'BITCOIN') {
      onChainData = await fetchBitcoinOnChainData();
    } else if (symbolUpper === 'ETH' || symbolUpper === 'ETHEREUM') {
      onChainData = await fetchEthereumOnChainData();
    } else {
      // For other tokens, return minimal data
      return res.status(200).json({
        success: true,
        data: {
          symbol: symbolUpper,
          chain: 'unknown',
          message: 'On-chain analysis currently only available for BTC and ETH',
          dataQuality: 0,
          timestamp: new Date().toISOString()
        },
        cached: false,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Cache the result (5 minutes = 300 seconds)
    await setCachedAnalysis(
      symbolUpper,
      'on-chain',
      onChainData,
      300, // 5 minutes
      onChainData.dataQuality
    );

    console.log(`✅ On-chain data fetched and cached for ${symbolUpper} (quality: ${onChainData.dataQuality}%)`);

    // 4. Return response
    return res.status(200).json({
      success: true,
      data: onChainData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ UCIE On-Chain API Error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch on-chain data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
