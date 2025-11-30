# Add DMARC record to Cloudflare

$ErrorActionPreference = "Stop"

# Load .env
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$headers = @{
    "X-Auth-Email" = $env:CLOUDFLARE_EMAIL
    "X-Auth-Key" = $env:CLOUDFLARE_API_KEY
    "Content-Type" = "application/json"
}

Write-Host "`n🔒 Adding DMARC record for better email deliverability...`n" -ForegroundColor Cyan

# DMARC record
$dmarcRecord = @{
    type = "TXT"
    name = "_dmarc"
    content = "v=DMARC1; p=none; rua=mailto:admin@longsang.org; pct=100; fo=1"
    ttl = 1
    proxied = $false
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$env:CLOUDFLARE_ZONE_ID/dns_records" `
        -Method Post `
        -Headers $headers `
        -Body ($dmarcRecord | ConvertTo-Json)
    
    if ($response.success) {
        Write-Host "✅ DMARC record added successfully!" -ForegroundColor Green
        Write-Host "   This will improve email deliverability and prevent spam folder`n" -ForegroundColor White
    } else {
        Write-Host "❌ Failed: $($response.errors[0].message)" -ForegroundColor Red
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "already exists") {
        Write-Host "✅ DMARC record already exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: $errorMsg" -ForegroundColor Red
    }
}

Write-Host "📝 DMARC Policy:" -ForegroundColor Cyan
Write-Host "   • Policy: none (monitoring mode)" -ForegroundColor White
Write-Host "   • Reports: admin@longsang.org" -ForegroundColor White
Write-Host "   • Coverage: 100% of emails`n" -ForegroundColor White
