# Sanitization Integration Guide

This guide shows how to integrate the sanitization functions into existing API endpoints.

## Quick Start

### 1. Import Sanitization Functions

```typescript
import { 
  sanitizeEmail, 
  sanitizeAccessCode, 
  sanitizePassword,
  sanitizeErrorMessage 
} from '@/lib/security/sanitize';
```

### 2. Sanitize Before Validation

Always sanitize user input **before** validation:

```typescript
// ✅ Correct Order
const email = sanitizeEmail(req.body.email);           // 1. Sanitize
const validationResult = schema.safeParse({ email });  // 2. Validate

// ❌ Wrong Order
const validationResult = schema.safeParse(req.body);   // Validating unsanitized input!
```

## Integration Examples

### Registration Endpoint (`pages/api/auth/register.ts`)

**Before:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate input
  const validationResult = registrationSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.message });
  }
  
  const { accessCode, email, password } = validationResult.data;
  // ... rest of registration logic
}
```

**After (with sanitization):**
```typescript
import { sanitizeEmail, sanitizeAccessCode, sanitizePassword, sanitizeErrorMessage } from '@/lib/security/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. SANITIZE all inputs first
    const sanitizedInput = {
      accessCode: sanitizeAccessCode(req.body.accessCode),
      email: sanitizeEmail(req.body.email),
      password: sanitizePassword(req.body.password)
    };
    
    // 2. VALIDATE sanitized inputs
    const validationResult = registrationSchema.safeParse(sanitizedInput);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: sanitizeErrorMessage(validationResult.error.message) 
      });
    }
    
    const { accessCode, email, password } = validationResult.data;
    
    // ... rest of registration logic
    
  } catch (error) {
    // 3. SANITIZE error messages
    return res.status(500).json({ 
      error: sanitizeErrorMessage(error.message) 
    });
  }
}
```

### Login Endpoint (`pages/api/auth/login.ts`)

**Before:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validationResult = loginSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.message });
  }
  
  const { email, password } = validationResult.data;
  // ... rest of login logic
}
```

**After (with sanitization):**
```typescript
import { sanitizeEmail, sanitizePassword, sanitizeErrorMessage } from '@/lib/security/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. SANITIZE inputs
    const sanitizedInput = {
      email: sanitizeEmail(req.body.email),
      password: sanitizePassword(req.body.password),
      rememberMe: req.body.rememberMe // Boolean, no sanitization needed
    };
    
    // 2. VALIDATE sanitized inputs
    const validationResult = loginSchema.safeParse(sanitizedInput);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: sanitizeErrorMessage(validationResult.error.message) 
      });
    }
    
    const { email, password, rememberMe } = validationResult.data;
    
    // ... rest of login logic
    
  } catch (error) {
    // 3. SANITIZE error messages
    return res.status(500).json({ 
      error: sanitizeErrorMessage(error.message) 
    });
  }
}
```

### Error Response Helper

Create a reusable error response helper:

```typescript
// lib/security/errorResponse.ts
import { sanitizeErrorMessage } from './sanitize';

export function sendErrorResponse(
  res: NextApiResponse,
  statusCode: number,
  error: Error | string
) {
  const message = typeof error === 'string' ? error : error.message;
  const safeMessage = sanitizeErrorMessage(message);
  
  return res.status(statusCode).json({
    success: false,
    error: safeMessage
  });
}

// Usage in API endpoints
import { sendErrorResponse } from '@/lib/security/errorResponse';

try {
  // ... logic
} catch (error) {
  return sendErrorResponse(res, 500, error);
}
```

## Checklist for Each API Endpoint

When updating an API endpoint, ensure:

- [ ] Import sanitization functions at the top
- [ ] Sanitize ALL user inputs before validation
- [ ] Use specific sanitizers (sanitizeEmail, sanitizeAccessCode, etc.)
- [ ] Sanitize error messages before sending to client
- [ ] Sanitize any user input that goes into database queries
- [ ] Sanitize any user input that appears in logs
- [ ] Test with malicious input (XSS attempts, SQL injection, etc.)

## Common Patterns

### Pattern 1: Sanitize Request Body

```typescript
const sanitizedBody = {
  email: sanitizeEmail(req.body.email),
  accessCode: sanitizeAccessCode(req.body.accessCode),
  password: sanitizePassword(req.body.password)
};
```

### Pattern 2: Sanitize and Validate

```typescript
const sanitizedInput = {
  email: sanitizeEmail(req.body.email),
  password: sanitizePassword(req.body.password)
};

const validationResult = schema.safeParse(sanitizedInput);
```

### Pattern 3: Sanitize Error Messages

```typescript
try {
  // ... logic
} catch (error) {
  const safeError = sanitizeErrorMessage(error.message);
  return res.status(500).json({ error: safeError });
}
```

### Pattern 4: Check for Dangerous Content

```typescript
import { containsDangerousContent } from '@/lib/security/sanitize';

if (containsDangerousContent(req.body.someField)) {
  return res.status(400).json({ 
    error: 'Invalid input detected' 
  });
}
```

## Testing Sanitization

### Manual Testing

Test with these malicious inputs:

```typescript
// XSS attempts
const xssTests = [
  '<script>alert("xss")</script>',
  'javascript:alert(1)',
  '<img src=x onerror=alert(1)>',
  '<iframe src="evil.com"></iframe>'
];

// SQL injection attempts
const sqlTests = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--"
];

// Null byte injection
const nullByteTests = [
  'test\0@example.com',
  'ABC\0123'
];
```

### Automated Testing

When test framework is set up:

```bash
npm test lib/security/__tests__/sanitize.test.ts
```

## Security Best Practices

1. **Always sanitize on the server**: Client-side sanitization can be bypassed
2. **Sanitize before validation**: Clean input first, then validate
3. **Use specific sanitizers**: Don't use generic sanitizeText() for emails
4. **Sanitize error messages**: Never expose raw error messages to clients
5. **Log sanitized input**: Prevent log injection attacks
6. **Defense in depth**: Combine with validation, CSRF tokens, rate limiting

## Next Steps

1. Update all API endpoints in `pages/api/auth/` to use sanitization
2. Add sanitization to any new endpoints
3. Set up automated testing for sanitization functions
4. Monitor logs for sanitization patterns (blocked XSS attempts)
5. Regular security audits of input handling

## Related Documentation

- [README.md](./README.md) - Full API reference for sanitization functions
- [../../lib/validation/auth.ts](../validation/auth.ts) - Zod validation schemas
- [../../middleware/auth.ts](../middleware/auth.ts) - Authentication middleware
