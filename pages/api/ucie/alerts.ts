/**
 * UCIE Alerts API
 * Manages custom price and event alerts
 * 
 * Endpoints:
 * - GET: Get user's alerts
 * - POST: Create new alert
 * - PATCH: Update alert
 * - DELETE: Delete alert
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import {
  getUserAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  type Alert,
} from '../../../lib/ucie/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id.toString();

  try {
    switch (req.method) {
      case 'GET':
        // Get user's alerts
        const alerts = await getUserAlerts(userId);
        return res.status(200).json({
          success: true,
          alerts,
          count: alerts.length,
        });

      case 'POST':
        // Create new alert
        const { symbol, alertType, threshold } = req.body;

        if (!symbol || typeof symbol !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Symbol is required',
          });
        }

        if (!alertType || !['price_above', 'price_below', 'sentiment_change', 'whale_tx'].includes(alertType)) {
          return res.status(400).json({
            success: false,
            error: 'Valid alertType is required (price_above, price_below, sentiment_change, whale_tx)',
          });
        }

        // Validate threshold for price alerts
        if ((alertType === 'price_above' || alertType === 'price_below') && !threshold) {
          return res.status(400).json({
            success: false,
            error: 'Threshold is required for price alerts',
          });
        }

        const alert = await createAlert(
          userId,
          symbol,
          alertType as Alert['alert_type'],
          threshold
        );

        return res.status(201).json({
          success: true,
          message: 'Alert created successfully',
          alert,
        });

      case 'PATCH':
        // Update alert
        const { alertId, ...updates } = req.body;

        if (!alertId || typeof alertId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'alertId is required',
          });
        }

        const updated = await updateAlert(alertId, userId, updates);

        if (!updated) {
          return res.status(404).json({
            success: false,
            error: 'Alert not found or no changes made',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Alert updated successfully',
          alert: updated,
        });

      case 'DELETE':
        // Delete alert
        const { alertId: deleteId } = req.query;

        if (!deleteId || typeof deleteId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'alertId is required',
          });
        }

        const deleted = await deleteAlert(deleteId, userId);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'Alert not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Alert deleted successfully',
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[UCIE Alerts API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
