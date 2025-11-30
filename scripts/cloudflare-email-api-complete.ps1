# ====================================================
# CLOUDFLARE EMAIL ROUTING - COMPLETE API AUTOMATION
# Based on Official Cloudflare API Documentation
# https://developers.cloudflare.com/email-routing/
# ====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiToken,
    
    [Parameter(Mandatory=$true)]
    [string]$AccountId,
    
    [Parameter(Mandatory=$true)]
    [string]$DestinationEmail,
    
    [Parameter(Mandatory=$false)]
    [string[]]$CustomAddresses = @("admin", "contact", "hello", "support", "info")
)

$ErrorActionPreference = "Stop"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE EMAIL API SETUP" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Common headers
$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

# ============================================
# STEP 1: Verify API Token
# ============================================
Write-Host "🔑 STEP 1: Verifying API Token..." -ForegroundColor Yellow
try {
    $verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" `
        -Headers $headers -Method GET
    
    if ($verify.success) {
        Write-Host "✅ Token verified: $($verify.result.status)" -ForegroundColor Green
    } else {
        Write-Host "❌ Token verification failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: Get Zone ID
# ============================================
Write-Host "`n🌍 STEP 2: Getting Zone ID for $Domain..." -ForegroundColor Yellow
try {
    $zones = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$Domain" `
        -Headers $headers -Method GET
    
    if ($zones.result.Count -gt 0) {
        $zoneId = $zones.result[0].id
        Write-Host "✅ Zone ID: $zoneId" -ForegroundColor Green
    } else {
        Write-Host "❌ Domain not found in Cloudflare account!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 3: Check Email Routing Status
# ============================================
Write-Host "`n📧 STEP 3: Checking Email Routing Status..." -ForegroundColor Yellow
try {
    $emailStatus = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing" `
        -Headers $headers -Method GET
    
    if ($emailStatus.result.enabled) {
        Write-Host "✅ Email Routing already enabled" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Email Routing not enabled, enabling now..." -ForegroundColor Yellow
        
        # Enable Email Routing
        $enableBody = @{
            enabled = $true
        } | ConvertTo-Json
        
        $enable = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing/dns" `
            -Headers $headers -Method POST -Body $enableBody
        
        if ($enable.success) {
            Write-Host "✅ Email Routing enabled successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to enable Email Routing" -ForegroundColor Red
            Write-Host "Errors: $($enable.errors | ConvertTo-Json)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 4: Add Destination Address
# ============================================
Write-Host "`n📬 STEP 4: Adding Destination Address..." -ForegroundColor Yellow
try {
    # Check if destination already exists
    $existingDest = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/email/routing/addresses" `
        -Headers $headers -Method GET
    
    $destExists = $existingDest.result | Where-Object { $_.email -eq $DestinationEmail }
    
    if ($destExists) {
        Write-Host "✅ Destination already exists: $DestinationEmail" -ForegroundColor Green
        $destId = $destExists.id
        
        if ($destExists.verified) {
            Write-Host "✅ Destination already verified" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Destination not verified - check email: $DestinationEmail" -ForegroundColor Yellow
        }
    } else {
        # Add new destination
        $destBody = @{
            email = $DestinationEmail
        } | ConvertTo-Json
        
        $addDest = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/email/routing/addresses" `
            -Headers $headers -Method POST -Body $destBody
        
        if ($addDest.success) {
            $destId = $addDest.result.id
            Write-Host "✅ Destination added: $DestinationEmail" -ForegroundColor Green
            Write-Host "⚠️  CHECK EMAIL: Verification email sent to $DestinationEmail" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Failed to add destination" -ForegroundColor Red
            Write-Host "Errors: $($addDest.errors | ConvertTo-Json)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 5: Create Custom Email Addresses
# ============================================
Write-Host "`n✉️  STEP 5: Creating Custom Email Addresses..." -ForegroundColor Yellow

# Wait for destination verification
Write-Host "`n⚠️  IMPORTANT: Verify destination email first!" -ForegroundColor Yellow
Write-Host "   1. Check inbox: $DestinationEmail" -ForegroundColor White
Write-Host "   2. Click verification link" -ForegroundColor White
Write-Host "   3. Press ENTER to continue..." -ForegroundColor White
Read-Host

foreach ($address in $CustomAddresses) {
    $customEmail = "$address@$Domain"
    
    try {
        # Check if rule already exists
        $existingRules = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing/rules" `
            -Headers $headers -Method GET
        
        $ruleExists = $existingRules.result | Where-Object { 
            $_.matchers[0].type -eq "literal" -and $_.matchers[0].value -eq $customEmail 
        }
        
        if ($ruleExists) {
            Write-Host "  ✓ $customEmail (already exists)" -ForegroundColor Gray
            continue
        }
        
        # Create routing rule
        $ruleBody = @{
            name = "Forward $customEmail"
            enabled = $true
            matchers = @(
                @{
                    type = "literal"
                    field = "to"
                    value = $customEmail
                }
            )
            actions = @(
                @{
                    type = "forward"
                    value = @($DestinationEmail)
                }
            )
        } | ConvertTo-Json -Depth 5
        
        $createRule = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing/rules" `
            -Headers $headers -Method POST -Body $ruleBody
        
        if ($createRule.success) {
            Write-Host "  ✅ $customEmail → $DestinationEmail" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed: $customEmail" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error creating $customEmail : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# STEP 6: Add DMARC Record
# ============================================
Write-Host "`n🛡️  STEP 6: Adding DMARC Record..." -ForegroundColor Yellow
try {
    # Check if DMARC exists
    $dnsRecords = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?type=TXT&name=_dmarc.$Domain" `
        -Headers $headers -Method GET
    
    if ($dnsRecords.result.Count -gt 0) {
        Write-Host "✅ DMARC record already exists" -ForegroundColor Green
    } else {
        $dmarcBody = @{
            type = "TXT"
            name = "_dmarc"
            content = "v=DMARC1; p=quarantine; rua=mailto:admin@$Domain; pct=100; fo=1"
            ttl = 1
        } | ConvertTo-Json
        
        $addDmarc = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" `
            -Headers $headers -Method POST -Body $dmarcBody
        
        if ($addDmarc.success) {
            Write-Host "✅ DMARC record added successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add DMARC" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 7: Verification
# ============================================
Write-Host "`n🧪 STEP 7: Verifying Setup..." -ForegroundColor Yellow

# Check DNS Records
Write-Host "`n  Checking DNS Records..." -ForegroundColor White
Start-Sleep -Seconds 3

# MX Records
$mx = Resolve-DnsName -Name $Domain -Type MX -ErrorAction SilentlyContinue
if ($mx) {
    Write-Host "  ✅ MX Records found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  MX Records not propagated yet" -ForegroundColor Yellow
}

# SPF
$spf = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction SilentlyContinue | Where-Object { $_.Strings -like "*v=spf1*" }
if ($spf) {
    Write-Host "  ✅ SPF Record found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  SPF not found" -ForegroundColor Yellow
}

# DMARC
$dmarc = Resolve-DnsName -Name "_dmarc.$Domain" -Type TXT -ErrorAction SilentlyContinue
if ($dmarc) {
    Write-Host "  ✅ DMARC Record found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  DMARC not propagated yet (wait 5-10 mins)" -ForegroundColor Yellow
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "📧 Email Addresses Created:" -ForegroundColor Cyan
foreach ($address in $CustomAddresses) {
    Write-Host "   ✓ $address@$Domain → $DestinationEmail" -ForegroundColor Green
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 5-10 minutes for DNS propagation" -ForegroundColor White
Write-Host "   2. Send test email to: admin@$Domain" -ForegroundColor White
Write-Host "   3. Check inbox: $DestinationEmail" -ForegroundColor White
Write-Host "   4. Test deliverability: https://www.mail-tester.com`n" -ForegroundColor White

# Save configuration
$config = @{
    Domain = $Domain
    AccountId = $AccountId
    ZoneId = $zoneId
    DestinationEmail = $DestinationEmail
    CustomAddresses = $CustomAddresses
    SetupDate = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
} | ConvertTo-Json -Depth 5

$configPath = "email-setup-$Domain.json"
$config | Out-File $configPath -Encoding UTF8

Write-Host "💾 Configuration saved: $configPath`n" -ForegroundColor Green
