# ============================================
# MANUAL DNS SETUP GUIDE
# ============================================

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

Clear-Host

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📋 MANUAL DNS SETUP FOR RESEND" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get DNS records from Resend
$resendHeaders = @{
    "Authorization" = "Bearer $env:RESEND_API_KEY"
    "Content-Type" = "application/json"
}

try {
    $domains = Invoke-RestMethod -Uri "https://api.resend.com/domains" -Method Get -Headers $resendHeaders
    $domain = $domains.data | Where-Object { $_.name -eq "longsang.org" }
    
    if ($domain) {
        $domainDetails = Invoke-RestMethod -Uri "https://api.resend.com/domains/$($domain.id)" -Method Get -Headers $resendHeaders
        
        Write-Host "✅ Domain: longsang.org (ID: $($domain.id))" -ForegroundColor Green
        Write-Host "📊 Status: $($domain.status)`n" -ForegroundColor Yellow
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  COPY THESE 3 DNS RECORDS" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        $recordNum = 1
        foreach ($record in $domainDetails.records) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Write-Host "  RECORD #$recordNum" -ForegroundColor Yellow
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
            
            Write-Host "Type:     " -NoNewline -ForegroundColor White
            Write-Host $record.record_type -ForegroundColor Cyan
            
            Write-Host "Name:     " -NoNewline -ForegroundColor White
            Write-Host $record.name -ForegroundColor Cyan
            
            if ($record.record_type -eq "MX") {
                Write-Host "Value:    " -NoNewline -ForegroundColor White
                Write-Host $record.value -ForegroundColor Green
                Write-Host "Priority: " -NoNewline -ForegroundColor White
                Write-Host "10" -ForegroundColor Green
            } else {
                Write-Host "Value:    " -NoNewline -ForegroundColor White
                Write-Host $record.value -ForegroundColor Green
            }
            
            Write-Host ""
            $recordNum++
        }
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  NEXT STEPS" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        Write-Host "1️⃣  Open Cloudflare DNS:" -ForegroundColor Yellow
        Write-Host "   https://dash.cloudflare.com/$env:CLOUDFLARE_ZONE_ID/dns/records`n" -ForegroundColor Cyan
        
        Write-Host "2️⃣  For each record above:" -ForegroundColor Yellow
        Write-Host "   • Click 'Add record'" -ForegroundColor White
        Write-Host "   • Copy Type, Name, Value from above" -ForegroundColor White
        Write-Host "   • For MX: Set Priority = 10" -ForegroundColor White
        Write-Host "   • Set Proxy = OFF (DNS only)" -ForegroundColor White
        Write-Host "   • Click 'Save'`n" -ForegroundColor White
        
        Write-Host "3️⃣  After adding all 3 records:" -ForegroundColor Yellow
        Write-Host "   • Wait 5-10 minutes" -ForegroundColor White
        Write-Host "   • Go to https://resend.com/domains" -ForegroundColor Cyan
        Write-Host "   • Click 'Verify' button`n" -ForegroundColor White
        
        Write-Host "4️⃣  When verified:" -ForegroundColor Yellow
        Write-Host "   • Run: .\DEPLOY_FUNCTIONS.ps1" -ForegroundColor White
        Write-Host "   • Update email from to: noreply@longsang.org" -ForegroundColor White
        Write-Host "   • Test: node scripts\test-system.js`n" -ForegroundColor White
        
        Write-Host "========================================`n" -ForegroundColor Green
        
        # Open Cloudflare DNS page
        Write-Host "🌐 Opening Cloudflare DNS..." -ForegroundColor Cyan
        Start-Process "https://dash.cloudflare.com/$env:CLOUDFLARE_ZONE_ID/dns/records"
        
    } else {
        Write-Host "❌ Domain not found in Resend" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
