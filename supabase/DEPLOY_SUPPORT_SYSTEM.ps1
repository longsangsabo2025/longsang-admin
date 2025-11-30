# ============================================
# DEPLOY SUPPORT SYSTEM (FUNCTIONS & SECRETS)
# ============================================

$ErrorActionPreference = "Stop"

# Load environment variables
$envPath = Join-Path $PSScriptRoot ".env"
$envGmailPath = Join-Path $PSScriptRoot ".env.gmail"

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

if (Test-Path $envGmailPath) {
    Get-Content $envGmailPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$GMAIL_APP_PASSWORD = $env:GMAIL_APP_PASSWORD
$GMAIL_USER = "longsangsabo@gmail.com"

if (-not $GMAIL_APP_PASSWORD) {
    Write-Error "GMAIL_APP_PASSWORD not found in .env.gmail"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 DEPLOYING SUPPORT SYSTEM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Set Secrets
Write-Host "🔐 Setting Supabase Secrets..." -ForegroundColor Yellow
$secrets = "GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD", "GMAIL_USER=$GMAIL_USER"
# Note: We use --no-verify-jwt to avoid linking issues if not logged in, but usually we need to be linked.
# Assuming user is linked.
npx supabase secrets set $secrets

# 2. Deploy Functions
Write-Host "`n⚡ Deploying Edge Functions..." -ForegroundColor Yellow

Write-Host "  -> Deploying 'process-inbound-email'..." -ForegroundColor White
npx supabase functions deploy process-inbound-email --no-verify-jwt

Write-Host "  -> Deploying 'fetch-emails'..." -ForegroundColor White
npx supabase functions deploy fetch-emails --no-verify-jwt

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "👉 You can now set up a Cron Job to run 'fetch-emails' every minute." -ForegroundColor White
