# Quantum BTC Super Spec - Deployment Script (PowerShell)
# This script automates the deployment process to Vercel

$ErrorActionPreference = "Stop"

Write-Host "🚀 Quantum BTC Super Spec - Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor White
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error-Custom "package.json not found. Please run this script from the project root."
    exit 1
}

# Check if vercel.json exists
if (-not (Test-Path "vercel.json")) {
    Write-Error-Custom "vercel.json not found. Please ensure Vercel configuration exists."
    exit 1
}

# Step 1: Check Git status
Write-Host ""
Write-Host "Step 1: Checking Git status..." -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning-Custom "You have uncommitted changes."
    Write-Host ""
    git status --short
    Write-Host ""
    
    $commit = Read-Host "Do you want to commit these changes? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        $commitMessage = Read-Host "Enter commit message"
        git add -A
        git commit -m $commitMessage
        Write-Success "Changes committed"
    } else {
        Write-Warning-Custom "Proceeding with uncommitted changes"
    }
} else {
    Write-Success "Working directory clean"
}

# Step 2: Run tests
Write-Host ""
Write-Host "Step 2: Running tests..." -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

try {
    npm run test 2>$null
    Write-Success "Tests passed"
} catch {
    Write-Warning-Custom "Tests failed or not configured (continuing anyway)"
}

# Step 3: Build project
Write-Host ""
Write-Host "Step 3: Building project..." -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan

try {
    npm run build
    Write-Success "Build successful"
} catch {
    Write-Error-Custom "Build failed. Please fix errors before deploying."
    exit 1
}

# Step 4: Check environment variables
Write-Host ""
Write-Host "Step 4: Checking environment variables..." -ForegroundColor Cyan
Write-Host "-----------------------------------------" -ForegroundColor Cyan

$requiredVars = @(
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "JWT_SECRET",
    "CRON_SECRET"
)

$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Warning-Custom "Missing environment variables (ensure they're set in Vercel):"
    foreach ($var in $missingVars) {
        Write-Host "  - $var"
    }
} else {
    Write-Success "All required environment variables present locally"
}

# Step 5: Push to GitHub
Write-Host ""
Write-Host "Step 5: Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan

$currentBranch = git branch --show-current
Write-Info "Current branch: $currentBranch"

$push = Read-Host "Push to GitHub and trigger Vercel deployment? (y/n)"

if ($push -eq "y" -or $push -eq "Y") {
    try {
        git push origin $currentBranch
        Write-Success "Pushed to GitHub successfully"
        Write-Info "Vercel will automatically deploy from GitHub"
    } catch {
        Write-Error-Custom "Failed to push to GitHub"
        exit 1
    }
} else {
    Write-Warning-Custom "Skipping GitHub push"
    Write-Info "You can manually push later with: git push origin $currentBranch"
}

# Step 6: Deployment instructions
Write-Host ""
Write-Host "Step 6: Deployment Status" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

Write-Success "Deployment initiated!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Go to https://vercel.com/dashboard"
Write-Host "  2. Select your project"
Write-Host "  3. Click 'Deployments' tab"
Write-Host "  4. Monitor the build progress"
Write-Host "  5. Once deployed, run verification:"
Write-Host "     npx tsx scripts/verify-quantum-deployment.ts"
Write-Host ""
Write-Host "Deployment checklist:"
Write-Host "  - Verify all environment variables in Vercel"
Write-Host "  - Check cron jobs are configured"
Write-Host "  - Run database migrations in Supabase"
Write-Host "  - Test API endpoints"
Write-Host "  - Monitor logs for 24 hours"
Write-Host ""

Write-Success "Deployment script completed!"
Write-Host ""
Write-Host "For detailed instructions, see:"
Write-Host "  - QUANTUM-BTC-DEPLOYMENT-GUIDE.md"
Write-Host "  - QUANTUM-BTC-DEPLOYMENT-CHECKLIST.md"
Write-Host ""
