# Test All 11 Access Codes Script
# Verifies that all access codes work correctly

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ACCESS CODE VERIFICATION                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "⚠️  DRY RUN MODE - No actual registrations will be performed`n" -ForegroundColor Yellow
}

# All 11 access codes
$accessCodes = @(
    "CODE0001",
    "CODE0002",
    "CODE0003",
    "CODE0004",
    "CODE0005",
    "CODE0006",
    "CODE0007",
    "CODE0008",
    "CODE0009",
    "CODE0010",
    "CODE0011"
)

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$results = @()

Write-Host "Testing $($accessCodes.Count) access codes...`n" -ForegroundColor Gray

foreach ($code in $accessCodes) {
    Write-Host "Testing $code..." -NoNewline
    
    if ($DryRun) {
        Write-Host " [DRY RUN]" -ForegroundColor Yellow
        $results += @{
            Code = $code
            Status = "Skipped"
            Message = "Dry run mode"
        }
        continue
    }
    
    $testEmail = "code-test-$code-$timestamp@example.com"
    $body = @{
        accessCode = $code
        email = $testEmail
        password = "TestPass123!"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$ProductionUrl/api/auth/register" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -UseBasicParsing `
            -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ Valid" -ForegroundColor Green
            $results += @{
                Code = $code
                Status = "Valid"
                Message = "Registration successful"
                Email = $testEmail
            }
        }
        else {
            Write-Host " ❌ Unexpected status: $($response.StatusCode)" -ForegroundColor Red
            $results += @{
                Code = $code
                Status = "Error"
                Message = "Status: $($response.StatusCode)"
            }
        }
    }
    catch {
        $statusCode = 0
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq 410) {
            Write-Host " ⚠️  Already redeemed" -ForegroundColor Yellow
            $results += @{
                Code = $code
                Status = "Redeemed"
                Message = "Code already used"
            }
        }
        elseif ($statusCode -eq 400) {
            Write-Host " ❌ Invalid" -ForegroundColor Red
            $results += @{
                Code = $code
                Status = "Invalid"
                Message = $errorMessage
            }
        }
        else {
            Write-Host " ❌ Error: $statusCode" -ForegroundColor Red
            $results += @{
                Code = $code
                Status = "Error"
                Message = $errorMessage
            }
        }
    }
    
    # Small delay between requests
    Start-Sleep -Milliseconds 500
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SUMMARY                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$validCodes = ($results | Where-Object { $_.Status -eq "Valid" }).Count
$redeemedCodes = ($results | Where-Object { $_.Status -eq "Redeemed" }).Count
$invalidCodes = ($results | Where-Object { $_.Status -eq "Invalid" }).Count
$errorCodes = ($results | Where-Object { $_.Status -eq "Error" }).Count
$skippedCodes = ($results | Where-Object { $_.Status -eq "Skipped" }).Count

Write-Host "Total Codes: " -NoNewline
Write-Host $accessCodes.Count -ForegroundColor Cyan

Write-Host "Valid (Unused): " -NoNewline
Write-Host $validCodes -ForegroundColor Green

Write-Host "Already Redeemed: " -NoNewline
Write-Host $redeemedCodes -ForegroundColor Yellow

Write-Host "Invalid: " -NoNewline
Write-Host $invalidCodes -ForegroundColor Red

Write-Host "Errors: " -NoNewline
Write-Host $errorCodes -ForegroundColor Red

if ($skippedCodes -gt 0) {
    Write-Host "Skipped (Dry Run): " -NoNewline
    Write-Host $skippedCodes -ForegroundColor Yellow
}

Write-Host "`n"

# Detailed results
if ($invalidCodes -gt 0 -or $errorCodes -gt 0) {
    Write-Host "Issues detected:`n" -ForegroundColor Yellow
    
    foreach ($result in $results) {
        if ($result.Status -eq "Invalid" -or $result.Status -eq "Error") {
            Write-Host "  $($result.Code): " -NoNewline -ForegroundColor Red
            Write-Host "$($result.Status) - $($result.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Overall status
if ($DryRun) {
    Write-Host "ℹ️  Dry run completed. No codes were actually tested." -ForegroundColor Cyan
    exit 0
}
elseif ($invalidCodes -eq 0 -and $errorCodes -eq 0) {
    Write-Host "✅ All access codes are functional!" -ForegroundColor Green
    
    if ($redeemedCodes -gt 0) {
        Write-Host "   Note: $redeemedCodes code(s) already redeemed (expected if re-running)" -ForegroundColor Yellow
    }
    
    exit 0
}
else {
    Write-Host "❌ Some access codes have issues!" -ForegroundColor Red
    Write-Host "   Please check the database and re-import codes if needed." -ForegroundColor Red
    exit 1
}
