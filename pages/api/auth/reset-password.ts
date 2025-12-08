/**
 * Reset Password API Endpoint
 * POST /api/auth/reset-password
 * 
 * Resets user password using a valid reset token.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth/password';
import { hashResetToken, isValidResetTokenFormat } from '../../../lib/auth/passwordReset';
import { withRateLimit, loginRateLimiter } from '../../../middleware/rateLimit';

interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  return { valid: true };
}

/**
 * Main reset password handler
 */
async function resetPasswordHandler(
  req: NextApiRequest,
  res: NextApiResponse<ResetPasswordResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { token, password, confirmPassword } = req.body as ResetPasswordRequest;

    // ========================================================================
    // STEP 1: Validate input
    // ========================================================================
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate token format
    if (!isValidResetTokenFormat(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token format'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message || 'Invalid password'
      });
    }

    // ========================================================================
    // STEP 2: Verify reset token
    // ========================================================================
    const tokenHash = hashResetToken(token);

    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token_hash = $1 
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetTokenRecord = tokenResult.rows[0];

    // Check if token has already been used
    if (resetTokenRecord.used) {
      return res.status(400).json({
        success: false,
        message: 'This reset token has already been used'
      });
    }

    // Check if token has expired
    const expiresAt = new Date(resetTokenRecord.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This reset token has expired. Please request a new one.'
      });
    }

    // ========================================================================
    // STEP 3: Hash new password
    // ========================================================================
    const passwordHash = await hashPassword(password);

    // ========================================================================
    // STEP 4: Update user password
    // ========================================================================
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, resetTokenRecord.user_id]
    );

    // ========================================================================
    // STEP 5: Mark token as used
    // ========================================================================
    await query(
      'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
      [resetTokenRecord.id]
    );

    // ========================================================================
    // STEP 6: Invalidate all existing sessions for this user
    // ========================================================================
    await query(
      'DELETE FROM sessions WHERE user_id = $1',
      [resetTokenRecord.user_id]
    );

    console.log(`[Password Reset] Password successfully reset for user: ${resetTokenRecord.user_id}`);

    // ========================================================================
    // STEP 7: Return success response
    // ========================================================================
    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('[Password Reset] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again later.'
    });
  }
}

/**
 * Export handler with rate limiting middleware
 * 5 attempts per 15 minutes
 */
export default withRateLimit(loginRateLimiter, resetPasswordHandler);
