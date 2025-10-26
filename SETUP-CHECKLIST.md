# Production Setup Checklist

**Quick Reference**: Follow this checklist to complete your production deployment.

---

## ☑️ Pre-Setup (Already Done)
- [x] Upgraded Vercel membership
- [x] Code deployed to main branch
- [x] Automation scripts created
- [x] Documentation complete

---

## 📝 Setup Steps (30 minutes)

### Step 1: Create Postgres Database (5 min)
- [ ] Go to Vercel Dashboard > Storage
- [ ] Click "Create Database" > Select "Postgres"
- [ ] Name: `agents-md-auth-production`
- [ ] Region: `iad1` (US East) or closest to you
- [ ] Click "Create" and wait 2-3 minutes
- [ ] Copy `DATABASE_URL` from .env.local tab
- [ ] Save DATABASE_URL securely

**DATABASE_URL Format:**
```
postgres://default:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

---

### Step 2: Create KV Store (3 min)
- [ ] Still in Storage, click "Create Database" again
- [ ] Select "KV" (Redis)
- [ ] Name: `agents-md-rate-limit-production`
- [ ] Region: Same as Postgres
- [ ] Click "Create" and wait 1-2 minutes
- [ ] Copy these 3 values from .env.local tab:
  - [ ] `KV_REST_API_URL`
  - [ ] `KV_REST_API_TOKEN`
  - [ ] `KV_REST_API_READ_ONLY_TOKEN`
- [ ] Save all 3 values securely

---

### Step 3: Generate Secrets (2 min)
Open PowerShell and run:
```powershell
# Generate JWT_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32
```

- [ ] Copy JWT_SECRET
- [ ] Copy CRON_SECRET
- [ ] Save both securely

---

### Step 4: Configure Environment Variables (10 min)
Go to: Vercel Dashboard > Settings > Environment Variables

Add these 17 variables (click "Add New" for each):

#### Database (1 variable)
- [ ] `DATABASE_URL` = [from Step 1]

#### Authentication (4 variables)
- [ ] `JWT_SECRET` = [from Step 3]
- [ ] `JWT_EXPIRATION` = `7d`
- [ ] `JWT_REMEMBER_ME_EXPIRATION` = `30d`

#### Rate Limiting (5 variables)
- [ ] `KV_REST_API_URL` = [from Step 2]
- [ ] `KV_REST_API_TOKEN` = [from Step 2]
- [ ] `KV_REST_API_READ_ONLY_TOKEN` = [from Step 2]
- [ ] `AUTH_RATE_LIMIT_MAX_ATTEMPTS` = `5`
- [ ] `AUTH_RATE_LIMIT_WINDOW_MS` = `900000`

#### Cron Security (1 variable)
- [ ] `CRON_SECRET` = [from Step 3]

#### Email - Office 365 (5 variables)
- [ ] `SENDER_EMAIL` = `no-reply@arcane.group`
- [ ] `AZURE_TENANT_ID` = [your Azure tenant ID]
- [ ] `AZURE_CLIENT_ID` = [your Azure client ID]
- [ ] `AZURE_CLIENT_SECRET` = [your Azure client secret]
- [ ] `ENABLE_WELCOME_EMAIL` = `true`

#### Application (2 variables)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://news.arcane.group`
- [ ] `NEXTAUTH_URL` = `https://news.arcane.group`

**Total: 17 variables** ✅

---

### Step 5: Run Database Migrations (5 min)
Open PowerShell in project directory:

```powershell
# Set DATABASE_URL (replace with your actual URL)
$env:DATABASE_URL = "postgres://default:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

# Run migrations
npm run migrate:prod
```

- [ ] Migrations completed successfully
- [ ] Saw "Created table: users"
- [ ] Saw "Created table: access_codes"
- [ ] Saw "Created table: sessions"
- [ ] Saw "Created table: auth_logs"

**Verify in Vercel Dashboard:**
- [ ] Go to Storage > Your Database > Query
- [ ] Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- [ ] See 4 tables: users, access_codes, sessions, auth_logs

---

### Step 6: Import Access Codes (2 min)
With DATABASE_URL still set:

```powershell
npm run import:codes
```

- [ ] Saw "Imported 11 access codes successfully"

**Verify in Vercel Dashboard:**
- [ ] Go to Storage > Your Database > Query
- [ ] Run: `SELECT COUNT(*) FROM access_codes;`
- [ ] Result: 11

---

### Step 7: Redeploy Application (3 min)
- [ ] Go to Vercel Dashboard > Deployments
- [ ] Find latest deployment
- [ ] Click "..." menu
- [ ] Click "Redeploy"
- [ ] Wait for "Ready" status (2-5 minutes)
- [ ] Check build logs for errors

---

### Step 8: Verify Deployment (5 min)

Run verification script:
```powershell
.\scripts\quick-verify-production.ps1 -ProductionUrl "https://news.arcane.group"
```

**Expected Results:**
- [ ] Homepage Accessible (200 OK)
- [ ] Health Check Endpoint (200 OK) or (404 - acceptable)
- [ ] Registration Rejects Invalid Code (400)
- [ ] Login Rejects Invalid Credentials (401)
- [ ] Security Headers Present
- [ ] HTTPS Enabled
- [ ] Fast Response Time
- [ ] **Pass Rate: 85%+**

**Test in Browser:**
- [ ] Open https://news.arcane.group in incognito
- [ ] See Access Gate
- [ ] Click "I have an access code"
- [ ] Enter CODE0001
- [ ] Enter test email and password
- [ ] Submit form
- [ ] Successfully logged in

**Test All Access Codes:**
```powershell
.\scripts\test-all-access-codes.ps1 -ProductionUrl "https://news.arcane.group"
```

- [ ] All 11 codes work

---

## ✅ Success Criteria

After completing all steps:
- [ ] All 17 environment variables configured
- [ ] Postgres database created and migrated
- [ ] KV store created and configured
- [ ] 11 access codes imported
- [ ] Application redeployed
- [ ] Verification tests passing (85%+)
- [ ] Registration working
- [ ] Login working
- [ ] No critical errors in logs

---

## 🎉 You're Done!

Once all checkboxes are checked, your production deployment is complete!

**Next Steps:**
1. Monitor production for 24 hours
2. Test all features thoroughly
3. Notify users about new authentication system
4. Document any issues encountered

---

## 🆘 Need Help?

- **Detailed Guide**: See `VERCEL-PRO-SETUP-GUIDE.md`
- **Troubleshooting**: See `PRODUCTION-DEPLOYMENT-STATUS.md`
- **Full Documentation**: See `docs/DEPLOYMENT.md`

---

## 📞 Quick Commands

```powershell
# Verify deployment
.\scripts\quick-verify-production.ps1

# Test access codes
.\scripts\test-all-access-codes.ps1

# Monitor for 1 hour
.\scripts\monitor-production.ps1 -DurationMinutes 60
```

---

**Estimated Time**: 30 minutes  
**Difficulty**: Easy  
**Status**: Ready to start!

**Begin with Step 1: Create Postgres Database** 🚀

