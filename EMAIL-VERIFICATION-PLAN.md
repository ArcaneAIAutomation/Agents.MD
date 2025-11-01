# Email Verification Implementation Plan

## Current Issue
- ✅ Registration works
- ❌ Welcome email not being received
- ❌ No email verification required
- ❌ Users can access site without verifying email

## Required Changes

### 1. Database Schema Updates
Add email verification fields to `users` table:
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN verification_sent_at TIMESTAMP WITH TIME ZONE;
```

### 2. New API Endpoints

#### `/api/auth/verify-email`
- **Method:** GET
- **Query:** `?token=<verification_token>`
- **Purpose:** Verify email address using token from email
- **Response:** Redirect to login with success message

#### `/api/auth/resend-verification`
- **Method:** POST
- **Body:** `{ email }`
- **Purpose:** Resend verification email
- **Response:** Success message

### 3. Email Templates

#### Verification Email
```html
Subject: Verify Your Email - Bitcoin Sovereign Technology

Hi there,

Thank you for registering with Bitcoin Sovereign Technology!

Please verify your email address by clicking the link below:

[Verify Email Button/Link]

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
Bitcoin Sovereign Technology Team
```

### 4. Authentication Flow Changes

**Before (Current):**
1. User registers → Immediately logged in → Can access site

**After (Required):**
1. User registers → Email sent → Redirected to "Check your email" page
2. User clicks verification link → Email verified → Can now login
3. Unverified users cannot login (blocked at login endpoint)

### 5. UI Changes

#### New: Email Verification Pending Page
- Shows after registration
- Message: "Check your email to verify your account"
- Button: "Resend verification email"
- Link: "Back to login"

#### Updated: Login Page
- If user tries to login with unverified email:
  - Error: "Please verify your email address first"
  - Button: "Resend verification email"

### 6. Implementation Steps

1. **Database Migration** (5 min)
   - Add verification columns to users table
   - Create migration script

2. **Email Template** (10 min)
   - Create verification email template
   - Add verification link with token

3. **API Endpoints** (20 min)
   - `/api/auth/verify-email` - Verify token and mark email as verified
   - `/api/auth/resend-verification` - Resend verification email

4. **Update Registration Flow** (15 min)
   - Generate verification token on registration
   - Send verification email instead of welcome email
   - Don't auto-login user after registration

5. **Update Login Flow** (10 min)
   - Check if email is verified before allowing login
   - Return appropriate error if not verified

6. **UI Components** (20 min)
   - EmailVerificationPending component
   - Update LoginForm to handle unverified emails
   - Update AccessGate to show verification status

7. **Testing** (15 min)
   - Test registration → verification email sent
   - Test verification link → email verified
   - Test login with unverified email → blocked
   - Test login with verified email → success
   - Test resend verification email

**Total Time:** ~1.5 hours

## Priority Decision

**Option A: Quick Fix (Welcome Email Only)**
- Fix welcome email sending
- No verification required
- Users can access immediately
- Time: 15 minutes

**Option B: Full Email Verification (Recommended)**
- Implement complete verification flow
- Users must verify before access
- More secure and professional
- Time: 1.5 hours

**Which would you like me to implement?**
