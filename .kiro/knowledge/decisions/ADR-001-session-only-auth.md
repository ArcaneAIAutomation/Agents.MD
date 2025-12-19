# ADR-001: Session-Only Authentication

**Date**: January 27, 2025  
**Status**: Accepted  
**Deciders**: Development Team

---

## Context

The platform needed an authentication system. Options considered:
1. Persistent authentication (remember me for 30 days)
2. Session-only authentication (login every browser session)
3. OAuth with external providers

Security requirements were high due to financial data access.

---

## Decision

Implement **session-only authentication** with:
- JWT tokens that expire when browser closes
- 1-hour token expiration (short-lived)
- Database verification on every request
- No "remember me" functionality
- Access code-based registration

---

## Consequences

### Positive
- **Enhanced Security**: No persistent tokens to steal
- **Simpler Implementation**: No refresh token logic
- **Clear Session Boundaries**: Users know when they're logged in
- **Reduced Attack Surface**: Tokens expire quickly

### Negative
- **User Friction**: Must login every browser session
- **No Mobile App Support**: Would need different auth for apps
- **Session Loss**: Closing browser loses session

---

## Alternatives Considered

### 1. Persistent Authentication (30-day tokens)
- Rejected: Higher security risk for financial platform
- Would require refresh token rotation

### 2. OAuth (Google, GitHub)
- Rejected: Adds external dependencies
- Users may not have these accounts
- Less control over authentication flow

### 3. Magic Links (Email-based)
- Rejected: Slower user experience
- Email delivery reliability concerns

---

## Implementation Details

```typescript
// Token generation (1-hour expiration)
const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Cookie settings (session-only)
res.setHeader('Set-Cookie', serialize('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  // NO maxAge = session cookie
}));
```

---

## Related Documentation

- [Authentication Steering](../../steering/authentication.md)
- [Production Features - Authentication](../../../docs/production-features/authentication.md)
