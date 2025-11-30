# LONGSANG ADMIN - PRODUCTION MODE
# Chay app production build (khong can npm run dev)

$ErrorActionPreference = "SilentlyContinue"

# Config
$PROJECT_DIR = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
$API_PORT = 3001
$FRONTEND_PORT = 4173

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LONGSANG ADMIN - Starting Production " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes on these ports
Write-Host "[*] Cleaning up old processes..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

# 1. Start API Server (new window)
Write-Host "[1] Starting API Server on port $API_PORT..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_DIR\api'; Write-Host 'API Server starting...' -ForegroundColor Green; node server.js" -WindowStyle Minimized

# 2. Start Frontend Preview Server
Write-Host "[2] Starting Frontend on port $FRONTEND_PORT..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_DIR'; Write-Host 'Frontend starting...' -ForegroundColor Green; npx vite preview --port $FRONTEND_PORT --host" -WindowStyle Minimized

# Wait for servers to start
Write-Host ""
Write-Host "[*] Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# 3. Start File Watcher for Copilot Bridge
Write-Host "[3] Starting Copilot Bridge Watcher..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_DIR'; Write-Host 'Watcher starting...' -ForegroundColor Green; node api\services\local-watcher.js" -WindowStyle Minimized

Start-Sleep -Seconds 1

# Open browser
Write-Host ""
Write-Host "[*] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:$FRONTEND_PORT"

# Show status
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PRODUCTION MODE RUNNING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:    http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host "  API Server:  http://localhost:$API_PORT" -ForegroundColor White
Write-Host "  Sentry:      http://localhost:$FRONTEND_PORT/admin/sentry" -ForegroundColor White
Write-Host ""
Write-Host "  3 windows minimized (API, Frontend, Watcher)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
