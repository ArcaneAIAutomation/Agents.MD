# UCIE Database Migration Script (PowerShell)
# Runs the TypeScript migration script with proper error handling

Write-Host "`n============================================================" -ForegroundColor Blue
Write-Host "  UCIE Database Migration" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Blue

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    Write-Host "ℹ️  Please create .env.local with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Check if DATABASE_URL is set
$envContent = Get-Content ".env.local" -Raw
if ($envContent -notmatch "DATABASE_URL=") {
    Write-Host "❌ Error: DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host "ℹ️  Please add DATABASE_URL to your .env.local file" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env.local with DATABASE_URL" -ForegroundColor Green
Write-Host "ℹ️  Running migration script...`n" -ForegroundColor Cyan

# Run the TypeScript migration script
try {
    npx tsx scripts/run-ucie-migration.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "`n❌ Error running migration script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
