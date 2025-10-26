# End-to-End and Security Tests Documentation

## Overview

This document describes the comprehensive end-to-end (E2E) and security tests implemented for the secure user authentication system.

## Test Files Created

### 1. End-to-End Tests (`__tests__/e2e/auth-flow.test.ts`)

**Purpose**: Test complete user authentication journeys from registration through login to accessing protected content.

**Test Coverage**:

#### Complete Registration → Login → Access Content Flow
- ✅ Full authentication journey (register → access content → logout → login → access content)
- ✅ User data consistency across all endpoints
- ✅ Token generation and validation
- ✅ Session creation and management

#### Session Persistence Across Page Refreshes
- ✅ Session maintains across multiple requests
- ✅ Session data persists in database
- ✅ Concurrent requests with same token
- ✅ Session integrity verification

#### Session Expiration and Re-login
- ✅ Token expiration detection
- ✅ Re-login after session expires
- ✅ New session creation on re-login
- ✅ Old token invalidation

#### Access Code Reuse Prevention
- ✅ Prevents reusing already-redeemed access codes
- ✅ Maintains redemption data permanently
- ✅ Tracks which user redeemed which code
- ✅ Redemption timestamp tracking

#### Error Recovery and Edge Cases
- ✅ Network interruption handling
- ✅ Multiple logout attempts
- ✅ Graceful error handling

**Requirements Covered**: 1.1, 2.1, 3.1, 4.1, 4.2

---

### 2. Security Tests (`__tests__/security/auth.test.ts`)

**Purpose**: Validate security measures and prevent common attack vectors.

**Test Coverage**:

#### SQL Injection Prevention
- ✅ Registration email field injection attempts
- ✅ Login email field injection attempts
- ✅ Access code field injection attempts
- ✅ Parameterized query verification
- ✅ Database integrity after attack attempts

**Attack Vectors Tested**:
- `admin'--`
- `admin' OR '1'='1`
- `'; DROP TABLE users; --`
- `admin' UNION SELECT * FROM users--`
- And 6+ more SQL injection patterns

#### XSS Prevention in Form Inputs
- ✅ Email field XSS attempts
- ✅ Access code field XSS attempts
- ✅ Error message sanitization
- ✅ Safe error messages without user input

**Attack Vectors Tested**:
- `<script>alert("XSS")</script>`
- `<img src=x onerror=alert(1)>`
- `<iframe src="javascript:alert(1)">`
- `<body onload=alert(1)>`
- And more XSS patterns

#### CSRF Token Validation
- ✅ Missing CSRF token detection
- ✅ Invalid CSRF token rejection
- ✅ Valid CSRF token acceptance
- ✅ State-changing request protection

#### JWT Tampering Detection
- ✅ Tampered payload detection
- ✅ Modified signature detection
- ✅ Wrong secret detection
- ✅ Malformed token rejection
- ✅ Signature verification on every request

**Tampering Scenarios Tested**:
- Modified payload with valid signature
- Valid payload with modified signature
- Tokens signed with wrong secret
- Malformed JWT structures

#### Rate Limiting Enforcement
- ✅ Registration endpoint rate limiting
- ✅ Login endpoint rate limiting
- ✅ Retry-After header setting
- ✅ IP-based rate limiting (registration)
- ✅ Email-based rate limiting (login)
- ✅ Rate limit window expiration

#### Security Headers and Cookie Flags
- ✅ HttpOnly flag on auth cookies
- ✅ Secure flag on auth cookies
- ✅ SameSite flag on auth cookies
- ✅ Cookie security compliance

#### Input Validation and Sanitization
- ✅ Strict email format validation
- ✅ Password strength enforcement
- ✅ Email trimming and normalization
- ✅ Input sanitization before database operations

**Requirements Covered**: 9.1, 9.2, 9.3, 9.4, 9.5

---

## Running the Tests

### Prerequisites

The tests require database credentials to be configured. Set the following environment variables:

```bash
# Required for tests
POSTGRES_URL=postgresql://...
JWT_SECRET=your-secret-key
```

### Run All Tests

```bash
npm test
```

### Run E2E Tests Only

```bash
npm test -- __tests__/e2e/auth-flow.test.ts
```

### Run Security Tests Only

```bash
npm test -- __tests__/security/auth.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

---

## Test Structure

### Helper Functions

Both test files include helper functions for creating mock requests and responses:

```typescript
// Create mock Next.js API request
function createMockRequest(
  method: string,
  body: any = {},
  headers: any = {},
  cookies: any = {}
): Partial<NextApiRequest>

// Create mock Next.js API response
function createMockResponse(): any

// Extract JWT token from Set-Cookie header
function extractTokenFromResponse(res: any): string | null
```

### Test Lifecycle

Each test follows this pattern:

1. **beforeEach**: Set up test data (access codes, users)
2. **Test Execution**: Run the test scenario
3. **afterEach**: Clean up test data from database

### Mocking Strategy

- **Vercel KV**: Mocked for rate limiting tests
- **Database**: Real database connections (requires POSTGRES_URL)
- **API Handlers**: Real implementations (no mocking)

---

## Test Expectations

### Database Requirements

Tests expect the following database schema:
- `users` table with columns: id, email, password_hash, created_at, updated_at
- `access_codes` table with columns: id, code, redeemed, redeemed_by, redeemed_at, created_at
- `sessions` table with columns: id, user_id, token_hash, expires_at, created_at
- `auth_logs` table with columns: id, user_id, event_type, ip_address, user_agent, success, error_message, timestamp

### Environment Setup

For local testing, create a `.env.test` file:

```bash
POSTGRES_URL=postgresql://localhost:5432/test_db
JWT_SECRET=test-secret-key-for-testing-only
```

---

## Security Test Results

When properly configured, the security tests validate:

### ✅ SQL Injection Protection
- All parameterized queries prevent SQL injection
- No database tables can be dropped via injection
- No unauthorized data access via UNION attacks

### ✅ XSS Protection
- All user input is sanitized before display
- Error messages never echo user input
- Script tags are stripped from all inputs

### ✅ CSRF Protection
- State-changing requests require CSRF tokens
- Invalid tokens are rejected with 403
- Token validation on every request

### ✅ JWT Security
- Tampered tokens are immediately rejected
- Signature verification on every request
- Expired tokens cannot be used

### ✅ Rate Limiting
- Brute force attacks are prevented
- 5 attempts per 15-minute window enforced
- Retry-After headers guide clients

### ✅ Cookie Security
- HttpOnly prevents JavaScript access
- Secure ensures HTTPS-only transmission
- SameSite prevents CSRF attacks

---

## Continuous Integration

These tests should be run in CI/CD pipelines before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm test -- __tests__/e2e/
  env:
    POSTGRES_URL: ${{ secrets.TEST_POSTGRES_URL }}
    JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}

- name: Run Security Tests
  run: npm test -- __tests__/security/
  env:
    POSTGRES_URL: ${{ secrets.TEST_POSTGRES_URL }}
    JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
```

---

## Troubleshooting

### Database Connection Errors

If you see `missing_connection_string` errors:
1. Ensure `POSTGRES_URL` is set in your environment
2. Verify the connection string format
3. Check database is accessible from your machine

### Test Timeouts

If tests timeout:
1. Increase Jest timeout: `jest.setTimeout(30000)`
2. Check database performance
3. Verify network connectivity

### Mock Issues

If KV mocks aren't working:
1. Ensure `@vercel/kv` is properly mocked
2. Reset mocks in `beforeEach`
3. Check mock return values

---

## Future Enhancements

Potential additions to the test suite:

1. **Browser E2E Tests**: Use Playwright/Cypress for real browser testing
2. **Load Testing**: Test system under high concurrent load
3. **Penetration Testing**: Automated security scanning
4. **Performance Tests**: Measure response times and throughput
5. **Chaos Engineering**: Test system resilience under failures

---

**Status**: ✅ Complete
**Test Count**: 27 tests (13 E2E + 14 Security)
**Coverage**: Requirements 1.1, 2.1, 3.1, 4.1, 4.2, 9.1, 9.2, 9.3, 9.4, 9.5
**Last Updated**: January 26, 2025
