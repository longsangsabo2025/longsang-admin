# =====================================================
# SUPABASE EMAIL AUTOMATION - DEPLOYMENT SCRIPT
# =====================================================
# Complete setup from scratch
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUPABASE EMAIL AUTOMATION SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# =====================================================
# STEP 1: Check Prerequisites
# =====================================================
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Yellow

# Check Supabase CLI
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "   Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    Write-Host "✅ Supabase CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Supabase CLI installed" -ForegroundColor Green
}

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install Node.js first" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js installed: $(node --version)" -ForegroundColor Green

# =====================================================
# STEP 2: Setup Supabase Project
# =====================================================
Write-Host "`n📦 Step 2: Supabase Project Setup" -ForegroundColor Yellow

$setupChoice = Read-Host "Do you have an existing Supabase project? (y/n)"

if ($setupChoice -eq 'y') {
    Write-Host "`n🔗 Linking to existing project..." -ForegroundColor Cyan
    Write-Host "Go to: https://app.supabase.com/project/_/settings/general" -ForegroundColor White
    $projectRef = Read-Host "Enter Project Reference ID"
    
    supabase link --project-ref $projectRef
    
} else {
    Write-Host "`n🆕 Creating new project..." -ForegroundColor Cyan
    $projectName = Read-Host "Enter project name (e.g., longsang-admin)"
    
    supabase projects create $projectName --region southeast-asia
}

Write-Host "✅ Supabase project configured" -ForegroundColor Green

# =====================================================
# STEP 3: Get Environment Variables
# =====================================================
Write-Host "`n🔑 Step 3: Configure Environment Variables" -ForegroundColor Yellow

Write-Host "Go to: https://app.supabase.com/project/_/settings/api" -ForegroundColor White
Write-Host ""

$supabaseUrl = Read-Host "Enter SUPABASE_URL"
$supabaseAnonKey = Read-Host "Enter SUPABASE_ANON_KEY"
$supabaseServiceKey = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY"

Write-Host "`n📧 Resend API Setup" -ForegroundColor Cyan
Write-Host "Go to: https://resend.com/api-keys" -ForegroundColor White
$resendApiKey = Read-Host "Enter RESEND_API_KEY (or press Enter to skip)"

# Create .env file
$envContent = @"
# Supabase Project
SUPABASE_URL=$supabaseUrl
SUPABASE_ANON_KEY=$supabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey

# Email Provider (Resend)
RESEND_API_KEY=$resendApiKey

# Email Defaults
DEFAULT_FROM_NAME=LongSang.org
DEFAULT_FROM_EMAIL=noreply@longsang.org
DEFAULT_SUPPORT_EMAIL=support@longsang.org
"@

Set-Content -Path "supabase\.env" -Value $envContent
Write-Host "✅ Environment variables saved to supabase\.env" -ForegroundColor Green

# =====================================================
# STEP 4: Install Dependencies
# =====================================================
Write-Host "`n📦 Step 4: Installing dependencies..." -ForegroundColor Yellow

Set-Location supabase
npm install
Set-Location ..

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# =====================================================
# STEP 5: Run Database Migration
# =====================================================
Write-Host "`n🗄️  Step 5: Running database migration..." -ForegroundColor Yellow

$migrationChoice = Read-Host "Apply database schema now? (y/n)"

if ($migrationChoice -eq 'y') {
    Write-Host "   Applying migration..." -ForegroundColor Cyan
    
    # Option 1: Via Supabase CLI
    # supabase db push
    
    # Option 2: Via SQL directly
    Write-Host "   Copy this SQL to Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "   https://app.supabase.com/project/_/sql/new" -ForegroundColor White
    Write-Host ""
    Write-Host "   File: supabase\migrations\001_email_automation_schema.sql" -ForegroundColor Cyan
    Write-Host ""
    
    $migrationDone = Read-Host "Press Enter after running the migration in Supabase Dashboard"
    
    Write-Host "✅ Database schema created" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped - Run manually later" -ForegroundColor Yellow
}

# =====================================================
# STEP 6: Deploy Edge Functions
# =====================================================
Write-Host "`n⚡ Step 6: Deploying Edge Functions..." -ForegroundColor Yellow

$deployChoice = Read-Host "Deploy Edge Functions now? (y/n)"

if ($deployChoice -eq 'y') {
    Write-Host "   Deploying send-emails function..." -ForegroundColor Cyan
    supabase functions deploy send-emails
    
    Write-Host "   Deploying seed-templates function..." -ForegroundColor Cyan
    supabase functions deploy seed-templates
    
    # Set secrets
    if ($resendApiKey) {
        Write-Host "   Setting RESEND_API_KEY secret..." -ForegroundColor Cyan
        supabase secrets set RESEND_API_KEY=$resendApiKey
    }
    
    Write-Host "✅ Edge Functions deployed" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped - Deploy manually later with:" -ForegroundColor Yellow
    Write-Host "   supabase functions deploy send-emails" -ForegroundColor White
    Write-Host "   supabase functions deploy seed-templates" -ForegroundColor White
}

# =====================================================
# STEP 7: Seed Email Templates
# =====================================================
Write-Host "`n📧 Step 7: Seeding email templates..." -ForegroundColor Yellow

$seedChoice = Read-Host "Seed email templates now? (y/n)"

if ($seedChoice -eq 'y') {
    Write-Host "   Calling seed-templates function..." -ForegroundColor Cyan
    
    $seedUrl = "$supabaseUrl/functions/v1/seed-templates"
    
    $response = Invoke-RestMethod -Uri $seedUrl -Method POST -Headers @{
        "Authorization" = "Bearer $supabaseAnonKey"
        "Content-Type" = "application/json"
    }
    
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor White
    Write-Host "✅ Email templates seeded" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped - Seed manually later" -ForegroundColor Yellow
}

# =====================================================
# STEP 8: Setup Cron Job
# =====================================================
Write-Host "`n⏰ Step 8: Setup Cron Job (Auto-send emails)" -ForegroundColor Yellow

Write-Host "   Go to: https://app.supabase.com/project/_/database/extensions" -ForegroundColor White
Write-Host "   1. Enable 'pg_cron' extension" -ForegroundColor Cyan
Write-Host "   2. Go to SQL Editor and run this:" -ForegroundColor Cyan
Write-Host ""

$cronSql = @"
SELECT cron.schedule(
  'send-pending-emails',
  '* * * * *',
  `$`$
  SELECT net.http_post(
    url := '$supabaseUrl/functions/v1/send-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer $supabaseServiceKey"}'::jsonb
  );
  `$`$
);
"@

Write-Host $cronSql -ForegroundColor Yellow
Write-Host ""

$cronDone = Read-Host "Press Enter after setting up cron job"
Write-Host "✅ Cron job configured" -ForegroundColor Green

# =====================================================
# STEP 9: Test Email System
# =====================================================
Write-Host "`n🧪 Step 9: Test Email System" -ForegroundColor Yellow

$testChoice = Read-Host "Run test emails now? (y/n)"

if ($testChoice -eq 'y') {
    Write-Host "   Running tests..." -ForegroundColor Cyan
    Set-Location supabase
    node scripts/test-email.js
    Set-Location ..
    
    Write-Host "✅ Test completed - Check your inbox!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped - Test later with:" -ForegroundColor Yellow
    Write-Host "   cd supabase && node scripts/test-email.js" -ForegroundColor White
}

# =====================================================
# FINAL SUMMARY
# =====================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check email_queue table for pending emails" -ForegroundColor White
Write-Host "   2. Check email_logs table for sent emails" -ForegroundColor White
Write-Host "   3. Integrate with frontend (see README.md)" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "   Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "   Resend Dashboard: https://resend.com/emails" -ForegroundColor White
Write-Host "   Documentation: supabase\README.md" -ForegroundColor White
Write-Host ""

Write-Host "📧 Test Email:" -ForegroundColor Yellow
Write-Host "   cd supabase && node scripts/test-email.js" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Happy coding!" -ForegroundColor Cyan
Write-Host ""
