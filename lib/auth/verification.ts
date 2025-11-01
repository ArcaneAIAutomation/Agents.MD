/**
 * Email Verification Utilities
 * Bitcoin Sovereign Technology
 * 
 * Handles email verification token generation and validation
 */

import crypto from 'crypto';

/**
 * Generate a secure random verification token
 * 
 * @returns Hex-encoded random token (64 characters)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash verification token for database storage
 * 
 * @param token Plain text token
 * @returns Hashed token
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate verification token expiration time
 * 
 * @param hoursFromNow Hours until expiration (default: 24)
 * @returns Expiration timestamp
 */
export function getVerificationExpiry(hoursFromNow: number = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

/**
 * Check if verification token is expired
 * 
 * @param expiresAt Expiration timestamp
 * @returns True if expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Generate verification URL
 * 
 * @param baseUrl Application base URL
 * @param token Verification token
 * @returns Full verification URL
 */
export function generateVerificationUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/verify-email?token=${token}`;
}
