# ============================================
# SETUP CLOUDFLARE EMAIL ROUTING DNS
# ============================================

$ErrorActionPreference = "Stop"

# Load environment variables
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Cloudflare Configuration
$CLOUDFLARE_EMAIL = $env:CLOUDFLARE_EMAIL
$CLOUDFLARE_API_KEY = $env:CLOUDFLARE_API_KEY
$CLOUDFLARE_ZONE_ID = $env:CLOUDFLARE_ZONE_ID
$DOMAIN = "longsang.org"

$headers = @{
    "X-Auth-Email" = $CLOUDFLARE_EMAIL
    "X-Auth-Key" = $CLOUDFLARE_API_KEY
    "Content-Type" = "application/json"
}

function Add-DnsRecord {
    param (
        [string]$Type,
        [string]$Name,
        [string]$Content,
        [int]$Priority = 0,
        [string]$Comment
    )

    $body = @{
        type = $Type
        name = $Name
        content = $Content
        ttl = 1 # Auto
        proxied = $false
        comment = $Comment
    }

    if ($Type -eq "MX") {
        $body["priority"] = $Priority
    }

    $jsonBody = $body | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" `
            -Method Post `
            -Headers $headers `
            -Body $jsonBody
        
        if ($response.success) {
            Write-Host "  ✅ Added $Type record: $Name -> $Content" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Failed to add $Type record: $($response.errors[0].message)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Error adding record: $_" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📧 CLOUDFLARE EMAIL ROUTING SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Add MX Records
Write-Host "1️⃣ Adding MX Records..." -ForegroundColor Yellow
Add-DnsRecord -Type "MX" -Name "@" -Content "route1.mx.cloudflare.net" -Priority 10 -Comment "Email Routing 1"
Add-DnsRecord -Type "MX" -Name "@" -Content "route2.mx.cloudflare.net" -Priority 50 -Comment "Email Routing 2"
Add-DnsRecord -Type "MX" -Name "@" -Content "route3.mx.cloudflare.net" -Priority 90 -Comment "Email Routing 3"

# 2. Add SPF Record (TXT)
Write-Host "`n2️⃣ Checking/Adding SPF Record..." -ForegroundColor Yellow
# Note: This is a simplified check. In production, you should merge with existing SPF.
Add-DnsRecord -Type "TXT" -Name "@" -Content "v=spf1 include:_spf.mx.cloudflare.net ~all" -Comment "Email Routing SPF"

Write-Host "`n✅ DNS Setup Script Completed." -ForegroundColor Green
Write-Host "👉 Next Step: Go to Cloudflare Dashboard > Email > Email Routing and click 'Enable Email Routing'." -ForegroundColor White
