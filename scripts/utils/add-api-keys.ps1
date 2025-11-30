# Add API Keys to Supabase Edge Functions
# Run this script after you have your API keys ready

Write-Host "🔐 Adding API Keys to Supabase Edge Functions" -ForegroundColor Cyan
Write-Host ""

$projectRef = "diexsbzqwsbpilsymnfb"

# Check if Supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "   Run: scoop install supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Enter your API keys (leave empty to skip):" -ForegroundColor Yellow
Write-Host ""

# ============================================
# AI Provider (Required for content generation)
# ============================================
Write-Host "1️⃣  AI Provider (Choose ONE):" -ForegroundColor Cyan
Write-Host "   Get OpenAI key: https://platform.openai.com/api-keys" -ForegroundColor Gray
Write-Host "   Get Claude key: https://console.anthropic.com/settings/keys" -ForegroundColor Gray
Write-Host ""

$openaiKey = Read-Host "   OpenAI API Key (sk-...)"
$claudeKey = Read-Host "   Anthropic API Key (sk-ant-...)"

if ($openaiKey) {
    Write-Host "   ⏳ Adding OpenAI key..." -ForegroundColor Yellow
    supabase secrets set OPENAI_API_KEY="$openaiKey" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ OpenAI key added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add OpenAI key" -ForegroundColor Red
    }
} elseif ($claudeKey) {
    Write-Host "   ⏳ Adding Claude key..." -ForegroundColor Yellow
    supabase secrets set ANTHROPIC_API_KEY="$claudeKey" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Claude key added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add Claude key" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  No AI key provided - content generation will use template fallback" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# Email Provider (Required for email automation)
# ============================================
Write-Host "2️⃣  Email Provider (Choose ONE):" -ForegroundColor Cyan
Write-Host "   Get Resend key: https://resend.com/api-keys (Recommended - 3K emails/month free)" -ForegroundColor Gray
Write-Host "   Get SendGrid key: https://app.sendgrid.com/settings/api_keys (100/day free)" -ForegroundColor Gray
Write-Host ""

$resendKey = Read-Host "   Resend API Key (re_...)"
$sendgridKey = Read-Host "   SendGrid API Key (SG....)"

if ($resendKey) {
    Write-Host "   ⏳ Adding Resend key..." -ForegroundColor Yellow
    supabase secrets set RESEND_API_KEY="$resendKey" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Resend key added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add Resend key" -ForegroundColor Red
    }
} elseif ($sendgridKey) {
    Write-Host "   ⏳ Adding SendGrid key..." -ForegroundColor Yellow
    supabase secrets set SENDGRID_API_KEY="$sendgridKey" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ SendGrid key added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add SendGrid key" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  No email key provided - email automation won't work" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# LinkedIn (Optional - for social automation)
# ============================================
Write-Host "3️⃣  LinkedIn (Optional):" -ForegroundColor Cyan
Write-Host "   Guide: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication" -ForegroundColor Gray
Write-Host ""

$linkedinToken = Read-Host "   LinkedIn Access Token"

if ($linkedinToken) {
    Write-Host "   ⏳ Adding LinkedIn token..." -ForegroundColor Yellow
    supabase secrets set LINKEDIN_ACCESS_TOKEN="$linkedinToken" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ LinkedIn token added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add LinkedIn token" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Skipped - LinkedIn automation disabled" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# Facebook (Optional - for social automation)
# ============================================
Write-Host "4️⃣  Facebook (Optional):" -ForegroundColor Cyan
Write-Host "   Get token: https://developers.facebook.com/tools/explorer/" -ForegroundColor Gray
Write-Host "   Get Page ID: https://www.facebook.com/[your-page] -> Page Info" -ForegroundColor Gray
Write-Host ""

$facebookToken = Read-Host "   Facebook Access Token"
$facebookPageId = Read-Host "   Facebook Page ID"

if ($facebookToken -and $facebookPageId) {
    Write-Host "   ⏳ Adding Facebook credentials..." -ForegroundColor Yellow
    supabase secrets set FACEBOOK_ACCESS_TOKEN="$facebookToken" --project-ref $projectRef
    supabase secrets set FACEBOOK_PAGE_ID="$facebookPageId" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Facebook credentials added!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add Facebook credentials" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Skipped - Facebook automation disabled" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 59 -ForegroundColor Cyan
Write-Host "🎉 API Keys Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What's been configured:" -ForegroundColor Yellow

# List all secrets
Write-Host "   Fetching current secrets..." -ForegroundColor Gray
supabase secrets list --project-ref $projectRef

Write-Host ""
Write-Host "🧪 Next Step: Test the system!" -ForegroundColor Cyan
Write-Host "   Run the test SQL: .\test-auto-trigger.sql" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor logs:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions" -ForegroundColor White
