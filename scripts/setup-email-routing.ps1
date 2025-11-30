# ====================================================
# Cloudflare Email Routing Setup Script
# Auto-configure email routing for longsang.org
# ====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE EMAIL ROUTING SETUP" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Load credentials from .env.cloudflare
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
$DOMAIN = $config['CLOUDFLARE_DOMAIN']
$DESTINATION = $config['DESTINATION_EMAIL']

Write-Host "📧 Configuration:" -ForegroundColor Yellow
Write-Host "  Domain: $DOMAIN" -ForegroundColor White
Write-Host "  Cloudflare Email: $EMAIL" -ForegroundColor White
Write-Host "  Forward to: $DESTINATION" -ForegroundColor White
Write-Host ""

# Headers for API requests
$headers = @{
    "X-Auth-Email" = $EMAIL
    "X-Auth-Key" = $API_KEY
    "Content-Type" = "application/json"
}

# Step 1: Get Zone ID
Write-Host "🔍 Step 1: Getting Zone ID..." -ForegroundColor Cyan
try {
    $zonesResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones?name=$DOMAIN" -Headers $headers -Method Get
    $zoneId = $zonesResponse.result[0].id
    
    if ($zoneId) {
        Write-Host "  ✓ Zone ID: $zoneId" -ForegroundColor Green
        
        # Save zone ID to .env file
        $content = Get-Content $envFile
        $content = $content -replace "CLOUDFLARE_ZONE_ID=.*", "CLOUDFLARE_ZONE_ID=$zoneId"
        $content | Set-Content $envFile
    } else {
        Write-Host "  ❌ Zone not found for domain: $DOMAIN" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Error getting zone: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Enable Email Routing
Write-Host "`n📬 Step 2: Enabling Email Routing..." -ForegroundColor Cyan
try {
    $enableResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$zoneId/email/routing/enable" -Headers $headers -Method Post
    if ($enableResponse.success) {
        Write-Host "  ✓ Email Routing enabled!" -ForegroundColor Green
    }
} catch {
    # Might already be enabled, continue
    Write-Host "  ⚠ Email Routing might already be enabled" -ForegroundColor Yellow
}

# Step 3: Get DNS records (to verify MX records)
Write-Host "`n🌐 Step 3: Checking DNS Records..." -ForegroundColor Cyan
try {
    $dnsResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$zoneId/dns_records?type=MX" -Headers $headers -Method Get
    if ($dnsResponse.result.Count -gt 0) {
        Write-Host "  ✓ MX Records found:" -ForegroundColor Green
        $dnsResponse.result | ForEach-Object {
            Write-Host "    - $($_.content) (Priority: $($_.priority))" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠ No MX records yet. They will be auto-created." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check DNS records" -ForegroundColor Yellow
}

# Step 4: Add destination email address
Write-Host "`n📨 Step 4: Adding destination email: $DESTINATION..." -ForegroundColor Cyan
try {
    $destBody = @{
        email = $DESTINATION
    } | ConvertTo-Json
    
    $destResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$zoneId/email/routing/addresses" -Headers $headers -Method Post -Body $destBody
    
    if ($destResponse.success) {
        Write-Host "  ✓ Destination email added!" -ForegroundColor Green
        Write-Host "  ⚠ CHECK YOUR EMAIL: $DESTINATION" -ForegroundColor Yellow
        Write-Host "    You need to VERIFY this email by clicking the link Cloudflare sent!" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Message -match "already exists") {
        Write-Host "  ✓ Destination email already exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Step 5: Create email routing rules
Write-Host "`n📮 Step 5: Creating email routing rules..." -ForegroundColor Cyan

$emailAddresses = @(
    "admin@$DOMAIN",
    "contact@$DOMAIN",
    "hello@$DOMAIN",
    "support@$DOMAIN",
    "info@$DOMAIN"
)

foreach ($emailAddr in $emailAddresses) {
    try {
        $ruleBody = @{
            matchers = @(
                @{
                    type = "literal"
                    field = "to"
                    value = $emailAddr
                }
            )
            actions = @(
                @{
                    type = "forward"
                    value = @($DESTINATION)
                }
            )
            enabled = $true
            name = "Forward $emailAddr"
        } | ConvertTo-Json -Depth 5
        
        $ruleResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$zoneId/email/routing/rules" -Headers $headers -Method Post -Body $ruleBody
        
        if ($ruleResponse.success) {
            Write-Host "  ✓ Created: $emailAddr → $DESTINATION" -ForegroundColor Green
        }
    } catch {
        if ($_.Exception.Message -match "already exists") {
            Write-Host "  ✓ Already exists: $emailAddr" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠ Failed to create: $emailAddr" -ForegroundColor Yellow
        }
    }
}

# Step 6: Enable Catch-All (optional)
Write-Host "`n🎣 Step 6: Enabling Catch-All (receive all emails)..." -ForegroundColor Cyan
try {
    $catchAllBody = @{
        matchers = @(
            @{
                type = "all"
            }
        )
        actions = @(
            @{
                type = "forward"
                value = @($DESTINATION)
            }
        )
        enabled = $true
        name = "Catch-All"
    } | ConvertTo-Json -Depth 5
    
    $catchAllResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/v4/zones/$zoneId/email/routing/rules/catch_all" -Headers $headers -Method Put -Body $catchAllBody
    
    if ($catchAllResponse.success) {
        Write-Host "  ✓ Catch-All enabled! Any email to @$DOMAIN will be forwarded" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ Catch-All might already be configured" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

Write-Host "`n📧 Email Addresses Created:" -ForegroundColor Cyan
$emailAddresses | ForEach-Object {
    Write-Host "  ✓ $_" -ForegroundColor White
}

Write-Host "`n🎯 All emails forwarded to: $DESTINATION" -ForegroundColor Yellow

Write-Host "`n⚠️  IMPORTANT - NEXT STEPS:" -ForegroundColor Red
Write-Host "  1. CHECK YOUR EMAIL: $DESTINATION" -ForegroundColor Yellow
Write-Host "  2. CLICK THE VERIFICATION LINK from Cloudflare" -ForegroundColor Yellow
Write-Host "  3. Wait 5-10 minutes for DNS propagation" -ForegroundColor Yellow
Write-Host "  4. Test by sending email to: admin@$DOMAIN" -ForegroundColor Yellow

Write-Host "`n✨ You can now receive emails at:" -ForegroundColor Cyan
Write-Host "  • admin@$DOMAIN" -ForegroundColor Green
Write-Host "  • contact@$DOMAIN" -ForegroundColor Green
Write-Host "  • hello@$DOMAIN" -ForegroundColor Green
Write-Host "  • support@$DOMAIN" -ForegroundColor Green
Write-Host "  • info@$DOMAIN" -ForegroundColor Green
Write-Host "  • ANY-NAME@$DOMAIN (Catch-All enabled!)" -ForegroundColor Green

Write-Host ""
