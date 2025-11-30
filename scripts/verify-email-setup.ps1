# ====================================================
# EMAIL SETUP VERIFICATION SCRIPT
# Auto-verify email routing configuration
# ====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  EMAIL VERIFICATION" -ForegroundColor Cyan
Write-Host "  Domain: $Domain" -ForegroundColor White
Write-Host "================================`n" -ForegroundColor Cyan

$allPass = $true

# Check MX Records
Write-Host "📧 Checking MX Records..." -ForegroundColor Yellow
try {
    $mx = Resolve-DnsName -Name $Domain -Type MX -ErrorAction Stop
    $cfMX = $mx | Where-Object { $_.NameExchange -like "*cloudflare.net" }
    
    if ($cfMX) {
        Write-Host "✅ PASS: Cloudflare MX records configured" -ForegroundColor Green
        $cfMX | ForEach-Object {
            Write-Host "   → $($_.NameExchange)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ FAIL: No Cloudflare MX records found" -ForegroundColor Red
        $allPass = $false
    }
} catch {
    Write-Host "❌ FAIL: No MX records" -ForegroundColor Red
    $allPass = $false
}

# Check SPF
Write-Host "`n🔒 Checking SPF Record..." -ForegroundColor Yellow
try {
    $spf = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction Stop | Where-Object { $_.Strings -like "*v=spf1*" }
    
    if ($spf -and $spf.Strings -like "*cloudflare*") {
        Write-Host "✅ PASS: SPF configured for Cloudflare" -ForegroundColor Green
        Write-Host "   → $($spf.Strings)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  WARNING: SPF not found or not configured for Cloudflare" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  WARNING: SPF not configured" -ForegroundColor Yellow
}

# Check DMARC
Write-Host "`n🛡️  Checking DMARC Record..." -ForegroundColor Yellow
try {
    $dmarc = Resolve-DnsName -Name "_dmarc.$Domain" -Type TXT -ErrorAction Stop
    
    if ($dmarc) {
        Write-Host "✅ PASS: DMARC configured" -ForegroundColor Green
        Write-Host "   → $($dmarc.Strings)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: DMARC not configured" -ForegroundColor Red
        Write-Host "   → Add DMARC record to prevent spam" -ForegroundColor Yellow
        $allPass = $false
    }
} catch {
    Write-Host "❌ FAIL: DMARC not configured" -ForegroundColor Red
    $allPass = $false
}

# Overall Score
Write-Host "`n================================" -ForegroundColor Cyan
if ($allPass) {
    Write-Host "  ✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "  Email Score: 10/10" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "  Please fix issues above" -ForegroundColor Yellow
}
Write-Host "================================`n" -ForegroundColor Cyan

# Test Email Deliverability
Write-Host "🧪 Test Email Deliverability:" -ForegroundColor Cyan
Write-Host "   1. Send email to: admin@$Domain" -ForegroundColor White
Write-Host "   2. Or test at: https://www.mail-tester.com" -ForegroundColor White
Write-Host ""
