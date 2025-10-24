# Quick Sync - One Command to Sync Everything
# Pulls latest changes, commits your work, and pushes

param(
    [string]$Message = ""
)

Write-Host "⚡ Quick Sync - Full Sync in One Command" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

$currentBranch = git rev-parse --abbrev-ref HEAD

# Step 1: Check for uncommitted changes and commit them
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Step 1: Committing local changes..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "Quick sync - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    git add .
    git commit -m $Message
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Step 1: No uncommitted changes" -ForegroundColor Green
}

Write-Host ""

# Step 2: Pull latest changes with rebase
Write-Host "📥 Step 2: Pulling latest changes..." -ForegroundColor Yellow
git pull origin $currentBranch --rebase

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pulled latest changes" -ForegroundColor Green
} else {
    Write-Host "❌ Pull failed - possible conflicts" -ForegroundColor Red
    Write-Host "Please resolve conflicts and run:" -ForegroundColor Yellow
    Write-Host "  git rebase --continue" -ForegroundColor White
    Write-Host "  npm run sync-quick" -ForegroundColor White
    exit 1
}

Write-Host ""

# Step 3: Push changes
Write-Host "📤 Step 3: Pushing changes to remote..." -ForegroundColor Yellow
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to remote" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Quick Sync Complete!" -ForegroundColor Green
Write-Host ""

# Show summary
$lastCommit = git log -1 --pretty=format:"%h - %s"
Write-Host "Last commit: $lastCommit" -ForegroundColor White
Write-Host "Branch: $currentBranch" -ForegroundColor White
Write-Host ""
Write-Host "✅ Your work is now synced across all computers!" -ForegroundColor Green
Write-Host ""
