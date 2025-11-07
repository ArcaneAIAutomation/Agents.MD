# ============================================================================
# Upstash Redis Setup Automation Script
# Bitcoin Sovereign Technology - Distributed Rate Limiting
# ============================================================================

param(
    [string]$UpstashUrl = "",
    [string]$UpstashToken = "",
    [switch]$SkipVercel,
    [switch]$Help
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-Step {
    param([string]$Message)
    Write-Host "`n✓ $Message" -ForegroundColor $Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Show-Help {
    Write-Host @"

Upstash Redis Setup Automation Script
======================================

This script automates the setup of Upstash Redis for distributed rate limiting.

Usage:
    .\scripts\setup-upstash-redis.ps1 -UpstashUrl <url> -UpstashToken <token>

Parameters:
    -UpstashUrl     Upstash Redis REST API URL (starts with https://)
    -UpstashToken   Upstash Redis REST API Token
    -SkipVercel     Skip Vercel environment variable setup
    -Help           Show this help message

Example:
    .\scripts\setup-upstash-redis.ps1 `
        -UpstashUrl "https://agents-md-12345.upstash.io" `
        -UpstashToken "AXlzASQgNjg4YjE4ZmEtMjk5Ny00ZjE5LWI5YzYtMzQ5ZjE4ZmEyOTk3"

Steps:
    1. Create Upstash account: https://console.upstash.com/
    2. Create Redis database (Regional, US East)
    3. Copy REST API credentials
    4. Run this script with credentials
    5. Script will update .env.local and Vercel

"@
}

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# ============================================================================
# STEP 1: Validate Input
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║  Upstash Redis Setup - Automated Configuration                ║" -ForegroundColor $Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan

if (-not $UpstashUrl -or -not $UpstashToken) {
    Write-Error "Missing required parameters!"
    Write-Host ""
    Write-Info "You need to provide Upstash credentials."
    Write-Host ""
    Write-Host "Step 1: Create Upstash Database" -ForegroundColor $Yellow
    Write-Host "  1. Go to: https://console.upstash.com/" -ForegroundColor $Yellow
    Write-Host "  2. Click 'Create Database'" -ForegroundColor $Yellow
    Write-Host "  3. Name: agents-md-rate-limit" -ForegroundColor $Yellow
    Write-Host "  4. Type: Regional" -ForegroundColor $Yellow
    Write-Host "  5. Region: US East (N. Virginia)" -ForegroundColor $Yellow
    Write-Host "  6. Click 'Create'" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Step 2: Copy Credentials" -ForegroundColor $Yellow
    Write-Host "  1. Click on your database" -ForegroundColor $Yellow
    Write-Host "  2. Go to 'REST API' tab" -ForegroundColor $Yellow
    Write-Host "  3. Copy UPSTASH_REDIS_REST_URL" -ForegroundColor $Yellow
    Write-Host "  4. Copy UPSTASH_REDIS_REST_TOKEN" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Step 3: Run This Script" -ForegroundColor $Yellow
    Write-Host "  .\scripts\setup-upstash-redis.ps1 \" -ForegroundColor $Yellow
    Write-Host "    -UpstashUrl 'https://your-redis.upstash.io' \" -ForegroundColor $Yellow
    Write-Host "    -UpstashToken 'your-token-here'" -ForegroundColor $Yellow
    Write-Host ""
    exit 1
}

# Validate URL format
if (-not $UpstashUrl.StartsWith("https://")) {
    Write-Error "Upstash URL must start with https://"
    Write-Info "Example: https://agents-md-12345.upstash.io"
    exit 1
}

Write-Step "Credentials validated"
Write-Info "URL: $($UpstashUrl.Substring(0, [Math]::Min(40, $UpstashUrl.Length)))..."
Write-Info "Token: $($UpstashToken.Substring(0, [Math]::Min(20, $UpstashToken.Length)))..."

# ============================================================================
# STEP 2: Test Upstash Connection
# ============================================================================

Write-Host "`n[Step 2/5] Testing Upstash Connection..." -ForegroundColor $Cyan

try {
    $testUrl = "$UpstashUrl/set/test/hello"
    $headers = @{
        "Authorization" = "Bearer $UpstashToken"
    }
    
    $response = Invoke-RestMethod -Uri $testUrl -Method Post -Headers $headers -ErrorAction Stop
    
    if ($response.result -eq "OK") {
        Write-Step "Upstash connection successful!"
    } else {
        Write-Warning "Unexpected response from Upstash"
        Write-Info "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Write-Error "Failed to connect to Upstash"
    Write-Info "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Warning "Please verify:"
    Write-Host "  1. URL is correct and starts with https://" -ForegroundColor $Yellow
    Write-Host "  2. Token is correct (no extra spaces)" -ForegroundColor $Yellow
    Write-Host "  3. Database is active in Upstash dashboard" -ForegroundColor $Yellow
    Write-Host "  4. You have internet connection" -ForegroundColor $Yellow
    exit 1
}

# ============================================================================
# STEP 3: Update .env.local
# ============================================================================

Write-Host "`n[Step 3/5] Updating .env.local..." -ForegroundColor $Cyan

$envPath = ".env.local"

if (-not (Test-Path $envPath)) {
    Write-Error ".env.local not found!"
    Write-Info "Creating .env.local from .env.example..."
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $envPath
        Write-Step ".env.local created"
    } else {
        Write-Error ".env.example not found either!"
        exit 1
    }
}

# Read current .env.local
$envContent = Get-Content $envPath -Raw

# Check if Upstash variables already exist
if ($envContent -match "UPSTASH_REDIS_REST_URL=") {
    Write-Info "Upstash variables already exist, updating..."
    
    # Update existing values
    $envContent = $envContent -replace "UPSTASH_REDIS_REST_URL=.*", "UPSTASH_REDIS_REST_URL=$UpstashUrl"
    $envContent = $envContent -replace "UPSTASH_REDIS_REST_TOKEN=.*", "UPSTASH_REDIS_REST_TOKEN=$UpstashToken"
    $envContent = $envContent -replace "KV_REST_API_URL=.*", "KV_REST_API_URL=$UpstashUrl"
    $envContent = $envContent -replace "KV_REST_API_TOKEN=.*", "KV_REST_API_TOKEN=$UpstashToken"
} else {
    Write-Info "Adding Upstash variables..."
    
    # Find the rate limiting section
    $upstashSection = @"

# =============================================================================
# 🛡️ RATE LIMITING CONFIGURATION (Upstash Redis)
# =============================================================================
# Upstash Redis for distributed rate limiting
# Prevents brute force attacks and API abuse across multiple server instances
# 
# STATUS: ✅ CONFIGURED with Upstash Redis
# 
# Connection: $UpstashUrl

# Upstash Redis REST API URL (REQUIRED)
# Format: https://your-redis-name.upstash.io
UPSTASH_REDIS_REST_URL=$UpstashUrl

# Upstash Redis REST API Token (REQUIRED)
# Authentication token for Upstash Redis
UPSTASH_REDIS_REST_TOKEN=$UpstashToken

# Alternative variable names (for compatibility)
KV_REST_API_URL=$UpstashUrl
KV_REST_API_TOKEN=$UpstashToken

# Rate Limiting Configuration
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
"@
    
    # Add to end of file
    $envContent += "`n$upstashSection"
}

# Write back to file
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Step ".env.local updated successfully"

# ============================================================================
# STEP 4: Update Vercel Environment Variables
# ============================================================================

if (-not $SkipVercel) {
    Write-Host "`n[Step 4/5] Updating Vercel Environment Variables..." -ForegroundColor $Cyan
    
    # Check if Vercel CLI is installed
    try {
        $vercelVersion = vercel --version 2>$null
        Write-Info "Vercel CLI version: $vercelVersion"
    } catch {
        Write-Warning "Vercel CLI not found"
        Write-Info "Install with: npm install -g vercel"
        Write-Host ""
        Write-Warning "Skipping Vercel update. You'll need to add these manually:"
        Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor $Yellow
        Write-Host "  2. Select your project" -ForegroundColor $Yellow
        Write-Host "  3. Settings → Environment Variables" -ForegroundColor $Yellow
        Write-Host "  4. Add these 4 variables (all environments):" -ForegroundColor $Yellow
        Write-Host "     - UPSTASH_REDIS_REST_URL = $UpstashUrl" -ForegroundColor $Yellow
        Write-Host "     - UPSTASH_REDIS_REST_TOKEN = $UpstashToken" -ForegroundColor $Yellow
        Write-Host "     - KV_REST_API_URL = $UpstashUrl" -ForegroundColor $Yellow
        Write-Host "     - KV_REST_API_TOKEN = $UpstashToken" -ForegroundColor $Yellow
        $SkipVercel = $true
    }
    
    if (-not $SkipVercel) {
        Write-Info "Adding environment variables to Vercel..."
        
        # Add variables (will prompt for confirmation)
        $variables = @(
            @{Name="UPSTASH_REDIS_REST_URL"; Value=$UpstashUrl},
            @{Name="UPSTASH_REDIS_REST_TOKEN"; Value=$UpstashToken},
            @{Name="KV_REST_API_URL"; Value=$UpstashUrl},
            @{Name="KV_REST_API_TOKEN"; Value=$UpstashToken}
        )
        
        foreach ($var in $variables) {
            Write-Info "Adding $($var.Name)..."
            
            # Check if variable exists
            $existing = vercel env ls 2>$null | Select-String $var.Name
            
            if ($existing) {
                Write-Info "$($var.Name) already exists, removing old value..."
                vercel env rm $var.Name production --yes 2>$null
                vercel env rm $var.Name preview --yes 2>$null
                vercel env rm $var.Name development --yes 2>$null
            }
            
            # Add new value to all environments
            Write-Host $var.Value | vercel env add $var.Name production 2>$null
            Write-Host $var.Value | vercel env add $var.Name preview 2>$null
            Write-Host $var.Value | vercel env add $var.Name development 2>$null
        }
        
        Write-Step "Vercel environment variables updated"
    }
} else {
    Write-Warning "Skipping Vercel update (use -SkipVercel to skip)"
}

# ============================================================================
# STEP 5: Deploy to Production
# ============================================================================

Write-Host "`n[Step 5/5] Deploying to Production..." -ForegroundColor $Cyan

Write-Info "Committing changes..."
git add .env.local 2>$null
git commit -m "🔧 Configure Upstash Redis for distributed rate limiting" 2>$null

Write-Info "Pushing to main branch..."
git push origin main 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Step "Changes pushed to main branch"
    Write-Info "Vercel will automatically deploy in ~2 minutes"
} else {
    Write-Warning "Git push failed or no changes to commit"
    Write-Info "You may need to manually deploy with: vercel --prod"
}

# ============================================================================
# STEP 6: Verification Instructions
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║  Setup Complete! ✓                                            ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Green

Write-Host "`nNext Steps:" -ForegroundColor $Cyan
Write-Host "  1. Wait for Vercel deployment to complete (~2 minutes)" -ForegroundColor $Yellow
Write-Host "  2. Check Vercel logs for: '✅ Vercel KV initialized with Upstash Redis'" -ForegroundColor $Yellow
Write-Host "  3. Test rate limiting (see below)" -ForegroundColor $Yellow

Write-Host "`nVerification Commands:" -ForegroundColor $Cyan
Write-Host "  # Check Vercel logs" -ForegroundColor $Yellow
Write-Host "  vercel logs --follow" -ForegroundColor $Yellow
Write-Host ""
Write-Host "  # Test rate limiting (try 6 times, 6th should fail)" -ForegroundColor $Yellow
Write-Host "  for (`$i=1; `$i -le 6; `$i++) {" -ForegroundColor $Yellow
Write-Host "    curl -X POST https://news.arcane.group/api/auth/login \" -ForegroundColor $Yellow
Write-Host "      -H 'Content-Type: application/json' \" -ForegroundColor $Yellow
Write-Host "      -d '{`"email`":`"test@example.com`",`"password`":`"wrong`"}'" -ForegroundColor $Yellow
Write-Host "    Start-Sleep -Seconds 1" -ForegroundColor $Yellow
Write-Host "  }" -ForegroundColor $Yellow

Write-Host "`nMonitoring:" -ForegroundColor $Cyan
Write-Host "  Upstash Dashboard: https://console.upstash.com/redis" -ForegroundColor $Yellow
Write-Host "  Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor $Yellow

Write-Host "`nDocumentation:" -ForegroundColor $Cyan
Write-Host "  Quick Start: UPSTASH-QUICK-START.md" -ForegroundColor $Yellow
Write-Host "  Full Guide: UPSTASH-REDIS-SETUP-GUIDE.md" -ForegroundColor $Yellow
Write-Host "  Cheat Sheet: UPSTASH-CHEAT-SHEET.md" -ForegroundColor $Yellow

Write-Host "`n✓ Upstash Redis setup complete!" -ForegroundColor $Green
Write-Host ""
