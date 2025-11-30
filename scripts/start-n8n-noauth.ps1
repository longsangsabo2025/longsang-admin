# Start n8n without authentication (for local development)
# This allows opening n8n workflows directly without login

$n8nPort = 5678

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   Starting n8n (No Auth Mode)" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# Check if n8n is already running
$n8nRunning = Get-NetTCPConnection -LocalPort $n8nPort -ErrorAction SilentlyContinue

if ($n8nRunning) {
    Write-Host "  [OK] n8n is already running on port $n8nPort" -ForegroundColor Green
    Write-Host "  URL: http://localhost:$n8nPort" -ForegroundColor Gray
    exit 0
}

Write-Host "  [*] Starting n8n..." -ForegroundColor Yellow

# Set environment variables to disable authentication
$env:N8N_USER_MANAGEMENT_DISABLED = "true"
$env:N8N_BASIC_AUTH_ACTIVE = "false"
$env:N8N_PUBLIC_API_DISABLED = "false"
$env:N8N_SECURE_COOKIE = "false"
$env:N8N_DIAGNOSTICS_ENABLED = "false"
$env:N8N_PERSONALIZATION_ENABLED = "false"
$env:GENERIC_TIMEZONE = "Asia/Ho_Chi_Minh"

# Start n8n in background
Start-Process -FilePath "n8n" -ArgumentList "start" -WindowStyle Hidden

Write-Host "  [OK] n8n started!" -ForegroundColor Green
Write-Host "  URL: http://localhost:$n8nPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Note: n8n is running without authentication" -ForegroundColor Yellow
Write-Host "  This is for LOCAL DEVELOPMENT only!" -ForegroundColor Yellow
Write-Host ""
