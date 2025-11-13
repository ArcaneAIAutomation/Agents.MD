import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../../../middleware/auth';
import { getMonitoringStats } from '../../../../lib/atge/monitoring';

/**
 * GET /api/atge/monitoring/stats
 * 
 * Get comprehensive monitoring statistics for ATGE
 * 
 * Query Parameters:
 * - timeRange: '1h' | '24h' | '7d' | '30d' (default: '24h')
 * 
 * Returns:
 * - errors: Error statistics and recent errors
 * - performance: Performance metrics and slowest operations
 * - database: Database statistics
 * - userFeedback: User feedback statistics
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Get query parameters
    const { timeRange = '24h' } = req.query;

    // Validate timeRange
    const validTimeRanges = ['1h', '24h', '7d', '30d'];
    if (!validTimeRanges.includes(timeRange as string)) {
      return res.status(400).json({ 
        error: 'Invalid time range',
        validOptions: validTimeRanges
      });
    }

    // 3. Get monitoring statistics
    const stats = await getMonitoringStats(timeRange as string);

    // 4. Return response
    return res.status(200).json({
      success: true,
      timeRange,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Monitoring stats error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monitoring statistics',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
