# ╔════════════════════════════════════════════════════════════════╗
# ║     🚀 COPILOT BRIDGE STARTUP SCRIPT                           ║
# ║     Start all services for Sentry → Copilot integration        ║
# ╚════════════════════════════════════════════════════════════════╝

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 COPILOT BRIDGE - Starting all services...               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$API_DIR = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api"
$WATCHER_SCRIPT = "$API_DIR\services\local-watcher.js"
$SERVER_SCRIPT = "$API_DIR\server.js"

# Check if Node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Starting services..." -ForegroundColor Yellow
Write-Host ""

# 1. Start API Server (if not already running)
$apiRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*server.js*"
}

if (-not $apiRunning) {
    Write-Host "🌐 Starting API Server..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$API_DIR'; Write-Host '🌐 API Server starting...' -ForegroundColor Green; node server.js"
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ API Server already running" -ForegroundColor Gray
}

# 2. Start File Watcher
Write-Host "👀 Starting File Watcher..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Write-Host '👀 File Watcher starting...' -ForegroundColor Green; node '$WATCHER_SCRIPT'"

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ ALL SERVICES STARTED!                                   ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  📡 API Server:       http://localhost:3001                    ║" -ForegroundColor Green
Write-Host "║  🔌 WebSocket Bridge: ws://localhost:3003                      ║" -ForegroundColor Green
Write-Host "║  👀 File Watcher:     Watching .copilot-errors/                ║" -ForegroundColor Green
Write-Host "║  📊 Dashboard:        http://localhost:5173/admin/sentry       ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Yellow
Write-Host "║  🎯 HOW TO USE:                                                ║" -ForegroundColor Yellow
Write-Host "║                                                                ║" -ForegroundColor Yellow
Write-Host "║  1. Sentry error occurs in production                         ║" -ForegroundColor White
Write-Host "║  2. Sentry Poller detects it (or click 'Fix' in Dashboard)    ║" -ForegroundColor White
Write-Host "║  3. File Watcher opens VS Code at error location              ║" -ForegroundColor White
Write-Host "║  4. COPILOT_TASK.md opens with full error context             ║" -ForegroundColor White
Write-Host "║  5. Press Ctrl+I → Ask Copilot to fix the error!              ║" -ForegroundColor White
Write-Host "║                                                                ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this window (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
