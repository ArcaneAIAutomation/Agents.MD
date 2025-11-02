/**
 * Resend Verification Email API Endpoint
 * POST /api/auth/resend-verification
 * 
 * Sends a new verification email to users who haven't verified their email
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { generateVerificationToken, hashVerificationToken, getVerificationExpiry, generateVerificationUrl } from '../../../lib/auth/verification';
import { sendEmail } from '../../../lib/email/office365';
import { generateWelcomeEmail } from '../../../lib/email/templates/welcome';
import { withRateLimit, loginRateLimiter } from '../../../middleware/rateLimit';
import { normalizeEmail } from '../../../lib/db';

interface ResendVerificationRequest {
  email: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

async function resendVerificationHandler(
  req: NextApiRequest,
  res: NextApiResponse<ResendVerificationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { email } = req.body as ResendVerificationRequest;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Find user by email
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Don't reveal if user exists or not (security)
    if (userResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'This email is already verified. You can log in now.'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(verificationToken);
    const tokenExpiry = getVerificationExpiry(24); // 24 hours

    // Update user with new verification token
    await query(
      `UPDATE users 
       SET verification_token = $1,
           verification_token_expires = $2,
           verification_sent_at = NOW()
       WHERE id = $3`,
      [hashedToken, tokenExpiry.toISOString(), user.id]
    );

    // Generate verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
    const verificationUrl = generateVerificationUrl(appUrl, verificationToken);

    // Send verification email
    try {
      const welcomeEmailHtml = generateWelcomeEmail({
        email: user.email,
        platformUrl: appUrl,
        verificationUrl,
        expiresInHours: 24
      });

      console.log(`📧 Resending verification email to: ${user.email}`);
      console.log(`📧 Verification URL: ${verificationUrl}`);

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - Bitcoin Sovereign Technology',
        body: welcomeEmailHtml,
        contentType: 'HTML'
      });

      if (emailResult.success) {
        console.log(`✅ Verification email resent successfully to ${user.email}`);
      } else {
        console.error(`❌ Failed to resend verification email to ${user.email}:`, emailResult.error);
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    } catch (emailError) {
      console.error('❌ Exception resending verification email:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
}

/**
 * Export handler with rate limiting middleware
 * 5 attempts per email per 15 minutes (same as login)
 */
export default withRateLimit(loginRateLimiter, resendVerificationHandler);
