/**
 * Session Cleanup Cron API Endpoint
 * Bitcoin Sovereign Technology - Authentication System
 * 
 * This endpoint is called by Vercel Cron Jobs to clean up expired sessions.
 * 
 * Vercel Cron Configuration (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/cleanup-sessions",
 *       "schedule": "0 2 * * *"
 *     }]
 *   }
 * 
 * Schedule: Daily at 2:00 AM UTC
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupExpiredSessions, logCleanupStats, getSessionStats } from '../../../scripts/cleanup-sessions';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CleanupResponse {
  success: boolean;
  message: string;
  stats?: {
    deletedCount: number;
    duration: number;
    timestamp: string;
    beforeCleanup: {
      total: number;
      active: number;
      expired: number;
    };
    afterCleanup: {
      total: number;
      active: number;
      expired: number;
    };
  };
  error?: string;
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Verify the request is from Vercel Cron
 * 
 * @param req - Next.js API request
 * @returns True if authorized
 */
function isAuthorizedCronRequest(req: NextApiRequest): boolean {
  // In production, Vercel Cron sends a special header
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  
  // If CRON_SECRET is set, verify it matches
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  
  // In development, allow requests without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check for Vercel Cron user agent
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('vercel-cron')) {
    return true;
  }
  
  return false;
}

// ============================================================================
// API HANDLER
// ============================================================================

/**
 * Handle session cleanup cron job
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }
  
  // Verify authorization
  if (!isAuthorizedCronRequest(req)) {
    console.warn('⚠️ Unauthorized cron request attempt');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
  
  console.log('🔄 Session cleanup cron job triggered');
  
  try {
    // Get statistics before cleanup
    const beforeStats = await getSessionStats();
    console.log('📊 Before cleanup:', beforeStats);
    
    // Perform cleanup
    const cleanupStats = await cleanupExpiredSessions();
    console.log('🧹 Cleanup completed:', cleanupStats);
    
    // Get statistics after cleanup
    const afterStats = await getSessionStats();
    console.log('📊 After cleanup:', afterStats);
    
    // Log to database
    await logCleanupStats(cleanupStats);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${cleanupStats.deletedCount} expired sessions`,
      stats: {
        deletedCount: cleanupStats.deletedCount,
        duration: cleanupStats.duration,
        timestamp: cleanupStats.timestamp.toISOString(),
        beforeCleanup: beforeStats,
        afterCleanup: afterStats,
      },
    });
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Session cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
