# Automated Setup Instructions

**Status**: ✅ Secrets Generated  
**Next**: Database Creation & Configuration

---

## ✅ Step 1: Secrets Generated (COMPLETE)

Your secrets have been generated and saved to `production-secrets.txt`:

```
JWT_SECRET: [Generated 32-byte secret]
CRON_SECRET: [Generated 32-byte secret]
```

**⚠️ Keep this file secure! Do not commit to Git!**

---

## 📋 Step 2: Create Databases (MANUAL - 8 minutes)

### Create Postgres Database (5 minutes)

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project: **agents-md**

2. **Navigate to Storage**
   - Click "Storage" tab in left sidebar

3. **Create Postgres Database**
   - Click "Create Database" button
   - Select "Postgres" card
   - **Name**: `agents-md-auth-production`
   - **Region**: `iad1` (US East)
   - Click "Create"
   - ⏳ Wait 2-3 minutes for provisioning

4. **Copy DATABASE_URL**
   - Click on your new database
   - Go to ".env.local" tab
   - Copy the entire `DATABASE_URL` value
   - It looks like: `postgres://default:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require`
   - **Save this somewhere secure!**

### Create KV Store (3 minutes)

1. **Still in Storage Tab**
   - Click "Create Database" button again

2. **Create KV Database**
   - Select "KV" card
   - **Name**: `agents-md-rate-limit-production`
   - **Region**: `iad1` (US East)
   - Click "Create"
   - ⏳ Wait 1-2 minutes for provisioning

3. **Copy KV Credentials**
   - Click on your new KV database
   - Go to ".env.local" tab
   - Copy these THREE values:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`
   - **Save all three somewhere secure!**

---

## 🔧 Step 3: Run Configuration Script

Once you have your database credentials, run this command:

```powershell
# This will prompt you for the credentials and configure everything
.\scripts\configure-production.ps1
```

**What this script will do:**
1. ✅ Ask for your DATABASE_URL
2. ✅ Ask for your KV credentials
3. ✅ Set all environment variables in Vercel
4. ✅ Run database migrations
5. ✅ Import 11 access codes
6. ✅ Trigger redeployment
7. ✅ Verify deployment

---

## 📝 Credentials Checklist

Before running the configuration script, make sure you have:

- [ ] DATABASE_URL (from Postgres database)
- [ ] KV_REST_API_URL (from KV store)
- [ ] KV_REST_API_TOKEN (from KV store)
- [ ] KV_REST_API_READ_ONLY_TOKEN (from KV store)
- [ ] JWT_SECRET (from production-secrets.txt)
- [ ] CRON_SECRET (from production-secrets.txt)

---

## 🚀 Quick Start

**If you have all credentials ready:**

```powershell
.\scripts\configure-production.ps1
```

**If you need to create databases first:**

1. Open https://vercel.com/dashboard
2. Follow Step 2 above
3. Copy all credentials
4. Run `.\scripts\configure-production.ps1`

---

## ⏱️ Time Estimate

- Create Postgres: 5 minutes
- Create KV: 3 minutes
- Run configuration script: 10 minutes
- **Total**: ~18 minutes

---

## 🆘 Need Help?

**Can't find Storage tab?**
- Make sure you're in your project (agents-md)
- Look in the left sidebar
- It's between "AI" and "Flags"

**Database creation failing?**
- Verify your Vercel Pro membership is active
- Try a different region if iad1 doesn't work
- Contact Vercel support if issues persist

**Lost your credentials?**
- Go back to Vercel Dashboard > Storage
- Click on your database
- Go to ".env.local" tab
- Copy the values again

---

## 📞 Ready to Continue?

Once you have your database credentials, run:

```powershell
.\scripts\configure-production.ps1
```

This will complete the setup automatically!

