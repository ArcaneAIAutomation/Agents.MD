/**
 * Integration Tests for Login Flow
 * 
 * Tests the complete login API endpoint including:
 * - Successful login with correct credentials
 * - Rejection of incorrect password
 * - Rejection of non-existent email
 * - Rate limiting after 5 failed attempts
 * - RememberMe extends session to 30 days
 * 
 * Requirements: 3.1, 3.3, 3.5
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';
import loginHandler from '../../../pages/api/auth/login';
import { hashPassword } from '../../../lib/auth/password';
import { verifyToken } from '../../../lib/auth/jwt';

// Mock Vercel KV for rate limiting
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  }
}));

// Helper to create mock request
function createMockRequest(body: any, headers: any = {}, cookies: any = {}): Partial<NextApiRequest> {
  return {
    method: 'POST',
    body,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers
    },
    socket: {
      remoteAddress: '127.0.0.1'
    } as any,
    url: '/api/auth/login',
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

describe('Login API Integration Tests', () => {
  let testEmail: string;
  let testPassword: string;
  let testUserId: string;

  beforeEach(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testEmail = `logintest${timestamp}@example.com`;
    testPassword = 'TestPassword123';

    // Create test user
    const passwordHash = await hashPassword(testPassword);
    const userResult = await sql`
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES (${testEmail}, ${passwordHash}, NOW(), NOW())
      RETURNING id
    `;
    testUserId = userResult.rows[0].id;

    // Reset KV mocks
    (kv.get as jest.Mock).mockResolvedValue([]);
    (kv.set as jest.Mock).mockResolvedValue('OK');
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

  describe('Successful Login', () => {
    it('should login with correct credentials', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: expect.objectContaining({
            id: testUserId,
            email: testEmail
          })
        })
      );

      // Verify cookie was set
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringContaining('auth_token=')
        ])
      );

      // Extract and verify JWT token
      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];
      const tokenMatch = cookieString.match(/auth_token=([^;]+)/);
      expect(tokenMatch).toBeTruthy();

      const token = tokenMatch[1];
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);

      // Verify session was created in database
      const sessionResult = await sql`
        SELECT id, user_id, expires_at FROM sessions WHERE user_id = ${testUserId}
      `;
      expect(sessionResult.rows.length).toBeGreaterThan(0);
      expect(sessionResult.rows[0].user_id).toBe(testUserId);
    });

    it('should handle case-insensitive email login', async () => {
      const req = createMockRequest({
        email: testEmail.toUpperCase(),
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: testEmail
          })
        })
      );
    });

    it('should set 7-day expiration by default', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Extract token and check expiration
      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];
      const tokenMatch = cookieString.match(/auth_token=([^;]+)/);
      const token = tokenMatch[1];
      
      const decoded = verifyToken(token);
      const expirationTime = decoded.exp! - decoded.iat!;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      
      expect(expirationTime).toBe(sevenDaysInSeconds);

      // Verify Max-Age in cookie
      expect(cookieString).toContain(`Max-Age=${sevenDaysInSeconds}`);
    });
  });

  describe('RememberMe Functionality', () => {
    it('should extend session to 30 days when rememberMe is true', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: true
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Extract token and check expiration
      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];
      const tokenMatch = cookieString.match(/auth_token=([^;]+)/);
      const token = tokenMatch[1];
      
      const decoded = verifyToken(token);
      const expirationTime = decoded.exp! - decoded.iat!;
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      
      expect(expirationTime).toBe(thirtyDaysInSeconds);

      // Verify Max-Age in cookie
      expect(cookieString).toContain(`Max-Age=${thirtyDaysInSeconds}`);

      // Verify session expiration in database
      const sessionResult = await sql`
        SELECT expires_at FROM sessions WHERE user_id = ${testUserId}
      `;
      const expiresAt = new Date(sessionResult.rows[0].expires_at);
      const now = new Date();
      const daysDifference = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(daysDifference).toBeGreaterThan(29);
      expect(daysDifference).toBeLessThan(31);
    });
  });

  describe('Incorrect Password', () => {
    it('should reject login with incorrect password', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: 'WrongPassword456',
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });

      // Verify no session was created
      const sessionResult = await sql`
        SELECT id FROM sessions WHERE user_id = ${testUserId}
      `;
      expect(sessionResult.rows.length).toBe(0);
    });

    it('should not reveal which field is incorrect', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: 'WrongPassword456',
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      // Should return generic error message
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });
  });

  describe('Non-Existent Email', () => {
    it('should reject login with non-existent email', async () => {
      const req = createMockRequest({
        email: 'nonexistent@example.com',
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should return same error message as incorrect password', async () => {
      // Test with non-existent email
      const req1 = createMockRequest({
        email: 'nonexistent@example.com',
        password: testPassword,
        rememberMe: false
      });
      const res1 = createMockResponse();

      await loginHandler(req1 as NextApiRequest, res1 as NextApiResponse);

      // Test with incorrect password
      const req2 = createMockRequest({
        email: testEmail,
        password: 'WrongPassword456',
        rememberMe: false
      });
      const res2 = createMockResponse();

      await loginHandler(req2 as NextApiRequest, res2 as NextApiResponse);

      // Both should return the same generic error
      expect(res1.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
      expect(res2.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after 5 failed attempts', async () => {
      const attempts: number[] = [];
      const now = Date.now();

      // Mock KV to simulate 5 previous failed attempts
      for (let i = 0; i < 5; i++) {
        attempts.push(now - (i * 1000));
      }

      (kv.get as jest.Mock).mockResolvedValue(attempts);

      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Too many')
        })
      );

      // Verify Retry-After header was set
      expect(res.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(String)
      );
    });

    it('should rate limit by email address', async () => {
      const attempts: number[] = [];
      const now = Date.now();

      // Simulate 5 failed attempts for this specific email
      for (let i = 0; i < 5; i++) {
        attempts.push(now - (i * 1000));
      }

      (kv.get as jest.Mock).mockResolvedValue(attempts);

      const req = createMockRequest({
        email: testEmail,
        password: 'WrongPassword',
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should allow login after rate limit window expires', async () => {
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      
      // Mock KV with old attempts (outside window)
      const oldAttempts = [
        now - windowMs - 1000,
        now - windowMs - 2000,
        now - windowMs - 3000
      ];

      (kv.get as jest.Mock).mockResolvedValue(oldAttempts);

      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      // Should succeed because old attempts are outside window
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should reject empty email', async () => {
      const req = createMockRequest({
        email: '',
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input data'
      });
    });

    it('should reject empty password', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: '',
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input data'
      });
    });

    it('should reject invalid email format', async () => {
      const req = createMockRequest({
        email: 'invalid-email',
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input data'
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword
      });
      req.method = 'GET';
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Method not allowed'
      });
    });
  });

  describe('Session Management', () => {
    it('should create session record in database', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify session exists
      const sessionResult = await sql`
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM sessions
        WHERE user_id = ${testUserId}
      `;

      expect(sessionResult.rows.length).toBe(1);
      expect(sessionResult.rows[0].user_id).toBe(testUserId);
      expect(sessionResult.rows[0].token_hash).toBeTruthy();
      expect(sessionResult.rows[0].expires_at).toBeTruthy();
    });

    it('should hash token before storing in database', async () => {
      const req = createMockRequest({
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const res = createMockResponse();

      await loginHandler(req as NextApiRequest, res as NextApiResponse);

      // Extract token from cookie
      const setCookieCall = res.setHeader.mock.calls.find(
        (call: any) => call[0] === 'Set-Cookie'
      );
      const cookieString = setCookieCall[1][0];
      const tokenMatch = cookieString.match(/auth_token=([^;]+)/);
      const token = tokenMatch[1];

      // Get stored token hash
      const sessionResult = await sql`
        SELECT token_hash FROM sessions WHERE user_id = ${testUserId}
      `;
      const storedHash = sessionResult.rows[0].token_hash;

      // Token and hash should be different
      expect(storedHash).not.toBe(token);
      expect(storedHash.length).toBe(64); // SHA-256 produces 64 hex characters
    });
  });
});
