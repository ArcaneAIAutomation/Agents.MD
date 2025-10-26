/**
 * Current User API Endpoint
 * GET /api/auth/me
 * 
 * Returns the currently authenticated user's data.
 * Requires valid JWT token in httpOnly cookie.
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { queryOne, User } from '../../../lib/db';

/**
 * Response format for current user endpoint
 */
interface MeResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
  message?: string;
}

/**
 * GET /api/auth/me
 * 
 * Returns current authenticated user data
 * 
 * @requires Valid JWT token in httpOnly cookie
 * @returns User data (without password)
 * @throws 401 if token is invalid or expired
 * @throws 404 if user not found in database
 * @throws 500 if server error occurs
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<MeResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }

  try {
    // User data is already attached by withAuth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.'
      });
    }

    const { id: userId } = req.user;

    // Query database for full user data
    const user = await queryOne<User>(
      `SELECT id, email, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    // Check if user exists in database
    if (!user) {
      // User token is valid but user doesn't exist in database
      // This could happen if user was deleted after token was issued
      return res.status(404).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }

    // Return user data (excluding password_hash)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching current user:', error);

    // Check if it's a database error
    if (error instanceof Error && error.message.includes('database')) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
}

// Export handler wrapped with authentication middleware
export default withAuth(handler);
