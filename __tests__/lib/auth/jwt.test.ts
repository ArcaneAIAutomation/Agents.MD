/**
 * Unit Tests for JWT Utilities
 * 
 * Tests JWT token generation, verification, and decoding.
 * Requirements: 3.2, 4.5
 */

import { generateToken, verifyToken, decodeToken, isTokenExpired } from '../../../lib/auth/jwt';
import jwt from 'jsonwebtoken';

// Mock environment variable for testing
const TEST_JWT_SECRET = 'test-secret-key-for-unit-tests-only';

describe('JWT Utilities', () => {
  // Set up test environment
  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('generateToken', () => {
    it('should create a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId and email in token payload', () => {
      const payload = {
        userId: 'user-456',
        email: 'user@test.com'
      };
      
      const token = generateToken(payload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should set default expiration to 7 days', () => {
      const payload = {
        userId: 'user-789',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      const expirationTime = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      
      expect(expirationTime).toBe(sevenDaysInSeconds);
    });

    it('should accept custom expiration time', () => {
      const payload = {
        userId: 'user-101',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload, '30d');
      const decoded = jwt.decode(token) as any;
      
      const expirationTime = decoded.exp - decoded.iat;
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      
      expect(expirationTime).toBe(thirtyDaysInSeconds);
    });

    it('should throw error for missing userId', () => {
      const payload = {
        userId: '',
        email: 'test@example.com'
      };
      
      expect(() => generateToken(payload)).toThrow('Failed to generate JWT token');
    });

    it('should throw error for missing email', () => {
      const payload = {
        userId: 'user-123',
        email: ''
      };
      
      expect(() => generateToken(payload)).toThrow('Failed to generate JWT token');
    });

    it('should throw error when JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const payload = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      
      expect(() => generateToken(payload)).toThrow('Failed to generate JWT token');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should validate correct tokens', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      const verified = verifyToken(token);
      
      expect(verified).toBeDefined();
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
    });

    it('should include iat and exp in verified payload', () => {
      const payload = {
        userId: 'user-456',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      const verified = verifyToken(token);
      
      expect(verified.iat).toBeDefined();
      expect(verified.exp).toBeDefined();
      expect(typeof verified.iat).toBe('number');
      expect(typeof verified.exp).toBe('number');
    });

    it('should reject expired tokens', () => {
      const payload = {
        userId: 'user-789',
        email: 'test@example.com'
      };
      
      // Create token that expires immediately
      const token = generateToken(payload, '0s');
      
      // Wait a moment to ensure expiration
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => verifyToken(token)).toThrow('Token has expired');
      });
    });

    it('should reject tampered tokens', () => {
      const payload = {
        userId: 'user-101',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      
      // Tamper with the token by changing a character
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      
      expect(() => verifyToken(tamperedToken)).toThrow('Invalid token signature');
    });

    it('should reject tokens with wrong secret', () => {
      const payload = {
        userId: 'user-202',
        email: 'test@example.com'
      };
      
      // Create token with different secret
      const wrongToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '7d' });
      
      expect(() => verifyToken(wrongToken)).toThrow('Invalid token signature');
    });

    it('should reject malformed tokens', () => {
      expect(() => verifyToken('not-a-valid-token')).toThrow('Invalid token signature');
      expect(() => verifyToken('invalid.token.format')).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Failed to verify token');
    });

    it('should throw error for non-string token', () => {
      expect(() => verifyToken(null as any)).toThrow('Failed to verify token');
      expect(() => verifyToken(undefined as any)).toThrow('Failed to verify token');
      expect(() => verifyToken(123 as any)).toThrow('Failed to verify token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        userId: 'user-303',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it('should decode expired token', () => {
      const payload = {
        userId: 'user-404',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload, '0s');
      
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        const decoded = decodeToken(token);
        
        expect(decoded).toBeDefined();
        expect(decoded?.userId).toBe(payload.userId);
      });
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not-a-valid-token');
      
      expect(decoded).toBeNull();
    });

    it('should throw error for empty token', () => {
      expect(() => decodeToken('')).toThrow('Failed to decode token');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const payload = {
        userId: 'user-505',
        email: 'test@example.com'
      };
      
      const token = generateToken(payload, '1h');
      const expired = isTokenExpired(token);
      
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create a token that's already expired by manually setting exp in the past
      const expiredToken = jwt.sign(
        {
          userId: 'user-606',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        TEST_JWT_SECRET
      );
      
      const expired = isTokenExpired(expiredToken);
      
      expect(expired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid-token');
      
      expect(expired).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      // Create token without expiration
      const tokenWithoutExp = jwt.sign(
        { userId: 'user-707', email: 'test@example.com' },
        TEST_JWT_SECRET
      );
      
      const expired = isTokenExpired(tokenWithoutExp);
      
      expect(expired).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete token lifecycle', () => {
      const payload = {
        userId: 'user-808',
        email: 'integration@test.com'
      };
      
      // Generate token
      const token = generateToken(payload, '1h');
      expect(token).toBeDefined();
      
      // Verify token
      const verified = verifyToken(token);
      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      
      // Decode token
      const decoded = decodeToken(token);
      expect(decoded?.userId).toBe(payload.userId);
      
      // Check expiration
      const expired = isTokenExpired(token);
      expect(expired).toBe(false);
    });

    it('should handle multiple tokens for different users', () => {
      const users = [
        { userId: 'user-1', email: 'user1@test.com' },
        { userId: 'user-2', email: 'user2@test.com' },
        { userId: 'user-3', email: 'user3@test.com' }
      ];
      
      const tokens = users.map(user => generateToken(user));
      
      tokens.forEach((token, index) => {
        const verified = verifyToken(token);
        expect(verified.userId).toBe(users[index].userId);
        expect(verified.email).toBe(users[index].email);
      });
    });
  });
});
