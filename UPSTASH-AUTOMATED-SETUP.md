# 🤖 Automated Upstash Redis Setup

**Fully automated setup process with step-by-step guidance**

---

## 🎯 Overview

I've created an automated PowerShell script that will:
1. ✅ Validate your Upstash credentials
2. ✅ Test the connection
3. ✅ Update `.env.local` automatically
4. ✅ Update Vercel environment variables
5. ✅ Commit and deploy changes
6. ✅ Provide verification instructions

**Time Required**: 10 minutes (mostly waiting for Vercel)  
**Manual Steps**: Only 2 (create Upstash account and database)

---

## 📋 Prerequisites

Before running the automation:

- [ ] PowerShell (already installed on Windows)
- [ ] Git (for committing changes)
- [ ] Vercel CLI (optional, for automatic Vercel setup)
- [ ] Internet connection

---

## 🚀 Step-by-Step Automated Setup

### Step 1: Create Upstash Account (2 minutes)

**This is the only manual step you need to do!**

1. **Go to Upstash Console**
   ```
   https://console.upstash.com/
   ```

2. **Sign Up** (if you don't have an account)
   - Click "Sign Up"
   - Use GitHub, Google, or Email
   - No credit card required!

3. **Create Redis Database**
   - Click "Create Database"
   - **Name**: `agents-md-rate-limit`
   - **Type**: Select "Regional" (cheaper)
   - **Region**: Select "US East (N. Virginia)"
   - **Eviction**: Leave as "No eviction"
   - Click "Create"

4. **Copy Credentials**
   - After creation, click on your database
   - Go to "REST API" tab
   - Copy these two values:
     - **UPSTASH_REDIS_REST_URL** (starts with `https://`)
     - **UPSTASH_REDIS_REST_TOKEN** (long alphanumeric string)

**Example values:**
```
UPSTASH_REDIS_REST_URL=https://agents-md-rate-limit-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3
```

---

### Step 2: Run Automated Setup Script (1 minute)

**Now the automation takes over!**

Open PowerShell in your project directory and run:

```powershell
.\scripts\setup-upstash-redis.ps1 `
  -UpstashUrl "https://agents-md-rate-limit-12345.upstash.io" `
  -UpstashToken "AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3"
```

**Replace with your actual credentials from Step 1!**

---

### What the Script Does Automatically

The script will:

**[Step 1/5] Validate Credentials**
```
✓ Credentials validated
ℹ URL: https://agents-md-rate-limit-12345.upstash.io...
ℹ Token: AXlzASQgNjg4YjE4ZmEt...
```

**[Step 2/5] Test Upstash Connection**
```
✓ Upstash connection successful!
```

**[Step 3/5] Update .env.local**
```
ℹ Adding Upstash variables...
✓ .env.local updated successfully
```

**[Step 4/5] Update Vercel Environment Variables**
```
ℹ Adding environment variables to Vercel...
ℹ Adding UPSTASH_REDIS_REST_URL...
ℹ Adding UPSTASH_REDIS_REST_TOKEN...
ℹ Adding KV_REST_API_URL...
ℹ Adding KV_REST_API_TOKEN...
✓ Vercel environment variables updated
```

**[Step 5/5] Deploy to Production**
```
ℹ Committing changes...
ℹ Pushing to main branch...
✓ Changes pushed to main branch
ℹ Vercel will automatically deploy in ~2 minutes
```

---

### Step 3: Wait for Deployment (2 minutes)

The script will automatically:
1. Commit your changes
2. Push to main branch
3. Trigger Vercel deployment

**You can monitor the deployment:**
```powershell
# Watch Vercel logs in real-time
vercel logs --follow
```

**Look for this message:**
```
✅ Vercel KV initialized with Upstash Redis
```

---

### Step 4: Verify It's Working (2 minutes)

**Test rate limiting:**

```powershell
# Try logging in 6 times with wrong password
# 6th attempt should be blocked (429 error)
for ($i=1; $i -le 6; $i++) {
  Write-Host "`nAttempt $i..."
  curl -X POST https://news.arcane.group/api/auth/login `
    -H "Content-Type: application/json" `
    -d '{"email":"test@example.com","password":"wrong"}' `
    -w "`nStatus: %{http_code}`n"
  Start-Sleep -Seconds 1
}
```

**Expected Results:**
- Attempts 1-5: `401 Unauthorized` (wrong password)
- Attempt 6: `429 Too Many Requests` (rate limited!)

**Response on 6th attempt:**
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## 🔍 Troubleshooting

### Issue: Script Not Found

**Error:**
```
.\scripts\setup-upstash-redis.ps1 : The term '.\scripts\setup-upstash-redis.ps1' is not recognized
```

**Solution:**
```powershell
# Make sure you're in the project root directory
cd path\to\Agents.MD

# Check if script exists
Test-Path .\scripts\setup-upstash-redis.ps1

# If false, the script wasn't created properly
```

---

### Issue: Execution Policy Error

**Error:**
```
cannot be loaded because running scripts is disabled on this system
```

**Solution:**
```powershell
# Allow script execution (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the script again
.\scripts\setup-upstash-redis.ps1 -UpstashUrl "..." -UpstashToken "..."
```

---

### Issue: Upstash Connection Failed

**Error:**
```
✗ Failed to connect to Upstash
```

**Solutions:**

1. **Check URL format:**
   ```
   ✅ Correct: https://agents-md-12345.upstash.io
   ❌ Wrong: redis://default:password@host:6379
   ```

2. **Check token:**
   - No extra spaces
   - Copy entire token
   - Check for line breaks

3. **Check database status:**
   - Go to Upstash dashboard
   - Database should show "Active"

4. **Test manually:**
   ```powershell
   curl -X POST https://your-redis.upstash.io/set/test/hello `
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Should return: {"result":"OK"}
   ```

---

### Issue: Vercel CLI Not Found

**Warning:**
```
⚠ Vercel CLI not found
```

**Solution:**

**Option 1: Install Vercel CLI**
```powershell
npm install -g vercel
```

**Option 2: Skip Vercel (add manually)**
```powershell
# Run script with -SkipVercel flag
.\scripts\setup-upstash-redis.ps1 `
  -UpstashUrl "..." `
  -UpstashToken "..." `
  -SkipVercel

# Then add to Vercel manually:
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Settings → Environment Variables
# 4. Add the 4 variables shown in script output
```

---

### Issue: Git Push Failed

**Warning:**
```
⚠ Git push failed or no changes to commit
```

**Solutions:**

1. **Check if you have uncommitted changes:**
   ```powershell
   git status
   ```

2. **Manually commit and push:**
   ```powershell
   git add .env.local
   git commit -m "🔧 Configure Upstash Redis"
   git push origin main
   ```

3. **Or deploy directly:**
   ```powershell
   vercel --prod
   ```

---

## 📊 What Changed

### Files Modified

**`.env.local`** - Added Upstash credentials:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token-here
```

**Vercel Environment Variables** - Added 4 variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Code Changes

**NONE!** ✅

Your code already supports Upstash Redis. The middleware automatically detects and uses it when environment variables are set.

---

## ✅ Success Checklist

After running the script, verify:

- [ ] Script completed without errors
- [ ] `.env.local` contains Upstash credentials
- [ ] Vercel environment variables added (or added manually)
- [ ] Changes committed and pushed to main
- [ ] Vercel deployment completed
- [ ] Logs show "✅ Vercel KV initialized with Upstash Redis"
- [ ] Rate limiting works (6th attempt blocked)
- [ ] Upstash dashboard shows rate limit keys

---

## 🎯 Alternative: Manual Setup

If you prefer manual setup or the script fails:

**Follow these guides:**
1. `UPSTASH-QUICK-START.md` - 5-minute manual setup
2. `UPSTASH-REDIS-SETUP-GUIDE.md` - Detailed manual setup

---

## 📚 Additional Resources

### Script Help
```powershell
# Show script help
.\scripts\setup-upstash-redis.ps1 -Help
```

### Monitoring
```powershell
# Watch Vercel logs
vercel logs --follow

# Check Upstash dashboard
# https://console.upstash.com/redis
```

### Documentation
- **Quick Reference**: `UPSTASH-CHEAT-SHEET.md`
- **Comparison**: `RATE-LIMITING-COMPARISON.md`
- **Full Guide**: `UPSTASH-REDIS-SETUP-GUIDE.md`

---

## 🎉 Summary

**Total Time**: ~10 minutes
- Create Upstash account: 2 minutes (manual)
- Run automation script: 1 minute (automated)
- Wait for deployment: 2 minutes (automated)
- Verify it works: 2 minutes (manual)

**Manual Steps**: Only 2
1. Create Upstash database
2. Run the script with credentials

**Everything else is automated!** ✅

---

## 🚀 Ready to Start?

**Run this command:**

```powershell
.\scripts\setup-upstash-redis.ps1 `
  -UpstashUrl "YOUR_UPSTASH_URL_HERE" `
  -UpstashToken "YOUR_UPSTASH_TOKEN_HERE"
```

**That's it!** The script handles the rest. 🎉

---

**Status**: 🤖 **FULLY AUTOMATED**  
**Time**: 10 minutes  
**Manual Steps**: 2  
**Automation**: 95%

