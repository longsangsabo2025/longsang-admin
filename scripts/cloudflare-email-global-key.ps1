# ====================================================
# CLOUDFLARE EMAIL ROUTING - USING GLOBAL API KEY
# Based on Official Cloudflare API Documentation
# ====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$GlobalKey,
    
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$AccountId,
    
    [Parameter(Mandatory=$true)]
    [string]$DestinationEmail,
    
    [Parameter(Mandatory=$false)]
    [string[]]$CustomAddresses = @("admin", "contact", "hello", "support", "info")
)

$ErrorActionPreference = "Stop"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE EMAIL SETUP" -ForegroundColor Cyan
Write-Host "  Using Global API Key" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Common headers for Global API Key
$headers = @{
    "X-Auth-Email" = $Email
    "X-Auth-Key" = $GlobalKey
    "Content-Type" = "application/json"
}

# ============================================
# STEP 1: Get Zone ID
# ============================================
Write-Host "🌍 STEP 1: Getting Zone ID for $Domain..." -ForegroundColor Yellow
try {
    $zones = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$Domain" `
        -Headers $headers -Method GET
    
    if ($zones.result.Count -gt 0) {
        $zoneId = $zones.result[0].id
        Write-Host "✅ Zone ID: $zoneId" -ForegroundColor Green
    } else {
        Write-Host "❌ Domain not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: Check Email Routing Status
# ============================================
Write-Host "`n📧 STEP 2: Checking Email Routing Status..." -ForegroundColor Yellow
try {
    $emailStatus = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing" `
        -Headers $headers -Method GET
    
    if ($emailStatus.result.enabled) {
        Write-Host "✅ Email Routing already enabled" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Email Routing not enabled, enabling now..." -ForegroundColor Yellow
        
        # Enable Email Routing via DNS endpoint
        $enable = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing/dns" `
            -Headers $headers -Method POST
        
        if ($enable.success) {
            Write-Host "✅ Email Routing enabled!" -ForegroundColor Green
            Write-Host "✅ MX and SPF records added automatically" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to enable Email Routing" -ForegroundColor Red
            Write-Host "Errors: $($enable.errors | ConvertTo-Json)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "⚠️  $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================
# STEP 3: Add Destination Address
# ============================================
Write-Host "`n📬 STEP 3: Adding Destination Address..." -ForegroundColor Yellow
try {
    # Check existing destinations
    $existingDest = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/email/routing/addresses" `
        -Headers $headers -Method GET
    
    $destExists = $existingDest.result | Where-Object { $_.email -eq $DestinationEmail }
    
    if ($destExists) {
        Write-Host "✅ Destination exists: $DestinationEmail" -ForegroundColor Green
        
        if ($destExists.verified) {
            Write-Host "✅ Already verified" -ForegroundColor Green
        } else {
            Write-Host "⚠️  NOT VERIFIED - Check email: $DestinationEmail" -ForegroundColor Yellow
            Write-Host "   Click the verification link in your inbox!" -ForegroundColor White
        }
    } else {
        # Add new destination
        $destBody = @{
            email = $DestinationEmail
        } | ConvertTo-Json
        
        $addDest = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/email/routing/addresses" `
            -Headers $headers -Method POST -Body $destBody
        
        if ($addDest.success) {
            Write-Host "✅ Destination added: $DestinationEmail" -ForegroundColor Green
            Write-Host "⚠️  CHECK EMAIL NOW!" -ForegroundColor Yellow
            Write-Host "   Verification email sent to: $DestinationEmail" -ForegroundColor White
            Write-Host "   You must verify before continuing..." -ForegroundColor White
        } else {
            Write-Host "❌ Failed to add destination" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Pause for verification
Write-Host "`n⏸️  PAUSE: Verify destination email" -ForegroundColor Cyan
Write-Host "   1. Check inbox: $DestinationEmail" -ForegroundColor White
Write-Host "   2. Click verification link" -ForegroundColor White
Write-Host "   3. Press ENTER to continue..." -ForegroundColor Yellow
Read-Host

# ============================================
# STEP 4: Create Custom Email Addresses
# ============================================
Write-Host "`n✉️  STEP 4: Creating Custom Email Addresses..." -ForegroundColor Yellow

foreach ($address in $CustomAddresses) {
    $customEmail = "$address@$Domain"
    
    try {
        # Check existing rules
        $existingRules = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/email/routing/rules" `
            -Headers $headers -Method GET
        
        $ruleExists = $existingRules.result | Where-Object { 
            $_.matchers[0].type -eq "literal" -and $_.matchers[0].value -eq $customEmail 
        }
        
        if ($ruleExists) {
            Write-Host "  ✓ $customEmail (exists)" -ForegroundColor Gray
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
        Write-Host "  ❌ Error: $customEmail - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# STEP 5: Add DMARC Record
# ============================================
Write-Host "`n🛡️  STEP 5: Adding DMARC Record..." -ForegroundColor Yellow
try {
    # Check existing DMARC
    $dnsRecords = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?type=TXT&name=_dmarc.$Domain" `
        -Headers $headers -Method GET
    
    if ($dnsRecords.result.Count -gt 0) {
        Write-Host "✅ DMARC already exists" -ForegroundColor Green
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
            Write-Host "✅ DMARC record added!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add DMARC" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 6: Verify DNS
# ============================================
Write-Host "`n🧪 STEP 6: Verifying DNS..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$mx = Resolve-DnsName -Name $Domain -Type MX -ErrorAction SilentlyContinue
if ($mx) {
    Write-Host "  ✅ MX Records OK" -ForegroundColor Green
}

$spf = Resolve-DnsName -Name $Domain -Type TXT -ErrorAction SilentlyContinue | Where-Object { $_.Strings -like "*v=spf1*" }
if ($spf) {
    Write-Host "  ✅ SPF Record OK" -ForegroundColor Green
}

$dmarc = Resolve-DnsName -Name "_dmarc.$Domain" -Type TXT -ErrorAction SilentlyContinue
if ($dmarc) {
    Write-Host "  ✅ DMARC Record OK" -ForegroundColor Green
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "📧 Email Addresses:" -ForegroundColor Cyan
foreach ($address in $CustomAddresses) {
    Write-Host "   ✓ $address@$Domain" -ForegroundColor Green
}

Write-Host "`n🎯 Test Now:" -ForegroundColor Yellow
Write-Host "   Send email to: admin@$Domain" -ForegroundColor White
Write-Host "   Check inbox: $DestinationEmail" -ForegroundColor White
Write-Host "`n💡 Test deliverability: https://www.mail-tester.com`n" -ForegroundColor Cyan
