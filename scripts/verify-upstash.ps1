# ============================================================================
# Upstash Redis Verification Script
# Bitcoin Sovereign Technology - Distributed Rate Limiting
# ============================================================================

$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║  Upstash Redis Verification                                   ║" -ForegroundColor $Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan

# ============================================================================
# TEST 1: Check Vercel Logs
# ============================================================================

Write-Host "`n[Test 1/3] Checking Vercel Logs..." -ForegroundColor $Cyan

Write-Host "`nFetching latest logs..." -ForegroundColor $Yellow
$logs = vercel logs 2>&1 | Select-Object -First 50

$upstashFound = $logs | Select-String "Vercel KV initialized"
$fallbackFound = $logs | Select-String "in-memory fallback"

if ($upstashFound) {
    Write-Host "✅ Upstash Redis is initialized!" -ForegroundColor $Green
    Write-Host "   Found: $($upstashFound[0])" -ForegroundColor $Cyan
} elseif ($fallbackFound) {
    Write-Host "⚠️  Still using in-memory fallback" -ForegroundColor $Yellow
    Write-Host "   This means Upstash is not yet active" -ForegroundColor $Yellow
    Write-Host "   Wait 2-3 minutes for deployment, then run this script again" -ForegroundColor $Yellow
} else {
    Write-Host "ℹ️  Could not determine status from logs" -ForegroundColor $Yellow
    Write-Host "   Try: vercel logs --follow" -ForegroundColor $Yellow
}

# ============================================================================
# TEST 2: Test Rate Limiting
# ============================================================================

Write-Host "`n[Test 2/3] Testing Rate Limiting..." -ForegroundColor $Cyan

Write-Host "`nAttempting 6 login requests (6th should be blocked)..." -ForegroundColor $Yellow

$blocked = $false
for ($i=1; $i -le 6; $i++) {
    Write-Host "`nAttempt $i..." -ForegroundColor $Cyan
    
    try {
        $response = curl -X POST https://news.arcane.group/api/auth/login `
            -H "Content-Type: application/json" `
            -d '{"email":"test@example.com","password":"wrong"}' `
            -s -w "%{http_code}" `
            -o response.txt 2>$null
        
        $statusCode = $response
        $body = Get-Content response.txt -Raw 2>$null
        
        if ($statusCode -eq "429") {
            Write-Host "✅ Rate limited! (429 Too Many Requests)" -ForegroundColor $Green
            $blocked = $true
            break
        } elseif ($statusCode -eq "401") {
            Write-Host "   401 Unauthorized (expected for wrong password)" -ForegroundColor $Gray
        } else {
            Write-Host "   Status: $statusCode" -ForegroundColor $Gray
        }
        
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor $Red
    }
}

Remove-Item response.txt -ErrorAction SilentlyContinue

if ($blocked) {
    Write-Host "`n✅ Rate limiting is working!" -ForegroundColor $Green
} else {
    Write-Host "`n⚠️  Rate limiting may not be active yet" -ForegroundColor $Yellow
    Write-Host "   Wait for deployment to complete and try again" -ForegroundColor $Yellow
}

# ============================================================================
# TEST 3: Check Upstash Dashboard
# ============================================================================

Write-Host "`n[Test 3/3] Upstash Dashboard Check..." -ForegroundColor $Cyan

Write-Host "`nPlease manually check:" -ForegroundColor $Yellow
Write-Host "  1. Go to: https://console.upstash.com/redis" -ForegroundColor $White
Write-Host "  2. Click: agents-md-rate-limited" -ForegroundColor $White
Write-Host "  3. Go to: Data Browser tab" -ForegroundColor $White
Write-Host "  4. Look for keys like: ratelimit:/api/auth/login:*" -ForegroundColor $White

Write-Host "`nIf you see rate limit keys, Upstash is working! ✅" -ForegroundColor $Green

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║  Verification Complete                                        ║" -ForegroundColor $Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan

Write-Host "`nNext Steps:" -ForegroundColor $Yellow
Write-Host "  • If tests passed: You're done! ✅" -ForegroundColor $White
Write-Host "  • If tests failed: Wait 2-3 minutes and run again" -ForegroundColor $White
Write-Host "  • For help: See UPSTASH-SUCCESS-REPORT.md" -ForegroundColor $White

Write-Host "`nMonitoring:" -ForegroundColor $Yellow
Write-Host "  • Vercel logs: vercel logs --follow" -ForegroundColor $White
Write-Host "  • Upstash dashboard: https://console.upstash.com/redis" -ForegroundColor $White

Write-Host ""
