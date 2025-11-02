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
    console.log('🔍 Email verification request received');
    console.log(`   Request method: ${req.method}`);
    console.log(`   Request URL: ${req.url}`);
    
    // Get token from query parameter
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      console.log('❌ No token provided in request');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    console.log(`   Token received: ${token.substring(0, 10)}...`);

    // Hash the token to match database
    const hashedToken = hashVerificationToken(token);
    console.log(`   Token hashed for database lookup`);

    // Find user with this verification token
    console.log('🔍 Looking up user in database...');
    const userResult = await query(
      `SELECT id, email, email_verified, verification_token_expires 
       FROM users 
       WHERE verification_token = $1`,
      [hashedToken]
    );

    console.log(`   Database query returned ${userResult.rows.length} row(s)`);

    if (userResult.rows.length === 0) {
      console.log('❌ No user found with this verification token');
      console.log('   Possible reasons:');
      console.log('   - Token already used (cleared from database)');
      console.log('   - Invalid token');
      console.log('   - Token from different environment');
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token. The link may have already been used or is invalid.'
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

    // Update database
    console.log(`🔄 Updating database for user: ${user.email} (ID: ${user.id})`);
    
    const updateResult = await query(
      `UPDATE users 
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, email_verified`,
      [user.id]
    );

    if (updateResult.rows.length === 0) {
      console.error(`❌ UPDATE returned no rows for user ID: ${user.id}`);
      throw new Error('Failed to update user - no rows returned');
    }

    const updatedUser = updateResult.rows[0];
    console.log(`✅ UPDATE returned: email_verified = ${updatedUser.email_verified}`);
    
    // CRITICAL: Verify the update actually persisted
    const verifyCheck = await query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [user.id]
    );
    
    if (verifyCheck.rows.length === 0) {
      console.error(`❌ CRITICAL: User ${user.id} disappeared after UPDATE!`);
      throw new Error('User not found after update');
    }
    
    const verifiedUser = verifyCheck.rows[0];
    console.log(`🔍 Verification check: email_verified = ${verifiedUser.email_verified}`);
    
    if (verifiedUser.email_verified !== true) {
      console.error(`❌ CRITICAL: UPDATE did not persist! Expected true, got ${verifiedUser.email_verified}`);
      console.error(`   User ID: ${user.id}`);
      console.error(`   Email: ${user.email}`);
      console.error(`   Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]}`);
      throw new Error('Email verification update did not persist in database');
    }
    
    console.log(`✅ Verification confirmed: ${verifiedUser.email} is now verified`);

    // Log verification event
    logAuthEvent({
      userId: user.id,
      eventType: 'security_alert',
      success: true,
      errorMessage: JSON.stringify({ action: 'email_verified', email: user.email }),
      req
    });

    console.log(`✅ Email verified successfully for user: ${user.email}`);

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
