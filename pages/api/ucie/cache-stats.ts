/**
 * UCIE Cache Statistics API
 * Bitcoin Sovereign Technology - Cache Monitoring
 * 
 * Returns comprehensive cache statistics for monitoring and optimization.
 * 
 * GET /api/ucie/cache-stats
 * 
 * Response:
 * {
 *   success: true,
 *   stats: {
 *     hits: number,
 *     misses: number,
 *     hitRate: number,
 *     memoryHits: number,
 *     redisHits: number,
 *     databaseHits: number,
 *     totalEntries: number
 *   },
 *   timestamp: string
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCacheStats } from '../../../lib/ucie/cache';

interface CacheStatsResponse {
  success: boolean;
  stats: {
    hits: number;
    misses: number;
    hitRate: number;
    memoryHits: number;
    redisHits: number;
    databaseHits: number;
    totalEntries: number;
  };
  timestamp: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheStatsResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      stats: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryHits: 0,
        redisHits: 0,
        databaseHits: 0,
        totalEntries: 0,
      },
      timestamp: new Date().toISOString(),
      error: 'Method not allowed',
    });
  }

  try {
    const stats = getCacheStats();

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return res.status(500).json({
      success: false,
      stats: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryHits: 0,
        redisHits: 0,
        databaseHits: 0,
        totalEntries: 0,
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
