# Setup Auto-Triggers via PowerShell
# Automatically executes SQL to setup database triggers and cron jobs

Write-Host "🚀 Setting up Auto-Triggers for LongSang Forge..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with Supabase credentials" -ForegroundColor Gray
    exit 1
}

# Load environment variables
Write-Host "📝 Loading environment variables..." -ForegroundColor Yellow
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceRoleKey) {
    Write-Host "❌ Missing Supabase credentials in .env!" -ForegroundColor Red
    Write-Host "   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Environment loaded" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Read SQL file
$sqlPath = Join-Path $PSScriptRoot "supabase\migrations\setup-auto-triggers.sql"
if (-not (Test-Path $sqlPath)) {
    Write-Host "❌ SQL file not found: $sqlPath" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading SQL migration file..." -ForegroundColor Yellow
$sqlContent = Get-Content $sqlPath -Raw

# Execute SQL via Supabase REST API
Write-Host "⚡ Executing SQL migration..." -ForegroundColor Yellow
Write-Host ""

try {
    $apiUrl = "$supabaseUrl/rest/v1/rpc/exec_sql"

    $headers = @{
        "apikey" = $serviceRoleKey
        "Authorization" = "Bearer $serviceRoleKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }

    $body = @{
        query = $sqlContent
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "✅ SQL migration executed successfully!" -ForegroundColor Green
    Write-Host ""

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Auto-Triggers Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Created:" -ForegroundColor Cyan
    Write-Host "   • Database trigger: on_contact_submitted" -ForegroundColor Gray
    Write-Host "   • Cron job: send-scheduled-emails (every 10 min)" -ForegroundColor Gray
    Write-Host "   • Cron job: publish-social-posts (every 15 min)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🧪 Test it now:" -ForegroundColor Yellow
    Write-Host '   INSERT INTO contacts (name, email, message)' -ForegroundColor Gray
    Write-Host '   VALUES (''Test'', ''test@example.com'', ''AI automation help'');' -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Verify in Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   • SQL Editor: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql" -ForegroundColor Gray
    Write-Host "   • Cron Jobs: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ Failed to execute SQL migration!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual Setup:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new" -ForegroundColor Gray
    Write-Host "   2. Copy content from: supabase\migrations\setup-auto-triggers.sql" -ForegroundColor Gray
    Write-Host "   3. Paste and Run SQL" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
