# Import Access Codes to Production Database
# Bitcoin Sovereign Technology - Authentication System

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Access Code Import - Production" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host "`nPlease set your production DATABASE_URL:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "postgres://user:pass@host:6543/postgres"' -ForegroundColor Yellow
    Write-Host "`nOr run with inline variable:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="your_url"; .\scripts\import-codes-production.ps1' -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green
Write-Host "   Host: $($env:DATABASE_URL -replace 'postgres://[^@]+@([^:]+).*', '$1')`n" -ForegroundColor Gray

# Confirm before proceeding
Write-Host "⚠️  WARNING: This will import access codes to PRODUCTION database!" -ForegroundColor Yellow
Write-Host "   This operation is safe and will skip codes that already exist.`n" -ForegroundColor Gray

$confirmation = Read-Host "Continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "`n❌ Import cancelled." -ForegroundColor Red
    exit 0
}

Write-Host "`n🚀 Starting import...`n" -ForegroundColor Cyan

# Run the import script
npx tsx scripts/import-access-codes.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Import completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test registration: https://news.arcane.group" -ForegroundColor Gray
    Write-Host "   2. Use access code: BITCOIN2025" -ForegroundColor Gray
    Write-Host "   3. Monitor Vercel logs for any issues`n" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Import failed! Check error messages above." -ForegroundColor Red
    exit 1
}
