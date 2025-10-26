/**
 * Integration Tests for Registration Flow
 * 
 * Tests the complete registration API endpoint including:
 * - Successful registration with valid access code
 * - Rejection of invalid access code
 * - Rejection of already-redeemed access code
 * - Rejection of duplicate email
 * - Rate limiting after 5 attempts
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.3, 3.5
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';
import registerHandler from '../../../pages/api/auth/register';
import { hashPassword } from '../../../lib/auth/password';

// Mock Vercel KV for rate limiting
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  }
}));

// Helper to create mock request
function createMockRequest(body: any, headers: any = {}): Partial<NextApiRequest> {
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
    url: '/api/auth/register',
    cookies: {}
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

describe('Registration API Integration Tests', () => {
  let testAccessCode: string;
  let testEmail: string;

  beforeEach(async () => {
    // Generate unique test data for each test
    const timestamp = Date.now();
    testAccessCode = `TEST${timestamp.toString().slice(-4)}`;
    testEmail = `test${timestamp}@example.com`;

    // Insert test access code
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
      await sql`DELETE FROM users WHERE email = ${testEmail}`;
      await sql`DELETE FROM access_codes WHERE code = ${testAccessCode}`;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Successful Registration', () => {
    it('should register a new user with valid access code', async () => {
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Registration successful',
          user: expect.objectContaining({
            email: testEmail.toLowerCase()
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

      // Verify user was created in database
      const userResult = await sql`
        SELECT id, email FROM users WHERE email = ${testEmail.toLowerCase()}
      `;
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].email).toBe(testEmail.toLowerCase());

      // Verify access code was marked as redeemed
      const codeResult = await sql`
        SELECT redeemed, redeemed_by FROM access_codes WHERE code = ${testAccessCode}
      `;
      expect(codeResult.rows[0].redeemed).toBe(true);
      expect(codeResult.rows[0].redeemed_by).toBe(userResult.rows[0].id);
    });

    it('should normalize email to lowercase', async () => {
      const mixedCaseEmail = `Test${Date.now()}@EXAMPLE.COM`;
      
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: mixedCaseEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(201);

      // Verify email was stored in lowercase
      const userResult = await sql`
        SELECT email FROM users WHERE email = ${mixedCaseEmail.toLowerCase()}
      `;
      expect(userResult.rows.length).toBe(1);
      expect(userResult.rows[0].email).toBe(mixedCaseEmail.toLowerCase());

      // Cleanup
      await sql`DELETE FROM users WHERE email = ${mixedCaseEmail.toLowerCase()}`;
    });
  });

  describe('Invalid Access Code', () => {
    it('should reject registration with non-existent access code', async () => {
      const req = createMockRequest({
        accessCode: 'INVALID123',
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid access code'
      });

      // Verify user was NOT created
      const userResult = await sql`
        SELECT id FROM users WHERE email = ${testEmail.toLowerCase()}
      `;
      expect(userResult.rows.length).toBe(0);
    });

    it('should reject registration with empty access code', async () => {
      const req = createMockRequest({
        accessCode: '',
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('Already-Redeemed Access Code', () => {
    it('should reject registration with already-redeemed access code', async () => {
      // First registration - should succeed
      const firstEmail = `first${Date.now()}@example.com`;
      const req1 = createMockRequest({
        accessCode: testAccessCode,
        email: firstEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res1 = createMockResponse();

      await registerHandler(req1 as NextApiRequest, res1 as NextApiResponse);
      expect(res1.status).toHaveBeenCalledWith(201);

      // Second registration with same code - should fail
      const secondEmail = `second${Date.now()}@example.com`;
      const req2 = createMockRequest({
        accessCode: testAccessCode,
        email: secondEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res2 = createMockResponse();

      await registerHandler(req2 as NextApiRequest, res2 as NextApiResponse);

      expect(res2.status).toHaveBeenCalledWith(410);
      expect(res2.json).toHaveBeenCalledWith({
        success: false,
        message: 'This access code has already been used'
      });

      // Verify second user was NOT created
      const userResult = await sql`
        SELECT id FROM users WHERE email = ${secondEmail.toLowerCase()}
      `;
      expect(userResult.rows.length).toBe(0);

      // Cleanup
      await sql`DELETE FROM users WHERE email = ${firstEmail.toLowerCase()}`;
    });
  });

  describe('Duplicate Email', () => {
    it('should reject registration with existing email', async () => {
      // Create a second access code for the duplicate email test
      const secondAccessCode = `TEST${Date.now().toString().slice(-4)}2`;
      await sql`
        INSERT INTO access_codes (code, redeemed, created_at)
        VALUES (${secondAccessCode}, false, NOW())
      `;

      // First registration - should succeed
      const req1 = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res1 = createMockResponse();

      await registerHandler(req1 as NextApiRequest, res1 as NextApiResponse);
      expect(res1.status).toHaveBeenCalledWith(201);

      // Second registration with same email but different code - should fail
      const req2 = createMockRequest({
        accessCode: secondAccessCode,
        email: testEmail,
        password: 'DifferentPassword456',
        confirmPassword: 'DifferentPassword456'
      });
      const res2 = createMockResponse();

      await registerHandler(req2 as NextApiRequest, res2 as NextApiResponse);

      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith({
        success: false,
        message: 'An account with this email already exists'
      });

      // Verify second access code was NOT redeemed
      const codeResult = await sql`
        SELECT redeemed FROM access_codes WHERE code = ${secondAccessCode}
      `;
      expect(codeResult.rows[0].redeemed).toBe(false);

      // Cleanup
      await sql`DELETE FROM access_codes WHERE code = ${secondAccessCode}`;
    });

    it('should handle case-insensitive email duplicates', async () => {
      const secondAccessCode = `TEST${Date.now().toString().slice(-4)}3`;
      await sql`
        INSERT INTO access_codes (code, redeemed, created_at)
        VALUES (${secondAccessCode}, false, NOW())
      `;

      // Register with lowercase email
      const req1 = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail.toLowerCase(),
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res1 = createMockResponse();

      await registerHandler(req1 as NextApiRequest, res1 as NextApiResponse);
      expect(res1.status).toHaveBeenCalledWith(201);

      // Try to register with uppercase email
      const req2 = createMockRequest({
        accessCode: secondAccessCode,
        email: testEmail.toUpperCase(),
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res2 = createMockResponse();

      await registerHandler(req2 as NextApiRequest, res2 as NextApiResponse);

      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith({
        success: false,
        message: 'An account with this email already exists'
      });

      // Cleanup
      await sql`DELETE FROM access_codes WHERE code = ${secondAccessCode}`;
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after 5 attempts', async () => {
      const attempts: number[] = [];
      const now = Date.now();

      // Mock KV to simulate 5 previous attempts
      for (let i = 0; i < 5; i++) {
        attempts.push(now - (i * 1000)); // Spread attempts over last 5 seconds
      }

      (kv.get as jest.Mock).mockResolvedValue(attempts);

      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

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

    it('should allow request after rate limit window expires', async () => {
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      
      // Mock KV with old attempts (outside window)
      const oldAttempts = [
        now - windowMs - 1000, // 1 second before window
        now - windowMs - 2000,
        now - windowMs - 3000
      ];

      (kv.get as jest.Mock).mockResolvedValue(oldAttempts);

      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      // Should succeed because old attempts are outside window
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should reject weak passwords', async () => {
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'weak',
        confirmPassword: 'weak'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should reject invalid email format', async () => {
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: 'invalid-email',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should reject mismatched passwords', async () => {
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123',
        confirmPassword: 'DifferentPassword456'
      });
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({
        accessCode: testAccessCode,
        email: testEmail,
        password: 'TestPassword123'
      });
      req.method = 'GET';
      const res = createMockResponse();

      await registerHandler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Method not allowed'
      });
    });
  });
});
