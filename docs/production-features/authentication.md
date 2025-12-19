# Authentication System Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: CRITICAL  
**Dependencies**: Supabase PostgreSQL, JWT

---

## Overview

The authentication system provides session-only JWT authentication with access code-based registration. Users must login every time they access the website - no persistent authentication across browser sessions.

---

## Features

### Core Capabilities
- **Access Code Registration**: One-time use codes for new user registration
- **JWT Authentication**: Secure token-based authentication
- **Session-Only Cookies**: Expire when browser closes
- **1-Hour Token Expiration**: Short-lived tokens for security
- **Database Verification**: Every request verified against database
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: Comprehensive authentication event tracking

### Security Features
- Password hashing with bcrypt (12 salt rounds)
- httpOnly secure cookies
- SameSite=Strict for CSRF protection
- SQL injection prevention (parameterized queries)
- XSS protection (security headers)

---

## Technical Architecture

### API Endpoints

```typescript
// Register new user
POST /api/auth/register
// Body: { accessCode, email, password, confirmPassword }
// Returns: { success, message, user }

// Login
POST /api/auth/login
// Body: { email, password }
// Returns: { success, message, user }

// Logout
POST /api/auth/logout
// Returns: { success, message }

// Get current user
GET /api/auth/me
// Returns: { success, user }

// CSRF token
GET /api/auth/csrf-token
// Returns: { csrfToken }
```

### Database Schema

```sql
-- Users table
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Access codes table
access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Sessions table
sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Audit logs table
auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
)
```

---

## Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@host:6543/postgres
JWT_SECRET=<32-byte-random-string>
CRON_SECRET=<32-byte-random-string>

# Optional (for rate limiting)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=<your-token>

# Configuration
JWT_EXPIRATION=1h
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

### Cookie Settings

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  // No maxAge - session cookie (expires when browser closes)
};
```

---

## Components

### Frontend Components

```
components/auth/
├── AuthProvider.tsx           # Authentication context
├── LoginForm.tsx              # Login form component
├── RegistrationForm.tsx       # Registration form
├── AccessGate.tsx             # Protected route wrapper
└── index.ts                   # Component exports
```

### Backend Files

```
lib/auth/
├── jwt.ts                     # JWT token utilities
├── password.ts                # Password hashing
└── auditLog.ts                # Audit logging

middleware/
├── auth.ts                    # Authentication middleware
├── rateLimit.ts               # Rate limiting
└── csrf.ts                    # CSRF protection
```

---

## Authentication Flow

### Registration Flow

```
1. User enters access code, email, password
   ↓
2. Frontend validates input
   ↓
3. POST /api/auth/register
   ↓
4. Backend validates access code (not redeemed)
   ↓
5. Password hashed with bcrypt
   ↓
6. User created in database
   ↓
7. Access code marked as redeemed
   ↓
8. JWT token generated
   ↓
9. Session created in database
   ↓
10. Cookie set (session-only)
   ↓
11. User redirected to dashboard
```

### Login Flow

```
1. User enters email, password
   ↓
2. POST /api/auth/login
   ↓
3. Rate limit check
   ↓
4. User lookup by email
   ↓
5. Password verification with bcrypt
   ↓
6. JWT token generated (1-hour expiry)
   ↓
7. Session created in database
   ↓
8. Cookie set (session-only)
   ↓
9. Audit log entry created
   ↓
10. User redirected to dashboard
```

### Request Authentication

```
1. Request received
   ↓
2. Cookie extracted
   ↓
3. JWT token verified
   ↓
4. Session lookup in database
   ↓
5. Session validity check (not expired)
   ↓
6. User attached to request
   ↓
7. Request proceeds
```

---

## Access Codes

### Available Codes (11 total)

```
1. BITCOIN2025 (primary test code)
2. BTC-SOVEREIGN-K3QYMQ-01
3. BTC-SOVEREIGN-AKCJRG-02
4. BTC-SOVEREIGN-LMBLRN-03
5. BTC-SOVEREIGN-HZKEI2-04
6. BTC-SOVEREIGN-WVL0HN-05
7. BTC-SOVEREIGN-48YDHG-06
8. BTC-SOVEREIGN-6HSNX0-07
9. BTC-SOVEREIGN-N99A5R-08
10. BTC-SOVEREIGN-DCO2DG-09
11. BTC-SOVEREIGN-BYE9UX-10
```

### Managing Access Codes

```typescript
// Query available codes
const result = await query(
  'SELECT code, redeemed FROM access_codes WHERE redeemed = FALSE'
);

// Mark code as redeemed
await query(
  'UPDATE access_codes SET redeemed = TRUE, redeemed_by = $1, redeemed_at = NOW() WHERE code = $2',
  [userId, code]
);
```

---

## Usage Patterns

### Protecting API Routes

```typescript
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id;
  const email = req.user!.email;
  
  // Protected logic here
}

export default withAuth(handler);
```

### Protecting Pages

```typescript
import { useAuth } from '../components/auth/AuthProvider';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;
  
  return <div>Protected content for {user.email}</div>;
}
```

---

## Error Handling

### Error Responses

```typescript
// Invalid credentials
{ success: false, error: 'Invalid email or password' }

// Rate limited
{ success: false, error: 'Too many attempts. Try again in 15 minutes.' }

// Invalid access code
{ success: false, error: 'Invalid or already used access code' }

// Session expired
{ success: false, error: 'Session expired. Please login again.' }
```

---

## Troubleshooting

### Common Issues

**Issue**: "Not authenticated" error
- Check cookie is being sent
- Verify JWT_SECRET matches
- Check session not expired

**Issue**: Rate limit triggered
- Wait 15 minutes
- Check for brute force attempts
- Review audit logs

**Issue**: Access code not working
- Verify code exists in database
- Check if already redeemed
- Ensure exact match (case-sensitive)

### Debug Commands

```bash
# Test registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"BITCOIN2025","email":"test@example.com","password":"SecurePass123!","confirmPassword":"SecurePass123!"}'

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

---

## Related Documentation

- **Steering**: `.kiro/steering/authentication.md`
- **Spec**: `.kiro/specs/secure-user-authentication/`
- **Security**: `SECURITY.md`
