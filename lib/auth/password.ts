/**
 * Password Hashing Utilities
 * 
 * Provides secure password hashing and verification using bcrypt.
 * Uses 12 salt rounds as specified in requirements.
 */

import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password using bcrypt with 12 salt rounds
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a plain text password against a hashed password
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 * @throws Error if verification fails
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    
    return isMatch;
  } catch (error) {
    console.error('Password verification failed:', error);
    throw new Error('Failed to verify password');
  }
}
