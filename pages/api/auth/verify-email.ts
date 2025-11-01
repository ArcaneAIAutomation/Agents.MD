/**
 * Email Verification API Endpoint
 * GET /api/auth/verify-email?token=<verification_token>
 * 
 * Verifies user's email address using the token from verification email
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { hashVerificationToken, isTokenExpired } from '../../../lib/auth/verification';
import { logAuthEvent } from '../../../lib/auth/auditLog';

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyEmailResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Get token from query parameter
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Hash the token to match database
    const hashedToken = hashVerificationToken(token);

    // Find user with this verification token
    const userResult = await query(
      `SELECT id, email, email_verified, verification_token_expires 
       FROM users 
       WHERE verification_token = $1`,
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. You can now log in.',
        email: user.email
      });
    }

    // Check if token is expired
    if (isTokenExpired(user.verification_token_expires)) {
      return res.status(410).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.'
      });
    }

    // Mark email as verified and clear verification token
    await query(
      `UPDATE users 
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Log verification event
    logAuthEvent({
      userId: user.id,
      eventType: 'security_alert',
      success: true,
      errorMessage: JSON.stringify({ action: 'email_verified', email: user.email }),
      req
    });

    console.log(`Email verified successfully for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      email: user.email
    });

  } catch (error) {
    console.error('Email verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred during email verification. Please try again later.'
    });
  }
}
