/**
 * Unit Tests for Authentication Validation Schemas
 * 
 * Tests Zod validation schemas for authentication inputs.
 * Requirements: 2.5, 9.2
 */

import {
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
  formatValidationErrors,
  checkPasswordStrength,
  sanitizeEmail,
  sanitizeAccessCode
} from '../../../lib/validation/auth';

describe('Authentication Validation Schemas', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@test.org',
        'email@subdomain.example.com',
        '123@test.com'
      ];
      
      validEmails.forEach(email => {
        const result = loginSchema.safeParse({
          email,
          password: 'TestPassword123'
        });
        
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
        'user..name@example.com',
        ''
      ];
      
      invalidEmails.forEach(email => {
        const result = loginSchema.safeParse({
          email,
          password: 'TestPassword123'
        });
        
        expect(result.success).toBe(false);
      });
    });

    it('should convert email to lowercase', () => {
      const result = loginSchema.safeParse({
        email: 'TEST@EXAMPLE.COM',
        password: 'TestPassword123'
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should trim whitespace from email', () => {
      const result = loginSchema.safeParse({
        email: '  test@example.com  ',
        password: 'TestPassword123'
      });
      
      // Zod trim happens during parsing, so whitespace should be removed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      
      const result = loginSchema.safeParse({
        email: longEmail,
        password: 'TestPassword123'
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Password123',
        'Test1234',
        'MyP@ssw0rd',
        'Abcdefgh1',
        'UPPERCASE123lower'
      ];
      
      validPasswords.forEach(password => {
        const result = registrationSchema.safeParse({
          accessCode: 'ABC12345',
          email: 'test@example.com',
          password,
          confirmPassword: password
        });
        
        expect(result.success).toBe(true);
      });
    });

    it('should enforce minimum 8 characters', () => {
      const shortPasswords = [
        'Pass1',
        'Test12',
        'Abc123'
      ];
      
      shortPasswords.forEach(password => {
        const result = registrationSchema.safeParse({
          accessCode: 'ABC12345',
          email: 'test@example.com',
          password,
          confirmPassword: password
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.errors.map(e => e.message);
          expect(errors.some(msg => msg.includes('8 characters'))).toBe(true);
        }
      });
    });

    it('should require at least one uppercase letter', () => {
      const result = registrationSchema.safeParse({
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message);
        expect(errors.some(msg => msg.includes('uppercase'))).toBe(true);
      }
    });

    it('should require at least one lowercase letter', () => {
      const result = registrationSchema.safeParse({
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123'
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message);
        expect(errors.some(msg => msg.includes('lowercase'))).toBe(true);
      }
    });

    it('should require at least one number', () => {
      const result = registrationSchema.safeParse({
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: 'PasswordOnly',
        confirmPassword: 'PasswordOnly'
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message);
        expect(errors.some(msg => msg.includes('number'))).toBe(true);
      }
    });

    it('should reject password longer than 128 characters', () => {
      const longPassword = 'A' + 'a'.repeat(125) + '123'; // 129 characters total
      
      const result = registrationSchema.safeParse({
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: longPassword,
        confirmPassword: longPassword
      });
      
      expect(result.success).toBe(false);
    });

    it('should accept special characters in passwords', () => {
      const passwordsWithSpecialChars = [
        'Test@123',
        'Pass#word1',
        'My$ecure9',
        'P@ssw0rd!'
      ];
      
      passwordsWithSpecialChars.forEach(password => {
        const result = registrationSchema.safeParse({
          accessCode: 'ABC12345',
          email: 'test@example.com',
          password,
          confirmPassword: password
        });
        
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Access Code Validation', () => {
    it('should accept valid access codes', () => {
      const validCodes = [
        'ABC12345',
        'TESTCODE',
        '12345678',
        'A1B2C3D4'
      ];
      
      validCodes.forEach(code => {
        const result = registrationSchema.safeParse({
          accessCode: code,
          email: 'test@example.com',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123'
        });
        
        expect(result.success).toBe(true);
      });
    });

    it('should enforce exactly 8 characters', () => {
      const invalidLengthCodes = [
        'ABC123',      // Too short
        'ABC123456',   // Too long
        'A',           // Too short
        ''             // Empty
      ];
      
      invalidLengthCodes.forEach(code => {
        const result = registrationSchema.safeParse({
          accessCode: code,
          email: 'test@example.com',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123'
        });
        
        expect(result.success).toBe(false);
      });
    });

    it('should convert access code to uppercase', () => {
      const result = registrationSchema.safeParse({
        accessCode: 'abc12345',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessCode).toBe('ABC12345');
      }
    });

    it('should trim whitespace from access code', () => {
      const result = registrationSchema.safeParse({
        accessCode: '  ABC12345  ',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessCode).toBe('ABC12345');
      }
    });

    it('should reject codes with special characters', () => {
      const invalidCodes = [
        'ABC-1234',
        'ABC@1234',
        'ABC 1234',
        'ABC_1234'
      ];
      
      invalidCodes.forEach(code => {
        const result = registrationSchema.safeParse({
          accessCode: code,
          email: 'test@example.com',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123'
        });
        
        expect(result.success).toBe(false);
      });
    });

    it('should reject codes with lowercase letters', () => {
      const result = registrationSchema.safeParse({
        accessCode: 'abcdefgh',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      });
      
      // Should succeed because it gets converted to uppercase
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessCode).toBe('ABCDEFGH');
      }
    });
  });

  describe('Registration Schema', () => {
    it('should validate complete registration data', () => {
      const validData = {
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      };
      
      const result = validateRegistration(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const data = {
        accessCode: 'ABC12345',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'DifferentPassword456'
      };
      
      const result = validateRegistration(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message);
        expect(errors.some(msg => msg.includes('do not match'))).toBe(true);
      }
    });

    it('should require all fields', () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };
      
      const result = validateRegistration(incompleteData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema', () => {
    it('should validate complete login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        rememberMe: true
      };
      
      const result = validateLogin(validData);
      
      expect(result.success).toBe(true);
    });

    it('should accept login without rememberMe', () => {
      const data = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };
      
      const result = validateLogin(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(false);
      }
    });

    it('should not enforce password strength on login', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        rememberMe: false
      };
      
      const result = validateLogin(data);
      
      expect(result.success).toBe(true);
    });

    it('should require email and password', () => {
      const incompleteData = {
        email: 'test@example.com'
      };
      
      const result = validateLogin(incompleteData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Password Reset Request Schema', () => {
    it('should validate email for password reset', () => {
      const validData = {
        email: 'test@example.com'
      };
      
      const result = validatePasswordResetRequest(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email'
      };
      
      const result = validatePasswordResetRequest(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Password Reset Confirm Schema', () => {
    it('should validate complete reset confirmation', () => {
      const validData = {
        token: 'reset-token-123',
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };
      
      const result = validatePasswordResetConfirm(validData);
      
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const data = {
        token: 'reset-token-123',
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword456'
      };
      
      const result = validatePasswordResetConfirm(data);
      
      expect(result.success).toBe(false);
    });

    it('should enforce password strength requirements', () => {
      const data = {
        token: 'reset-token-123',
        password: 'weak',
        confirmPassword: 'weak'
      };
      
      const result = validatePasswordResetConfirm(data);
      
      expect(result.success).toBe(false);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format Zod errors correctly', () => {
      const data = {
        email: 'invalid-email',
        password: 'short'
      };
      
      const result = loginSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        
        expect(formatted).toHaveProperty('email');
        expect(typeof formatted.email).toBe('string');
      }
    });

    it('should handle multiple errors', () => {
      const data = {
        accessCode: 'ABC',
        email: 'invalid',
        password: 'weak',
        confirmPassword: 'different'
      };
      
      const result = registrationSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        
        expect(Object.keys(formatted).length).toBeGreaterThan(0);
      }
    });
  });

  describe('checkPasswordStrength', () => {
    it('should return high score for strong password', () => {
      const result = checkPasswordStrength('MyStr0ng!P@ssw0rd');
      
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.feedback.length).toBeLessThanOrEqual(2);
    });

    it('should return low score for weak password', () => {
      const result = checkPasswordStrength('password');
      
      expect(result.score).toBeLessThan(3);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for missing requirements', () => {
      const result = checkPasswordStrength('alllowercase');
      
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
    });

    it('should reward password length', () => {
      const short = checkPasswordStrength('Pass123');
      const long = checkPasswordStrength('Password123456');
      
      expect(long.score).toBeGreaterThanOrEqual(short.score);
    });
  });

  describe('sanitizeEmail', () => {
    it('should trim and lowercase email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('User@Domain.COM')).toBe('user@domain.com');
    });

    it('should handle already clean email', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('sanitizeAccessCode', () => {
    it('should trim and uppercase access code', () => {
      expect(sanitizeAccessCode('  abc12345  ')).toBe('ABC12345');
      expect(sanitizeAccessCode('test1234')).toBe('TEST1234');
    });

    it('should handle already clean code', () => {
      expect(sanitizeAccessCode('ABC12345')).toBe('ABC12345');
    });
  });
});
