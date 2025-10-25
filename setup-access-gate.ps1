# ============================================
# ACCESS GATE SETUP SCRIPT
# Bitcoin Sovereign Technology
# ============================================

Write-Host "🔐 Setting up Access Gate..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
    
    # Check if access code is configured
    $envContent = Get-Content .env.local -Raw
    if ($envContent -match "NEXT_PUBLIC_ACCESS_CODE") {
        Write-Host "✅ Access code is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Access code not found in .env.local" -ForegroundColor Yellow
        Write-Host "   Add: NEXT_PUBLIC_ACCESS_CODE=your_code_here" -ForegroundColor Yellow
    }
    
    # Check if SMTP is configured
    if ($envContent -match "SMTP_HOST") {
        Write-Host "✅ SMTP configuration found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SMTP configuration not found in .env.local" -ForegroundColor Yellow
        Write-Host "   Add SMTP settings for email functionality" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env.local file not found" -ForegroundColor Yellow
    Write-Host "   Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "✅ Created .env.local from template" -ForegroundColor Green
    Write-Host "   Please edit .env.local and add your configuration" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "ACCESS GATE SETUP COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env.local and configure:" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_ACCESS_CODE (required)" -ForegroundColor White
Write-Host "   - SMTP settings (for email functionality)" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test the access gate:" -ForegroundColor White
Write-Host "   - Visit http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Try entering the access code" -ForegroundColor Cyan
Write-Host "   - Try submitting an application" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed setup instructions, see:" -ForegroundColor Yellow
Write-Host "ACCESS-GATE-SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Ready to launch!" -ForegroundColor Green
