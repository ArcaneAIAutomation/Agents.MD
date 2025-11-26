/**
 * Einstein 100000x Trade Generation Engine - Real-Time P/L API
 * 
 * API endpoint for managing real-time P/L updates and retrieving current P/L data.
 * 
 * Requirements: 14.3, 17.2
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { realTimePLUpdater } from '../../../lib/einstein/execution';

/**
 * API Response Types
 */
interface PLUpdateResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Real-Time P/L API Handler
 * 
 * Supports the following operations:
 * - GET: Get current P/L for all executed trades
 * - POST: Start/stop real-time updates or trigger manual update
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PLUpdateResponse>
) {
  try {
    // Handle GET request - Get current P/L data
    if (req.method === 'GET') {
      return await handleGetPL(req, res);
    }

    // Handle POST request - Control real-time updates
    if (req.method === 'POST') {
      return await handleControlUpdates(req, res);
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('❌ Real-time P/L API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Handle GET request - Get current P/L data
 */
async function handleGetPL(
  req: NextApiRequest,
  res: NextApiResponse<PLUpdateResponse>
): Promise<void> {
  try {
    // Trigger immediate update
    const results = await realTimePLUpdater.updateAllTrades();

    // Get statistics
    const stats = realTimePLUpdater.getStatistics();

    return res.status(200).json({
      success: true,
      data: {
        trades: results,
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Failed to get P/L data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get P/L data'
    });
  }
}

/**
 * Handle POST request - Control real-time updates
 */
async function handleControlUpdates(
  req: NextApiRequest,
  res: NextApiResponse<PLUpdateResponse>
): Promise<void> {
  const { action, config } = req.body;

  try {
    switch (action) {
      case 'start':
        // Start real-time updates
        realTimePLUpdater.start();
        return res.status(200).json({
          success: true,
          message: 'Real-time P/L updates started',
          data: {
            config: realTimePLUpdater.getConfig(),
            statistics: realTimePLUpdater.getStatistics()
          }
        });

      case 'stop':
        // Stop real-time updates
        realTimePLUpdater.stop();
        return res.status(200).json({
          success: true,
          message: 'Real-time P/L updates stopped',
          data: {
            statistics: realTimePLUpdater.getStatistics()
          }
        });

      case 'update':
        // Trigger manual update
        const results = await realTimePLUpdater.updateAllTrades();
        return res.status(200).json({
          success: true,
          message: 'Manual P/L update completed',
          data: {
            trades: results,
            statistics: realTimePLUpdater.getStatistics()
          }
        });

      case 'configure':
        // Update configuration
        if (config) {
          realTimePLUpdater.updateConfig(config);
          return res.status(200).json({
            success: true,
            message: 'Configuration updated',
            data: {
              config: realTimePLUpdater.getConfig()
            }
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Configuration object required'
        });

      case 'status':
        // Get current status
        return res.status(200).json({
          success: true,
          data: {
            config: realTimePLUpdater.getConfig(),
            statistics: realTimePLUpdater.getStatistics()
          }
        });

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Valid actions: start, stop, update, configure, status`
        });
    }
  } catch (error) {
    console.error('❌ Failed to control updates:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to control updates'
    });
  }
}
