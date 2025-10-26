# Staging Deployment Checklist

## Quick Reference

Use this checklist to ensure all steps are completed for staging deployment.

---

## Pre-Deployment Phase

### Code Preparation
- [ ] All Phase 1-7 tasks completed
- [ ] All tests passing locally (`npm test -- --run`)
- [ ] Code reviewed and approved
- [ ] No uncommitted changes (or changes are intentional)
- [ ] On main branch with latest changes

### Documentation Review
- [ ] Read `docs/STAGING-DEPLOYMENT-GUIDE.md`
- [ ] Read `docs/DEPLOYMENT.md`
- [ ] Understand rollback procedures
- [ ] Team notified of staging deployment

---

## Deployment Phase

### Step 1: Create Staging Branch
- [ ] Run: `git checkout main`
- [ ] Run: `git pull origin main`
- [ ] Run: `git checkout -b auth-system-staging`
- [ ] Verify branch: `git branch --show-current`

**OR use automated script:**
- [ ] Run: `.\scripts\deploy-staging.ps1`

### Step 2: Commit and Push Changes
- [ ] Stage all authentication files
- [ ] Commit with descriptive message
- [ ] Push to remote: `git push origin auth-system-staging`
- [ ] Verify push successful

### Step 3: Monitor Vercel Deployment
- [ ] Go to https://vercel.com/dashboard
- [ ] Navigate to your project
- [ ] Click "Deployments" tab
- [ ] Find deployment for `auth-system-staging` branch
- [ ] Wait for "Ready" status (2-5 minutes)
- [ ] Note preview URL
- [ ] Check build logs for errors

---

## Database Setup Phase

### Step 4: Create Staging Postgres Database
- [ ] Vercel Dashboard > Storage > Create Database
- [ ] Select "Postgres"
- [ ] Name: `agents-md-auth-staging`
- [ ] Region: Same as production (e.g., `us-east-1`)
- [ ] Plan: Hobby (free)
- [ ] Wait for provisioning (2-3 minutes)
- [ ] Copy `DATABASE_URL` from .env.local tab
- [ ] Save connection string securely

### Step 5: Create Staging KV Store
- [ ] Vercel Dashboard > Storage > Create Database
- [ ] Select "KV"
- [ ] Name: `agents-md-rate-limit-staging`
- [ ] Region: Same as Postgres
- [ ] Plan: Hobby (free)
- [ ] Wait for provisioning (1-2 minutes)
- [ ] Copy `KV_REST_API_URL`
- [ ] Copy `KV_REST_API_TOKEN`
- [ ] Copy `KV_REST_API_READ_ONLY_TOKEN`
- [ ] Save credentials securely

### Step 6: Configure Environment Variables
- [ ] Vercel Dashboard > Project > Settings > Environment Variables
- [ ] Add `DATABASE_URL` (Preview environment)
- [ ] Add `JWT_SECRET` (Generate: `openssl rand -base64 32`)
- [ ] Add `JWT_EXPIRATION` = `7d`
- [ ] Add `KV_REST_API_URL` (Preview environment)
- [ ] Add `KV_REST_API_TOKEN` (Preview environment)
- [ ] Add `KV_REST_API_READ_ONLY_TOKEN` (Preview environment)
- [ ] Add `CRON_SECRET` (Generate: `openssl rand -base64 32`)
- [ ] Add `NEXTAUTH_URL` = [Preview URL]
- [ ] Add `AUTH_RATE_LIMIT_MAX_ATTEMPTS` = `5`
- [ ] Add `AUTH_RATE_LIMIT_WINDOW_MS` = `900000`
- [ ] Add Office 365 email variables (if testing email)
- [ ] Save all variables
- [ ] Redeploy: Deployments > ... > Redeploy

---

## Database Migration Phase

### Step 7: Run Database Migrations
- [ ] Set local `DATABASE_URL` to staging connection string
- [ ] Run: `npm run migrate:prod` OR `node scripts/run-migrations.ts`
- [ ] Verify success message
- [ ] Check for errors in output

### Step 8: Verify Database Schema
- [ ] Open Vercel SQL Editor (Storage > Database > Query)
- [ ] Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- [ ] Verify tables exist: `users`, `access_codes`, `sessions`, `auth_logs`
- [ ] Check users table structure
- [ ] Check access_codes table structure
- [ ] Check sessions table structure
- [ ] Check auth_logs table structure
- [ ] Verify indexes created
- [ ] Verify foreign keys created

### Step 9: Import Access Codes
- [ ] Set local `DATABASE_URL` to staging connection string
- [ ] Run: `npm run import:codes` OR `node scripts/import-access-codes.ts`
- [ ] Verify success message
- [ ] Run: `SELECT COUNT(*) FROM access_codes;` (Should return 11)
- [ ] Run: `SELECT code, redeemed FROM access_codes ORDER BY code;`
- [ ] Verify all codes are unredeemed

---

## Validation Phase

### Step 10: Automated API Testing
- [ ] Run: `.\scripts\validate-staging.ps1 -StagingUrl "https://your-staging-url.vercel.app"`
- [ ] Review test results
- [ ] All tests should pass
- [ ] If failures, check logs and fix issues

### Step 11: Manual Registration Testing
- [ ] Open staging URL in browser
- [ ] Verify AccessGate displays
- [ ] Click "I have an access code"
- [ ] Enter valid code: `CODE0001`
- [ ] Enter email: `manual-test@staging.com`
- [ ] Enter password: `TestPass123!`
- [ ] Confirm password
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify redirected to platform

### Step 12: Manual Login Testing
- [ ] Logout (if logged in)
- [ ] Click "I already have an account"
- [ ] Enter email: `manual-test@staging.com`
- [ ] Enter password: `TestPass123!`
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify redirected to platform

### Step 13: Session Persistence Testing
- [ ] After successful login, refresh page
- [ ] Verify still logged in
- [ ] Open new tab, navigate to staging URL
- [ ] Verify automatically logged in
- [ ] Close all tabs
- [ ] Reopen staging URL
- [ ] Verify still logged in (within 7 days)

### Step 14: Logout Testing
- [ ] Click logout button
- [ ] Verify redirected to AccessGate
- [ ] Refresh page
- [ ] Verify still see AccessGate
- [ ] Try to access protected content
- [ ] Verify redirected to AccessGate

### Step 15: Rate Limiting Testing
- [ ] Try 6 failed login attempts rapidly
- [ ] Verify 6th attempt returns "Too many attempts"
- [ ] Wait 15 minutes
- [ ] Try login again
- [ ] Verify rate limit reset

### Step 16: Access Code Validation Testing
- [ ] Try registration with invalid code
- [ ] Verify error: "Invalid access code"
- [ ] Try registration with already-redeemed code
- [ ] Verify error: "This access code has already been used"
- [ ] Try registration with duplicate email
- [ ] Verify error: "An account with this email already exists"

### Step 17: Email Testing (Optional)
- [ ] Register with real email address
- [ ] Check inbox for welcome email
- [ ] Verify email from `no-reply@arcane.group`
- [ ] Verify email contains correct information
- [ ] Verify Bitcoin Sovereign branding
- [ ] Verify email received within 30 seconds

### Step 18: Mobile Responsiveness Testing
- [ ] Open DevTools (F12)
- [ ] Enable device toolbar
- [ ] Test on iPhone 12 (390px)
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPad Mini (768px)
- [ ] Verify all forms are usable
- [ ] Verify buttons are tappable (48px)
- [ ] Verify no horizontal scroll
- [ ] Verify text is readable

### Step 19: Security Testing
- [ ] Test SQL injection in email field
- [ ] Test SQL injection in access code field
- [ ] Test XSS in form inputs
- [ ] Verify all attempts are blocked
- [ ] Check Vercel logs for security errors

### Step 20: Performance Testing
- [ ] Measure registration response time (< 2s)
- [ ] Measure login response time (< 1s)
- [ ] Measure logout response time (< 500ms)
- [ ] Check Vercel function execution times
- [ ] Verify no timeout errors

---

## Database Verification Phase

### Step 21: Verify User Records
- [ ] Run: `SELECT id, email, created_at FROM users ORDER BY created_at DESC;`
- [ ] Verify test users created
- [ ] Verify passwords are hashed (not plain text)
- [ ] Verify timestamps are correct

### Step 22: Verify Access Code Status
- [ ] Run: `SELECT code, redeemed, redeemed_by, redeemed_at FROM access_codes ORDER BY code;`
- [ ] Verify used codes marked as redeemed
- [ ] Verify redeemed_by matches user ID
- [ ] Verify redeemed_at timestamp is correct

### Step 23: Verify Sessions
- [ ] Run: `SELECT s.id, u.email, s.expires_at FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.expires_at > NOW();`
- [ ] Verify active sessions exist
- [ ] Verify expiration dates are correct (7 days from creation)
- [ ] Verify token_hash is present (not plain token)

### Step 24: Verify Auth Logs
- [ ] Run: `SELECT event_type, success, COUNT(*) FROM auth_logs GROUP BY event_type, success;`
- [ ] Verify registration events logged
- [ ] Verify login events logged
- [ ] Verify failed login attempts logged
- [ ] Verify logout events logged

---

## Monitoring Phase

### Step 25: Check Vercel Logs
- [ ] Vercel Dashboard > Project > Logs
- [ ] Filter by staging deployment
- [ ] Check for errors (should be none)
- [ ] Check for warnings
- [ ] Verify no database connection errors
- [ ] Verify no rate limiting errors

### Step 26: Check Database Performance
- [ ] Vercel Dashboard > Storage > Database > Insights
- [ ] Check query performance (< 50ms average)
- [ ] Check connection pool usage (< 80%)
- [ ] Verify no slow queries
- [ ] Verify no connection errors

### Step 27: Check KV Performance
- [ ] Vercel Dashboard > Storage > KV > Insights
- [ ] Check request latency (< 10ms)
- [ ] Check hit rate
- [ ] Verify no connection errors
- [ ] Verify rate limiting working

---

## Documentation Phase

### Step 28: Document Test Results
- [ ] Create test results document
- [ ] Record all test outcomes
- [ ] Document any issues found
- [ ] Document resolutions
- [ ] Capture screenshots (if needed)
- [ ] Record performance metrics

### Step 29: Document Issues
- [ ] List any bugs found
- [ ] Categorize by severity
- [ ] Document steps to reproduce
- [ ] Document expected vs actual behavior
- [ ] Assign to team members
- [ ] Track resolution status

### Step 30: Update Deployment Documentation
- [ ] Update `docs/STAGING-DEPLOYMENT-GUIDE.md` with any learnings
- [ ] Document any deviations from plan
- [ ] Add troubleshooting tips
- [ ] Update environment variable list
- [ ] Update test procedures

---

## Approval Phase

### Step 31: Team Review
- [ ] Share test results with team
- [ ] Demo staging environment
- [ ] Address any concerns
- [ ] Get technical approval
- [ ] Get product approval

### Step 32: Stakeholder Review
- [ ] Demo to stakeholders
- [ ] Walk through authentication flows
- [ ] Show security features
- [ ] Address questions
- [ ] Get approval for production

### Step 33: Security Review
- [ ] Review security test results
- [ ] Verify all vulnerabilities addressed
- [ ] Check password hashing
- [ ] Verify JWT security
- [ ] Confirm rate limiting works
- [ ] Get security team approval

---

## Pre-Production Phase

### Step 34: Production Environment Preparation
- [ ] Create production Postgres database
- [ ] Create production KV store
- [ ] Generate production secrets
- [ ] Prepare production environment variables
- [ ] Document production connection strings

### Step 35: Production Deployment Plan
- [ ] Schedule deployment window
- [ ] Notify team of deployment time
- [ ] Prepare rollback plan
- [ ] Assign roles (deployer, monitor, support)
- [ ] Set up monitoring alerts

### Step 36: Final Staging Verification
- [ ] Run full test suite one more time
- [ ] Verify no new issues
- [ ] Verify all fixes deployed
- [ ] Verify performance acceptable
- [ ] Get final go/no-go decision

---

## Completion Checklist

### All Tests Passed
- [ ] Automated API tests: 100% pass rate
- [ ] Manual registration tests: All passed
- [ ] Manual login tests: All passed
- [ ] Session persistence tests: All passed
- [ ] Rate limiting tests: All passed
- [ ] Security tests: All passed
- [ ] Performance tests: All passed
- [ ] Mobile tests: All passed
- [ ] Email tests: All passed (if applicable)

### All Verifications Complete
- [ ] Database schema verified
- [ ] Access codes verified
- [ ] User records verified
- [ ] Sessions verified
- [ ] Auth logs verified
- [ ] Vercel logs checked
- [ ] Database performance checked
- [ ] KV performance checked

### All Approvals Received
- [ ] Technical team approval
- [ ] Product team approval
- [ ] Security team approval
- [ ] Stakeholder approval

### Documentation Complete
- [ ] Test results documented
- [ ] Issues documented and resolved
- [ ] Deployment guide updated
- [ ] Screenshots captured
- [ ] Performance metrics recorded

### Ready for Production
- [ ] All staging tests passed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Team trained
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Production environment prepared

---

## Sign-Off

**Staging Deployment Completed By**: ___________________________

**Date**: ___________________________

**Staging URL**: ___________________________

**Test Results**: ___________________________

**Issues Found**: ___________________________

**Issues Resolved**: ___________________________

**Ready for Production**: [ ] Yes [ ] No

**Approved By**:
- Technical Lead: ___________________________
- Product Manager: ___________________________
- Security Lead: ___________________________

**Production Deployment Scheduled**: ___________________________

---

**Last Updated**: January 26, 2025  
**Version**: 1.0.0  
**Status**: Ready for Use ✅
