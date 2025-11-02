# Authentication System - Quick Reference

**Version**: 2.0.0 (Session-Only)  
**Last Updated**: January 27, 2025

---

## 🔐 Core Principles

1. **Session-Only**: Cookies expire when browser closes
2. **Database-Verified**: Every request checks database
3. **Short-Lived**: Tokens expire after 1 hour
4. **No Caching**: All auth responses have cache prevention
5. **Force Login**: Users must login every time

---

## 🚀 Quick Start

### Login Flow
```typescript
// 1. User submits credentials
const { login } = useAuth();
await login(email, password);

// 2. Server creates session (1 hour)
// 3. Cookie set (expires when browser closes)
// 4. User authenticated
```

### Logout Flow
```typescript
// 1. User clicks logout
const { logout } = useAuth();
await logout();

// 2. Session deleted from database
// 3. Cookie cleared
// 4. Page reloads to login screen
```

---

## 📋 API Endpoints

### POST /api/auth/login
```bash
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Cookie Set:**
```
auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
```

---

### POST /api/auth/logout
```bash
curl -X POST https://news.arcane.group/api/auth/logout \
  -H "Cookie: auth_token=<jwt>"
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookie Cleared:**
```
auth_token=; Max-Age=0
```

---

### GET /api/auth/me
```bash
curl https://news.arcane.group/api/auth/me \
  -H "Cookie: auth_token=<jwt>"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-01-27T00:00:00.000Z"
  }
}
```

---

## 🔧 React Hooks

### useAuth Hook
```typescript
import { useAuth } from '../components/auth/AuthProvider';

function MyComponent() {
  const {
    user,              // Current user or null
    isAuthenticated,   // Boolean
    isLoading,         // Boolean
    error,             // Error message or null
    login,             // (email, password) => Promise<void>
    logout,            // () => Promise<void>
    register,          // (data) => Promise<void>
    checkAuth,         // () => Promise<void>
    clearError         // () => void
  } = useAuth();

  // Use authentication state
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <LoginForm />;
  
  return <div>Welcome {user.email}</div>;
}
```

---

## 🛡️ Protecting Routes

### API Routes
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

### Pages
```typescript
import { useAuth } from '../components/auth/AuthProvider';

export default function ProtectedPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;
  
  return <div>Protected content</div>;
}
```

---

## ⏱️ Session Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Opens Browser                                   │
│    └─> No cookie → Show login screen                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Logs In                                         │
│    └─> Session created (1 hour expiry)                 │
│    └─> Cookie set (expires when browser closes)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. User Browses Site                                    │
│    └─> Every request verifies session in database      │
│    └─> Token valid for 1 hour                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Session Ends (One of Three Ways)                    │
│    A. User closes browser → Cookie deleted             │
│    B. 1 hour passes → Token expires                    │
│    C. User clicks logout → Session deleted             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Next Visit                                           │
│    └─> Must login again                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Database Queries

### Check Active Sessions
```sql
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.expires_at,
  s.created_at,
  CASE 
    WHEN s.expires_at > NOW() THEN 'active'
    ELSE 'expired'
  END as status
FROM sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
```

### Delete Expired Sessions
```sql
DELETE FROM sessions 
WHERE expires_at < NOW();
```

### Revoke User Sessions
```sql
DELETE FROM sessions 
WHERE user_id = '<user-id>';
```

### Count Active Sessions
```sql
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > NOW();
```

---

## 🐛 Troubleshooting

### Issue: "Session not found"
**Cause**: Session deleted or never created  
**Solution**: User must login again

### Issue: "Token has expired"
**Cause**: More than 1 hour since login  
**Solution**: User must login again

### Issue: "Not authenticated"
**Cause**: No cookie or invalid token  
**Solution**: User must login again

### Issue: Logout doesn't work
**Cause**: API error or network issue  
**Solution**: Check browser console and network tab

### Issue: Must login too often
**Cause**: Expected behavior (1 hour sessions)  
**Solution**: This is by design for security

---

## 📊 Monitoring

### Key Metrics
```typescript
// Login frequency
SELECT COUNT(*) as logins_today
FROM auth_logs
WHERE event_type = 'login'
AND timestamp > NOW() - INTERVAL '1 day';

// Active sessions
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > NOW();

// Failed logins
SELECT COUNT(*) as failed_logins
FROM auth_logs
WHERE event_type = 'failed_login'
AND timestamp > NOW() - INTERVAL '1 hour';
```

---

## 🔐 Security Features

### ✅ Implemented
- Session-only cookies (no persistence)
- 1-hour token expiration
- Database session verification
- Cache prevention headers
- CSRF protection
- Rate limiting (5 attempts per 15 min)
- Password hashing (bcrypt, 12 rounds)
- Audit logging

### 🚧 Future Enhancements
- Session activity tracking
- Multi-device management
- IP address validation
- Geolocation checks
- 2FA/MFA support

---

## 📝 Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@host:6543/postgres
JWT_SECRET=<32-byte-random-string>
CRON_SECRET=<32-byte-random-string>

# Optional
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=<your-token>
```

---

## 🚀 Deployment

```bash
# 1. Commit changes
git add .
git commit -m "feat: session-only authentication"

# 2. Push to main
git push origin main

# 3. Verify deployment
curl https://news.arcane.group/api/auth/me

# 4. Monitor logs
vercel logs
```

---

## 📚 Related Documentation

- **Full Documentation**: `AUTHENTICATION-SYSTEM-OVERHAUL.md`
- **Original Spec**: `.kiro/specs/secure-user-authentication/`
- **Steering Guide**: `.kiro/steering/authentication.md`
- **Success Summary**: `AUTHENTICATION-SUCCESS.md`

---

**Status**: 🟢 **PRODUCTION READY**  
**Version**: 2.0.0  
**Last Updated**: January 27, 2025
