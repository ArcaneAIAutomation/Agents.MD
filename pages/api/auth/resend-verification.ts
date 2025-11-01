/**
 * Resend Verification Email API Endpoint
 * POST /api/auth/resend-verification
 * 
 * Resends verification email to user
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { generateVerificationToken, hashVerificationToken, getVerificationExpiry, generateVerificationUrl } from '../../../lib/auth/verification';
import { sendEmailAsync } from '../../../lib/email/office365';
import { generateVerificationEmail } from '../../../lib/email/templates/verification';
import { loginRateLimiter, withRateLimit } from '../../../middleware/rateLimit';

interface ResendVerificationRequest {
  email: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

async function handler(
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
    const { email }: ResendVerificationRequest = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Find user by email
    const userResult = await query(
      `SELECT id, email, email_verified, verification_sent_at 
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not (security)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can log in now.'
      });
    }

    // Rate limit: Don't allow resending more than once per 2 minutes
    if (user.verification_sent_at) {
      const lastSent = new Date(user.verification_sent_at);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      
      if (lastSent > twoMinutesAgo) {
        return res.status(429).json({
          success: false,
          message: 'Please wait a few minutes before requesting another verification email.'
        });
      }
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(verificationToken);
    const tokenExpiry = getVerificationExpiry(24);

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
    const verificationEmailHtml = generateVerificationEmail({
      email: user.email,
      verificationUrl,
      expiresInHours: 24
    });

    sendEmailAsync({
      to: user.email,
      subject: 'Verify Your Email - Bitcoin Sovereign Technology',
      body: verificationEmailHtml,
      contentType: 'HTML'
    });

    console.log(`Verification email resent to ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
}

// Export with rate limiting (same as login)
export default withRateLimit(loginRateLimiter, handler);
