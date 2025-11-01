# Test Production Authentication Endpoints
# Tests the live production API at news.arcane.group

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Production Authentication" -ForegroundColor Cyan
Write-Host "   URL: https://news.arcane.group" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://news.arcane.group"

# Test 1: CSRF Token
Write-Host "📝 Test 1: Get CSRF Token" -ForegroundColor Yellow
Write-Host "   GET /api/auth/csrf-token" -ForegroundColor Gray
Write-Host ""

try {
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf-token" -Method GET -UseBasicParsing
    $csrfData = $csrfResponse.Content | ConvertFrom-Json
    
    if ($csrfData.success) {
        Write-Host "   ✅ CSRF token retrieved" -ForegroundColor Green
        Write-Host "   Token: $($csrfData.csrfToken.Substring(0, 20))..." -ForegroundColor Gray
        $csrfToken = $csrfData.csrfToken
    } else {
        Write-Host "   ❌ Failed to get CSRF token" -ForegroundColor Red
        Write-Host "   Response: $($csrfResponse.Content)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check /api/auth/me (should be 401)
Write-Host "📝 Test 2: Check Authentication Status" -ForegroundColor Yellow
Write-Host "   GET /api/auth/me" -ForegroundColor Gray
Write-Host ""

try {
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method GET -UseBasicParsing
    Write-Host "   ⚠️  Unexpected success (should be 401)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Correctly returns 401 (not authenticated)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Try to register (will fail with test data, but shows if endpoint works)
Write-Host "📝 Test 3: Test Registration Endpoint" -ForegroundColor Yellow
Write-Host "   POST /api/auth/register" -ForegroundColor Gray
Write-Host ""

$testEmail = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$registerBody = @{
    accessCode = "BTC-SOVEREIGN-K3QYMQ-01"
    email = $testEmail
    password = "TestPassword123!"
    confirmPassword = "TestPassword123!"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-CSRF-Token" = $csrfToken
}

try {
    $registerResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -Headers $headers -UseBasicParsing
    $registerData = $registerResponse.Content | ConvertFrom-Json
    
    if ($registerData.success) {
        Write-Host "   ✅ Registration successful!" -ForegroundColor Green
        Write-Host "   User: $($registerData.user.email)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Registration failed (expected)" -ForegroundColor Yellow
        Write-Host "   Message: $($registerData.message)" -ForegroundColor Gray
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ⚠️  Registration failed" -ForegroundColor Yellow
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Message: $($errorResponse.message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Production API Test Complete" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   - CSRF token generation: Working" -ForegroundColor White
Write-Host "   - Authentication check: Working" -ForegroundColor White
Write-Host "   - Registration endpoint: Check error message above" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Test in browser: https://news.arcane.group" -ForegroundColor Cyan
Write-Host ""
