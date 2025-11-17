import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get filter parameter
    const { filter = 'pending' } = req.query;

    // Build query based on filter
    let sql = 'SELECT * FROM veritas_alerts';
    const params: any[] = [];

    if (filter === 'pending') {
      sql += ' WHERE reviewed = FALSE';
    } else if (filter === 'reviewed') {
      sql += ' WHERE reviewed = TRUE';
    }
    // 'all' filter - no WHERE clause

    sql += ' ORDER BY timestamp DESC LIMIT 100';

    // Execute query
    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      alerts: result.rows
    });
  } catch (error) {
    console.error('Error fetching Veritas alerts:', error);
    return res.status(500).json({
      error: 'Failed to fetch alerts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
