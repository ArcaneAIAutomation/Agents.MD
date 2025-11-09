# PowerShell script to revert UCIE API endpoints from withAuth to withOptionalAuth

$files = @(
    "pages\api\ucie\technical\[symbol].ts",
    "pages\api\ucie\on-chain\[symbol].ts",
    "pages\api\ucie\market-data\[symbol].ts",
    "pages\api\ucie\risk\[symbol].ts",
    "pages\api\ucie\predictions\[symbol].ts",
    "pages\api\ucie\derivatives\[symbol].ts",
    "pages\api\ucie\defi\[symbol].ts",
    "pages\api\ucie\preview-data\[symbol].ts",
    "pages\api\ucie\research\[symbol].ts"
)

Write-Host "🔄 Reverting UCIE API endpoints to withOptionalAuth..." -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  Updating $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Replace imports
        $content = $content -replace 'import \{ withAuth,', 'import { withOptionalAuth,'
        
        # Replace export
        $content = $content -replace 'export default withAuth\(handler\);', 'export default withOptionalAuth(handler);'
        
        # Replace comment
        $content = $content -replace '// Export with required authentication middleware', '// Export with optional authentication middleware (for user tracking)'
        
        # Replace user extraction
        $content = $content -replace 'const userId = req\.user!\.id;', "const userId = req.user?.id || 'anonymous';"
        $content = $content -replace 'const userEmail = req\.user!\.email;', 'const userEmail = req.user?.email;'
        
        # Replace user info comment
        $content = $content -replace '// Get user info \(guaranteed by withAuth middleware\)', '// Get user info if authenticated (for database tracking)'
        
        Set-Content $file -Value $content -NoNewline
        
        Write-Host "  ✅ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ All files updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Changed withAuth to withOptionalAuth"
Write-Host "- API endpoints can now be called internally without auth"
Write-Host "- User tracking still works when user is authenticated"
Write-Host "- AccessGate at page level ensures users must login to access features"
