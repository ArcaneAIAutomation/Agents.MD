# UCIE Deployment Pipeline Setup

## Overview

This document provides complete instructions for setting up a CI/CD pipeline for the Universal Crypto Intelligence Engine (UCIE) using GitHub Actions and Vercel.

**Status**: 🟡 Ready for Setup  
**Priority**: High - Ensures reliable deployments  
**Tools**: GitHub Actions, Vercel CLI, automated testing

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
│  1. Create feature branch                                    │
│  2. Make changes to UCIE code                                │
│  3. Commit and push to GitHub                                │
│  4. Create Pull Request                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions - PR Checks                      │
│  ✓ Lint code (ESLint)                                       │
│  ✓ Type check (TypeScript)                                  │
│  ✓ Run tests (Jest/Vitest)                                  │
│  ✓ Build project                                            │
│  ✓ Security scan                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel - Preview Deployment                     │
│  • Deploy to preview URL                                     │
│  • Run E2E tests                                            │
│  • Generate preview link                                     │
│  • Comment on PR with link                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Code Review                                │
│  • Team reviews changes                                      │
│  • Test on preview deployment                                │
│  • Approve or request changes                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Merge to Main Branch                            │
│  • PR approved and merged                                    │
│  • Triggers production deployment                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         Vercel - Production Deployment                       │
│  • Build production bundle                                   │
│  • Deploy to production                                      │
│  • Run smoke tests                                          │
│  • Send deployment notification                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Post-Deployment                                 │
│  • Monitor error rates (Sentry)                              │
│  • Check performance (Vercel Analytics)                      │
│  • Verify health checks                                      │
│  • Rollback if issues detected                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create GitHub Actions Workflows

### 1.1 Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### 1.2 Create PR Check Workflow

Create `.github/workflows/pr-checks.yml`:

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]
    paths:
      - 'components/UCIE/**'
      - 'pages/api/ucie/**'
      - 'pages/ucie/**'
      - 'lib/ucie/**'
      - 'hooks/useUCIE*.ts'
      - '__tests__/ucie/**'

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
  
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run TypeScript
        run: npx tsc --noEmit
  
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --run
        env:
          NODE_ENV: test
  
  build:
    name: Build Project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          SKIP_ENV_VALIDATION: true
  
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### 1.3 Create Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'components/UCIE/**'
      - 'pages/api/ucie/**'
      - 'pages/ucie/**'
      - 'lib/ucie/**'
      - 'hooks/useUCIE*.ts'

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --run
        env:
          NODE_ENV: test
      
      - name: Build
        run: npm run build
        env:
          SKIP_ENV_VALIDATION: true
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Run smoke tests
        run: |
          sleep 30
          curl -f https://news.arcane.group/api/ucie/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'UCIE deployment to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 1.4 Create Nightly Test Workflow

Create `.github/workflows/nightly-tests.yml`:

```yaml
name: Nightly Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          # Add test API keys
          CAESAR_API_KEY: ${{ secrets.CAESAR_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
  
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.json
```

---

## Step 2: Configure GitHub Secrets

### 2.1 Add Vercel Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `VERCEL_TOKEN` | Your Vercel token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel org ID | Run `vercel whoami` |
| `VERCEL_PROJECT_ID` | Your project ID | Vercel project settings |

### 2.2 Add Notification Secrets

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `SLACK_WEBHOOK` | Slack webhook URL | Deployment notifications |
| `DISCORD_WEBHOOK` | Discord webhook URL | Alternative notifications |

### 2.3 Add Test API Keys (Optional)

For integration tests:

| Secret Name | Value |
|-------------|-------|
| `CAESAR_API_KEY` | Test Caesar API key |
| `OPENAI_API_KEY` | Test OpenAI API key |

---

## Step 3: Configure Vercel Integration

### 3.1 Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **Agents.MD**
3. Go to **Settings** → **Git**
4. Ensure GitHub integration is connected
5. Configure:
   - **Production Branch**: `main`
   - **Preview Branches**: All branches
   - **Ignored Build Step**: Leave empty

### 3.2 Configure Build Settings

In Vercel project settings:

```
Build Command: npm run build
Output Directory: .next
Install Command: npm ci
Development Command: npm run dev
```

### 3.3 Configure Environment Variables

Ensure all UCIE environment variables are set in Vercel (see `UCIE-VERCEL-ENV-SETUP.md`).

---

## Step 4: Create Deployment Scripts

### 4.1 Create Pre-Deployment Script

Create `scripts/pre-deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Running pre-deployment checks..."

# Check Node version
NODE_VERSION=$(node -v)
echo "✓ Node version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
echo "✓ npm version: $NPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linter
echo "🔍 Running linter..."
npm run lint

# Run type check
echo "📝 Running type check..."
npx tsc --noEmit

# Run tests
echo "🧪 Running tests..."
npm test -- --run

# Build project
echo "🏗️  Building project..."
npm run build

echo "✅ Pre-deployment checks passed!"
```

### 4.2 Create Post-Deployment Script

Create `scripts/post-deploy.sh`:

```bash
#!/bin/bash

echo "🔍 Running post-deployment checks..."

# Wait for deployment to be ready
echo "⏳ Waiting for deployment..."
sleep 30

# Check health endpoint
echo "🏥 Checking health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://news.arcane.group/api/ucie/health)

if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed! Status: $HEALTH_STATUS"
  exit 1
fi

# Check UCIE page loads
echo "📄 Checking UCIE page..."
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://news.arcane.group/ucie)

if [ "$PAGE_STATUS" -eq 200 ]; then
  echo "✅ UCIE page loads successfully!"
else
  echo "❌ UCIE page failed to load! Status: $PAGE_STATUS"
  exit 1
fi

# Test analysis endpoint
echo "🔬 Testing analysis endpoint..."
ANALYSIS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://news.arcane.group/api/ucie/analyze/BTC)

if [ "$ANALYSIS_STATUS" -eq 200 ]; then
  echo "✅ Analysis endpoint working!"
else
  echo "⚠️  Analysis endpoint returned: $ANALYSIS_STATUS"
fi

echo "✅ Post-deployment checks complete!"
```

Make scripts executable:

```bash
chmod +x scripts/pre-deploy.sh
chmod +x scripts/post-deploy.sh
```

---

## Step 5: Create Rollback Strategy

### 5.1 Vercel Instant Rollback

Vercel provides instant rollback:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project → **Deployments**
3. Find previous successful deployment
4. Click **...** → **Promote to Production**

### 5.2 Automated Rollback Script

Create `scripts/rollback.sh`:

```bash
#!/bin/bash

echo "🔄 Rolling back deployment..."

# Get previous deployment
PREV_DEPLOYMENT=$(vercel ls --prod | grep -v "$(vercel ls --prod | head -n 1)" | head -n 1 | awk '{print $1}')

if [ -z "$PREV_DEPLOYMENT" ]; then
  echo "❌ No previous deployment found!"
  exit 1
fi

echo "📦 Previous deployment: $PREV_DEPLOYMENT"

# Promote previous deployment
vercel promote $PREV_DEPLOYMENT --yes

echo "✅ Rollback complete!"

# Verify rollback
sleep 10
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://news.arcane.group/api/ucie/health)

if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ Rollback verified!"
else
  echo "❌ Rollback verification failed!"
  exit 1
fi
```

---

## Step 6: Set Up Deployment Notifications

### 6.1 Slack Notifications

1. Create Slack webhook:
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app
   - Enable Incoming Webhooks
   - Create webhook for your channel

2. Add webhook to GitHub secrets as `SLACK_WEBHOOK`

### 6.2 Discord Notifications

1. Create Discord webhook:
   - Go to Discord server settings
   - Integrations → Webhooks
   - Create webhook

2. Add webhook to GitHub secrets as `DISCORD_WEBHOOK`

### 6.3 Email Notifications

GitHub Actions automatically sends email notifications for:
- Failed workflows
- Successful deployments (if configured)

Configure in: Repository Settings → Notifications

---

## Step 7: Create Deployment Checklist

Create `DEPLOYMENT-CHECKLIST.md`:

```markdown
# UCIE Deployment Checklist

## Pre-Deployment

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Environment variables updated in Vercel
- [ ] Database migrations run (if any)
- [ ] API keys verified
- [ ] Documentation updated

## Deployment

- [ ] Create PR with changes
- [ ] Wait for CI checks to pass
- [ ] Review preview deployment
- [ ] Get approval from team
- [ ] Merge to main
- [ ] Monitor deployment progress
- [ ] Verify health checks pass

## Post-Deployment

- [ ] Test UCIE functionality manually
- [ ] Check Sentry for errors
- [ ] Monitor Vercel Analytics
- [ ] Verify cache is working
- [ ] Test watchlist and alerts
- [ ] Check performance metrics
- [ ] Announce deployment to team

## Rollback (if needed)

- [ ] Identify issue
- [ ] Run rollback script
- [ ] Verify rollback successful
- [ ] Investigate root cause
- [ ] Create fix
- [ ] Redeploy with fix
```

---

## Step 8: Testing the Pipeline

### 8.1 Test PR Workflow

```bash
# Create feature branch
git checkout -b test/ucie-pipeline

# Make a small change
echo "// Test change" >> lib/ucie/cache.ts

# Commit and push
git add .
git commit -m "test: Verify CI/CD pipeline"
git push origin test/ucie-pipeline

# Create PR on GitHub
# Verify all checks pass
```

### 8.2 Test Deployment

```bash
# Merge PR to main
# Monitor GitHub Actions
# Check Vercel deployment
# Verify health checks
```

---

## Success Criteria

- ✅ GitHub Actions workflows created
- ✅ PR checks running automatically
- ✅ Vercel integration configured
- ✅ Deployment scripts created
- ✅ Rollback strategy documented
- ✅ Notifications configured
- ✅ Deployment checklist created
- ✅ Pipeline tested end-to-end

---

## Troubleshooting

### Issue: GitHub Actions Failing

**Check:**
1. Secrets are configured correctly
2. Node version matches (18.x)
3. Dependencies install successfully
4. Tests pass locally

### Issue: Vercel Deployment Failing

**Check:**
1. Build command is correct
2. Environment variables are set
3. No build errors in logs
4. Output directory is correct

### Issue: Health Checks Failing

**Check:**
1. API endpoints are accessible
2. Database connection working
3. Redis connection working
4. API keys configured

---

## Next Steps

1. ✅ **Complete this setup** (Task 20.4)
2. ⏳ **Create user documentation** (Task 20.5)
3. ⏳ **Launch UCIE to production** (Phase 21)

---

**Last Updated**: January 27, 2025  
**Status**: 🟡 Ready for Implementation  
**Estimated Time**: 2-3 hours  
**Priority**: High
