# Design Document

## Overview

This design document outlines the technical architecture for implementing a secure user authentication system for the Bitcoin Sovereign Technology platform. The system replaces client-side access code validation with a robust, server-side solution featuring Vercel Postgres database, JWT-based authentication, and one-time access code redemption.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Access Gate   │  │ Registration │  │  Login Form     │ │
│  │  Component     │  │    Form      │  │                 │ │
│  └────────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│           │                  │                    │          │
└───────────┼──────────────────┼────────────────────┼──────────┘
            │                  │                    │
            │ HTTP/HTTPS       │                    │
            │                  │                    │
┌───────────▼──────────────────▼────────────────────▼──────────┐
│                    Next.js API Routes                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth/   │  │ /api/auth/   │  │ /api/auth/   │      │
│  │  register    │  │   login      │  │   logout     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐     │
│  │         Authentication Middleware                   │     │
│  │  - JWT Validation                                   │     │
│  │  - Rate Limiting                                    │     │
│  │  - CSRF Protection                                  │     │
│  └──────┬──────────────────────────────────────────────┘     │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ SQL Queries
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                    Vercel Postgres Database                    │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   users table    │         │ access_codes     │           │
│  │  - id            │         │  - id            │           │
│  │  - email         │         │  - code          │           │
│  │  - password_hash │         │  - redeemed      │           │
│  │  - created_at    │         │  - redeemed_by   │           │
│  │  - updated_at    │         │  - redeemed_at   │           │
│  └──────────────────┘         └──────────────────┘           │
│                                                                │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │  auth_logs       │         │  sessions        │           │
│  │  - id            │         │  - id            │           │
│  │  - user_id       │         │  - user_id       │           │
│  │  - event_type    │         │  - token_hash    │           │
│  │  - ip_address    │         │  - expires_at    │           │
│  │  - timestamp     │         │  - created_at    │           │
│  └──────────────────┘         └──────────────────┘           │
└────────────────────────────────────────────────────────────────┘
          │
          │ Microsoft Graph API
          │
┌─────────▼─────────────────────────────────────────────────────┐
│              Office 365 Email System                           │
│  - Welcome emails                                              │
│  - Password reset emails                                       │
│  - Security alerts                                             │
└────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript 5.2
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Vercel Postgres (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken library)
- **Password Hashing**: bcrypt (12 salt rounds minimum)
- **Email**: Microsoft Graph API (Office 365)
- **Styling**: Tailwind CSS with Bitcoin Sovereign design system
- **Validation**: Zod for schema validation
- **Rate Limiting**: Vercel KV (Redis) for distributed rate limiting

## Components and Interfaces

### Frontend Components

#### 1. AccessGate Component (Enhanced)

**Location**: `components/AccessGate.tsx`

**Purpose**: Main authentication gate with registration and login forms

**Props**:
```typescript
interface AccessGateProps {
  onAuthenticated: () => void;
}
```

**State Management**:
```typescript
interface AccessGateState {
  mode: 'initial' | 'register' | 'login' | 'request-access';
  loading: boolean;
  error: string | null;
  success: string | null;
}
```

**Key Features**:
- Toggle between registration and login modes
- Real-time form validation
- Error and success message display
- Loading states during API calls
- Bitcoin Sovereign styling

#### 2. RegistrationForm Component

**Location**: `components/auth/RegistrationForm.tsx`

**Purpose**: Handle new user registration with access code

**Props**:
```typescript
interface RegistrationFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchToLogin: () => void;
}
```

**Form Fields**:
```typescript
interface RegistrationFormData {
  accessCode: string;      // 8-character alphanumeric
  email: string;           // Valid email format
  password: string;        // Min 8 chars, 1 uppercase, 1 number
  confirmPassword: string; // Must match password
}
```

**Validation Rules**:
- Access code: 8 characters, alphanumeric
- Email: RFC 5322 compliant
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- Confirm password: Must match password field

#### 3. LoginForm Component

**Location**: `components/auth/LoginForm.tsx`

**Purpose**: Handle user login with email and password

**Props**:
```typescript
interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchToRegister: () => void;
}
```

**Form Fields**:
```typescript
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean; // Optional: extend session to 30 days
}
```

#### 4. AuthProvider Component

**Location**: `components/auth/AuthProvider.tsx`

**Purpose**: Global authentication state management

**Context**:
```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegistrationFormData) => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

### Backend API Routes

#### 1. POST /api/auth/register

**Purpose**: Create new user account with access code redemption

**Request Body**:
```typescript
interface RegisterRequest {
  accessCode: string;
  email: string;
  password: string;
}
```

**Response**:
```typescript
interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
}
```

**Process Flow**:
1. Validate input data (Zod schema)
2. Check rate limiting (5 attempts per IP per 15 minutes)
3. Verify access code exists and is not redeemed
4. Check email is not already registered
5. Hash password with bcrypt (12 salt rounds)
6. Create user record in database
7. Mark access code as redeemed
8. Generate JWT token
9. Set httpOnly secure cookie
10. Send welcome email (async, non-blocking)
11. Log registration event
12. Return success response

**Error Handling**:
- 400: Invalid input data
- 409: Email already exists
- 410: Access code already redeemed
- 404: Access code not found
- 429: Rate limit exceeded
- 500: Server error

#### 2. POST /api/auth/login

**Purpose**: Authenticate user and create session

**Request Body**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response**:
```typescript
interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
  };
}
```

**Process Flow**:
1. Validate input data
2. Check rate limiting (5 attempts per email per 15 minutes)
3. Query user by email
4. Compare password hash with bcrypt
5. Generate JWT token (7 days or 30 days if rememberMe)
6. Set httpOnly secure cookie
7. Create session record
8. Log login event
9. Return success response

**Error Handling**:
- 400: Invalid input data
- 401: Invalid credentials (generic message)
- 429: Rate limit exceeded (after 5 failed attempts)
- 500: Server error

#### 3. POST /api/auth/logout

**Purpose**: Invalidate user session

**Request**: No body (uses cookie)

**Response**:
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

**Process Flow**:
1. Extract JWT from cookie
2. Verify JWT signature
3. Delete session record from database
4. Clear httpOnly cookie
5. Log logout event
6. Return success response

#### 4. GET /api/auth/me

**Purpose**: Get current authenticated user

**Request**: No body (uses cookie)

**Response**:
```typescript
interface MeResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
}
```

**Process Flow**:
1. Extract JWT from cookie
2. Verify JWT signature and expiration
3. Query user by ID from token
4. Return user data

**Error Handling**:
- 401: Invalid or expired token
- 404: User not found
- 500: Server error

#### 5. GET /api/admin/access-codes

**Purpose**: List all access codes and redemption status (admin only)

**Request**: No body (uses cookie, requires admin role)

**Response**:
```typescript
interface AccessCodesResponse {
  success: boolean;
  codes: Array<{
    id: string;
    code: string;
    redeemed: boolean;
    redeemedBy: string | null;
    redeemedAt: string | null;
    createdAt: string;
  }>;
}
```

### Middleware

#### 1. Authentication Middleware

**Location**: `middleware/auth.ts`

**Purpose**: Verify JWT token on protected routes

```typescript
export async function authMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  try {
    // Extract token from cookie
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    // Attach user to request
    req.user = { id: decoded.userId, email: decoded.email };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
```

#### 2. Rate Limiting Middleware

**Location**: `middleware/rateLimit.ts`

**Purpose**: Prevent brute force attacks

```typescript
interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number; // Max attempts per window
  keyGenerator: (req: NextApiRequest) => string; // Generate unique key
}

export async function rateLimitMiddleware(config: RateLimitConfig) {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const key = config.keyGenerator(req);
    const attempts = await getAttempts(key); // From Vercel KV
    
    if (attempts >= config.maxAttempts) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many attempts. Please try again later.' 
      });
    }
    
    await incrementAttempts(key, config.windowMs);
    next();
  };
}
```

## Data Models

### Database Schema

#### users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**TypeScript Interface**:
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### access_codes Table

```sql
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_redeemed ON access_codes(redeemed);
```

**TypeScript Interface**:
```typescript
interface AccessCode {
  id: string;
  code: string;
  redeemed: boolean;
  redeemedBy: string | null;
  redeemedAt: Date | null;
  createdAt: Date;
}
```

#### sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**TypeScript Interface**:
```typescript
interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}
```

#### auth_logs Table

```sql
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'register', 'failed_login'
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX idx_auth_logs_timestamp ON auth_logs(timestamp);
```

**TypeScript Interface**:
```typescript
interface AuthLog {
  id: string;
  userId: string | null;
  eventType: 'login' | 'logout' | 'register' | 'failed_login';
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  timestamp: Date;
}
```

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration
}
```

**Token Generation**:
```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' } // or '30d' for rememberMe
);
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  code?: string; // Optional error code for client handling
  details?: any; // Optional additional details (dev mode only)
}
```

### Error Categories

1. **Validation Errors (400)**
   - Invalid email format
   - Password too weak
   - Missing required fields
   - Invalid access code format

2. **Authentication Errors (401)**
   - Invalid credentials
   - Expired token
   - Missing token
   - Invalid token signature

3. **Authorization Errors (403)**
   - Insufficient permissions
   - Admin-only endpoint

4. **Resource Errors (404, 409, 410)**
   - User not found
   - Access code not found
   - Email already exists (409)
   - Access code already redeemed (410)

5. **Rate Limit Errors (429)**
   - Too many login attempts
   - Too many registration attempts

6. **Server Errors (500)**
   - Database connection failed
   - Email sending failed (non-blocking)
   - Unexpected errors

### Error Logging

```typescript
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    endpoint: string;
    userId?: string;
    ipAddress?: string;
  };
}
```

## Testing Strategy

### Unit Tests

**Test Files**:
- `__tests__/api/auth/register.test.ts`
- `__tests__/api/auth/login.test.ts`
- `__tests__/api/auth/logout.test.ts`
- `__tests__/utils/jwt.test.ts`
- `__tests__/utils/password.test.ts`

**Test Coverage**:
- Password hashing and verification
- JWT token generation and validation
- Input validation schemas
- Rate limiting logic
- Database query functions

### Integration Tests

**Test Scenarios**:
1. Complete registration flow
2. Complete login flow
3. Session persistence across requests
4. Access code redemption
5. Rate limiting enforcement
6. Token expiration handling
7. Logout and session cleanup

### End-to-End Tests

**Test Scenarios**:
1. New user registration with valid access code
2. Login with registered credentials
3. Access protected content while authenticated
4. Session expiration and re-login
5. Logout and access denial
6. Failed login attempts and rate limiting
7. Access code reuse prevention

### Security Tests

**Test Scenarios**:
1. SQL injection attempts
2. XSS attempts in form inputs
3. CSRF token validation
4. JWT token tampering
5. Brute force login attempts
6. Session hijacking attempts
7. Password strength enforcement

## Security Considerations

### Password Security

1. **Hashing**: bcrypt with 12 salt rounds minimum
2. **Strength Requirements**: 
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - Optional: Special characters
3. **Storage**: Never store plain text passwords
4. **Transmission**: HTTPS only

### Token Security

1. **JWT Secret**: Strong random string (256-bit minimum)
2. **Storage**: httpOnly, secure, sameSite cookies
3. **Expiration**: 7 days default, 30 days with rememberMe
4. **Rotation**: Generate new token on sensitive operations
5. **Invalidation**: Delete session record on logout

### Database Security

1. **Parameterized Queries**: Prevent SQL injection
2. **Connection Pooling**: Limit concurrent connections
3. **Encryption**: TLS for database connections
4. **Backups**: Automated daily backups
5. **Access Control**: Least privilege principle

### API Security

1. **Rate Limiting**: 5 attempts per 15 minutes
2. **CSRF Protection**: Token validation on state-changing requests
3. **Input Validation**: Zod schemas for all inputs
4. **Error Messages**: Generic messages, no system details
5. **CORS**: Restrict to platform domain only

### Audit Trail

1. **Log All Events**: Login, logout, registration, failures
2. **IP Address Tracking**: Record IP for security events
3. **Retention**: 90 days minimum
4. **Monitoring**: Alert on suspicious patterns
5. **Compliance**: GDPR-compliant logging

## Migration Strategy

### Phase 1: Database Setup (Day 1)

1. Create Vercel Postgres database
2. Run schema migrations
3. Import existing 11 access codes
4. Verify database connectivity
5. Test CRUD operations

### Phase 2: API Implementation (Day 1-2)

1. Implement authentication middleware
2. Build registration endpoint
3. Build login endpoint
4. Build logout endpoint
5. Build user info endpoint
6. Add rate limiting
7. Add error handling
8. Write unit tests

### Phase 3: Frontend Integration (Day 2)

1. Update AccessGate component
2. Create RegistrationForm component
3. Create LoginForm component
4. Create AuthProvider context
5. Update _app.tsx with AuthProvider
6. Add loading states
7. Add error displays
8. Test user flows

### Phase 4: Email Integration (Day 2)

1. Configure Office 365 credentials
2. Create email templates
3. Implement welcome email
4. Test email delivery
5. Add error handling for email failures

### Phase 5: Testing & Deployment (Day 3)

1. Run integration tests
2. Run security tests
3. Test on staging environment
4. Verify all 11 access codes work
5. Test migration from old system
6. Deploy to production
7. Monitor for issues
8. Remove old client-side code

### Rollback Plan

If critical issues arise:
1. Revert to previous deployment
2. Re-enable client-side access code validation
3. Investigate and fix issues
4. Re-deploy when stable

## Performance Considerations

### Database Optimization

1. **Indexes**: Email, access code, session token
2. **Connection Pooling**: Reuse database connections
3. **Query Optimization**: Use prepared statements
4. **Caching**: Cache user data in memory (5 minutes)

### API Optimization

1. **Response Compression**: Gzip/Brotli
2. **Minimal Payloads**: Return only necessary data
3. **Async Operations**: Non-blocking email sending
4. **Edge Functions**: Deploy to Vercel Edge for low latency

### Frontend Optimization

1. **Code Splitting**: Lazy load auth components
2. **Form Validation**: Client-side before API call
3. **Optimistic Updates**: Show success before confirmation
4. **Error Recovery**: Automatic retry on network errors

## Monitoring & Observability

### Metrics to Track

1. **Authentication Metrics**:
   - Registration success rate
   - Login success rate
   - Failed login attempts
   - Average response time

2. **Security Metrics**:
   - Rate limit hits
   - Invalid token attempts
   - Suspicious activity patterns

3. **Performance Metrics**:
   - API response times
   - Database query times
   - Email delivery success rate

4. **Business Metrics**:
   - Active users
   - Access code redemption rate
   - User retention

### Alerting

1. **Critical Alerts**:
   - Database connection failures
   - High error rates (>5%)
   - Security incidents

2. **Warning Alerts**:
   - Slow response times (>2s)
   - Email delivery failures
   - High rate limit hits

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=<256-bit-random-string>

# Office 365 Email
OFFICE365_CLIENT_ID=...
OFFICE365_CLIENT_SECRET=...
OFFICE365_TENANT_ID=...
OFFICE365_FROM_EMAIL=...

# Rate Limiting (Vercel KV)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Application
NEXT_PUBLIC_APP_URL=https://news.arcane.group
NODE_ENV=production
```

## Bitcoin Sovereign Design Integration

All authentication components follow the Bitcoin Sovereign design system:

### Colors
- Background: Pure black (#000000)
- Primary actions: Bitcoin orange (#F7931A)
- Text: White with opacity variants
- Borders: Thin orange (1-2px)

### Typography
- Headlines: Inter, 800 weight
- Body: Inter, 400 weight
- Data: Roboto Mono, 600 weight

### Components
- Forms: Black background, orange borders
- Buttons: Solid orange with black text (primary)
- Inputs: Black background, orange focus state
- Error messages: White text with orange icon
- Success messages: Orange text with glow effect

### Responsive Design
- Mobile-first approach
- Single-column layout on mobile
- Touch-friendly targets (48px minimum)
- Collapsible sections with orange headers

---

**Status**: ✅ Design Complete
**Version**: 1.0.0
**Last Updated**: January 26, 2025
**Next Step**: Implementation Plan (tasks.md)
