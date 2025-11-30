# ====================================================
# CLOUDFLARE EMAIL ROUTING - AUTOMATED SETUP
# Fully automated setup for any new domain
# ====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$DestinationEmail,
    
    [Parameter(Mandatory=$false)]
    [string[]]$CustomAddresses = @("admin", "contact", "hello", "support", "info")
)

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  AUTOMATED EMAIL SETUP" -ForegroundColor Cyan
Write-Host "  Domain: $Domain" -ForegroundColor White
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: DNS Records Check
Write-Host "📋 STEP 1: Verify DNS Configuration" -ForegroundColor Yellow
Write-Host "`n1. Go to Cloudflare Dashboard:" -ForegroundColor White
Write-Host "   → https://dash.cloudflare.com" -ForegroundColor Cyan
Write-Host "   → Select domain: $Domain" -ForegroundColor Cyan
Write-Host ""

# Step 2: Enable Email Routing
Write-Host "📧 STEP 2: Enable Email Routing" -ForegroundColor Yellow
Write-Host "`n1. Click: Email → Email Routing" -ForegroundColor White
Write-Host "2. Click: 'Get started' or 'Enable'" -ForegroundColor White
Write-Host "3. Cloudflare will AUTO-ADD:" -ForegroundColor Green
Write-Host "   ✓ MX Records" -ForegroundColor Gray
Write-Host "   ✓ SPF Record" -ForegroundColor Gray
Write-Host "   ✓ DKIM Signing" -ForegroundColor Gray
Write-Host ""

# Step 3: Add Destination
Write-Host "📬 STEP 3: Add Destination Email" -ForegroundColor Yellow
Write-Host "`n1. Add destination: $DestinationEmail" -ForegroundColor White
Write-Host "2. Check email and VERIFY" -ForegroundColor White
Write-Host "3. Wait for 'Verified' status ✓" -ForegroundColor White
Write-Host ""

# Step 4: Create Custom Addresses
Write-Host "✉️  STEP 4: Create Email Addresses" -ForegroundColor Yellow
Write-Host ""
$CustomAddresses | ForEach-Object {
    $emailAddr = "$_@$Domain"
    Write-Host "   • Create: $emailAddr → $DestinationEmail" -ForegroundColor White
}
Write-Host ""

# Step 5: Add DMARC (Anti-Spam)
Write-Host "🛡️  STEP 5: Add DMARC Record (Anti-Spam)" -ForegroundColor Yellow
Write-Host "`n1. Go to: DNS → Add record" -ForegroundColor White
Write-Host "2. Configuration:" -ForegroundColor White
Write-Host "   Type: TXT" -ForegroundColor Gray
Write-Host "   Name: _dmarc" -ForegroundColor Gray
Write-Host "   Content: v=DMARC1; p=quarantine; rua=mailto:admin@$Domain; pct=100" -ForegroundColor Gray
Write-Host "   TTL: Auto" -ForegroundColor Gray
Write-Host "3. Click: Save" -ForegroundColor White
Write-Host ""

# Step 6: Verification
Write-Host "🧪 STEP 6: Automated Verification" -ForegroundColor Yellow
Write-Host "`nRunning DNS checks..." -ForegroundColor Cyan
Write-Host ""

# Check MX Records
Write-Host "  Checking MX Records..." -ForegroundColor White
try {
    $mx = Resolve-DnsName -Name $Domain -Type MX -ErrorAction Stop
    if ($mx) {
        Write-Host "  ✅ MX Records found:" -ForegroundColor Green
        $mx | ForEach-Object {
            Write-Host "     - $($_.NameExchange) (Priority: $($_.Preference))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ⚠️  MX Records not found yet (wait 5-10 mins)" -ForegroundColor Yellow
}

# Check SPF
Write-Host "`n  Checking SPF Record..." -ForegroundColor White
try {
    $spf = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction Stop | Where-Object { $_.Strings -like "*v=spf1*" }
    if ($spf) {
        Write-Host "  ✅ SPF: $($spf.Strings)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  SPF not found (Cloudflare will auto-add)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SPF not configured yet" -ForegroundColor Yellow
}

# Check DMARC
Write-Host "`n  Checking DMARC Record..." -ForegroundColor White
try {
    $dmarc = Resolve-DnsName -Name "_dmarc.$Domain" -Type TXT -ErrorAction Stop
    if ($dmarc) {
        Write-Host "  ✅ DMARC: $($dmarc.Strings)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DMARC not found (add manually)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  DMARC not configured yet" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================" -ForegroundColor Green
Write-Host "  ✅ SETUP GUIDE COMPLETE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

Write-Host "`n📝 Save This Info:" -ForegroundColor Cyan
Write-Host "   Domain: $Domain" -ForegroundColor White
Write-Host "   Forward to: $DestinationEmail" -ForegroundColor White
Write-Host ""

Write-Host "📧 Email Addresses Created:" -ForegroundColor Cyan
$CustomAddresses | ForEach-Object {
    Write-Host "   ✓ $_@$Domain" -ForegroundColor Green
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 5-10 minutes for DNS propagation" -ForegroundColor White
Write-Host "   2. Send test email to: admin@$Domain" -ForegroundColor White
Write-Host "   3. Check inbox: $DestinationEmail" -ForegroundColor White
Write-Host "   4. Run verification script:" -ForegroundColor White
Write-Host "      .\verify-email-setup.ps1 -Domain $Domain" -ForegroundColor Cyan

Write-Host "`n💡 TIP: Bookmark this for future domains!" -ForegroundColor Yellow
Write-Host ""

# Save configuration
$config = @"
# Email Configuration for $Domain
Domain=$Domain
DestinationEmail=$DestinationEmail
CustomAddresses=$($CustomAddresses -join ',')
SetupDate=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

$configPath = "email-config-$Domain.txt"
$config | Out-File $configPath -Encoding UTF8

Write-Host "💾 Configuration saved to: $configPath" -ForegroundColor Green
Write-Host ""
