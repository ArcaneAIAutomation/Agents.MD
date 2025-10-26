# Master Production Deployment and Verification Script
# Orchestrates the entire deployment process

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipEnvironmentCheck = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipAccessCodeTest = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMonitoring = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$MonitorDurationMinutes = 60
)

$ErrorActionPreference = "Stop"

# Script paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envCheckScript = Join-Path $scriptDir "check-environment-variables.ps1"
$verifyScript = Join-Path $scriptDir "verify-production-deployment.ps1"
$accessCodeScript = Join-Path $scriptDir "test-all-access-codes.ps1"
$monitorScript = Join-Path $scriptDir "monitor-production.ps1"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║     PRODUCTION DEPLOYMENT & VERIFICATION                       ║" -ForegroundColor Magenta
Write-Host "║     Secure User Authentication System v1.0.0                   ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "Production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor Cyan

Write-Host "Start Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor Cyan

Write-Host "`n"

$overallSuccess = $true
$stepResults = @()

# ============================================================================
# STEP 1: Environment Variables Check
# ============================================================================
if (-not $SkipEnvironmentCheck) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "STEP 1: Checking Environment Variables" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    try {
        & $envCheckScript -Environment "Production"
        $envCheckResult = $LASTEXITCODE
        
        if ($envCheckResult -eq 0) {
            Write-Host "`n✅ Environment variables check passed`n" -ForegroundColor Green
            $stepResults += @{ Step = "Environment Check"; Status = "Passed" }
        }
        else {
            Write-Host "`n❌ Environment variables check failed`n" -ForegroundColor Red
            Write-Host "Please configure missing variables in Vercel Dashboard before proceeding.`n" -ForegroundColor Yellow
            $stepResults += @{ Step = "Environment Check"; Status = "Failed" }
            $overallSuccess = $false
            
            Write-Host "To configure environment variables:" -ForegroundColor Yellow
            Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor Gray
            Write-Host "2. Select your project" -ForegroundColor Gray
            Write-Host "3. Go to Settings and then Environment Variables" -ForegroundColor Gray
            Write-Host "4. Add the missing variables listed above" -ForegroundColor Gray
            Write-Host "5. Redeploy the application`n" -ForegroundColor Gray
            
            exit 1
        }
    }
    catch {
        Write-Host "`n❌ Environment check script failed: $($_.Exception.Message)`n" -ForegroundColor Red
        $stepResults += @{ Step = "Environment Check"; Status = "Error" }
        $overallSuccess = $false
        exit 1
    }
}
else {
    Write-Host "⏭️  Skipping environment variables check`n" -ForegroundColor Yellow
    $stepResults += @{ Step = "Environment Check"; Status = "Skipped" }
}

# ============================================================================
# STEP 2: Git Status Check
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Checking Git Status" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
    $gitBranch = git branch --show-current
    Write-Host "Current Branch: " -NoNewline
    Write-Host $gitBranch -ForegroundColor Cyan
    
    if ($gitBranch -ne "main") {
        Write-Host "⚠️  Warning: Not on main branch" -ForegroundColor Yellow
        Write-Host "   Vercel deploys from main branch automatically" -ForegroundColor Yellow
        Write-Host "   Consider switching to main: git checkout main`n" -ForegroundColor Yellow
    }
    
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️  Warning: Uncommitted changes detected" -ForegroundColor Yellow
        Write-Host "   These changes are not deployed to production`n" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ No uncommitted changes`n" -ForegroundColor Green
    }
    
    $latestCommit = git log -1 --oneline
    Write-Host "Latest Commit: " -NoNewline
    Write-Host $latestCommit -ForegroundColor Gray
    
    Write-Host "`n✅ Git status check completed`n" -ForegroundColor Green
    $stepResults += @{ Step = "Git Status"; Status = "Passed" }
}
catch {
    Write-Host "⚠️  Could not check git status: $($_.Exception.Message)`n" -ForegroundColor Yellow
    $stepResults += @{ Step = "Git Status"; Status = "Warning" }
}

# ============================================================================
# STEP 3: Verify Deployment
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Verifying Production Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "Running comprehensive deployment verification...`n" -ForegroundColor Gray

try {
    & $verifyScript -ProductionUrl $ProductionUrl -Verbose
    $verifyResult = $LASTEXITCODE
    
    if ($verifyResult -eq 0) {
        Write-Host "`n✅ Deployment verification passed`n" -ForegroundColor Green
        $stepResults += @{ Step = "Deployment Verification"; Status = "Passed" }
    }
    else {
        Write-Host "`n❌ Deployment verification failed`n" -ForegroundColor Red
        $stepResults += @{ Step = "Deployment Verification"; Status = "Failed" }
        $overallSuccess = $false
        
        Write-Host "Critical issues detected. Please review the errors above.`n" -ForegroundColor Red
        Write-Host "Consider rolling back if issues are severe:" -ForegroundColor Yellow
        Write-Host "1. Go to Vercel Dashboard and then Deployments" -ForegroundColor Gray
        Write-Host "2. Find previous stable deployment" -ForegroundColor Gray
        Write-Host "3. Click menu and then Promote to Production`n" -ForegroundColor Gray
    }
}
catch {
    Write-Host "`n❌ Verification script failed: $($_.Exception.Message)`n" -ForegroundColor Red
    $stepResults += @{ Step = "Deployment Verification"; Status = "Error" }
    $overallSuccess = $false
}

# ============================================================================
# STEP 4: Test Access Codes
# ============================================================================
if (-not $SkipAccessCodeTest) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "STEP 4: Testing Access Codes" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "Testing all 11 access codes...`n" -ForegroundColor Gray
    
    try {
        & $accessCodeScript -ProductionUrl $ProductionUrl
        $accessCodeResult = $LASTEXITCODE
        
        if ($accessCodeResult -eq 0) {
            Write-Host "`n✅ Access code testing passed`n" -ForegroundColor Green
            $stepResults += @{ Step = "Access Code Testing"; Status = "Passed" }
        }
        else {
            Write-Host "`n⚠️  Access code testing completed with issues`n" -ForegroundColor Yellow
            $stepResults += @{ Step = "Access Code Testing"; Status = "Warning" }
            
            Write-Host "Some codes may already be redeemed. This is expected if re-running tests.`n" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "`n❌ Access code testing failed: $($_.Exception.Message)`n" -ForegroundColor Red
        $stepResults += @{ Step = "Access Code Testing"; Status = "Error" }
        $overallSuccess = $false
    }
}
else {
    Write-Host "⏭️  Skipping access code testing`n" -ForegroundColor Yellow
    $stepResults += @{ Step = "Access Code Testing"; Status = "Skipped" }
}

# ============================================================================
# STEP 5: Production Monitoring
# ============================================================================
if (-not $SkipMonitoring -and $overallSuccess) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "STEP 5: Production Monitoring" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "Starting $MonitorDurationMinutes-minute monitoring session...`n" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop monitoring early`n" -ForegroundColor Yellow
    
    try {
        & $monitorScript -ProductionUrl $ProductionUrl -DurationMinutes $MonitorDurationMinutes
        $monitorResult = $LASTEXITCODE
        
        if ($monitorResult -eq 0) {
            Write-Host "`n✅ Production monitoring completed successfully`n" -ForegroundColor Green
            $stepResults += @{ Step = "Production Monitoring"; Status = "Passed" }
        }
        else {
            Write-Host "`n⚠️  Production monitoring detected issues`n" -ForegroundColor Yellow
            $stepResults += @{ Step = "Production Monitoring"; Status = "Warning" }
        }
    }
    catch {
        Write-Host "`n⚠️  Monitoring interrupted: $($_.Exception.Message)`n" -ForegroundColor Yellow
        $stepResults += @{ Step = "Production Monitoring"; Status = "Interrupted" }
    }
}
elseif (-not $overallSuccess) {
    Write-Host "⏭️  Skipping monitoring due to previous failures`n" -ForegroundColor Yellow
    $stepResults += @{ Step = "Production Monitoring"; Status = "Skipped" }
}
else {
    Write-Host "⏭️  Skipping production monitoring`n" -ForegroundColor Yellow
    $stepResults += @{ Step = "Production Monitoring"; Status = "Skipped" }
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     DEPLOYMENT SUMMARY                                         ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "Production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor Cyan

Write-Host "Completion Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor Cyan

Write-Host "`nStep Results:" -ForegroundColor Cyan

foreach ($result in $stepResults) {
    $icon = switch ($result.Status) {
        "Passed" { "✅" }
        "Failed" { "❌" }
        "Warning" { "⚠️ " }
        "Skipped" { "⏭️ " }
        "Error" { "❌" }
        "Interrupted" { "⚠️ " }
        default { "❓" }
    }
    
    $color = switch ($result.Status) {
        "Passed" { "Green" }
        "Failed" { "Red" }
        "Warning" { "Yellow" }
        "Skipped" { "Gray" }
        "Error" { "Red" }
        "Interrupted" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "  $icon " -NoNewline
    Write-Host "$($result.Step): " -NoNewline
    Write-Host $result.Status -ForegroundColor $color
}

Write-Host "`n"

if ($overallSuccess) {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║     🎉 PRODUCTION DEPLOYMENT SUCCESSFUL! 🎉                    ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. ✅ Monitor Vercel logs for the next 24 hours" -ForegroundColor Gray
    Write-Host "2. ✅ Update README.md with authentication overview" -ForegroundColor Gray
    Write-Host "3. ✅ Notify stakeholders of successful deployment" -ForegroundColor Gray
    Write-Host "4. ✅ Document any issues encountered" -ForegroundColor Gray
    Write-Host "5. ✅ Schedule post-deployment review`n" -ForegroundColor Gray
    
    Write-Host "Useful Links:" -ForegroundColor Cyan
    Write-Host "• Production: $ProductionUrl" -ForegroundColor Gray
    Write-Host "• Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "• Deployment Logs: Vercel Dashboard > Your Project > Logs" -ForegroundColor Gray
    Write-Host "• Database: Vercel Dashboard > Storage > Your Database`n" -ForegroundColor Gray
    
    exit 0
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                                ║" -ForegroundColor Red
    Write-Host "║     ❌ DEPLOYMENT VERIFICATION FAILED ❌                       ║" -ForegroundColor Red
    Write-Host "║                                                                ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    
    Write-Host "`nImmediate Actions Required:" -ForegroundColor Red
    Write-Host "1. Review error messages above" -ForegroundColor Yellow
    Write-Host "2. Check Vercel deployment logs" -ForegroundColor Yellow
    Write-Host "3. Verify environment variables are set correctly" -ForegroundColor Yellow
    Write-Host "4. Consider rolling back to previous deployment" -ForegroundColor Yellow
    Write-Host "5. Contact team for assistance if needed`n" -ForegroundColor Yellow
    
    Write-Host "Rollback Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "2. Select your project and then Deployments" -ForegroundColor Gray
    Write-Host "3. Find previous stable deployment" -ForegroundColor Gray
    Write-Host "4. Click menu and then Promote to Production`n" -ForegroundColor Gray
    
    exit 1
}
