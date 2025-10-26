# Automated Production Setup Wizard
# Guides you through the setup process with automation where possible

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group"
)

$ErrorActionPreference = "Stop"

# Colors
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"
$ColorPrompt = "Magenta"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorPrompt
Write-Host "║                                                                ║" -ForegroundColor $ColorPrompt
Write-Host "║     AUTOMATED PRODUCTION SETUP WIZARD                          ║" -ForegroundColor $ColorPrompt
Write-Host "║     Secure User Authentication System v1.0.0                   ║" -ForegroundColor $ColorPrompt
Write-Host "║                                                                ║" -ForegroundColor $ColorPrompt
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor $ColorPrompt

Write-Host "This wizard will guide you through the production setup process." -ForegroundColor $ColorInfo
Write-Host "Some steps require manual action in Vercel Dashboard." -ForegroundColor $ColorInfo
Write-Host "I'll automate everything else for you!`n" -ForegroundColor $ColorInfo

# Function to prompt user
function Prompt-User {
    param(
        [string]$Message,
        [string]$Default = ""
    )
    
    if ($Default) {
        $prompt = "$Message [$Default]: "
    }
    else {
        $prompt = "$Message: "
    }
    
    Write-Host $prompt -NoNewline -ForegroundColor $ColorPrompt
    $response = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($response) -and $Default) {
        return $Default
    }
    
    return $response
}

# Function to prompt yes/no
function Prompt-YesNo {
    param(
        [string]$Message,
        [bool]$Default = $true
    )
    
    $defaultText = if ($Default) { "Y/n" } else { "y/N" }
    Write-Host "$Message [$defaultText]: " -NoNewline -ForegroundColor $ColorPrompt
    $response = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($response)) {
        return $Default
    }
    
    return $response -match "^[Yy]"
}

# Function to wait for user
function Wait-ForUser {
    param([string]$Message = "Press Enter to continue...")
    
    Write-Host "`n$Message" -ForegroundColor $ColorWarning
    Read-Host | Out-Null
}

# ============================================================================
# STEP 1: WELCOME & PREREQUISITES
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 1: Prerequisites Check" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Checking prerequisites...`n" -ForegroundColor Gray

# Check if openssl is available
try {
    $opensslVersion = openssl version 2>$null
    Write-Host "✅ OpenSSL found: $opensslVersion" -ForegroundColor $ColorSuccess
}
catch {
    Write-Host "❌ OpenSSL not found" -ForegroundColor $ColorError
    Write-Host "   OpenSSL is required to generate secrets." -ForegroundColor $ColorError
    Write-Host "   Install from: https://slproweb.com/products/Win32OpenSSL.html`n" -ForegroundColor $ColorWarning
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✅ npm found: v$npmVersion" -ForegroundColor $ColorSuccess
}
catch {
    Write-Host "❌ npm not found" -ForegroundColor $ColorError
    Write-Host "   npm is required to run migrations." -ForegroundColor $ColorError
    exit 1
}

# Check if node is available
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor $ColorSuccess
}
catch {
    Write-Host "❌ Node.js not found" -ForegroundColor $ColorError
    exit 1
}

Write-Host "`n✅ All prerequisites met!`n" -ForegroundColor $ColorSuccess

# ============================================================================
# STEP 2: GENERATE SECRETS
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 2: Generate Secrets" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Generating secure random secrets...`n" -ForegroundColor Gray

$jwtSecret = openssl rand -base64 32
$cronSecret = openssl rand -base64 32

Write-Host "✅ JWT_SECRET generated" -ForegroundColor $ColorSuccess
Write-Host "✅ CRON_SECRET generated`n" -ForegroundColor $ColorSuccess

Write-Host "Generated Secrets (save these securely):" -ForegroundColor $ColorWarning
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorWarning
Write-Host "JWT_SECRET: " -NoNewline -ForegroundColor $ColorInfo
Write-Host $jwtSecret -ForegroundColor $ColorSuccess
Write-Host "CRON_SECRET: " -NoNewline -ForegroundColor $ColorInfo
Write-Host $cronSecret -ForegroundColor $ColorSuccess
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorWarning

# Save to file
$secretsFile = "production-secrets.txt"
@"
Production Secrets - Generated $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JWT_SECRET=$jwtSecret
CRON_SECRET=$cronSecret

⚠️  IMPORTANT: Keep these secrets secure!
⚠️  Add them to Vercel environment variables
⚠️  Delete this file after setup is complete

"@ | Out-File -FilePath $secretsFile -Encoding UTF8

Write-Host "✅ Secrets saved to: $secretsFile" -ForegroundColor $ColorSuccess
Write-Host "   (Delete this file after setup)`n" -ForegroundColor $ColorWarning

Wait-ForUser

# ============================================================================
# STEP 3: VERCEL DASHBOARD - DATABASES
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 3: Create Vercel Databases (Manual)" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "⚠️  This step requires manual action in Vercel Dashboard`n" -ForegroundColor $ColorWarning

Write-Host "Instructions:" -ForegroundColor $ColorInfo
Write-Host "1. Open: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "2. Select your project" -ForegroundColor Gray
Write-Host "3. Click 'Storage' tab" -ForegroundColor Gray
Write-Host "4. Create Postgres database:" -ForegroundColor Gray
Write-Host "   - Click 'Create Database' > Select 'Postgres'" -ForegroundColor Gray
Write-Host "   - Name: agents-md-auth-production" -ForegroundColor Gray
Write-Host "   - Region: iad1 (US East) or closest to you" -ForegroundColor Gray
Write-Host "   - Click 'Create' and wait 2-3 minutes" -ForegroundColor Gray
Write-Host "5. Create KV store:" -ForegroundColor Gray
Write-Host "   - Click 'Create Database' > Select 'KV'" -ForegroundColor Gray
Write-Host "   - Name: agents-md-rate-limit-production" -ForegroundColor Gray
Write-Host "   - Region: Same as Postgres" -ForegroundColor Gray
Write-Host "   - Click 'Create' and wait 1-2 minutes`n" -ForegroundColor Gray

$openBrowser = Prompt-YesNo -Message "Open Vercel Dashboard in browser?" -Default $true
if ($openBrowser) {
    Start-Process "https://vercel.com/dashboard"
}

Wait-ForUser -Message "Press Enter after you've created both databases..."

# ============================================================================
# STEP 4: COLLECT DATABASE CREDENTIALS
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 4: Collect Database Credentials" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Now I need the database connection strings.`n" -ForegroundColor $ColorInfo

Write-Host "For Postgres:" -ForegroundColor $ColorInfo
Write-Host "1. Click on your Postgres database" -ForegroundColor Gray
Write-Host "2. Go to '.env.local' tab" -ForegroundColor Gray
Write-Host "3. Copy the DATABASE_URL value`n" -ForegroundColor Gray

$databaseUrl = Prompt-User -Message "Paste DATABASE_URL"

Write-Host "`nFor KV Store:" -ForegroundColor $ColorInfo
Write-Host "1. Click on your KV database" -ForegroundColor Gray
Write-Host "2. Go to '.env.local' tab" -ForegroundColor Gray
Write-Host "3. Copy the three KV values`n" -ForegroundColor Gray

$kvUrl = Prompt-User -Message "Paste KV_REST_API_URL"
$kvToken = Prompt-User -Message "Paste KV_REST_API_TOKEN"
$kvReadToken = Prompt-User -Message "Paste KV_REST_API_READ_ONLY_TOKEN"

# Validate DATABASE_URL format
if ($databaseUrl -notlike "postgres://*") {
    Write-Host "`n❌ DATABASE_URL should start with 'postgres://'" -ForegroundColor $ColorError
    Write-Host "   Please check and try again.`n" -ForegroundColor $ColorError
    exit 1
}

if ($databaseUrl -notlike "*sslmode=require*") {
    Write-Host "`n⚠️  DATABASE_URL should include '?sslmode=require'" -ForegroundColor $ColorWarning
    $addSsl = Prompt-YesNo -Message "Add it automatically?" -Default $true
    if ($addSsl) {
        if ($databaseUrl -like "*?*") {
            $databaseUrl += "&sslmode=require"
        }
        else {
            $databaseUrl += "?sslmode=require"
        }
    }
}

Write-Host "`n✅ Database credentials collected`n" -ForegroundColor $ColorSuccess

# ============================================================================
# STEP 5: COLLECT OFFICE 365 CREDENTIALS
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 5: Office 365 Email Configuration" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "For welcome emails, I need your Office 365 credentials.`n" -ForegroundColor $ColorInfo

$senderEmail = Prompt-User -Message "SENDER_EMAIL" -Default "no-reply@arcane.group"
$azureTenantId = Prompt-User -Message "AZURE_TENANT_ID"
$azureClientId = Prompt-User -Message "AZURE_CLIENT_ID"
$azureClientSecret = Prompt-User -Message "AZURE_CLIENT_SECRET"

Write-Host "`n✅ Email credentials collected`n" -ForegroundColor $ColorSuccess

# ============================================================================
# STEP 6: GENERATE ENVIRONMENT VARIABLES FILE
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 6: Generate Environment Variables" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

$envVarsFile = "production-env-vars.txt"

$envVarsContent = @"
Production Environment Variables - Generated $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy these to Vercel Dashboard > Settings > Environment Variables
Select "Production" environment for each variable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL=$databaseUrl

AUTHENTICATION CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET=$jwtSecret
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d

RATE LIMITING CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KV_REST_API_URL=$kvUrl
KV_REST_API_TOKEN=$kvToken
KV_REST_API_READ_ONLY_TOKEN=$kvReadToken
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

CRON SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRON_SECRET=$cronSecret

EMAIL CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENDER_EMAIL=$senderEmail
AZURE_TENANT_ID=$azureTenantId
AZURE_CLIENT_ID=$azureClientId
AZURE_CLIENT_SECRET=$azureClientSecret
ENABLE_WELCOME_EMAIL=true

APPLICATION CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_APP_URL=$ProductionUrl
NEXTAUTH_URL=$ProductionUrl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 17 variables
⚠️  Delete this file after adding to Vercel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@

$envVarsContent | Out-File -FilePath $envVarsFile -Encoding UTF8

Write-Host "✅ Environment variables file created: $envVarsFile`n" -ForegroundColor $ColorSuccess

Write-Host "Opening file for you to copy...`n" -ForegroundColor $ColorInfo
Start-Process notepad.exe -ArgumentList $envVarsFile

Wait-ForUser -Message "Press Enter after you've added all variables to Vercel..."

# ============================================================================
# STEP 7: RUN DATABASE MIGRATIONS
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 7: Run Database Migrations" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Setting DATABASE_URL environment variable...`n" -ForegroundColor Gray
$env:DATABASE_URL = $databaseUrl

Write-Host "Running database migrations...`n" -ForegroundColor Gray

try {
    npm run migrate:prod
    Write-Host "`n✅ Database migrations completed successfully`n" -ForegroundColor $ColorSuccess
}
catch {
    Write-Host "`n❌ Migration failed: $($_.Exception.Message)`n" -ForegroundColor $ColorError
    Write-Host "Please check the error and try running manually:" -ForegroundColor $ColorWarning
    Write-Host "npm run migrate:prod`n" -ForegroundColor $ColorWarning
    exit 1
}

Wait-ForUser

# ============================================================================
# STEP 8: IMPORT ACCESS CODES
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 8: Import Access Codes" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Importing 11 access codes...`n" -ForegroundColor Gray

try {
    npm run import:codes
    Write-Host "`n✅ Access codes imported successfully`n" -ForegroundColor $ColorSuccess
}
catch {
    Write-Host "`n❌ Import failed: $($_.Exception.Message)`n" -ForegroundColor $ColorError
    Write-Host "Please check the error and try running manually:" -ForegroundColor $ColorWarning
    Write-Host "npm run import:codes`n" -ForegroundColor $ColorWarning
    exit 1
}

Wait-ForUser

# ============================================================================
# STEP 9: REDEPLOY APPLICATION
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 9: Redeploy Application (Manual)" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "⚠️  This step requires manual action in Vercel Dashboard`n" -ForegroundColor $ColorWarning

Write-Host "Instructions:" -ForegroundColor $ColorInfo
Write-Host "1. Go to Vercel Dashboard > Your Project" -ForegroundColor Gray
Write-Host "2. Click 'Deployments' tab" -ForegroundColor Gray
Write-Host "3. Find the latest deployment" -ForegroundColor Gray
Write-Host "4. Click the '...' menu (three dots)" -ForegroundColor Gray
Write-Host "5. Click 'Redeploy'" -ForegroundColor Gray
Write-Host "6. Confirm 'Redeploy'" -ForegroundColor Gray
Write-Host "7. Wait for 'Ready' status (2-5 minutes)`n" -ForegroundColor Gray

$openDeployments = Prompt-YesNo -Message "Open Deployments page in browser?" -Default $true
if ($openDeployments) {
    Start-Process "https://vercel.com/dashboard"
}

Wait-ForUser -Message "Press Enter after deployment is complete and shows 'Ready'..."

# ============================================================================
# STEP 10: VERIFY DEPLOYMENT
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "STEP 10: Verify Deployment" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Running verification tests...`n" -ForegroundColor Gray

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$verifyScript = Join-Path $scriptDir "quick-verify-production.ps1"

& $verifyScript -ProductionUrl $ProductionUrl

$verifyResult = $LASTEXITCODE

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorPrompt
Write-Host "║     SETUP COMPLETE!                                            ║" -ForegroundColor $ColorPrompt
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor $ColorPrompt

if ($verifyResult -eq 0) {
    Write-Host "🎉 SUCCESS! Your production deployment is complete and verified!`n" -ForegroundColor $ColorSuccess
}
else {
    Write-Host "⚠️  Setup complete but some verification tests failed.`n" -ForegroundColor $ColorWarning
    Write-Host "Review the test results above and check Vercel logs.`n" -ForegroundColor $ColorWarning
}

Write-Host "Generated Files:" -ForegroundColor $ColorInfo
Write-Host "- $secretsFile (contains secrets)" -ForegroundColor Gray
Write-Host "- $envVarsFile (contains all env vars)`n" -ForegroundColor Gray

Write-Host "⚠️  IMPORTANT: Delete these files after setup!" -ForegroundColor $ColorWarning
Write-Host "   They contain sensitive credentials.`n" -ForegroundColor $ColorWarning

$deleteFiles = Prompt-YesNo -Message "Delete credential files now?" -Default $true
if ($deleteFiles) {
    Remove-Item $secretsFile -ErrorAction SilentlyContinue
    Remove-Item $envVarsFile -ErrorAction SilentlyContinue
    Write-Host "✅ Credential files deleted`n" -ForegroundColor $ColorSuccess
}

Write-Host "Next Steps:" -ForegroundColor $ColorInfo
Write-Host "1. Test registration at: $ProductionUrl" -ForegroundColor Gray
Write-Host "2. Test all 11 access codes" -ForegroundColor Gray
Write-Host "3. Monitor production for 24 hours" -ForegroundColor Gray
Write-Host "4. Check Vercel logs for any errors`n" -ForegroundColor Gray

Write-Host "Useful Commands:" -ForegroundColor $ColorInfo
Write-Host ".\scripts\test-all-access-codes.ps1" -ForegroundColor Gray
Write-Host ".\scripts\monitor-production.ps1 -DurationMinutes 60`n" -ForegroundColor Gray

Write-Host "🎉 Congratulations! Your authentication system is live!`n" -ForegroundColor $ColorSuccess

exit 0
