/**
 * Request Password Reset API Endpoint
 * POST /api/auth/request-password-reset
 * 
 * Sends a password reset email to the user if the email exists.
 * Always returns success to prevent email enumeration attacks.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withRateLimit, loginRateLimiter } from '../../../middleware/rateLimit';
import { generateResetToken, hashResetToken, getResetTokenExpiry, generateResetUrl } from '../../../lib/auth/passwordReset';
import { generatePasswordResetEmail, generatePasswordResetEmailText } from '../../../lib/email/templates/passwordReset';
import { sendEmail } from '../../../lib/email/office365';

interface RequestResetRequest {
  email: string;
}

interface RequestResetResponse {
  success: boolean;
  message: string;
}

/**
 * Main request password reset handler
 */
async function requestPasswordResetHandler(
  req: NextApiRequest,
  res: NextApiResponse<RequestResetResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { email } = req.body as RequestResetRequest;

    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ========================================================================
    // STEP 1: Check if user exists
    // ========================================================================
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    // SECURITY: Always return success to prevent email enumeration
    // Don't reveal whether the email exists or not
    if (userResult.rows.length === 0) {
      console.log(`[Password Reset] Email not found: ${normalizedEmail}`);
      
      // Return success anyway (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      });
    }

    const user = userResult.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      console.log(`[Password Reset] Email not verified: ${normalizedEmail}`);
      
      // Return success anyway (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      });
    }

    // ========================================================================
    // STEP 2: Generate reset token
    // ========================================================================
    const resetToken = generateResetToken();
    const tokenHash = hashResetToken(resetToken);
    const expiresAt = getResetTokenExpiry(1); // 1 hour expiration

    // ========================================================================
    // STEP 3: Store token in database
    // ========================================================================
    await query(
      `INSERT INTO password_reset_tokens 
       (user_id, token_hash, expires_at, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokenHash,
        expiresAt.toISOString(),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown'
      ]
    );

    // ========================================================================
    // STEP 4: Generate reset URL
    // ========================================================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
    const resetUrl = generateResetUrl(appUrl, resetToken);

    // ========================================================================
    // STEP 5: Send password reset email
    // ========================================================================
    const emailHtml = generatePasswordResetEmail({
      email: user.email,
      resetUrl,
      expiresInHours: 1,
      platformUrl: appUrl
    });

    const emailText = generatePasswordResetEmailText({
      email: user.email,
      resetUrl,
      expiresInHours: 1,
      platformUrl: appUrl
    });

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset Your Password - Bitcoin Sovereign Technology',
      body: emailHtml,
      contentType: 'HTML'
    });

    if (!emailResult.success) {
      console.error('[Password Reset] Failed to send email:', emailResult.error);
      
      // Delete the token since email failed
      await query(
        'DELETE FROM password_reset_tokens WHERE token_hash = $1',
        [tokenHash]
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    console.log(`[Password Reset] Email sent successfully to: ${normalizedEmail}`);

    // ========================================================================
    // STEP 6: Return success response
    // ========================================================================
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    });

  } catch (error) {
    console.error('[Password Reset] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
}

/**
 * Export handler with rate limiting middleware
 * 5 attempts per email per 15 minutes (same as login)
 */
export default withRateLimit(loginRateLimiter, requestPasswordResetHandler);
