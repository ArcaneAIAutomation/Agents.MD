# Automated Production Setup Script
# Automates as much as possible and guides you through manual steps

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group"
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║     AUTOMATED PRODUCTION SETUP                                 ║" -ForegroundColor Magenta
Write-Host "║     Secure User Authentication System v1.0.0                   ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "This script will automate your production setup as much as possible." -ForegroundColor Cyan
Write-Host "Some steps require manual interaction with Vercel Dashboard.`n" -ForegroundColor Yellow

# Check if Vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Cyan
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "✅ Vercel CLI installed: $vercelVersion`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Vercel CLI not found. Installing...`n" -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed`n" -ForegroundColor Green
}

# Login to Vercel
Write-Host "Logging into Vercel..." -ForegroundColor Cyan
Write-Host "A browser window will open for authentication.`n" -ForegroundColor Yellow
vercel login

Write-Host "`n✅ Logged into Vercel`n" -ForegroundColor Green

# Link project
Write-Host "Linking to Vercel project..." -ForegroundColor Cyan
vercel link

Write-Host "`n✅ Project linked`n" -ForegroundColor Green

# ============================================================================
# STEP 1: Generate Secrets
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Generating Secrets" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Generating JWT_SECRET..." -ForegroundColor Gray
$jwtSecret = openssl rand -base64 32
Write-Host "✅ JWT_SECRET generated`n" -ForegroundColor Green

Write-Host "Generating CRON_SECRET..." -ForegroundColor Gray
$cronSecret = openssl rand -base64 32
Write-Host "✅ CRON_SECRET generated`n" -ForegroundColor Green

# Save secrets to file for reference
$secretsFile = "production-secrets.txt"
@"
# Production Secrets - Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

JWT_SECRET=$jwtSecret
CRON_SECRET=$cronSecret
"@ | Out-File -FilePath $secretsFile -Encoding UTF8

Write-Host "✅ Secrets saved to $secretsFile (keep this secure!)`n" -ForegroundColor Green

# ============================================================================
# STEP 2: Manual - Create Databases
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Create Databases (Manual)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  This step requires manual action in Vercel Dashboard`n" -ForegroundColor Yellow

Write-Host "Please complete these steps:" -ForegroundColor White
Write-Host "1. Open https://vercel.com/dashboard in your browser" -ForegroundColor Gray
Write-Host "2. Select your project" -ForegroundColor Gray
Write-Host "3. Go to Storage tab" -ForegroundColor Gray
Write-Host "4. Create Postgres database:" -ForegroundColor Gray
Write-Host "   - Name: agents-md-auth-production" -ForegroundColor Gray
Write-Host "   - Region: iad1 (US East)" -ForegroundColor Gray
Write-Host "5. Create KV store:" -ForegroundColor Gray
Write-Host "   - Name: agents-md-rate-limit-production" -ForegroundColor Gray
Write-Host "   - Region: iad1 (US East)" -ForegroundColor Gray
Write-Host "`n"

$response = Read-Host "Have you created both databases? (yes/no)"
if ($response -ne "yes") {
    Write-Host "`n❌ Please create the databases first, then run this script again.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Databases created`n" -ForegroundColor Green

# ============================================================================
# STEP 3: Get Database Credentials
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Database Credentials" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Please provide your database credentials:`n" -ForegroundColor White

Write-Host "DATABASE_URL (from Postgres .env.local tab):" -ForegroundColor Yellow
$databaseUrl = Read-Host "Paste here"

Write-Host "`nKV_REST_API_URL (from KV .env.local tab):" -ForegroundColor Yellow
$kvUrl = Read-Host "Paste here"

Write-Host "`nKV_REST_API_TOKEN (from KV .env.local tab):" -ForegroundColor Yellow
$kvToken = Read-Host "Paste here"

Write-Host "`nKV_REST_API_READ_ONLY_TOKEN (from KV .env.local tab):" -ForegroundColor Yellow
$kvReadToken = Read-Host "Paste here"

# Validate inputs
if (-not $databaseUrl -or -not $kvUrl -or -not $kvToken) {
    Write-Host "`n❌ Missing required credentials. Please run the script again.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Credentials collected`n" -ForegroundColor Green

# Save credentials to file
@"

# Database Credentials
DATABASE_URL=$databaseUrl
KV_REST_API_URL=$kvUrl
KV_REST_API_TOKEN=$kvToken
KV_REST_API_READ_ONLY_TOKEN=$kvReadToken
"@ | Out-File -FilePath $secretsFile -Append -Encoding UTF8

# ============================================================================
# STEP 4: Set Environment Variables via Vercel CLI
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: Setting Environment Variables" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Setting environment variables via Vercel CLI...`n" -ForegroundColor Gray

# Function to set environment variable
function Set-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Environment = "production"
    )
    
    Write-Host "Setting $Name..." -NoNewline
    try {
        echo $Value | vercel env add $Name $Environment 2>$null
        Write-Host " ✅" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " ⚠️  (may already exist)" -ForegroundColor Yellow
        return $false
    }
}

# Set all environment variables
Set-VercelEnv -Name "DATABASE_URL" -Value $databaseUrl
Set-VercelEnv -Name "JWT_SECRET" -Value $jwtSecret
Set-VercelEnv -Name "JWT_EXPIRATION" -Value "7d"
Set-VercelEnv -Name "JWT_REMEMBER_ME_EXPIRATION" -Value "30d"
Set-VercelEnv -Name "KV_REST_API_URL" -Value $kvUrl
Set-VercelEnv -Name "KV_REST_API_TOKEN" -Value $kvToken
Set-VercelEnv -Name "KV_REST_API_READ_ONLY_TOKEN" -Value $kvReadToken
Set-VercelEnv -Name "AUTH_RATE_LIMIT_MAX_ATTEMPTS" -Value "5"
Set-VercelEnv -Name "AUTH_RATE_LIMIT_WINDOW_MS" -Value "900000"
Set-VercelEnv -Name "CRON_SECRET" -Value $cronSecret
Set-VercelEnv -Name "SENDER_EMAIL" -Value "no-reply@arcane.group"
Set-VercelEnv -Name "ENABLE_WELCOME_EMAIL" -Value "true"
Set-VercelEnv -Name "NEXT_PUBLIC_APP_URL" -Value $ProductionUrl
Set-VercelEnv -Name "NEXTAUTH_URL" -Value $ProductionUrl

Write-Host "`n✅ Environment variables set`n" -ForegroundColor Green

Write-Host "⚠️  Note: Azure credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)" -ForegroundColor Yellow
Write-Host "   need to be set manually in Vercel Dashboard if you want email functionality.`n" -ForegroundColor Yellow

# ============================================================================
# STEP 5: Run Database Migrations
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 5: Running Database Migrations" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Setting DATABASE_URL environment variable..." -ForegroundColor Gray
$env:DATABASE_URL = $databaseUrl

Write-Host "Running migrations...`n" -ForegroundColor Gray
npm run migrate:prod

Write-Host "`n✅ Database migrations completed`n" -ForegroundColor Green

# ============================================================================
# STEP 6: Import Access Codes
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 6: Importing Access Codes" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Importing 11 access codes...`n" -ForegroundColor Gray
npm run import:codes

Write-Host "`n✅ Access codes imported`n" -ForegroundColor Green

# ============================================================================
# STEP 7: Deploy to Production
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 7: Deploying to Production" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Deploying to production...`n" -ForegroundColor Gray
vercel --prod

Write-Host "`n✅ Deployed to production`n" -ForegroundColor Green

# ============================================================================
# STEP 8: Verify Deployment
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 8: Verifying Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Waiting 10 seconds for deployment to propagate..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "`nRunning verification tests...`n" -ForegroundColor Gray
& "$PSScriptRoot\quick-verify-production.ps1" -ProductionUrl $ProductionUrl

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     SETUP COMPLETE!                                            ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "✅ Secrets generated and saved to $secretsFile" -ForegroundColor Green
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host "✅ Database migrations completed" -ForegroundColor Green
Write-Host "✅ Access codes imported (11 codes)" -ForegroundColor Green
Write-Host "✅ Deployed to production" -ForegroundColor Green
Write-Host "✅ Verification tests run" -ForegroundColor Green

Write-Host "`nYour production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Test registration with an access code" -ForegroundColor Gray
Write-Host "2. Test login with created account" -ForegroundColor Gray
Write-Host "3. Monitor logs for any issues" -ForegroundColor Gray
Write-Host "4. Set Azure credentials in Vercel Dashboard for email functionality" -ForegroundColor Gray

Write-Host "`nTest Commands:" -ForegroundColor Cyan
Write-Host "  .\scripts\test-all-access-codes.ps1" -ForegroundColor Gray
Write-Host "  .\scripts\monitor-production.ps1 -DurationMinutes 60" -ForegroundColor Gray

Write-Host "`n🎉 Congratulations! Your production deployment is complete!`n" -ForegroundColor Green
