# Staging Deployment - Quick Start Guide

## TL;DR - Fast Track to Staging

This is the express guide for deploying to staging. For detailed instructions, see `STAGING-DEPLOYMENT-GUIDE.md`.

---

## Prerequisites

- Vercel account with billing enabled
- Git repository connected to Vercel
- All Phase 1-7 tasks completed
- Tests passing locally

---

## 5-Minute Deployment

### Step 1: Deploy Code (2 minutes)

```powershell
# Option A: Automated (Recommended)
.\scripts\deploy-staging.ps1

# Option B: Manual
git checkout -b auth-system-staging
git add .
git commit -m "feat: implement secure user authentication system"
git push origin auth-system-staging
```

**Result**: Vercel automatically creates preview deployment

### Step 2: Create Databases (2 minutes)

1. **Postgres**: Vercel Dashboard > Storage > Create > Postgres
   - Name: `agents-md-auth-staging`
   - Region: `us-east-1`
   - Copy `DATABASE_URL`

2. **KV**: Vercel Dashboard > Storage > Create > KV
   - Name: `agents-md-rate-limit-staging`
   - Region: `us-east-1`
   - Copy `KV_REST_API_URL`, `KV_REST_API_TOKEN`

### Step 3: Configure Environment (1 minute)

Vercel Dashboard > Project > Settings > Environment Variables (Preview):

```bash
DATABASE_URL=postgres://...
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=7d
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
CRON_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-preview-url.vercel.app
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

Then: Deployments > ... > Redeploy

---

## 5-Minute Setup

### Step 4: Run Migrations (2 minutes)

```powershell
# Set staging database URL
$env:DATABASE_URL="postgres://..."

# Run migrations
npm run migrate:prod

# Import access codes
npm run import:codes
```

### Step 5: Validate (3 minutes)

```powershell
# Run automated tests
.\scripts\validate-staging.ps1 -StagingUrl "https://your-staging-url.vercel.app"
```

**Expected**: All tests pass ✓

---

## 5-Minute Manual Testing

### Quick Smoke Tests

1. **Registration** (1 minute)
   - Open staging URL
   - Click "I have an access code"
   - Use code: `CODE0001`
   - Email: `test@staging.com`
   - Password: `TestPass123!`
   - Submit → Should succeed ✓

2. **Login** (1 minute)
   - Logout
   - Click "I already have an account"
   - Email: `test@staging.com`
   - Password: `TestPass123!`
   - Submit → Should succeed ✓

3. **Session** (1 minute)
   - Refresh page → Still logged in ✓
   - Open new tab → Still logged in ✓

4. **Logout** (1 minute)
   - Click logout → Redirected to AccessGate ✓
   - Refresh → Still see AccessGate ✓

5. **Rate Limiting** (1 minute)
   - Try 6 wrong passwords → 6th blocked ✓

---

## Verification Queries

### Quick Database Checks

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should show: users, access_codes, sessions, auth_logs

-- Check access codes
SELECT COUNT(*) FROM access_codes;
-- Should return: 11

-- Check users
SELECT email FROM users;
-- Should show: test@staging.com

-- Check sessions
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();
-- Should return: 1 (or more)
```

---

## Common Issues & Quick Fixes

### Issue: Build Failed
**Fix**: Check Vercel build logs, verify package.json

### Issue: Database Connection Error
**Fix**: Verify `DATABASE_URL` is correct, check SSL mode

### Issue: Rate Limiting Not Working
**Fix**: Verify KV credentials, check KV connection

### Issue: Tests Failing
**Fix**: Check environment variables, verify migrations ran

---

## Success Criteria

- [ ] Vercel deployment shows "Ready" status
- [ ] All automated tests pass (100%)
- [ ] Manual registration works
- [ ] Manual login works
- [ ] Session persistence works
- [ ] Rate limiting works
- [ ] No errors in Vercel logs

---

## Next Steps

1. **Full Testing**: Follow `STAGING-DEPLOYMENT-CHECKLIST.md`
2. **Team Review**: Demo to team, get approval
3. **Production Prep**: Set up production environment
4. **Deploy**: Follow `DEPLOYMENT.md` for production

---

## Emergency Rollback

If something goes wrong:

```powershell
# Delete staging branch
git branch -D auth-system-staging
git push origin --delete auth-system-staging

# Vercel will automatically remove preview deployment
```

---

## Support

- **Detailed Guide**: `docs/STAGING-DEPLOYMENT-GUIDE.md`
- **Full Checklist**: `docs/STAGING-DEPLOYMENT-CHECKLIST.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Troubleshooting**: `docs/DEPLOYMENT.md#troubleshooting`

---

**Estimated Total Time**: 15 minutes  
**Difficulty**: Easy  
**Prerequisites**: Vercel account, Git access  
**Status**: Ready to Use ✅
