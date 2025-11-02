/**
 * Logout API Endpoint
 * POST /api/auth/logout
 * 
 * Invalidates the user's session by deleting the session record from the database
 * and clearing the httpOnly authentication cookie.
 * 
 * Requirements: 4.3, 8.3
 */

import type { NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { logLogout } from '../../../lib/auth/auditLog';
import crypto from 'crypto';

/**
 * Logout response interface
 */
interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Hash token for session lookup
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Main logout handler
 * Wrapped with authentication middleware to verify token
 */
async function logoutHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<LogoutResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // User is guaranteed to exist because of withAuth middleware
    const userId = req.user!.id;

    // ========================================================================
    // STEP 1: Extract token from cookie (Subtask 5.1)
    // ========================================================================
    const token = req.cookies.auth_token;

    if (!token) {
      // This shouldn't happen because withAuth checks for token
      // But handle it gracefully just in case
      return res.status(401).json({
        success: false,
        message: 'No authentication token found'
      });
    }

    // ========================================================================
    // STEP 2: Delete session record from sessions table (Subtask 5.1)
    // ========================================================================
    const tokenHash = hashToken(token);

    const deleteResult = await query(
      'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2',
      [userId, tokenHash]
    );

    // Log if session wasn't found (might have already expired)
    if (deleteResult.rowCount === 0) {
      console.warn(`No session found for user ${userId} with token hash ${tokenHash}`);
    }

    // ========================================================================
    // STEP 3: Clear httpOnly cookie and clear client-side state (Subtask 5.1)
    // ========================================================================
    const isProduction = process.env.NODE_ENV === 'production';

    // Clear the cookie immediately
    res.setHeader('Set-Cookie', [
      `auth_token=; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=0`,
      // Also set an expired cookie to ensure it's removed
      `auth_token=deleted; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    ]);

    // ========================================================================
    // STEP 4: Log logout event to auth_logs table (Subtask 5.1)
    // ========================================================================
    logLogout(userId, req);

    // ========================================================================
    // STEP 5: Return success response (Subtask 5.1)
    // ========================================================================
    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, we should still clear the cookie
    // to ensure the user is logged out on the client side
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `auth_token=; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=0`
    ]);

    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout. Your session has been cleared.'
    });
  }
}

/**
 * Export handler with authentication middleware
 * Requires valid JWT token to logout
 */
export default withAuth(logoutHandler);
