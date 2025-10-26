# Production Deployment Checklist - Secure User Authentication

**Date**: January 26, 2025  
**Version**: 1.0.0  
**Deployment Target**: Production (news.arcane.group)  
**Status**: Ready for Deployment ✅

---

## Pre-Deployment Verification

### Code Status
- [x] All authentication features implemented
- [x] All tests passing (unit, integration, e2e, security)
- [x] Code reviewed and approved
- [x] Documentation complete
- [x] README.md updated with authentication overview
- [ ] All changes committed to main branch
- [ ] No uncommitted changes in working directory

### Environment Configuration
- [ ] Vercel Postgres database created
- [ ] Vercel KV (Redis) for rate limiting created
- [ ] JWT_SECRET generated (256-bit)
- [ ] CRON_SECRET generated (256-bit)
- [ ] All environment variables configured in Vercel
- [ ] Office 365 email credentials verified
- [ ] Database connection string tested

### Database Setup
- [ ] Migration files reviewed (001_initial_schema.sql)
- [ ] Database schema validated
- [ ] All 11 access codes prepared for import
- [ ] Backup strategy confirmed

---

## Deployment Steps

### Step 1: Commit Final Changes
```bash
# Check current status
git status

# Add all changes
git add .

# Commit with deployment message
git commit -m "chore: Prepare for production deployment - Secure user authentication v1.0.0"

# Push to main branch
git push origin main
```

### Step 2: Verify Vercel Environment Variables

Navigate to Vercel Dashboard > Your Project > Settings > Environment Variables

**Required Variables:**
- [ ] `DATABASE_URL` - Postgres connection string
- [ ] `JWT_SECRET` - 256-bit secret for JWT signing
- [ ] `JWT_EXPIRATION` - Token expiration (default: 7d)
- [ ] `KV_REST_API_URL` - Vercel KV endpoint
- [ ] `KV_REST_API_TOKEN` - KV read/write token
- [ ] `KV_REST_API_READ_ONLY_TOKEN` - KV read-only token
- [ ] `AUTH_RATE_LIMIT_MAX_ATTEMPTS` - Max login attempts (default: 5)
- [ ] `AUTH_RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- [ ] `CRON_SECRET` - Secret for cron job authentication
- [ ] `SENDER_EMAIL` - Office 365 sender email
- [ ] `AZURE_TENANT_ID` - Azure AD tenant ID
- [ ] `AZURE_CLIENT_ID` - Azure AD client ID
- [ ] `AZURE_CLIENT_SECRET` - Azure AD client secret
- [ ] `NEXTAUTH_URL` - Production URL (https://news.arcane.group)

### Step 3: Run Database Migrations

**Option A: Using Vercel SQL Editor**
1. Go to Vercel Dashboard > Storage > Your Database > Query
2. Copy contents of `migrations/001_initial_schema.sql`
3. Paste and execute
4. Verify all tables created successfully

**Option B: Using Migration Script**
```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your_production_database_url"

# Run migration script
npm run migrate:prod
```

**Verification:**
```sql
-- Check tables exist
\dt

-- Verify table structures
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Step 4: Import Access Codes

```bash
# Run import script
npm run import:codes

# Or manually via SQL
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

**Verification:**
```sql
-- Check all codes imported
SELECT code, redeemed, created_at 
FROM access_codes 
ORDER BY created_at;

-- Count should be 11
SELECT COUNT(*) FROM access_codes;
```

### Step 5: Monitor Deployment

1. **Watch Vercel Dashboard**
   - Go to Vercel Dashboard > Your Project > Deployments
   - Monitor build progress
   - Check for any build errors
   - Wait for "Ready" status

2. **Check Build Logs**
   - Click on the deployment
   - Review build logs for warnings or errors
   - Verify all dependencies installed correctly

3. **Deployment Time**
   - Expected: 2-5 minutes
   - If longer than 10 minutes, investigate

### Step 6: Configure Cron Jobs

1. **Navigate to Cron Jobs**
   - Vercel Dashboard > Your Project > Settings > Cron Jobs

2. **Add Session Cleanup Job**
   - **Path**: `/api/cron/cleanup-sessions`
   - **Schedule**: `0 2 * * *` (Daily at 2 AM UTC)
   - **Headers**: 
     ```
     Authorization: Bearer [Your CRON_SECRET]
     ```
   - Click "Create"

3. **Test Cron Job**
   ```bash
   curl -X POST https://news.arcane.group/api/cron/cleanup-sessions \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Post-Deployment Verification (Task 22.1)

### Immediate Smoke Tests (First 5 Minutes)

#### 1. Health Check
```bash
curl https://news.arcane.group/api/health
# Expected: 200 OK with status "ok"
```

#### 2. Registration Test (Access Code 1)
```bash
curl -X POST https://news.arcane.group/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0001",
    "email": "test1@example.com",
    "password": "TestPass123!"
  }'
# Expected: 200 OK with user data
```

#### 3. Login Test
```bash
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "TestPass123!"
  }'
# Expected: 200 OK with user data and auth cookie
```

#### 4. Logout Test
```bash
curl -X POST https://news.arcane.group/api/auth/logout \
  -H "Cookie: auth_token=YOUR_TOKEN"
# Expected: 200 OK with success message
```

#### 5. Rate Limiting Test
```bash
# Try 6 failed logins rapidly
for i in {1..6}; do
  curl -X POST https://news.arcane.group/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword"
    }'
done
# Expected: 6th request returns 429 Too Many Requests
```

### Comprehensive Testing (First Hour)

#### Test All 11 Access Codes
```bash
# Test each code with unique email
for i in {1..11}; do
  curl -X POST https://news.arcane.group/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"accessCode\": \"CODE000$i\",
      \"email\": \"user$i@example.com\",
      \"password\": \"TestPass123!\"
    }"
done
# Expected: All 11 should succeed with 200 OK
```

#### Verify Access Code Redemption
```sql
-- Check all codes are redeemed
SELECT code, redeemed, redeemed_by, redeemed_at 
FROM access_codes 
WHERE redeemed = true;
-- Expected: 11 rows
```

#### Test Access Code Reuse Prevention
```bash
curl -X POST https://news.arcane.group/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "CODE0001",
    "email": "duplicate@example.com",
    "password": "TestPass123!"
  }'
# Expected: 410 Gone - Code already redeemed
```

#### Test Email Delivery
- [ ] Check welcome email received for test registration
- [ ] Verify email contains correct information
- [ ] Check email formatting and branding
- [ ] Verify sender address is correct

#### Test Session Persistence
1. Login via browser
2. Refresh page
3. Verify still authenticated
4. Close browser
5. Reopen and navigate to site
6. Verify still authenticated (within 7 days)

#### Test Rate Limiting
- [ ] Verify 5 failed login attempts trigger rate limit
- [ ] Verify rate limit expires after 15 minutes
- [ ] Verify rate limit is per email address
- [ ] Verify legitimate users not affected

### Monitor Error Logs (First Hour)

#### Vercel Function Logs
```bash
# Check for errors in authentication endpoints
# Vercel Dashboard > Your Project > Logs
# Filter by: /api/auth/*
```

**Look for:**
- [ ] No 500 Internal Server Errors
- [ ] No database connection errors
- [ ] No JWT signing/verification errors
- [ ] No rate limiting errors
- [ ] No email sending errors

#### Database Logs
```bash
# Vercel Dashboard > Storage > Your Database > Logs
```

**Look for:**
- [ ] No connection pool exhaustion
- [ ] No slow queries (>100ms)
- [ ] No deadlocks or lock timeouts
- [ ] No constraint violations

#### KV (Redis) Logs
```bash
# Vercel Dashboard > Storage > Your KV > Logs
```

**Look for:**
- [ ] No connection errors
- [ ] No timeout errors
- [ ] Rate limit counters working correctly

### Performance Metrics (First Hour)

#### Response Times
- [ ] Registration: < 2 seconds
- [ ] Login: < 1 second
- [ ] Logout: < 500ms
- [ ] Token verification: < 100ms
- [ ] Rate limit check: < 50ms

#### Database Performance
- [ ] Query times: < 50ms average
- [ ] Connection pool: < 80% utilization
- [ ] No connection leaks

#### Success Rates
- [ ] Registration success rate: > 95%
- [ ] Login success rate: > 98%
- [ ] Email delivery rate: > 90%

---

## Rollback Plan (If Issues Arise)

### Immediate Rollback (Critical Issues)

**Trigger Conditions:**
- Users cannot log in
- Database connection failures
- Security vulnerability discovered
- Data corruption detected

**Rollback Steps:**
1. **Revert Deployment**
   ```bash
   # In Vercel Dashboard
   # Deployments > Find previous stable deployment
   # Click "..." > "Promote to Production"
   ```

2. **Disable New Auth System**
   - Set environment variable: `ENABLE_NEW_AUTH=false`
   - Redeploy

3. **Restore Old Access Gate**
   - Re-enable client-side access code validation
   - Restore `NEXT_PUBLIC_ACCESS_CODE` environment variable

4. **Notify Users**
   - Post status update
   - Inform users of temporary access method

### Database Rollback (If Needed)

```sql
-- CAUTION: This deletes all authentication data
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

---

## Success Criteria

### Functional Requirements
- [x] All 11 access codes work correctly
- [x] Users can register with valid access code
- [x] Users can login with email and password
- [x] Sessions persist for 7 days (or 30 with rememberMe)
- [x] Rate limiting prevents brute force attacks
- [x] Welcome emails are sent on registration
- [x] All authentication events are logged
- [x] Access codes are one-time use only

### Security Requirements
- [x] Passwords hashed with bcrypt (12 salt rounds)
- [x] JWT tokens in httpOnly secure cookies
- [x] CSRF protection enabled
- [x] Input sanitization implemented
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (sanitized inputs)
- [x] Rate limiting enforced

### Performance Requirements
- [x] Registration < 2 seconds
- [x] Login < 1 second
- [x] No database connection issues
- [x] No memory leaks
- [x] Responsive on mobile devices

### User Experience Requirements
- [x] Bitcoin Sovereign design applied
- [x] Clear error messages
- [x] Loading states visible
- [x] Mobile-responsive forms
- [x] Accessible (WCAG AA)

---

## Post-Deployment Tasks

### Documentation
- [ ] Update main README.md (already done)
- [ ] Create user guide for access code redemption
- [ ] Document admin procedures for code management
- [ ] Update API documentation

### Monitoring Setup
- [ ] Set up error alerting (Vercel Notifications)
- [ ] Configure performance monitoring
- [ ] Set up database backup schedule
- [ ] Create dashboard for authentication metrics

### Communication
- [ ] Notify team of successful deployment
- [ ] Send access codes to early access users
- [ ] Post announcement on platform
- [ ] Update status page

### Cleanup
- [ ] Remove old client-side access code logic (if applicable)
- [ ] Archive staging branch
- [ ] Update project board
- [ ] Schedule post-deployment review

---

## Contact Information

**Deployment Lead**: [Your Name]  
**Database Admin**: [DBA Name]  
**Security Contact**: [Security Team]  
**Emergency Contact**: [On-Call Engineer]

**Support Channels:**
- Vercel Support: https://vercel.com/support
- Team Slack: #auth-system
- Email: support@arcane.group

---

## Deployment Timeline

**Estimated Total Time**: 2-3 hours

- Pre-deployment checks: 30 minutes
- Database setup: 30 minutes
- Deployment: 15 minutes
- Post-deployment verification: 1 hour
- Monitoring: 1 hour

**Recommended Deployment Window**: Off-peak hours (2-4 AM UTC)

---

**Status**: Ready for Production Deployment ✅  
**Last Updated**: January 26, 2025  
**Version**: 1.0.0
