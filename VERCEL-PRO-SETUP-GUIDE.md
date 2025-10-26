# Vercel Pro Setup Guide - Production Deployment

**Date**: January 26, 2025  
**Account**: Upgraded Vercel Pro Membership ✅  
**Status**: Ready for Production Setup

---

## 🎉 Congratulations on Upgrading!

With your Vercel Pro membership, you now have access to:
- ✅ **Vercel Postgres** - Production-grade database
- ✅ **Vercel KV** - Redis for rate limiting
- ✅ **Increased limits** - More bandwidth, functions, and storage
- ✅ **Better performance** - Faster builds and deployments
- ✅ **Team features** - Collaboration tools

---

## 📋 Quick Setup Checklist

Follow these steps in order:

### Step 1: Create Vercel Postgres Database (5 minutes)
### Step 2: Create Vercel KV Store (3 minutes)
### Step 3: Configure Environment Variables (10 minutes)
### Step 4: Run Database Migrations (5 minutes)
### Step 5: Import Access Codes (2 minutes)
### Step 6: Redeploy Application (3 minutes)
### Step 7: Verify Deployment (5 minutes)

**Total Time**: ~30 minutes

---

## Step 1: Create Vercel Postgres Database

### 1.1 Navigate to Storage
```
1. Go to https://vercel.com/dashboard
2. Select your project (Agents.MD)
3. Click "Storage" tab in the left sidebar
4. Click "Create Database" button
```

### 1.2 Select Postgres
```
1. Click "Postgres" card
2. Database Name: agents-md-auth-production
3. Region: Select closest to your users
   - US East (iad1) - Recommended for US/Europe
   - US West (sfo1) - For West Coast US
   - Europe (fra1) - For Europe
4. Click "Create"
```

### 1.3 Wait for Provisioning
```
⏳ Database creation takes 2-3 minutes
✅ You'll see "Database created successfully" when done
```

### 1.4 Copy Connection String
```
1. Click on your new database
2. Go to ".env.local" tab
3. Copy the DATABASE_URL value
4. Save it securely (you'll need it in Step 3)

Format: postgres://default:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

---

## Step 2: Create Vercel KV Store

### 2.1 Navigate to Storage
```
1. Still in Vercel Dashboard > Storage
2. Click "Create Database" button again
3. This time select "KV" (Redis)
```

### 2.2 Configure KV Store
```
1. Database Name: agents-md-rate-limit-production
2. Region: Same as Postgres (for low latency)
3. Click "Create"
```

### 2.3 Wait for Provisioning
```
⏳ KV creation takes 1-2 minutes
✅ You'll see "Database created successfully" when done
```

### 2.4 Copy KV Credentials
```
1. Click on your new KV database
2. Go to ".env.local" tab
3. Copy these three values:
   - KV_REST_API_URL
   - KV_REST_API_TOKEN
   - KV_REST_API_READ_ONLY_TOKEN
4. Save them securely (you'll need them in Step 3)
```

---

## Step 3: Configure Environment Variables

### 3.1 Navigate to Environment Variables
```
1. Vercel Dashboard > Your Project
2. Click "Settings" tab
3. Click "Environment Variables" in left sidebar
```

### 3.2 Generate Secrets
Open PowerShell and run:
```powershell
# Generate JWT_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

Save both values - you'll need them below.

### 3.3 Add Required Variables

Add each variable below. For each one:
1. Click "Add New"
2. Enter Name (exactly as shown)
3. Enter Value
4. Select "Production" environment
5. Click "Save"

#### Database Configuration
```
Name: DATABASE_URL
Value: [Paste from Step 1.4]
Environment: Production
```

#### Authentication Configuration
```
Name: JWT_SECRET
Value: [Paste generated secret from Step 3.2]
Environment: Production

Name: JWT_EXPIRATION
Value: 7d
Environment: Production

Name: JWT_REMEMBER_ME_EXPIRATION
Value: 30d
Environment: Production
```

#### Rate Limiting Configuration
```
Name: KV_REST_API_URL
Value: [Paste from Step 2.4]
Environment: Production

Name: KV_REST_API_TOKEN
Value: [Paste from Step 2.4]
Environment: Production

Name: KV_REST_API_READ_ONLY_TOKEN
Value: [Paste from Step 2.4]
Environment: Production

Name: AUTH_RATE_LIMIT_MAX_ATTEMPTS
Value: 5
Environment: Production

Name: AUTH_RATE_LIMIT_WINDOW_MS
Value: 900000
Environment: Production
```

#### Cron Security
```
Name: CRON_SECRET
Value: [Paste generated secret from Step 3.2]
Environment: Production
```

#### Email Configuration (Office 365)
```
Name: SENDER_EMAIL
Value: no-reply@arcane.group
Environment: Production

Name: AZURE_TENANT_ID
Value: [Your Azure tenant ID]
Environment: Production

Name: AZURE_CLIENT_ID
Value: [Your Azure client ID]
Environment: Production

Name: AZURE_CLIENT_SECRET
Value: [Your Azure client secret]
Environment: Production

Name: ENABLE_WELCOME_EMAIL
Value: true
Environment: Production
```

#### Application Configuration
```
Name: NEXT_PUBLIC_APP_URL
Value: https://news.arcane.group
Environment: Production

Name: NEXTAUTH_URL
Value: https://news.arcane.group
Environment: Production
```

### 3.4 Verify All Variables Added
You should have **17 environment variables** configured:
- [x] DATABASE_URL
- [x] JWT_SECRET
- [x] JWT_EXPIRATION
- [x] JWT_REMEMBER_ME_EXPIRATION
- [x] KV_REST_API_URL
- [x] KV_REST_API_TOKEN
- [x] KV_REST_API_READ_ONLY_TOKEN
- [x] AUTH_RATE_LIMIT_MAX_ATTEMPTS
- [x] AUTH_RATE_LIMIT_WINDOW_MS
- [x] CRON_SECRET
- [x] SENDER_EMAIL
- [x] AZURE_TENANT_ID
- [x] AZURE_CLIENT_ID
- [x] AZURE_CLIENT_SECRET
- [x] ENABLE_WELCOME_EMAIL
- [x] NEXT_PUBLIC_APP_URL
- [x] NEXTAUTH_URL

---

## Step 4: Run Database Migrations

### 4.1 Set Local Environment Variable
Open PowerShell in your project directory:
```powershell
# Set DATABASE_URL temporarily
$env:DATABASE_URL = "postgres://default:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

Replace with your actual DATABASE_URL from Step 1.4.

### 4.2 Run Migration Script
```powershell
npm run migrate:prod
```

Or manually:
```powershell
node scripts/run-migrations.ts
```

### 4.3 Verify Migration Success
You should see output like:
```
✅ Migration completed successfully
✅ Created table: users
✅ Created table: access_codes
✅ Created table: sessions
✅ Created table: auth_logs
✅ Created indexes
✅ Created foreign keys
```

### 4.4 Verify in Vercel Dashboard
```
1. Vercel Dashboard > Storage > Your Postgres Database
2. Click "Query" tab
3. Run: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
4. You should see: users, access_codes, sessions, auth_logs
```

---

## Step 5: Import Access Codes

### 5.1 Run Import Script
With DATABASE_URL still set from Step 4.1:
```powershell
npm run import:codes
```

Or manually:
```powershell
node scripts/import-access-codes.ts
```

### 5.2 Verify Import Success
You should see:
```
✅ Imported 11 access codes successfully
```

### 5.3 Verify in Database
In Vercel Dashboard > Storage > Query:
```sql
SELECT COUNT(*) FROM access_codes;
-- Should return: 11

SELECT code, redeemed FROM access_codes ORDER BY code;
-- Should show all 11 codes with redeemed = false
```

---

## Step 6: Redeploy Application

### 6.1 Trigger Redeploy
```
1. Vercel Dashboard > Your Project
2. Click "Deployments" tab
3. Find the latest deployment
4. Click the "..." menu (three dots)
5. Click "Redeploy"
6. Confirm "Redeploy"
```

### 6.2 Wait for Deployment
```
⏳ Deployment takes 2-5 minutes
✅ Wait for "Ready" status
```

### 6.3 Check Build Logs
```
1. Click on the deployment
2. Click "Building" or "Logs" tab
3. Verify no errors
4. Look for "Build Completed" message
```

---

## Step 7: Verify Deployment

### 7.1 Run Quick Verification
```powershell
.\scripts\quick-verify-production.ps1 -ProductionUrl "https://news.arcane.group"
```

**Expected Results:**
```
✅ Homepage Accessible (200 OK)
✅ Health Check Endpoint (200 OK)
✅ Registration Rejects Invalid Code (400)
✅ Login Rejects Invalid Credentials (401)
✅ Security Headers Present
✅ HTTPS Enabled
✅ Fast Response Time

Pass Rate: 100%
SUCCESS: All tests passed!
```

### 7.2 Test Registration
```powershell
# Test with CODE0001
curl -X POST https://news.arcane.group/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "accessCode": "CODE0001",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response:** 200 OK with user data

### 7.3 Test All Access Codes
```powershell
.\scripts\test-all-access-codes.ps1 -ProductionUrl "https://news.arcane.group"
```

**Expected Results:**
```
✅ All 11 access codes functional
```

### 7.4 Test in Browser
```
1. Open https://news.arcane.group in incognito window
2. You should see the Access Gate
3. Click "I have an access code"
4. Enter CODE0002
5. Enter email and password
6. Submit form
7. You should be logged in and see the platform
```

---

## Step 8: Monitor Production (Optional)

### 8.1 Run Monitoring Script
```powershell
.\scripts\monitor-production.ps1 -ProductionUrl "https://news.arcane.group" -DurationMinutes 60
```

This will monitor production for 1 hour and alert you to any issues.

### 8.2 Check Vercel Logs
```
1. Vercel Dashboard > Your Project > Logs
2. Filter by "Errors"
3. Monitor for any authentication errors
4. Check for database connection errors
```

---

## Troubleshooting

### Issue: "Method Not Allowed" on Auth Endpoints

**Cause**: Environment variables not set or deployment not redeployed after setting them.

**Solution**:
1. Verify all 17 environment variables are set
2. Redeploy the application (Step 6)
3. Wait for "Ready" status
4. Try verification again

### Issue: Database Connection Error

**Cause**: DATABASE_URL not set correctly or database not accessible.

**Solution**:
1. Verify DATABASE_URL format includes `?sslmode=require`
2. Check database is created in Vercel Dashboard
3. Verify DATABASE_URL is set in Production environment
4. Redeploy application

### Issue: Rate Limiting Not Working

**Cause**: KV store not configured or credentials incorrect.

**Solution**:
1. Verify KV store is created
2. Check all 3 KV variables are set correctly
3. Verify KV_REST_API_URL starts with `https://`
4. Redeploy application

### Issue: Welcome Emails Not Sending

**Cause**: Office 365 credentials not configured or incorrect.

**Solution**:
1. Verify all 4 Azure variables are set
2. Check SENDER_EMAIL is a valid Office 365 mailbox
3. Test email credentials separately
4. Check Vercel logs for email errors

---

## Success Criteria

After completing all steps, you should have:

- ✅ Vercel Postgres database created and migrated
- ✅ Vercel KV store created and configured
- ✅ All 17 environment variables set
- ✅ 11 access codes imported to database
- ✅ Application redeployed successfully
- ✅ All verification tests passing (100%)
- ✅ Registration working with access codes
- ✅ Login working with credentials
- ✅ Rate limiting active
- ✅ Welcome emails sending
- ✅ No errors in logs

---

## Next Steps After Successful Deployment

1. **Test All Features**
   - Register with different access codes
   - Test login/logout flows
   - Verify session persistence
   - Test rate limiting

2. **Monitor for 24 Hours**
   - Check Vercel logs regularly
   - Monitor error rates
   - Track response times
   - Verify email delivery

3. **Update Documentation**
   - Mark deployment as complete
   - Document any issues encountered
   - Update team on new authentication system

4. **Notify Users**
   - Announce new authentication system
   - Provide registration instructions
   - Share access codes with authorized users

---

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Postgres Guide**: https://vercel.com/docs/storage/vercel-postgres
- **KV Guide**: https://vercel.com/docs/storage/vercel-kv
- **Your Deployment Guide**: `docs/DEPLOYMENT.md`
- **Troubleshooting**: `PRODUCTION-DEPLOYMENT-STATUS.md`

---

## Quick Reference Commands

```powershell
# Verify deployment
.\scripts\quick-verify-production.ps1

# Test access codes
.\scripts\test-all-access-codes.ps1

# Monitor production
.\scripts\monitor-production.ps1 -DurationMinutes 60

# Check environment variables
.\scripts\check-environment-variables.ps1
```

---

**Status**: 🚀 Ready for Setup  
**Estimated Time**: 30 minutes  
**Difficulty**: Easy (step-by-step guide)  
**Support**: Available via documentation

**Let's get started! Begin with Step 1: Create Vercel Postgres Database**

