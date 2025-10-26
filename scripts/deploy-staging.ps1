# Staging Deployment Script for Secure User Authentication
# This script automates the staging deployment process

param(
    [switch]$SkipTests,
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Staging Deployment - Secure User Auth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to prompt for confirmation
function Get-Confirmation {
    param($Message)
    if ($Force) {
        return $true
    }
    $response = Read-Host "$Message (y/n)"
    return $response -eq 'y' -or $response -eq 'Y'
}

# Step 1: Pre-deployment checks
Write-Host "Step 1: Pre-deployment checks" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

# Check if git is installed
if (-not (Test-Command "git")) {
    Write-Host "ERROR: Git is not installed" -ForegroundColor Red
    exit 1
}

# Check if on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "WARNING: Not on main branch (current: $currentBranch)" -ForegroundColor Yellow
    if (-not (Get-Confirmation "Continue anyway?")) {
        exit 1
    }
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "WARNING: You have uncommitted changes" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    if (-not (Get-Confirmation "Continue anyway?")) {
        exit 1
    }
}

Write-Host "✓ Pre-deployment checks passed" -ForegroundColor Green
Write-Host ""

# Step 2: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "Step 2: Running tests" -ForegroundColor Yellow
    Write-Host "---------------------" -ForegroundColor Yellow
    
    # Check if npm is installed
    if (-not (Test-Command "npm")) {
        Write-Host "ERROR: npm is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Run tests
    Write-Host "Running test suite..." -ForegroundColor Cyan
    npm test -- --run
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Tests failed" -ForegroundColor Red
        if (-not (Get-Confirmation "Continue anyway?")) {
            exit 1
        }
    } else {
        Write-Host "✓ All tests passed" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "Step 2: Skipping tests (--SkipTests flag)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Create staging branch
Write-Host "Step 3: Create staging branch" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

# Check if staging branch already exists
$branchExists = git branch --list "auth-system-staging"
if ($branchExists) {
    Write-Host "Staging branch already exists" -ForegroundColor Yellow
    if (Get-Confirmation "Delete and recreate?") {
        git branch -D auth-system-staging
        Write-Host "✓ Deleted existing staging branch" -ForegroundColor Green
    } else {
        Write-Host "Using existing staging branch" -ForegroundColor Cyan
        git checkout auth-system-staging
        git pull origin main
        Write-Host "✓ Updated staging branch from main" -ForegroundColor Green
    }
} else {
    git checkout -b auth-system-staging
    Write-Host "✓ Created staging branch" -ForegroundColor Green
}

Write-Host ""

# Step 4: Stage and commit changes
Write-Host "Step 4: Stage and commit changes" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow

# Check if there are changes to commit
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
} else {
    Write-Host "Staging authentication files..." -ForegroundColor Cyan
    
    # Stage all authentication-related files
    git add .kiro/specs/secure-user-authentication/
    git add components/auth/
    git add pages/api/auth/
    git add pages/api/admin/
    git add pages/api/cron/
    git add lib/
    git add middleware/
    git add migrations/
    git add scripts/
    git add __tests__/
    git add docs/
    git add components/AccessGate.tsx
    git add pages/_app.tsx
    git add .env.example
    git add package.json
    git add package-lock.json
    git add vercel.json
    git add next.config.js
    git add jest.config.js
    
    Write-Host "✓ Files staged" -ForegroundColor Green
    
    # Show what will be committed
    Write-Host ""
    Write-Host "Files to be committed:" -ForegroundColor Cyan
    git diff --cached --name-only
    Write-Host ""
    
    if (Get-Confirmation "Commit these changes?") {
        $commitMessage = @"
feat: implement secure user authentication system

- Add database schema with users, access_codes, sessions, auth_logs tables
- Implement JWT-based authentication with bcrypt password hashing
- Add registration, login, logout, and user info API endpoints
- Create AuthProvider context and authentication components
- Integrate Office 365 email for welcome messages
- Add CSRF protection and input sanitization
- Implement rate limiting with Vercel KV
- Add session cleanup cron job
- Include comprehensive test suite (unit, integration, e2e, security)
- Update documentation with deployment and user guides

Closes: Secure User Authentication Spec Phase 1-7
"@
        
        git commit -m $commitMessage
        Write-Host "✓ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "Commit cancelled" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Step 5: Push to remote
Write-Host "Step 5: Push to remote" -ForegroundColor Yellow
Write-Host "-----------------------" -ForegroundColor Yellow

if (Get-Confirmation "Push staging branch to remote?") {
    Write-Host "Pushing to origin/auth-system-staging..." -ForegroundColor Cyan
    git push origin auth-system-staging --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Pushed to remote" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to push to remote" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Push cancelled" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 6: Deployment instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Staging Deployment Initiated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Monitor Vercel Deployment" -ForegroundColor White
Write-Host "   - Go to: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   - Navigate to your project" -ForegroundColor Gray
Write-Host "   - Click 'Deployments' tab" -ForegroundColor Gray
Write-Host "   - Find deployment for 'auth-system-staging' branch" -ForegroundColor Gray
Write-Host "   - Wait for 'Ready' status (2-5 minutes)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Note Preview URL" -ForegroundColor White
Write-Host "   - Copy the preview URL from Vercel" -ForegroundColor Gray
Write-Host "   - Format: https://agents-md-v2-git-auth-system-staging-yourteam.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure Staging Environment" -ForegroundColor White
Write-Host "   - Create staging Postgres database" -ForegroundColor Gray
Write-Host "   - Create staging KV store" -ForegroundColor Gray
Write-Host "   - Set environment variables (Preview environment)" -ForegroundColor Gray
Write-Host "   - See: docs/STAGING-DEPLOYMENT-GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run Database Migrations" -ForegroundColor White
Write-Host "   - Set DATABASE_URL for staging" -ForegroundColor Gray
Write-Host "   - Run: npm run migrate:prod" -ForegroundColor Gray
Write-Host "   - Verify tables created" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Import Access Codes" -ForegroundColor White
Write-Host "   - Run: npm run import:codes" -ForegroundColor Gray
Write-Host "   - Verify all 11 codes imported" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Run Validation Tests" -ForegroundColor White
Write-Host "   - Follow test procedures in docs/STAGING-DEPLOYMENT-GUIDE.md" -ForegroundColor Gray
Write-Host "   - Test all authentication flows" -ForegroundColor Gray
Write-Host "   - Verify rate limiting" -ForegroundColor Gray
Write-Host "   - Test email delivery" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "docs/STAGING-DEPLOYMENT-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment script completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
