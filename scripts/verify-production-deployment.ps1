# Production Deployment Verification Script
# Tests the secure user authentication system on production

$PRODUCTION_URL = "https://news.arcane.group"
$TEST_EMAIL = "prod-verify-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_PASSWORD = "ProductionTest123!"
$TEST_ACCESS_CODE = "CODE0001"  # Change if already used

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Production URL: $PRODUCTION_URL" -ForegroundColor Yellow
Write-Host "Test Email: $TEST_EMAIL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$PRODUCTION_URL/api/health" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health check passed" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Registration Endpoint Exists
Write-Host "Test 2: Registration Endpoint Check..." -ForegroundColor Green
try {
    $body = @{
        accessCode = $TEST_ACCESS_CODE
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$PRODUCTION_URL/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Registration successful" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "  User ID: $($result.user.id)" -ForegroundColor Gray
        Write-Host "  Email: $($result.user.email)" -ForegroundColor Gray
        
        # Save cookie for next tests
        $global:AuthCookie = $response.Headers['Set-Cookie']
    } elseif ($response.StatusCode -eq 410) {
        Write-Host "⚠ Access code already used (expected if testing multiple times)" -ForegroundColor Yellow
        Write-Host "  Try changing TEST_ACCESS_CODE to an unused code" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 410) {
        Write-Host "⚠ Access code already used (expected if testing multiple times)" -ForegroundColor Yellow
        Write-Host "  Try changing TEST_ACCESS_CODE to an unused code" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Status Code: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Login Endpoint Check
Write-Host "Test 3: Login Endpoint Check..." -ForegroundColor Green
try {
    $body = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$PRODUCTION_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Login successful" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "  User ID: $($result.user.id)" -ForegroundColor Gray
        Write-Host "  Email: $($result.user.email)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  (This is expected if registration failed)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Check if Access Gate is visible
Write-Host "Test 4: Access Gate Frontend Check..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri $PRODUCTION_URL -Method GET -ErrorAction Stop
    if ($response.Content -match "AccessGate" -or $response.Content -match "access.*code" -or $response.Content -match "register") {
        Write-Host "✓ Access Gate appears to be present" -ForegroundColor Green
    } else {
        Write-Host "⚠ Access Gate may not be visible (check manually)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Frontend check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open $PRODUCTION_URL in your browser" -ForegroundColor White
Write-Host "2. Verify Access Gate is displayed" -ForegroundColor White
Write-Host "3. Test registration with an unused access code" -ForegroundColor White
Write-Host "4. Test login with registered credentials" -ForegroundColor White
Write-Host "5. Check Vercel Dashboard for deployment status" -ForegroundColor White
Write-Host "6. Review error logs in Vercel Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "For detailed verification checklist, see:" -ForegroundColor Yellow
Write-Host "  PRODUCTION-DEPLOYMENT-VERIFICATION.md" -ForegroundColor White
Write-Host ""
