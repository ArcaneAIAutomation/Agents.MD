/**
 * Unit Tests for Password Utilities
 * 
 * Tests password hashing and verification functionality.
 * Requirements: 2.2
 */

import { hashPassword, verifyPassword } from '../../../lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same input', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it('should generate different hashes for different inputs', async () => {
      const password1 = 'TestPassword123';
      const password2 = 'DifferentPassword456';
      
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Failed to hash password');
    });

    it('should throw error for non-string password', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow('Failed to hash password');
      await expect(hashPassword(undefined as any)).rejects.toThrow('Failed to hash password');
      await expect(hashPassword(123 as any)).rejects.toThrow('Failed to hash password');
    });
  });

  describe('verifyPassword', () => {
    it('should correctly validate matching passwords', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const correctPassword = 'TestPassword123';
      const incorrectPassword = 'WrongPassword456';
      const hash = await hashPassword(correctPassword);
      
      const isValid = await verifyPassword(incorrectPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject password with different case', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('testpassword123', hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      await expect(verifyPassword('', hash)).rejects.toThrow('Failed to verify password');
    });

    it('should throw error for invalid hash', async () => {
      const password = 'TestPassword123';
      
      // Empty hash should throw
      await expect(verifyPassword(password, '')).rejects.toThrow('Failed to verify password');
      
      // Invalid hash format - bcrypt will return false, not throw
      const result = await verifyPassword(password, 'invalid-hash');
      expect(result).toBe(false);
    });

    it('should throw error for non-string inputs', async () => {
      const hash = await hashPassword('TestPassword123');
      
      await expect(verifyPassword(null as any, hash)).rejects.toThrow('Failed to verify password');
      await expect(verifyPassword(undefined as any, hash)).rejects.toThrow('Failed to verify password');
      await expect(verifyPassword('TestPassword123', null as any)).rejects.toThrow('Failed to verify password');
    });

    it('should handle special characters in passwords', async () => {
      const password = 'Test@Pass#123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle long passwords', async () => {
      const password = 'A'.repeat(100) + '123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple hash and verify operations', async () => {
      const passwords = [
        'Password1',
        'Password2',
        'Password3'
      ];
      
      const hashes = await Promise.all(
        passwords.map(pwd => hashPassword(pwd))
      );
      
      // Verify correct passwords
      for (let i = 0; i < passwords.length; i++) {
        const isValid = await verifyPassword(passwords[i], hashes[i]);
        expect(isValid).toBe(true);
      }
      
      // Verify incorrect passwords
      const isValid1 = await verifyPassword(passwords[0], hashes[1]);
      const isValid2 = await verifyPassword(passwords[1], hashes[2]);
      
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });
});
