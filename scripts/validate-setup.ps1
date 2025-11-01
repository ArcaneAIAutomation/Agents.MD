#!/usr/bin/env pwsh
# =============================================================================
# AGENTS.MD - Setup Validation Script
# =============================================================================
# Validates complete setup before testing
# Usage: .\scripts\validate-setup.ps1
# =============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         AGENTS.MD - SETUP VALIDATION                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Step { param($Message) Write-Host "`n🔹 $Message" -ForegroundColor Blue }

$ErrorCount = 0
$WarningCount = 0

# =============================================================================
# STEP 1: File Structure Validation
# =============================================================================
Write-Step "Validating File Structure"

$RequiredFiles = @(
    '.env.local',
    '.env.example',
    '.gitignore',
    'package.json',
    'next.config.js',
    'vercel.json',
    'tsconfig.json',
    'tailwind.config.js',
    'postcss.config.js'
)

foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Success "$file exists"
    } else {
        Write-Error "$file is missing"
        $ErrorCount++
    }
}

# Check critical directories
$RequiredDirs = @(
    'pages',
    'pages/api',
    'pages/api/auth',
    'pages/api/whale-watch',
    'components',
    'components/auth',
    'components/WhaleWatch',
    'lib',
    'lib/auth',
    'middleware',
    'styles',
    'public',
    'scripts'
)

foreach ($dir in $RequiredDirs) {
    if (Test-Path $dir) {
        Write-Success "$dir/ exists"
    } else {
        Write-Error "$dir/ is missing"
        $ErrorCount++
    }
}

# =============================================================================
# STEP 2: Environment Configuration
# =============================================================================
Write-Step "Validating Environment Configuration"

if (Test-Path ".env.local") {
    # Load environment variables
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    
    # Validate required variables
    $RequiredVars = @{
        'OPENAI_API_KEY' = 'sk-'
        'GEMINI_API_KEY' = 'AIzaSy'
        'DATABASE_URL' = 'postgres://'
        'JWT_SECRET' = ''
        'CRON_SECRET' = ''
        'KV_REST_API_URL' = 'redis://'
        'KV_REST_API_TOKEN' = ''
        'SENDER_EMAIL' = '@'
        'AZURE_TENANT_ID' = ''
        'AZURE_CLIENT_ID' = ''
        'AZURE_CLIENT_SECRET' = ''
        'NEXT_PUBLIC_APP_URL' = 'http'
    }
    
    foreach ($var in $RequiredVars.Keys) {
        $value = [Environment]::GetEnvironmentVariable($var, 'Process')
        $prefix = $RequiredVars[$var]
        
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-Error "$var is not set"
            $ErrorCount++
        } elseif ($value -like '*your_*_here*' -or $value -like '*example*') {
            Write-Error "$var contains placeholder value"
            $ErrorCount++
        } elseif ($prefix -and -not $value.StartsWith($prefix)) {
            Write-Error "$var has invalid format (should start with '$prefix')"
            $ErrorCount++
        } else {
            Write-Success "$var is configured"
        }
    }
    
    # Validate optional but recommended variables
    $OptionalVars = @(
        'COINMARKETCAP_API_KEY',
        'NEWS_API_KEY',
        'KRAKEN_API_KEY',
        'COINGECKO_API_KEY'
    )
    
    foreach ($var in $OptionalVars) {
        $value = [Environment]::GetEnvironmentVariable($var, 'Process')
        if ([string]::IsNullOrWhiteSpace($value) -or $value -like '*your_*_here*') {
            Write-Warning "$var is not configured (optional)"
            $WarningCount++
        } else {
            Write-Success "$var is configured"
        }
    }
    
} else {
    Write-Error ".env.local file not found"
    $ErrorCount++
}

# =============================================================================
# STEP 3: API Key Format Validation
# =============================================================================
Write-Step "Validating API Key Formats"

# Gemini API Key
$GeminiKey = [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'Process')
if ($GeminiKey -and $GeminiKey -match '^AIzaSy[A-Za-z0-9_-]{33}$') {
    Write-Success "Gemini API key format is valid (39 characters)"
} else {
    Write-Error "Gemini API key format is invalid (should be AIzaSy + 33 chars)"
    $ErrorCount++
}

# OpenAI API Key
$OpenAIKey = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'Process')
if ($OpenAIKey -and $OpenAIKey -match '^sk-[A-Za-z0-9_-]+$') {
    Write-Success "OpenAI API key format is valid"
} else {
    Write-Error "OpenAI API key format is invalid (should start with sk-)"
    $ErrorCount++
}

# JWT Secret Length
$JwtSecret = [Environment]::GetEnvironmentVariable('JWT_SECRET', 'Process')
if ($JwtSecret -and $JwtSecret.Length -ge 32) {
    Write-Success "JWT_SECRET is strong (>= 32 characters)"
} else {
    Write-Error "JWT_SECRET is too short (should be >= 32 characters)"
    $ErrorCount++
}

# CRON Secret Length
$CronSecret = [Environment]::GetEnvironmentVariable('CRON_SECRET', 'Process')
if ($CronSecret -and $CronSecret.Length -ge 32) {
    Write-Success "CRON_SECRET is strong (>= 32 characters)"
} else {
    Write-Error "CRON_SECRET is too short (should be >= 32 characters)"
    $ErrorCount++
}

# =============================================================================
# STEP 4: Dependencies Check
# =============================================================================
Write-Step "Checking Dependencies"

# Check Node.js
try {
    $NodeVersion = node --version
    Write-Success "Node.js installed: $NodeVersion"
} catch {
    Write-Error "Node.js is not installed"
    $ErrorCount++
}

# Check npm
try {
    $NpmVersion = npm --version
    Write-Success "npm installed: $NpmVersion"
} catch {
    Write-Error "npm is not installed"
    $ErrorCount++
}

# Check node_modules
if (Test-Path "node_modules") {
    Write-Success "node_modules directory exists"
    
    # Check critical packages
    $CriticalPackages = @(
        'next',
        'react',
        'react-dom',
        'openai',
        '@vercel/postgres',
        '@vercel/kv',
        'bcryptjs',
        'jsonwebtoken',
        'zod',
        'pg'
    )
    
    foreach ($pkg in $CriticalPackages) {
        if (Test-Path "node_modules/$pkg") {
            Write-Success "$pkg is installed"
        } else {
            Write-Error "$pkg is not installed"
            $ErrorCount++
        }
    }
} else {
    Write-Error "node_modules not found. Run: npm install"
    $ErrorCount++
}

# =============================================================================
# STEP 5: Database Connection Test
# =============================================================================
Write-Step "Testing Database Connection"

$DbUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
if ($DbUrl) {
    Write-Info "Testing Supabase PostgreSQL connection..."
    
    $TestScript = @"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW() as time, version() as version')
    .then(result => {
        console.log('✅ Database connected');
        console.log('   Server time:', result.rows[0].time);
        console.log('   PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Database error:', err.message);
        process.exit(1);
    })
    .finally(() => pool.end());
"@
    
    $TestScript | Out-File -FilePath "temp-validate-db.js" -Encoding UTF8
    node temp-validate-db.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection successful"
    } else {
        Write-Error "Database connection failed"
        $ErrorCount++
    }
    
    Remove-Item "temp-validate-db.js" -ErrorAction SilentlyContinue
} else {
    Write-Error "DATABASE_URL not configured"
    $ErrorCount++
}

# =============================================================================
# STEP 6: Redis/KV Connection Test
# =============================================================================
Write-Step "Testing Redis/KV Connection"

$KvUrl = [Environment]::GetEnvironmentVariable('KV_REST_API_URL', 'Process')
$KvToken = [Environment]::GetEnvironmentVariable('KV_REST_API_TOKEN', 'Process')

if ($KvUrl -and $KvToken) {
    Write-Info "Testing Redis connection..."
    
    try {
        $headers = @{
            'Authorization' = "Bearer $KvToken"
        }
        
        $response = Invoke-WebRequest -Uri "$KvUrl/ping" -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Redis/KV connection successful"
        } else {
            Write-Error "Redis/KV connection failed (Status: $($response.StatusCode))"
            $ErrorCount++
        }
    } catch {
        Write-Error "Redis/KV connection failed: $($_.Exception.Message)"
        $ErrorCount++
    }
} else {
    Write-Warning "Redis/KV not configured (rate limiting will use in-memory fallback)"
    $WarningCount++
}

# =============================================================================
# STEP 7: Git Configuration
# =============================================================================
Write-Step "Checking Git Configuration"

try {
    $GitBranch = git branch --show-current
    Write-Success "Current branch: $GitBranch"
    
    if ($GitBranch -ne 'main') {
        Write-Warning "Not on main branch (currently on: $GitBranch)"
        $WarningCount++
    }
    
    $GitStatus = git status --porcelain
    if ($GitStatus) {
        Write-Warning "Uncommitted changes detected"
        $WarningCount++
    } else {
        Write-Success "Working directory is clean"
    }
    
    $GitRemote = git remote get-url origin
    Write-Info "Remote: $GitRemote"
    
} catch {
    Write-Error "Git is not configured or not a git repository"
    $ErrorCount++
}

# =============================================================================
# STEP 8: Vercel Configuration
# =============================================================================
Write-Step "Checking Vercel Configuration"

if (Test-Path "vercel.json") {
    Write-Success "vercel.json exists"
    
    # Check if .vercel directory exists (indicates linked project)
    if (Test-Path ".vercel") {
        Write-Success "Project is linked to Vercel"
    } else {
        Write-Warning "Project not linked to Vercel (run: vercel link)"
        $WarningCount++
    }
} else {
    Write-Error "vercel.json not found"
    $ErrorCount++
}

# =============================================================================
# STEP 9: Test Scripts Validation
# =============================================================================
Write-Step "Validating Test Scripts"

$TestScripts = @(
    'scripts/test-automation.ps1',
    'scripts/quick-test.ps1',
    'scripts/validate-setup.ps1'
)

foreach ($script in $TestScripts) {
    if (Test-Path $script) {
        Write-Success "$script exists"
    } else {
        Write-Error "$script is missing"
        $ErrorCount++
    }
}

# =============================================================================
# STEP 10: Documentation Check
# =============================================================================
Write-Step "Checking Documentation"

$Docs = @(
    'README.md',
    'TEST-GUIDE.md',
    'TESTING-README.md',
    'AUTHENTICATION-SUCCESS.md',
    'FINAL-SETUP-GUIDE.md'
)

foreach ($doc in $Docs) {
    if (Test-Path $doc) {
        Write-Success "$doc exists"
    } else {
        Write-Warning "$doc is missing"
        $WarningCount++
    }
}

# =============================================================================
# FINAL SUMMARY
# =============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VALIDATION SUMMARY                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nValidation Results:" -ForegroundColor White
Write-Error "Errors: $ErrorCount"
Write-Warning "Warnings: $WarningCount"

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "`n" -NoNewline
    Write-Success "✨ Perfect! Setup is complete and ready for testing!"
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Info "1. Run quick test: npm run test:quick"
    Write-Info "2. Run full test suite: npm run test:auto"
    Write-Info "3. Review TEST-GUIDE.md for manual testing"
    Write-Info "4. Deploy with confidence: npm run deploy"
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "`n" -NoNewline
    Write-Success "✅ Setup is valid with minor warnings"
    Write-Host "`nWarnings can be addressed later. You can proceed with testing." -ForegroundColor Yellow
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Info "1. Run quick test: npm run test:quick"
    Write-Info "2. Run full test suite: npm run test:auto"
    exit 0
} else {
    Write-Host "`n" -NoNewline
    Write-Error "❌ Setup validation failed with $ErrorCount error(s)"
    Write-Host "`nPlease fix the errors above before proceeding." -ForegroundColor Red
    Write-Host "`nCommon Fixes:" -ForegroundColor Cyan
    Write-Info "• Update .env.local with valid API keys"
    Write-Info "• Run: npm install"
    Write-Info "• Check database connection"
    Write-Info "• Verify Gemini API key format"
    exit 1
}
