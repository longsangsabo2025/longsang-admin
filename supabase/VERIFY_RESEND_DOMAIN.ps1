# ============================================
# VERIFY RESEND DOMAIN
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

$resendHeaders = @{
    "Authorization" = "Bearer $env:RESEND_API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🔍 VERIFYING DOMAIN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    # Get domain ID
    $domains = Invoke-RestMethod -Uri "https://api.resend.com/domains" -Method Get -Headers $resendHeaders
    $domain = $domains.data | Where-Object { $_.name -eq "longsang.org" }
    
    if ($domain) {
        Write-Host "📋 Domain: longsang.org" -ForegroundColor White
        Write-Host "🆔 ID: $($domain.id)" -ForegroundColor White
        Write-Host "📊 Current Status: $($domain.status)`n" -ForegroundColor Yellow
        
        # Trigger verification
        Write-Host "🔄 Requesting verification..." -ForegroundColor Cyan
        $verifyResult = Invoke-RestMethod -Uri "https://api.resend.com/domains/$($domain.id)/verify" `
            -Method Post `
            -Headers $resendHeaders
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  📊 VERIFICATION RESULTS" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        foreach ($record in $verifyResult.records) {
            $status = if ($record.status -eq "verified") { "✅" } else { "⏳" }
            $color = if ($record.status -eq "verified") { "Green" } else { "Yellow" }
            
            Write-Host "  $status $($record.record): " -NoNewline -ForegroundColor $color
            Write-Host "$($record.status)" -ForegroundColor $color
        }
        
        Write-Host "`n========================================" -ForegroundColor Green
        
        if ($verifyResult.status -eq "verified") {
            Write-Host "`n🎉 DOMAIN VERIFIED SUCCESSFULLY!" -ForegroundColor Green
            Write-Host "   ✅ You can now send 3,000 emails/day" -ForegroundColor Green
            Write-Host "   ✅ From: noreply@longsang.org`n" -ForegroundColor Green
            
            Write-Host "📝 Next steps:" -ForegroundColor Yellow
            Write-Host "   1. Update Edge Functions to use verified domain" -ForegroundColor White
            Write-Host "   2. Run: .\UPDATE_TO_VERIFIED_DOMAIN.ps1" -ForegroundColor Cyan
            Write-Host "   3. Test: node scripts\test-system.js`n" -ForegroundColor White
        } else {
            Write-Host "`n⏳ DNS Propagation in progress..." -ForegroundColor Yellow
            Write-Host "   This can take 5-10 minutes" -ForegroundColor White
            Write-Host "   Run this script again to check status`n" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "❌ Domain not found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Cyan
