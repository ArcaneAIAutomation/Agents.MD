# CSRF Protection Implementation Guide

## Overview

This document describes the Cross-Site Request Forgery (CSRF) protection implementation for the Bitcoin Sovereign Technology authentication system.

## What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to submit unwanted requests to a web application. CSRF attacks specifically target state-changing requests, not theft of data, since the attacker has no way to see the response to the forged request.

## Implementation Architecture

### Components

1. **CSRF Middleware** (`middleware/csrf.ts`)
   - Generates cryptographically secure tokens
   - Stores tokens in memory (session-based)
   - Validates tokens on state-changing requests
   - Returns 403 Forbidden for invalid tokens

2. **CSRF Token API** (`pages/api/auth/csrf-token.ts`)
   - GET endpoint to retrieve CSRF tokens
   - Automatically creates tokens for new sessions
   - Returns existing tokens for active sessions

3. **AuthProvider Integration** (`components/auth/AuthProvider.tsx`)
   - Fetches CSRF token on initialization
   - Includes token in all state-changing requests
   - Provides token to child components

4. **Form Integration**
   - Hidden CSRF token fields in forms
   - Automatic token inclusion in request headers
   - Visual indication when token is missing

## How It Works

### Token Generation

```typescript
// Generate a 32-byte cryptographically secure token
const token = crypto.randomBytes(32).toString('hex');
```

### Token Storage

Tokens are stored in memory with the following structure:

```typescript
{
  sessionId: {
    token: "abc123...",
    expiresAt: 1234567890
  }
}
```

- **Session ID**: Derived from JWT token or IP address for guests
- **Token**: 64-character hexadecimal string
- **Expiration**: 24 hours from creation

### Token Validation

1. Extract token from request (header or body)
2. Get session ID from request
3. Retrieve stored token for session
4. Compare using timing-safe comparison
5. Return 403 if invalid or missing

### Request Flow

```
Client                    Server
  |                         |
  |-- GET /csrf-token ----->|
  |<-- { token: "abc" } ----|
  |                         |
  |-- POST /login --------->|
  |    X-CSRF-Token: abc    |
  |                         |
  |    [Validate Token]     |
  |                         |
  |<-- { success: true } ---|
```

## Protected Endpoints

CSRF protection is applied to all state-changing HTTP methods:

- **POST** - Create operations
- **PUT** - Update operations
- **DELETE** - Delete operations
- **PATCH** - Partial update operations

Safe methods (GET, HEAD, OPTIONS) do not require CSRF tokens.

## Usage Examples

### Fetching a CSRF Token

```typescript
const response = await fetch('/api/auth/csrf-token', {
  method: 'GET',
  credentials: 'include',
});

const { csrfToken } = await response.json();
```

### Including Token in Request

**Option 1: Header (Recommended)**

```typescript
await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ email, password }),
});
```

**Option 2: Request Body**

```typescript
await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    email, 
    password,
    csrfToken 
  }),
});
```

**Option 3: Hidden Form Field**

```html
<form method="POST" action="/api/auth/login">
  <input type="hidden" name="csrfToken" value="abc123..." />
  <input type="email" name="email" />
  <input type="password" name="password" />
  <button type="submit">Login</button>
</form>
```

## Security Considerations

### Token Generation

- Uses `crypto.randomBytes()` for cryptographic security
- 32 bytes (256 bits) of entropy
- Encoded as 64-character hexadecimal string

### Token Comparison

- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Constant-time comparison regardless of token match
- Prevents attackers from guessing tokens byte-by-byte

### Token Storage

- **Current**: In-memory storage (development)
- **Production**: Should use Redis or database
- Tokens expire after 24 hours
- Automatic cleanup of expired tokens

### Session Identification

- Authenticated users: JWT token from cookie
- Guest users: IP address (for pre-auth requests)
- Prevents token reuse across sessions

## Error Responses

### Missing Token (403)

```json
{
  "success": false,
  "message": "CSRF token missing",
  "code": "CSRF_TOKEN_MISSING"
}
```

### Invalid Token (403)

```json
{
  "success": false,
  "message": "Invalid CSRF token",
  "code": "CSRF_TOKEN_INVALID"
}
```

## Production Considerations

### Token Storage

Replace in-memory storage with persistent storage:

```typescript
// Use Redis for distributed systems
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function storeCsrfToken(sessionId: string, token: string): Promise<void> {
  await redis.setex(
    `csrf:${sessionId}`,
    86400, // 24 hours
    token
  );
}

export async function getCsrfToken(sessionId: string): Promise<string | null> {
  return await redis.get(`csrf:${sessionId}`);
}
```

### Token Rotation

Implement token rotation for enhanced security:

```typescript
// Rotate token after successful authentication
export async function rotateCsrfToken(sessionId: string): Promise<string> {
  const newToken = generateCsrfToken();
  await storeCsrfToken(sessionId, newToken);
  return newToken;
}
```

### Rate Limiting

Combine with rate limiting to prevent token enumeration:

```typescript
// Limit CSRF token requests
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.get('/api/auth/csrf-token', rateLimiter, getCsrfTokenHandler);
```

## Testing

### Unit Tests

```typescript
describe('CSRF Protection', () => {
  it('should generate unique tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    expect(token1).not.toBe(token2);
  });

  it('should validate correct tokens', () => {
    const sessionId = 'test-session';
    const token = createCsrfToken(sessionId);
    expect(validateCsrfToken(sessionId, token)).toBe(true);
  });

  it('should reject invalid tokens', () => {
    const sessionId = 'test-session';
    createCsrfToken(sessionId);
    expect(validateCsrfToken(sessionId, 'invalid-token')).toBe(false);
  });

  it('should reject expired tokens', async () => {
    const sessionId = 'test-session';
    const token = createCsrfToken(sessionId);
    
    // Fast-forward time
    jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours
    
    expect(validateCsrfToken(sessionId, token)).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('CSRF Protected Endpoints', () => {
  it('should reject POST without CSRF token', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('should accept POST with valid CSRF token', async () => {
    // Get CSRF token
    const tokenResponse = await fetch('/api/auth/csrf-token');
    const { csrfToken } = await tokenResponse.json();
    
    // Make authenticated request
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });
    
    expect(response.status).not.toBe(403);
  });
});
```

## Monitoring

### Metrics to Track

1. **CSRF Token Requests**
   - Total requests per hour
   - Unique sessions requesting tokens
   - Token generation failures

2. **CSRF Validation Failures**
   - Missing token attempts
   - Invalid token attempts
   - Expired token attempts
   - Source IP addresses

3. **Attack Patterns**
   - Repeated failures from same IP
   - Token enumeration attempts
   - Suspicious user agents

### Alerting

Set up alerts for:

- High rate of CSRF validation failures (>10% of requests)
- Repeated failures from single IP (>5 in 1 minute)
- Unusual spike in token requests (>1000% increase)

## Compliance

This CSRF implementation helps meet security requirements for:

- **OWASP Top 10**: A01:2021 – Broken Access Control
- **PCI DSS**: Requirement 6.5.9 (CSRF protection)
- **NIST**: SP 800-53 (Session Management)
- **GDPR**: Article 32 (Security of Processing)

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: CSRF Attacks](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [RFC 6749: OAuth 2.0 (CSRF considerations)](https://tools.ietf.org/html/rfc6749#section-10.12)

---

**Status**: ✅ CSRF Protection Implemented
**Version**: 1.0.0
**Last Updated**: January 26, 2025
**Requirements**: 9.1
