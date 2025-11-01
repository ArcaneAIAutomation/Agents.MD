# 🧪 Agents.MD - Testing Documentation

## Quick Start

### 1. Run Quick Test (30 seconds)
```bash
npm run test:quick
```

This validates:
- ✅ Environment configuration
- ✅ Critical API keys
- ✅ Dependencies
- ✅ Database connection
- ✅ Gemini API key format

### 2. Run Full Automated Tests (5 minutes)
```bash
# Development environment
npm run test:auto

# Production environment
npm run test:auto:prod

# Skip build step (faster)
npm run test:auto:skip-build
```

---

## Available Test Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run test:quick` | Quick validation of critical config | 30s |
| `npm run test:auto` | Full automated test suite (dev) | 5min |
| `npm run test:auto:prod` | Full automated test suite (prod) | 5min |
| `npm run test:auto:skip-build` | Skip build, test only | 3min |
| `npm test` | Run Jest unit tests | 1min |
| `npm run test:watch` | Jest watch mode | - |
| `npm run test:coverage` | Jest with coverage report | 2min |

---

## Test Coverage

### ✅ Automated Tests

#### Environment Validation
- [x] .env.local file exists
- [x] Critical API keys configured
- [x] API key format validation
- [x] Environment variable loading

#### Dependencies
- [x] Node.js version check
- [x] npm version check
- [x] node_modules installed
- [x] Package versions compatible

#### Database
- [x] Connection test
- [x] SSL configuration
- [x] Query execution
- [x] Connection pooling

#### API Endpoints
- [x] Homepage (/)
- [x] Health check (/api/health)
- [x] CSRF token (/api/auth/csrf-token)
- [x] Current user (/api/auth/me)
- [x] Bitcoin analysis (/api/btc-analysis)
- [x] Ethereum analysis (/api/eth-analysis)
- [x] Crypto Herald (/api/crypto-herald-15-stories)
- [x] Whale detection (/api/whale-watch/detect)

#### Authentication
- [x] Registration flow
- [x] Login flow
- [x] Logout flow
- [x] Rate limiting
- [x] Session management
- [x] JWT token validation

#### Gemini AI
- [x] API key format validation
- [x] Model configuration
- [x] Timeout settings
- [x] Rate limiting
- [x] Error handling

---

## Manual Testing Checklist

### Authentication System
- [ ] Register new user with access code
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Rate limiting after 5 failed attempts
- [ ] Remember Me checkbox extends session
- [ ] Logout clears session
- [ ] Protected routes require authentication

### Whale Watch
- [ ] Detect whales with threshold
- [ ] Standard analysis (< 100 BTC)
- [ ] Deep Dive analysis (>= 100 BTC)
- [ ] AI reasoning process visible
- [ ] Analysis lock prevents spam
- [ ] Transaction details displayed correctly
- [ ] Sources and citations shown

### Market Analysis
- [ ] Bitcoin price updates
- [ ] Ethereum price updates
- [ ] Technical indicators calculate correctly
- [ ] AI analysis generates
- [ ] Trading zones display
- [ ] Charts render properly

### News Feed
- [ ] 15 stories load
- [ ] Auto-refresh works
- [ ] Stories have all fields
- [ ] Links work
- [ ] Timestamps are recent

### Mobile Experience
- [ ] Responsive on all screen sizes
- [ ] Touch targets >= 48px
- [ ] No horizontal scroll
- [ ] Text doesn't overflow
- [ ] Hamburger menu works
- [ ] Animations smooth
- [ ] Performance acceptable

---

## Test Reports

### Automated Report Location
```
test-results-YYYYMMDD-HHMMSS.txt
```

### Report Contents
- Environment tested
- Base URL
- Timestamp
- Total tests run
- Passed/Failed/Skipped counts
- Pass rate percentage
- Detailed results

### Example Report
```
AGENTS.MD - Test Results
========================
Environment: prod
Base URL: https://news.arcane.group
Timestamp: 2025-01-26 14:30:00

Summary:
--------
Total Tests: 25
Passed: 23
Failed: 0
Skipped: 2
Pass Rate: 92%

Status: SUCCESS ✅
```

---

## Troubleshooting

### Common Issues

#### ❌ "Database connection failed"
**Solution:**
1. Check DATABASE_URL in .env.local
2. Verify Supabase database is running
3. Test connection: `npx tsx scripts/check-database-status.ts`
4. Ensure SSL config is correct (no ?sslmode=require in URL)

#### ❌ "Gemini API key invalid"
**Solution:**
1. Verify format: `AIzaSy[33 characters]`
2. Check key is active in Google AI Studio
3. Ensure no extra spaces or quotes
4. Test: `npm run validate:gemini`

#### ❌ "Rate limit exceeded"
**Solution:**
1. Wait 15 minutes for rate limit to reset
2. Or clear Redis cache
3. Check KV_REST_API_URL and KV_REST_API_TOKEN

#### ❌ "Build failed"
**Solution:**
1. Clear cache: `rm -rf .next`
2. Reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript errors
4. Verify all imports

#### ❌ "Port 3000 already in use"
**Solution:**
```powershell
# Windows
Get-Process -Name node | Stop-Process

# Or use different port
$env:PORT=3001; npm run dev
```

---

## Performance Testing

### Lighthouse Audit
1. Open Chrome DevTools
2. Lighthouse tab
3. Select "Mobile"
4. Generate report

**Targets:**
- Performance: >= 80
- Accessibility: >= 90
- Best Practices: >= 90
- SEO: >= 90

### Load Testing
```bash
# Install Apache Bench
# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 https://news.arcane.group/
```

---

## Security Testing

### Headers Check
```bash
curl -I https://news.arcane.group/
```

**Required Headers:**
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy

### Authentication Security
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens httpOnly
- ✅ CSRF protection enabled
- ✅ Rate limiting active
- ✅ SQL injection prevented
- ✅ XSS protection enabled

---

## CI/CD Integration

### Pre-Deployment Checklist
```bash
# 1. Run quick test
npm run test:quick

# 2. Run full test suite
npm run test:auto

# 3. Check for errors
# If all pass, deploy:
npm run deploy
```

### Vercel Deployment
1. Push to main branch
2. Vercel auto-deploys
3. Check build logs
4. Test preview URL
5. Verify production

---

## Test Data

### Test Access Codes
```
BITCOIN2025 (primary test code)
BTC-SOVEREIGN-K3QYMQ-01
BTC-SOVEREIGN-AKCJRG-02
... (see .env.example for full list)
```

### Test User Credentials
```
Email: test@example.com
Password: TestPassword123!
```

**Note:** Create new test users with timestamp to avoid conflicts:
```
Email: test-20250126143000@example.com
```

---

## Monitoring

### Production Monitoring
- Vercel Dashboard: https://vercel.com/dashboard
- Function Logs: Check /api/* endpoints
- Error Tracking: Monitor 4xx/5xx responses
- Performance: Check response times

### Database Monitoring
- Supabase Dashboard: https://supabase.com/dashboard
- Connection pool status
- Query performance
- Storage usage

### Key Metrics
- Response time: < 100ms (target)
- Error rate: < 1% (target)
- Uptime: > 99.9% (target)
- Pass rate: > 90% (target)

---

## Contributing

### Adding New Tests

#### 1. Update test-automation.ps1
```powershell
# Add new test function
Test-Endpoint -Name "New Feature" -Url "$BaseUrl/api/new-feature"
```

#### 2. Update TEST-GUIDE.md
```markdown
### New Feature Testing
1. Navigate to new feature
2. ✅ Should work correctly
```

#### 3. Update this README
```markdown
- [x] New feature test
```

### Test Naming Convention
- Use descriptive names
- Include expected behavior
- Document prerequisites
- Note any dependencies

---

## Resources

### Documentation
- [Complete Test Guide](./TEST-GUIDE.md)
- [Authentication Guide](./.kiro/steering/authentication.md)
- [API Integration](./.kiro/steering/api-integration.md)
- [Mobile Development](./.kiro/steering/mobile-development.md)

### External Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html)
- [Postman](https://www.postman.com/)
- [Jest](https://jestjs.io/)

### Support
- GitHub Issues: https://github.com/ArcaneAIAutomation/Agents.MD/issues
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

---

## Quick Reference

### Test Commands
```bash
npm run test:quick              # Quick validation (30s)
npm run test:auto               # Full test suite (5min)
npm run test:auto:prod          # Test production
npm run test:auto:skip-build    # Skip build step
npm test                        # Jest unit tests
```

### Validation Commands
```bash
npm run validate:gemini         # Validate Gemini config
npx tsx scripts/check-database-status.ts  # Check database
npx tsx scripts/cleanup-sessions.ts       # Test session cleanup
```

### Deployment Commands
```bash
npm run deploy                  # Deploy to production
npm run quick-deploy            # Quick deploy with default message
npm run status                  # Check git status
npm run log                     # View recent commits
```

---

**Last Updated**: January 26, 2025  
**Version**: 2.0.0  
**Status**: Ready for Testing ✅

**Next Steps:**
1. Run `npm run test:quick` to validate setup
2. Run `npm run test:auto` for full test suite
3. Review [TEST-GUIDE.md](./TEST-GUIDE.md) for manual testing
4. Deploy with confidence! 🚀
