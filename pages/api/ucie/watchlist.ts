/**
 * UCIE Watchlist API
 * Manages user token watchlists
 * 
 * Endpoints:
 * - GET: Get user's watchlist
 * - POST: Add token to watchlist
 * - DELETE: Remove token from watchlist
 */

import type { NextApiRequest, NextApiResponse} from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '../../../lib/ucie/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id.toString();

  try {
    switch (req.method) {
      case 'GET':
        // Get user's watchlist
        const watchlist = await getUserWatchlist(userId);
        return res.status(200).json({
          success: true,
          watchlist,
          count: watchlist.length,
        });

      case 'POST':
        // Add to watchlist
        const { symbol } = req.body;
        
        if (!symbol || typeof symbol !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Symbol is required',
          });
        }

        // Check if already in watchlist
        const exists = await isInWatchlist(userId, symbol);
        if (exists) {
          return res.status(200).json({
            success: true,
            message: 'Token already in watchlist',
            symbol: symbol.toUpperCase(),
          });
        }

        const item = await addToWatchlist(userId, symbol);
        return res.status(201).json({
          success: true,
          message: 'Token added to watchlist',
          item,
        });

      case 'DELETE':
        // Remove from watchlist
        const { symbol: removeSymbol } = req.query;
        
        if (!removeSymbol || typeof removeSymbol !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Symbol is required',
          });
        }

        const removed = await removeFromWatchlist(userId, removeSymbol);
        
        if (!removed) {
          return res.status(404).json({
            success: false,
            error: 'Token not found in watchlist',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Token removed from watchlist',
          symbol: removeSymbol.toUpperCase(),
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[UCIE Watchlist API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
