/**
 * Admin Access Codes API Endpoint
 * GET /api/admin/access-codes
 * 
 * Returns all access codes with their redemption status.
 * Requires valid JWT token in httpOnly cookie.
 * 
 * Future Enhancement: Add admin role check
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { queryMany, AccessCode } from '../../../lib/db';

/**
 * Access code with user email for response
 */
interface AccessCodeWithUser {
  id: string;
  code: string;
  redeemed: boolean;
  redeemedBy: string | null;
  redeemedByEmail: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

/**
 * Response format for access codes endpoint
 */
interface AccessCodesResponse {
  success: boolean;
  codes?: AccessCodeWithUser[];
  message?: string;
  total?: number;
}

/**
 * GET /api/admin/access-codes
 * 
 * Returns all access codes with redemption status
 * 
 * @requires Valid JWT token in httpOnly cookie
 * @returns List of access codes with redemption details
 * @throws 401 if token is invalid or expired
 * @throws 500 if server error occurs
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<AccessCodesResponse>
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

    // TODO: Future Enhancement - Add admin role check
    // For now, any authenticated user can view access codes
    // In production, add: if (!req.user.isAdmin) { return 403 }

    // Query all access codes with user email (if redeemed)
    const codes = await queryMany<any>(
      `SELECT 
        ac.id,
        ac.code,
        ac.redeemed,
        ac.redeemed_by,
        ac.redeemed_at,
        ac.created_at,
        u.email as redeemed_by_email
       FROM access_codes ac
       LEFT JOIN users u ON ac.redeemed_by = u.id
       ORDER BY ac.created_at DESC`
    );

    // Format response data
    const formattedCodes: AccessCodeWithUser[] = codes.map(code => ({
      id: code.id,
      code: code.code,
      redeemed: code.redeemed,
      redeemedBy: code.redeemed_by,
      redeemedByEmail: code.redeemed_by_email,
      redeemedAt: code.redeemed_at ? new Date(code.redeemed_at).toISOString() : null,
      createdAt: new Date(code.created_at).toISOString()
    }));

    // Return access codes list
    return res.status(200).json({
      success: true,
      codes: formattedCodes,
      total: formattedCodes.length
    });

  } catch (error) {
    console.error('Error fetching access codes:', error);

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
