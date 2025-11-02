/**
 * Cron Job: Cleanup Expired Cache Entries
 * Bitcoin Sovereign Technology - UCIE Cache Management
 * 
 * This endpoint should be called periodically (e.g., daily) to remove
 * expired entries from the database cache.
 * 
 * Schedule: Daily at 3 AM UTC (0 3 * * *)
 * 
 * Setup in Vercel:
 * 1. Go to Project Settings > Cron Jobs
 * 2. Add cron job with path: /api/cron/cleanup-cache
 * 3. Schedule: 0 3 * * * (Daily at 3 AM UTC)
 * 4. Add header: Authorization: Bearer [Your CRON_SECRET]
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupExpiredCache } from '../../../lib/ucie/cache';

interface CleanupResponse {
  success: boolean;
  deleted: number;
  timestamp: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
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

  // Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured');
    return res.status(500).json({
      success: false,
      deleted: 0,
      timestamp: new Date().toISOString(),
      error: 'Server configuration error',
    });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('⚠️ Unauthorized cache cleanup attempt');
    return res.status(401).json({
      success: false,
      deleted: 0,
      timestamp: new Date().toISOString(),
      error: 'Unauthorized',
    });
  }

  try {
    console.log('🧹 Starting cache cleanup...');
    const deleted = await cleanupExpiredCache();
    console.log(`✅ Cache cleanup complete: ${deleted} entries deleted`);

    return res.status(200).json({
      success: true,
      deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
    return res.status(500).json({
      success: false,
      deleted: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
