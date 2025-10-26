# Security Utilities

This directory contains security-related utility functions for the authentication system.

## Input Sanitization (`sanitize.ts`)

Provides functions to sanitize user input and prevent XSS attacks.

### Functions

#### `sanitizeEmail(email: string): string`
Sanitizes email input by:
- Trimming whitespace
- Converting to lowercase
- Removing HTML tags
- Removing script-related content
- Removing null bytes

**Usage:**
```typescript
import { sanitizeEmail } from '@/lib/security/sanitize';

const userEmail = sanitizeEmail(req.body.email);
// "  TEST@EXAMPLE.COM  " → "test@example.com"
```

#### `sanitizeAccessCode(code: string): string`
Sanitizes access code input by:
- Trimming whitespace
- Converting to uppercase
- Removing non-alphanumeric characters
- Removing HTML tags
- Removing null bytes

**Usage:**
```typescript
import { sanitizeAccessCode } from '@/lib/security/sanitize';

const accessCode = sanitizeAccessCode(req.body.accessCode);
// "  abc-123  " → "ABC123"
```

#### `sanitizeText(text: string): string`
Sanitizes general text input by:
- Trimming whitespace
- Removing HTML tags
- Removing script-related content
- Removing null bytes

**Usage:**
```typescript
import { sanitizeText } from '@/lib/security/sanitize';

const userName = sanitizeText(req.body.name);
```

#### `sanitizeErrorMessage(message: string): string`
Sanitizes error messages to prevent XSS by:
- Removing HTML tags
- Escaping special HTML characters (`<`, `>`, `&`, `"`, `'`, `/`)
- Removing script-related content
- Limiting length to 500 characters
- Removing null bytes

**Usage:**
```typescript
import { sanitizeErrorMessage } from '@/lib/security/sanitize';

const safeError = sanitizeErrorMessage(error.message);
res.status(400).json({ error: safeError });
```

#### `sanitizeUrl(url: string): string`
Sanitizes URL input by:
- Trimming whitespace
- Removing HTML tags
- Blocking dangerous protocols (javascript:, data:, vbscript:, file:, about:)
- Only allowing http: and https: protocols
- Removing null bytes

**Usage:**
```typescript
import { sanitizeUrl } from '@/lib/security/sanitize';

const safeUrl = sanitizeUrl(req.body.redirectUrl);
if (safeUrl) {
  res.redirect(safeUrl);
}
```

#### `sanitizePassword(password: string): string`
Sanitizes password input by:
- Trimming whitespace
- Removing HTML tags
- Removing null bytes
- Preserving special characters

**Note:** This does NOT hash the password. Use bcrypt for hashing.

**Usage:**
```typescript
import { sanitizePassword } from '@/lib/security/sanitize';
import bcrypt from 'bcryptjs';

const cleanPassword = sanitizePassword(req.body.password);
const hashedPassword = await bcrypt.hash(cleanPassword, 12);
```

#### `sanitizeObject<T>(obj: T): T`
Recursively sanitizes all string values in an object.

**Usage:**
```typescript
import { sanitizeObject } from '@/lib/security/sanitize';

const sanitizedBody = sanitizeObject(req.body);
```

#### `containsDangerousContent(input: string): boolean`
Checks if a string contains potentially dangerous content like:
- Script tags
- JavaScript protocol
- Event handlers (onclick, onload, etc.)
- Iframe tags
- Object/embed tags
- eval() calls
- VBScript protocol

**Usage:**
```typescript
import { containsDangerousContent } from '@/lib/security/sanitize';

if (containsDangerousContent(userInput)) {
  return res.status(400).json({ error: 'Invalid input detected' });
}
```

## Best Practices

### 1. Always Sanitize User Input
```typescript
// ✅ Good
const email = sanitizeEmail(req.body.email);
const code = sanitizeAccessCode(req.body.accessCode);

// ❌ Bad
const email = req.body.email; // Unsanitized!
```

### 2. Sanitize Before Validation
```typescript
// ✅ Good - Sanitize first, then validate
const email = sanitizeEmail(req.body.email);
const validationResult = emailSchema.safeParse({ email });

// ❌ Bad - Validate unsanitized input
const validationResult = emailSchema.safeParse(req.body);
```

### 3. Always Sanitize Error Messages
```typescript
// ✅ Good
const safeError = sanitizeErrorMessage(error.message);
res.status(500).json({ error: safeError });

// ❌ Bad - Raw error message could contain XSS
res.status(500).json({ error: error.message });
```

### 4. Use Specific Sanitizers
```typescript
// ✅ Good - Use specific sanitizers for specific inputs
const email = sanitizeEmail(req.body.email);
const code = sanitizeAccessCode(req.body.accessCode);
const password = sanitizePassword(req.body.password);

// ❌ Bad - Using generic sanitizer for everything
const email = sanitizeText(req.body.email); // Won't lowercase!
```

### 5. Check for Dangerous Content
```typescript
// ✅ Good - Check before processing
if (containsDangerousContent(userInput)) {
  return res.status(400).json({ error: 'Invalid input' });
}

// ❌ Bad - Process without checking
processUserInput(userInput);
```

## Integration with API Endpoints

### Registration Endpoint Example
```typescript
import { sanitizeEmail, sanitizeAccessCode, sanitizePassword } from '@/lib/security/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sanitize all inputs
  const email = sanitizeEmail(req.body.email);
  const accessCode = sanitizeAccessCode(req.body.accessCode);
  const password = sanitizePassword(req.body.password);
  
  // Validate sanitized inputs
  const validationResult = registrationSchema.safeParse({
    email,
    accessCode,
    password
  });
  
  if (!validationResult.success) {
    return res.status(400).json({ 
      error: sanitizeErrorMessage(validationResult.error.message) 
    });
  }
  
  // Continue with registration...
}
```

### Login Endpoint Example
```typescript
import { sanitizeEmail, sanitizePassword, sanitizeErrorMessage } from '@/lib/security/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sanitize inputs
    const email = sanitizeEmail(req.body.email);
    const password = sanitizePassword(req.body.password);
    
    // Validate and authenticate...
    
  } catch (error) {
    // Sanitize error message before sending
    const safeError = sanitizeErrorMessage(error.message);
    res.status(500).json({ error: safeError });
  }
}
```

## Security Considerations

1. **Defense in Depth**: Sanitization is one layer. Also use:
   - Input validation (Zod schemas)
   - Parameterized queries (prevent SQL injection)
   - CSRF tokens
   - Rate limiting
   - Content Security Policy headers

2. **Client-Side vs Server-Side**: Always sanitize on the server. Client-side sanitization can be bypassed.

3. **Error Messages**: Never expose system internals in error messages. Always sanitize before sending to client.

4. **Logging**: Be careful when logging user input. Sanitize before logging to prevent log injection attacks.

## Testing

Run the test validation script:
```bash
node scripts/test-sanitization.js
```

For unit tests (when test framework is configured):
```bash
npm test lib/security/__tests__/sanitize.test.ts
```

## Requirements Coverage

This implementation satisfies:
- **Requirement 9.2**: Input validation and sanitization
- **Requirement 9.3**: XSS prevention in error messages

## Related Files

- `lib/validation/auth.ts` - Zod validation schemas
- `middleware/auth.ts` - Authentication middleware
- `pages/api/auth/*.ts` - API endpoints using sanitization
