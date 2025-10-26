/**
 * Integration Tests for Logout Flow
 * 
 * Tests the complete logout API endpoint including:
 * - Successful logout clears cookie
 * - Logout deletes session from database
 * - Logout requires valid token
 * 
 * Requirements: 4.3
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import logoutHandler from '../../../pages/api/auth/logout';
import { hashPassword } from '../../../lib/auth/password';
import { generateToken } from '../../../lib/auth/jwt';
import crypto from 'crypto';

// Helper to hash token for session storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to create mock request
function createMockRequest(
  cookies: any = {},
  headers: any = {},
  method: string = 'POST'
): Partial<NextApiRequest> {
  return {
    method,
    body: {},
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers
    },
    socket: {
      remoteAddress: '127.0.0.1'
    } as any,
    url: '/api/auth/logout',
    cookies
  };
}

// Helper to create mock response
function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('Logout API Integration Tests', () => {
  let testEmail: string;
  let testPassword: string;
  let testUserId: string;
  let testToken: string;
  let testSessionId: string;

  beforeEach(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testEmail = `logouttest${timestamp}@example.com`;
    testPassword = 'TestPassword123';

    // Create test user
    const passwordHash = await hashPassword(testPassword);
    const userResult = await sql`
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES (${testEmail}, ${passwordHash}, NOW(), NOW())
      RETURNING id
    `;
    testUserId = userResult.rows[0].id;

    // Generate JWT token
    testToken = generateToken({
      userId: testUserId,
      email: testEmail
    }, '7d');

    // Create session in database
    const tokenHash = hashToken(testToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const sessionResult = await sql`
      INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
      VALUES (${testUserId}, ${tokenHash}, ${expiresAt.toISOString()}, NOW())
      RETURNING id
    `;
    testSessionId = sessionResult.rows[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await sql`DELETE FROM sessions WHERE user_id = ${testUserId}`;
      await sql`DELETE FROM users WHERE id = ${testUserId}`;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Successful Logout', () => {
    it('should logout successfully with valid token', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });

    it('should clear httpOnly cookie', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Verify cookie was cleared (Max-Age=0)
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringMatching(/auth_token=.*Max-Age=0/)
        ])
      );

      // Verify cookie has HttpOnly flag
      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];
      expect(cookieString).toContain('HttpOnly');
      expect(cookieString).toContain('SameSite=Strict');
    });

    it('should delete session from database', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      // Verify session exists before logout
      const beforeResult = await sql`
        SELECT id FROM sessions WHERE id = ${testSessionId}
      `;
      expect(beforeResult.rows.length).toBe(1);

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify session was deleted
      const afterResult = await sql`
        SELECT id FROM sessions WHERE id = ${testSessionId}
      `;
      expect(afterResult.rows.length).toBe(0);
    });

    it('should delete correct session when user has multiple sessions', async () => {
      // Create a second session for the same user
      const secondToken = generateToken({
        userId: testUserId,
        email: testEmail
      }, '7d');
      const secondTokenHash = hashToken(secondToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const secondSessionResult = await sql`
        INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
        VALUES (${testUserId}, ${secondTokenHash}, ${expiresAt.toISOString()}, NOW())
        RETURNING id
      `;
      const secondSessionId = secondSessionResult.rows[0].id;

      // Logout with first token
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify first session was deleted
      const firstSessionResult = await sql`
        SELECT id FROM sessions WHERE id = ${testSessionId}
      `;
      expect(firstSessionResult.rows.length).toBe(0);

      // Verify second session still exists
      const secondSessionCheck = await sql`
        SELECT id FROM sessions WHERE id = ${secondSessionId}
      `;
      expect(secondSessionCheck.rows.length).toBe(1);

      // Cleanup second session
      await sql`DELETE FROM sessions WHERE id = ${secondSessionId}`;
    });
  });

  describe('Invalid Token', () => {
    it('should reject logout without token', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should reject logout with invalid token', async () => {
      const req = createMockRequest({
        auth_token: 'invalid-token-string'
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should reject logout with expired token', async () => {
      // Create an expired token
      const expiredToken = generateToken({
        userId: testUserId,
        email: testEmail
      }, '0s');

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const req = createMockRequest({
        auth_token: expiredToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should reject logout with tampered token', async () => {
      // Tamper with the token
      const tamperedToken = testToken.slice(0, -5) + 'XXXXX';

      const req = createMockRequest({
        auth_token: tamperedToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest(
        { auth_token: testToken },
        {},
        'GET'
      );
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Method not allowed'
      });
    });

    it('should reject PUT requests', async () => {
      const req = createMockRequest(
        { auth_token: testToken },
        {},
        'PUT'
      );
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should reject DELETE requests', async () => {
      const req = createMockRequest(
        { auth_token: testToken },
        {},
        'DELETE'
      );
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('Session Not Found', () => {
    it('should handle logout when session already deleted', async () => {
      // Delete session manually
      await sql`DELETE FROM sessions WHERE id = ${testSessionId}`;

      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Should still succeed and clear cookie
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });

      // Verify cookie was cleared
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringMatching(/Max-Age=0/)
        ])
      );
    });

    it('should handle logout when session expired', async () => {
      // Update session to be expired
      await sql`
        UPDATE sessions
        SET expires_at = NOW() - INTERVAL '1 hour'
        WHERE id = ${testSessionId}
      `;

      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Should still succeed
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should clear cookie even on database error', async () => {
      // Use a token that will cause database issues
      const invalidUserId = '00000000-0000-0000-0000-000000000000';
      const invalidToken = generateToken({
        userId: invalidUserId,
        email: 'invalid@example.com'
      }, '7d');

      const req = createMockRequest({
        auth_token: invalidToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Even if there's an error, cookie should be cleared
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringMatching(/Max-Age=0/)
        ])
      );
    });
  });

  describe('Audit Logging', () => {
    it('should log logout event', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Wait a moment for async logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify logout was logged
      const logResult = await sql`
        SELECT id, user_id, event_type, success
        FROM auth_logs
        WHERE user_id = ${testUserId}
          AND event_type = 'logout'
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      expect(logResult.rows.length).toBeGreaterThan(0);
      expect(logResult.rows[0].user_id).toBe(testUserId);
      expect(logResult.rows[0].event_type).toBe('logout');
      expect(logResult.rows[0].success).toBe(true);
    });

    it('should log IP address and user agent', async () => {
      const req = createMockRequest(
        { auth_token: testToken },
        {
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Mozilla/5.0 Test Browser'
        }
      );
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      // Wait for async logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify IP and user agent were logged
      const logResult = await sql`
        SELECT ip_address, user_agent
        FROM auth_logs
        WHERE user_id = ${testUserId}
          AND event_type = 'logout'
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      expect(logResult.rows.length).toBeGreaterThan(0);
      expect(logResult.rows[0].ip_address).toBe('192.168.1.100');
      expect(logResult.rows[0].user_agent).toBe('Mozilla/5.0 Test Browser');
    });
  });

  describe('Cookie Security', () => {
    it('should set Secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];

      expect(cookieString).toContain('Secure=true');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not set Secure flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];

      expect(cookieString).toContain('Secure=false');

      process.env.NODE_ENV = originalEnv;
    });

    it('should always set HttpOnly flag', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];

      expect(cookieString).toContain('HttpOnly');
    });

    it('should always set SameSite=Strict', async () => {
      const req = createMockRequest({
        auth_token: testToken
      });
      const res = createMockResponse();

      await logoutHandler(req as any, res as NextApiResponse);

      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];

      expect(cookieString).toContain('SameSite=Strict');
    });
  });
});
