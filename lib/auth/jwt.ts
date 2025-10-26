/**
 * JWT Token Utilities
 * 
 * Provides JWT token generation, verification, and decoding.
 * Uses jsonwebtoken library for secure token management.
 */

import jwt from 'jsonwebtoken';

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Get JWT secret from environment variables
 * @throws Error if JWT_SECRET is not configured
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  return secret;
}

/**
 * Generate a JWT token with user payload and expiration
 * 
 * @param payload - User data to encode in token (userId, email)
 * @param expiresIn - Token expiration time (default: '7d')
 * @returns Signed JWT token string
 * @throws Error if token generation fails
 */
export function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): string {
  try {
    if (!payload.userId || !payload.email) {
      throw new Error('userId and email are required in payload');
    }

    const secret = getJWTSecret();
    
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email
      },
      secret,
      {
        expiresIn,
        algorithm: 'HS256'
      }
    );
    
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error('Failed to generate JWT token');
  }
}

/**
 * Verify a JWT token's signature and expiration
 * 
 * @param token - JWT token string to verify
 * @returns Decoded and verified JWT payload
 * @throws Error if token is invalid, expired, or verification fails
 */
export function verifyToken(token: string): JWTPayload {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    const secret = getJWTSecret();
    
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    
    console.error('Token verification failed:', error);
    throw new Error('Failed to verify token');
  }
}

/**
 * Decode a JWT token without verifying signature
 * Useful for extracting payload when signature verification is not needed
 * 
 * @param token - JWT token string to decode
 * @returns Decoded JWT payload (unverified)
 * @throws Error if token cannot be decoded
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    const decoded = jwt.decode(token) as JWTPayload | null;
    
    return decoded;
  } catch (error) {
    console.error('Token decoding failed:', error);
    throw new Error('Failed to decode token');
  }
}

/**
 * Check if a token is expired without full verification
 * 
 * @param token - JWT token string to check
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
