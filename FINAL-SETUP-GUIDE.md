# Final Production Setup Guide

**Date**: January 26, 2025  
**Status**: ✅ All Credentials Ready - Final Configuration Needed

---

## 🎉 **You Have Everything You Need!**

All secrets have been generated and all database credentials are ready. Now you just need to configure Vercel and deploy!

---

## 🔐 **Your Complete Credentials**

### 1. Database (Supabase PostgreSQL)
```
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Redis (Rate Limiting)
```
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137

KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
```

### 3. Generated Secrets
**Open `production-secrets.txt` to get:**
- `JWT_SECRET` (32-byte random string)
- `CRON_SECRET` (32-byte random string)

---

## 🚀 **Step-by-Step Setup (15 minutes)**

### **Step 1: Set Environment Variables in Vercel** (10 minutes)

1. Go to: https://vercel.com/dashboard
2. Select your project: **agents-md**
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left sidebar
5. For each variable below, click **"Add New"**:

#### Add These 14 Variables:

**Variable 1:**
- Name: `DATABASE_URL`
- Value: `postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`
- Environment: ✅ Production

**Variable 2:**
- Name: `JWT_SECRET`
- Value: [Open production-secrets.txt and copy JWT_SECRET value]
- Environment: ✅ Production

**Variable 3:**
- Name: `JWT_EXPIRATION`
- Value: `7d`
- Environment: ✅ Production

**Variable 4:**
- Name: `JWT_REMEMBER_ME_EXPIRATION`
- Value: `30d`
- Environment: ✅ Production

**Variable 5:**
- Name: `KV_REST_API_URL`
- Value: `redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137`
- Environment: ✅ Production

**Variable 6:**
- Name: `KV_REST_API_TOKEN`
- Value: `P0yyIdZMnNwnIY2AR03fTmIgH31hktBs`
- Environment: ✅ Production

**Variable 7:**
- Name: `AUTH_RATE_LIMIT_MAX_ATTEMPTS`
- Value: `5`
- Environment: ✅ Production

**Variable 8:**
- Name: `AUTH_RATE_LIMIT_WINDOW_MS`
- Value: `900000`
- Environment: ✅ Production

**Variable 9:**
- Name: `CRON_SECRET`
- Value: [Open production-secrets.txt and copy CRON_SECRET value]
- Environment: ✅ Production

**Variable 10:**
- Name: `SENDER_EMAIL`
- Value: `no-reply@arcane.group`
- Environment: ✅ Production

**Variable 11:**
- Name: `ENABLE_WELCOME_EMAIL`
- Value: `true`
- Environment: ✅ Production

**Variable 12:**
- Name: `NEXT_PUBLIC_APP_URL`
- Value: `https://news.arcane.group`
- Environment: ✅ Production

**Variable 13:**
- Name: `NEXTAUTH_URL`
- Value: `https://news.arcane.group`
- Environment: ✅ Production

**Variable 14 (Optional - if you have Azure/Office 365):**
- Name: `AZURE_TENANT_ID`
- Value: [Your Azure tenant ID]
- Environment: ✅ Production

---

### **Step 2: Run Database Migrations** (3 minutes)

Open PowerShell in your project directory:

```powershell
# Set DATABASE_URL
$env:DATABASE_URL = "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Run migrations
npx tsx scripts/run-migrations.ts

# Import access codes
npx tsx scripts/import-access-codes.ts
```

**Expected Output:**
- ✅ Tables created: users, access_codes, sessions, auth_logs
- ✅ 11 access codes imported

---

### **Step 3: Redeploy Application** (2 minutes)

1. Go to **Vercel Dashboard** > **Deployments**
2. Find the latest deployment
3. Click the **"..."** menu (three dots)
4. Click **"Redeploy"**
5. Wait for **"Ready"** status (2-5 minutes)

---

### **Step 4: Verify Deployment** (2 minutes)

After redeployment completes, run:

```powershell
.\scripts\quick-verify-production.ps1 -ProductionUrl "https://news.arcane.group"
```

**Expected Result:**
```
Total Tests: 7
Passed: 7 (100%)
Failed: 0 (0%)

SUCCESS: All tests passed!
```

---

## ✅ **Checklist**

Track your progress:

- [ ] Opened Vercel Dashboard
- [ ] Navigated to Settings > Environment Variables
- [ ] Added DATABASE_URL
- [ ] Added JWT_SECRET (from production-secrets.txt)
- [ ] Added JWT_EXPIRATION
- [ ] Added JWT_REMEMBER_ME_EXPIRATION
- [ ] Added KV_REST_API_URL
- [ ] Added KV_REST_API_TOKEN
- [ ] Added AUTH_RATE_LIMIT_MAX_ATTEMPTS
- [ ] Added AUTH_RATE_LIMIT_WINDOW_MS
- [ ] Added CRON_SECRET (from production-secrets.txt)
- [ ] Added SENDER_EMAIL
- [ ] Added ENABLE_WELCOME_EMAIL
- [ ] Added NEXT_PUBLIC_APP_URL
- [ ] Added NEXTAUTH_URL
- [ ] Ran database migrations
- [ ] Imported access codes
- [ ] Triggered redeploy in Vercel
- [ ] Waited for "Ready" status
- [ ] Ran verification script
- [ ] Got 100% pass rate

---

## 🎯 **Quick Reference**

### Files You Need:
- `production-secrets.txt` - Contains JWT_SECRET and CRON_SECRET
- This guide - Step-by-step instructions

### Commands You'll Run:
```powershell
# Set DATABASE_URL
$env:DATABASE_URL = "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Run migrations
npx tsx scripts/run-migrations.ts

# Import codes
npx tsx scripts/import-access-codes.ts

# Verify
.\scripts\quick-verify-production.ps1
```

---

## 💡 **Pro Tips**

1. **Copy-Paste Carefully**: Environment variable values are long - copy the entire string
2. **Check Production-secrets.txt**: Open it to get JWT_SECRET and CRON_SECRET
3. **One Variable at a Time**: Add each variable, click Save, then add the next
4. **Wait for Redeploy**: Don't skip the redeploy step - it's required for env vars to take effect
5. **Verify Before Celebrating**: Run the verification script to confirm everything works

---

## 🆘 **Troubleshooting**

### Can't Find Secrets?
```powershell
notepad production-secrets.txt
```

### Migrations Fail?
- Check DATABASE_URL is copied correctly
- Ensure it includes `?sslmode=require` at the end
- Try running migrations again

### Vercel Won't Save Variable?
- Make sure "Production" environment is selected
- Check for typos in variable name
- Try refreshing the page

### Verification Fails?
- Wait 2-3 minutes after redeploy
- Check all 14 variables are set
- Run verification again

---

## 🎉 **Success Criteria**

You're done when:
- ✅ All 14 environment variables set in Vercel
- ✅ Database migrations completed
- ✅ 11 access codes imported
- ✅ Application redeployed
- ✅ Verification shows 100% pass rate
- ✅ You can register with an access code
- ✅ You can login with credentials

---

**Status**: 🟢 Ready to Configure  
**Time Needed**: 15 minutes  
**Difficulty**: Easy (step-by-step guide)

**Let's finish this!** 🚀

