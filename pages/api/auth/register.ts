/**
 * Registration API Endpoint
 * POST /api/auth/register
 * 
 * Creates a new user account with access code redemption.
 * Implements rate limiting, input validation, and comprehensive error handling.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { registrationRateLimiter, withRateLimit } from '../../../middleware/rateLimit';
import { validateRegistration, formatValidationErrors } from '../../../lib/validation/auth';
import { hashPassword } from '../../../lib/auth/password';
import { generateToken } from '../../../lib/auth/jwt';
import { logRegistration, logFailedRegistration } from '../../../lib/auth/auditLog';
import { normalizeEmail, normalizeAccessCode } from '../../../lib/db';
import { sendEmail } from '../../../lib/email/office365';
import { generateWelcomeEmail } from '../../../lib/email/templates/welcome';

/**
 * Registration request body
 */
interface RegisterRequest {
  accessCode: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Registration response
 */
interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
}

/**
 * Main registration handler
 */
async function registerHandler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
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
    const validation = validateRegistration(req.body);
    
    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      const firstError = Object.values(errors)[0] || 'Invalid input data';
      
      return res.status(400).json({
        success: false,
        message: firstError
      });
    }

    const { accessCode, email, password } = validation.data;
    
    // Normalize inputs
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeAccessCode(accessCode);

    // ========================================================================
    // SUBTASK 3.1: Verify access code exists and is not redeemed
    // ========================================================================
    const codeResult = await query(
      'SELECT id, code, redeemed, redeemed_by, redeemed_at FROM access_codes WHERE code = $1',
      [normalizedCode]
    );

    // Check if code exists
    if (codeResult.rows.length === 0) {
      logFailedRegistration(normalizedEmail, 'Invalid access code', req);
      return res.status(404).json({
        success: false,
        message: 'Invalid access code'
      });
    }

    const accessCodeRecord = codeResult.rows[0];

    // Check if code is already redeemed
    if (accessCodeRecord.redeemed) {
      logFailedRegistration(normalizedEmail, 'Access code already used', req);
      return res.status(410).json({
        success: false,
        message: 'This access code has already been used'
      });
    }

    // ========================================================================
    // SUBTASK 3.2: Check email uniqueness
    // ========================================================================
    const emailResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (emailResult.rows.length > 0) {
      logFailedRegistration(normalizedEmail, 'Email already exists', req);
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // ========================================================================
    // SUBTASK 3.3: Create user account
    // ========================================================================
    
    // Hash password with bcrypt (12 salt rounds)
    const passwordHash = await hashPassword(password);

    // Insert new user record
    const userResult = await query(
      'INSERT INTO users (email, password_hash, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, email, created_at',
      [normalizedEmail, passwordHash]
    );

    const newUser = userResult.rows[0];

    // Mark access code as redeemed
    await query(
      'UPDATE access_codes SET redeemed = true, redeemed_by = $1, redeemed_at = NOW() WHERE id = $2',
      [newUser.id, accessCodeRecord.id]
    );

    // ========================================================================
    // SUBTASK 3.4: Generate verification token and send email
    // ========================================================================
    
    // Generate verification token
    const { generateVerificationToken, hashVerificationToken, getVerificationExpiry, generateVerificationUrl } = await import('../../../lib/auth/verification');
    const verificationToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(verificationToken);
    const tokenExpiry = getVerificationExpiry(24); // 24 hours

    // Update user with verification token
    await query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2, verification_sent_at = NOW() WHERE id = $3',
      [hashedToken, tokenExpiry.toISOString(), newUser.id]
    );

    // Generate verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
    const verificationUrl = generateVerificationUrl(appUrl, verificationToken);

    // ========================================================================
    // SUBTASK 3.5: Send verification email
    // ========================================================================
    
    // Send verification email asynchronously
    try {
      const { generateVerificationEmail } = await import('../../../lib/email/templates/verification');
      const verificationEmailHtml = generateVerificationEmail({
        email: newUser.email,
        verificationUrl,
        expiresInHours: 24
      });

      // Send email and log result
      console.log(`📧 Attempting to send verification email to: ${newUser.email}`);
      console.log(`📧 Verification URL: ${verificationUrl}`);
      console.log(`📧 Sender: ${process.env.SENDER_EMAIL}`);
      
      const emailResult = await sendEmail({
        to: newUser.email,
        subject: 'Verify Your Email - Bitcoin Sovereign Technology',
        body: verificationEmailHtml,
        contentType: 'HTML'
      });

      if (emailResult.success) {
        console.log(`✅ Verification email sent successfully to ${newUser.email}`);
      } else {
        console.error(`❌ Failed to send verification email to ${newUser.email}:`, emailResult.error);
        // Log to database for monitoring
        await query(
          `INSERT INTO auth_logs (user_id, event_type, success, error_message, timestamp)
           VALUES ($1, $2, $3, $4, NOW())`,
          [newUser.id, 'security_alert', false, `Email send failed: ${emailResult.error}`]
        );
      }
    } catch (emailError) {
      // Log error but don't block registration
      console.error('❌ Exception sending verification email:', emailError);
    }

    // Log successful registration (non-blocking)
    logRegistration(newUser.id, newUser.email, req);

    // Return success response WITHOUT auto-login (user must verify email first)
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.created_at,
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Log failed registration
    const email = req.body?.email;
    if (email) {
      logFailedRegistration(
        email,
        error instanceof Error ? error.message : 'Unknown error',
        req
      );
    }

    // Return generic error message (don't reveal system internals)
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again later.'
    });
  }
}

/**
 * Export handler with rate limiting middleware
 * 5 attempts per IP per 15 minutes
 */
export default withRateLimit(registrationRateLimiter, registerHandler);
