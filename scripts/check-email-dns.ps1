# ====================================
# Check Email DNS Records for longsang.org
# ====================================

$domain = "longsang.org"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  EMAIL DNS CHECK: $domain" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check MX Records
Write-Host "📧 MX Records (Mail Servers):" -ForegroundColor Yellow
try {
    $mx = Resolve-DnsName -Name $domain -Type MX -ErrorAction Stop
    if ($mx) {
        $mx | ForEach-Object {
            Write-Host "  ✓ $($_.NameExchange) (Priority: $($_.Preference))" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ❌ No MX records found" -ForegroundColor Red
    Write-Host "  → Need to setup Cloudflare Email Routing" -ForegroundColor Yellow
}

Write-Host ""

# Check SPF Record
Write-Host "🔒 SPF Record (Sender Policy Framework):" -ForegroundColor Yellow
try {
    $spf = Resolve-DnsName -Name $domain -Type TXT -ErrorAction Stop | Where-Object { $_.Strings -like "*v=spf1*" }
    if ($spf) {
        $spf.Strings | ForEach-Object {
            Write-Host "  ✓ $_" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ No SPF record found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error checking SPF" -ForegroundColor Red
}

Write-Host ""

# Check DMARC Record
Write-Host "🛡️ DMARC Record:" -ForegroundColor Yellow
try {
    $dmarc = Resolve-DnsName -Name "_dmarc.$domain" -Type TXT -ErrorAction Stop
    if ($dmarc) {
        $dmarc.Strings | ForEach-Object {
            Write-Host "  ✓ $_" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️ No DMARC record found (optional but recommended)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ No DMARC record found (optional but recommended)" -ForegroundColor Yellow
}

Write-Host ""

# Recommendations
Write-Host "📋 SETUP CHECKLIST:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Cloudflare Email Routing (FREE):" -ForegroundColor White
Write-Host "   → https://dash.cloudflare.com" -ForegroundColor Gray
Write-Host "   → Select: longsang.org" -ForegroundColor Gray
Write-Host "   → Email → Email Routing → Enable" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create Email Addresses:" -ForegroundColor White
Write-Host "   • admin@longsang.org" -ForegroundColor Gray
Write-Host "   • contact@longsang.org" -ForegroundColor Gray
Write-Host "   • hello@longsang.org" -ForegroundColor Gray
Write-Host "   • support@longsang.org" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Forward to your Gmail" -ForegroundColor White
Write-Host ""
Write-Host "💡 TIP: Enable Catch-All (*@longsang.org) to receive ALL emails!" -ForegroundColor Yellow
Write-Host ""
