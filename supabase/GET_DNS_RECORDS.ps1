# ============================================
# GET RESEND DNS RECORDS
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

$DOMAIN = "longsang.org"

$resendHeaders = @{
    "Authorization" = "Bearer $env:RESEND_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📋 RESEND DNS RECORDS FOR $DOMAIN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    # Get domains
    $domains = Invoke-RestMethod -Uri "https://api.resend.com/domains" `
        -Method Get `
        -Headers $resendHeaders
    
    $existingDomain = $domains.data | Where-Object { $_.name -eq $DOMAIN }
    
    if ($existingDomain) {
        $domainId = $existingDomain.id
        Write-Host "✅ Domain ID: $domainId" -ForegroundColor Green
        Write-Host "📊 Status: $($existingDomain.status)`n" -ForegroundColor $(if ($existingDomain.status -eq "verified") { "Green" } else { "Yellow" })
        
        # Get domain details
        $domainDetails = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" `
            -Method Get `
            -Headers $resendHeaders
        
        Write-Host "📝 DNS Records to add to Cloudflare:" -ForegroundColor Yellow
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        foreach ($record in $domainDetails.records) {
            Write-Host "Type: $($record.record_type)" -ForegroundColor White
            Write-Host "Name: $($record.name)" -ForegroundColor Cyan
            Write-Host "Value: $($record.value)" -ForegroundColor Green
            Write-Host "Status: $($record.status)" -ForegroundColor $(if ($record.status -eq "verified") { "Green" } else { "Yellow" })
            Write-Host "---" -ForegroundColor DarkGray
        }
        
        Write-Host "`n📌 Manual Steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://dash.cloudflare.com/$env:CLOUDFLARE_ZONE_ID/dns/records" -ForegroundColor White
        Write-Host "2. Add each record above" -ForegroundColor White
        Write-Host "3. Wait 5-10 minutes for propagation" -ForegroundColor White
        Write-Host "4. Return to https://resend.com/domains and click 'Verify'" -ForegroundColor White
        
    } else {
        Write-Host "❌ Domain not found in Resend" -ForegroundColor Red
        Write-Host "Add it at: https://resend.com/domains" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
