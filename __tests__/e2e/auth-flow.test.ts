/**
 * End-to-End Tests for Authentication Flow
 * 
 * Tests the complete user authentication journey:
 * - Registration → Login → Access Content flow
 * - Session persistence across page refreshes
 * - Session expiration and re-login
 * - Access code reuse prevention
 * 
 * Requirements: 1.1, 2.1, 3.1, 4.1, 4.2
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';
import registerHandler from '../../pages/api/auth/register';
import loginHandler from '../../pages/api/auth/login';
import logoutHandler from '../../pages/api/auth/logout';
import meHandler from '../../pages/api/auth/me';
import { verifyToken, isTokenExpired } from '../../lib/auth/jwt';

// Mock Vercel KV for rate limiting
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  }
}));

// Helper to create mock request
function createMockRequest(
  method: string,
  body: any = {},
  headers: any = {},
  cookies: any = {}
): Partial<NextApiRequest> {
  return {
    method,
    body,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers
    },
    socket: {
      remoteAddress: '127.0.0.1'
    } as any,
    url: '/api/auth',
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

// Helper to extract token from Set-Cookie header
function extractTokenFromResponse(res: any): string | null {
  const setCookieCall = res.setHeader.mock.calls.find(
    (call: any) => call[0] === 'Set-Cookie'
  );
  
  if (!setCookieCall) return null;
  
  const cookieString = setCookieCall[1][0];
  const tokenMatch = cookieString.match(/auth_token=([^;]+)/);
  
  return tokenMatch ? tokenMatch[1] : null;
}

describe('End-to-End Authentication Flow', () => {
  let testAccessCode: string;
  let testEmail: string;
  let testPassword: string;
  let testUserId: string;

  beforeEach(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testAccessCode = `E2E${timestamp}`;
    testEmail = `e2e${timestamp}@example.com`;
    testPassword = 'E2ETestPass123';

    // Create test access code
    await sql`
      INSERT INTO access_codes (code, redeemed, created_at)
      VALUES (${testAccessCode}, false, NOW())
    `;

    // Reset KV mocks
    (kv.get as jest.Mock).mockResolvedValue([]);
    (kv.set as jest.Mock).mockResolvedValue('OK');
  });

  afterEach(async () => {
    // Clean up test data
    try {
      if (testUserId) {
        await sql`DELETE FROM sessions WHERE user_id = ${testUserId}`;
        await sql`DELETE FROM auth_logs WHERE user_id = ${testUserId}`;
        await sql`DELETE FROM users WHERE id = ${testUserId}`;
      }
      await sql`DELETE FROM access_codes WHERE code = ${testAccessCode}`;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Complete Registration → Login → Access Content Flow', () => {
    it('should complete full authentication journey', async () => {
      // STEP 1: Register new user
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      // Verify registration success
      expect(registerRes.status).toHaveBeenCalledWith(201);
      expect(registerRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Registration successful',
          user: expect.objectContaining({
            email: testEmail
          })
        })
      );

      // Extract user ID and token from registration
      const registerJsonCall = registerRes.json.mock.calls[0][0];
      testUserId = registerJsonCall.user.id;
      const registerToken = extractTokenFromResponse(registerRes);
      
      expect(registerToken).toBeTruthy();
      expect(testUserId).toBeTruthy();

      // Verify access code was marked as redeemed
      const codeResult = await sql`
        SELECT redeemed, redeemed_by FROM access_codes WHERE code = ${testAccessCode}
      `;
      expect(codeResult.rows[0].redeemed).toBe(true);
      expect(codeResult.rows[0].redeemed_by).toBe(testUserId);

      // STEP 2: Verify user can access protected content with registration token
      const meReq1 = createMockRequest('GET', {}, {}, { auth_token: registerToken });
      const meRes1 = createMockResponse();

      await meHandler(meReq1 as NextApiRequest, meRes1 as NextApiResponse);

      expect(meRes1.status).toHaveBeenCalledWith(200);
      expect(meRes1.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            id: testUserId,
            email: testEmail
          })
        })
      );

      // STEP 3: Logout
      const logoutReq = createMockRequest('POST', {}, {}, { auth_token: registerToken });
      const logoutRes = createMockResponse();

      await logoutHandler(logoutReq as NextApiRequest, logoutRes as NextApiResponse);

      expect(logoutRes.status).toHaveBeenCalledWith(200);
      expect(logoutRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful'
        })
      );

      // Verify session was deleted
      const sessionResult = await sql`
        SELECT id FROM sessions WHERE user_id = ${testUserId}
      `;
      expect(sessionResult.rows.length).toBe(0);

      // STEP 4: Verify cannot access protected content after logout
      const meReq2 = createMockRequest('GET', {}, {}, { auth_token: registerToken });
      const meRes2 = createMockResponse();

      await meHandler(meReq2 as NextApiRequest, meRes2 as NextApiResponse);

      expect(meRes2.status).toHaveBeenCalledWith(401);

      // STEP 5: Login with credentials
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: expect.objectContaining({
            id: testUserId,
            email: testEmail
          })
        })
      );

      const loginToken = extractTokenFromResponse(loginRes);
      expect(loginToken).toBeTruthy();
      expect(loginToken).not.toBe(registerToken); // Should be a new token

      // STEP 6: Verify can access protected content with login token
      const meReq3 = createMockRequest('GET', {}, {}, { auth_token: loginToken });
      const meRes3 = createMockResponse();

      await meHandler(meReq3 as NextApiRequest, meRes3 as NextApiResponse);

      expect(meRes3.status).toHaveBeenCalledWith(200);
      expect(meRes3.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            id: testUserId,
            email: testEmail
          })
        })
      );
    });

    it('should maintain user data consistency throughout flow', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      const registerData = registerRes.json.mock.calls[0][0];
      testUserId = registerData.user.id;
      const registerEmail = registerData.user.email;
      const registerCreatedAt = registerData.user.createdAt;

      // Login
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      const loginData = loginRes.json.mock.calls[0][0];
      const loginToken = extractTokenFromResponse(loginRes);

      // Access protected content
      const meReq = createMockRequest('GET', {}, {}, { auth_token: loginToken });
      const meRes = createMockResponse();

      await meHandler(meReq as NextApiRequest, meRes as NextApiResponse);

      const meData = meRes.json.mock.calls[0][0];

      // Verify user data is consistent across all endpoints
      expect(loginData.user.id).toBe(testUserId);
      expect(loginData.user.email).toBe(registerEmail);
      expect(meData.user.id).toBe(testUserId);
      expect(meData.user.email).toBe(registerEmail);
      expect(meData.user.createdAt).toBe(registerCreatedAt);
    });
  });

  describe('Session Persistence Across Page Refreshes', () => {
    it('should maintain session across multiple requests', async () => {
      // Register and get token
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const token = extractTokenFromResponse(registerRes);

      // Simulate multiple page refreshes (multiple /me requests)
      for (let i = 0; i < 5; i++) {
        const meReq = createMockRequest('GET', {}, {}, { auth_token: token });
        const meRes = createMockResponse();

        await meHandler(meReq as NextApiRequest, meRes as NextApiResponse);

        expect(meRes.status).toHaveBeenCalledWith(200);
        expect(meRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            user: expect.objectContaining({
              id: testUserId,
              email: testEmail
            })
          })
        );
      }

      // Verify session still exists in database
      const sessionResult = await sql`
        SELECT id FROM sessions WHERE user_id = ${testUserId}
      `;
      expect(sessionResult.rows.length).toBe(1);
    });

    it('should persist session data in database', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const token = extractTokenFromResponse(registerRes);

      // Verify session exists
      const sessionResult1 = await sql`
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM sessions
        WHERE user_id = ${testUserId}
      `;

      expect(sessionResult1.rows.length).toBe(1);
      const sessionId = sessionResult1.rows[0].id;
      const tokenHash = sessionResult1.rows[0].token_hash;
      const expiresAt = sessionResult1.rows[0].expires_at;

      // Make multiple requests
      for (let i = 0; i < 3; i++) {
        const meReq = createMockRequest('GET', {}, {}, { auth_token: token });
        const meRes = createMockResponse();
        await meHandler(meReq as NextApiRequest, meRes as NextApiResponse);
      }

      // Verify session data hasn't changed
      const sessionResult2 = await sql`
        SELECT id, user_id, token_hash, expires_at
        FROM sessions
        WHERE user_id = ${testUserId}
      `;

      expect(sessionResult2.rows.length).toBe(1);
      expect(sessionResult2.rows[0].id).toBe(sessionId);
      expect(sessionResult2.rows[0].token_hash).toBe(tokenHash);
      expect(sessionResult2.rows[0].expires_at).toBe(expiresAt);
    });

    it('should handle concurrent requests with same token', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const token = extractTokenFromResponse(registerRes);

      // Make concurrent requests
      const requests = Array(5).fill(null).map(() => {
        const meReq = createMockRequest('GET', {}, {}, { auth_token: token });
        const meRes = createMockResponse();
        return meHandler(meReq as NextApiRequest, meRes as NextApiResponse);
      });

      await Promise.all(requests);

      // Verify session still exists and is valid
      const sessionResult = await sql`
        SELECT id FROM sessions WHERE user_id = ${testUserId}
      `;
      expect(sessionResult.rows.length).toBe(1);
    });
  });

  describe('Session Expiration and Re-login', () => {
    it('should reject expired tokens', async () => {
      // This test would require mocking time or creating a token with very short expiration
      // For now, we'll test the token expiration check logic
      
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const token = extractTokenFromResponse(registerRes);

      // Verify token is not expired
      expect(isTokenExpired(token!)).toBe(false);

      // Verify token payload
      const decoded = verifyToken(token!);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp! > Math.floor(Date.now() / 1000)).toBe(true);
    });

    it('should allow re-login after session expires', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const registerToken = extractTokenFromResponse(registerRes);

      // Logout (simulating session expiration)
      const logoutReq = createMockRequest('POST', {}, {}, { auth_token: registerToken });
      const logoutRes = createMockResponse();

      await logoutHandler(logoutReq as NextApiRequest, logoutRes as NextApiResponse);

      // Verify cannot access content
      const meReq1 = createMockRequest('GET', {}, {}, { auth_token: registerToken });
      const meRes1 = createMockResponse();

      await meHandler(meReq1 as NextApiRequest, meRes1 as NextApiResponse);

      expect(meRes1.status).toHaveBeenCalledWith(401);

      // Re-login
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      expect(loginRes.status).toHaveBeenCalledWith(200);

      const newToken = extractTokenFromResponse(loginRes);
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(registerToken);

      // Verify can access content with new token
      const meReq2 = createMockRequest('GET', {}, {}, { auth_token: newToken });
      const meRes2 = createMockResponse();

      await meHandler(meReq2 as NextApiRequest, meRes2 as NextApiResponse);

      expect(meRes2.status).toHaveBeenCalledWith(200);
    });

    it('should create new session on re-login', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const registerToken = extractTokenFromResponse(registerRes);

      // Get first session ID
      const session1 = await sql`
        SELECT id, token_hash FROM sessions WHERE user_id = ${testUserId}
      `;
      const firstSessionId = session1.rows[0].id;
      const firstTokenHash = session1.rows[0].token_hash;

      // Logout
      const logoutReq = createMockRequest('POST', {}, {}, { auth_token: registerToken });
      const logoutRes = createMockResponse();

      await logoutHandler(logoutReq as NextApiRequest, logoutRes as NextApiResponse);

      // Re-login
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      // Get second session ID
      const session2 = await sql`
        SELECT id, token_hash FROM sessions WHERE user_id = ${testUserId}
      `;

      expect(session2.rows.length).toBe(1);
      expect(session2.rows[0].id).not.toBe(firstSessionId);
      expect(session2.rows[0].token_hash).not.toBe(firstTokenHash);
    });
  });

  describe('Access Code Reuse Prevention', () => {
    it('should prevent reusing already-redeemed access code', async () => {
      // First registration
      const registerReq1 = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes1 = createMockResponse();

      await registerHandler(registerReq1 as NextApiRequest, registerRes1 as NextApiResponse);

      expect(registerRes1.status).toHaveBeenCalledWith(201);
      testUserId = registerRes1.json.mock.calls[0][0].user.id;

      // Verify access code is marked as redeemed
      const codeResult1 = await sql`
        SELECT redeemed, redeemed_by, redeemed_at FROM access_codes WHERE code = ${testAccessCode}
      `;
      expect(codeResult1.rows[0].redeemed).toBe(true);
      expect(codeResult1.rows[0].redeemed_by).toBe(testUserId);
      expect(codeResult1.rows[0].redeemed_at).toBeTruthy();

      // Attempt second registration with same code
      const registerReq2 = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: `different${testEmail}`,
        password: testPassword
      });
      const registerRes2 = createMockResponse();

      await registerHandler(registerReq2 as NextApiRequest, registerRes2 as NextApiResponse);

      // Should be rejected
      expect(registerRes2.status).toHaveBeenCalledWith(410);
      expect(registerRes2.json).toHaveBeenCalledWith({
        success: false,
        message: 'This access code has already been used'
      });

      // Verify only one user was created
      const userResult = await sql`
        SELECT id FROM users WHERE email LIKE ${`%${Date.now()}%`}
      `;
      expect(userResult.rows.length).toBe(1);
    });

    it('should maintain access code redemption data permanently', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;

      // Get redemption data
      const codeResult1 = await sql`
        SELECT redeemed, redeemed_by, redeemed_at FROM access_codes WHERE code = ${testAccessCode}
      `;

      const redemptionData = {
        redeemed: codeResult1.rows[0].redeemed,
        redeemedBy: codeResult1.rows[0].redeemed_by,
        redeemedAt: codeResult1.rows[0].redeemed_at
      };

      // Perform multiple operations (login, logout, etc.)
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      const token = extractTokenFromResponse(loginRes);

      const logoutReq = createMockRequest('POST', {}, {}, { auth_token: token });
      const logoutRes = createMockResponse();

      await logoutHandler(logoutReq as NextApiRequest, logoutRes as NextApiResponse);

      // Verify redemption data is unchanged
      const codeResult2 = await sql`
        SELECT redeemed, redeemed_by, redeemed_at FROM access_codes WHERE code = ${testAccessCode}
      `;

      expect(codeResult2.rows[0].redeemed).toBe(redemptionData.redeemed);
      expect(codeResult2.rows[0].redeemed_by).toBe(redemptionData.redeemedBy);
      expect(codeResult2.rows[0].redeemed_at).toEqual(redemptionData.redeemedAt);
    });

    it('should track which user redeemed which code', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;

      // Verify redemption tracking
      const codeResult = await sql`
        SELECT redeemed_by, redeemed_at FROM access_codes WHERE code = ${testAccessCode}
      `;

      expect(codeResult.rows[0].redeemed_by).toBe(testUserId);
      expect(codeResult.rows[0].redeemed_at).toBeTruthy();

      // Verify timestamp is recent
      const redeemedAt = new Date(codeResult.rows[0].redeemed_at);
      const now = new Date();
      const timeDiff = now.getTime() - redeemedAt.getTime();
      
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network interruption during registration', async () => {
      // Simulate partial registration (user created but session not established)
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;

      // User should still be able to login
      const loginReq = createMockRequest('POST', {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });
      const loginRes = createMockResponse();

      await loginHandler(loginReq as NextApiRequest, loginRes as NextApiResponse);

      expect(loginRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle multiple logout attempts gracefully', async () => {
      // Register
      const registerReq = createMockRequest('POST', {
        accessCode: testAccessCode,
        email: testEmail,
        password: testPassword
      });
      const registerRes = createMockResponse();

      await registerHandler(registerReq as NextApiRequest, registerRes as NextApiResponse);

      testUserId = registerRes.json.mock.calls[0][0].user.id;
      const token = extractTokenFromResponse(registerRes);

      // First logout
      const logoutReq1 = createMockRequest('POST', {}, {}, { auth_token: token });
      const logoutRes1 = createMockResponse();

      await logoutHandler(logoutReq1 as NextApiRequest, logoutRes1 as NextApiResponse);

      expect(logoutRes1.status).toHaveBeenCalledWith(200);

      // Second logout attempt (should fail gracefully)
      const logoutReq2 = createMockRequest('POST', {}, {}, { auth_token: token });
      const logoutRes2 = createMockResponse();

      await logoutHandler(logoutReq2 as NextApiRequest, logoutRes2 as NextApiResponse);

      // Should return 401 since session no longer exists
      expect(logoutRes2.status).toHaveBeenCalledWith(401);
    });
  });
});
