# Einstein Trade Engine - Deployment Script (PowerShell)
# Version: 2.0.0
# Platform: Vercel + Supabase

Write-Host "🚀 Einstein Trade Engine - Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-Deployment Checklist" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host ""

# Check Node.js version
$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Run TypeScript type check
Write-Host ""
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript type check passed" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript type check failed" -ForegroundColor Red
    Write-Host "Fix type errors before deploying" -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host ""
Write-Host "🔍 Running ESLint..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Linting passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Linting warnings found (non-blocking)" -ForegroundColor Yellow
}

# Build the project
Write-Host ""
Write-Host "🏗️  Building project..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host ""
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🎯 Ready to Deploy!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose deployment target:"
Write-Host "  1) Preview (testing)"
Write-Host "  2) Production (live)"
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to Preview..." -ForegroundColor Cyan
        vercel
    }
    "2" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will deploy to PRODUCTION!" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host ""
            Write-Host "🚀 Deploying to Production..." -ForegroundColor Cyan
            vercel --prod
        } else {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test the deployment URL"
Write-Host "  2. Verify Einstein signal generation works"
Write-Host "  3. Check Vercel function logs"
Write-Host "  4. Monitor for errors"
Write-Host ""
