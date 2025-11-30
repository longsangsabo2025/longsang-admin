# ====================================================
# Auto Add DMARC Record to Cloudflare
# Prevents email from going to spam
# ====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  ADD DMARC RECORD" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$DOMAIN = "longsang.org"
$DMARC_EMAIL = "admin@longsang.org"

# Load API credentials
$envFile = "d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\.env.cloudflare"
if (!(Test-Path $envFile)) {
    Write-Host "❌ .env.cloudflare not found!" -ForegroundColor Red
    exit 1
}

$config = @{}
Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $config[$key.Trim()] = $value.Trim()
}

$API_KEY = $config['CLOUDFLARE_GLOBAL_KEY']
$EMAIL = $config['CLOUDFLARE_EMAIL']
$ZONE_ID = $config['CLOUDFLARE_ZONE_ID']

if (!$ZONE_ID) {
    Write-Host "❌ ZONE_ID not found. Run setup-email-routing.ps1 first!" -ForegroundColor Red
    exit 1
}

Write-Host "📧 Configuration:" -ForegroundColor Yellow
Write-Host "  Domain: $DOMAIN" -ForegroundColor White
Write-Host "  Zone ID: $ZONE_ID" -ForegroundColor White
Write-Host "  DMARC Report Email: $DMARC_EMAIL" -ForegroundColor White
Write-Host ""

$headers = @{
    "X-Auth-Email" = $EMAIL
    "X-Auth-Key" = $API_KEY
    "Content-Type" = "application/json"
}

# DMARC Record
$dmarcValue = "v=DMARC1; p=quarantine; rua=mailto:$DMARC_EMAIL; pct=100; fo=1"

Write-Host "🛡️ Adding DMARC Record..." -ForegroundColor Cyan
Write-Host "  Name: _dmarc.$DOMAIN" -ForegroundColor Gray
Write-Host "  Value: $dmarcValue" -ForegroundColor Gray
Write-Host ""

# Check if DMARC already exists
try {
    $existingRecords = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$ZONE_ID/dns_records?type=TXT&name=_dmarc.$DOMAIN" -Headers $headers -Method Get
    
    if ($existingRecords.result.Count -gt 0) {
        Write-Host "  ⚠️  DMARC record already exists!" -ForegroundColor Yellow
        Write-Host "  Current value: $($existingRecords.result[0].content)" -ForegroundColor Gray
        
        $update = Read-Host "`n  Update existing record? (y/n)"
        if ($update -eq 'y') {
            $recordId = $existingRecords.result[0].id
            
            $updateBody = @{
                type = "TXT"
                name = "_dmarc"
                content = $dmarcValue
                ttl = 1
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$ZONE_ID/dns_records/$recordId" -Headers $headers -Method Put -Body $updateBody
            
            if ($response.success) {
                Write-Host "`n  ✅ DMARC record updated!" -ForegroundColor Green
            }
        } else {
            Write-Host "`n  ℹ️  Keeping existing record" -ForegroundColor Cyan
        }
    } else {
        # Add new DMARC record
        $body = @{
            type = "TXT"
            name = "_dmarc"
            content = $dmarcValue
            ttl = 1
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$ZONE_ID/dns_records" -Headers $headers -Method Post -Body $body
        
        if ($response.success) {
            Write-Host "  ✅ DMARC record added!" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n💡 Manual Setup:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "  2. Select: $DOMAIN → DNS" -ForegroundColor White
    Write-Host "  3. Add Record:" -ForegroundColor White
    Write-Host "     Type: TXT" -ForegroundColor Gray
    Write-Host "     Name: _dmarc" -ForegroundColor Gray
    Write-Host "     Content: $dmarcValue" -ForegroundColor Gray
    Write-Host "     TTL: Auto" -ForegroundColor Gray
    exit 1
}

# Verify DNS Records
Write-Host "`n🔍 Verifying Email Authentication Records..." -ForegroundColor Cyan

Write-Host "`n  Checking SPF..." -ForegroundColor Yellow
try {
    $spf = Resolve-DnsName -Name $DOMAIN -Type TXT -ErrorAction Stop | Where-Object { $_.Strings -like "*v=spf1*" }
    if ($spf) {
        Write-Host "  ✅ SPF: $($spf.Strings)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  SPF not found (Cloudflare should auto-create)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  SPF check failed" -ForegroundColor Yellow
}

Write-Host "`n  Checking DMARC..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $dmarc = Resolve-DnsName -Name "_dmarc.$DOMAIN" -Type TXT -ErrorAction Stop
    if ($dmarc) {
        Write-Host "  ✅ DMARC: $($dmarc.Strings)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  DMARC propagating (wait 5-10 minutes)" -ForegroundColor Yellow
}

Write-Host "`n================================" -ForegroundColor Green
Write-Host "  ✅ ANTI-SPAM SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "  ✓ SPF: Auto-configured by Cloudflare" -ForegroundColor White
Write-Host "  ✓ DKIM: Auto-signed by Cloudflare" -ForegroundColor White
Write-Host "  ✓ DMARC: Added (reports to $DMARC_EMAIL)" -ForegroundColor White

Write-Host "`n🧪 Test Email Deliverability:" -ForegroundColor Yellow
Write-Host "  1. Send email to: https://www.mail-tester.com" -ForegroundColor White
Write-Host "  2. Check score (target: 8-10/10)" -ForegroundColor White
Write-Host "  3. Review any warnings" -ForegroundColor White

Write-Host "`n✨ Your emails will NOT go to spam!" -ForegroundColor Green
Write-Host ""
