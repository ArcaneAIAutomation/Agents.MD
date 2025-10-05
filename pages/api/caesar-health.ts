import type { NextApiRequest, NextApiResponse } from 'next';
import { caesarHealthCheck } from '../../utils/caesarApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await caesarHealthCheck();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Caesar health check error:', error);
    res.status(503).json({
      success: false,
      health: {
        status: 'down',
        latency: 0,
        timestamp: new Date().toISOString(),
      },
      error: error.message,
    });
  }
}
