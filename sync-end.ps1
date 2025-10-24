# Auto-Sync End Work Session
# Run this script when you finish working (home or office)

Write-Host "🔄 Ending Work Session - Auto-Sync" -ForegroundColor Cyan
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
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    # Ask for commit message
    $commitMsg = Read-Host "Enter commit message (or press Enter for auto-message)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $location = Read-Host "Where are you working from? (home/work)"
        if ([string]::IsNullOrWhiteSpace($location)) {
            $location = "unknown"
        }
        $commitMsg = "Auto-sync from $location - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    # Stage all changes
    Write-Host ""
    Write-Host "📦 Staging changes..." -ForegroundColor Cyan
    git add .
    
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Cyan
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Push to remote
Write-Host ""
Write-Host "📤 Pushing changes to remote..." -ForegroundColor Cyan
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to remote" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host "This might happen if remote has new changes." -ForegroundColor Yellow
    Write-Host "Run 'npm run sync-start' to pull latest changes first." -ForegroundColor White
    exit 1
}

# Show sync summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 Sync Summary" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$lastCommit = git log -1 --pretty=format:"%h - %s (%cr)"
Write-Host "Last commit: $lastCommit" -ForegroundColor White

$ahead = git rev-list --count origin/$currentBranch..HEAD
$behind = git rev-list --count HEAD..origin/$currentBranch

Write-Host "Commits ahead of remote: $ahead" -ForegroundColor White
Write-Host "Commits behind remote: $behind" -ForegroundColor White

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Work session synced successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next time you work:" -ForegroundColor Cyan
Write-Host "  Run 'npm run sync-start' to get latest changes" -ForegroundColor White
Write-Host ""
