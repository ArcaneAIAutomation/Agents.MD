# Authentication API Integration Tests

## Overview

This directory contains comprehensive integration tests for the authentication API endpoints:

- **register.test.ts** - Registration flow tests
- **login.test.ts** - Login flow tests  
- **logout.test.ts** - Logout flow tests

## Requirements

These are **integration tests** that require:

1. **Database Connection**: A PostgreSQL database (Vercel Postgres or local)
2. **Environment Variables**: Properly configured `.env.local` file
3. **Dependencies**: All npm packages installed

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local` with:

```bash
# Database
DATABASE_URL=postgresql://...

# JWT Secret
JWT_SECRET=your-test-secret-key

# Vercel KV (for rate limiting)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Node Environment
NODE_ENV=test
```

### 3. Set Up Test Database

Run migrations to create required tables:

```bash
npx tsx scripts/run-migrations.ts
```

Required tables:
- `users`
- `access_codes`
- `sessions`
- `auth_logs`

## Running Tests

### Run All Authentication Tests

```bash
npm test -- __tests__/api/auth
```

### Run Specific Test File

```bash
# Registration tests
npm test -- __tests__/api/auth/register.test.ts

# Login tests
npm test -- __tests__/api/auth/login.test.ts

# Logout tests
npm test -- __tests__/api/auth/logout.test.ts
```

### Run with Coverage

```bash
npm test -- __tests__/api/auth --coverage
```

## Test Coverage

### Registration Flow Tests (register.test.ts)

✅ **Successful Registration**
- Register new user with valid access code
- Normalize email to lowercase
- Hash password with bcrypt
- Mark access code as redeemed
- Generate JWT token
- Set httpOnly cookie

✅ **Invalid Access Code**
- Reject non-existent access code (404)
- Reject empty access code (400)

✅ **Already-Redeemed Access Code**
- Reject already-redeemed code (410)
- Prevent code reuse

✅ **Duplicate Email**
- Reject existing email (409)
- Handle case-insensitive duplicates

✅ **Rate Limiting**
- Enforce 5 attempts per 15 minutes (429)
- Allow requests after window expires

✅ **Input Validation**
- Reject weak passwords
- Reject invalid email format
- Reject mismatched passwords

✅ **HTTP Method Validation**
- Reject non-POST requests (405)

### Login Flow Tests (login.test.ts)

✅ **Successful Login**
- Login with correct credentials
- Handle case-insensitive email
- Set 7-day expiration by default
- Create session in database
- Hash token before storage

✅ **RememberMe Functionality**
- Extend session to 30 days when enabled
- Verify token expiration
- Verify database session expiration

✅ **Incorrect Password**
- Reject wrong password (401)
- Return generic error message

✅ **Non-Existent Email**
- Reject non-existent email (401)
- Return same error as incorrect password

✅ **Rate Limiting**
- Enforce 5 attempts per email per 15 minutes (429)
- Rate limit by email address
- Allow login after window expires

✅ **Input Validation**
- Reject empty email
- Reject empty password
- Reject invalid email format

✅ **HTTP Method Validation**
- Reject non-POST requests (405)

✅ **Session Management**
- Create session record in database
- Hash token before storing
- Store expiration timestamp

### Logout Flow Tests (logout.test.ts)

✅ **Successful Logout**
- Logout with valid token
- Clear httpOnly cookie
- Delete session from database
- Handle multiple sessions correctly

✅ **Invalid Token**
- Reject logout without token (401)
- Reject invalid token (401)
- Reject expired token (401)
- Reject tampered token (401)

✅ **HTTP Method Validation**
- Reject non-POST requests (405)
- Reject PUT requests (405)
- Reject DELETE requests (405)

✅ **Session Not Found**
- Handle already-deleted session
- Handle expired session

✅ **Error Handling**
- Clear cookie even on database error
- Graceful error handling

✅ **Audit Logging**
- Log logout event
- Log IP address and user agent

✅ **Cookie Security**
- Set Secure flag in production
- Always set HttpOnly flag
- Always set SameSite=Strict

## Test Data Management

### Automatic Cleanup

Each test:
1. Creates unique test data in `beforeEach()`
2. Cleans up test data in `afterEach()`
3. Uses timestamps to ensure uniqueness

### Manual Cleanup

If tests fail and leave orphaned data:

```sql
-- Clean up test users
DELETE FROM users WHERE email LIKE '%test%@example.com';

-- Clean up test access codes
DELETE FROM access_codes WHERE code LIKE 'TEST%';

-- Clean up test sessions
DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '1 day';
```

## Troubleshooting

### Database Connection Errors

```
Error: DATABASE_URL environment variable is not set
```

**Solution**: Ensure `.env.local` has `DATABASE_URL` configured

### Rate Limiting Errors

```
Error: KV_URL environment variable is not set
```

**Solution**: Configure Vercel KV environment variables or mock KV in tests

### Test Timeouts

```
Error: Timeout - Async callback was not invoked within the 10000 ms timeout
```

**Solution**: Increase Jest timeout in `jest.config.js`:

```javascript
testTimeout: 30000, // 30 seconds
```

### Unique Constraint Violations

```
Error: duplicate key value violates unique constraint
```

**Solution**: Tests may not be cleaning up properly. Run manual cleanup SQL above.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx tsx scripts/run-migrations.ts
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run integration tests
        run: npm test -- __tests__/api/auth
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          JWT_SECRET: test-secret-key
          NODE_ENV: test
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Cleanup**: Always clean up test data in `afterEach()`
3. **Uniqueness**: Use timestamps to generate unique test data
4. **Mocking**: Mock external services (KV, email) to avoid side effects
5. **Assertions**: Test both success and failure cases
6. **Security**: Verify security headers and cookie flags
7. **Error Handling**: Test error scenarios and edge cases

## Requirements Coverage

These tests cover the following requirements from the spec:

- **1.1, 1.2**: One-time access code redemption
- **2.1, 2.3**: Secure user account creation
- **3.1, 3.3, 3.5**: Password-based login with rate limiting
- **4.3**: Secure session management and logout
- **8.1, 8.2, 8.3**: Audit logging
- **9.2, 9.4, 9.5**: API endpoint security

## Next Steps

After running these tests successfully:

1. ✅ Verify all tests pass
2. ✅ Check test coverage (aim for >80%)
3. ✅ Review any failing tests
4. ✅ Add tests to CI/CD pipeline
5. ✅ Document any test-specific environment setup

---

**Status**: ✅ Integration Tests Complete
**Last Updated**: January 2025
**Test Files**: 3
**Total Tests**: 50+
**Coverage**: Registration, Login, Logout flows
