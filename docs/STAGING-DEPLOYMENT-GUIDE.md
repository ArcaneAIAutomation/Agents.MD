# Staging Deployment Guide - Secure User Authentication

## Overview

This guide provides step-by-step instructions for deploying the secure user authentication system to a staging environment for validation before production deployment.

## Prerequisites

- [ ] All Phase 1-7 tasks completed (Database, Auth, API, Frontend, Email, Security, Testing)
- [ ] Local testing passed
- [ ] Code reviewed and approved
- [ ] Vercel account with access to create preview deployments

## Staging Environment Setup

### Step 1: Create Staging Branch

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# Create staging branch
git checkout -b auth-system-staging

# Verify branch
git branch --show-current
# Should output: auth-system-staging
```

### Step 2: Commit All Authentication Changes

```bash
# Stage all authentication files
git add .kiro/specs/secure-user-authentication/
git add components/auth/
git add pages/api/auth/
git add pages/api/admin/
git add pages/api/cron/
git add lib/
git add middleware/
git add migrations/
git add scripts/
git add __tests__/
git add docs/
git add components/AccessGate.tsx
git add pages/_app.tsx
git add .env.example
git add package.json
git add package-lock.json
git add vercel.json
git add next.config.js
git add jest.config.js

# Commit with descriptive message
git commit -m "feat: implement secure user authentication system

- Add database schema with users, access_codes, sessions, auth_logs tables
- Implement JWT-based authentication with bcrypt password hashing
- Add registration, login, logout, and user info API endpoints
- Create AuthProvider context and authentication components
- Integrate Office 365 email for welcome messages
- Add CSRF protection and input sanitization
- Implement rate limiting with Vercel KV
- Add session cleanup cron job
- Include comprehensive test suite (unit, integration, e2e, security)
- Update documentation with deployment and user guides

Closes: Secure User Authentication Spec Phase 1-7"

# Push to remote
git push origin auth-system-staging
```

### Step 3: Create Vercel Preview Deployment

Vercel will automatically create a preview deployment when you push the staging branch.

1. **Monitor Deployment**
   - Go to https://vercel.com/dashboard
   - Navigate to your project
   - Click on "Deployments" tab
   - Find the deployment for `auth-system-staging` branch

2. **Wait for Build**
   - Build typically takes 2-5 minutes
   - Watch for "Ready" status
   - Note the preview URL (e.g., `https://agents-md-v2-git-auth-system-staging-yourteam.vercel.app`)

3. **Check Build Logs**
   - Click on the deployment
   - Review "Build Logs" for any errors
   - Verify all dependencies installed correctly

## Staging Database Setup

### Step 1: Create Staging Postgres Database

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click "Storage" tab

2. **Create New Database**
   - Click "Create Database"
   - Select "Postgres"
   - **Name**: `agents-md-auth-staging`
   - **Region**: Same as production (e.g., `us-east-1`)
   - **Plan**: Hobby (free) is sufficient for staging
   - Click "Create"

3. **Get Connection String**
   - Click on the new database
   - Go to ".env.local" tab
   - Copy `DATABASE_URL`
   - Format: `postgres://default:password@host-staging:5432/verceldb?sslmode=require`

### Step 2: Create Staging KV Store

1. **Create KV Database**
   - In "Storage" tab, click "Create Database"
   - Select "KV"
   - **Name**: `agents-md-rate-limit-staging`
   - **Region**: Same as Postgres
   - Click "Create"

2. **Get KV Credentials**
   - Click on the new KV database
   - Go to ".env.local" tab
   - Copy all three variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Configure Staging Environment Variables

1. **Navigate to Project Settings**
   - Vercel Dashboard > Your Project > Settings
   - Click "Environment Variables"

2. **Add Staging-Specific Variables**

   For each variable, select **"Preview"** environment only:

   ```
   Name: DATABASE_URL
   Value: [Staging Postgres connection string]
   Environment: Preview
   ```

   ```
   Name: JWT_SECRET
   Value: [Generate new secret: openssl rand -base64 32]
   Environment: Preview
   ```

   ```
   Name: JWT_EXPIRATION
   Value: 7d
   Environment: Preview
   ```

   ```
   Name: KV_REST_API_URL
   Value: [Staging KV URL]
   Environment: Preview
   ```

   ```
   Name: KV_REST_API_TOKEN
   Value: [Staging KV token]
   Environment: Preview
   ```

   ```
   Name: KV_REST_API_READ_ONLY_TOKEN
   Value: [Staging KV read-only token]
   Environment: Preview
   ```

   ```
   Name: CRON_SECRET
   Value: [Generate new secret: openssl rand -base64 32]
   Environment: Preview
   ```

   ```
   Name: NEXTAUTH_URL
   Value: [Your staging preview URL]
   Environment: Preview
   ```

   ```
   Name: AUTH_RATE_LIMIT_MAX_ATTEMPTS
   Value: 5
   Environment: Preview
   ```

   ```
   Name: AUTH_RATE_LIMIT_WINDOW_MS
   Value: 900000
   Environment: Preview
   ```

3. **Redeploy After Adding Variables**
   - Go to "Deployments" tab
   - Find your staging deployment
   - Click "..." > "Redeploy"
   - Wait for redeployment to complete

## Run Database Migrations on Staging

### Method 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Set staging DATABASE_URL locally
export DATABASE_URL="[Your staging Postgres connection string]"

# Run migrations
npm run migrate:prod

# Or manually
node scripts/run-migrations.ts
```

### Method 2: Using Vercel SQL Editor

1. **Open SQL Editor**
   - Vercel Dashboard > Storage > agents-md-auth-staging
   - Click "Query" tab

2. **Copy Migration SQL**
   - Open `migrations/001_initial_schema.sql`
   - Copy entire contents

3. **Execute Migration**
   - Paste SQL into query editor
   - Click "Run Query"
   - Verify success message

4. **Verify Tables Created**
   ```sql
   -- List all tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Should show: users, access_codes, sessions, auth_logs
   ```

### Verify Migration Success

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check access_codes table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'access_codes'
ORDER BY ordinal_position;

-- Check sessions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Check auth_logs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auth_logs'
ORDER BY ordinal_position;

-- Verify indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## Import Access Codes to Staging

### Method 1: Using Script (Recommended)

```bash
# Set staging DATABASE_URL
export DATABASE_URL="[Your staging Postgres connection string]"

# Run import script
npm run import:codes

# Or manually
node scripts/import-access-codes.ts
```

### Method 2: Manual SQL Insert

```sql
-- Insert all 11 access codes
INSERT INTO access_codes (code, redeemed, created_at) VALUES
  ('CODE0001', false, NOW()),
  ('CODE0002', false, NOW()),
  ('CODE0003', false, NOW()),
  ('CODE0004', false, NOW()),
  ('CODE0005', false, NOW()),
  ('CODE0006', false, NOW()),
  ('CODE0007', false, NOW()),
  ('CODE0008', false, NOW()),
  ('CODE0009', false, NOW()),
  ('CODE0010', false, NOW()),
  ('CODE0011', false, NOW());
```

### Verify Import

```sql
-- Check all codes imported
SELECT code, redeemed, redeemed_by, redeemed_at, created_at
FROM access_codes
ORDER BY code;

-- Count total codes
SELECT COUNT(*) as total_codes FROM access_codes;
-- Should return: 11

-- Verify all unredeemed
SELECT COUNT(*) as unredeemed_codes 
FROM access_codes 
WHERE redeemed = false;
-- Should return: 11
```

## Staging Validation Tests

### Test 1: Registration Flow

```bash
# Set staging URL
STAGING_URL="https://agents-md-v2-git-auth-system-staging-yourteam.vercel.app"

# Test valid registration
curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0001",
    "email": "test1@staging.com",
    "password": "TestPass123!"
  }'

# Expected: 200 OK with user data
# {
#   "success": true,
#   "message": "Registration successful",
#   "user": {
#     "id": "...",
#     "email": "test1@staging.com",
#     "createdAt": "..."
#   }
# }
```

### Test 2: Access Code Validation

```bash
# Test invalid access code
curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "INVALID",
    "email": "test2@staging.com",
    "password": "TestPass123!"
  }'

# Expected: 404 Not Found
# { "success": false, "message": "Invalid access code" }

# Test already-redeemed code
curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0001",
    "email": "test3@staging.com",
    "password": "TestPass123!"
  }'

# Expected: 410 Gone
# { "success": false, "message": "This access code has already been used" }
```

### Test 3: Login Flow

```bash
# Test successful login
curl -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test1@staging.com",
    "password": "TestPass123!"
  }'

# Expected: 200 OK with user data and auth_token cookie
# {
#   "success": true,
#   "message": "Login successful",
#   "user": {
#     "id": "...",
#     "email": "test1@staging.com"
#   }
# }

# Test invalid credentials
curl -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@staging.com",
    "password": "WrongPassword"
  }'

# Expected: 401 Unauthorized
# { "success": false, "message": "Invalid email or password" }
```

### Test 4: Session Persistence

```bash
# Test authenticated endpoint with cookie
curl -X GET $STAGING_URL/api/auth/me \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Expected: 200 OK with user data
# {
#   "success": true,
#   "user": {
#     "id": "...",
#     "email": "test1@staging.com",
#     "createdAt": "..."
#   }
# }

# Test without cookie
curl -X GET $STAGING_URL/api/auth/me \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
# { "success": false, "message": "Not authenticated" }
```

### Test 5: Logout Flow

```bash
# Test logout
curl -X POST $STAGING_URL/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt

# Expected: 200 OK
# { "success": true, "message": "Logout successful" }

# Verify session invalidated
curl -X GET $STAGING_URL/api/auth/me \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Expected: 401 Unauthorized
# { "success": false, "message": "Not authenticated" }
```

### Test 6: Rate Limiting

```bash
# Test rate limiting (5 failed attempts)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST $STAGING_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "ratelimit@staging.com",
      "password": "WrongPassword"
    }'
  echo ""
  sleep 1
done

# Expected: First 5 attempts return 401, 6th returns 429
# { "success": false, "message": "Too many attempts. Please try again later." }
```

### Test 7: Email Delivery (Manual)

1. **Register New User**
   ```bash
   curl -X POST $STAGING_URL/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "accessCode": "CODE0002",
       "email": "your-real-email@example.com",
       "password": "TestPass123!"
     }'
   ```

2. **Check Email Inbox**
   - Look for welcome email from `no-reply@arcane.group`
   - Verify email contains:
     - User's email address
     - Platform URL
     - Getting started information
     - Bitcoin Sovereign branding

3. **Verify Email Logs**
   - Check Vercel function logs for email sending
   - Look for success/failure messages

### Test 8: Admin Access Codes Endpoint

```bash
# Login as admin (use first registered user)
curl -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -c admin-cookies.txt \
  -d '{
    "email": "test1@staging.com",
    "password": "TestPass123!"
  }'

# Get access codes status
curl -X GET $STAGING_URL/api/admin/access-codes \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt

# Expected: 200 OK with list of all codes
# {
#   "success": true,
#   "codes": [
#     {
#       "id": "...",
#       "code": "CODE0001",
#       "redeemed": true,
#       "redeemedBy": "...",
#       "redeemedAt": "...",
#       "createdAt": "..."
#     },
#     ...
#   ]
# }
```

### Test 9: CSRF Protection

```bash
# Test state-changing request without CSRF token
curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -d '{
    "accessCode": "CODE0003",
    "email": "csrf-test@staging.com",
    "password": "TestPass123!"
  }'

# Expected: Should work (CSRF implemented but may need additional headers)
# Note: Full CSRF testing requires browser environment
```

### Test 10: SQL Injection Prevention

```bash
# Test SQL injection in email field
curl -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1--",
    "password": "anything"
  }'

# Expected: 401 Unauthorized (not SQL error)
# { "success": false, "message": "Invalid email or password" }

# Test SQL injection in access code
curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0001 OR 1=1--",
    "email": "sql-test@staging.com",
    "password": "TestPass123!"
  }'

# Expected: 404 Not Found (not SQL error)
# { "success": false, "message": "Invalid access code" }
```

## Frontend Testing (Manual)

### Test 1: Access Gate Display

1. **Open Staging URL in Browser**
   - Navigate to staging URL
   - Should see AccessGate component
   - Verify Bitcoin Sovereign styling (black background, orange accents)

2. **Check UI Elements**
   - [ ] Logo visible
   - [ ] "I have an access code" button
   - [ ] "I already have an account" button
   - [ ] "Request Access" button
   - [ ] All buttons have proper styling

### Test 2: Registration Form

1. **Click "I have an access code"**
   - Registration form should appear
   - Verify form fields:
     - [ ] Access Code input
     - [ ] Email input
     - [ ] Password input
     - [ ] Confirm Password input
     - [ ] Submit button

2. **Test Form Validation**
   - Try submitting empty form (should show errors)
   - Try mismatched passwords (should show error)
   - Try weak password (should show error)
   - Try invalid email (should show error)

3. **Test Successful Registration**
   - Enter valid access code (CODE0003)
   - Enter valid email
   - Enter strong password
   - Confirm password
   - Submit form
   - Should see success message
   - Should be redirected to platform

### Test 3: Login Form

1. **Click "I already have an account"**
   - Login form should appear
   - Verify form fields:
     - [ ] Email input
     - [ ] Password input
     - [ ] Remember Me checkbox
     - [ ] Submit button

2. **Test Login**
   - Enter registered email
   - Enter correct password
   - Submit form
   - Should see success message
   - Should be redirected to platform

3. **Test Failed Login**
   - Enter wrong password
   - Should see error message
   - Should remain on login form

### Test 4: Session Persistence

1. **After Successful Login**
   - Refresh page
   - Should remain logged in
   - Should see platform content

2. **Open New Tab**
   - Navigate to staging URL
   - Should automatically be logged in
   - Should see platform content

3. **Test Logout**
   - Click logout button (if visible)
   - Should be redirected to AccessGate
   - Refresh page
   - Should still see AccessGate

### Test 5: Mobile Responsiveness

1. **Open DevTools**
   - Press F12
   - Click device toolbar icon
   - Select mobile device (iPhone 12, etc.)

2. **Test Mobile Layout**
   - [ ] AccessGate fits screen
   - [ ] Forms are readable
   - [ ] Buttons are tappable (48px minimum)
   - [ ] Text is legible
   - [ ] No horizontal scroll

3. **Test Touch Interactions**
   - Tap buttons
   - Fill forms
   - Submit forms
   - Verify all interactions work

## Database Verification

### Check User Records

```sql
-- View all registered users
SELECT id, email, created_at, updated_at
FROM users
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM users;
```

### Check Access Code Status

```sql
-- View all access codes with redemption status
SELECT 
  code,
  redeemed,
  redeemed_by,
  redeemed_at,
  created_at
FROM access_codes
ORDER BY code;

-- Count redeemed vs unredeemed
SELECT 
  redeemed,
  COUNT(*) as count
FROM access_codes
GROUP BY redeemed;
```

### Check Sessions

```sql
-- View active sessions
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.expires_at,
  s.created_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;

-- Count active sessions
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > NOW();
```

### Check Auth Logs

```sql
-- View recent authentication events
SELECT 
  al.event_type,
  u.email,
  al.ip_address,
  al.success,
  al.timestamp
FROM auth_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.timestamp DESC
LIMIT 50;

-- Count events by type
SELECT 
  event_type,
  success,
  COUNT(*) as count
FROM auth_logs
GROUP BY event_type, success
ORDER BY event_type, success;
```

## Performance Monitoring

### Check Response Times

```bash
# Test registration endpoint performance
time curl -X POST $STAGING_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0004",
    "email": "perf-test@staging.com",
    "password": "TestPass123!"
  }'

# Expected: < 2 seconds

# Test login endpoint performance
time curl -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "perf-test@staging.com",
    "password": "TestPass123!"
  }'

# Expected: < 1 second
```

### Monitor Vercel Logs

1. **Open Vercel Dashboard**
   - Go to your project
   - Click "Logs" tab
   - Filter by staging deployment

2. **Check for Errors**
   - Look for 500 errors
   - Check for database connection errors
   - Verify no rate limiting issues

3. **Monitor Performance**
   - Check function execution times
   - Verify database query times
   - Look for slow endpoints

## Staging Validation Checklist

### Database Setup
- [ ] Staging Postgres database created
- [ ] Staging KV store created
- [ ] Environment variables configured
- [ ] Database migrations executed successfully
- [ ] All 11 access codes imported
- [ ] Database schema verified (tables, indexes, foreign keys)

### API Testing
- [ ] Registration with valid code works
- [ ] Registration with invalid code fails (404)
- [ ] Registration with redeemed code fails (410)
- [ ] Registration with duplicate email fails (409)
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails (401)
- [ ] Login with non-existent email fails (401)
- [ ] Rate limiting blocks after 5 failed attempts (429)
- [ ] Logout clears session and cookie
- [ ] Session persistence works across requests
- [ ] Admin access codes endpoint works
- [ ] CSRF protection is active
- [ ] SQL injection attempts are blocked

### Frontend Testing
- [ ] AccessGate displays correctly
- [ ] Registration form works
- [ ] Login form works
- [ ] Form validation works
- [ ] Success messages display
- [ ] Error messages display
- [ ] Session persistence works
- [ ] Logout works
- [ ] Mobile responsive design works
- [ ] Touch targets are adequate (48px)

### Email Testing
- [ ] Welcome email sent after registration
- [ ] Email contains correct information
- [ ] Email has Bitcoin Sovereign branding
- [ ] Email delivery is timely (< 30 seconds)

### Security Testing
- [ ] Passwords are hashed (bcrypt)
- [ ] JWT tokens are httpOnly and secure
- [ ] Rate limiting prevents brute force
- [ ] SQL injection is prevented
- [ ] XSS is prevented
- [ ] CSRF protection is active

### Performance Testing
- [ ] Registration < 2 seconds
- [ ] Login < 1 second
- [ ] Logout < 500ms
- [ ] Token verification < 100ms
- [ ] No memory leaks
- [ ] No database connection issues

### Documentation
- [ ] All tests documented
- [ ] Issues logged (if any)
- [ ] Performance metrics recorded
- [ ] Screenshots captured (if needed)

## Issues and Resolutions

### Issue Template

```markdown
**Issue**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Error Messages**: [Any error messages]
**Resolution**: [How it was fixed]
**Status**: Open / In Progress / Resolved
```

### Common Issues

#### Issue: Database Connection Timeout
**Resolution**: Check DATABASE_URL is correct, verify SSL mode is enabled

#### Issue: Rate Limiting Not Working
**Resolution**: Verify KV credentials, check KV connection in logs

#### Issue: Email Not Sending
**Resolution**: Verify Office 365 credentials, check Microsoft Graph API permissions

#### Issue: JWT Token Invalid
**Resolution**: Ensure JWT_SECRET is set correctly, check token expiration

## Next Steps After Staging Validation

Once all tests pass on staging:

1. **Document Results**
   - [ ] All tests passed
   - [ ] Performance metrics acceptable
   - [ ] No critical issues found
   - [ ] Screenshots captured

2. **Get Approval**
   - [ ] Team review completed
   - [ ] Stakeholder approval received
   - [ ] Security review passed

3. **Prepare for Production**
   - [ ] Production environment variables ready
   - [ ] Production database ready
   - [ ] Rollback plan documented
   - [ ] Monitoring configured

4. **Schedule Production Deployment**
   - [ ] Deployment window scheduled
   - [ ] Team notified
   - [ ] Rollback plan reviewed
   - [ ] Post-deployment monitoring plan ready

---

**Last Updated**: January 26, 2025  
**Version**: 1.0.0  
**Status**: Ready for Staging Deployment ✅
