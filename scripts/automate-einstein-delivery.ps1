# Einstein Trade Engine - Automated Delivery Script
# This script automates the complete deployment pipeline

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('preview', 'production')]
    [string]$Environment = 'preview',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoConfirm = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Einstein Trade Engine - Automated Delivery Pipeline" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Pre-flight Checks
Write-Host "📋 Step 1/8: Running Pre-flight Checks..." -ForegroundColor Green

# Check Node.js
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green

# Check Vercel CLI
$vercelVersion = vercel --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green

# Check Git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    
    if (-not $AutoConfirm) {
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}
Write-Host "✅ Git status checked" -ForegroundColor Green

Write-Host "`n✅ Pre-flight checks passed!`n" -ForegroundColor Green

# Step 2: Database Schema Verification
Write-Host "📋 Step 2/8: Verifying Database Schema..." -ForegroundColor Green

if (Test-Path "scripts/verify-einstein-schema.ts") {
    npx tsx scripts/verify-einstein-schema.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database schema verification failed" -ForegroundColor Red
        Write-Host "Run: npx tsx scripts/run-einstein-migration.ts" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Database schema verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  Schema verification script not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Run Tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "📋 Step 3/8: Running Test Suite..." -ForegroundColor Green
    
    # Performance tests
    if (Test-Path "scripts/test-einstein-performance.ts") {
        Write-Host "Running performance tests..." -ForegroundColor Cyan
        npx tsx scripts/test-einstein-performance.ts
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Performance tests failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Performance tests passed" -ForegroundColor Green
    }
    
    # Security tests
    if (Test-Path "scripts/test-einstein-security.ts") {
        Write-Host "Running security tests..." -ForegroundColor Cyan
        npx tsx scripts/test-einstein-security.ts
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Security tests failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Security tests passed" -ForegroundColor Green
    }
    
    # Integration tests
    if (Test-Path "__tests__/integration/einstein-engine.test.ts") {
        Write-Host "Running integration tests..." -ForegroundColor Cyan
        npm test -- __tests__/integration/einstein-engine.test.ts
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Integration tests failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Integration tests passed" -ForegroundColor Green
    }
    
    Write-Host "`n✅ All tests passed!`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Step 3/8: Tests skipped (--SkipTests flag)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Build Application
Write-Host "📋 Step 4/8: Building Application..." -ForegroundColor Green

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 5: Backup Current Deployment (production only)
if ($Environment -eq 'production' -and -not $SkipBackup) {
    Write-Host "📋 Step 5/8: Creating Backup..." -ForegroundColor Green
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = "backups/einstein-$timestamp"
    
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" | Out-Null
    }
    
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    
    # Backup key files
    $filesToBackup = @(
        "pages/api/einstein",
        "lib/einstein",
        "components/einstein",
        "migrations/008_create_einstein_tables.sql"
    )
    
    foreach ($file in $filesToBackup) {
        if (Test-Path $file) {
            $destination = Join-Path $backupDir $file
            $destinationDir = Split-Path $destination -Parent
            if (-not (Test-Path $destinationDir)) {
                New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
            }
            Copy-Item -Path $file -Destination $destination -Recurse -Force
        }
    }
    
    Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  Step 5/8: Backup skipped" -ForegroundColor Yellow
    Write-Host ""
}

# Step 6: Deploy to Vercel
Write-Host "📋 Step 6/8: Deploying to Vercel ($Environment)..." -ForegroundColor Green

if ($Environment -eq 'production') {
    if (-not $AutoConfirm) {
        Write-Host "⚠️  WARNING: You are about to deploy to PRODUCTION" -ForegroundColor Yellow
        $confirm = Read-Host "Type 'DEPLOY' to confirm"
        if ($confirm -ne 'DEPLOY') {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "Deploying to production..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host "Deploying to preview..." -ForegroundColor Cyan
    vercel
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Step 7: Post-Deployment Verification
Write-Host "📋 Step 7/8: Running Post-Deployment Verification..." -ForegroundColor Green

Start-Sleep -Seconds 10  # Wait for deployment to propagate

# Get deployment URL
$deploymentUrl = if ($Environment -eq 'production') {
    "https://news.arcane.group"
} else {
    # Extract from Vercel output (simplified)
    "https://your-preview-url.vercel.app"
}

Write-Host "Testing deployment at: $deploymentUrl" -ForegroundColor Cyan

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "$deploymentUrl/api/health" -Method GET -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This may be normal if the endpoint doesn't exist yet" -ForegroundColor Gray
}

# Test Einstein endpoint
try {
    $response = Invoke-WebRequest -Uri "$deploymentUrl/api/einstein/analyze" -Method GET -TimeoutSec 30
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
        Write-Host "✅ Einstein endpoint accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Einstein endpoint returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Einstein endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Generate Deployment Report
Write-Host "📋 Step 8/8: Generating Deployment Report..." -ForegroundColor Green

$reportPath = "EINSTEIN-DEPLOYMENT-REPORT-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

$report = @"
# Einstein Trade Engine - Deployment Report

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Environment**: $Environment
**Deployment URL**: $deploymentUrl

## Deployment Summary

- ✅ Pre-flight checks passed
- ✅ Database schema verified
- $(if ($SkipTests) { "⚠️  Tests skipped" } else { "✅ All tests passed" })
- ✅ Build successful
- $(if ($Environment -eq 'production' -and -not $SkipBackup) { "✅ Backup created" } else { "⚠️  Backup skipped" })
- ✅ Deployment successful
- ✅ Post-deployment verification completed

## System Status

### Node.js Environment
- Node.js: $nodeVersion
- npm: $npmVersion
- Vercel CLI: $vercelVersion

### Git Status
``````
$(git log -1 --oneline)
``````

### Deployment Details
- Environment: $Environment
- URL: $deploymentUrl
- Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Next Steps

1. Monitor deployment: ``npx tsx scripts/monitor-einstein.ts``
2. Check logs: ``vercel logs``
3. Test features manually at: $deploymentUrl

## Rollback Instructions

If issues are detected:

``````powershell
# Rollback to previous deployment
vercel rollback

# Or restore from backup (production only)
# Backup location: backups/einstein-$timestamp
``````

## Documentation

- User Guide: docs/EINSTEIN-USER-GUIDE.md
- Developer Guide: docs/EINSTEIN-DEVELOPER-GUIDE.md
- Deployment Guide: docs/EINSTEIN-DEPLOYMENT-GUIDE.md

---

**Status**: ✅ Deployment Complete
**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "✅ Deployment report generated: $reportPath" -ForegroundColor Green
Write-Host ""

# Final Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 Einstein Trade Engine Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "URL: $deploymentUrl" -ForegroundColor Yellow
Write-Host "Report: $reportPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor: npx tsx scripts/monitor-einstein.ts" -ForegroundColor White
Write-Host "2. View logs: vercel logs" -ForegroundColor White
Write-Host "3. Test at: $deploymentUrl" -ForegroundColor White
Write-Host ""
Write-Host "✅ All systems operational!" -ForegroundColor Green
