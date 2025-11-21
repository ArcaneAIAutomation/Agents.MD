import { NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // User is already authenticated by withAuth middleware
    // req.user is available with { id, email }

    // Get request body
    const { alertId, reviewedBy, notes } = req.body;

    // Validate required fields
    if (!alertId || !reviewedBy) {
      return res.status(400).json({
        error: 'Missing required fields: alertId, reviewedBy'
      });
    }

    // Update alert as reviewed
    const result = await query(
      `UPDATE veritas_alerts 
       SET reviewed = TRUE,
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_notes = $2
       WHERE id = $3
       RETURNING *`,
      [reviewedBy, notes || null, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(200).json({
      success: true,
      alert: result.rows[0]
    });
  } catch (error) {
    console.error('Error reviewing Veritas alert:', error);
    return res.status(500).json({
      error: 'Failed to review alert',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withAuth(handler);
