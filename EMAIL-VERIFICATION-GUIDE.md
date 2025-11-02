# Email Verification System - Complete Guide

**Status**: ✅ **ENHANCED AND OPERATIONAL**  
**Version**: 2.0.0  
**Last Updated**: January 27, 2025  
**Deployment**: Production (https://news.arcane.group)

---

## Overview

The Bitcoin Sovereign Technology platform uses a secure email verification system to ensure user authenticity and prevent spam. This guide covers the complete verification flow, troubleshooting, and emergency procedures.

---

## User Flow

### 1. Registration
```
User registers → Receives welcome email → Clicks verification link → Email verified → Can login
```

**What Happens:**
1. User enters access code, email, and password
2. System creates account with `email_verified = FALSE`
3. System generates unique verification token (24-hour expiry)
4. System sends welcome email with verification link
5. User receives email from `no-reply@arcane.group`

### 2. Email Verification
```
Click link → Token validated → Database updated → Success page → Redirect to login
```

**What Happens:**
1. User clicks "Verify Email Address" button in email
2. Browser opens: `https://news.arcane.group/verify-email?token=...`
3. System validates token (not expired, not used)
4. System updates database: `email_verified = TRUE`
5. System clears verification token
6. User sees success page with login instructions
7. Auto-redirect to login after 5 seconds

### 3. Login (Unverified User)
```
Attempt login → Email not verified → Auto-resend verification email → User notified
```

**What Happens:**
1. User tries to login with unverified email
2. System detects `email_verified = FALSE`
3. System **automatically generates new verification token**
4. System **automatically sends new verification email**
5. User sees message: "Please verify your email. We just sent you a new verification email!"
6. User checks inbox for new email

---

## Features

### ✅ Auto-Resend on Failed Login
**NEW FEATURE**: When an unverified user tries to login, the system automatically:
- Generates a fresh verification token
- Sends a new verification email
- Notifies the user to check their inbox
- No manual intervention required!

### ✅ Clear Next Steps
After successful verification, users see:
- ✅ Confirmation message
- 📧 Their verified email address
- 📝 Step-by-step login instructions
- 🔗 Direct "Go to Login" button
- ⏱️ Auto-redirect countdown (5 seconds)

### ✅ Comprehensive Logging
Every verification attempt is logged:
- Token validation attempts
- Database updates
- Email sending status
- Success/failure reasons
- Timestamps for debugging

---

## API Endpoints

### POST /api/auth/register
**Purpose**: Create new user account with email verification

**Request:**
```json
{
  "accessCode": "BITCOIN2025",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "requiresVerification": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-01-27T...",
    "emailVerified": false
  }
}
```

### GET /api/auth/verify-email?token=...
**Purpose**: Verify user's email address

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "email": "user@example.com"
}
```

**Response (Already Verified):**
```json
{
  "success": true,
  "message": "Email already verified. You can now log in.",
  "email": "user@example.com"
}
```

**Response (Expired Token):**
```json
{
  "success": false,
  "message": "Verification token has expired. Please request a new one."
}
```

### POST /api/auth/login
**Purpose**: Login with email and password

**Enhanced Behavior**: If email is not verified:
1. Auto-generates new verification token
2. Auto-sends new verification email
3. Returns helpful error message

**Response (Unverified Email):**
```json
{
  "success": false,
  "message": "Please verify your email address before logging in. We just sent you a new verification email - check your inbox!",
  "requiresVerification": true,
  "email": "user@example.com",
  "verificationEmailSent": true
}
```

### POST /api/auth/resend-verification
**Purpose**: Manually request new verification email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

---

## Diagnostic Tools

### Check Verification Status
```bash
# Check specific user
npm run check:verification user@example.com

# Check all users
npm run check:verification -- --all
```

**Output:**
```
🔍 Checking Email Verification Status
============================================================

📧 Checking user: user@example.com

User ID: abc-123-def
Email: user@example.com
Email Verified: ✅ YES
Has Verification Token: NO
Account Created: 2025-01-27T10:00:00Z
Last Updated: 2025-01-27T10:05:00Z

✅ Access Code Redeemed: BITCOIN2025
   Redeemed At: 2025-01-27T10:00:00Z
```

### Manual Verification (Emergency)
```bash
# Manually verify a stuck user
npm run manual:verify user@example.com
```

**Output:**
```
🔧 Manual User Verification Tool
============================================================

📧 Verifying user: user@example.com

User ID: abc-123-def
Email: user@example.com
Current Status: ❌ UNVERIFIED

🔄 Updating database...
✅ Database updated successfully
   Email Verified: true

✅ User verified successfully!

📧 Next Steps for User:
   1. Go to: https://news.arcane.group
   2. Click "Login"
   3. Enter email: user@example.com
   4. Enter password
   5. Access the platform
```

---

## Troubleshooting

### Issue 1: User Can't Verify Email
**Symptoms:**
- User clicks verification link
- Nothing happens or error message
- Email remains unverified

**Diagnosis:**
```bash
npm run check:verification user@example.com
```

**Solutions:**

**A. Token Expired (24 hours)**
```bash
# User can request new email at:
https://news.arcane.group/resend-verification

# Or try to login (auto-resends)
```

**B. Token Already Used**
```bash
# Check if already verified:
npm run check:verification user@example.com

# If verified, user can login directly
```

**C. Database Not Updating**
```bash
# Emergency manual verification:
npm run manual:verify user@example.com

# Check database connection:
npm run validate:setup
```

### Issue 2: Verification Email Not Received
**Symptoms:**
- User registered but no email
- Email not in inbox or spam

**Diagnosis:**
```bash
# Check if email was sent:
npm run check:verification user@example.com

# Look for "Verification Email Sent" timestamp
```

**Solutions:**

**A. Check Spam Folder**
- Email from: `no-reply@arcane.group`
- Subject: "Welcome to Bitcoin Sovereign Technology - Verify Your Email"

**B. Resend Verification Email**
```bash
# Option 1: User visits resend page
https://news.arcane.group/resend-verification

# Option 2: User tries to login (auto-resends)

# Option 3: Admin manually resends
npm run test:verification-flow user@example.com
```

**C. Check Email Configuration**
```bash
# Verify environment variables:
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
SENDER_EMAIL=no-reply@arcane.group
```

### Issue 3: User Stuck in Unverified State
**Symptoms:**
- User verified email but still can't login
- Database shows `email_verified = FALSE`

**Emergency Fix:**
```bash
# Immediate relief - manually verify:
npm run manual:verify user@example.com

# User can login immediately after this
```

**Root Cause Investigation:**
```bash
# Check database connection:
npm run validate:setup

# Check Vercel function logs:
# Go to: https://vercel.com/dashboard
# Select project → Deployments → Latest → Functions
# View logs for /api/auth/verify-email
```

### Issue 4: Verification Link Doesn't Work
**Symptoms:**
- User clicks link, gets error page
- Link format looks wrong

**Check Link Format:**
```
✅ Correct: https://news.arcane.group/verify-email?token=abc123...
❌ Wrong: https://localhost:3000/verify-email?token=...
❌ Wrong: https://news.arcane.group/api/auth/verify-email?token=...
```

**Fix:**
```bash
# Check environment variable:
NEXT_PUBLIC_APP_URL=https://news.arcane.group

# Regenerate verification email:
npm run manual:verify user@example.com
```

---

## Database Schema

### Users Table (Verification Columns)
```sql
email_verified BOOLEAN DEFAULT FALSE NOT NULL
verification_token VARCHAR(255)  -- Hashed SHA-256 token
verification_token_expires TIMESTAMP WITH TIME ZONE
verification_sent_at TIMESTAMP WITH TIME ZONE
```

### Indexes
```sql
idx_users_verification_token  -- Fast token lookups
idx_users_email_verified      -- Filter verified/unverified
idx_users_verification_expires -- Cleanup expired tokens
```

### Constraints
```sql
-- Token and expiry must be set together
users_verification_token_consistency

-- Sent timestamp required when token exists
users_verification_sent_consistency
```

---

## Monitoring

### Key Metrics
- **Verification Rate**: % of users who verify within 24 hours
- **Email Delivery Rate**: % of emails successfully sent
- **Token Expiry Rate**: % of tokens that expire unused
- **Manual Verification Rate**: % requiring admin intervention

### Vercel Function Logs
```
1. Go to: https://vercel.com/dashboard
2. Select project → Deployments
3. Click latest deployment → Functions
4. View logs for:
   - /api/auth/register
   - /api/auth/verify-email
   - /api/auth/login
   - /api/auth/resend-verification
```

### Database Queries
```sql
-- Verification statistics
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_verified = TRUE) as verified,
  COUNT(*) FILTER (WHERE email_verified = FALSE) as unverified,
  COUNT(*) FILTER (WHERE verification_token_expires < NOW()) as expired_tokens
FROM users;

-- Recent unverified users
SELECT email, created_at, verification_sent_at
FROM users
WHERE email_verified = FALSE
ORDER BY created_at DESC
LIMIT 10;
```

---

## Best Practices

### For Users
1. **Check spam folder** for verification email
2. **Click verification link within 24 hours**
3. **Try to login** if email not received (auto-resends)
4. **Use resend page** if link expired
5. **Contact support** if still stuck

### For Admins
1. **Monitor verification rates** daily
2. **Check Vercel logs** for errors
3. **Use diagnostic tools** before manual intervention
4. **Document manual verifications** in auth_logs
5. **Investigate patterns** of failed verifications

### For Developers
1. **Test verification flow** after any auth changes
2. **Check email delivery** in staging before production
3. **Monitor database updates** for persistence issues
4. **Log all verification attempts** for debugging
5. **Keep emergency scripts** up to date

---

## Quick Reference

### User Commands
```bash
# Check verification status
npm run check:verification user@example.com

# Manually verify user (emergency)
npm run manual:verify user@example.com

# Test verification flow
npm run test:verification-flow user@example.com

# Diagnose verification issues
npm run diagnose:verification
```

### User Pages
```
Registration: https://news.arcane.group/
Login: https://news.arcane.group/
Resend Verification: https://news.arcane.group/resend-verification
Verify Email: https://news.arcane.group/verify-email?token=...
```

### API Endpoints
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify-email?token=...
POST /api/auth/resend-verification
```

---

## Support Contacts

### For Users
- **Email**: support@arcane.group
- **Platform**: https://news.arcane.group
- **Status**: Check Vercel deployment status

### For Admins
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repository**: https://github.com/ArcaneAIAutomation/Agents.MD

---

**Status**: 🟢 **FULLY OPERATIONAL**  
**Version**: 2.0.0  
**Last Updated**: January 27, 2025  
**Auto-Resend**: ✅ **ENABLED**  
**Manual Verification**: ✅ **AVAILABLE**

**The email verification system is enhanced and ready for production!** 🚀
