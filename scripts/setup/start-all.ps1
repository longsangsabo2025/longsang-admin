# ================================================
# START ALL SERVICES - ONE COMMAND TO RULE THEM ALL
# ================================================
# PowerShell script to start all services automatically

Write-Host "🚀 Starting SABO ARENA - Complete Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check npm packages
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "api/node_modules")) {
    Write-Host "📥 Installing API dependencies..." -ForegroundColor Yellow
    cd api
    npm install
    cd ..
}

# Create logs directory if not exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "📁 Created logs directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Starting services..." -ForegroundColor Yellow
Write-Host ""

# Kill any existing node processes on our ports
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8080,3001,3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    $processes | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Start API Server in background
Write-Host "🟢 Starting API Server (Port 3001)..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\api'; Write-Host '🚀 API Server Starting...' -ForegroundColor Green; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start MCP Server in background
Write-Host "🟢 Starting MCP Server (Port 3002)..." -ForegroundColor Magenta
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\mcp-server'; Write-Host '🧠 MCP Server Starting...' -ForegroundColor Magenta; & .\START_MCP.ps1" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend in background
Write-Host "🟢 Starting Frontend (Port 8080)..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🚀 Frontend Starting...' -ForegroundColor Cyan; npm run dev:frontend" -WindowStyle Normal

Start-Sleep -Seconds 5

# Health checks
Write-Host ""
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-Host "✅ API Server: Running ($($apiHealth.status))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  API Server: Not responding yet (may still be starting)" -ForegroundColor Yellow
}

try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend: Not responding yet (may still be starting)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 SABO ARENA is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access Points:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "   🔧 API:       http://localhost:3001" -ForegroundColor White
Write-Host "   🧠 MCP:       http://localhost:3002/mcp" -ForegroundColor White
Write-Host "   👨‍💼 Admin:     http://localhost:8080/admin" -ForegroundColor White
Write-Host "   🤖 Agents:    http://localhost:8080/agent-center" -ForegroundColor White
Write-Host ""
Write-Host "📊 Services Status:" -ForegroundColor Cyan
Write-Host "   Check: Get-Process -Name node | Select-Object Id,ProcessName,StartTime" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Yellow
Write-Host "   Get-Process -Name node | Stop-Process -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Monitor services
while ($true) {
    Start-Sleep -Seconds 30
    
    try {
        $apiCheck = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2
        $apiStatus = "✅ Running"
    } catch {
        $apiStatus = "❌ Down"
        Write-Host "⚠️  API Server is down! Restarting..." -ForegroundColor Red
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\api'; node server.js" -WindowStyle Normal
    }
    
    try {
        $frontendCheck = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 2 -UseBasicParsing
        $frontendStatus = "✅ Running"
    } catch {
        $frontendStatus = "❌ Down"
    }
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] API: $apiStatus | Frontend: $frontendStatus" -ForegroundColor Gray
}
