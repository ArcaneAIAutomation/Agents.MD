# ============================================================================
# Vercel Environment Variables Setup Script
# Bitcoin Sovereign Technology - Authentication System
# ============================================================================
# This script automatically sets all required environment variables in Vercel
# for Production, Preview, and Development environments
#
# Prerequisites:
#   1. Vercel CLI installed: npm i -g vercel
#   2. Logged in to Vercel: vercel login
#   3. Project linked: vercel link
#
# Usage:
#   .\scripts\setup-vercel-env.ps1
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🔐 Bitcoin Sovereign Technology" -ForegroundColor Cyan
Write-Host "   Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
$vercelVersion = vercel --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
Write-Host ""

# Check if project is linked
Write-Host "🔍 Checking Vercel project link..." -ForegroundColor Yellow
$projectInfo = vercel project ls 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Project not linked to Vercel" -ForegroundColor Yellow
    Write-Host "   Linking project now..." -ForegroundColor Yellow
    vercel link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Project linked to Vercel" -ForegroundColor Green
Write-Host ""

# Confirm before proceeding
Write-Host "⚠️  This will set/update environment variables in Vercel" -ForegroundColor Yellow
Write-Host "   for Production, Preview, and Development environments" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Cancelled by user" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Define environment variables
$envVars = @(
    @{
        name = "DATABASE_URL"
        value = "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"
        description = "Supabase PostgreSQL connection string (connection pooling port 6543)"
    },
    @{
        name = "JWT_SECRET"
        value = "MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI="
        description = "JWT token signing secret (32+ bytes, base64 encoded)"
    },
    @{
        name = "CRON_SECRET"
        value = "UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo="
        description = "Cron job authentication secret"
    },
    @{
        name = "JWT_EXPIRATION"
        value = "7d"
        description = "JWT token expiration time (7 days)"
    },
    @{
        name = "JWT_REMEMBER_ME_EXPIRATION"
        value = "30d"
        description = "JWT token expiration for 'Remember Me' (30 days)"
    },
    @{
        name = "KV_REST_API_URL"
        value = "redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137"
        description = "Redis Cloud connection URL for rate limiting"
    },
    @{
        name = "KV_REST_API_TOKEN"
        value = "P0yyIdZMnNwnIY2AR03fTmIgH31hktBs"
        description = "Redis Cloud authentication token"
    },
    @{
        name = "AUTH_RATE_LIMIT_MAX_ATTEMPTS"
        value = "5"
        description = "Maximum login attempts before rate limiting"
    },
    @{
        name = "AUTH_RATE_LIMIT_WINDOW_MS"
        value = "900000"
        description = "Rate limit window in milliseconds (15 minutes)"
    },
    @{
        name = "SENDER_EMAIL"
        value = "no-reply@arcane.group"
        description = "Office 365 sender email address"
    },
    @{
        name = "AZURE_TENANT_ID"
        value = "c152592e-75fe-4f4f-8e8a-8acf38daf0b3"
        description = "Azure AD tenant ID for Office 365"
    },
    @{
        name = "AZURE_CLIENT_ID"
        value = "83bcb34c-3c73-41e9-8dc8-94d257e8755c"
        description = "Azure AD client ID for Office 365"
    },
    @{
        name = "AZURE_CLIENT_SECRET"
        value = "F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp"
        description = "Azure AD client secret for Office 365"
    },
    @{
        name = "NEXT_PUBLIC_APP_URL"
        value = "https://news.arcane.group"
        description = "Production application URL"
    },
    @{
        name = "ENABLE_WELCOME_EMAIL"
        value = "true"
        description = "Enable welcome emails after registration"
    },
    @{
        name = "ENABLE_SESSION_CLEANUP"
        value = "true"
        description = "Enable automatic session cleanup"
    },
    @{
        name = "SESSION_CLEANUP_INTERVAL_HOURS"
        value = "24"
        description = "Session cleanup interval (24 hours)"
    },
    @{
        name = "SESSION_RETENTION_DAYS"
        value = "30"
        description = "Session retention period (30 days)"
    }
)

# Set environment variables
$successCount = 0
$failCount = 0
$totalCount = $envVars.Count

Write-Host "📝 Setting $totalCount environment variables..." -ForegroundColor Cyan
Write-Host ""

foreach ($env in $envVars) {
    $name = $env.name
    $value = $env.value
    $description = $env.description
    
    Write-Host "Setting: $name" -ForegroundColor Yellow
    Write-Host "   Description: $description" -ForegroundColor Gray
    
    # Set for production, preview, and development
    $result = vercel env add $name production preview development --force 2>&1
    
    # Provide the value via stdin
    $value | vercel env add $name production preview development --force 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Set successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "   ❌ Failed to set" -ForegroundColor Red
        $failCount++
    }
    Write-Host ""
}

# Summary
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Total variables: $totalCount" -ForegroundColor White
Write-Host "✅ Successfully set: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Commit your changes: git add . && git commit -m 'Configure authentication'" -ForegroundColor Yellow
    Write-Host "2. Push to GitHub: git push origin main" -ForegroundColor Yellow
    Write-Host "3. Vercel will automatically deploy" -ForegroundColor Yellow
    Write-Host "4. Test at: https://news.arcane.group" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⚠️  Some variables failed to set" -ForegroundColor Yellow
    Write-Host "   You may need to set them manually in Vercel dashboard" -ForegroundColor Yellow
    Write-Host "   Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
