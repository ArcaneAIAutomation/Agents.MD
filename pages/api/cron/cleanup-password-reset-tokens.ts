/**
 * Cleanup Password Reset Tokens Cron Job
 * POST /api/cron/cleanup-password-reset-tokens
 * 
 * Scheduled job to clean up expired and used password reset tokens.
 * Runs daily at 3 AM UTC via Vercel Cron.
 * 
 * Deletes:
 * - Expired tokens (expires_at < NOW())
 * - Used tokens older than 7 days (used = TRUE AND used_at < NOW() - INTERVAL '7 days')
 * 
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface CleanupResponse {
  success: boolean;
  message: string;
  deleted?: {
    expired: number;
    used: number;
    total: number;
  };
  timestamp?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // ========================================================================
    // STEP 1: Verify CRON_SECRET header
    // ========================================================================
    const cronSecret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('CRON_SECRET environment variable not configured');
      return res.status(500).json({
        success: false,
        message: 'Cron job not configured'
      });
    }

    if (cronSecret !== expectedSecret) {
      console.warn('Unauthorized cron job access attempt');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // ========================================================================
    // STEP 2: Delete expired tokens
    // ========================================================================
    const expiredResult = await query(
      `DELETE FROM password_reset_tokens 
       WHERE expires_at < NOW()
       RETURNING id`,
      []
    );

    const expiredCount = expiredResult.rows.length;

    // ========================================================================
    // STEP 3: Delete used tokens older than 7 days
    // ========================================================================
    const usedResult = await query(
      `DELETE FROM password_reset_tokens 
       WHERE used = TRUE 
       AND used_at < NOW() - INTERVAL '7 days'
       RETURNING id`,
      []
    );

    const usedCount = usedResult.rows.length;

    // ========================================================================
    // STEP 4: Calculate total and return success
    // ========================================================================
    const totalDeleted = expiredCount + usedCount;

    console.log(`✅ Password reset token cleanup completed:
      - Expired tokens deleted: ${expiredCount}
      - Used tokens deleted: ${usedCount}
      - Total deleted: ${totalDeleted}
    `);

    return res.status(200).json({
      success: true,
      message: 'Password reset token cleanup completed',
      deleted: {
        expired: expiredCount,
        used: usedCount,
        total: totalDeleted
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Password reset token cleanup error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred during cleanup',
      timestamp: new Date().toISOString()
    });
  }
}
