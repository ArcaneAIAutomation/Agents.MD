/**
 * Login API Endpoint
 * POST /api/auth/login
 * 
 * Authenticates a user with email and password credentials.
 * Creates a session and returns a JWT token in an httpOnly cookie.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.4, 8.1, 9.2, 9.4, 9.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { validateLogin } from '../../../lib/validation/auth';
import { verifyPassword } from '../../../lib/auth/password';
import { generateToken } from '../../../lib/auth/jwt';
import { withRateLimit, loginRateLimiter } from '../../../middleware/rateLimit';
import { logLogin, logFailedLogin } from '../../../lib/auth/auditLog';
import crypto from 'crypto';

/**
 * Login request body interface
 */
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response interface
 */
interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Hash token for session storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Main login handler
 */
async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // ========================================================================
    // STEP 1: Validate request body with Zod schema
    // ========================================================================
    const validation = validateLogin(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }

    const { email, password, rememberMe } = validation.data;

    // ========================================================================
    // STEP 2: Query user by email (Subtask 4.1)
    // ========================================================================
    const userResult = await query(
      'SELECT id, email, password_hash, email_verified, created_at FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    // Return generic 401 error if user not found (don't reveal which field is wrong)
    if (userResult.rows.length === 0) {
      logFailedLogin(email, 'User not found', req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      logFailedLogin(email, 'Email not verified', req);
      
      // AUTO-RESEND VERIFICATION EMAIL
      try {
        console.log(`🔄 Auto-resending verification email to unverified user: ${user.email}`);
        
        // Import verification utilities
        const { generateVerificationToken, hashVerificationToken, getVerificationExpiry, generateVerificationUrl } = await import('../../../lib/auth/verification');
        const { generateWelcomeEmail } = await import('../../../lib/email/templates/welcome');
        
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
        const welcomeEmailHtml = generateWelcomeEmail({
          email: user.email,
          platformUrl: appUrl,
          verificationUrl,
          expiresInHours: 24
        });
        
        const { sendEmail } = await import('../../../lib/email/office365');
        const emailResult = await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - Bitcoin Sovereign Technology',
          body: welcomeEmailHtml,
          contentType: 'HTML'
        });
        
        if (emailResult.success) {
          console.log(`✅ Auto-resent verification email to ${user.email}`);
        } else {
          console.error(`❌ Failed to auto-resend verification email:`, emailResult.error);
        }
      } catch (autoResendError) {
        console.error('❌ Exception auto-resending verification email:', autoResendError);
      }
      
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. We just sent you a new verification email - check your inbox!',
        requiresVerification: true,
        email: user.email,
        verificationEmailSent: true
      });
    }

    // ========================================================================
    // STEP 3: Compare password with bcrypt (Subtask 4.1)
    // ========================================================================
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    // Return generic 401 error if password incorrect
    if (!isPasswordValid) {
      logFailedLogin(email, 'Invalid password', req);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ========================================================================
    // STEP 4: Generate JWT token (Subtask 4.2)
    // ========================================================================
    // 7 days for normal login, 30 days if rememberMe is checked
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = generateToken(
      {
        userId: user.id,
        email: user.email
      },
      expiresIn
    );

    // ========================================================================
    // STEP 5: Hash token for session storage (Subtask 4.2)
    // ========================================================================
    const tokenHash = hashToken(token);

    // Calculate expiration date
    const expirationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationMs);

    // ========================================================================
    // STEP 6: Insert session record into sessions table (Subtask 4.2)
    // ========================================================================
    await query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt.toISOString()]
    );

    // ========================================================================
    // STEP 7: Set httpOnly, secure, sameSite cookie (Subtask 4.2)
    // ========================================================================
    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // seconds

    res.setHeader('Set-Cookie', [
      `auth_token=${token}; HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/; Max-Age=${maxAge}`
    ]);

    // ========================================================================
    // STEP 8: Log successful login event (Subtask 4.3)
    // ========================================================================
    logLogin(user.id, req);

    // ========================================================================
    // STEP 9: Return success response with user data (Subtask 4.3)
    // ========================================================================
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    // Log failed attempt for unexpected errors
    if (req.body?.email) {
      logFailedLogin(req.body.email, 'Server error', req);
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
}

/**
 * Export handler with rate limiting middleware
 * 5 attempts per email per 15 minutes
 */
export default withRateLimit(loginRateLimiter, loginHandler);
