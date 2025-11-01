#!/usr/bin/env pwsh
# =============================================================================
# AGENTS.MD - Quick Test Script
# =============================================================================
# Fast validation of critical functionality
# Usage: .\scripts\quick-test.ps1
# =============================================================================

Write-Host "`n🚀 AGENTS.MD - Quick Test" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Color functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

$ErrorCount = 0

# Test 1: Environment file exists
Write-Info "Checking environment configuration..."
if (Test-Path ".env.local") {
    Write-Success ".env.local exists"
} else {
    Write-Error ".env.local not found"
    $ErrorCount++
}

# Test 2: Load and validate critical variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    
    $CriticalVars = @('OPENAI_API_KEY', 'GEMINI_API_KEY', 'DATABASE_URL', 'JWT_SECRET')
    foreach ($var in $CriticalVars) {
        $value = [Environment]::GetEnvironmentVariable($var, 'Process')
        if ([string]::IsNullOrWhiteSpace($value) -or $value -like '*your_*_here*') {
            Write-Error "$var not configured"
            $ErrorCount++
        } else {
            Write-Success "$var configured"
        }
    }
}

# Test 3: Node modules
Write-Info "Checking dependencies..."
if (Test-Path "node_modules") {
    Write-Success "Dependencies installed"
} else {
    Write-Error "Dependencies not installed. Run: npm install"
    $ErrorCount++
}

# Test 4: Database connection
Write-Info "Testing database connection..."
$DbUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
if ($DbUrl) {
    $TestScript = @"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1').then(() => {
    console.log('✅ Database connected');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
}).finally(() => pool.end());
"@
    $TestScript | Out-File -FilePath "temp-quick-db-test.js" -Encoding UTF8
    node temp-quick-db-test.js
    if ($LASTEXITCODE -ne 0) { $ErrorCount++ }
    Remove-Item "temp-quick-db-test.js" -ErrorAction SilentlyContinue
}

# Test 5: Gemini API key format
Write-Info "Validating Gemini API key..."
$GeminiKey = [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'Process')
if ($GeminiKey -and $GeminiKey -match '^AIzaSy[A-Za-z0-9_-]{33}$') {
    Write-Success "Gemini API key format valid"
} else {
    Write-Error "Gemini API key format invalid"
    $ErrorCount++
}

# Summary
Write-Host "`n" -NoNewline
if ($ErrorCount -eq 0) {
    Write-Success "All quick tests passed! ✨"
    Write-Info "Run full tests with: .\scripts\test-automation.ps1"
    exit 0
} else {
    Write-Error "$ErrorCount test(s) failed"
    Write-Info "Fix errors and run: .\scripts\test-automation.ps1"
    exit 1
}
