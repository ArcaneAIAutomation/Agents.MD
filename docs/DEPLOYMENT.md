# Secure User Authentication - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the secure user authentication system to production. The system uses Vercel Postgres for database storage, Vercel KV for rate limiting, and JWT-based session management.

## Prerequisites

Before deploying, ensure you have:

- [ ] Vercel account with billing enabled
- [ ] Access to Vercel Dashboard
- [ ] Git repository connected to Vercel
- [ ] Node.js 18+ installed locally
- [ ] PostgreSQL client (optional, for local testing)

## Table of Contents

1. [Vercel Postgres Setup](#vercel-postgres-setup)
2. [Vercel KV Setup](#vercel-kv-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Database Migration Process](#database-migration-process)
5. [Access Code Import](#access-code-import)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Vercel Postgres Setup

### Step 1: Create Postgres Database

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project

2. **Create Storage**
   - Click on the "Storage" tab
   - Click "Create Database"
   - Select "Postgres"

3. **Configure Database**
   - **Name**: `agents-md-auth-db` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Plan**: Start with Hobby (free), upgrade to Pro if needed
   - Click "Create"

4. **Wait for Provisioning**
   - Database creation takes 2-3 minutes
   - You'll see a success message when ready

### Step 2: Get Connection String

1. **Access Database Settings**
   - Click on your newly created database
   - Navigate to the ".env.local" tab

2. **Copy Connection String**
   - You'll see a `DATABASE_URL` variable
   - Format: `postgres://default:password@host:5432/verceldb?sslmode=require`
   - Copy this entire string

3. **Save Securely**
   - Store in password manager
   - Never commit to version control
   - Keep for environment variable setup

### Database Specifications

- **Max Connections**: 20 (Hobby), 100 (Pro)
- **Storage**: 256 MB (Hobby), 512 GB (Pro)
- **Backup**: Automatic daily backups (Pro only)
- **SSL**: Required (enforced by default)

---

## Vercel KV Setup

### Step 1: Create KV Database

1. **Navigate to Storage**
   - In Vercel Dashboard, go to "Storage" tab
   - Click "Create Database"
   - Select "KV" (Redis)

2. **Configure KV Store**
   - **Name**: `agents-md-rate-limit` (or your preferred name)
   - **Region**: Same as Postgres for low latency
   - **Plan**: Hobby (free) is sufficient for most use cases
   - Click "Create"

3. **Wait for Provisioning**
   - KV creation takes 1-2 minutes

### Step 2: Get KV Credentials

1. **Access KV Settings**
   - Click on your KV database
   - Navigate to the ".env.local" tab

2. **Copy KV Variables**
   - `KV_REST_API_URL`: REST API endpoint
   - `KV_REST_API_TOKEN`: Read/write token
   - `KV_REST_API_READ_ONLY_TOKEN`: Read-only token (optional)

3. **Save Securely**
   - Store all three values
   - Keep for environment variable setup

### KV Specifications

- **Max Keys**: 100,000 (Hobby), Unlimited (Pro)
- **Max Request Size**: 1 MB
- **TTL Support**: Yes (used for rate limiting windows)
- **Persistence**: In-memory with disk backup

---

## Environment Variables Configuration

### Step 1: Generate Secrets

Generate secure random strings for JWT and CRON secrets:

```bash
# Generate JWT_SECRET (256-bit)
openssl rand -base64 32

# Generate CRON_SECRET (256-bit)
openssl rand -base64 32
```

Save these values securely.

### Step 2: Configure Vercel Environment Variables

1. **Navigate to Project Settings**
   - Vercel Dashboard > Your Project > Settings
   - Click "Environment Variables"

2. **Add Required Variables**

   Add each variable with appropriate environment scope:

   #### Database Configuration
   ```
   Name: DATABASE_URL
   Value: postgres://default:password@host:5432/verceldb?sslmode=require
   Environments: Production, Preview, Development
   ```

   #### Authentication Configuration
   ```
   Name: JWT_SECRET
   Value: [Your generated 256-bit secret]
   Environments: Production, Preview, Development
   ```

   ```
   Name: JWT_EXPIRATION
   Value: 7d
   Environments: Production, Preview, Development
   ```

   #### Rate Limiting Configuration
   ```
   Name: KV_REST_API_URL
   Value: https://your-kv-instance.kv.vercel-storage.com
   Environments: Production, Preview, Development
   ```

   ```
   Name: KV_REST_API_TOKEN
   Value: [Your KV token]
   Environments: Production, Preview, Development
   ```

   ```
   Name: KV_REST_API_READ_ONLY_TOKEN
   Value: [Your KV read-only token]
   Environments: Production, Preview, Development
   ```

   ```
   Name: AUTH_RATE_LIMIT_MAX_ATTEMPTS
   Value: 5
   Environments: Production, Preview, Development
   ```

   ```
   Name: AUTH_RATE_LIMIT_WINDOW_MS
   Value: 900000
   Environments: Production, Preview, Development
   ```

   #### Cron Job Security
   ```
   Name: CRON_SECRET
   Value: [Your generated 256-bit secret]
   Environments: Production, Preview, Development
   ```

   #### Application Configuration
   ```
   Name: NEXTAUTH_URL
   Value: https://your-domain.vercel.app
   Environments: Production
   ```

   ```
   Name: NEXTAUTH_URL
   Value: https://your-preview-domain.vercel.app
   Environments: Preview
   ```

   ```
   Name: NEXTAUTH_URL
   Value: http://localhost:3000
   Environments: Development
   ```

3. **Save All Variables**
   - Click "Save" after adding each variable
   - Verify all variables are listed

### Step 3: Local Development Setup

1. **Copy Environment Template**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in Values**
   - Open `.env.local` in your editor
   - Replace all placeholder values with actual credentials
   - Save the file

3. **Verify Local Configuration**
   ```bash
   # Test database connection
   npm run db:test

   # Verify environment variables
   npm run env:check
   ```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Postgres connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing (256-bit) |
| `JWT_EXPIRATION` | No | `7d` | Token expiration time |
| `KV_REST_API_URL` | Yes | - | Vercel KV REST endpoint |
| `KV_REST_API_TOKEN` | Yes | - | KV read/write token |
| `KV_REST_API_READ_ONLY_TOKEN` | No | - | KV read-only token |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | No | `5` | Max login attempts per window |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `CRON_SECRET` | Yes | - | Secret for cron job auth |
| `NEXTAUTH_URL` | Yes | - | Application URL |

---

## Database Migration Process

### Step 1: Review Migration Files

1. **Check Migration Directory**
   ```bash
   ls -la migrations/
   ```

2. **Review Migration SQL**
   ```bash
   cat migrations/001_initial_schema.sql
   ```

   Verify the migration includes:
   - `users` table
   - `access_codes` table
   - `sessions` table
   - `auth_logs` table
   - All indexes
   - Foreign key constraints

### Step 2: Run Migrations (Production)

1. **Connect to Production Database**
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="postgres://default:password@host:5432/verceldb?sslmode=require"
   ```

2. **Execute Migration Script**
   ```bash
   npm run migrate:prod
   ```

   Or manually:
   ```bash
   node scripts/run-migrations.ts
   ```

3. **Verify Migration Success**
   ```bash
   # Check tables were created
   npm run db:verify
   ```

### Step 3: Verify Database Schema

1. **Connect to Database**
   - Use Vercel Dashboard SQL editor
   - Or use `psql` client:
     ```bash
     psql $DATABASE_URL
     ```

2. **Check Tables**
   ```sql
   -- List all tables
   \dt

   -- Verify users table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';

   -- Verify access_codes table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'access_codes';

   -- Verify sessions table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'sessions';

   -- Verify auth_logs table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'auth_logs';
   ```

3. **Check Indexes**
   ```sql
   -- List all indexes
   SELECT tablename, indexname, indexdef 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

4. **Verify Foreign Keys**
   ```sql
   -- Check foreign key constraints
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

### Migration Rollback (If Needed)

If migration fails or needs to be rolled back:

```sql
-- Drop all tables (CAUTION: This deletes all data)
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run the migration script.

---

## Access Code Import

### Step 1: Prepare Access Codes

1. **Review Access Codes**
   - Verify you have all 11 access codes
   - Ensure codes are 8 characters, alphanumeric
   - Check for duplicates

2. **Create Import File** (if not exists)
   ```typescript
   // scripts/import-access-codes.ts
   const ACCESS_CODES = [
     'CODE0001',
     'CODE0002',
     'CODE0003',
     // ... all 11 codes
   ];
   ```

### Step 2: Run Import Script

1. **Execute Import**
   ```bash
   npm run import:codes
   ```

   Or manually:
   ```bash
   node scripts/import-access-codes.ts
   ```

2. **Verify Import**
   ```sql
   -- Check all codes were imported
   SELECT code, redeemed, created_at 
   FROM access_codes 
   ORDER BY created_at;

   -- Count total codes
   SELECT COUNT(*) FROM access_codes;
   -- Should return: 11
   ```

### Step 3: Test Access Code

1. **Test Valid Code**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "accessCode": "CODE0001",
       "email": "test@example.com",
       "password": "TestPass123"
     }'
   ```

2. **Verify Response**
   - Should return 200 with user data
   - Code should be marked as redeemed

3. **Test Reused Code**
   ```bash
   # Try same code again
   curl -X POST https://your-domain.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "accessCode": "CODE0001",
       "email": "test2@example.com",
       "password": "TestPass123"
     }'
   ```

   - Should return 410 (Gone) - Code already redeemed

---

## Deployment Process

### Step 1: Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Access codes imported
- [ ] Local testing passed
- [ ] Code reviewed and approved
- [ ] Backup of current production taken

### Step 2: Deploy to Staging (Preview)

1. **Create Preview Branch**
   ```bash
   git checkout -b auth-system-staging
   git push origin auth-system-staging
   ```

2. **Vercel Auto-Deploy**
   - Vercel automatically creates preview deployment
   - Wait for deployment to complete
   - Note the preview URL

3. **Test on Staging**
   - Test registration flow
   - Test login flow
   - Test logout flow
   - Test rate limiting
   - Test session persistence
   - Test all 11 access codes

### Step 3: Deploy to Production

1. **Merge to Main**
   ```bash
   git checkout main
   git merge auth-system-staging
   git push origin main
   ```

2. **Monitor Deployment**
   - Watch Vercel Dashboard for deployment status
   - Check build logs for errors
   - Wait for "Ready" status

3. **Deployment URL**
   - Production: `https://your-domain.vercel.app`
   - Deployment takes 2-5 minutes

### Step 4: Configure Cron Jobs

1. **Navigate to Vercel Dashboard**
   - Go to your project
   - Click "Settings" > "Cron Jobs"

2. **Add Session Cleanup Job**
   - **Path**: `/api/cron/cleanup-sessions`
   - **Schedule**: `0 2 * * *` (Daily at 2 AM UTC)
   - **Headers**: 
     ```
     Authorization: Bearer [Your CRON_SECRET]
     ```
   - Click "Save"

3. **Test Cron Job**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/cron/cleanup-sessions \
     -H "Authorization: Bearer [Your CRON_SECRET]"
   ```

   - Should return 200 with cleanup statistics

---

## Post-Deployment Verification

### Step 1: Smoke Tests

Run these tests immediately after deployment:

1. **Health Check**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```
   - Should return 200 with status "ok"

2. **Registration Test**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "accessCode": "CODE0002",
       "email": "verify@example.com",
       "password": "VerifyPass123"
     }'
   ```
   - Should return 200 with user data

3. **Login Test**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "verify@example.com",
       "password": "VerifyPass123"
     }'
   ```
   - Should return 200 with user data and set cookie

4. **Rate Limiting Test**
   ```bash
   # Try 6 failed logins rapidly
   for i in {1..6}; do
     curl -X POST https://your-domain.vercel.app/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{
         "email": "test@example.com",
         "password": "WrongPassword"
       }'
   done
   ```
   - 6th request should return 429 (Too Many Requests)

### Step 2: Monitor Error Logs

1. **Check Vercel Logs**
   - Vercel Dashboard > Your Project > Logs
   - Filter by "Errors"
   - Look for authentication-related errors

2. **Check Database Logs**
   - Vercel Dashboard > Storage > Your Database > Logs
   - Look for connection errors or slow queries

3. **Check KV Logs**
   - Vercel Dashboard > Storage > Your KV > Logs
   - Look for rate limiting errors

### Step 3: Performance Monitoring

1. **Response Times**
   - Registration: < 2 seconds
   - Login: < 1 second
   - Logout: < 500ms
   - Token verification: < 100ms

2. **Database Performance**
   - Query times: < 50ms average
   - Connection pool: < 80% utilization

3. **Rate Limiting**
   - KV latency: < 10ms
   - No rate limit false positives

### Step 4: Security Audit

1. **JWT Token Validation**
   - Verify tokens are httpOnly
   - Verify tokens are secure (HTTPS only)
   - Verify tokens have correct expiration

2. **Password Security**
   - Verify passwords are hashed (bcrypt)
   - Verify salt rounds = 12
   - Verify no plain text passwords in logs

3. **SQL Injection Prevention**
   - Verify all queries use parameterized statements
   - Test with malicious input

4. **CSRF Protection**
   - Verify CSRF tokens are validated
   - Test cross-origin requests

---

## Rollback Procedures

### Scenario 1: Critical Bug in Authentication

**Symptoms**: Users cannot log in, registration fails, or security vulnerability discovered

**Immediate Actions**:

1. **Revert Deployment**
   ```bash
   # In Vercel Dashboard
   # Go to Deployments > Find previous stable deployment
   # Click "..." > "Promote to Production"
   ```

2. **Disable New Auth System**
   - Set environment variable: `ENABLE_NEW_AUTH=false`
   - Redeploy

3. **Re-enable Old System**
   - Uncomment old access gate code
   - Restore `NEXT_PUBLIC_ACCESS_CODE` environment variable

### Scenario 2: Database Issues

**Symptoms**: Database connection errors, slow queries, data corruption

**Immediate Actions**:

1. **Switch to Read-Only Mode**
   ```sql
   -- Revoke write permissions temporarily
   REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM public;
   ```

2. **Restore from Backup**
   - Vercel Dashboard > Storage > Your Database > Backups
   - Select most recent backup before issue
   - Click "Restore"

3. **Verify Data Integrity**
   ```sql
   -- Check user count
   SELECT COUNT(*) FROM users;

   -- Check access code status
   SELECT COUNT(*) FROM access_codes WHERE redeemed = true;

   -- Check session count
   SELECT COUNT(*) FROM sessions;
   ```

### Scenario 3: Rate Limiting Issues

**Symptoms**: Legitimate users blocked, rate limits not working

**Immediate Actions**:

1. **Clear Rate Limit Cache**
   ```bash
   # Use Vercel KV CLI or API
   curl -X DELETE https://your-kv-instance.kv.vercel-storage.com/rate-limit:*
   ```

2. **Adjust Rate Limits**
   - Increase `AUTH_RATE_LIMIT_MAX_ATTEMPTS` temporarily
   - Increase `AUTH_RATE_LIMIT_WINDOW_MS`

3. **Monitor Impact**
   - Watch for abuse
   - Restore original limits once stable

### Rollback Checklist

- [ ] Identify issue and severity
- [ ] Notify team and stakeholders
- [ ] Execute rollback procedure
- [ ] Verify system stability
- [ ] Monitor error logs
- [ ] Test critical flows
- [ ] Document incident
- [ ] Plan fix and re-deployment

---

## Troubleshooting

### Issue: Database Connection Errors

**Symptoms**:
```
Error: connect ETIMEDOUT
Error: Connection terminated unexpectedly
```

**Solutions**:

1. **Check Connection String**
   - Verify `DATABASE_URL` is correct
   - Ensure `sslmode=require` is present
   - Check for typos in password

2. **Check Connection Pool**
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   ```
   - If at max, increase pool size or close idle connections

3. **Verify Network Access**
   - Ensure Vercel can reach database
   - Check firewall rules
   - Verify SSL certificate is valid

### Issue: JWT Token Errors

**Symptoms**:
```
Error: invalid signature
Error: jwt expired
Error: jwt malformed
```

**Solutions**:

1. **Verify JWT_SECRET**
   - Ensure same secret in all environments
   - Check for whitespace or special characters
   - Regenerate if compromised

2. **Check Token Expiration**
   - Verify `JWT_EXPIRATION` is set correctly
   - Check server time is synchronized

3. **Validate Token Format**
   ```javascript
   // Token should have 3 parts separated by dots
   const parts = token.split('.');
   console.log(parts.length); // Should be 3
   ```

### Issue: Rate Limiting Not Working

**Symptoms**:
- Users not blocked after multiple failed attempts
- Rate limit errors when shouldn't be

**Solutions**:

1. **Check KV Connection**
   ```bash
   curl https://your-kv-instance.kv.vercel-storage.com/health
   ```

2. **Verify KV Credentials**
   - Check `KV_REST_API_URL` is correct
   - Verify `KV_REST_API_TOKEN` is valid

3. **Check Rate Limit Logic**
   ```typescript
   // Verify key format
   const key = `rate-limit:${email}:${Date.now()}`;
   ```

### Issue: Email Not Sending

**Symptoms**:
- Welcome emails not received
- No email errors in logs

**Solutions**:

1. **Check Email Configuration**
   - Verify Office 365 credentials
   - Check sender email is valid
   - Verify Microsoft Graph API permissions

2. **Test Email Manually**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"to": "test@example.com"}'
   ```

3. **Check Email Logs**
   - Look for SMTP errors
   - Verify email queue is processing

### Issue: Access Codes Not Working

**Symptoms**:
- Valid codes rejected
- Codes show as already redeemed when they're not

**Solutions**:

1. **Verify Code in Database**
   ```sql
   SELECT * FROM access_codes WHERE code = 'YOUR_CODE';
   ```

2. **Check Code Format**
   - Ensure uppercase
   - Verify 8 characters
   - Check for whitespace

3. **Re-import Codes**
   ```bash
   npm run import:codes --force
   ```

### Getting Help

If issues persist:

1. **Check Documentation**
   - Review this deployment guide
   - Check API documentation
   - Read error messages carefully

2. **Review Logs**
   - Vercel function logs
   - Database query logs
   - Browser console errors

3. **Contact Support**
   - Vercel Support: https://vercel.com/support
   - GitHub Issues: [Your repo]/issues
   - Team Slack: #auth-system-help

---

## Deployment Checklist

Use this checklist for every deployment:

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations reviewed
- [ ] Access codes prepared
- [ ] Backup of current production
- [ ] Rollback plan documented

### Deployment
- [ ] Deploy to staging first
- [ ] Test all flows on staging
- [ ] Monitor staging for 24 hours
- [ ] Deploy to production
- [ ] Configure cron jobs
- [ ] Verify environment variables

### Post-Deployment
- [ ] Run smoke tests
- [ ] Monitor error logs (1 hour)
- [ ] Check performance metrics
- [ ] Test all access codes
- [ ] Verify email delivery
- [ ] Document any issues

### Cleanup
- [ ] Remove old code (if applicable)
- [ ] Update documentation
- [ ] Notify team of completion
- [ ] Schedule post-mortem (if issues)

---

## Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Postgres Guide**: https://vercel.com/docs/storage/vercel-postgres
- **Vercel KV Guide**: https://vercel.com/docs/storage/vercel-kv
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **bcrypt Documentation**: https://github.com/kelektiv/node.bcrypt.js

---

**Last Updated**: January 26, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
