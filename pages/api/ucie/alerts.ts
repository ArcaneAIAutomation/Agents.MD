import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

export type AlertType = 'price_above' | 'price_below' | 'sentiment_change' | 'whale_transaction';
export type AlertStatus = 'active' | 'triggered' | 'disabled';

interface Alert {
  id: number;
  user_id: string;
  symbol: string;
  alert_type: AlertType;
  threshold_value: number;
  status: AlertStatus;
  created_at: string;
  triggered_at?: string;
  notification_sent: boolean;
}

/**
 * Alerts API
 * 
 * Manages user's custom alerts for cryptocurrency events
 * - GET: Retrieve user's alerts
 * - POST: Create new alert
 * - PUT: Update alert status
 * - DELETE: Delete alert
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id;

  try {
    switch (req.method) {
      case 'GET':
        return await getAlerts(userId, res);
      
      case 'POST':
        return await createAlert(userId, req.body, res);
      
      case 'PUT':
        return await updateAlert(userId, req.body, res);
      
      case 'DELETE':
        return await deleteAlert(userId, req.body, res);
      
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Alerts API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * Get user's alerts
 */
async function getAlerts(userId: string, res: NextApiResponse) {
  try {
    // Ensure alerts table exists
    await ensureAlertsTable();

    const result = await query(
      `SELECT id, symbol, alert_type, threshold_value, status, created_at, triggered_at, notification_sent
       FROM ucie_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      alerts: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
    });
  }
}

/**
 * Create new alert
 */
async function createAlert(
  userId: string,
  body: {
    symbol: string;
    alert_type: AlertType;
    threshold_value: number;
  },
  res: NextApiResponse
) {
  const { symbol, alert_type, threshold_value } = body;

  // Validation
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  if (!alert_type || !['price_above', 'price_below', 'sentiment_change', 'whale_transaction'].includes(alert_type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid alert type',
    });
  }

  if (threshold_value === undefined || typeof threshold_value !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Threshold value is required',
    });
  }

  const normalizedSymbol = symbol.toUpperCase();

  try {
    // Ensure alerts table exists
    await ensureAlertsTable();

    // Check alert limit (max 50 alerts per user)
    const countResult = await query(
      `SELECT COUNT(*) as count FROM ucie_alerts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const activeAlerts = parseInt(countResult.rows[0].count);
    if (activeAlerts >= 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum alert limit reached (50 active alerts)',
      });
    }

    // Create alert
    const result = await query(
      `INSERT INTO ucie_alerts (user_id, symbol, alert_type, threshold_value, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       RETURNING id, symbol, alert_type, threshold_value, status, created_at`,
      [userId, normalizedSymbol, alert_type, threshold_value]
    );

    return res.status(200).json({
      success: true,
      message: 'Alert created successfully',
      alert: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create alert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create alert',
    });
  }
}

/**
 * Update alert status
 */
async function updateAlert(
  userId: string,
  body: {
    alert_id: number;
    status: AlertStatus;
  },
  res: NextApiResponse
) {
  const { alert_id, status } = body;

  if (!alert_id || typeof alert_id !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Alert ID is required',
    });
  }

  if (!status || !['active', 'triggered', 'disabled'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
    });
  }

  try {
    // Ensure alerts table exists
    await ensureAlertsTable();

    const result = await query(
      `UPDATE ucie_alerts
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, symbol, alert_type, threshold_value, status`,
      [status, alert_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      alert: result.rows[0],
    });
  } catch (error: any) {
    console.error('Update alert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update alert',
    });
  }
}

/**
 * Delete alert
 */
async function deleteAlert(
  userId: string,
  body: { alert_id: number },
  res: NextApiResponse
) {
  const { alert_id } = body;

  if (!alert_id || typeof alert_id !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Alert ID is required',
    });
  }

  try {
    // Ensure alerts table exists
    await ensureAlertsTable();

    const result = await query(
      `DELETE FROM ucie_alerts WHERE id = $1 AND user_id = $2`,
      [alert_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete alert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
    });
  }
}

/**
 * Ensure alerts table exists
 */
async function ensureAlertsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ucie_alerts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        threshold_value DECIMAL(20, 8) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        triggered_at TIMESTAMP,
        notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ucie_alerts_user_id 
      ON ucie_alerts(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ucie_alerts_status 
      ON ucie_alerts(status)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ucie_alerts_symbol 
      ON ucie_alerts(symbol)
    `);
  } catch (error: any) {
    console.error('Ensure alerts table error:', error);
    // Don't throw - table might already exist
  }
}

export default withAuth(handler);
