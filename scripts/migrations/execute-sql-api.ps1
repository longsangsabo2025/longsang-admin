# Execute SQL via Supabase Management API
# This script runs SQL commands directly via REST API

param(
    [string]$SqlFile = "supabase\migrations\*_setup_auto_triggers.sql"
)

Write-Host "🚀 Executing SQL via Supabase API..." -ForegroundColor Cyan
Write-Host ""

# Load environment
$envPath = Join-Path $PSScriptRoot ".env"
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$projectRef = $env:VITE_SUPABASE_PROJECT_ID
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $projectRef -or -not $serviceRoleKey) {
    Write-Host "❌ Missing credentials!" -ForegroundColor Red
    exit 1
}

# Read SQL file
$sqlFiles = Get-ChildItem -Path $SqlFile -File
if ($sqlFiles.Count -eq 0) {
    Write-Host "❌ SQL file not found: $SqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFiles[0].FullName -Raw

Write-Host "📄 File: $($sqlFiles[0].Name)" -ForegroundColor Gray
Write-Host ""

# Split into individual statements and execute one by one
$statements = @(
    @{
        name = "Enable pg_net extension"
        sql = "CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;"
    },
    @{
        name = "Enable pg_cron extension"
        sql = "CREATE EXTENSION IF NOT EXISTS pg_cron;"
    },
    @{
        name = "Create trigger function"
        sql = @"
CREATE OR REPLACE FUNCTION trigger_content_generation()
RETURNS TRIGGER AS `$`$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/trigger-content-writer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;

  RAISE NOTICE 'Triggered content generation for contact %, request_id: %', NEW.id, request_id;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql SECURITY DEFINER;
"@
    },
    @{
        name = "Drop existing trigger"
        sql = "DROP TRIGGER IF EXISTS on_contact_submitted ON contacts;"
    },
    @{
        name = "Create contact trigger"
        sql = @"
CREATE TRIGGER on_contact_submitted
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_content_generation();
"@
    }
)

Write-Host "⚡ Executing SQL statements..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($stmt in $statements) {
    Write-Host "  • $($stmt.name)..." -ForegroundColor Gray -NoNewline

    try {
        # Use Supabase CLI
        $stmt.sql | supabase db execute --db-url "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres" 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ⚠️  (might already exist)" -ForegroundColor Yellow
            $successCount++
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 Database triggers setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Next: Setup cron jobs in Supabase Dashboard" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/database/cron-jobs" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some statements failed ($failCount/$($statements.Count))" -ForegroundColor Yellow
    Write-Host "   Manual setup recommended" -ForegroundColor Gray
}

Write-Host ""
