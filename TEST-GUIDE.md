# Agents.MD - Complete Testing Guide

## Quick Start Testing

### 1. Quick Validation (30 seconds)
```powershell
# Run quick test to validate critical configuration
.\scripts\quick-test.ps1
```

This checks:
- ✅ Environment file exists
- ✅ Critical API keys configured
- ✅ Dependencies installed
- ✅ Database connection
- ✅ Gemini API key format

### 2. Full Automated Testing (5 minutes)
```powershell
# Run complete test suite
.\scripts\test-automation.ps1

# Test specific environment
.\scripts\test-automation.ps1 -Environment prod

# Skip build step (faster)
.\scripts\test-automation.ps1 -SkipBuild
```

This tests:
- ✅ Environment validation
- ✅ Dependency check
- ✅ Database connection
- ✅ Application build
- ✅ API endpoints
- ✅ Authentication flow
- ✅ Gemini AI integration
- ✅ Generates test report

---

## Manual Testing Checklist

### Authentication System

#### Registration Flow
1. Navigate to: https://news.arcane.group
2. Click "Register" or access registration page
3. Enter access code: `BITCOIN2025`
4. Enter email: `test@example.com`
5. Enter password: `SecurePass123!`
6. Confirm password: `SecurePass123!`
7. Click "Register"
8. ✅ Should see success message
9. ✅ Should receive welcome email (if configured)
10. ✅ Should be redirected to dashboard

#### Login Flow
1. Navigate to login page
2. Enter registered email
3. Enter password
4. Check "Remember Me" (optional)
5. Click "Login"
6. ✅ Should be logged in
7. ✅ Session should persist (7 days or 30 days with Remember Me)

#### Logout Flow
1. Click "Logout" button
2. ✅ Should be logged out
3. ✅ Should be redirected to login page
4. ✅ Session cookie should be cleared

#### Rate Limiting
1. Attempt login with wrong password 5 times
2. ✅ Should be rate limited after 5 attempts
3. ✅ Should show "Too many attempts" message
4. Wait 15 minutes or clear Redis cache
5. ✅ Should be able to try again

---

### Whale Watch Feature

#### Whale Detection
1. Navigate to Whale Watch dashboard
2. Set threshold: `50 BTC`
3. Click "Detect Whales"
4. ✅ Should show list of large transactions
5. ✅ Each transaction should show:
   - Transaction hash
   - Amount in BTC
   - USD value
   - Timestamp
   - From/To addresses

#### Gemini Analysis (Standard)
1. Find transaction < 100 BTC
2. Click "Analyze with AI"
3. ✅ Should show loading state
4. ✅ Should complete in ~3 seconds
5. ✅ Should display:
   - Transaction type (Exchange Deposit/Withdrawal/Whale-to-Whale)
   - Market impact (Bearish/Bullish/Neutral)
   - Confidence score (0-100%)
   - Key findings (3-10 bullet points)
   - Reasoning (detailed explanation)
   - Trader action recommendation

#### Gemini Deep Dive (Pro)
1. Find transaction >= 100 BTC
2. Click "Deep Dive Analysis"
3. ✅ Should show "Deep Dive" badge
4. ✅ Should complete in ~10-15 seconds
5. ✅ Should display all standard fields PLUS:
   - Blockchain history analysis
   - Address behavior patterns
   - Fund flow tracing
   - 30-day volume analysis
   - Accumulation/distribution detection

#### AI Reasoning Process
1. Expand "AI Reasoning Process" section
2. ✅ Should show step-by-step thinking
3. ✅ Should be collapsible
4. ✅ Should explain how AI arrived at conclusions

#### Analysis Lock System
1. Start an analysis
2. Try to start another analysis immediately
3. ✅ Should be blocked with message
4. ✅ UI should be greyed out
5. ✅ Buttons should be disabled
6. Wait for first analysis to complete
7. ✅ Should be able to start new analysis

---

### Market Analysis Features

#### Bitcoin Analysis
1. Navigate to Bitcoin Market Report
2. ✅ Should show current BTC price
3. ✅ Should show 24h change
4. ✅ Should show technical indicators:
   - RSI
   - MACD
   - Moving Averages
   - Bollinger Bands
5. ✅ Should show AI-generated analysis
6. ✅ Should show trading zones

#### Ethereum Analysis
1. Navigate to Ethereum Market Report
2. ✅ Should show current ETH price
3. ✅ Should show 24h change
4. ✅ Should show technical indicators
5. ✅ Should show AI-generated analysis
6. ✅ Should show trading zones

#### Trade Generation Engine
1. Navigate to AI Trade Generation
2. Select cryptocurrency (BTC/ETH)
3. Select timeframe (15m/1h/4h/1d)
4. Click "Generate Trade Signal"
5. ✅ Should show loading state
6. ✅ Should display:
   - Trade direction (Long/Short)
   - Entry price
   - Stop loss
   - Take profit targets
   - Risk/reward ratio
   - Confidence score
   - Reasoning

---

### News & Intelligence

#### Crypto Herald
1. Navigate to Crypto News Wire
2. ✅ Should show 15 latest news stories
3. ✅ Each story should have:
   - Headline
   - Source
   - Timestamp
   - Summary
   - Link to full article
4. ✅ Should auto-refresh every 5 minutes
5. ✅ Should show loading state during refresh

---

### Mobile Testing

#### Responsive Design
1. Open on mobile device (or use DevTools)
2. Test screen sizes:
   - iPhone SE (375px)
   - iPhone 14 (390px)
   - iPhone 14 Pro Max (428px)
   - iPad Mini (768px)
   - iPad Pro (1024px)
3. ✅ All content should be readable
4. ✅ No horizontal scroll
5. ✅ Touch targets >= 48px
6. ✅ Text should not overflow containers

#### Mobile Navigation
1. Open hamburger menu
2. ✅ Should show full-screen overlay
3. ✅ Should show all menu items
4. ✅ Should be easy to tap
5. ✅ Should close when item selected
6. ✅ Should close when X clicked

#### Mobile Performance
1. Test on 3G connection (DevTools)
2. ✅ Page should load in < 5 seconds
3. ✅ Images should be optimized
4. ✅ Animations should be smooth
5. ✅ No layout shifts

---

## API Testing

### Using cURL

#### Health Check
```bash
curl https://news.arcane.group/api/health
```

#### CSRF Token
```bash
curl https://news.arcane.group/api/auth/csrf-token
```

#### Register User
```bash
curl -X POST https://news.arcane.group/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "BITCOIN2025",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

#### Login
```bash
curl -X POST https://news.arcane.group/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

#### Get Current User
```bash
curl https://news.arcane.group/api/auth/me \
  -b cookies.txt
```

#### Whale Detection
```bash
curl "https://news.arcane.group/api/whale-watch/detect?threshold=50"
```

#### Gemini Analysis
```bash
curl -X POST https://news.arcane.group/api/whale-watch/analyze-gemini \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123...",
    "amount": 75.5,
    "fromAddress": "1A1zP1...",
    "toAddress": "1BvBM...",
    "timestamp": "2025-01-26T12:00:00Z"
  }'
```

---

## Performance Testing

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Mobile" device
4. Check all categories
5. Click "Generate report"
6. ✅ Performance: >= 80
7. ✅ Accessibility: >= 90
8. ✅ Best Practices: >= 90
9. ✅ SEO: >= 90

### Load Testing
```powershell
# Install Apache Bench (if not installed)
# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 https://news.arcane.group/
```

---

## Security Testing

### Authentication Security
- ✅ Passwords are hashed (bcrypt)
- ✅ JWT tokens are httpOnly
- ✅ CSRF protection enabled
- ✅ Rate limiting active
- ✅ SQL injection prevented
- ✅ XSS protection enabled

### Headers Check
```bash
curl -I https://news.arcane.group/
```

Should include:
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy

---

## Database Testing

### Connection Test
```powershell
# Run database status check
npx tsx scripts/check-database-status.ts
```

### Migration Test
```powershell
# Run migrations
npx tsx scripts/simple-migrate.ts
```

### Session Cleanup Test
```powershell
# Test session cleanup
npx tsx scripts/cleanup-sessions.ts
```

---

## Troubleshooting

### Common Issues

#### "Database connection failed"
- Check DATABASE_URL in .env.local
- Verify Supabase database is running
- Check firewall settings
- Ensure SSL is configured correctly

#### "Gemini API key invalid"
- Verify key format: `AIzaSy[33 chars]`
- Check key is active in Google AI Studio
- Ensure no extra spaces or quotes

#### "Rate limit exceeded"
- Wait 15 minutes
- Clear Redis cache
- Check KV_REST_API_URL and KV_REST_API_TOKEN

#### "Build failed"
- Run `npm install` to update dependencies
- Clear `.next` folder: `rm -rf .next`
- Check for TypeScript errors
- Verify all imports are correct

#### "Port 3000 already in use"
- Stop existing process: `Get-Process -Name node | Stop-Process`
- Or use different port: `PORT=3001 npm run dev`

---

## Continuous Integration

### GitHub Actions (Future)
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm test
```

### Vercel Deployment Checks
1. Push to main branch
2. ✅ Vercel should auto-deploy
3. ✅ Build should succeed
4. ✅ Preview URL should work
5. ✅ Production should update

---

## Test Reports

### Automated Reports
- Generated by `test-automation.ps1`
- Saved to: `test-results-YYYYMMDD-HHMMSS.txt`
- Includes:
  - Total tests run
  - Pass/fail counts
  - Pass rate percentage
  - Detailed results

### Manual Test Log
Create a test log for manual testing:

```
Date: 2025-01-26
Tester: [Your Name]
Environment: Production

✅ Authentication: PASS
✅ Whale Watch: PASS
✅ Market Analysis: PASS
✅ News Feed: PASS
✅ Mobile Responsive: PASS
❌ Email Notifications: FAIL (not configured)

Notes:
- All core features working
- Email needs Azure AD setup
- Performance excellent
```

---

## Next Steps

After testing:
1. ✅ Fix any failed tests
2. ✅ Document any issues found
3. ✅ Update this guide with new tests
4. ✅ Run tests before each deployment
5. ✅ Monitor production logs

---

**Last Updated**: January 26, 2025  
**Version**: 2.0.0  
**Status**: Ready for Testing ✅
