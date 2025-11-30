# Deploy App Showcase Schema to Supabase
# Run this script to deploy the database schema

Write-Host "🚀 Deploying App Showcase Schema to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Supabase Connection Details
$PROJECT_ID = "diexsbzqwsbpilsymnfb"
$DB_PASSWORD = "Acookingoil123"

# Direct connection for migrations (port 5432, not pooler 6543)
# Transaction pooler (6543) is for queries, direct (5432) for DDL/migrations
$DB_URL_DIRECT = "postgresql://postgres.diexsbzqwsbpilsymnfb:$DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
$SQL_FILE = "supabase/migrations/app_showcase_schema.sql"

# Read SQL file
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "❌ SQL file not found: $SQL_FILE" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $SQL_FILE -Raw

Write-Host "📄 SQL File: $SQL_FILE" -ForegroundColor Yellow
Write-Host "📊 File Size: $($sqlContent.Length) characters" -ForegroundColor Yellow
Write-Host ""

# Execute SQL via Supabase REST API
$headers = @{
    "apikey" = $SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    "query" = $sqlContent
} | ConvertTo-Json

try {
    Write-Host "🔄 Executing SQL on Supabase..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "✅ Schema deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open admin: http://localhost:8081/app-showcase/admin" -ForegroundColor White
    Write-Host "  2. Edit content and click Save" -ForegroundColor White
    Write-Host "  3. Check showcase: http://localhost:8081/app-showcase" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Production database is LIVE!" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Note: REST API method may not work. Using alternative method..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 Manual deployment steps:" -ForegroundColor Cyan
    Write-Host "  1. Open: https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql" -ForegroundColor White
    Write-Host "  2. Click 'New Query'" -ForegroundColor White
    Write-Host "  3. Copy content from: $SQL_FILE" -ForegroundColor White
    Write-Host "  4. Paste into SQL editor" -ForegroundColor White
    Write-Host "  5. Click 'Run' (or Ctrl+Enter)" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening Supabase SQL Editor in browser..." -ForegroundColor Yellow
    Start-Process "https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql"
}
