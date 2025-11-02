# Authentication System - Steering Guide

**Status**: ✅ **DEPLOYED AND OPERATIONAL**  
**Version**: 2.0.0 (Session-Only)  
**Last Updated**: January 27, 2025  
**Deployment**: Production (https://news.arcane.group)  
**Email Verification**: ✅ WORKING  
**Authentication Mode**: 🔐 **SESSION-ONLY (No Persistence)**

---

## Overview

Bitcoin Sovereign Technology uses a **session-only authentication system** with pure database verification. Users must login every time they access the website - no persistent authentication across browser sessions.

### Recent Overhaul (January 27, 2025)
**Session-Only Authentication Implemented**: Complete system overhaul to implement:
- ✅ Session-only cookies (expire when browser closes)
- ✅ 1-hour token expiration (instead of 7-30 days)
- ✅ Database verification on every request
- ✅ No automatic authentication check
- ✅ Enhanced logout with state clearing
- ✅ Cache prevention headers

**Key Change**: Users must login every time they open the browser. No persistent sessions.

---

## Architecture

### **Technology Stack**
- **Database**: Supabase PostgreSQL (connection pooling on port 6543)
- **Authentication**: JWT tokens with httpOnly secure cookies (SESSION-ONLY)
- **Token Expiration**: 1 hour (short-lived for security)
- **Cookie Persistence**: None (expires when browser closes)
- **Session Verification**: Database check on every request
- **Password Hashing**: bcrypt (12 salt rounds)
- **Rate Limiting**: In-memory fallback (upgrade to Upstash Redis recommended)
- **Session Storage**: Database-backed (sessions table)
- **Audit Logging**: Comprehensive event logging (auth_logs table)
- **Cache Prevention**: No-cache headers on all auth endpoints

### **Database Schema**
```sql
-- 4 tables with indexes and constraints
users (id, email, password_hash, created_at, updated_at)
access_codes (id, code, redeemed, redeemed_by, redeemed_at, created_at)
sessions (id, user_id, token_hash, expires_at, created_at)
auth_logs (id, user_id, event_type, ip_address, user_agent, success, error_message, timestamp)
```

---

## API Endpoints

### **Authentication Routes**
All routes are in `pages/api/auth/`:

```typescript
POST /api/auth/register
// Register new user with access code
// Body: { accessCode, email, password, confirmPassword }
// Returns: { success, message, user }
// Rate Limited: 5 attempts per 15 minutes

POST /api/auth/login
// Login with email and password
// Body: { email, password, rememberMe }
// Returns: { success, message, user }
// Sets httpOnly cookie with JWT token
// Rate Limited: 5 attempts per 15 minutes

POST /api/auth/logout
// Logout and invalidate session
// Requires: Valid JWT token in cookie
// Returns: { success, message }
// Clears httpOnly cookie

GET /api/auth/me
// Get current user info
// Requires: Valid JWT token in cookie
// Returns: { success, user }

GET /api/auth/csrf-token
// Get CSRF token for forms
// Returns: { csrfToken }
```

### **Admin Routes**
```typescript
GET /api/admin/access-codes
// List all access codes with redemption status
// Requires: Valid JWT token (admin role in future)
// Returns: { codes: [...] }
```

### **Cron Jobs**
```typescript
POST /api/cron/cleanup-sessions
// Clean up expired sessions (runs daily at 2 AM)
// Requires: CRON_SECRET header
// Returns: { deleted: number }
```

---

## Database Connection

### **Configuration**
```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### **Environment Variables**
```bash
# Required
DATABASE_URL=postgres://user:pass@host:6543/postgres
JWT_SECRET=<32-byte-random-string>
CRON_SECRET=<32-byte-random-string>

# Optional (for rate limiting)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=<your-token>

# Configuration
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

### **CRITICAL: Database URL Format**
```bash
# ✅ CORRECT (no sslmode parameter)
DATABASE_URL=postgres://user:pass@host:6543/postgres

# ❌ WRONG (conflicts with code-level SSL config)
DATABASE_URL=postgres://user:pass@host:6543/postgres?sslmode=require
```

---

## Security Features

### **Implemented**
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with httpOnly secure cookies
- ✅ SameSite=Strict for CSRF protection
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (security headers)
- ✅ Audit logging for all auth events
- ✅ Session management with database storage
- ✅ Access code one-time use enforcement
- ✅ HTTPS enforced on all endpoints

### **Security Headers**
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

---

## Usage Patterns

### **Protecting API Routes**
```typescript
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // User is guaranteed to exist
  const userId = req.user!.id;
  const email = req.user!.email;
  
  // Your protected logic here
}

export default withAuth(handler);
```

### **Protecting Pages**
```typescript
import { useAuth } from '../components/auth/AuthProvider';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;
  
  return <div>Protected content for {user.email}</div>;
}
```

### **Rate Limiting**
```typescript
import { withRateLimit, loginRateLimiter } from '../../../middleware/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your logic here
}

// Apply rate limiting: 5 attempts per 15 minutes
export default withRateLimit(loginRateLimiter, handler);
```

### **Audit Logging**
```typescript
import { logLogin, logFailedLogin, logRegistration } from '../../../lib/auth/auditLog';

// Log successful login
logLogin(userId, req);

// Log failed login
logFailedLogin(email, 'Invalid password', req);

// Log registration
logRegistration(userId, email, req);
```

---

## Access Codes

### **Available Codes** (11 total)
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

### **Managing Access Codes**
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

## Frontend Components

### **AuthProvider Context**
```typescript
import { AuthProvider, useAuth } from '../components/auth/AuthProvider';

// Wrap app in _app.tsx
<AuthProvider>
  <Component {...pageProps} />
</AuthProvider>

// Use in components
const { user, loading, login, logout, register } = useAuth();
```

### **Forms**
```typescript
import LoginForm from '../components/auth/LoginForm';
import RegistrationForm from '../components/auth/RegistrationForm';

// Use in pages
<LoginForm onSuccess={() => router.push('/dashboard')} />
<RegistrationForm onSuccess={() => router.push('/dashboard')} />
```

### **AccessGate**
```typescript
import AccessGate from '../components/AccessGate';

// Protect entire app
<AccessGate>
  <YourApp />
</AccessGate>
```

---

## Common Issues & Solutions

### **Issue 1: SSL Certificate Errors**
```
Error: self-signed certificate in certificate chain
```
**Solution**: Ensure `ssl: { rejectUnauthorized: false }` in Pool config

### **Issue 2: Rate Limiting Not Working**
```
Error: Upstash Redis client was passed an invalid URL
```
**Solution**: System uses in-memory fallback. Upgrade to Upstash Redis for distributed rate limiting.

### **Issue 3: JWT Token Not Found**
```
Error: Not authenticated. Please log in.
```
**Solution**: Check cookie is set with httpOnly, secure, and sameSite flags. Verify JWT_SECRET is set.

### **Issue 4: Database Connection Timeout**
```
Error: Connection timeout
```
**Solution**: Check DATABASE_URL is correct. Verify Supabase database is running. Check firewall settings.

---

## Testing

### **Automated Tests**
```powershell
# Run production verification
.\scripts\quick-verify-production.ps1

# Expected: 86% pass rate (6/7 tests)
# Only health check endpoint fails (non-critical)
```

### **Manual Testing**
```bash
# Test registration
curl -X POST https://news.arcane.group/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"BITCOIN2025","email":"test@example.com","password":"SecurePass123!","confirmPassword":"SecurePass123!"}'

# Test login
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Test current user
curl https://news.arcane.group/api/auth/me \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

---

## Monitoring

### **Vercel Function Logs**
1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Click latest deployment → Functions
4. View logs for `/api/auth/*` endpoints

### **Database Monitoring**
1. Go to https://supabase.com/dashboard
2. Select project → Database
3. View connection pool status
4. Check query performance

### **Key Metrics**
- Response time: < 100ms (target)
- Error rate: < 1% (target)
- Failed login rate: < 5% (target)
- Session duration: 7 days (default)
- Rate limit hits: Monitor for abuse

---

## Deployment Checklist

### **Before Deploying**
- [ ] All environment variables set in Vercel
- [ ] DATABASE_URL format correct (no ?sslmode=require)
- [ ] JWT_SECRET and CRON_SECRET generated
- [ ] Database migrations run
- [ ] Access codes imported
- [ ] Tests passing locally

### **After Deploying**
- [ ] Run verification script
- [ ] Test registration with access code
- [ ] Test login flow
- [ ] Verify session persistence
- [ ] Check error logs
- [ ] Monitor for 24 hours

---

## Future Enhancements

### **High Priority**
1. **Upgrade to Upstash Redis** - Distributed rate limiting
2. **Fix health check endpoint** - Achieve 100% test pass rate
3. **Add password reset** - Email-based password recovery

### **Medium Priority**
1. **Email verification** - Verify user email addresses
2. **Admin dashboard** - Manage users and access codes
3. **2FA/MFA** - Enhanced security with TOTP

### **Low Priority**
1. **OAuth providers** - Google, GitHub, Microsoft login
2. **User profiles** - Extended user information
3. **Activity logs** - User-facing activity history

---

## Best Practices

### **DO:**
- ✅ Use `withAuth` middleware for protected routes
- ✅ Use `withRateLimit` for authentication endpoints
- ✅ Log all authentication events with `logAuthEvent`
- ✅ Use parameterized queries to prevent SQL injection
- ✅ Hash passwords with bcrypt before storing
- ✅ Set httpOnly, secure, sameSite cookies
- ✅ Validate input with Zod schemas
- ✅ Handle errors gracefully with appropriate status codes

### **DON'T:**
- ❌ Store passwords in plain text
- ❌ Use `@vercel/postgres` (use custom `lib/db` module)
- ❌ Add `?sslmode=require` to DATABASE_URL
- ❌ Expose JWT_SECRET or CRON_SECRET
- ❌ Skip rate limiting on auth endpoints
- ❌ Return detailed error messages to clients
- ❌ Store sensitive data in JWT payload
- ❌ Use synchronous bcrypt operations

---

## Quick Reference

### **Key Files**
```
pages/api/auth/          # Authentication endpoints
lib/auth/                # Auth utilities (JWT, password, audit)
lib/db.ts                # Database connection and queries
middleware/auth.ts       # Authentication middleware
middleware/rateLimit.ts  # Rate limiting middleware
components/auth/         # Auth UI components
migrations/              # Database migrations
scripts/                 # Utility scripts
```

### **Key Commands**
```powershell
# Verify production
.\scripts\quick-verify-production.ps1

# Check database status
npx tsx scripts/check-database-status.ts

# Run migrations
npx tsx scripts/simple-migrate.ts

# Import access codes
npx tsx scripts/import-access-codes.ts
```

### **Key URLs**
```
Production: https://news.arcane.group
Vercel: https://vercel.com/dashboard
Supabase: https://supabase.com/dashboard
GitHub: https://github.com/ArcaneAIAutomation/Agents.MD
```

---

## Support & Documentation

### **Documentation Files**
- `AUTHENTICATION-SUCCESS.md` - Deployment summary
- `NEXT-STEPS.md` - Future roadmap
- `SESSION-SUMMARY.md` - Implementation timeline
- `FIXES-APPLIED.md` - Technical fixes
- `.kiro/specs/secure-user-authentication/` - Complete spec

### **Getting Help**
1. Check Vercel function logs for errors
2. Review Supabase database logs
3. Run verification script for diagnostics
4. Check this steering file for common issues
5. Review spec documentation for detailed requirements

---

**Status**: 🟢 **PRODUCTION READY**  
**Version**: 1.0.0  
**Last Verified**: January 26, 2025  
**Test Pass Rate**: 86% (6/7 tests passing)

**The authentication system is operational and ready for users!** 🚀
