# Auto-Sync Start Work Session
# Run this script when you start working (home or office)

Write-Host "🔄 Starting Work Session - Auto-Sync" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $response = Read-Host "Do you want to commit these changes before syncing? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        $commitMsg = Read-Host "Enter commit message (or press Enter for auto-message)"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Auto-sync: Work in progress - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        }
        
        git add .
        git commit -m $commitMsg
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

# Fetch latest changes
Write-Host ""
Write-Host "📥 Fetching latest changes from remote..." -ForegroundColor Cyan
git fetch origin

# Check if remote has changes
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/$currentBranch

if ($localCommit -ne $remoteCommit) {
    Write-Host "🔄 Remote has new changes. Pulling..." -ForegroundColor Yellow
    
    # Pull with rebase to avoid merge commits
    git pull origin $currentBranch --rebase
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully synced with remote" -ForegroundColor Green
    } else {
        Write-Host "❌ Merge conflict detected!" -ForegroundColor Red
        Write-Host "Please resolve conflicts manually and run:" -ForegroundColor Yellow
        Write-Host "  git rebase --continue" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "✅ Already up to date with remote" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Ready to work!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  - Save your work frequently" -ForegroundColor White
Write-Host "  - Run 'npm run sync-end' when done working" -ForegroundColor White
Write-Host "  - Use 'npm run sync-status' to check sync status" -ForegroundColor White
Write-Host ""
