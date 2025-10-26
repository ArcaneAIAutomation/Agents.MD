/**
 * Tests for Input Sanitization Utilities
 */

import {
  sanitizeEmail,
  sanitizeAccessCode,
  sanitizeText,
  sanitizeErrorMessage,
  sanitizeUrl,
  sanitizePassword,
  containsDangerousContent
} from '../sanitize';

describe('sanitizeEmail', () => {
  it('should trim whitespace and convert to lowercase', () => {
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeEmail('<script>alert("xss")</script>test@example.com')).toBe('test@example.com');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeEmail('javascript:alert(1)@example.com')).toBe('alert(1)@example.com');
  });

  it('should handle empty input', () => {
    expect(sanitizeEmail('')).toBe('');
    expect(sanitizeEmail(null as any)).toBe('');
  });
});

describe('sanitizeAccessCode', () => {
  it('should trim whitespace and convert to uppercase', () => {
    expect(sanitizeAccessCode('  abc123  ')).toBe('ABC123');
  });

  it('should remove non-alphanumeric characters', () => {
    expect(sanitizeAccessCode('ABC-123-XYZ')).toBe('ABC123XYZ');
    expect(sanitizeAccessCode('ABC@123#XYZ')).toBe('ABC123XYZ');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeAccessCode('<script>ABC123</script>')).toBe('ABC123');
  });

  it('should handle empty input', () => {
    expect(sanitizeAccessCode('')).toBe('');
    expect(sanitizeAccessCode(null as any)).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should trim whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeText('<b>hello</b> <i>world</i>')).toBe('hello world');
  });

  it('should remove script content', () => {
    expect(sanitizeText('hello javascript:alert(1) world')).toBe('hello alert(1) world');
  });

  it('should handle empty input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
  });
});

describe('sanitizeErrorMessage', () => {
  it('should escape HTML special characters', () => {
    const message = '<script>alert("xss")</script>';
    const sanitized = sanitizeErrorMessage(message);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;');
    expect(sanitized).toContain('&gt;');
  });

  it('should remove javascript: protocol', () => {
    const message = 'Error: javascript:alert(1)';
    const sanitized = sanitizeErrorMessage(message);
    expect(sanitized).not.toContain('javascript:');
  });

  it('should limit message length', () => {
    const longMessage = 'a'.repeat(600);
    const sanitized = sanitizeErrorMessage(longMessage);
    expect(sanitized.length).toBeLessThanOrEqual(503); // 500 + '...'
  });

  it('should return default message for empty input', () => {
    expect(sanitizeErrorMessage('')).toBe('An error occurred');
    expect(sanitizeErrorMessage(null as any)).toBe('An error occurred');
  });
});

describe('sanitizeUrl', () => {
  it('should allow valid http and https URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should reject dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeUrl('vbscript:alert(1)')).toBe('');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('should reject URLs without protocol', () => {
    expect(sanitizeUrl('example.com')).toBe('');
  });

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null as any)).toBe('');
  });
});

describe('sanitizePassword', () => {
  it('should trim whitespace', () => {
    expect(sanitizePassword('  password123  ')).toBe('password123');
  });

  it('should preserve special characters', () => {
    expect(sanitizePassword('P@ssw0rd!')).toBe('P@ssw0rd!');
  });

  it('should remove HTML tags', () => {
    expect(sanitizePassword('<script>password</script>')).toBe('password');
  });

  it('should handle empty input', () => {
    expect(sanitizePassword('')).toBe('');
    expect(sanitizePassword(null as any)).toBe('');
  });
});

describe('containsDangerousContent', () => {
  it('should detect script tags', () => {
    expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(containsDangerousContent('javascript:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsDangerousContent('onclick=alert(1)')).toBe(true);
    expect(containsDangerousContent('onload=alert(1)')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(containsDangerousContent('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(containsDangerousContent('hello world')).toBe(false);
    expect(containsDangerousContent('test@example.com')).toBe(false);
  });

  it('should handle empty input', () => {
    expect(containsDangerousContent('')).toBe(false);
    expect(containsDangerousContent(null as any)).toBe(false);
  });
});
