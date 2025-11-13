/**
 * Cron Job: Check Expired Trades
 * 
 * This endpoint should be called by Vercel Cron every 5 minutes
 * to check for expired trades and trigger backtesting.
 * 
 * Requirements: 5.7, 5.8, 5.20
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { checkExpiredTrades, getExpiredTradesStats } from '../../../lib/atge/expiredTradesChecker';

interface CronResponse {
  success: boolean;
  timestamp: string;
  stats?: {
    checked: number;
    triggered: number;
    errors: number;
  };
  expiredStats?: {
    totalExpired: number;
    pendingBacktest: number;
    completedBacktest: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  // Verify cron secret to prevent unauthorized access
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    console.warn('[Cron] Unauthorized access attempt to check-expired-trades');
    return res.status(401).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: 'Unauthorized'
    });
  }

  try {
    console.log('[Cron] Starting expired trades check...');

    // Run the expired trades checker
    const stats = await checkExpiredTrades();

    // Get overall statistics
    const expiredStats = await getExpiredTradesStats();

    console.log('[Cron] Expired trades check completed:', stats);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      expiredStats
    });

  } catch (error) {
    console.error('[Cron] Error checking expired trades:', error);

    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
