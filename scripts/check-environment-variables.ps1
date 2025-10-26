# Environment Variables Verification Script
# Checks if all required environment variables are set in Vercel

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "Production"
)

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ENVIRONMENT VARIABLES CHECK                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Environment: " -NoNewline
Write-Host $Environment -ForegroundColor Cyan
Write-Host ""

# Required environment variables
$requiredVars = @(
    @{ Name = "DATABASE_URL"; Description = "Vercel Postgres connection string"; Critical = $true }
    @{ Name = "JWT_SECRET"; Description = "JWT token signing secret (32+ bytes)"; Critical = $true }
    @{ Name = "JWT_EXPIRATION"; Description = "JWT token expiration time"; Critical = $false; Default = "7d" }
    @{ Name = "KV_REST_API_URL"; Description = "Vercel KV REST API URL"; Critical = $true }
    @{ Name = "KV_REST_API_TOKEN"; Description = "Vercel KV write token"; Critical = $true }
    @{ Name = "KV_REST_API_READ_ONLY_TOKEN"; Description = "Vercel KV read-only token"; Critical = $false }
    @{ Name = "CRON_SECRET"; Description = "Cron job authentication secret"; Critical = $true }
    @{ Name = "SENDER_EMAIL"; Description = "Office 365 sender email"; Critical = $true }
    @{ Name = "AZURE_TENANT_ID"; Description = "Azure AD tenant ID"; Critical = $true }
    @{ Name = "AZURE_CLIENT_ID"; Description = "Azure AD application ID"; Critical = $true }
    @{ Name = "AZURE_CLIENT_SECRET"; Description = "Azure AD client secret"; Critical = $true }
    @{ Name = "NEXT_PUBLIC_APP_URL"; Description = "Application URL"; Critical = $true }
    @{ Name = "AUTH_RATE_LIMIT_MAX_ATTEMPTS"; Description = "Max login attempts"; Critical = $false; Default = "5" }
    @{ Name = "AUTH_RATE_LIMIT_WINDOW_MS"; Description = "Rate limit window"; Critical = $false; Default = "900000" }
)

$missingCritical = @()
$missingOptional = @()
$configured = @()

Write-Host "Checking environment variables...`n" -ForegroundColor Gray

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var.Name)
    
    if ($value) {
        $configured += $var.Name
        Write-Host "✅ " -ForegroundColor Green -NoNewline
        Write-Host "$($var.Name)" -ForegroundColor Green
        Write-Host "   $($var.Description)" -ForegroundColor Gray
        
        # Validate format for specific variables
        if ($var.Name -eq "DATABASE_URL" -and $value -notlike "postgres://*") {
            Write-Host "   ⚠️  Warning: DATABASE_URL should start with 'postgres://'" -ForegroundColor Yellow
        }
        if ($var.Name -eq "KV_REST_API_URL" -and $value -notlike "https://*") {
            Write-Host "   ⚠️  Warning: KV_REST_API_URL should start with 'https://'" -ForegroundColor Yellow
        }
        if ($var.Name -eq "NEXT_PUBLIC_APP_URL" -and $value -notlike "https://*") {
            Write-Host "   ⚠️  Warning: NEXT_PUBLIC_APP_URL should use HTTPS" -ForegroundColor Yellow
        }
    }
    else {
        if ($var.Critical) {
            $missingCritical += $var.Name
            Write-Host "❌ " -ForegroundColor Red -NoNewline
            Write-Host "$($var.Name)" -ForegroundColor Red -NoNewline
            Write-Host " (CRITICAL)" -ForegroundColor Red
            Write-Host "   $($var.Description)" -ForegroundColor Gray
        }
        else {
            $missingOptional += $var.Name
            Write-Host "⚠️  " -ForegroundColor Yellow -NoNewline
            Write-Host "$($var.Name)" -ForegroundColor Yellow -NoNewline
            Write-Host " (Optional)" -ForegroundColor Yellow
            Write-Host "   $($var.Description)" -ForegroundColor Gray
            if ($var.Default) {
                Write-Host "   Default: $($var.Default)" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SUMMARY                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Configured: " -NoNewline
Write-Host "$($configured.Count)/$($requiredVars.Count)" -ForegroundColor Green

Write-Host "Missing Critical: " -NoNewline
if ($missingCritical.Count -eq 0) {
    Write-Host "0" -ForegroundColor Green
}
else {
    Write-Host "$($missingCritical.Count)" -ForegroundColor Red
    foreach ($var in $missingCritical) {
        Write-Host "  - $var" -ForegroundColor Red
    }
}

Write-Host "Missing Optional: " -NoNewline
if ($missingOptional.Count -eq 0) {
    Write-Host "0" -ForegroundColor Green
}
else {
    Write-Host "$($missingOptional.Count)" -ForegroundColor Yellow
    foreach ($var in $missingOptional) {
        Write-Host "  - $var" -ForegroundColor Yellow
    }
}

Write-Host "`n"

if ($missingCritical.Count -eq 0) {
    Write-Host "✅ All critical environment variables are configured!" -ForegroundColor Green
    Write-Host "   You can proceed with deployment." -ForegroundColor Green
    
    if ($missingOptional.Count -gt 0) {
        Write-Host "`n⚠️  Some optional variables are missing." -ForegroundColor Yellow
        Write-Host "   The system will use default values." -ForegroundColor Yellow
    }
    
    exit 0
}
else {
    Write-Host "❌ Missing critical environment variables!" -ForegroundColor Red
    Write-Host "   Please configure these in Vercel Dashboard:" -ForegroundColor Red
    Write-Host "   Dashboard > Project > Settings > Environment Variables" -ForegroundColor Red
    Write-Host "`n   Required actions:" -ForegroundColor Yellow
    
    foreach ($var in $missingCritical) {
        $varInfo = $requiredVars | Where-Object { $_.Name -eq $var }
        Write-Host "   1. Add $var" -ForegroundColor Yellow
        Write-Host "      $($varInfo.Description)" -ForegroundColor Gray
    }
    
    exit 1
}
