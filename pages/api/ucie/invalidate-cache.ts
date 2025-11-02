/**
 * UCIE Cache Invalidation API
 * Bitcoin Sovereign Technology - Cache Management
 * 
 * Allows manual invalidation of cache entries by symbol or analysis type.
 * 
 * POST /api/ucie/invalidate-cache
 * 
 * Body:
 * {
 *   symbol?: string,      // Invalidate all cache for this symbol
 *   analysisType?: string // Invalidate all cache of this type
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   deleted: number,
 *   timestamp: string
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { invalidateCache } from '../../../lib/ucie/cache';

interface InvalidateCacheRequest {
  symbol?: string;
  analysisType?: string;
}

interface InvalidateCacheResponse {
  success: boolean;
  deleted: number;
  timestamp: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InvalidateCacheResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      deleted: 0,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed',
    });
  }

  try {
    const { symbol, analysisType } = req.body as InvalidateCacheRequest;

    // Validate input
    if (!symbol && !analysisType) {
      return res.status(400).json({
        success: false,
        deleted: 0,
        timestamp: new Date().toISOString(),
        error: 'Either symbol or analysisType must be provided',
      });
    }

    // Invalidate cache
    const deleted = await invalidateCache({ symbol, analysisType });

    console.log(`🗑️ Cache invalidated: ${deleted} entries deleted`, {
      symbol,
      analysisType,
    });

    return res.status(200).json({
      success: true,
      deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cache invalidation failed:', error);
    return res.status(500).json({
      success: false,
      deleted: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
