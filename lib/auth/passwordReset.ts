/**
 * Password Reset Utilities
 * 
 * Provides utilities for generating and verifying password reset tokens.
 */

import crypto from 'crypto';

/**
 * Generate a secure random password reset token
 * 
 * @returns 32-byte random token as hex string (64 characters)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a password reset token for database storage
 * Uses SHA-256 for one-way hashing
 * 
 * @param token - Plain text reset token
 * @returns SHA-256 hash of the token
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Get expiration time for password reset token
 * Default: 1 hour from now
 * 
 * @param hours - Number of hours until expiration (default: 1)
 * @returns Date object representing expiration time
 */
export function getResetTokenExpiry(hours: number = 1): Date {
  const expiryMs = hours * 60 * 60 * 1000; // Convert hours to milliseconds
  return new Date(Date.now() + expiryMs);
}

/**
 * Generate a password reset URL
 * 
 * @param baseUrl - Base URL of the application (e.g., https://news.arcane.group)
 * @param token - Plain text reset token
 * @returns Full password reset URL
 */
export function generateResetUrl(baseUrl: string, token: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/auth/reset-password?token=${token}`;
}

/**
 * Validate reset token format
 * 
 * @param token - Token to validate
 * @returns true if token format is valid, false otherwise
 */
export function isValidResetTokenFormat(token: string): boolean {
  // Token should be 64 hex characters (32 bytes)
  return /^[a-f0-9]{64}$/i.test(token);
}
