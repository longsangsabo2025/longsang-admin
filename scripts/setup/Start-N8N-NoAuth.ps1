# Start N8N with Auto-Login (No Authentication)
# Opens directly to workflows page

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  N8N - AUTO LOGIN MODE" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables to DISABLE all authentication
$env:N8N_USER_MANAGEMENT_DISABLED = "true"
$env:N8N_BASIC_AUTH_ACTIVE = "false"
$env:N8N_SKIP_OWNER_SETUP = "true"
$env:N8N_SECURE_COOKIE = "false"

# Performance settings
$env:DB_SQLITE_POOL_SIZE = "5"
$env:N8N_RUNNERS_ENABLED = "true"
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
$env:N8N_GIT_NODE_DISABLE_BARE_REPOS = "true"

# Server settings
$env:N8N_HOST = "localhost"
$env:N8N_PORT = "5678"
$env:N8N_PROTOCOL = "http"

# CORS for local development
$env:N8N_CORS_ALLOWED_ORIGINS = "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173"
$env:N8N_WEBHOOK_CORS_ALLOWED_ORIGINS = "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173"

Write-Host "[OK] Authentication DISABLED" -ForegroundColor Green
Write-Host "[OK] Will auto-open workflows page" -ForegroundColor Green
Write-Host ""

# Check if n8n is already running
$existingProcess = Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "n8n already running! Opening browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:5678/workflows"
    exit
}

# Start n8n in background
Write-Host "Starting n8n server..." -ForegroundColor Cyan
$n8nJob = Start-Job -ScriptBlock {
    $env:N8N_USER_MANAGEMENT_DISABLED = "true"
    $env:N8N_BASIC_AUTH_ACTIVE = "false"
    $env:N8N_SKIP_OWNER_SETUP = "true"
    $env:N8N_SECURE_COOKIE = "false"
    $env:DB_SQLITE_POOL_SIZE = "5"
    $env:N8N_RUNNERS_ENABLED = "true"
    $env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
    $env:N8N_GIT_NODE_DISABLE_BARE_REPOS = "true"
    npx n8n start
}

# Wait for n8n to start
Write-Host "Waiting for n8n to start..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "n8n is ready!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

# Open browser to workflows page
Write-Host ""
Write-Host "Opening workflows page in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5678/workflows"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  N8N IS RUNNING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  URL: http://localhost:5678/workflows" -ForegroundColor White
Write-Host "  Auth: DISABLED (No login needed!)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop n8n..." -ForegroundColor Yellow

# Keep script running and show n8n output
Receive-Job -Job $n8nJob -Wait
