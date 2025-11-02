# UCIE Staging Environment Setup

## Overview

This guide explains how to set up a staging environment for UCIE testing before production deployment.

**Purpose**: Test UCIE features in a production-like environment without affecting live users

---

## Option 1: Vercel Preview Deployments (Recommended)

Vercel automatically creates preview deployments for every pull request.

### Setup

1. **Create a feature branch**:
```bash
git checkout -b feature/ucie-testing
```

2. **Make changes and commit**:
```bash
git add .
git commit -m "feat: UCIE testing changes"
git push origin feature/ucie-testing
```

3. **Create pull request**:
- Go to GitHub repository
- Click "New Pull Request"
- Select `feature/ucie-testing` → `main`
- Create PR

4. **Get preview URL**:
- Vercel bot will comment on PR with preview URL
- Example: `https://agents-md-git-feature-ucie-testing-yourorg.vercel.app`

### Testing on Preview

```bash
# Test health endpoint
curl https://your-preview-url.vercel.app/api/ucie/health

# Test analysis endpoint
curl https://your-preview-url.vercel.app/api/ucie/analyze/BTC
```

### Advantages
- ✅ Automatic deployment on every push
- ✅ Isolated from production
- ✅ Same environment as production
- ✅ Easy to share with team
- ✅ No additional cost

---

## Option 2: Dedicated Staging Project

Create a separate Vercel project for staging.

### Setup

1. **Create new Vercel project**:
- Go to Vercel Dashboard
- Click "Add New" → "Project"
- Import same GitHub repository
- Name it "agents-md-staging"

2. **Configure staging branch**:
- Go to project Settings → Git
- Set production branch to `staging`
- Enable automatic deployments

3. **Create staging branch**:
```bash
git checkout -b staging
git push origin staging
```

4. **Configure environment variables**:
- Copy all variables from production
- Use staging-specific API keys where available
- Set `NODE_ENV=staging`

5. **Configure custom domain** (optional):
```
staging.news.arcane.group
```

### Deployment Workflow

```bash
# Develop on feature branch
git checkout -b feature/new-ucie-feature
# ... make changes ...
git commit -m "feat: new UCIE feature"

# Merge to staging for testing
git checkout staging
git merge feature/new-ucie-feature
git push origin staging
# Vercel deploys to staging automatically

# After testing, merge to main for production
git checkout main
git merge staging
git push origin main
# Vercel deploys to production automatically
```

### Advantages
- ✅ Persistent staging environment
- ✅ Custom domain possible
- ✅ Separate from production
- ✅ Can use different API keys
- ❌ Requires additional Vercel project

---

## Option 3: Local Staging Environment

Test locally with production-like configuration.

### Setup

1. **Create staging environment file**:
```bash
cp .env.local .env.staging
```

2. **Update `.env.staging`**:
```bash
# Use staging API keys
ETHERSCAN_API_KEY=staging_key_here
LUNARCRUSH_API_KEY=staging_key_here

# Use staging database
DATABASE_URL=postgres://staging_db_url

# Use staging Redis
KV_REST_API_URL=redis://staging_redis_url

# Set environment
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run with staging config**:
```bash
# Load staging environment
export $(cat .env.staging | xargs)

# Start development server
npm run dev
```

### Testing Locally

```bash
# Test health endpoint
curl http://localhost:3000/api/ucie/health

# Test analysis endpoint
curl http://localhost:3000/api/ucie/analyze/BTC
```

### Advantages
- ✅ Fast iteration
- ✅ No deployment wait time
- ✅ Full debugging capabilities
- ✅ No cost
- ❌ Not accessible to team
- ❌ Not production-like environment

---

## Staging Testing Checklist

Before promoting to production, verify:

### Functionality Tests
- [ ] UCIE search page loads
- [ ] Token search autocomplete works
- [ ] Analysis page loads for BTC
- [ ] Market data displays correctly
- [ ] Technical indicators calculate
- [ ] News feed loads
- [ ] Social sentiment displays
- [ ] On-chain data shows
- [ ] Derivatives data displays
- [ ] DeFi metrics show
- [ ] Export functionality works
- [ ] Watchlist functionality works
- [ ] Alerts functionality works

### Performance Tests
- [ ] Initial page load < 2 seconds
- [ ] Complete analysis < 15 seconds
- [ ] Cache hit rate > 80%
- [ ] API success rate > 99%
- [ ] No memory leaks
- [ ] No console errors

### Security Tests
- [ ] API keys not exposed in client
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection works

### Mobile Tests
- [ ] Responsive on 320px width
- [ ] Touch targets 48px minimum
- [ ] Swipe gestures work
- [ ] Pull-to-refresh works
- [ ] Charts render correctly
- [ ] No horizontal scroll

### Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Staging Environment Variables

### Required for Staging

```bash
# Environment
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.news.arcane.group

# Feature Flags
ENABLE_UCIE=true
ENABLE_UCIE_DEBUG=true
UCIE_CACHE_TTL=60

# API Keys (use staging keys if available)
ETHERSCAN_API_KEY=staging_key
LUNARCRUSH_API_KEY=staging_key
TWITTER_BEARER_TOKEN=staging_token
COINGLASS_API_KEY=staging_key

# Database (staging database)
DATABASE_URL=postgres://staging_db_url

# Redis (staging Redis)
KV_REST_API_URL=redis://staging_redis_url
KV_REST_API_TOKEN=staging_token

# Monitoring (staging Sentry)
SENTRY_DSN=https://staging_sentry_dsn
SENTRY_ENVIRONMENT=staging
```

---

## Staging Deployment Commands

### Deploy to Staging (Option 2)

```bash
# Deploy current branch to staging
git checkout staging
git merge main
git push origin staging

# Or deploy specific feature
git checkout staging
git merge feature/ucie-new-feature
git push origin staging
```

### Rollback Staging

```bash
# Rollback to previous commit
git checkout staging
git reset --hard HEAD~1
git push origin staging --force

# Or rollback to specific commit
git reset --hard <commit-hash>
git push origin staging --force
```

---

## Monitoring Staging

### View Logs

```bash
# Vercel CLI
vercel logs --project=agents-md-staging

# Or in Vercel Dashboard
# Go to project → Deployments → Click deployment → View logs
```

### Check Performance

```bash
# Run Lighthouse audit
npx lighthouse https://staging.news.arcane.group --view

# Check Web Vitals
curl https://staging.news.arcane.group/api/analytics/web-vitals
```

### Monitor Errors

```bash
# Check Sentry dashboard
# https://sentry.io/organizations/your-org/projects/ucie-staging/

# Or check Vercel function logs
# Vercel Dashboard → Functions → View logs
```

---

## Best Practices

### 1. Always Test on Staging First

```bash
# ❌ Don't do this
git push origin main  # Direct to production

# ✅ Do this
git push origin staging  # Test on staging first
# ... verify everything works ...
git push origin main  # Then deploy to production
```

### 2. Use Staging API Keys

- Use separate API keys for staging to avoid rate limits
- Monitor staging API costs separately
- Don't use production database on staging

### 3. Test with Real Data

- Use real API responses, not mocks
- Test with various tokens (BTC, ETH, small caps)
- Test edge cases (invalid tokens, API failures)

### 4. Monitor Staging Performance

- Set up alerts for staging errors
- Track staging performance metrics
- Compare staging vs production performance

### 5. Document Staging Issues

- Create issues for bugs found on staging
- Document workarounds
- Track staging-specific configuration

---

## Troubleshooting

### Issue: Staging deployment fails

**Solution**:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Check for build errors
4. Verify dependencies are installed

### Issue: Staging shows different behavior than local

**Solution**:
1. Verify environment variables match
2. Check Node.js version matches
3. Clear Vercel cache and redeploy
4. Check for environment-specific code

### Issue: Staging API calls fail

**Solution**:
1. Verify API keys are configured
2. Check rate limits
3. Verify API endpoints are correct
4. Check CORS settings

---

## Next Steps

1. **Choose staging strategy**: Preview deployments or dedicated project
2. **Configure staging environment**: Set up environment variables
3. **Test thoroughly**: Run through testing checklist
4. **Document issues**: Create tickets for bugs found
5. **Deploy to production**: After staging tests pass

---

**Last Updated**: January 2025  
**Recommended Strategy**: Vercel Preview Deployments (Option 1)  
**Status**: Ready for staging testing
