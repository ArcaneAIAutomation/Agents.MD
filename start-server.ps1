#!/usr/bin/env pwsh

Write-Host "🚀 Trading Intelligence Hub - Server Startup Diagnostics" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Check Node.js version
Write-Host "`n📋 Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found or not accessible" -ForegroundColor Red
    exit 1
}

# Check npm version  
Write-Host "`n📋 Checking npm version..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found or not accessible" -ForegroundColor Red
    exit 1
}

# Check if package.json exists
Write-Host "`n📋 Checking project structure..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "⚠️ node_modules not found - running npm install..." -ForegroundColor Yellow
    npm install
}

# Check for TypeScript errors
Write-Host "`n📋 Checking for TypeScript errors..." -ForegroundColor Yellow
try {
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ No TypeScript errors found" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript errors detected:" -ForegroundColor Red
        Write-Host $tscResult -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️ Could not run TypeScript check" -ForegroundColor Yellow
}

# Clean any existing build
Write-Host "`n📋 Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleaned .next directory" -ForegroundColor Green
}

# Check port availability
Write-Host "`n📋 Checking port 3000 availability..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":3000"
if ($portCheck) {
    Write-Host "⚠️ Port 3000 is in use:" -ForegroundColor Yellow
    Write-Host $portCheck
} else {
    Write-Host "✅ Port 3000 is available" -ForegroundColor Green
}

# Start the development server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Your Trading Intelligence Hub will be available at:" -ForegroundColor Yellow
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

try {
    npm run dev
} catch {
    Write-Host "`n❌ Failed to start development server" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if all dependencies are installed: npm install" -ForegroundColor White
    Write-Host "2. Clear cache: npm cache clean --force" -ForegroundColor White
    Write-Host "3. Try starting with: npx next dev" -ForegroundColor White
    Write-Host "4. Check for port conflicts: netstat -ano | findstr :3000" -ForegroundColor White
}
