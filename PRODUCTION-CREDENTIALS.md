# Production Credentials & Setup Guide

**Date**: January 26, 2025  
**Status**: ✅ Databases Created, Ready for Final Configuration

---

## 🎉 **What's Complete**

- ✅ Supabase PostgreSQL database created (AgentsMD)
- ✅ Redis database created (agents-md-redis)
- ✅ All credentials collected
- ✅ Secrets generated (JWT_SECRET, CRON_SECRET)
- ✅ .env.production file created

---

## 🔐 **Your Production Credentials**

### Database (Supabase PostgreSQL)
```
DATABASE_URL="postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"
```

### Redis (Rate Limiting)
```
KV_REST_API_URL="redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137"
KV_REST_API_TOKEN="P0yyIdZMnNwnIY2AR03fTmIgH31hktBs"
```

### Generated Secrets
```
JWT_SECRET=[See production-secrets.txt]
CRON_SECRET=[See production-secrets.txt]
```

---

## 🚀 **Next Steps - Manual Configuration Required**

Since the automated scripts aren't showing output, here's what you need to do manually:

### Step 1: Set Environment Variables in Vercel

Go to: **Vercel Dashboard > Your Project > Settings > Environment Variables**

Add these **17 variables** (select "Production" environment for each):

#### Database (1 variable)
```
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

#### Authentication (4 variables)
```
JWT_SECRET=[Open production-secrets.txt and copy JWT_SECRET]
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d
```

#### Rate Limiting (5 variables)
```
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

#### Cron Security (1 variable)
```
CRON_SECRET=[Open production-secrets.txt and copy CRON_SECRET]
```

#### Email - Office 365 (3 variables)
```
SENDER_EMAIL=no-reply@arcane.group
AZURE_TENANT_ID=[Your Azure tenant ID]
AZURE_CLIENT_ID=[Your Azure client ID]
AZURE_CLIENT_SECRET=[Your Azure client secret]
ENABLE_WELCOME_EMAIL=true
```

#### Application (2 variables)
```
NEXT_PUBLIC_APP_URL=https://news.arcane.group
NEXTAUTH_URL=https://news.arcane.group
```

---

### Step 2: Run Database Migrations

Open PowerShell in your project directory and run:

```powershell
# Set DATABASE_URL
$env:DATABASE_URL = "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Install dependencies if needed
npm install

# Run migrations
npx tsx scripts/run-migrations.ts

# Import access codes
npx tsx scripts/import-access-codes.ts
```

---

### Step 3: Redeploy Application

After setting environment variables:

1. Go to **Vercel Dashboard > Deployments**
2. Find latest deployment
3. Click **"..."** menu
4. Click **"Redeploy"**
5. Wait for "Ready" status (2-5 minutes)

---

### Step 4: Verify Deployment

After redeployment completes:

```powershell
.\scripts\quick-verify-production.ps1 -ProductionUrl "https://news.arcane.group"
```

**Expected Result**: 100% pass rate

---

## 📋 **Environment Variables Checklist**

Copy this checklist and check off as you add each variable:

- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] JWT_EXPIRATION
- [ ] JWT_REMEMBER_ME_EXPIRATION
- [ ] KV_REST_API_URL
- [ ] KV_REST_API_TOKEN
- [ ] AUTH_RATE_LIMIT_MAX_ATTEMPTS
- [ ] AUTH_RATE_LIMIT_WINDOW_MS
- [ ] CRON_SECRET
- [ ] SENDER_EMAIL
- [ ] AZURE_TENANT_ID (if you have Office 365)
- [ ] AZURE_CLIENT_ID (if you have Office 365)
- [ ] AZURE_CLIENT_SECRET (if you have Office 365)
- [ ] ENABLE_WELCOME_EMAIL
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXTAUTH_URL

**Total**: 17 variables (14 required + 3 optional for email)

---

## 🔒 **Security Notes**

⚠️ **IMPORTANT**: These credentials are sensitive!

- ✅ Never commit to Git
- ✅ Store in password manager
- ✅ Only use in environment variables
- ✅ Rotate if compromised

---

## 💡 **Quick Copy-Paste for Vercel**

For each variable, click "Add New" in Vercel and paste:

**Name**: `DATABASE_URL`  
**Value**: `postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`  
**Environment**: Production

**Name**: `KV_REST_API_URL`  
**Value**: `redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137`  
**Environment**: Production

**Name**: `KV_REST_API_TOKEN`  
**Value**: `P0yyIdZMnNwnIY2AR03fTmIgH31hktBs`  
**Environment**: Production

(Continue for all 17 variables...)

---

## 🎯 **Success Criteria**

After completing all steps, you should have:

- ✅ All 17 environment variables set in Vercel
- ✅ Database tables created (users, access_codes, sessions, auth_logs)
- ✅ 11 access codes imported
- ✅ Application redeployed
- ✅ Verification tests passing (100%)

---

## 🆘 **If You Need Help**

1. **Can't find secrets**: Open `production-secrets.txt`
2. **Migration fails**: Check DATABASE_URL format
3. **Vercel won't save**: Make sure to select "Production" environment
4. **Still stuck**: Run `.\scripts\quick-verify-production.ps1` to see what's working

---

**Status**: 🟡 Credentials Ready, Manual Configuration Needed  
**Time Needed**: 15 minutes  
**Next**: Set environment variables in Vercel Dashboard

