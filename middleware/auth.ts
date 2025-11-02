/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens from httpOnly cookies and attaches user data to request.
 * Returns 401 for invalid or missing tokens.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, JWTPayload } from '../lib/auth/jwt';

/**
 * Extended Next.js API Request with user data
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Type for Next.js API handler function
 */
export type NextApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Authentication middleware that verifies JWT token from httpOnly cookie
 * 
 * @param handler - Next.js API route handler to wrap with authentication
 * @returns Wrapped handler with authentication check
 */
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Extract token from httpOnly cookie
      const token = req.cookies.auth_token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated. Please log in.'
        });
      }

      // Verify token signature and expiration
      let decoded: JWTPayload;
      try {
        decoded = verifyToken(token);
      } catch (error) {
        // Clear invalid cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.setHeader('Set-Cookie', [
          `auth_token=; Path=/; HttpOnly; Secure=${isProduction}; SameSite=Strict; Max-Age=0`
        ]);

        const errorMessage = error instanceof Error ? error.message : 'Invalid token';
        
        return res.status(401).json({
          success: false,
          message: errorMessage === 'Token has expired' 
            ? 'Your session has expired. Please log in again.'
            : 'Invalid authentication token. Please log in again.'
        });
      }

      // Check if token has required fields
      if (!decoded.userId || !decoded.email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload. Please log in again.'
        });
      }

      // CRITICAL: Verify session exists in database
      const crypto = require('crypto');
      const { query } = require('../lib/db');
      
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const sessionResult = await query(
        'SELECT id, user_id, expires_at FROM sessions WHERE token_hash = $1 AND user_id = $2',
        [tokenHash, decoded.userId]
      );

      // If session doesn't exist in database, reject
      if (sessionResult.rows.length === 0) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.setHeader('Set-Cookie', [
          `auth_token=; Path=/; HttpOnly; Secure=${isProduction}; SameSite=Strict; Max-Age=0`
        ]);
        
        return res.status(401).json({
          success: false,
          message: 'Session not found. Please log in again.'
        });
      }

      const session = sessionResult.rows[0];
      
      // Check if session has expired
      const expiresAt = new Date(session.expires_at);
      if (expiresAt < new Date()) {
        // Delete expired session
        await query('DELETE FROM sessions WHERE id = $1', [session.id]);
        
        const isProduction = process.env.NODE_ENV === 'production';
        res.setHeader('Set-Cookie', [
          `auth_token=; Path=/; HttpOnly; Secure=${isProduction}; SameSite=Strict; Max-Age=0`
        ]);
        
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.'
        });
      }

      // Attach user data to request object
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  };
}

/**
 * Optional authentication middleware that doesn't fail if token is missing
 * Useful for endpoints that work with or without authentication
 * 
 * @param handler - Next.js API route handler to wrap
 * @returns Wrapped handler with optional authentication
 */
export function withOptionalAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Extract token from httpOnly cookie
      const token = req.cookies.auth_token;

      if (token) {
        try {
          // Verify token if present
          const decoded = verifyToken(token);

          if (decoded.userId && decoded.email) {
            // Attach user data to request object
            req.user = {
              id: decoded.userId,
              email: decoded.email
            };
          }
        } catch (error) {
          // Token is invalid but we don't fail the request
          console.warn('Optional auth: Invalid token, continuing without user');
        }
      }

      // Call the actual handler (with or without user)
      return handler(req, res);
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

/**
 * Extract user from request (for use in authenticated handlers)
 * 
 * @param req - Authenticated request object
 * @returns User data or null if not authenticated
 */
export function getUser(req: AuthenticatedRequest): { id: string; email: string } | null {
  return req.user || null;
}
