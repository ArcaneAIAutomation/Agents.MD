# ============================================================================
# Vercel Environment Variables Setup Script (Simple Version)
# Bitcoin Sovereign Technology - Authentication System
# ============================================================================
# This script creates a .env.production file and pulls it to Vercel
#
# Usage:
#   .\scripts\setup-vercel-env-simple.ps1
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🔐 Bitcoin Sovereign Technology" -ForegroundColor Cyan
Write-Host "   Vercel Environment Variables Setup (Simple)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host ""

# Create .env.production file
Write-Host "📝 Creating .env.production file..." -ForegroundColor Yellow

$envContent = @"
# ============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# Bitcoin Sovereign Technology - Authentication System
# ============================================================================
# This file contains all environment variables for Vercel production deployment
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# =============================================================================
# 🗄️ DATABASE CONFIGURATION (Supabase PostgreSQL)
# =============================================================================
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres

# =============================================================================
# 🔐 AUTHENTICATION SECRETS
# =============================================================================
JWT_SECRET=MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI=
CRON_SECRET=UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo=
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d

# =============================================================================
# 🛡️ RATE LIMITING CONFIGURATION (Redis Cloud)
# =============================================================================
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

# =============================================================================
# 📧 EMAIL CONFIGURATION (Office 365)
# =============================================================================
SENDER_EMAIL=no-reply@arcane.group
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp

# =============================================================================
# 🔧 APPLICATION CONFIGURATION
# =============================================================================
NEXT_PUBLIC_APP_URL=https://news.arcane.group
ENABLE_WELCOME_EMAIL=true
ENABLE_SESSION_CLEANUP=true
SESSION_CLEANUP_INTERVAL_HOURS=24
SESSION_RETENTION_DAYS=30
"@

# Write to file
$envContent | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline

Write-Host "✅ Created .env.production" -ForegroundColor Green
Write-Host ""

# Show instructions
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📋 Manual Setup Instructions" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Use Vercel Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project: agents-md-v2" -ForegroundColor White
Write-Host "3. Go to: Settings > Environment Variables" -ForegroundColor White
Write-Host "4. Copy variables from .env.production file" -ForegroundColor White
Write-Host "5. Add each variable for Production, Preview, Development" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use Vercel CLI (Advanced)" -ForegroundColor Yellow
Write-Host "Run these commands one by one:" -ForegroundColor White
Write-Host ""

# Generate CLI commands
$envLines = $envContent -split "`n" | Where-Object { $_ -match "^[A-Z_]+=.+" }
foreach ($line in $envLines) {
    if ($line -match "^([A-Z_]+)=(.+)$") {
        $name = $matches[1]
        $value = $matches[2]
        Write-Host "vercel env add $name production" -ForegroundColor Gray
        Write-Host "# Enter value: $value" -ForegroundColor DarkGray
        Write-Host ""
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 File created: .env.production" -ForegroundColor Green
Write-Host "⚠️  Do NOT commit this file to Git!" -ForegroundColor Yellow
Write-Host ""
