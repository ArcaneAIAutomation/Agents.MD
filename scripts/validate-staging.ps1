# Staging Validation Script for Secure User Authentication
# This script runs automated tests against the staging environment

param(
    [Parameter(Mandatory=$true)]
    [string]$StagingUrl,
    
    [switch]$SkipEmailTest,
    [switch]$Verbose
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Staging Validation Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Staging URL: $StagingUrl" -ForegroundColor White
Write-Host ""

# Test results tracking
$testResults = @()
$passedTests = 0
$failedTests = 0

# Function to run a test
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body,
        [int]$ExpectedStatus,
        [string]$ExpectedMessage
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $uri = "$StagingUrl$Endpoint"
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        if ($Verbose) {
            Write-Host "  Request: $Method $uri" -ForegroundColor Gray
            if ($Body) {
                Write-Host "  Body: $($Body | ConvertTo-Json -Compress)" -ForegroundColor Gray
            }
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        if ($Verbose) {
            Write-Host "  Response: $statusCode" -ForegroundColor Gray
            Write-Host "  Content: $($content | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            if ($ExpectedMessage -and $content.message -ne $ExpectedMessage) {
                Write-Host "  ✗ FAILED: Expected message '$ExpectedMessage', got '$($content.message)'" -ForegroundColor Red
                return $false
            }
            Write-Host "  ✓ PASSED" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ✗ FAILED: Expected status $ExpectedStatus, got $statusCode" -ForegroundColor Red
            return $false
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASSED (Expected error status)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
            if ($Verbose) {
                Write-Host "  Error: $($_.Exception)" -ForegroundColor Gray
            }
            return $false
        }
    }
}

# Function to record test result
function Record-TestResult {
    param(
        [string]$Category,
        [string]$TestName,
        [bool]$Passed
    )
    
    $script:testResults += [PSCustomObject]@{
        Category = $Category
        Test = $TestName
        Result = if ($Passed) { "PASS" } else { "FAIL" }
    }
    
    if ($Passed) {
        $script:passedTests++
    } else {
        $script:failedTests++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite 1: Registration Flow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1.1: Valid registration
$result = Test-Endpoint `
    -Name "Valid registration with access code" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0001"
        email = "test1@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 200 `
    -ExpectedMessage "Registration successful"

Record-TestResult -Category "Registration" -TestName "Valid registration" -Passed $result
Write-Host ""

# Test 1.2: Invalid access code
$result = Test-Endpoint `
    -Name "Registration with invalid access code" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "INVALID"
        email = "test2@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 404

Record-TestResult -Category "Registration" -TestName "Invalid access code" -Passed $result
Write-Host ""

# Test 1.3: Already redeemed code
$result = Test-Endpoint `
    -Name "Registration with already-redeemed code" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0001"
        email = "test3@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 410

Record-TestResult -Category "Registration" -TestName "Already-redeemed code" -Passed $result
Write-Host ""

# Test 1.4: Duplicate email
$result = Test-Endpoint `
    -Name "Registration with duplicate email" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0002"
        email = "test1@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 409

Record-TestResult -Category "Registration" -TestName "Duplicate email" -Passed $result
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite 2: Login Flow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2.1: Valid login
$result = Test-Endpoint `
    -Name "Login with correct credentials" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test1@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 200 `
    -ExpectedMessage "Login successful"

Record-TestResult -Category "Login" -TestName "Valid login" -Passed $result
Write-Host ""

# Test 2.2: Invalid password
$result = Test-Endpoint `
    -Name "Login with wrong password" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "test1@staging.com"
        password = "WrongPassword"
    } `
    -ExpectedStatus 401

Record-TestResult -Category "Login" -TestName "Invalid password" -Passed $result
Write-Host ""

# Test 2.3: Non-existent email
$result = Test-Endpoint `
    -Name "Login with non-existent email" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "nonexistent@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 401

Record-TestResult -Category "Login" -TestName "Non-existent email" -Passed $result
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite 3: Rate Limiting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing rate limiting (5 failed attempts)..." -ForegroundColor Yellow
$rateLimitPassed = $true

for ($i = 1; $i -le 6; $i++) {
    Write-Host "  Attempt $i of 6..." -ForegroundColor Gray
    
    try {
        $uri = "$StagingUrl/api/auth/login"
        $body = @{
            email = "ratelimit@staging.com"
            password = "WrongPassword"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($i -le 5) {
        if ($statusCode -ne 401) {
            Write-Host "  ✗ Expected 401, got $statusCode" -ForegroundColor Red
            $rateLimitPassed = $false
        }
    } else {
        if ($statusCode -ne 429) {
            Write-Host "  ✗ Expected 429 (rate limited), got $statusCode" -ForegroundColor Red
            $rateLimitPassed = $false
        } else {
            Write-Host "  ✓ Rate limit triggered correctly" -ForegroundColor Green
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Record-TestResult -Category "Security" -TestName "Rate limiting" -Passed $rateLimitPassed
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite 4: SQL Injection Prevention" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 4.1: SQL injection in email
$result = Test-Endpoint `
    -Name "SQL injection in email field" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "admin@example.com' OR '1'='1"
        password = "anything"
    } `
    -ExpectedStatus 401

Record-TestResult -Category "Security" -TestName "SQL injection in email" -Passed $result
Write-Host ""

# Test 4.2: SQL injection in access code
$result = Test-Endpoint `
    -Name "SQL injection in access code" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0001' OR '1'='1"
        email = "sql-test@staging.com"
        password = "TestPass123!"
    } `
    -ExpectedStatus 404

Record-TestResult -Category "Security" -TestName "SQL injection in access code" -Passed $result
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite 5: Input Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 5.1: Invalid email format
$result = Test-Endpoint `
    -Name "Registration with invalid email" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0003"
        email = "not-an-email"
        password = "TestPass123!"
    } `
    -ExpectedStatus 400

Record-TestResult -Category "Validation" -TestName "Invalid email format" -Passed $result
Write-Host ""

# Test 5.2: Weak password
$result = Test-Endpoint `
    -Name "Registration with weak password" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        accessCode = "CODE0003"
        email = "weak-pass@staging.com"
        password = "weak"
    } `
    -ExpectedStatus 400

Record-TestResult -Category "Validation" -TestName "Weak password" -Passed $result
Write-Host ""

# Test 5.3: Missing required fields
$result = Test-Endpoint `
    -Name "Registration with missing fields" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{
        email = "missing@staging.com"
    } `
    -ExpectedStatus 400

Record-TestResult -Category "Validation" -TestName "Missing required fields" -Passed $result
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Group results by category
$categories = $testResults | Group-Object -Property Category

foreach ($category in $categories) {
    Write-Host "$($category.Name):" -ForegroundColor Yellow
    foreach ($test in $category.Group) {
        $color = if ($test.Result -eq "PASS") { "Green" } else { "Red" }
        $symbol = if ($test.Result -eq "PASS") { "✓" } else { "✗" }
        Write-Host "  $symbol $($test.Test): $($test.Result)" -ForegroundColor $color
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($passedTests + $failedTests)" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / ($passedTests + $failedTests)) * 100, 2))%" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "✓ All tests passed! Staging environment is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Perform manual frontend testing" -ForegroundColor White
    Write-Host "2. Test email delivery (if not skipped)" -ForegroundColor White
    Write-Host "3. Verify database records" -ForegroundColor White
    Write-Host "4. Monitor Vercel logs for errors" -ForegroundColor White
    Write-Host "5. Get team approval for production deployment" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Some tests failed. Please review and fix issues before proceeding." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Vercel deployment logs" -ForegroundColor White
    Write-Host "2. Verify environment variables are set correctly" -ForegroundColor White
    Write-Host "3. Ensure database migrations ran successfully" -ForegroundColor White
    Write-Host "4. Verify access codes were imported" -ForegroundColor White
    Write-Host "5. Check KV store connection" -ForegroundColor White
    Write-Host ""
    exit 1
}
