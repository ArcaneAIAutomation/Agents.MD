import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { 
  getErrorCountByType,
  getPerformanceSummary,
  getFeedbackSummary,
  checkSystemHealth
} from '../../../../lib/atge/monitoring';

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
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get query parameters
    const { timeRange = '24h' } = req.query;

    // Validate timeRange
    const validTimeRanges = ['1h', '24h', '7d', '30d'];
    if (!validTimeRanges.includes(timeRange as string)) {
      return res.status(400).json({ 
        error: 'Invalid time range',
        validOptions: validTimeRanges
      });
    }

    // 2. Convert timeRange to hours
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    const hours = hoursMap[timeRange as string];

    // 3. Get monitoring statistics
    const [errors, performance, feedback, health] = await Promise.all([
      getErrorCountByType(hours),
      getPerformanceSummary(),
      getFeedbackSummary(),
      checkSystemHealth()
    ]);

    // 4. Return response
    return res.status(200).json({
      success: true,
      timeRange,
      stats: {
        errors,
        performance,
        feedback,
        health
      },
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

export default withAuth(handler);
