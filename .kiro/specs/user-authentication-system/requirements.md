# User Authentication System - Requirements

## Overview

Implement a secure user authentication system where access codes are one-time use tokens that allow users to create permanent accounts.

---

## User Stories

### As a new user with an access code:
1. I enter my access code on the access gate
2. The system validates my code is unused
3. I'm prompted to create an account (email + password)
4. I receive a confirmation email
5. I can now login with my credentials
6. My access code is marked as redeemed and cannot be used again

### As a returning user:
1. I visit the platform
2. I see a login form (email + password)
3. I enter my credentials
4. I'm granted access to the platform
5. My session persists until I logout or it expires

### As an administrator:
1. I can view all redeemed codes
2. I can see which user redeemed each code
3. I can revoke user access if needed
4. I can generate new access codes
5. I can view usage analytics

---

## Functional Requirements

### FR1: Access Code Redemption
- **FR1.1:** User enters access code
- **FR1.2:** System validates code exists and is unused
- **FR1.3:** If valid, show registration form
- **FR1.4:** If invalid or used, show error message
- **FR1.5:** Track redemption timestamp and IP address

### FR2: User Registration
- **FR2.1:** Collect email address (required, validated)
- **FR2.2:** Collect password (required, min 8 chars, complexity rules)
- **FR2.3:** Confirm password (must match)
- **FR2.4:** Optional: First name, last name, company
- **FR2.5:** Validate email is not already registered
- **FR2.6:** Hash password with bcrypt (10 rounds)
- **FR2.7:** Create user record in database
- **FR2.8:** Mark access code as redeemed
- **FR2.9:** Link user to redeemed code

### FR3: Email Confirmation
- **FR3.1:** Send welcome email via Office 365
- **FR3.2:** Include account details (email, registration date)
- **FR3.3:** Include login instructions
- **FR3.4:** Professional Bitcoin Sovereign branding
- **FR3.5:** Include support contact information

### FR4: User Login
- **FR4.1:** Show login form (email + password)
- **FR4.2:** Validate credentials against database
- **FR4.3:** Generate secure JWT token on success
- **FR4.4:** Store token in httpOnly cookie
- **FR4.5:** Redirect to platform on success
- **FR4.6:** Show error message on failure
- **FR4.7:** Rate limit login attempts (5 per 15 minutes)

### FR5: Session Management
- **FR5.1:** JWT tokens expire after 7 days
- **FR5.2:** Refresh tokens valid for 30 days
- **FR5.3:** Automatic token refresh on activity
- **FR5.4:** Logout clears all tokens
- **FR5.5:** Session persists across browser tabs

### FR6: Password Security
- **FR6.1:** Minimum 8 characters
- **FR6.2:** Must contain: uppercase, lowercase, number
- **FR6.3:** Optional: special character
- **FR6.4:** Hashed with bcrypt (salt rounds: 10)
- **FR6.5:** Never stored in plain text
- **FR6.6:** Password reset functionality (future)

---

## Non-Functional Requirements

### NFR1: Security
- **NFR1.1:** All passwords hashed with bcrypt
- **NFR1.2:** JWT tokens signed with secret key
- **NFR1.3:** HTTPS only in production
- **NFR1.4:** SQL injection prevention (parameterized queries)
- **NFR1.5:** XSS prevention (input sanitization)
- **NFR1.6:** CSRF protection (tokens)
- **NFR1.7:** Rate limiting on authentication endpoints

### NFR2: Performance
- **NFR2.1:** Login response time < 500ms
- **NFR2.2:** Registration response time < 1s
- **NFR2.3:** Email delivery < 5s
- **NFR2.4:** Database queries optimized with indexes

### NFR3: Scalability
- **NFR3.1:** Support 1000+ concurrent users
- **NFR3.2:** Database connection pooling
- **NFR3.3:** Stateless authentication (JWT)
- **NFR3.4:** Horizontal scaling ready

### NFR4: Reliability
- **NFR4.1:** 99.9% uptime target
- **NFR4.2:** Graceful error handling
- **NFR4.3:** Database backups (daily)
- **NFR4.4:** Transaction rollback on errors

### NFR5: Usability
- **NFR5.1:** Clear error messages
- **NFR5.2:** Password strength indicator
- **NFR5.3:** Show/hide password toggle
- **NFR5.4:** Remember me option
- **NFR5.5:** Mobile-optimized forms

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Access Codes Table
```sql
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by_user_id UUID REFERENCES users(id),
  redeemed_at TIMESTAMP,
  redeemed_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0
);

CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_redeemed ON access_codes(is_redeemed);
```

### Sessions Table (Optional - for tracking)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Audit Log Table
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

---

## API Endpoints

### POST /api/auth/validate-code
**Purpose:** Validate access code before registration

**Request:**
```json
{
  "code": "BTC-SOVEREIGN-K3QYMQ-01"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "code": "BTC-SOVEREIGN-K3QYMQ-01"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Code already redeemed" | "Invalid code" | "Code expired"
}
```

### POST /api/auth/register
**Purpose:** Register new user with access code

**Request:**
```json
{
  "code": "BTC-SOVEREIGN-K3QYMQ-01",
  "email": "user@example.com",
  "password": "SecurePass123",
  "passwordConfirm": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Account created successfully. Please check your email."
}
```

**Response (Error):**
```json
{
  "success": false,
  "errors": {
    "email": "Email already registered",
    "password": "Password must be at least 8 characters",
    "code": "Invalid or already redeemed"
  }
}
```

### POST /api/auth/login
**Purpose:** Authenticate user and create session

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt-token-here"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### POST /api/auth/logout
**Purpose:** End user session

**Request:**
```json
{
  "token": "jwt-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/me
**Purpose:** Get current user info

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp",
    "createdAt": "2025-01-25T10:00:00Z",
    "lastLoginAt": "2025-01-25T15:30:00Z"
  }
}
```

---

## Email Templates

### Welcome Email (Account Created)
```
Subject: Welcome to Bitcoin Sovereign Technology - Account Activated

Dear [First Name],

Congratulations! Your account has been successfully created and activated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCOUNT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: [email]
Registration Date: [date]
Access Code Used: [code]

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

✓ Crypto News Wire
✓ AI Trade Generation Engine
✓ Bitcoin Market Report
✓ Ethereum Market Report
✓ Bitcoin Whale Watch
✓ Regulatory Watch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your access code has been redeemed and is no longer valid. 
You can now login anytime with your email and password.

Best regards,
Bitcoin Sovereign Technology Team
```

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special character

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP
- Code validation: 10 per minute per IP

### Token Security
- JWT signed with HS256
- Secret key stored in environment variable
- Tokens expire after 7 days
- Refresh tokens for extended sessions

### Database Security
- Parameterized queries (prevent SQL injection)
- Connection pooling
- Encrypted connections
- Regular backups

---

## Implementation Priority

### Phase 1: Core Authentication (Week 1)
1. Database schema setup
2. User registration API
3. Login/logout API
4. JWT token generation
5. Basic access gate integration

### Phase 2: Code Redemption (Week 1)
1. Access code validation
2. One-time use enforcement
3. Code-to-user linking
4. Redemption tracking

### Phase 3: Email Integration (Week 1)
1. Welcome email template
2. Office 365 integration
3. Email delivery confirmation

### Phase 4: UI/UX (Week 2)
1. Registration form component
2. Login form component
3. Password strength indicator
4. Error handling and validation
5. Mobile optimization

### Phase 5: Admin Features (Week 2)
1. User management dashboard
2. Code generation tool
3. Usage analytics
4. Audit log viewer

---

## Success Criteria

✅ Users can redeem access codes once  
✅ Users can create accounts with email/password  
✅ Users receive confirmation emails  
✅ Users can login with credentials  
✅ Sessions persist securely  
✅ Codes cannot be reused  
✅ All passwords are hashed  
✅ System is mobile-optimized  
✅ 99.9% uptime achieved  
✅ < 500ms login response time  

---

**Status:** Ready for Implementation  
**Estimated Time:** 2-3 days for full system  
**Priority:** High  
**Dependencies:** PostgreSQL database, Office 365 email
