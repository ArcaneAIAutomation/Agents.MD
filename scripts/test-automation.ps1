#!/usr/bin/env pwsh
# =============================================================================
# AGENTS.MD - Automated Testing Script
# =============================================================================
# This script automates the complete testing workflow for the platform
# Usage: .\scripts\test-automation.ps1 [-Environment <dev|staging|prod>]
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Color output functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Step { param($Message) Write-Host "`n🔹 $Message" -ForegroundColor Blue }

# Configuration
$ErrorActionPreference = "Continue"
$BaseUrl = switch ($Environment) {
    'dev' { 'http://localhost:3000' }
    'staging' { 'https://agents-md-staging.vercel.app' }
    'prod' { 'https://news.arcane.group' }
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         AGENTS.MD - AUTOMATED TESTING SUITE                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Info "Environment: $Environment"
Write-Info "Base URL: $BaseUrl"
Write-Info "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# =============================================================================
# STEP 1: Environment Validation
# =============================================================================
Write-Step "Validating Environment Configuration"

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Error ".env.local file not found!"
    Write-Info "Creating .env.local from .env.example..."
    Copy-Item ".env.example" ".env.local"
    Write-Warning "Please update .env.local with your API keys before continuing"
    exit 1
}

# Load environment variables
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Validate critical environment variables
$RequiredVars = @(
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'DATABASE_URL',
    'JWT_SECRET',
    'CRON_SECRET'
)

$MissingVars = @()
foreach ($var in $RequiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ([string]::IsNullOrWhiteSpace($value) -or $value -like '*your_*_here*') {
        $MissingVars += $var
        Write-Error "$var is not configured"
    } else {
        Write-Success "$var is configured"
    }
}

if ($MissingVars.Count -gt 0) {
    Write-Error "Missing required environment variables: $($MissingVars -join ', ')"
    Write-Warning "Please update .env.local with valid API keys"
    exit 1
}

# =============================================================================
# STEP 2: Dependency Check
# =============================================================================
Write-Step "Checking Dependencies"

# Check Node.js version
$NodeVersion = node --version
Write-Info "Node.js version: $NodeVersion"

# Check npm version
$NpmVersion = npm --version
Write-Info "npm version: $NpmVersion"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Warning "node_modules not found. Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
} else {
    Write-Success "Dependencies are installed"
}

# =============================================================================
# STEP 3: Database Connection Test
# =============================================================================
Write-Step "Testing Database Connection"

$DbUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
if ($DbUrl) {
    Write-Info "Testing Supabase PostgreSQL connection..."
    
    # Create a simple Node.js script to test database connection
    $TestScript = @"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW() as current_time, version() as pg_version')
    .then(result => {
        console.log('✅ Database connected successfully');
        console.log('   Time:', result.rows[0].current_time);
        console.log('   Version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    })
    .finally(() => pool.end());
"@
    
    $TestScript | Out-File -FilePath "temp-db-test.js" -Encoding UTF8
    node temp-db-test.js
    Remove-Item "temp-db-test.js" -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection successful"
    } else {
        Write-Error "Database connection failed"
    }
} else {
    Write-Warning "DATABASE_URL not configured, skipping database test"
}

# =============================================================================
# STEP 4: Build Application (if not skipped)
# =============================================================================
if (-not $SkipBuild) {
    Write-Step "Building Application"
    
    Write-Info "Running Next.js build..."
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully"
    } else {
        Write-Error "Build failed"
        exit 1
    }
} else {
    Write-Warning "Skipping build (--SkipBuild flag set)"
}

# =============================================================================
# STEP 5: Start Development Server (for dev environment)
# =============================================================================
if ($Environment -eq 'dev') {
    Write-Step "Starting Development Server"
    
    # Check if port 3000 is already in use
    $Port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($Port3000) {
        Write-Warning "Port 3000 is already in use. Assuming dev server is running..."
    } else {
        Write-Info "Starting Next.js dev server in background..."
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        Write-Info "Waiting 10 seconds for server to start..."
        Start-Sleep -Seconds 10
    }
}

# =============================================================================
# STEP 6: API Endpoint Tests
# =============================================================================
Write-Step "Testing API Endpoints"

$TestResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Info "Testing: $Name"
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Success "$Name - Status: $($response.StatusCode)"
            $script:TestResults.Passed++
            return $true
        } else {
            Write-Error "$Name - Expected: $ExpectedStatus, Got: $($response.StatusCode)"
            $script:TestResults.Failed++
            return $false
        }
    } catch {
        Write-Error "$Name - Error: $($_.Exception.Message)"
        $script:TestResults.Failed++
        return $false
    }
}

# Test public endpoints
Test-Endpoint -Name "Homepage" -Url "$BaseUrl/"
Test-Endpoint -Name "Health Check" -Url "$BaseUrl/api/health"
Test-Endpoint -Name "CSRF Token" -Url "$BaseUrl/api/auth/csrf-token"

# Test authentication endpoints (expect 401 for protected routes)
Test-Endpoint -Name "Current User (Unauthenticated)" -Url "$BaseUrl/api/auth/me" -ExpectedStatus 401

# Test Gemini API validation
if ([Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'Process')) {
    Test-Endpoint -Name "Gemini Config Validation" -Url "$BaseUrl/api/whale-watch/validate-gemini"
}

# Test market data endpoints
Test-Endpoint -Name "Bitcoin Analysis" -Url "$BaseUrl/api/btc-analysis"
Test-Endpoint -Name "Ethereum Analysis" -Url "$BaseUrl/api/eth-analysis"

# Test news endpoints
Test-Endpoint -Name "Crypto Herald (15 Stories)" -Url "$BaseUrl/api/crypto-herald-15-stories"

# Test whale watch endpoints
Test-Endpoint -Name "Whale Detection" -Url "$BaseUrl/api/whale-watch/detect?threshold=50"

# =============================================================================
# STEP 7: Authentication Flow Test
# =============================================================================
Write-Step "Testing Authentication Flow"

Write-Info "Testing registration with access code..."
$RegisterBody = @{
    accessCode = "BITCOIN2025"
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/register" `
        -Method POST `
        -Body $RegisterBody `
        -ContentType "application/json" `
        -TimeoutSec 30
    
    if ($registerResponse.StatusCode -eq 200) {
        Write-Success "Registration test passed"
        $TestResults.Passed++
    } else {
        Write-Warning "Registration returned status: $($registerResponse.StatusCode)"
        $TestResults.Failed++
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Warning "Registration test: Access code already used (expected in production)"
        $TestResults.Skipped++
    } else {
        Write-Error "Registration test failed: $($_.Exception.Message)"
        $TestResults.Failed++
    }
}

# =============================================================================
# STEP 8: Gemini API Test
# =============================================================================
Write-Step "Testing Gemini AI Integration"

$GeminiKey = [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'Process')
if ($GeminiKey -and $GeminiKey -notlike '*your_*_here*') {
    Write-Info "Testing Gemini API configuration..."
    
    # Validate Gemini API key format
    if ($GeminiKey -match '^AIzaSy[A-Za-z0-9_-]{33}$') {
        Write-Success "Gemini API key format is valid"
        $TestResults.Passed++
    } else {
        Write-Error "Gemini API key format is invalid"
        $TestResults.Failed++
    }
    
    # Test Gemini model configuration
    $GeminiModel = [Environment]::GetEnvironmentVariable('GEMINI_MODEL', 'Process')
    if ($GeminiModel) {
        Write-Info "Gemini Model: $GeminiModel"
        Write-Success "Gemini model configured"
        $TestResults.Passed++
    } else {
        Write-Warning "Gemini model not configured, using default"
        $TestResults.Skipped++
    }
} else {
    Write-Warning "Gemini API key not configured, skipping Gemini tests"
    $TestResults.Skipped++
}

# =============================================================================
# STEP 9: Generate Test Report
# =============================================================================
Write-Step "Generating Test Report"

$TotalTests = $TestResults.Passed + $TestResults.Failed + $TestResults.Skipped
$PassRate = if ($TotalTests -gt 0) { [math]::Round(($TestResults.Passed / $TotalTests) * 100, 2) } else { 0 }

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST RESULTS SUMMARY                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nTotal Tests: $TotalTests" -ForegroundColor White
Write-Success "Passed: $($TestResults.Passed)"
Write-Error "Failed: $($TestResults.Failed)"
Write-Warning "Skipped: $($TestResults.Skipped)"
Write-Host "`nPass Rate: $PassRate%" -ForegroundColor $(if ($PassRate -ge 80) { 'Green' } elseif ($PassRate -ge 60) { 'Yellow' } else { 'Red' })

# Save report to file
$ReportPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$Report = @"
AGENTS.MD - Test Results
========================
Environment: $Environment
Base URL: $BaseUrl
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Summary:
--------
Total Tests: $TotalTests
Passed: $($TestResults.Passed)
Failed: $($TestResults.Failed)
Skipped: $($TestResults.Skipped)
Pass Rate: $PassRate%

Status: $(if ($TestResults.Failed -eq 0) { 'SUCCESS ✅' } else { 'FAILED ❌' })
"@

$Report | Out-File -FilePath $ReportPath -Encoding UTF8
Write-Info "Test report saved to: $ReportPath"

# =============================================================================
# STEP 10: Cleanup and Exit
# =============================================================================
Write-Step "Cleanup"

if ($Environment -eq 'dev') {
    Write-Info "Development server is still running on port 3000"
    Write-Info "To stop it, run: Get-Process -Name node | Stop-Process"
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TESTING COMPLETE                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($TestResults.Failed -eq 0) {
    Write-Success "All tests passed! Ready for deployment."
    exit 0
} else {
    Write-Error "Some tests failed. Please review the errors above."
    exit 1
}
