# Production Deployment Verification Script
# Automates all post-deployment verification checks

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipEmailTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

# Test results tracking
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:WarningTests = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [bool]$IsWarning = $false
    )
    
    $script:TotalTests++
    
    if ($IsWarning) {
        $script:WarningTests++
        Write-Host "⚠️  " -ForegroundColor $ColorWarning -NoNewline
        Write-Host "$TestName" -ForegroundColor $ColorWarning
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor $ColorWarning
        }
    }
    elseif ($Passed) {
        $script:PassedTests++
        Write-Host "✅ " -ForegroundColor $ColorSuccess -NoNewline
        Write-Host "$TestName" -ForegroundColor $ColorSuccess
        if ($Message -and $Verbose) {
            Write-Host "   $Message" -ForegroundColor Gray
        }
    }
    else {
        $script:FailedTests++
        Write-Host "❌ " -ForegroundColor $ColorError -NoNewline
        Write-Host "$TestName" -ForegroundColor $ColorError
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor $ColorError
        }
    }
}

function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200,
        [int]$TimeoutSeconds = 30
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        return @{
            Success = ($response.StatusCode -eq $ExpectedStatus)
            StatusCode = $response.StatusCode
            Content = $response.Content
            Headers = $response.Headers
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        return @{
            Success = ($statusCode -eq $ExpectedStatus)
            StatusCode = $statusCode
            Content = $_.Exception.Message
            Headers = @{}
        }
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorInfo
Write-Host "║     PRODUCTION DEPLOYMENT VERIFICATION                         ║" -ForegroundColor $ColorInfo
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor $ColorInfo

Write-Host "Production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor $ColorInfo
Write-Host "Start Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor $ColorInfo
Write-Host ""

# ============================================================================
# SECTION 1: BASIC CONNECTIVITY
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 1: Basic Connectivity Tests" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

# Test 1.1: Homepage accessibility
$result = Test-ApiEndpoint -Url $ProductionUrl
Write-TestResult -TestName "Homepage Accessible" -Passed $result.Success -Message "Status: $($result.StatusCode)"

# Test 1.2: Health check endpoint
$result = Test-ApiEndpoint -Url "$ProductionUrl/api/health"
$healthPassed = $false
if ($result.Success) {
    try {
        $health = $result.Content | ConvertFrom-Json
        $healthPassed = ($health.status -eq "ok")
        Write-TestResult -TestName "Health Check Endpoint" -Passed $healthPassed -Message "Status: $($health.status)"
    }
    catch {
        Write-TestResult -TestName "Health Check Endpoint" -Passed $false -Message "Invalid JSON response"
    }
}
else {
    Write-TestResult -TestName "Health Check Endpoint" -Passed $false -Message "Status: $($result.StatusCode)"
}

# ============================================================================
# SECTION 2: AUTHENTICATION ENDPOINTS
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 2: Authentication Endpoint Tests" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

# Generate unique test email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "prod-verify-$timestamp@example.com"

# Test 2.1: Registration with valid access code
Write-Host "Testing registration with CODE0001..." -ForegroundColor Gray
$registrationBody = @{
    accessCode = "CODE0001"
    email = $testEmail
    password = "ProductionTest123!"
}

$result = Test-ApiEndpoint -Url "$ProductionUrl/api/auth/register" -Method "POST" -Body $registrationBody
$registrationPassed = $false
$authToken = $null

if ($result.StatusCode -eq 200) {
    try {
        $regResponse = $result.Content | ConvertFrom-Json
        $registrationPassed = ($regResponse.success -eq $true)
        
        # Extract auth token from Set-Cookie header
        if ($result.Headers.ContainsKey("Set-Cookie")) {
            $setCookie = $result.Headers["Set-Cookie"]
            if ($setCookie -match "auth_token=([^;]+)") {
                $authToken = $matches[1]
            }
        }
        
        Write-TestResult -TestName "Registration with Valid Code" -Passed $registrationPassed -Message "User created: $testEmail"
    }
    catch {
        Write-TestResult -TestName "Registration with Valid Code" -Passed $false -Message "Invalid response format"
    }
}
elseif ($result.StatusCode -eq 410) {
    # Code already used - this is expected if running multiple times
    Write-TestResult -TestName "Registration with Valid Code" -Passed $false -Message "CODE0001 already redeemed (expected if re-running)" -IsWarning $true
}
else {
    Write-TestResult -TestName "Registration with Valid Code" -Passed $false -Message "Status: $($result.StatusCode) - $($result.Content)"
}

# Test 2.2: Registration with invalid code
$invalidBody = @{
    accessCode = "INVALID123"
    email = "invalid-$timestamp@example.com"
    password = "TestPass123!"
}

$result = Test-ApiEndpoint -Url "$ProductionUrl/api/auth/register" -Method "POST" -Body $invalidBody -ExpectedStatus 400
Write-TestResult -TestName "Registration Rejects Invalid Code" -Passed $result.Success -Message "Status: $($result.StatusCode)"

# Test 2.3: Login with registered account (if registration succeeded)
if ($registrationPassed) {
    Write-Host "Testing login with registered account..." -ForegroundColor Gray
    $loginBody = @{
        email = $testEmail
        password = "ProductionTest123!"
    }
    
    $result = Test-ApiEndpoint -Url "$ProductionUrl/api/auth/login" -Method "POST" -Body $loginBody
    $loginPassed = $false
    
    if ($result.Success) {
        try {
            $loginResponse = $result.Content | ConvertFrom-Json
            $loginPassed = ($loginResponse.success -eq $true)
            
            # Extract auth token
            if ($result.Headers.ContainsKey("Set-Cookie")) {
                $setCookie = $result.Headers["Set-Cookie"]
                if ($setCookie -match "auth_token=([^;]+)") {
                    $authToken = $matches[1]
                }
            }
            
            Write-TestResult -TestName "Login with Valid Credentials" -Passed $loginPassed -Message "Login successful"
        }
        catch {
            Write-TestResult -TestName "Login with Valid Credentials" -Passed $false -Message "Invalid response format"
        }
    }
    else {
        Write-TestResult -TestName "Login with Valid Credentials" -Passed $false -Message "Status: $($result.StatusCode)"
    }
}
else {
    Write-TestResult -TestName "Login with Valid Credentials" -Passed $false -Message "Skipped (registration failed)" -IsWarning $true
}

# Test 2.4: Login with invalid credentials
$invalidLoginBody = @{
    email = "nonexistent@example.com"
    password = "WrongPassword123!"
}

$result = Test-ApiEndpoint -Url "$ProductionUrl/api/auth/login" -Method "POST" -Body $invalidLoginBody -ExpectedStatus 401
Write-TestResult -TestName "Login Rejects Invalid Credentials" -Passed $result.Success -Message "Status: $($result.StatusCode)"

# Test 2.5: Logout endpoint
if ($authToken) {
    Write-Host "Testing logout..." -ForegroundColor Gray
    try {
        $headers = @{
            "Cookie" = "auth_token=$authToken"
        }
        $result = Invoke-WebRequest -Uri "$ProductionUrl/api/auth/logout" -Method POST -Headers $headers -UseBasicParsing
        $logoutPassed = ($result.StatusCode -eq 200)
        Write-TestResult -TestName "Logout Endpoint" -Passed $logoutPassed -Message "Status: $($result.StatusCode)"
    }
    catch {
        Write-TestResult -TestName "Logout Endpoint" -Passed $false -Message $_.Exception.Message
    }
}
else {
    Write-TestResult -TestName "Logout Endpoint" -Passed $false -Message "Skipped (no auth token)" -IsWarning $true
}

# ============================================================================
# SECTION 3: RATE LIMITING
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 3: Rate Limiting Tests" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

Write-Host "Testing rate limiting (6 failed login attempts)..." -ForegroundColor Gray
$rateLimitEmail = "ratelimit-$timestamp@example.com"
$rateLimitBody = @{
    email = $rateLimitEmail
    password = "WrongPassword123!"
}

$rateLimitTriggered = $false
for ($i = 1; $i -le 6; $i++) {
    $result = Test-ApiEndpoint -Url "$ProductionUrl/api/auth/login" -Method "POST" -Body $rateLimitBody -TimeoutSeconds 10
    
    if ($result.StatusCode -eq 429) {
        $rateLimitTriggered = $true
        Write-Host "   Attempt $i`: Rate limit triggered (429)" -ForegroundColor Gray
        break
    }
    elseif ($result.StatusCode -eq 401) {
        Write-Host "   Attempt $i`: Failed login (401)" -ForegroundColor Gray
    }
    else {
        Write-Host "   Attempt $i`: Unexpected status ($($result.StatusCode))" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 500
}

Write-TestResult -TestName "Rate Limiting Active" -Passed $rateLimitTriggered -Message "Blocked after multiple failed attempts"

# ============================================================================
# SECTION 4: SECURITY CHECKS
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 4: Security Header Tests" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -UseBasicParsing
    $headers = $response.Headers
    
    # Check security headers
    $securityHeaders = @{
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY"
        "X-XSS-Protection" = "1; mode=block"
        "Referrer-Policy" = "strict-origin-when-cross-origin"
    }
    
    foreach ($header in $securityHeaders.GetEnumerator()) {
        $headerName = $header.Key
        $expectedValue = $header.Value
        
        if ($headers.ContainsKey($headerName)) {
            $actualValue = $headers[$headerName]
            $passed = ($actualValue -like "*$expectedValue*")
            Write-TestResult -TestName "Security Header: $headerName" -Passed $passed -Message "Value: $actualValue"
        }
        else {
            Write-TestResult -TestName "Security Header: $headerName" -Passed $false -Message "Header not present"
        }
    }
    
    # Check HTTPS
    $isHttps = $ProductionUrl.StartsWith("https://")
    Write-TestResult -TestName "HTTPS Enabled" -Passed $isHttps -Message "URL: $ProductionUrl"
}
catch {
    Write-TestResult -TestName "Security Headers Check" -Passed $false -Message $_.Exception.Message
}

# ============================================================================
# SECTION 5: PERFORMANCE CHECKS
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 5: Performance Tests" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

# Test response times
$endpoints = @(
    @{ Url = "$ProductionUrl"; Name = "Homepage"; Target = 3000 }
    @{ Url = "$ProductionUrl/api/health"; Name = "Health Check"; Target = 1000 }
)

foreach ($endpoint in $endpoints) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        $passed = ($responseTime -lt $endpoint.Target)
        $message = "$responseTime ms (target: < $($endpoint.Target) ms)"
        
        Write-TestResult -TestName "$($endpoint.Name) Response Time" -Passed $passed -Message $message
    }
    catch {
        $stopwatch.Stop()
        Write-TestResult -TestName "$($endpoint.Name) Response Time" -Passed $false -Message "Request failed"
    }
}

# ============================================================================
# SECTION 6: DATABASE CONNECTIVITY
# ============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $ColorInfo
Write-Host "SECTION 6: Database Connectivity" -ForegroundColor $ColorInfo
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor $ColorInfo

# Health check already tests database connectivity
if ($healthPassed) {
    Write-TestResult -TestName "Database Connection" -Passed $true -Message "Verified via health check"
}
else {
    Write-TestResult -TestName "Database Connection" -Passed $false -Message "Health check failed"
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorInfo
Write-Host "║     VERIFICATION SUMMARY                                       ║" -ForegroundColor $ColorInfo
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor $ColorInfo

Write-Host "Total Tests: " -NoNewline
Write-Host $script:TotalTests -ForegroundColor $ColorInfo

Write-Host "Passed: " -NoNewline
Write-Host $script:PassedTests -ForegroundColor $ColorSuccess

Write-Host "Failed: " -NoNewline
Write-Host $script:FailedTests -ForegroundColor $ColorError

Write-Host "Warnings: " -NoNewline
Write-Host $script:WarningTests -ForegroundColor $ColorWarning

$passRate = if ($script:TotalTests -gt 0) { 
    [math]::Round(($script:PassedTests / $script:TotalTests) * 100, 2) 
} else { 
    0 
}

Write-Host "`nPass Rate: " -NoNewline
if ($passRate -ge 90) {
    Write-Host "$passRate%" -ForegroundColor $ColorSuccess
}
elseif ($passRate -ge 70) {
    Write-Host "$passRate%" -ForegroundColor $ColorWarning
}
else {
    Write-Host "$passRate%" -ForegroundColor $ColorError
}

Write-Host "`nEnd Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor $ColorInfo

# Overall status
Write-Host "`n"
if ($script:FailedTests -eq 0) {
    Write-Host "🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!" -ForegroundColor $ColorSuccess
    Write-Host "   All critical tests passed. Production is ready." -ForegroundColor $ColorSuccess
    exit 0
}
elseif ($script:FailedTests -le 2 -and $passRate -ge 80) {
    Write-Host "⚠️  DEPLOYMENT VERIFICATION COMPLETED WITH WARNINGS" -ForegroundColor $ColorWarning
    Write-Host "   Most tests passed, but some issues detected." -ForegroundColor $ColorWarning
    Write-Host "   Review failed tests and monitor production closely." -ForegroundColor $ColorWarning
    exit 0
}
else {
    Write-Host "❌ DEPLOYMENT VERIFICATION FAILED" -ForegroundColor $ColorError
    Write-Host "   Critical issues detected. Review logs and consider rollback." -ForegroundColor $ColorError
    exit 1
}
