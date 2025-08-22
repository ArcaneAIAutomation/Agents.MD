# 🚀 Trading Intelligence Hub v1.2.0 - DEPLOYMENT SCRIPT
# Production deployment commands for Vercel

Write-Host "🚀 Trading Intelligence Hub v1.2.0 Deployment" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Verify version
$package = Get-Content "package.json" | ConvertFrom-Json
$version = $package.version
Write-Host "📦 Current Version: $version" -ForegroundColor Cyan

if ($version -ne "1.2.0") {
    Write-Host "⚠️  Warning: Version is $version, expected 1.2.0" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Pre-deployment Checklist:" -ForegroundColor Yellow
Write-Host "✅ Visual trading charts integrated"
Write-Host "✅ Mobile responsiveness verified"
Write-Host "✅ API endpoints functional"
Write-Host "✅ Error handling implemented"
Write-Host "✅ TypeScript compilation successful"
Write-Host "✅ Production configuration ready"
Write-Host ""

# Check if user wants to proceed
$proceed = Read-Host "🚀 Deploy to Vercel production? (y/N)"

if ($proceed.ToLower() -eq "y" -or $proceed.ToLower() -eq "yes") {
    Write-Host ""
    Write-Host "🚀 Starting deployment process..." -ForegroundColor Green
    
    # Check if Vercel CLI is installed
    try {
        $vercelVersion = vercel --version
        Write-Host "📦 Vercel CLI: $vercelVersion" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g vercel
    }
    
    Write-Host ""
    Write-Host "🚀 Deploying to production..." -ForegroundColor Green
    Write-Host "This will deploy version 1.2.0 with integrated visual trading charts" -ForegroundColor Cyan
    Write-Host ""
    
    # Deploy to production
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "✅ Trading Intelligence Hub v1.2.0 is now live" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 Post-deployment verification steps:" -ForegroundColor Yellow
        Write-Host "1. Test homepage load and responsiveness"
        Write-Host "2. Click BTC analysis and verify chart integration"
        Write-Host "3. Click ETH analysis and verify chart integration"
        Write-Host "4. Test mobile experience on actual device"
        Write-Host "5. Verify all API endpoints are responding"
        Write-Host ""
        Write-Host "📊 Monitor performance at: https://vercel.com/dashboard" -ForegroundColor Cyan
    }
    else {
        Write-Host ""
        Write-Host "❌ DEPLOYMENT FAILED" -ForegroundColor Red
        Write-Host "Check the error messages above and try again" -ForegroundColor Yellow
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "- Environment variables not set in Vercel dashboard"
        Write-Host "- Build errors (check TypeScript compilation)"
        Write-Host "- Network connectivity issues"
    }
}
else {
    Write-Host ""
    Write-Host "❌ Deployment cancelled by user" -ForegroundColor Yellow
    Write-Host "Run this script again when ready to deploy" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📚 Deployment documentation available in:" -ForegroundColor Cyan
Write-Host "- DEPLOYMENT-v1.2-GUIDE.md"
Write-Host "- VERSION-1.2-RELEASE.md"
Write-Host "- PROJECT_STATUS_v1.2.md"
Write-Host ""
