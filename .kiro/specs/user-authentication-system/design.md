# User Authentication System - Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Access Gate  │  │ Registration │  │ Login Form   │     │
│  │  Component   │→ │   Component  │→ │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /api/auth/   │  │ /api/auth/   │  │ /api/auth/   │     │
│  │ validate-code│  │  register    │  │   login      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    users     │  │ access_codes │  │   sessions   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              EMAIL SERVICE (Office 365)                     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Welcome    │  │  Password    │                        │
│  │    Email     │  │    Reset     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. AccessGate Component (Enhanced)

**File:** `components/AccessGate.tsx`

**States:**
- `initial` - Show code entry or login options
- `code-entry` - Enter access code
- `registration` - Create account after valid code
- `login` - Login with existing credentials

**Flow:**
```typescript
interface AccessGateState {
  mode: 'initial' | 'code-entry' | 'registration' | 'login';
  validatedCode?: string;
  user?: User;
}
```

### 2. Registration Component

**File:** `components/auth/RegistrationForm.tsx`

**Props:**
```typescript
interface RegistrationFormProps {
  accessCode: string;
  onSuccess: (user: User) => void;
  onCancel: () => void;
}
```

**Fields:**
- Email (required, validated)
- Password (required, strength indicator)
- Password Confirmation (required, must match)
- First Name (optional)
- Last Name (optional)
- Company (optional)

### 3. Login Component

**File:** `components/auth/LoginForm.tsx`

**Props:**
```typescript
interface LoginFormProps {
  onSuccess: (user: User) => void;
  onForgotPassword: () => void;
  onBackToCodeEntry: () => void;
}
```

**Fields:**
- Email (required)
- Password (required)
- Remember Me (checkbox)

---

## Database Design

### Technology Choice: **Vercel Postgres**

**Why Vercel Postgres:**
- ✅ Serverless (auto-scaling)
- ✅ Built-in connection pooling
- ✅ Integrated with Vercel deployment
- ✅ PostgreSQL compatible
- ✅ Automatic backups
- ✅ Low latency

**Alternative:** Supabase (if more features needed)

### Schema Implementation

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Access codes table
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Sessions table (for tracking)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_redeemed ON access_codes(is_redeemed);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Insert existing access codes
INSERT INTO access_codes (code, notes) VALUES
  ('BITCOIN2025', 'Default code'),
  ('BTC-SOVEREIGN-K3QYMQ-01', 'Early access batch 1'),
  ('BTC-SOVEREIGN-AKCJRG-02', 'Early access batch 1'),
  ('BTC-SOVEREIGN-LMBLRN-03', 'Early access batch 1'),
  ('BTC-SOVEREIGN-HZKEI2-04', 'Early access batch 1'),
  ('BTC-SOVEREIGN-WVL0HN-05', 'Early access batch 1'),
  ('BTC-SOVEREIGN-48YDHG-06', 'Early access batch 1'),
  ('BTC-SOVEREIGN-6HSNX0-07', 'Early access batch 1'),
  ('BTC-SOVEREIGN-N99A5R-08', 'Early access batch 1'),
  ('BTC-SOVEREIGN-DCO2DG-09', 'Early access batch 1'),
  ('BTC-SOVEREIGN-BYE9UX-10', 'Early access batch 1');
```

---

## API Implementation

### Authentication Utilities

**File:** `lib/auth.ts`

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

// Validate password strength
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Database Client

**File:** `lib/db.ts`

```typescript
import { sql } from '@vercel/postgres';

export { sql };

// Helper functions
export async function query<T>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await sql.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
```

---

## API Routes Implementation

### 1. Validate Access Code

**File:** `pages/api/auth/validate-code.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Access code is required' 
      });
    }

    // Check if code exists and is not redeemed
    const accessCode = await queryOne<{
      id: string;
      code: string;
      is_redeemed: boolean;
      expires_at: string | null;
    }>(
      'SELECT id, code, is_redeemed, expires_at FROM access_codes WHERE UPPER(code) = UPPER($1)',
      [code]
    );

    if (!accessCode) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Invalid access code' 
      });
    }

    if (accessCode.is_redeemed) {
      return res.status(200).json({ 
        valid: false, 
        error: 'This access code has already been redeemed' 
      });
    }

    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      return res.status(200).json({ 
        valid: false, 
        error: 'This access code has expired' 
      });
    }

    return res.status(200).json({ 
      valid: true, 
      code: accessCode.code 
    });

  } catch (error) {
    console.error('Error validating access code:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    });
  }
}
```

### 2. Register User

**File:** `pages/api/auth/register.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../lib/db';
import { hashPassword, validatePassword, generateToken } from '../../../lib/auth';
import { sendWelcomeEmail } from '../../../lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      code,
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
      company,
    } = req.body;

    // Validation
    const errors: Record<string, string> = {};

    if (!code) errors.code = 'Access code is required';
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password !== passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Validate password strength
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors.join(', ');
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Check if email already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: { email: 'Email already registered' },
      });
    }

    // Validate access code
    const accessCode = await queryOne<{
      id: string;
      is_redeemed: boolean;
    }>(
      'SELECT id, is_redeemed FROM access_codes WHERE UPPER(code) = UPPER($1)',
      [code]
    );

    if (!accessCode || accessCode.is_redeemed) {
      return res.status(400).json({
        success: false,
        errors: { code: 'Invalid or already redeemed access code' },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [user] = await query<{
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
    }>(
      `INSERT INTO users (email, password_hash, first_name, last_name, company)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, company`,
      [email, passwordHash, firstName || null, lastName || null, company || null]
    );

    // Mark code as redeemed
    await query(
      `UPDATE access_codes 
       SET is_redeemed = true, 
           redeemed_by_user_id = $1, 
           redeemed_at = NOW(),
           redeemed_ip = $2
       WHERE id = $3`,
      [user.id, req.headers['x-forwarded-for'] || req.socket.remoteAddress, accessCode.id]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'USER_REGISTERED',
        JSON.stringify({ code, email }),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        req.headers['user-agent'],
      ]
    );

    // Send welcome email
    await sendWelcomeEmail({
      email: user.email,
      firstName: user.first_name || undefined,
      code,
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      company: user.company || undefined,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
      },
      token,
      message: 'Account created successfully. Welcome email sent!',
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
```

---

## Email Template

**File:** `lib/email.ts`

```typescript
interface WelcomeEmailParams {
  email: string;
  firstName?: string;
  code: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { email, firstName, code } = params;
  
  const emailBody = `
Dear ${firstName || 'User'},

Welcome to Bitcoin Sovereign Technology! Your account has been successfully activated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCOUNT ACTIVATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: ${email}
Registration Date: ${new Date().toLocaleString()}
Access Code Used: ${code}

Your access code has been redeemed and is no longer valid.
You can now login anytime with your email and password.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit: https://news.arcane.group
2. Click "Login"
3. Enter your email and password
4. Access granted!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Crypto News Wire - Real-time news aggregation
✓ AI Trade Generation Engine - GPT-4o powered signals
✓ Bitcoin Market Report - Comprehensive analysis
✓ Ethereum Market Report - Smart contract insights
✓ Bitcoin Whale Watch - Track large transactions
✓ Regulatory Watch - Monitor developments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions or need assistance, please contact us at:
support@arcane.group

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for joining Bitcoin Sovereign Technology!

Best regards,
Bitcoin Sovereign Technology Team
Arcane Group

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message from Bitcoin Sovereign Technology.
  `.trim();

  // Send via Office 365 (using existing implementation)
  // Implementation in next message...
}
```

---

**Status:** Design Complete  
**Next:** Implementation Tasks  
**Estimated Time:** 2-3 days
