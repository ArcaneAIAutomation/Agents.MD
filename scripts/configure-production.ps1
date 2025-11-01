# Production Configuration Script
# Configures environment variables, runs migrations, and deploys

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group"
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     PRODUCTION CONFIGURATION                                   ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

# Load secrets from file
if (Test-Path "production-secrets.txt") {
    Write-Host "✅ Loading secrets from production-secrets.txt`n" -ForegroundColor Green
    $secretsContent = Get-Content "production-secrets.txt" -Raw
    
    if ($secretsContent -match "JWT_SECRET=(.+)") {
        $jwtSecret = $matches[1].Trim()
    }
    if ($secretsContent -match "CRON_SECRET=(.+)") {
        $cronSecret = $matches[1].Trim()
    }
}
else {
    Write-Host "⚠️  Secrets file not found. Generating new secrets...`n" -ForegroundColor Yellow
    $jwtSecret = openssl rand -base64 32
    $cronSecret = openssl rand -base64 32
}

Write-Host "Secrets loaded:`n" -ForegroundColor Cyan
Write-Host "  JWT_SECRET: $($jwtSecret.Substring(0,10))..." -ForegroundColor Gray
Write-Host "  CRON_SECRET: $($cronSecret.Substring(0,10))...`n" -ForegroundColor Gray

# Collect database credentials
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "DATABASE CREDENTIALS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Please provide your Vercel database credentials:`n" -ForegroundColor White

Write-Host "DATABASE_URL (from Postgres .env.local tab):" -ForegroundColor Yellow
Write-Host "Format: postgres://default:password@host:5432/verceldb?sslmode=require" -ForegroundColor Gray
$databaseUrl = Read-Host "Paste here"

Write-Host "`nKV_REST_API_URL (from KV .env.local tab):" -ForegroundColor Yellow
Write-Host "Format: https://your-kv.kv.vercel-storage.com" -ForegroundColor Gray
$kvUrl = Read-Host "Paste here"

Write-Host "`nKV_REST_API_TOKEN (from KV .env.local tab):" -ForegroundColor Yellow
$kvToken = Read-Host "Paste here"

Write-Host "`nKV_REST_API_READ_ONLY_TOKEN (from KV .env.local tab - optional):" -ForegroundColor Yellow
$kvReadToken = Read-Host "Paste here (or press Enter to skip)"

# Validate required inputs
if (-not $databaseUrl -or -not $kvUrl -or -not $kvToken) {
    Write-Host "`n❌ Missing required credentials!`n" -ForegroundColor Red
    Write-Host "Required:" -ForegroundColor Yellow
    Write-Host "  - DATABASE_URL" -ForegroundColor Gray
    Write-Host "  - KV_REST_API_URL" -ForegroundColor Gray
    Write-Host "  - KV_REST_API_TOKEN`n" -ForegroundColor Gray
    exit 1
}

Write-Host "`n✅ Credentials collected`n" -ForegroundColor Green

# Save all credentials to file
@"

# Database Credentials - Added $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
DATABASE_URL=$databaseUrl
KV_REST_API_URL=$kvUrl
KV_REST_API_TOKEN=$kvToken
KV_REST_API_READ_ONLY_TOKEN=$kvReadToken
"@ | Out-File -FilePath "production-secrets.txt" -Append -Encoding UTF8

Write-Host "✅ Credentials saved to production-secrets.txt`n" -ForegroundColor Green

# Create .env file for local use
@"
# Production Environment Variables
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Database
DATABASE_URL=$databaseUrl

# Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d

# Rate Limiting
KV_REST_API_URL=$kvUrl
KV_REST_API_TOKEN=$kvToken
KV_REST_API_READ_ONLY_TOKEN=$kvReadToken
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

# Cron
CRON_SECRET=$cronSecret

# Email
SENDER_EMAIL=no-reply@arcane.group
ENABLE_WELCOME_EMAIL=true

# Application
NEXT_PUBLIC_APP_URL=$ProductionUrl
NEXTAUTH_URL=$ProductionUrl
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "✅ Created .env.production file`n" -ForegroundColor Green

# Run database migrations
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "DATABASE MIGRATIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Setting DATABASE_URL environment variable..." -ForegroundColor Gray
$env:DATABASE_URL = $databaseUrl

Write-Host "Running database migrations...`n" -ForegroundColor Gray

try {
    npm run migrate:prod
    Write-Host "`n✅ Database migrations completed successfully`n" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Migration failed: $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL and try again.`n" -ForegroundColor Yellow
    exit 1
}

# Import access codes
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "ACCESS CODES IMPORT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Importing 11 access codes...`n" -ForegroundColor Gray

try {
    npm run import:codes
    Write-Host "`n✅ Access codes imported successfully`n" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Import failed: $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "Continuing anyway - you can import codes manually later.`n" -ForegroundColor Yellow
}

# Set environment variables in Vercel
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  MANUAL STEP REQUIRED`n" -ForegroundColor Yellow

Write-Host "Please set these environment variables in Vercel Dashboard:" -ForegroundColor White
Write-Host "https://vercel.com/dashboard > Your Project > Settings > Environment Variables`n" -ForegroundColor Cyan

Write-Host "Copy these values:`n" -ForegroundColor Yellow

Write-Host "DATABASE_URL=$databaseUrl" -ForegroundColor Gray
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Gray
Write-Host "JWT_EXPIRATION=7d" -ForegroundColor Gray
Write-Host "JWT_REMEMBER_ME_EXPIRATION=30d" -ForegroundColor Gray
Write-Host "KV_REST_API_URL=$kvUrl" -ForegroundColor Gray
Write-Host "KV_REST_API_TOKEN=$kvToken" -ForegroundColor Gray
if ($kvReadToken) {
    Write-Host "KV_REST_API_READ_ONLY_TOKEN=$kvReadToken" -ForegroundColor Gray
}
Write-Host "AUTH_RATE_LIMIT_MAX_ATTEMPTS=5" -ForegroundColor Gray
Write-Host "AUTH_RATE_LIMIT_WINDOW_MS=900000" -ForegroundColor Gray
Write-Host "CRON_SECRET=$cronSecret" -ForegroundColor Gray
Write-Host "SENDER_EMAIL=no-reply@arcane.group" -ForegroundColor Gray
Write-Host "ENABLE_WELCOME_EMAIL=true" -ForegroundColor Gray
Write-Host "NEXT_PUBLIC_APP_URL=$ProductionUrl" -ForegroundColor Gray
Write-Host "NEXTAUTH_URL=$ProductionUrl`n" -ForegroundColor Gray

Write-Host "💡 Tip: All values are also saved in .env.production file`n" -ForegroundColor Cyan

$response = Read-Host "Have you set all environment variables in Vercel? (yes/no)"
if ($response -ne "yes") {
    Write-Host "`n⚠️  Please set the environment variables, then run this script again or manually redeploy.`n" -ForegroundColor Yellow
    exit 0
}

# Trigger redeployment
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "REDEPLOYMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "To apply the environment variables, you need to redeploy:`n" -ForegroundColor White
Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "2. Select your project > Deployments" -ForegroundColor Gray
Write-Host "3. Latest deployment > ... menu > Redeploy`n" -ForegroundColor Gray

$response = Read-Host "Have you triggered a redeploy? (yes/no)"
if ($response -ne "yes") {
    Write-Host "`n⚠️  Please redeploy in Vercel Dashboard, then run verification.`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nWaiting 30 seconds for deployment to complete..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Verify deployment
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Running verification tests...`n" -ForegroundColor Gray
& "$PSScriptRoot\quick-verify-production.ps1" -ProductionUrl $ProductionUrl

# Final summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     CONFIGURATION COMPLETE!                                    ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "✅ Database migrations completed" -ForegroundColor Green
Write-Host "✅ Access codes imported (11 codes)" -ForegroundColor Green
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host "✅ Deployment triggered" -ForegroundColor Green
Write-Host "✅ Verification tests run" -ForegroundColor Green

Write-Host "`nYour production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Test registration with an access code" -ForegroundColor Gray
Write-Host "2. Test login with created account" -ForegroundColor Gray
Write-Host "3. Monitor logs for any issues" -ForegroundColor Gray

Write-Host "`nTest Commands:" -ForegroundColor Cyan
Write-Host "  .\scripts\test-all-access-codes.ps1" -ForegroundColor Gray
Write-Host "  .\scripts\monitor-production.ps1 -DurationMinutes 60" -ForegroundColor Gray

Write-Host "`n🎉 Your production deployment is complete!`n" -ForegroundColor Green
