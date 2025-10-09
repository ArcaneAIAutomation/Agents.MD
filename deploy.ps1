# Automated Vercel Deployment Script
# Usage: .\deploy.ps1 [commit-message]

param(
    [string]$CommitMessage = "🚀 Automated deployment"
)

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AUTOMATED VERCEL DEPLOYMENT 🚀       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Check Git Status
Write-Host "📊 Checking Git Status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ✅ Changes detected" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No changes to deploy" -ForegroundColor Yellow
    Write-Host "`nExiting...`n" -ForegroundColor Gray
    exit 0
}

# Step 2: Add All Changes
Write-Host "`n📦 Adding Changes..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ All changes staged" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to stage changes" -ForegroundColor Red
    exit 1
}

# Step 3: Commit Changes
Write-Host "`n💾 Committing Changes..." -ForegroundColor Yellow
Write-Host "  Message: $CommitMessage" -ForegroundColor Cyan
git commit -m "$CommitMessage"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Step 4: Push to GitHub
Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Pushed to main branch" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

# Step 5: Get Commit Hash
$commitHash = git rev-parse --short HEAD
Write-Host "`n📝 Deployment Details:" -ForegroundColor Yellow
Write-Host "  Commit: $commitHash" -ForegroundColor Cyan
Write-Host "  Branch: main" -ForegroundColor Cyan
Write-Host "  Message: $CommitMessage" -ForegroundColor Cyan

# Step 6: Vercel Auto-Deploy Info
Write-Host "`n🔄 Vercel Auto-Deploy:" -ForegroundColor Yellow
Write-Host "  ✅ Deployment triggered automatically" -ForegroundColor Green
Write-Host "  ⏱️  Build time: ~2-3 minutes" -ForegroundColor Cyan
Write-Host "  🔗 Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "  🌐 Production: https://agents-md.vercel.app" -ForegroundColor Cyan

# Step 7: Success Message
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DEPLOYMENT COMPLETE ✅                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Monitor deployment at https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Wait 2-3 minutes for build completion" -ForegroundColor White
Write-Host "  3. Test live site at https://agents-md.vercel.app" -ForegroundColor White
Write-Host ""
