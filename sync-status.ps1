# Check Sync Status
# Shows current sync status between local and remote

Write-Host "📊 Sync Status Check" -ForegroundColor Cyan
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
Write-Host ""

# Fetch latest info from remote (without pulling)
Write-Host "🔍 Checking remote status..." -ForegroundColor Cyan
git fetch origin --quiet

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
    Write-Host ""
}

# Check commits ahead/behind
$ahead = git rev-list --count origin/$currentBranch..HEAD
$behind = git rev-list --count HEAD..origin/$currentBranch

Write-Host "📈 Sync Status:" -ForegroundColor Cyan
if ($ahead -gt 0) {
    Write-Host "  ⬆️  $ahead commit(s) ahead of remote (need to push)" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ No commits to push" -ForegroundColor Green
}

if ($behind -gt 0) {
    Write-Host "  ⬇️  $behind commit(s) behind remote (need to pull)" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Up to date with remote" -ForegroundColor Green
}

Write-Host ""

# Show last few commits
Write-Host "📜 Recent commits:" -ForegroundColor Cyan
git log -5 --pretty=format:"%C(yellow)%h%C(reset) - %s %C(green)(%cr)%C(reset) %C(blue)<%an>%C(reset)" --abbrev-commit
Write-Host ""
Write-Host ""

# Show remote info
Write-Host "🌐 Remote repository:" -ForegroundColor Cyan
$remoteUrl = git config --get remote.origin.url
Write-Host "  $remoteUrl" -ForegroundColor White
Write-Host ""

# Recommendations
Write-Host "💡 Recommendations:" -ForegroundColor Cyan
if ($status) {
    Write-Host "  - Run 'npm run sync-end' to commit and push changes" -ForegroundColor White
}
if ($behind -gt 0) {
    Write-Host "  - Run 'npm run sync-start' to pull latest changes" -ForegroundColor White
}
if ($ahead -gt 0 -and -not $status) {
    Write-Host "  - Run 'npm run sync-end' to push your commits" -ForegroundColor White
}
if (-not $status -and $ahead -eq 0 -and $behind -eq 0) {
    Write-Host "  - Everything is synced! ✅" -ForegroundColor Green
}
Write-Host ""
