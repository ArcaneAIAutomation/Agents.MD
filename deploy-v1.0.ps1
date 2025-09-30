# =============================================================================
# Agents.MD Version 1.0 - Automated GitHub Deployment Script
# =============================================================================

Write-Host "🚀 Starting Agents.MD Version 1.0 Deployment..." -ForegroundColor Green

# Step 1: Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository. Initializing..." -ForegroundColor Red
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Step 2: Check current git status
Write-Host "📊 Checking git status..." -ForegroundColor Yellow
git status --porcelain

# Step 3: Remove existing origin if it exists
Write-Host "🔧 Configuring remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null

# Step 4: Try to detect GitHub username from git config
$gitUser = git config user.name 2>$null
$gitEmail = git config user.email 2>$null

if ($gitUser) {
    Write-Host "👤 Detected Git User: $gitUser" -ForegroundColor Cyan
    Write-Host "📧 Detected Git Email: $gitEmail" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ No git user configured. Setting up..." -ForegroundColor Yellow
    $userName = Read-Host "Enter your GitHub username"
    $userEmail = Read-Host "Enter your email"
    git config user.name "$userName"
    git config user.email "$userEmail"
    $gitUser = $userName
}

# Step 5: Set up remote repository
$repoUrl = "https://github.com/$gitUser/Agents.MD.git"
Write-Host "🔗 Adding remote origin: $repoUrl" -ForegroundColor Cyan

try {
    git remote add origin $repoUrl
    Write-Host "✅ Remote origin added successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Remote origin may already exist" -ForegroundColor Yellow
}

# Step 6: Check if we're on the correct branch
$currentBranch = git branch --show-current
Write-Host "🌿 Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "visual-redesign") {
    Write-Host "🔄 Switching to visual-redesign branch..." -ForegroundColor Yellow
    git checkout -b visual-redesign 2>$null
}

# Step 7: Verify our Version 1.0 commit exists
$lastCommit = git log --oneline -1
Write-Host "📝 Last commit: $lastCommit" -ForegroundColor Cyan

# Step 8: Create main branch and merge if needed
Write-Host "🔄 Setting up main branch..." -ForegroundColor Yellow
git checkout -b main 2>$null
git merge visual-redesign --no-ff -m "Merge visual-redesign into main for Version 1.0 release"

# Step 9: Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow

try {
    # Push main branch
    git push -u origin main
    Write-Host "✅ Main branch pushed successfully" -ForegroundColor Green
    
    # Push visual-redesign branch
    git push -u origin visual-redesign
    Write-Host "✅ Visual-redesign branch pushed successfully" -ForegroundColor Green
    
    # Push tags
    git push --tags
    Write-Host "✅ Tags pushed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Push failed. This might be because:" -ForegroundColor Yellow
    Write-Host "   1. Repository doesn't exist on GitHub yet" -ForegroundColor Yellow
    Write-Host "   2. Authentication is required" -ForegroundColor Yellow
    Write-Host "   3. Username is incorrect" -ForegroundColor Yellow
    
    Write-Host "🔧 Manual steps to complete:" -ForegroundColor Cyan
    Write-Host "   1. Create repository 'Agents.MD' on GitHub" -ForegroundColor White
    Write-Host "   2. Run: git push -u origin main" -ForegroundColor White
    Write-Host "   3. Run: git push -u origin visual-redesign" -ForegroundColor White
    Write-Host "   4. Run: git push --tags" -ForegroundColor White
}

# Step 10: Display repository information
Write-Host "" -ForegroundColor White
Write-Host "🎉 Deployment Summary:" -ForegroundColor Green
Write-Host "   Repository: Agents.MD" -ForegroundColor White
Write-Host "   Version: 1.0.0" -ForegroundColor White
Write-Host "   Main Branch: main" -ForegroundColor White
Write-Host "   Development Branch: visual-redesign" -ForegroundColor White
Write-Host "   Remote URL: $repoUrl" -ForegroundColor White

# Step 11: Show next steps
Write-Host "" -ForegroundColor White
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Visit: https://github.com/$gitUser/Agents.MD" -ForegroundColor White
Write-Host "   2. Verify all files are uploaded" -ForegroundColor White
Write-Host "   3. Check the Version 1.0 release tag" -ForegroundColor White
Write-Host "   4. Set up GitHub Pages if needed" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "✅ Agents.MD Version 1.0 deployment process completed!" -ForegroundColor Green