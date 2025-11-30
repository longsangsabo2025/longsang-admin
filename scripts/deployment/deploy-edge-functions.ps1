# Deploy Edge Functions to Supabase
# Run this script to deploy all Edge Functions

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installing Supabase CLI via scoop..." -ForegroundColor Yellow

    # Check if scoop is installed
    $scoopInstalled = Get-Command scoop -ErrorAction SilentlyContinue
    if (-not $scoopInstalled) {
        Write-Host "❌ Scoop package manager not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install Scoop first:" -ForegroundColor Yellow
        Write-Host "  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser"
        Write-Host "  irm get.scoop.sh | iex"
        Write-Host ""
        Write-Host "Or download Supabase CLI manually from:" -ForegroundColor Yellow
        Write-Host "  https://github.com/supabase/cli/releases" -ForegroundColor Cyan
        exit 1
    }

    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    scoop install supabase

    Write-Host "✅ Supabase CLI installed!" -ForegroundColor Green
    Write-Host ""
}

# Load environment variables
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Write-Host "📝 Loading environment variables from .env..." -ForegroundColor Yellow
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$projectRef = $env:VITE_SUPABASE_PROJECT_ID
if (-not $projectRef) {
    Write-Host "❌ VITE_SUPABASE_PROJECT_ID not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "🔗 Project ID: $projectRef" -ForegroundColor Cyan
Write-Host ""

# Login to Supabase (if not already logged in)
Write-Host "🔐 Checking Supabase login status..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Supabase:" -ForegroundColor Yellow
    supabase login
}

Write-Host ""
Write-Host "📦 Deploying Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Deploy each function
$functions = @(
    @{Name="trigger-content-writer"; Description="Auto-generate content from contact forms"},
    @{Name="send-scheduled-emails"; Description="Send scheduled emails from queue"},
    @{Name="publish-social-posts"; Description="Publish scheduled social media posts"}
)

$deployedCount = 0
$failedCount = 0

foreach ($func in $functions) {
    Write-Host "📤 Deploying: $($func.Name)" -ForegroundColor Yellow
    Write-Host "   $($func.Description)" -ForegroundColor Gray

    $result = supabase functions deploy $func.Name --project-ref $projectRef 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Deployed successfully!" -ForegroundColor Green
        $deployedCount++
    } else {
        Write-Host "   ❌ Deployment failed!" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        $failedCount++
    }
    Write-Host ""
}

# Set secrets (environment variables for Edge Functions)
Write-Host ""
Write-Host "🔐 Setting up secrets for Edge Functions..." -ForegroundColor Cyan
Write-Host ""

$secrets = @{
    "SUPABASE_URL" = $env:VITE_SUPABASE_URL
    "SUPABASE_SERVICE_ROLE_KEY" = $env:SUPABASE_SERVICE_ROLE_KEY
}

# Optional secrets (only if configured)
if ($env:VITE_OPENAI_API_KEY) {
    $secrets["OPENAI_API_KEY"] = $env:VITE_OPENAI_API_KEY
}
if ($env:VITE_ANTHROPIC_API_KEY) {
    $secrets["ANTHROPIC_API_KEY"] = $env:VITE_ANTHROPIC_API_KEY
}
if ($env:VITE_RESEND_API_KEY) {
    $secrets["RESEND_API_KEY"] = $env:VITE_RESEND_API_KEY
}
if ($env:VITE_SENDGRID_API_KEY) {
    $secrets["SENDGRID_API_KEY"] = $env:VITE_SENDGRID_API_KEY
    $secrets["SENDGRID_FROM_EMAIL"] = $env:VITE_SENDGRID_FROM_EMAIL
}
if ($env:VITE_LINKEDIN_ACCESS_TOKEN) {
    $secrets["LINKEDIN_ACCESS_TOKEN"] = $env:VITE_LINKEDIN_ACCESS_TOKEN
}
if ($env:VITE_FACEBOOK_ACCESS_TOKEN) {
    $secrets["FACEBOOK_ACCESS_TOKEN"] = $env:VITE_FACEBOOK_ACCESS_TOKEN
    $secrets["FACEBOOK_PAGE_ID"] = $env:VITE_FACEBOOK_PAGE_ID
}

Write-Host "Setting secrets..." -ForegroundColor Yellow
foreach ($secret in $secrets.GetEnumerator()) {
    $masked = if ($secret.Value.Length -gt 10) {
        $secret.Value.Substring(0, 10) + "..."
    } else {
        "***"
    }
    Write-Host "  $($secret.Key) = $masked" -ForegroundColor Gray
}

# Set all secrets at once
$secretArgs = $secrets.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
$secretResult = supabase secrets set @secretArgs --project-ref $projectRef 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secrets configured successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Some secrets may not be set" -ForegroundColor Yellow
    Write-Host "   You can set them manually in Supabase Dashboard:" -ForegroundColor Gray
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/settings/functions" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Deployed: $deployedCount" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "   ❌ Failed: $failedCount" -ForegroundColor Red
}
Write-Host ""

if ($deployedCount -eq $functions.Count) {
    Write-Host "🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Setup database triggers (run: npm run setup:triggers)" -ForegroundColor Gray
    Write-Host "   2. Configure cron jobs in Supabase Dashboard" -ForegroundColor Gray
    Write-Host "   3. Test automation end-to-end" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔗 Manage functions:" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some functions failed to deploy." -ForegroundColor Yellow
    Write-Host "   Check the errors above and try again." -ForegroundColor Gray
}

Write-Host ""
