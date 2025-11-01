# ============================================================================
# Complete Vercel Deployment Script
# Bitcoin Sovereign Technology - Authentication System
# ============================================================================
# This script handles the complete deployment process:
# 1. Creates environment variables file
# 2. Shows how to set them in Vercel
# 3. Commits and pushes to GitHub
# 4. Triggers Vercel deployment
#
# Usage:
#   .\scripts\deploy-to-vercel.ps1
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Bitcoin Sovereign Technology" -ForegroundColor Cyan
Write-Host "   Complete Vercel Deployment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create environment variables reference
Write-Host "📝 Step 1: Creating environment variables reference..." -ForegroundColor Yellow
Write-Host ""

$envVars = @"
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
JWT_SECRET=MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI=
CRON_SECRET=UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo=
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
SENDER_EMAIL=no-reply@arcane.group
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
NEXT_PUBLIC_APP_URL=https://news.arcane.group
ENABLE_WELCOME_EMAIL=true
ENABLE_SESSION_CLEANUP=true
SESSION_CLEANUP_INTERVAL_HOURS=24
SESSION_RETENTION_DAYS=30
"@

# Save to temporary file
$envVars | Out-File -FilePath "vercel-env-vars.txt" -Encoding UTF8 -NoNewline
Write-Host "✅ Created: vercel-env-vars.txt" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions for Vercel Dashboard
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📋 Step 2: Set Environment Variables in Vercel" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Open Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/arcane-ai-automations-projects/agents-md-v2/settings/environment-variables" -ForegroundColor White
Write-Host ""
Write-Host "📝 For each variable in 'vercel-env-vars.txt':" -ForegroundColor Yellow
Write-Host "   1. Click 'Add New'" -ForegroundColor White
Write-Host "   2. Enter the variable name (e.g., DATABASE_URL)" -ForegroundColor White
Write-Host "   3. Enter the value" -ForegroundColor White
Write-Host "   4. Select: Production, Preview, Development" -ForegroundColor White
Write-Host "   5. Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Quick Tip: You can copy-paste from vercel-env-vars.txt" -ForegroundColor Cyan
Write-Host ""

# Wait for user confirmation
Write-Host "⏸️  Press Enter when you've set all variables in Vercel..." -ForegroundColor Yellow
Read-Host

# Step 3: Check Git status
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📦 Step 3: Prepare Git Commit" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Checking Git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📝 Files to commit:" -ForegroundColor Yellow
Write-Host "   - Updated .env.local (database configuration)" -ForegroundColor White
Write-Host "   - Authentication system files" -ForegroundColor White
Write-Host ""

$commitConfirm = Read-Host "Commit and push to GitHub? (y/n)"
if ($commitConfirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually deploy later with:" -ForegroundColor Yellow
    Write-Host "   git add ." -ForegroundColor White
    Write-Host "   git commit -m 'Configure authentication system'" -ForegroundColor White
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Step 4: Commit and push
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Step 4: Deploy to GitHub & Vercel" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Adding files to Git..." -ForegroundColor Yellow
git add .

Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Configure authentication system with Supabase database

- Updated database configuration to use Supabase PostgreSQL
- Fixed environment variable loading
- Added deployment scripts
- Authentication system ready for production

Database: Supabase PostgreSQL (connection pooling port 6543)
Rate Limiting: Redis Cloud
Email: Office 365 via Azure AD
Access Codes: 9 available for registration"

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✅ Deployment Initiated!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your code has been pushed to GitHub" -ForegroundColor Green
    Write-Host "⚡ Vercel will automatically deploy in ~2-3 minutes" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Monitor deployment:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/arcane-ai-automations-projects/agents-md-v2" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Production URL:" -ForegroundColor Yellow
    Write-Host "   https://news.arcane.group" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test endpoints after deployment:" -ForegroundColor Yellow
    Write-Host "   https://news.arcane.group/api/auth/csrf-token" -ForegroundColor White
    Write-Host "   https://news.arcane.group/api/auth/me" -ForegroundColor White
    Write-Host ""
    Write-Host "🎫 Available access codes for testing:" -ForegroundColor Yellow
    Write-Host "   - BTC-SOVEREIGN-K3QYMQ-01" -ForegroundColor White
    Write-Host "   - BTC-SOVEREIGN-AKCJRG-02" -ForegroundColor White
    Write-Host "   - BTC-SOVEREIGN-LMBLRN-03" -ForegroundColor White
    Write-Host "   (and 6 more...)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Cleanup
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow
if (Test-Path "vercel-env-vars.txt") {
    Remove-Item "vercel-env-vars.txt"
    Write-Host "✅ Removed: vercel-env-vars.txt" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
