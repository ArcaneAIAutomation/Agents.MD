/**
 * Authentication Input Validation Schemas
 * 
 * Provides Zod schemas for validating authentication-related inputs.
 * Ensures data integrity and security before processing.
 */

import { z } from 'zod';

/**
 * Email validation schema (RFC 5322 compliant)
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters');

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Access code validation schema
 * Format: Alphanumeric characters with optional hyphens
 * Examples: BITCOIN2025, BTC-SOVEREIGN-K3QYMQ-01
 */
const accessCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Access code is required')
  .min(8, 'Access code must be at least 8 characters')
  .max(50, 'Access code must be less than 50 characters')
  .regex(/^[A-Z0-9-]+$/, 'Access code must contain only uppercase letters, numbers, and hyphens');

/**
 * Registration request validation schema
 */
export const registrationSchema = z.object({
  accessCode: accessCodeSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
);

/**
 * Registration request type (inferred from schema)
 */
export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
});

/**
 * Login request type (inferred from schema)
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Password reset request validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

/**
 * Password reset request type
 */
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation validation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
);

/**
 * Password reset confirmation type
 */
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Validate registration input
 * 
 * @param data - Registration data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateRegistration(data: unknown) {
  return registrationSchema.safeParse(data);
}

/**
 * Validate login input
 * 
 * @param data - Login data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data);
}

/**
 * Validate password reset request
 * 
 * @param data - Password reset request data to validate
 * @returns Validation result with parsed data or errors
 */
export function validatePasswordResetRequest(data: unknown) {
  return passwordResetRequestSchema.safeParse(data);
}

/**
 * Validate password reset confirmation
 * 
 * @param data - Password reset confirmation data to validate
 * @returns Validation result with parsed data or errors
 */
export function validatePasswordResetConfirm(data: unknown) {
  return passwordResetConfirmSchema.safeParse(data);
}

/**
 * Format Zod validation errors for API responses
 * 
 * @param errors - Zod validation errors
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formatted[path] = error.message;
  });
  
  return formatted;
}

/**
 * Check password strength and return score
 * 
 * @param password - Password to check
 * @returns Strength score (0-4) and feedback
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Consider adding special characters');

  // Common patterns check
  if (/^[0-9]+$/.test(password)) {
    feedback.push('Avoid using only numbers');
    score = Math.max(0, score - 1);
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    feedback.push('Avoid using only letters');
    score = Math.max(0, score - 1);
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, score));

  return { score, feedback };
}

/**
 * Sanitize email input
 * 
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize access code input
 * 
 * @param code - Access code to sanitize
 * @returns Sanitized access code
 */
export function sanitizeAccessCode(code: string): string {
  return code.trim().toUpperCase();
}
