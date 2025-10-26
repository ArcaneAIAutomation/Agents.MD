/**
 * Registration API Endpoint
 * POST /api/auth/register
 * 
 * Creates a new user account with access code redemption.
 * Implements rate limiting, input validation, and comprehensive error handling.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { registrationRateLimiter, withRateLimit } from '../../../middleware/rateLimit';
import { validateRegistration, formatValidationErrors } from '../../../lib/validation/auth';
import { hashPassword } from '../../../lib/auth/password';
import { generateToken } from '../../../lib/auth/jwt';
import { logRegistration, logFailedRegistration } from '../../../lib/auth/auditLog';
import { normalizeEmail, normalizeAccessCode } from '../../../lib/db';
import { sendEmailAsync } from '../../../lib/email/office365';
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
    const codeResult = await sql`
      SELECT id, code, redeemed, redeemed_by, redeemed_at
      FROM access_codes
      WHERE code = ${normalizedCode}
    `;

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
    const emailResult = await sql`
      SELECT id, email
      FROM users
      WHERE email = ${normalizedEmail}
    `;

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
    const userResult = await sql`
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES (${normalizedEmail}, ${passwordHash}, NOW(), NOW())
      RETURNING id, email, created_at
    `;

    const newUser = userResult.rows[0];

    // Mark access code as redeemed
    await sql`
      UPDATE access_codes
      SET 
        redeemed = true,
        redeemed_by = ${newUser.id},
        redeemed_at = NOW()
      WHERE id = ${accessCodeRecord.id}
    `;

    // ========================================================================
    // SUBTASK 3.4: Generate JWT and set cookie
    // ========================================================================
    
    // Generate JWT token with 7-day expiration
    const token = generateToken(
      {
        userId: newUser.id,
        email: newUser.email
      },
      '7d'
    );

    // Set httpOnly, secure, sameSite cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`
    ]);

    // ========================================================================
    // SUBTASK 3.5: Log registration event and return response
    // ========================================================================
    
    // Log successful registration (non-blocking)
    logRegistration(newUser.id, newUser.email, req);

    // ========================================================================
    // TASK 12.2: Send welcome email (non-blocking)
    // ========================================================================
    
    // Send welcome email asynchronously (doesn't block registration)
    try {
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
      const welcomeEmailHtml = generateWelcomeEmail({
        email: newUser.email,
        platformUrl
      });

      // Send email without waiting for result
      sendEmailAsync({
        to: newUser.email,
        subject: 'Welcome to Bitcoin Sovereign Technology',
        body: welcomeEmailHtml,
        contentType: 'HTML'
      });

      console.log(`Welcome email queued for ${newUser.email}`);
    } catch (emailError) {
      // Log error but don't block registration
      console.error('Failed to queue welcome email:', emailError);
    }

    // Return success response with user data (no password)
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.created_at
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
