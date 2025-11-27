# UCIE Async Upgrade - PowerShell Script
# Automates the complete migration process

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UCIE Async Upgrade Automation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if tsx is installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Get-Command tsx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ tsx not found. Installing..." -ForegroundColor Red
    npm install -g tsx
}

Write-Host "✅ Dependencies OK" -ForegroundColor Green
Write-Host ""

# Run the upgrade script
Write-Host "Running upgrade script..." -ForegroundColor Yellow
Write-Host ""

npx tsx scripts/upgrade-ucie-async.ts

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Upgrade Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Deploy to Vercel" -ForegroundColor Cyan
    Write-Host "  git push origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ Upgrade Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check error messages above" -ForegroundColor Yellow
    Write-Host ""
}

exit $exitCode
