# 🔧 Vercel Environment Variable Update Required

## ⚠️ **CRITICAL: Update DATABASE_URL**

The current DATABASE_URL has a conflict between the connection string parameter and the Pool SSL config.

### Current (Has Conflict):
```
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### Update To (Remove sslmode parameter):
```
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```

**Why**: We're handling SSL in the code with `ssl: { rejectUnauthorized: false }`, so the `?sslmode=require` parameter is conflicting.

---

## 📋 **How to Update in Vercel**

1. Go to https://vercel.com/dashboard
2. Select your **agents-md** project
3. Go to **Settings** → **Environment Variables**
4. Find **DATABASE_URL**
5. Click **Edit**
6. Remove `?sslmode=require` from the end
7. New value should be:
   ```
   postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
   ```
8. Click **Save**
9. Go to **Deployments** tab
10. Click **"Redeploy"** on the latest deployment

---

## 🔄 **After Updating**

Wait 2-3 minutes for redeploy, then test:

```powershell
.\scripts\quick-verify-production.ps1
```

**Expected**: 100% pass rate

---

## 🎯 **Alternative: Try Different Connection String**

If the above doesn't work, try the **Transaction Pooling** connection string from Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Look for **"Connection string"** section
3. Select **"Transaction pooling"** tab (not "Session pooling")
4. Copy the connection string
5. Update DATABASE_URL in Vercel with the new string (without `?sslmode=require`)

---

**Status**: ⏳ Waiting for you to update DATABASE_URL in Vercel
