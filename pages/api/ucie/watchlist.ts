import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

/**
 * Watchlist API
 * 
 * Manages user's cryptocurrency watchlist
 * - GET: Retrieve user's watchlist
 * - POST: Add token to watchlist
 * - DELETE: Remove token from watchlist
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id;

  try {
    switch (req.method) {
      case 'GET':
        return await getWatchlist(userId, res);
      
      case 'POST':
        return await addToWatchlist(userId, req.body, res);
      
      case 'DELETE':
        return await removeFromWatchlist(userId, req.body, res);
      
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Watchlist API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * Get user's watchlist
 */
async function getWatchlist(userId: string, res: NextApiResponse) {
  try {
    // Ensure watchlist table exists
    await ensureWatchlistTable();

    const result = await query(
      `SELECT symbol, added_at, notes
       FROM ucie_watchlist
       WHERE user_id = $1
       ORDER BY added_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      watchlist: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Get watchlist error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve watchlist',
    });
  }
}

/**
 * Add token to watchlist
 */
async function addToWatchlist(
  userId: string,
  body: { symbol: string; notes?: string },
  res: NextApiResponse
) {
  const { symbol, notes } = body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  const normalizedSymbol = symbol.toUpperCase();

  try {
    // Ensure watchlist table exists
    await ensureWatchlistTable();

    // Check if already in watchlist
    const existing = await query(
      `SELECT id FROM ucie_watchlist WHERE user_id = $1 AND symbol = $2`,
      [userId, normalizedSymbol]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Token already in watchlist',
      });
    }

    // Add to watchlist
    await query(
      `INSERT INTO ucie_watchlist (user_id, symbol, notes, added_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, normalizedSymbol, notes || null]
    );

    return res.status(200).json({
      success: true,
      message: `${normalizedSymbol} added to watchlist`,
    });
  } catch (error: any) {
    console.error('Add to watchlist error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add to watchlist',
    });
  }
}

/**
 * Remove token from watchlist
 */
async function removeFromWatchlist(
  userId: string,
  body: { symbol: string },
  res: NextApiResponse
) {
  const { symbol } = body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  const normalizedSymbol = symbol.toUpperCase();

  try {
    // Ensure watchlist table exists
    await ensureWatchlistTable();

    const result = await query(
      `DELETE FROM ucie_watchlist WHERE user_id = $1 AND symbol = $2`,
      [userId, normalizedSymbol]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found in watchlist',
      });
    }

    return res.status(200).json({
      success: true,
      message: `${normalizedSymbol} removed from watchlist`,
    });
  } catch (error: any) {
    console.error('Remove from watchlist error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove from watchlist',
    });
  }
}

/**
 * Ensure watchlist table exists
 */
async function ensureWatchlistTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ucie_watchlist (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        notes TEXT,
        added_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, symbol),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_user_id 
      ON ucie_watchlist(user_id)
    `);
  } catch (error: any) {
    console.error('Ensure watchlist table error:', error);
    // Don't throw - table might already exist
  }
}

export default withAuth(handler);
