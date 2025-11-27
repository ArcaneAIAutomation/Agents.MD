# UCIE Async Upgrade Guide

**Date**: November 27, 2025  
**Status**: ✅ **AUTOMATED**  
**Time Required**: 5 minutes

---

## 🚀 Quick Start (Automated)

### Windows (PowerShell)

```powershell
.\upgrade-ucie.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x upgrade-ucie.sh
./upgrade-ucie.sh
```

That's it! The script will:
1. ✅ Create database table
2. ✅ Verify endpoints exist
3. ✅ Check Vercel configuration
4. ✅ Test database connection
5. ✅ Create and verify test job

---

## 📋 What the Upgrade Does

### 1. Database Setup
- Creates `ucie_jobs` table
- Adds indexes for performance
- Verifies table structure

### 2. Endpoint Verification
- Checks all new API endpoints exist:
  - `/api/ucie/start-analysis`
  - `/api/ucie/status/[jobId]`
  - `/api/ucie/result/[jobId]`
  - `/api/cron/process-ucie-jobs`

### 3. Configuration Check
- Verifies `vercel.json` settings
- Confirms 60-second timeout
- Validates cron job configuration

### 4. Connection Test
- Tests database connectivity
- Verifies table access
- Creates test job

---

## 🔧 Manual Upgrade (If Needed)

### Step 1: Database Migration

```bash
# Connect to database
psql $DATABASE_URL

# Run migration
\i migrations/ucie_jobs.sql

# Verify
\dt ucie_jobs
```

### Step 2: Verify Files

```bash
# Check endpoints exist
ls -la pages/api/ucie/start-analysis.ts
ls -la pages/api/ucie/status/
ls -la pages/api/ucie/result/
ls -la pages/api/cron/process-ucie-jobs.ts
```

### Step 3: Check Configuration

```bash
# Verify vercel.json
cat vercel.json | jq '.functions'
cat vercel.json | jq '.crons'
```

### Step 4: Test Database

```bash
# Run database test
npx tsx scripts/test-database-access.ts
```

---

## ✅ Verification Checklist

After running the upgrade script:

- [ ] Database table created (`ucie_jobs`)
- [ ] All 4 endpoints exist
- [ ] Vercel config has 60s timeout
- [ ] Cron job configured (every minute)
- [ ] Database connection works
- [ ] Test job created successfully

---

## 🚀 Deployment

Once upgrade is complete:

```bash
# Commit changes (if not already committed)
git add -A
git commit -m "feat: UCIE async upgrade complete"

# Deploy to Vercel
git push origin main
```

---

## 🧪 Testing

### Test Start Analysis

```bash
curl -X POST https://news.arcane.group/api/ucie/start-analysis \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC"}'
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "queued",
  "message": "UCIE analysis started for BTC..."
}
```

### Test Status Check

```bash
# Replace {jobId} with actual job ID
curl https://news.arcane.group/api/ucie/status/{jobId}
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "symbol": "BTC",
  "status": "processing",
  "progress": 45,
  "phase": "technical"
}
```

### Test Result Fetch

```bash
# Replace {jobId} with actual job ID
curl https://news.arcane.group/api/ucie/result/{jobId}
```

**Expected Response (when complete):**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "symbol": "BTC",
  "status": "completed",
  "result": {...}
}
```

---

## 📊 Monitoring

### Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Check **Cron Jobs** tab
4. Verify `/api/cron/process-ucie-jobs` runs every minute

### Database Monitoring

```sql
-- Check active jobs
SELECT id, symbol, status, progress, phase, created_at 
FROM ucie_jobs 
WHERE status IN ('queued', 'processing')
ORDER BY created_at DESC;

-- Check completed jobs
SELECT id, symbol, data_quality, completed_at 
FROM ucie_jobs 
WHERE status = 'completed'
ORDER BY completed_at DESC 
LIMIT 10;

-- Check failed jobs
SELECT id, symbol, error, updated_at 
FROM ucie_jobs 
WHERE status = 'failed'
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: Database table creation fails

**Solution:**
```bash
# Check database connection
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Try manual migration
psql $DATABASE_URL -f migrations/ucie_jobs.sql
```

### Issue: Endpoints not found

**Solution:**
```bash
# Verify files exist
ls -la pages/api/ucie/
ls -la pages/api/cron/

# Check git status
git status

# Pull latest changes
git pull origin main
```

### Issue: Cron job not running

**Solution:**
1. Check Vercel Dashboard → Cron Jobs
2. Verify `CRON_SECRET` environment variable is set
3. Check function logs for errors
4. Manually trigger: `curl -X POST https://news.arcane.group/api/cron/process-ucie-jobs -H "Authorization: Bearer $CRON_SECRET"`

### Issue: Jobs stuck in "queued" status

**Solution:**
```bash
# Check cron job logs in Vercel
# Verify cron is running every minute
# Check for errors in function logs

# Manual job processing (for testing)
curl -X POST https://news.arcane.group/api/cron/process-ucie-jobs \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 📚 Additional Resources

- **Implementation Guide**: `UCIE-ASYNC-IMPLEMENTATION-COMPLETE.md`
- **Vercel Pro Limits**: `VERCEL-PRO-60S-LIMIT-SOLUTION.md`
- **Database Schema**: `migrations/ucie_jobs.sql`
- **Test Script**: `scripts/upgrade-ucie-async.ts`

---

## 🎯 Success Criteria

The upgrade is successful when:

- ✅ Automated script completes without errors
- ✅ Database table exists with indexes
- ✅ All endpoints are accessible
- ✅ Vercel cron job runs every minute
- ✅ Test job can be created and processed
- ✅ First real analysis completes in 5-7 minutes

---

## 📞 Support

If you encounter issues:

1. Check error messages from upgrade script
2. Review troubleshooting section above
3. Check Vercel function logs
4. Verify database connectivity
5. Review implementation guide

---

**Status**: 🟢 **READY TO RUN**  
**Automation**: ✅ **COMPLETE**  
**Time**: 5 minutes  
**Difficulty**: Easy

**Run the upgrade script and you're done!** 🚀
