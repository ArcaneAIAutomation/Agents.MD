# Quick Production Verification Script
# Simple checks without complex regex

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group"
)

$ErrorActionPreference = "Continue"

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "PRODUCTION DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Production URL: $ProductionUrl" -ForegroundColor Gray
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$passedTests = 0
$failedTests = 0
$totalTests = 0

function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    $script:totalTests++
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 30
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "[PASS] $TestName" -ForegroundColor Green
            Write-Host "       Status: $($response.StatusCode)" -ForegroundColor Gray
            $script:passedTests++
            return $true
        }
        else {
            Write-Host "[FAIL] $TestName" -ForegroundColor Red
            Write-Host "       Expected: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "[PASS] $TestName" -ForegroundColor Green
            Write-Host "       Status: $statusCode (expected)" -ForegroundColor Gray
            $script:passedTests++
            return $true
        }
        else {
            Write-Host "[FAIL] $TestName" -ForegroundColor Red
            Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
    }
}

# Test 1: Homepage
Write-Host "`n--- Basic Connectivity ---" -ForegroundColor Cyan
Test-Endpoint -TestName "Homepage Accessible" -Url $ProductionUrl

# Test 2: Health Check
$healthResult = Test-Endpoint -TestName "Health Check Endpoint" -Url "$ProductionUrl/api/health"

# Test 3: Registration with invalid code
Write-Host "`n--- Authentication Endpoints ---" -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$invalidBody = @{
    accessCode = "INVALID123"
    email = "invalid-$timestamp@example.com"
    password = "TestPass123!"
}
Test-Endpoint -TestName "Registration Rejects Invalid Code" -Url "$ProductionUrl/api/auth/register" -Method "POST" -Body $invalidBody -ExpectedStatus 400

# Test 4: Login with invalid credentials
$invalidLoginBody = @{
    email = "nonexistent@example.com"
    password = "WrongPassword123!"
}
Test-Endpoint -TestName "Login Rejects Invalid Credentials" -Url "$ProductionUrl/api/auth/login" -Method "POST" -Body $invalidLoginBody -ExpectedStatus 401

# Test 5: Security Headers
Write-Host "`n--- Security Checks ---" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -UseBasicParsing
    $headers = $response.Headers
    
    $script:totalTests++
    if ($headers.ContainsKey("X-Content-Type-Options")) {
        Write-Host "[PASS] Security Header: X-Content-Type-Options" -ForegroundColor Green
        $script:passedTests++
    }
    else {
        Write-Host "[FAIL] Security Header: X-Content-Type-Options missing" -ForegroundColor Red
        $script:failedTests++
    }
    
    $script:totalTests++
    if ($ProductionUrl.StartsWith("https://")) {
        Write-Host "[PASS] HTTPS Enabled" -ForegroundColor Green
        $script:passedTests++
    }
    else {
        Write-Host "[FAIL] HTTPS Not Enabled" -ForegroundColor Red
        $script:failedTests++
    }
}
catch {
    Write-Host "[WARN] Could not check security headers" -ForegroundColor Yellow
}

# Test 6: Performance
Write-Host "`n--- Performance Checks ---" -ForegroundColor Cyan
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -UseBasicParsing -TimeoutSec 10
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    $script:totalTests++
    if ($responseTime -lt 3000) {
        Write-Host "[PASS] Homepage Response Time: $responseTime ms" -ForegroundColor Green
        $script:passedTests++
    }
    else {
        Write-Host "[WARN] Homepage Response Time: $responseTime ms (slow)" -ForegroundColor Yellow
        $script:passedTests++
    }
}
catch {
    $stopwatch.Stop()
    Write-Host "[FAIL] Homepage Response Time: Request failed" -ForegroundColor Red
    $script:failedTests++
}

# Summary
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

Write-Host "Total Tests: $totalTests" -ForegroundColor Gray
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Red" })

Write-Host "`nEnd Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
    Write-Host "Production deployment is verified and working." -ForegroundColor Green
    exit 0
}
elseif ($passRate -ge 80) {
    Write-Host "WARNING: Most tests passed but some issues detected." -ForegroundColor Yellow
    Write-Host "Review failed tests and monitor production closely." -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "FAILURE: Critical issues detected!" -ForegroundColor Red
    Write-Host "Review logs and consider rollback." -ForegroundColor Red
    exit 1
}
