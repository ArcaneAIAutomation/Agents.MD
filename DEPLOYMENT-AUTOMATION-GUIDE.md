# Automated Vercel Deployment Guide

## Overview

This project now includes automated deployment scripts that streamline the process of deploying to Vercel. Simply run a single command to commit, push, and trigger deployment.

---

## Quick Start

### Windows (PowerShell)

```powershell
# Deploy with default message
npm run deploy

# Deploy with custom message
.\deploy.ps1 "✨ Add new feature"

# Or using npm script
npm run deploy:msg "✨ Add new feature"
```

### Unix/Linux/Mac (Bash)

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy with default message
npm run deploy:unix

# Deploy with custom message
./deploy.sh "✨ Add new feature"
```

### Quick Deploy (Any Platform)

```bash
# Ultra-fast deployment with default message
npm run quick-deploy
```

---

## Available Scripts

### Deployment Scripts

| Command | Description |
|---------|-------------|
| `npm run deploy` | Automated deployment (Windows) |
| `npm run deploy:unix` | Automated deployment (Unix/Linux/Mac) |
| `npm run deploy:msg "message"` | Deploy with custom commit message |
| `npm run quick-deploy` | Fast deployment with default message |

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Git Utility Scripts

| Command | Description |
|---------|-------------|
| `npm run status` | Check git status |
| `npm run log` | View last 10 commits |

---

## Deployment Scripts

### deploy.ps1 (Windows PowerShell)

**Location:** `deploy.ps1`

**Features:**
- ✅ Checks for changes
- ✅ Stages all changes
- ✅ Commits with custom message
- ✅ Pushes to main branch
- ✅ Displays deployment info
- ✅ Color-coded output
- ✅ Error handling

**Usage:**
```powershell
# Default message
.\deploy.ps1

# Custom message
.\deploy.ps1 "✨ Add new feature"

# With npm
npm run deploy
```

### deploy.sh (Unix/Linux/Mac)

**Location:** `deploy.sh`

**Features:**
- ✅ Checks for changes
- ✅ Stages all changes
- ✅ Commits with custom message
- ✅ Pushes to main branch
- ✅ Displays deployment info
- ✅ Color-coded output
- ✅ Error handling

**Usage:**
```bash
# Make executable (first time only)
chmod +x deploy.sh

# Default message
./deploy.sh

# Custom message
./deploy.sh "✨ Add new feature"

# With npm
npm run deploy:unix
```

---

## Deployment Workflow

### What Happens When You Deploy

1. **Check Git Status**
   - Verifies there are changes to deploy
   - Exits gracefully if no changes

2. **Stage Changes**
   - Runs `git add .`
   - Stages all modified and new files

3. **Commit Changes**
   - Commits with your message (or default)
   - Creates a commit hash

4. **Push to GitHub**
   - Pushes to `main` branch
   - Triggers Vercel auto-deployment

5. **Display Info**
   - Shows commit hash
   - Shows deployment URLs
   - Shows next steps

### Vercel Auto-Deployment

Once pushed to GitHub, Vercel automatically:
- ✅ Detects the push to main branch
- ✅ Starts build process (~2-3 minutes)
- ✅ Runs `npm run build`
- ✅ Deploys to production
- ✅ Updates production URL

---

## Commit Message Conventions

### Recommended Format

```
<emoji> <type>: <description>

Examples:
✨ feat: Add new whale watch feature
🐛 fix: Fix button glow effect on mobile
📝 docs: Update deployment guide
🎨 style: Improve Bitcoin Sovereign styling
♻️ refactor: Optimize animation performance
✅ test: Add glow effect validation tests
🚀 deploy: Deploy Task 12.7 changes
```

### Emoji Guide

| Emoji | Type | Description |
|-------|------|-------------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| 📝 | docs | Documentation |
| 🎨 | style | Styling/UI changes |
| ♻️ | refactor | Code refactoring |
| ⚡ | perf | Performance improvement |
| ✅ | test | Testing |
| 🚀 | deploy | Deployment |
| 🔧 | config | Configuration |
| 🔒 | security | Security fix |

---

## Examples

### Example 1: Deploy Task Completion

```powershell
# Windows
.\deploy.ps1 "✅ Task 12.7: Validate glow effects and animations"

# Unix/Linux/Mac
./deploy.sh "✅ Task 12.7: Validate glow effects and animations"
```

### Example 2: Deploy Bug Fix

```powershell
# Windows
.\deploy.ps1 "🐛 fix: Fix mobile button glow on hover"

# Unix/Linux/Mac
./deploy.sh "🐛 fix: Fix mobile button glow on hover"
```

### Example 3: Deploy New Feature

```powershell
# Windows
.\deploy.ps1 "✨ feat: Add Bitcoin block components with glow effects"

# Unix/Linux/Mac
./deploy.sh "✨ feat: Add Bitcoin block components with glow effects"
```

### Example 4: Quick Deploy

```bash
# Any platform
npm run quick-deploy
```

---

## Troubleshooting

### Script Won't Run (Windows)

**Problem:** PowerShell execution policy prevents script

**Solution:**
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy to allow scripts (run as Administrator)
Set-ExecutionPolicy RemoteSigned

# Or run with bypass
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### Script Won't Run (Unix/Linux/Mac)

**Problem:** Script not executable

**Solution:**
```bash
# Make script executable
chmod +x deploy.sh

# Verify permissions
ls -l deploy.sh
```

### No Changes to Deploy

**Problem:** Script exits with "No changes to deploy"

**Solution:**
- Verify you have uncommitted changes: `git status`
- Make changes to files before deploying
- Or use `git commit --allow-empty` for empty commit

### Push Failed

**Problem:** Git push fails

**Solution:**
```bash
# Pull latest changes first
git pull origin main

# Resolve any conflicts
# Then try deploying again
npm run deploy
```

### Vercel Build Failed

**Problem:** Vercel build fails after deployment

**Solution:**
1. Check Vercel dashboard for error logs
2. Verify build locally: `npm run build`
3. Fix any build errors
4. Deploy again

---

## Advanced Usage

### Deploy with Multi-line Message

```powershell
# Windows
.\deploy.ps1 @"
✅ Task 12.7 Complete

- Added bitcoin-block components
- Implemented glow effects
- Mobile optimizations
"@
```

```bash
# Unix/Linux/Mac
./deploy.sh "✅ Task 12.7 Complete

- Added bitcoin-block components
- Implemented glow effects
- Mobile optimizations"
```

### Deploy Specific Files Only

```bash
# Stage specific files
git add styles/globals.css components/BTCTradingChart.tsx

# Commit
git commit -m "🎨 style: Update Bitcoin Sovereign styling"

# Push
git push origin main
```

### Rollback Deployment

```bash
# Revert last commit
git revert HEAD

# Push revert
git push origin main

# Or use Vercel dashboard to promote previous deployment
```

---

## Monitoring Deployments

### Vercel Dashboard

**URL:** https://vercel.com/dashboard

**What to Check:**
- ✅ Build status (Building, Ready, Error)
- ✅ Build logs for errors
- ✅ Deployment preview URL
- ✅ Production URL
- ✅ Build time and performance

### GitHub Actions (Optional)

You can add GitHub Actions for additional automation:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: echo "Vercel auto-deploys from main branch"
```

---

## Best Practices

### Before Deploying

1. ✅ Test locally: `npm run dev`
2. ✅ Build locally: `npm run build`
3. ✅ Check for errors: `npm run lint`
4. ✅ Review changes: `git status`
5. ✅ Write clear commit message

### After Deploying

1. ✅ Monitor Vercel dashboard
2. ✅ Wait for build completion (2-3 minutes)
3. ✅ Test production site
4. ✅ Verify mobile/tablet experience
5. ✅ Check for console errors

### Deployment Frequency

- **Development:** Deploy frequently (multiple times per day)
- **Features:** Deploy after completing each task
- **Bug Fixes:** Deploy immediately after fixing
- **Documentation:** Deploy with code changes

---

## Integration with Kiro Specs

### Deploying Task Completions

When completing a task from `.kiro/specs/*/tasks.md`:

```powershell
# Example: Task 12.7
.\deploy.ps1 "✅ Task 12.7: Validate glow effects and animations (Mobile/Tablet)

- Added bitcoin-block components
- Implemented all glow effects
- Mobile optimizations
- 31/31 tests passed

Requirements Met: 5.1, 5.5, STYLING-SPEC.md"
```

### Automated Task Deployment

You can create a task-specific deployment script:

```powershell
# deploy-task.ps1
param([string]$TaskNumber)

$taskFile = ".kiro/specs/mobile-optimization/tasks.md"
$taskName = (Select-String -Path $taskFile -Pattern "- \[x\] $TaskNumber\..*" | Select-Object -First 1).Line

.\deploy.ps1 "✅ $taskName"
```

---

## Security Considerations

### Environment Variables

**Never commit:**
- `.env.local` (already in .gitignore)
- API keys
- Secrets
- Passwords

**Vercel Environment Variables:**
- Set in Vercel dashboard
- Not in git repository
- Automatically available in production

### Sensitive Files

Ensure `.gitignore` includes:
```
.env.local
.env*.local
*.key
*.pem
secrets/
```

---

## Summary

### Quick Reference

```bash
# Deploy (Windows)
npm run deploy

# Deploy (Unix/Linux/Mac)
npm run deploy:unix

# Quick deploy (any platform)
npm run quick-deploy

# Deploy with custom message
.\deploy.ps1 "Your message here"
./deploy.sh "Your message here"

# Check status
npm run status

# View recent commits
npm run log
```

### Deployment Checklist

- [ ] Test locally (`npm run dev`)
- [ ] Build locally (`npm run build`)
- [ ] Review changes (`git status`)
- [ ] Write clear commit message
- [ ] Run deployment script
- [ ] Monitor Vercel dashboard
- [ ] Test production site
- [ ] Verify mobile experience

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Status:** ✅ Automated Deployment Ready
