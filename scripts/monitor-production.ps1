# Production Monitoring Script
# Monitors production deployment for the first hour

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = "https://news.arcane.group",
    
    [Parameter(Mandatory=$false)]
    [int]$DurationMinutes = 60,
    
    [Parameter(Mandatory=$false)]
    [int]$CheckIntervalSeconds = 60
)

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PRODUCTION MONITORING                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Production URL: " -NoNewline
Write-Host $ProductionUrl -ForegroundColor Cyan

Write-Host "Duration: " -NoNewline
Write-Host "$DurationMinutes minutes" -ForegroundColor Cyan

Write-Host "Check Interval: " -NoNewline
Write-Host "$CheckIntervalSeconds seconds" -ForegroundColor Cyan

Write-Host "Start Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor Cyan

Write-Host "`nMonitoring will run for $DurationMinutes minutes...`n" -ForegroundColor Gray

$startTime = Get-Date
$endTime = $startTime.AddMinutes($DurationMinutes)
$checkCount = 0
$errorCount = 0
$warningCount = 0

$responseTimes = @()
$healthChecks = @()

function Test-Endpoint {
    param([string]$Url)
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            ResponseTime = $stopwatch.ElapsedMilliseconds
            Error = $null
        }
    }
    catch {
        $stopwatch.Stop()
        
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            ResponseTime = $stopwatch.ElapsedMilliseconds
            Error = $_.Exception.Message
        }
    }
}

while ((Get-Date) -lt $endTime) {
    $checkCount++
    $currentTime = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$currentTime] Check #$checkCount" -ForegroundColor Cyan
    
    # Test homepage
    $homepageResult = Test-Endpoint -Url $ProductionUrl
    $responseTimes += $homepageResult.ResponseTime
    
    if ($homepageResult.Success) {
        Write-Host "  ✅ Homepage: " -NoNewline -ForegroundColor Green
        Write-Host "$($homepageResult.ResponseTime) ms" -ForegroundColor Gray
    }
    else {
        $errorCount++
        Write-Host "  ❌ Homepage: " -NoNewline -ForegroundColor Red
        Write-Host "Error ($($homepageResult.StatusCode))" -ForegroundColor Red
        Write-Host "     $($homepageResult.Error)" -ForegroundColor Red
    }
    
    # Test health endpoint
    $healthResult = Test-Endpoint -Url "$ProductionUrl/api/health"
    
    if ($healthResult.Success) {
        try {
            $healthData = (Invoke-WebRequest -Uri "$ProductionUrl/api/health" -UseBasicParsing).Content | ConvertFrom-Json
            $healthChecks += @{
                Time = Get-Date
                Status = $healthData.status
                Database = $healthData.database
            }
            
            Write-Host "  ✅ Health: " -NoNewline -ForegroundColor Green
            Write-Host "$($healthData.status) | DB: $($healthData.database) | $($healthResult.ResponseTime) ms" -ForegroundColor Gray
        }
        catch {
            $warningCount++
            Write-Host "  ⚠️  Health: " -NoNewline -ForegroundColor Yellow
            Write-Host "Response OK but invalid JSON" -ForegroundColor Yellow
        }
    }
    else {
        $errorCount++
        Write-Host "  ❌ Health: " -NoNewline -ForegroundColor Red
        Write-Host "Error ($($healthResult.StatusCode))" -ForegroundColor Red
    }
    
    # Calculate statistics
    if ($responseTimes.Count -gt 0) {
        $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
        $maxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
        $minResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
        
        Write-Host "  📊 Stats: " -NoNewline -ForegroundColor Cyan
        Write-Host "Avg: $([math]::Round($avgResponseTime, 0)) ms | " -NoNewline -ForegroundColor Gray
        Write-Host "Min: $minResponseTime ms | " -NoNewline -ForegroundColor Gray
        Write-Host "Max: $maxResponseTime ms" -ForegroundColor Gray
    }
    
    # Error rate
    $errorRate = if ($checkCount -gt 0) { ($errorCount / $checkCount) * 100 } else { 0 }
    
    if ($errorRate -gt 10) {
        Write-Host "  ⚠️  Error Rate: " -NoNewline -ForegroundColor Red
        Write-Host "$([math]::Round($errorRate, 1))% ($errorCount/$checkCount)" -ForegroundColor Red
    }
    elseif ($errorRate -gt 5) {
        Write-Host "  ⚠️  Error Rate: " -NoNewline -ForegroundColor Yellow
        Write-Host "$([math]::Round($errorRate, 1))% ($errorCount/$checkCount)" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✅ Error Rate: " -NoNewline -ForegroundColor Green
        Write-Host "$([math]::Round($errorRate, 1))% ($errorCount/$checkCount)" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Wait for next check
    $remainingTime = ($endTime - (Get-Date)).TotalMinutes
    if ($remainingTime -gt 0) {
        Start-Sleep -Seconds $CheckIntervalSeconds
    }
}

# Final Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MONITORING SUMMARY                                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Duration: " -NoNewline
Write-Host "$DurationMinutes minutes" -ForegroundColor Cyan

Write-Host "Total Checks: " -NoNewline
Write-Host $checkCount -ForegroundColor Cyan

Write-Host "Errors: " -NoNewline
if ($errorCount -eq 0) {
    Write-Host $errorCount -ForegroundColor Green
}
else {
    Write-Host $errorCount -ForegroundColor Red
}

Write-Host "Warnings: " -NoNewline
if ($warningCount -eq 0) {
    Write-Host $warningCount -ForegroundColor Green
}
else {
    Write-Host $warningCount -ForegroundColor Yellow
}

$finalErrorRate = if ($checkCount -gt 0) { ($errorCount / $checkCount) * 100 } else { 0 }
Write-Host "Error Rate: " -NoNewline
if ($finalErrorRate -eq 0) {
    Write-Host "$([math]::Round($finalErrorRate, 1))%" -ForegroundColor Green
}
elseif ($finalErrorRate -lt 5) {
    Write-Host "$([math]::Round($finalErrorRate, 1))%" -ForegroundColor Yellow
}
else {
    Write-Host "$([math]::Round($finalErrorRate, 1))%" -ForegroundColor Red
}

if ($responseTimes.Count -gt 0) {
    $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
    $maxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
    $minResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
    
    Write-Host "`nResponse Times:" -ForegroundColor Cyan
    Write-Host "  Average: " -NoNewline
    Write-Host "$([math]::Round($avgResponseTime, 0)) ms" -ForegroundColor Gray
    Write-Host "  Minimum: " -NoNewline
    Write-Host "$minResponseTime ms" -ForegroundColor Gray
    Write-Host "  Maximum: " -NoNewline
    Write-Host "$maxResponseTime ms" -ForegroundColor Gray
}

Write-Host "`nEnd Time: " -NoNewline
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -ForegroundColor Cyan

Write-Host "`n"

if ($errorCount -eq 0) {
    Write-Host "✅ Monitoring completed successfully!" -ForegroundColor Green
    Write-Host "   No errors detected during monitoring period." -ForegroundColor Green
    exit 0
}
elseif ($finalErrorRate -lt 5) {
    Write-Host "⚠️  Monitoring completed with minor issues" -ForegroundColor Yellow
    Write-Host "   Error rate is acceptable but monitor closely." -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "❌ Monitoring detected significant issues!" -ForegroundColor Red
    Write-Host "   High error rate detected. Investigate immediately." -ForegroundColor Red
    exit 1
}
