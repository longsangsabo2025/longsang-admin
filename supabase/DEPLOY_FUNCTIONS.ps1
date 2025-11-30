# =====================================================
# DEPLOY SUPABASE EDGE FUNCTIONS
# =====================================================
# Quick deploy script for Supabase functions
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ⚡ DEPLOYING EDGE FUNCTIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if logged in
Write-Host "🔐 Checking Supabase CLI login..." -ForegroundColor Yellow

try {
    $loginCheck = npx supabase projects list 2>&1
    
    if ($LASTEXITCODE -ne 0 -or $loginCheck -match "not logged in") {
        Write-Host "❌ Not logged in to Supabase" -ForegroundColor Red
        Write-Host "   Running login..." -ForegroundColor Yellow
        npx supabase login
    } else {
        Write-Host "✅ Already logged in" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Supabase CLI not available" -ForegroundColor Red
    Write-Host "   Install: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Deploy functions
Write-Host "`n📦 Deploying functions..." -ForegroundColor Yellow

Write-Host "`n1️⃣  Deploying send-email..." -ForegroundColor Cyan
npx supabase functions deploy send-email --project-ref diexsbzqwsbpilsymnfb

Write-Host "`n2️⃣  Deploying process-queue..." -ForegroundColor Cyan
npx supabase functions deploy process-queue --project-ref diexsbzqwsbpilsymnfb

# Set secrets
Write-Host "`n🔑 Setting environment secrets..." -ForegroundColor Yellow

$resendKey = $env:RESEND_API_KEY
if (-not $resendKey) {
    # Load from .env
    Get-Content .env | ForEach-Object {
        if ($_ -match 'RESEND_API_KEY=(.+)') {
            $resendKey = $matches[1]
        }
    }
}

if ($resendKey) {
    Write-Host "   Setting RESEND_API_KEY..." -ForegroundColor Cyan
    npx supabase secrets set RESEND_API_KEY=$resendKey --project-ref diexsbzqwsbpilsymnfb
    Write-Host "✅ Secret set!" -ForegroundColor Green
} else {
    Write-Host "⚠️  RESEND_API_KEY not found in .env" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🌐 Function URLs:" -ForegroundColor Yellow
Write-Host "   send-email:    https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-email" -ForegroundColor White
Write-Host "   process-queue: https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/process-queue" -ForegroundColor White

Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test send-email function" -ForegroundColor White
Write-Host "   2. Setup cron job for process-queue" -ForegroundColor White
Write-Host "   3. Verify emails sending" -ForegroundColor White
Write-Host ""
