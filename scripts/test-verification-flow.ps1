# Test Email Verification Flow
# Tests that unverified users cannot login

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Email Verification Flow" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://news.arcane.group"

# Test: Try to login with unverified account
Write-Host "📝 Test: Login with Unverified Email" -ForegroundColor Yellow
Write-Host "   POST /api/auth/login" -ForegroundColor Gray
Write-Host ""

$loginBody = @{
    email = "test.user@bitcoin-sovereign.tech"
    password = "TestPassword123!"
    rememberMe = $false
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -Headers $headers -UseBasicParsing
    Write-Host "   ⚠️  Login succeeded (should have been blocked!)" -ForegroundColor Yellow
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($statusCode -eq 403 -and $errorResponse.requiresVerification) {
        Write-Host "   ✅ Correctly blocked unverified user (403)" -ForegroundColor Green
        Write-Host "   Message: $($errorResponse.message)" -ForegroundColor Gray
        Write-Host "   Requires Verification: $($errorResponse.requiresVerification)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Unexpected response" -ForegroundColor Yellow
        Write-Host "   Status: $statusCode" -ForegroundColor Gray
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Verification Flow Test Complete" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
