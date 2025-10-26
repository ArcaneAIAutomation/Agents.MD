/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input and prevent XSS attacks.
 * Requirements: 9.2, 9.3
 */

/**
 * Sanitize email input
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove any potentially dangerous characters
 * 
 * @param email - Raw email input
 * @returns Sanitized email string
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Trim whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any script-related content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize access code input
 * - Trim whitespace
 * - Convert to uppercase
 * - Remove any non-alphanumeric characters
 * 
 * @param code - Raw access code input
 * @returns Sanitized access code string
 */
export function sanitizeAccessCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  // Trim whitespace and convert to uppercase
  let sanitized = code.trim().toUpperCase();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any non-alphanumeric characters (only allow A-Z, 0-9)
  sanitized = sanitized.replace(/[^A-Z0-9]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize general text input
 * - Trim whitespace
 * - Remove HTML tags
 * - Escape special characters
 * 
 * @param text - Raw text input
 * @returns Sanitized text string
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script-related content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize error messages to prevent XSS
 * - Remove any HTML tags
 * - Escape special characters
 * - Remove script-related content
 * 
 * @param message - Raw error message
 * @returns Sanitized error message safe for display
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  // Trim whitespace
  let sanitized = message.trim();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script-related content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  // Escape special HTML characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length to prevent DoS
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }

  return sanitized;
}

/**
 * Sanitize URL input
 * - Trim whitespace
 * - Validate URL format
 * - Remove dangerous protocols
 * 
 * @param url - Raw URL input
 * @returns Sanitized URL string or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = url.trim();

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];

  for (const protocol of dangerousProtocols) {
    if (sanitized.toLowerCase().startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http and https protocols
  if (!sanitized.match(/^https?:\/\//i)) {
    return '';
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize object by applying sanitization to all string values
 * Useful for sanitizing entire request bodies
 * 
 * @param obj - Object with potentially unsafe string values
 * @returns Object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize password input
 * Note: Does not hash the password, only sanitizes
 * 
 * @param password - Raw password input
 * @returns Sanitized password string
 */
export function sanitizePassword(password: string): string {
  if (!password || typeof password !== 'string') {
    return '';
  }

  // Trim whitespace only (preserve password characters)
  let sanitized = password.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove any HTML tags (shouldn't be in password)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized;
}

/**
 * Check if a string contains potentially dangerous content
 * 
 * @param input - String to check
 * @returns true if dangerous content detected
 */
export function containsDangerousContent(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}
