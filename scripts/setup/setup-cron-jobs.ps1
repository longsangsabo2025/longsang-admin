# Setup Cron Jobs for LongSang Forge
# Schedules automated tasks for email sending and social post publishing

Write-Host "⏰ Setting up Cron Jobs..." -ForegroundColor Cyan
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

# Cron jobs SQL
$cronJobs = @(
    @{
        name = "send-scheduled-emails"
        schedule = "*/10 * * * *"  # Every 10 minutes
        description = "Send scheduled emails from content queue"
        sql = @"
SELECT cron.schedule(
  'send-scheduled-emails',
  '*/10 * * * *',
  `$`$
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  `$`$
);
"@
    },
    @{
        name = "publish-social-posts"
        schedule = "*/15 * * * *"  # Every 15 minutes
        description = "Publish scheduled social media posts"
        sql = @"
SELECT cron.schedule(
  'publish-social-posts',
  '*/15 * * * *',
  `$`$
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/publish-social-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  `$`$
);
"@
    }
)

Write-Host "📋 Creating cron jobs..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0

foreach ($job in $cronJobs) {
    Write-Host "  • $($job.name)" -ForegroundColor Cyan
    Write-Host "    Schedule: $($job.schedule)" -ForegroundColor Gray
    Write-Host "    $($job.description)" -ForegroundColor Gray
    Write-Host "    " -NoNewline

    try {
        # First unschedule if exists
        $unscheduleSql = "SELECT cron.unschedule('$($job.name)');"
        $unscheduleSql | supabase db execute --db-url "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres" 2>&1 | Out-Null

        # Then schedule
        $job.sql | supabase db execute --db-url "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres" 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Scheduled" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "⚠️  Check manually" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($successCount -eq $cronJobs.Count) {
    Write-Host "🎉 All cron jobs scheduled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Automation is now LIVE 24/7!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Monitor cron jobs:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/database/cron-jobs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🧪 Test the system:" -ForegroundColor Yellow
    Write-Host '   INSERT INTO contacts (name, email, message)' -ForegroundColor Gray
    Write-Host '   VALUES (''Test'', ''test@example.com'', ''I need AI automation'');' -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 Check results:" -ForegroundColor Yellow
    Write-Host "   SELECT * FROM content_queue ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
    Write-Host "   SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some cron jobs failed ($successCount/$($cronJobs.Count))" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Manual setup in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/database/cron-jobs" -ForegroundColor Gray
}

Write-Host ""
