# 🚀 Agents.MD - Setup & Testing Checklist

## Pre-Testing Setup

### ✅ Step 1: Environment Configuration
```bash
# Validate your setup
npm run validate:setup
```

**What it checks:**
- [ ] .env.local file exists and is configured
- [ ] All required API keys are set
- [ ] API key formats are valid
- [ ] No placeholder values remain
- [ ] Dependencies are installed
- [ ] Database connection works
- [ ] Redis/KV connection works (optional)
- [ ] Git is configured correctly
- [ ] Vercel is linked (optional)

**If validation fails:**
1. Review error messages
2. Update .env.local with valid API keys
3. Run `npm install` if dependencies are missing
4. Check database connection string
5. Re-run validation

---

### ✅ Step 2: Quick Validation (30 seconds)
```bash
# Fast check of critical components
npm run test:quick
```

**What it tests:**
- [ ] Environment file exists
- [ ] Critical API keys configured
- [ ] Dependencies installed
- [ ] Database connection
- [ ] Gemini API key format

**Expected Result:** All tests pass ✅

---

### ✅ Step 3: Full Automated Testing (5 minutes)
```bash
# Complete test suite
npm run test:auto
```

**What it tests:**
- [ ] Environment validation
- [ ] Dependency check
- [ ] Database connection
- [ ] Application build
- [ ] API endpoints (10+ endpoints)
- [ ] Authentication flow
- [ ] Gemini AI integration
- [ ] Generates test report

**Expected Result:** Pass rate >= 80%

---

## Manual Testing Checklist

### 🔐 Authentication System

#### Registration
- [ ] Navigate to https://news.arcane.group
- [ ] Click "Register"
- [ ] Enter access code: `BITCOIN2025`
- [ ] Enter email: `test-$(date +%s)@example.com`
- [ ] Enter password: `SecurePass123!`
- [ ] Confirm password
- [ ] Click "Register"
- [ ] ✅ Should see success message
- [ ] ✅ Should be redirected to dashboard

#### Login
- [ ] Navigate to login page
- [ ] Enter registered email
- [ ] Enter password
- [ ] Check "Remember Me"
- [ ] Click "Login"
- [ ] ✅ Should be logged in
- [ ] ✅ Session should persist

#### Logout
- [ ] Click "Logout"
- [ ] ✅ Should be logged out
- [ ] ✅ Should be redirected to login

#### Rate Limiting
- [ ] Try wrong password 5 times
- [ ] ✅ Should be rate limited
- [ ] ✅ Should show error message

---

### 🐋 Whale Watch Feature

#### Detection
- [ ] Navigate to Whale Watch
- [ ] Set threshold: `50 BTC`
- [ ] Click "Detect Whales"
- [ ] ✅ Should show transaction list
- [ ] ✅ Each transaction has all fields

#### Standard Analysis (< 100 BTC)
- [ ] Select transaction < 100 BTC
- [ ] Click "Analyze with AI"
- [ ] ✅ Should complete in ~3 seconds
- [ ] ✅ Should show analysis results
- [ ] ✅ Should display confidence score
- [ ] ✅ Should show key findings

#### Deep Dive Analysis (>= 100 BTC)
- [ ] Select transaction >= 100 BTC
- [ ] Click "Deep Dive Analysis"
- [ ] ✅ Should show "Deep Dive" badge
- [ ] ✅ Should complete in ~10-15 seconds
- [ ] ✅ Should show comprehensive analysis
- [ ] ✅ Should include blockchain history

#### AI Reasoning
- [ ] Expand "AI Reasoning Process"
- [ ] ✅ Should show step-by-step thinking
- [ ] ✅ Should be collapsible

#### Analysis Lock
- [ ] Start an analysis
- [ ] Try to start another
- [ ] ✅ Should be blocked
- [ ] ✅ UI should be greyed out
- [ ] ✅ Should show message

---

### 📊 Market Analysis

#### Bitcoin Analysis
- [ ] Navigate to Bitcoin Market Report
- [ ] ✅ Current price displayed
- [ ] ✅ 24h change shown
- [ ] ✅ Technical indicators visible
- [ ] ✅ AI analysis generated
- [ ] ✅ Trading zones displayed

#### Ethereum Analysis
- [ ] Navigate to Ethereum Market Report
- [ ] ✅ Current price displayed
- [ ] ✅ 24h change shown
- [ ] ✅ Technical indicators visible
- [ ] ✅ AI analysis generated

#### Trade Generation
- [ ] Navigate to AI Trade Generation
- [ ] Select BTC
- [ ] Select 1h timeframe
- [ ] Click "Generate Signal"
- [ ] ✅ Should show trade signal
- [ ] ✅ Should show entry/exit prices
- [ ] ✅ Should show risk/reward

---

### 📰 News Feed

#### Crypto Herald
- [ ] Navigate to Crypto News Wire
- [ ] ✅ Should show 15 stories
- [ ] ✅ Each story has headline
- [ ] ✅ Each story has source
- [ ] ✅ Each story has timestamp
- [ ] ✅ Links work correctly
- [ ] ✅ Auto-refresh works

---

### 📱 Mobile Experience

#### Responsive Design
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 14 (390px)
- [ ] Test on iPad Mini (768px)
- [ ] Test on iPad Pro (1024px)
- [ ] ✅ All content readable
- [ ] ✅ No horizontal scroll
- [ ] ✅ Touch targets >= 48px
- [ ] ✅ Text doesn't overflow

#### Mobile Navigation
- [ ] Open hamburger menu
- [ ] ✅ Full-screen overlay appears
- [ ] ✅ All menu items visible
- [ ] ✅ Easy to tap
- [ ] ✅ Closes correctly

#### Mobile Performance
- [ ] Test on 3G (DevTools)
- [ ] ✅ Loads in < 5 seconds
- [ ] ✅ Images optimized
- [ ] ✅ Animations smooth

---

## Performance Testing

### Lighthouse Audit
- [ ] Open Chrome DevTools
- [ ] Go to Lighthouse tab
- [ ] Select "Mobile"
- [ ] Generate report
- [ ] ✅ Performance >= 80
- [ ] ✅ Accessibility >= 90
- [ ] ✅ Best Practices >= 90
- [ ] ✅ SEO >= 90

### Load Testing
```bash
ab -n 100 -c 10 https://news.arcane.group/
```
- [ ] ✅ No errors
- [ ] ✅ Average response < 500ms
- [ ] ✅ All requests successful

---

## Security Testing

### Headers Check
```bash
curl -I https://news.arcane.group/
```
- [ ] ✅ X-Content-Type-Options: nosniff
- [ ] ✅ X-Frame-Options: DENY
- [ ] ✅ X-XSS-Protection: 1; mode=block
- [ ] ✅ Strict-Transport-Security
- [ ] ✅ Content-Security-Policy

### Authentication Security
- [ ] ✅ Passwords are hashed
- [ ] ✅ JWT tokens are httpOnly
- [ ] ✅ CSRF protection enabled
- [ ] ✅ Rate limiting active
- [ ] ✅ SQL injection prevented

---

## Database Testing

### Connection Test
```bash
npx tsx scripts/check-database-status.ts
```
- [ ] ✅ Connection successful
- [ ] ✅ Tables exist
- [ ] ✅ Indexes created

### Migration Test
```bash
npx tsx scripts/simple-migrate.ts
```
- [ ] ✅ Migrations run successfully
- [ ] ✅ No errors

### Session Cleanup Test
```bash
npx tsx scripts/cleanup-sessions.ts
```
- [ ] ✅ Cleanup runs successfully
- [ ] ✅ Expired sessions removed

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Git working directory clean
- [ ] On main branch
- [ ] All changes committed

### Deployment
```bash
npm run deploy
```
- [ ] ✅ Build succeeds
- [ ] ✅ Deployment succeeds
- [ ] ✅ Preview URL works
- [ ] ✅ Production URL works

### Post-Deployment
- [ ] Test production URL
- [ ] Check Vercel logs
- [ ] Monitor for errors
- [ ] Verify all features work
- [ ] Test authentication
- [ ] Test Whale Watch
- [ ] Test market data

---

## Troubleshooting

### Common Issues

#### ❌ Database Connection Failed
**Fix:**
1. Check DATABASE_URL in .env.local
2. Verify Supabase is running
3. Test: `npx tsx scripts/check-database-status.ts`

#### ❌ Gemini API Key Invalid
**Fix:**
1. Verify format: `AIzaSy[33 chars]`
2. Check key is active
3. Test: `npm run validate:gemini`

#### ❌ Build Failed
**Fix:**
1. Clear cache: `rm -rf .next`
2. Reinstall: `npm install`
3. Check TypeScript errors

#### ❌ Rate Limit Exceeded
**Fix:**
1. Wait 15 minutes
2. Or clear Redis cache
3. Check KV configuration

---

## Success Criteria

### Minimum Requirements
- ✅ All automated tests pass (>= 80%)
- ✅ Authentication works
- ✅ Whale Watch works
- ✅ Market data loads
- ✅ News feed loads
- ✅ Mobile responsive
- ✅ No console errors
- ✅ No security issues

### Recommended
- ✅ Pass rate >= 90%
- ✅ Lighthouse score >= 80
- ✅ Load test successful
- ✅ All manual tests pass
- ✅ Documentation complete

---

## Next Steps

### After Testing
1. ✅ Review test results
2. ✅ Fix any issues found
3. ✅ Update documentation
4. ✅ Deploy to production
5. ✅ Monitor for 24 hours

### Ongoing
- Run tests before each deployment
- Monitor production logs
- Update tests as features change
- Keep documentation current

---

## Quick Commands Reference

```bash
# Validation
npm run validate:setup          # Full setup validation
npm run test:quick              # Quick test (30s)
npm run test:auto               # Full test suite (5min)
npm run test:auto:prod          # Test production

# Database
npx tsx scripts/check-database-status.ts
npx tsx scripts/simple-migrate.ts
npx tsx scripts/cleanup-sessions.ts

# Deployment
npm run deploy                  # Deploy to production
npm run quick-deploy            # Quick deploy
npm run status                  # Git status
npm run log                     # Recent commits

# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run start                   # Start production server
```

---

**Last Updated**: January 26, 2025  
**Version**: 2.0.0  
**Status**: Ready for Testing ✅

**Start Here:**
```bash
npm run validate:setup
```

If validation passes, proceed with:
```bash
npm run test:quick
npm run test:auto
```

Then review [TEST-GUIDE.md](./TEST-GUIDE.md) for detailed manual testing instructions.

**Good luck! 🚀**
