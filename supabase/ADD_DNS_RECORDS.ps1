# ============================================
# AUTO-ADD RESEND DNS RECORDS TO CLOUDFLARE
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

# Cloudflare Configuration
$CLOUDFLARE_EMAIL = $env:CLOUDFLARE_EMAIL
$CLOUDFLARE_API_KEY = $env:CLOUDFLARE_API_KEY
$CLOUDFLARE_ZONE_ID = $env:CLOUDFLARE_ZONE_ID
$DOMAIN = "longsang.org"

Write-Host "🔑 Cloudflare Email: $CLOUDFLARE_EMAIL" -ForegroundColor DarkGray
Write-Host "🔑 Cloudflare Zone: $CLOUDFLARE_ZONE_ID" -ForegroundColor DarkGray
Write-Host "🔑 API Key: $($CLOUDFLARE_API_KEY.Substring(0,10))...`n" -ForegroundColor DarkGray

$headers = @{
    "X-Auth-Email" = $CLOUDFLARE_EMAIL
    "X-Auth-Key" = $CLOUDFLARE_API_KEY
    "Content-Type" = "application/json"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 RESEND DNS AUTO-SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# STEP 0: Verify Cloudflare API Access
# ============================================
Write-Host "🔐 Verifying Cloudflare API Access..." -ForegroundColor Yellow

try {
    $testResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID" `
        -Method Get `
        -Headers $headers
    
    if ($testResponse.success) {
        Write-Host "  ✅ API Access verified!" -ForegroundColor Green
        Write-Host "  📍 Zone: $($testResponse.result.name)" -ForegroundColor White
    } else {
        Write-Host "  ❌ API call failed: $($testResponse.errors[0].message)" -ForegroundColor Red
        Write-Host "`n💡 Please verify your credentials in .env:" -ForegroundColor Yellow
        Write-Host "   CLOUDFLARE_EMAIL=longsangsabo@gmail.com" -ForegroundColor White
        Write-Host "   CLOUDFLARE_API_KEY=your_global_api_key" -ForegroundColor White
        Write-Host "   CLOUDFLARE_ZONE_ID=845966ad8db7c98b0e945bf5555eb94c`n" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "  ❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Get your Global API Key from:" -ForegroundColor Yellow
    Write-Host "   https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Cyan
    Write-Host "   → Scroll to 'Global API Key' → View`n" -ForegroundColor White
    exit 1
}

# ============================================
# STEP 1: Add SPF Record (skip - using send subdomain)
# ============================================
Write-Host "⏭️  Skipping root SPF (using send.longsang.org)...`n" -ForegroundColor DarkGray

# ============================================
# STEP 2: Get DKIM Records from Resend
# ============================================
Write-Host "`n📋 Fetching DKIM records from Resend..." -ForegroundColor Yellow

$resendHeaders = @{
    "Authorization" = "Bearer $env:RESEND_API_KEY"
    "Content-Type" = "application/json"
}

try {
    # First, check if domain exists
    $domains = Invoke-RestMethod -Uri "https://api.resend.com/domains" `
        -Method Get `
        -Headers $resendHeaders
    
    $existingDomain = $domains.data | Where-Object { $_.name -eq $DOMAIN }
    
    if ($existingDomain) {
        Write-Host "  ✅ Domain already added to Resend" -ForegroundColor Green
        $domainId = $existingDomain.id
    } else {
        # Add domain to Resend
        Write-Host "  📌 Adding domain to Resend..." -ForegroundColor Cyan
        $addDomainBody = @{
            name = $DOMAIN
        } | ConvertTo-Json
        
        $newDomain = Invoke-RestMethod -Uri "https://api.resend.com/domains" `
            -Method Post `
            -Headers $resendHeaders `
            -Body $addDomainBody
        
        $domainId = $newDomain.id
        Write-Host "  ✅ Domain added to Resend (ID: $domainId)" -ForegroundColor Green
    }
    
    # Get domain details with DNS records
    $domainDetails = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" `
        -Method Get `
        -Headers $resendHeaders
    
    Write-Host "  📋 Got DNS records from Resend`n" -ForegroundColor Green
    
    # ============================================
    # STEP 3: Add ALL DNS Records (DKIM, MX, SPF)
    # ============================================
    Write-Host "📝 Adding all DNS records to Cloudflare..." -ForegroundColor Yellow
    
    foreach ($record in $domainDetails.records) {
        $recordType = $record.record_type
        $recordName = $record.name
        $recordValue = $record.value
        
        Write-Host "`n  Adding: $recordType - $recordName" -ForegroundColor Cyan
        
        $dnsRecord = @{
            type = $recordType
            name = $recordName
            content = $recordValue
            ttl = 1
        }
        
        # Add priority for MX records
        if ($recordType -eq "MX") {
            $dnsRecord.priority = 10
            $dnsRecord.proxied = $false
        } else {
            $dnsRecord.proxied = $false
        }
        
        try {
            $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" `
                -Method Post `
                -Headers $headers `
                -Body ($dnsRecord | ConvertTo-Json -Depth 10)
            
            if ($response.success) {
                Write-Host "    ✅ Added successfully" -ForegroundColor Green
            } else {
                Write-Host "    ❌ Failed: $($response.errors[0].message)" -ForegroundColor Red
            }
        } catch {
            $errorMsg = $_.Exception.Message
            if ($errorMsg -match "already exists") {
                Write-Host "    ⚠️  Already exists (skipping)" -ForegroundColor Yellow
            } elseif ($errorMsg -match "Authentication error") {
                Write-Host "    ❌ Auth error - checking API key..." -ForegroundColor Red
                Write-Host "       Email: $CLOUDFLARE_EMAIL" -ForegroundColor DarkGray
                Write-Host "       Key length: $($CLOUDFLARE_API_KEY.Length)" -ForegroundColor DarkGray
            } else {
                Write-Host "    ❌ Error: $errorMsg" -ForegroundColor Red
            }
        }
    }
    
    # ============================================
    # STEP 4: Verification Status
    # ============================================
    Write-Host "`n🔍 Checking verification status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $verifyStatus = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId/verify" `
        -Method Post `
        -Headers $resendHeaders
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  📊 VERIFICATION RESULTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    foreach ($record in $verifyStatus.records) {
        $status = if ($record.status -eq "verified") { "✅" } else { "⏳" }
        Write-Host "  $status $($record.record): $($record.status)" -ForegroundColor $(if ($record.status -eq "verified") { "Green" } else { "Yellow" })
    }
    
    if ($verifyStatus.status -eq "verified") {
        Write-Host "`n🎉 Domain verified successfully!" -ForegroundColor Green
        Write-Host "   You can now send 3,000 emails/day from @$DOMAIN" -ForegroundColor Green
        
        Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Update Edge Functions to use noreply@$DOMAIN" -ForegroundColor White
        Write-Host "   2. Redeploy functions: .\DEPLOY_FUNCTIONS.ps1" -ForegroundColor White
        Write-Host "   3. Test: node scripts\test-system.js" -ForegroundColor White
    } else {
        Write-Host "`n⏳ DNS propagation in progress..." -ForegroundColor Yellow
        Write-Host "   This can take 5-10 minutes" -ForegroundColor White
        Write-Host "   Check status: https://resend.com/domains" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n❌ Error accessing Resend API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPlease verify RESEND_API_KEY in .env file" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
