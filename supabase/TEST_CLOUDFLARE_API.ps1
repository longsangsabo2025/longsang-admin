# Test Cloudflare API Access

$ErrorActionPreference = "Stop"

# Load .env
$envPath = Join-Path $PSScriptRoot ".env"
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

$CLOUDFLARE_EMAIL = $env:CLOUDFLARE_EMAIL
$CLOUDFLARE_API_KEY = $env:CLOUDFLARE_API_KEY
$CLOUDFLARE_ZONE_ID = $env:CLOUDFLARE_ZONE_ID

Write-Host "`n🔍 Testing Cloudflare API Access...`n" -ForegroundColor Cyan

# Test 1: Global API Key (X-Auth-Key)
Write-Host "Test 1: Global API Key method" -ForegroundColor Yellow
$headers1 = @{
    "X-Auth-Email" = $CLOUDFLARE_EMAIL
    "X-Auth-Key" = $CLOUDFLARE_API_KEY
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID" `
        -Method Get `
        -Headers $headers1
    
    if ($response.success) {
        Write-Host "  ✅ Global API Key works!" -ForegroundColor Green
        Write-Host "  Zone: $($response.result.name)" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Token (Bearer)
Write-Host "`nTest 2: API Token method" -ForegroundColor Yellow
$headers2 = @{
    "Authorization" = "Bearer $CLOUDFLARE_API_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID" `
        -Method Get `
        -Headers $headers2
    
    if ($response.success) {
        Write-Host "  ✅ API Token works!" -ForegroundColor Green
        Write-Host "  Zone: $($response.result.name)" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
