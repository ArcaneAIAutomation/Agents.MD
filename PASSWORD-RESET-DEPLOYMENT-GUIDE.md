# Password Reset - Quick Deployment Guide

**Time Required**: 5-10 minutes  
**Status**: Ready to deploy  
**Date**: January 27, 2025

---

## Step 1: Run Database Migration (REQUIRED)

### Option A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Copy Migration SQL**:
   - Open `migrations/002_password_reset_tokens.sql`
   - Copy entire contents

3. **Execute Migration**:
   - Paste SQL into editor
   - Click "Run" button
   - Wait for success message

4. **Verify Table Created**:
   ```sql
   SELECT * FROM password_reset_tokens LIMIT 1;
   ```
   - Should return empty result (no error)

### Option B: Command Line

```bash
# If you have psql installed
psql $DATABASE_URL -f migrations/002_password_reset_tokens.sql
```

---

## Step 2: Deploy to Vercel

### Automatic Deployment (Recommended)

```bash
# Commit all changes
git add -A
git commit -m "feat(auth): Add password reset functionality

- Add password_reset_tokens table
- Add request-password-reset API endpoint
- Add reset-password API endpoint
- Add ForgotPasswordForm component
- Add ResetPasswordForm component
- Add forgot-password page
- Add reset-password page
- Add 'Forgot Password?' link to LoginForm
- Add cleanup-password-reset-tokens cron job
- Update vercel.json with new cron job"

# Push to GitHub
git push origin main
```

Vercel will automatically deploy within 2-3 minutes.

### Manual Deployment

```bash
# Using Vercel CLI
vercel --prod
```

---

## Step 3: Verify Deployment

### 1. Check Vercel Dashboard
- Go to https://vercel.com/dashboard
- Select project
- Click latest deployment
- Verify build succeeded
- Check function logs for errors

### 2. Test Forgot Password Page
- Navigate to https://news.arcane.group/auth/forgot-password
- Verify page loads correctly
- Check for any console errors

### 3. Test Password Reset Flow

#### Request Reset:
```bash
curl -X POST https://news.arcane.group/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

#### Check Email:
- Check inbox for password reset email
- Verify email received within 1 minute
- Click reset link
- Verify redirected to reset password page

#### Reset Password:
- Enter new password (meeting requirements)
- Confirm password
- Submit form
- Verify success message
- Verify redirected to login page

#### Login with New Password:
- Enter email and new password
- Submit login form
- Verify successful login

---

## Step 4: Verify Cron Job

### Check Cron Configuration
1. Go to Vercel Dashboard → Project → Settings
2. Click "Cron Jobs" tab
3. Verify `cleanup-password-reset-tokens` is listed
4. Schedule should be: `0 3 * * *` (3 AM UTC daily)

### Test Cron Job (Optional)
```bash
curl -X POST https://news.arcane.group/api/cron/cleanup-password-reset-tokens \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password reset token cleanup completed",
  "deleted": {
    "expired": 0,
    "used": 0,
    "total": 0
  },
  "timestamp": "2025-01-27T..."
}
```

---

## Step 5: Monitor for Issues

### First 24 Hours
- [ ] Check Vercel function logs every few hours
- [ ] Monitor email delivery success rate
- [ ] Watch for any error patterns
- [ ] Verify cron job runs at 3 AM UTC

### Key Metrics to Monitor
- **Password reset requests**: Should be reasonable (not spam)
- **Email delivery rate**: Should be >95%
- **Token usage rate**: Should match reset requests
- **Error rate**: Should be <1%

---

## Rollback Plan (If Needed)

### If Issues Occur

1. **Revert Code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Keep Database Table**:
   - Don't drop `password_reset_tokens` table
   - It won't cause issues if unused

3. **Disable Cron Job**:
   - Go to Vercel Dashboard → Settings → Cron Jobs
   - Disable `cleanup-password-reset-tokens`

---

## Common Issues & Solutions

### Issue: Migration Fails
**Error**: "relation already exists"  
**Solution**: Table already created, safe to ignore

### Issue: Email Not Sent
**Check**:
1. Verify Azure credentials in Vercel environment variables
2. Check Vercel function logs for email errors
3. Verify SENDER_EMAIL is set correctly

### Issue: Token Invalid
**Check**:
1. Verify database migration ran successfully
2. Check token hasn't expired (1 hour limit)
3. Verify token hasn't been used already

### Issue: Rate Limit Hit
**Solution**: Wait 15 minutes and try again

---

## Success Indicators

### ✅ Deployment Successful If:
- [ ] Database migration completed without errors
- [ ] Vercel deployment succeeded
- [ ] Forgot password page loads
- [ ] Password reset email received
- [ ] Password reset completes successfully
- [ ] Login works with new password
- [ ] Cron job is scheduled
- [ ] No errors in Vercel logs

---

## Post-Deployment Tasks

### Immediate (Within 1 Hour)
- [ ] Test complete password reset flow
- [ ] Verify email delivery
- [ ] Check Vercel function logs
- [ ] Monitor for errors

### Within 24 Hours
- [ ] Update authentication documentation
- [ ] Add password reset to README
- [ ] Monitor usage metrics
- [ ] Verify cron job ran successfully

### Within 1 Week
- [ ] Review password reset analytics
- [ ] Check for any user feedback
- [ ] Optimize email delivery if needed
- [ ] Consider additional security enhancements

---

## Support & Documentation

### If You Need Help
1. Check Vercel function logs first
2. Review `PASSWORD-RESET-COMPLETE.md` for detailed info
3. Check `.kiro/steering/authentication.md` for auth system context
4. Review error messages in browser console

### Documentation Files
- `PASSWORD-RESET-COMPLETE.md` - Complete implementation details
- `PASSWORD-RESET-DEPLOYMENT-GUIDE.md` - This file
- `.kiro/steering/authentication.md` - Authentication system guide
- `AUTHENTICATION-SECURITY-GUIDE.md` - Security best practices

---

**Estimated Total Time**: 5-10 minutes  
**Difficulty**: Easy  
**Risk Level**: Low (can be rolled back easily)

**Ready to deploy!** 🚀
