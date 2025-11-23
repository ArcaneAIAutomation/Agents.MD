#!/usr/bin/env pwsh
# ============================================================================
# Supabase Migration Runner - Einstein Level
# ============================================================================
# Purpose: Automate running migrations in Supabase
# Date: January 27, 2025
# Usage: pwsh scripts/run-supabase-migrations.ps1
# ============================================================================

param(
    [switch]$CleanDatabase = $false,
    [switch]$ShowInstructions = $false
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Step {
    param([string]$Message)
    Write-Host "${Blue}==>${Reset} ${Message}" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}✅${Reset} ${Message}" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${Yellow}⚠️${Reset}  ${Message}" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗄️  ${Blue}SUPABASE MIGRATION RUNNER${Reset}" -ForegroundColor Blue
Write-Host "============================================================================"
Write-Host ""

# ============================================================================
# Check for DATABASE_URL
# ============================================================================

Write-Step "Checking database configuration..."

if (-not $env:DATABASE_URL) {
    Write-Warning "DATABASE_URL not found in environment"
    Write-Host ""
    Write-Host "Please set DATABASE_URL in your .env.local file:"
    Write-Host "DATABASE_URL=postgres://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    Write-Host ""
    exit 1
}

Write-Success "Database URL configured"

# ============================================================================
# List available migrations
# ============================================================================

Write-Host ""
Write-Step "Available migrations:"
Write-Host ""

$migrations = @(
    @{
        File = "migrations/001_create_atge_tables.sql"
        Name = "Create ATGE Tables"
        Required = $true
        Description = "Creates trade_signals, trade_results, trade_technical_indicators, trade_market_snapshot, trade_historical_prices"
    },
    @{
        File = "migrations/002_add_missing_columns.sql"
        Name = "Add Missing Columns"
        Required = $false
        Description = "Adds any missing columns to existing tables"
    },
    @{
        File = "migrations/006_add_verification_columns.sql"
        Name = "Add Verification Columns"
        Required = $true
        Description = "Adds last_verified_at, verification_data_source, sopr_value, mvrv_z_score"
    },
    @{
        File = "migrations/007_add_monitoring_tables.sql"
        Name = "Add Monitoring Tables"
        Required = $true
        Description = "Creates atge_api_usage_logs and atge_performance_metrics tables"
    }
)

$cleanScript = @{
    File = "scripts/clean-atge-database.sql"
    Name = "Clean ATGE Database"
    Required = $false
    Description = "⚠️  WARNING: Deletes ALL trade data for fresh testing"
}

# Display clean script option
if ($CleanDatabase) {
    Write-Host "0️⃣  ${Yellow}[CLEANUP]${Reset} $($cleanScript.Name)"
    Write-Host "    📄 $($cleanScript.File)"
    Write-Host "    📝 $($cleanScript.Description)"
    Write-Host ""
}

# Display migrations
for ($i = 0; $i -lt $migrations.Count; $i++) {
    $migration = $migrations[$i]
    $number = $i + 1
    $required = if ($migration.Required) { "${Green}[REQUIRED]${Reset}" } else { "${Yellow}[OPTIONAL]${Reset}" }
    
    Write-Host "${number}️⃣  $required $($migration.Name)"
    Write-Host "    📄 $($migration.File)"
    Write-Host "    📝 $($migration.Description)"
    Write-Host ""
}

# ============================================================================
# Show instructions or run migrations
# ============================================================================

if ($ShowInstructions) {
    Write-Host ""
    Write-Step "Manual Migration Instructions"
    Write-Host ""
    Write-Host "1️⃣  Open Supabase Dashboard:"
    Write-Host "   https://supabase.com/dashboard"
    Write-Host ""
    Write-Host "2️⃣  Navigate to SQL Editor:"
    Write-Host "   Dashboard → Your Project → SQL Editor"
    Write-Host ""
    Write-Host "3️⃣  Create a new query"
    Write-Host ""
    Write-Host "4️⃣  Copy and paste each migration file content"
    Write-Host ""
    Write-Host "5️⃣  Run the query (Ctrl+Enter or click Run)"
    Write-Host ""
    Write-Host "6️⃣  Verify success message"
    Write-Host ""
    Write-Host "7️⃣  Repeat for each migration"
    Write-Host ""
    
    # Open Supabase dashboard
    $openDashboard = Read-Host "Open Supabase dashboard in browser? (y/n)"
    if ($openDashboard -eq "y") {
        Start-Process "https://supabase.com/dashboard"
    }
    
    exit 0
}

# ============================================================================
# Automated migration (requires psql or connection string)
# ============================================================================

Write-Host ""
Write-Step "Migration Options"
Write-Host ""
Write-Host "This script can help you run migrations in two ways:"
Write-Host ""
Write-Host "1️⃣  Manual (Recommended):"
Write-Host "   - Copy SQL files to Supabase SQL Editor"
Write-Host "   - Run each migration manually"
Write-Host "   - See results immediately"
Write-Host ""
Write-Host "2️⃣  Automated (Requires psql):"
Write-Host "   - Automatically run all migrations"
Write-Host "   - Requires PostgreSQL client (psql)"
Write-Host ""

$choice = Read-Host "Choose option (1 for manual, 2 for automated)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Step "Opening migration files..."
    Write-Host ""
    
    # Open each migration file
    foreach ($migration in $migrations) {
        if (Test-Path $migration.File) {
            Write-Host "📄 Opening: $($migration.File)"
            Start-Process $migration.File
            Start-Sleep -Milliseconds 500
        } else {
            Write-Warning "File not found: $($migration.File)"
        }
    }
    
    Write-Host ""
    Write-Success "Migration files opened"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Copy content from each file"
    Write-Host "2. Paste into Supabase SQL Editor"
    Write-Host "3. Run the query"
    Write-Host "4. Verify success"
    Write-Host ""
    
    # Open Supabase dashboard
    $openDashboard = Read-Host "Open Supabase dashboard in browser? (y/n)"
    if ($openDashboard -eq "y") {
        Start-Process "https://supabase.com/dashboard"
    }
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Step "Checking for psql..."
    
    try {
        $psqlVersion = psql --version
        Write-Success "psql found: $psqlVersion"
        
        Write-Host ""
        Write-Warning "Automated migration not yet implemented"
        Write-Host "Please use manual migration (option 1)"
        Write-Host ""
        
    } catch {
        Write-Warning "psql not found"
        Write-Host ""
        Write-Host "To use automated migrations, install PostgreSQL client:"
        Write-Host "https://www.postgresql.org/download/"
        Write-Host ""
        Write-Host "For now, please use manual migration (option 1)"
        Write-Host ""
    }
} else {
    Write-Host "Invalid choice. Exiting."
    exit 1
}

Write-Host ""
Write-Host "Migration runner complete! 🗄️"
Write-Host ""

exit 0

