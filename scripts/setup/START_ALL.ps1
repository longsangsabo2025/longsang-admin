# ╔═══════════════════════════════════════════════════════════════╗
# ║           LONGSANG ADMIN - START ALL SERVICES                ║
# ╚═══════════════════════════════════════════════════════════════╝
#
# Usage: .\START_ALL.ps1
# This script starts all services needed for remote development

param(
    [switch]$SkipMCP,
    [switch]$SkipAPI,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║           LONGSANG ADMIN - STARTING SERVICES                  ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }
}

# ════════════════════════════════════════════════════════════
# 1. START MCP SERVER (Port 3002)
# ════════════════════════════════════════════════════════════

if (-not $SkipMCP) {
    Write-Host "[1/3] Starting MCP Server on port 3002..." -ForegroundColor Yellow
    
    # Kill existing process on port
    Stop-ProcessOnPort -Port 3002
    
    $mcpPath = Join-Path $ProjectRoot "mcp-server"
    $pythonExe = Join-Path $mcpPath ".venv\Scripts\python.exe"
    $supervisorScript = Join-Path $mcpPath "run_server.py"  # Use supervisor for auto-restart
    
    if (-not (Test-Path $pythonExe)) {
        Write-Host "   [ERROR] Python venv not found. Run setup first!" -ForegroundColor Red
        Write-Host "   cd mcp-server && python -m venv .venv && .\.venv\Scripts\pip install -r requirements.txt"
        exit 1
    }
    
    # Start MCP Server with Supervisor in new window (auto-restart on crash)
    Start-Process -FilePath $pythonExe -ArgumentList $supervisorScript -WorkingDirectory $mcpPath -WindowStyle Normal
    Start-Sleep -Seconds 4
    
    if (Test-Port -Port 3002) {
        Write-Host "   [OK] MCP Server running on http://localhost:3002 (with auto-restart)" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] MCP Server may not have started" -ForegroundColor Yellow
    }
}

# ════════════════════════════════════════════════════════════
# 2. START API SERVER (Port 3001)
# ════════════════════════════════════════════════════════════

if (-not $SkipAPI) {
    Write-Host "[2/3] Starting API Server on port 3001..." -ForegroundColor Yellow
    
    # Kill existing process on port
    Stop-ProcessOnPort -Port 3001
    
    # Check if node_modules exists
    if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
        Write-Host "   Installing dependencies..." -ForegroundColor Gray
        Push-Location $ProjectRoot
        npm install
        Pop-Location
    }
    
    # Start API Server in new window
    Start-Process -FilePath "node" -ArgumentList "api/server.js" -WorkingDirectory $ProjectRoot -WindowStyle Normal
    Start-Sleep -Seconds 2
    
    if (Test-Port -Port 3001) {
        Write-Host "   [OK] API Server running on http://localhost:3001" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] API Server may not have started" -ForegroundColor Yellow
    }
}

# ════════════════════════════════════════════════════════════
# 3. START FRONTEND (Port 8080)
# ════════════════════════════════════════════════════════════

if (-not $SkipFrontend) {
    Write-Host "[3/3] Starting Frontend on port 8080..." -ForegroundColor Yellow
    
    # Kill existing process on port
    Stop-ProcessOnPort -Port 8080
    
    # Start Vite dev server in new window
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectRoot -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    if (Test-Port -Port 8080) {
        Write-Host "   [OK] Frontend running on http://localhost:8080" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Frontend may not have started" -ForegroundColor Yellow
    }
}

# ════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                    ALL SERVICES STARTED                       ║
╠═══════════════════════════════════════════════════════════════╣
║  MCP Server:  http://localhost:3002  (Python MCP)            ║
║  API Server:  http://localhost:3001  (Node.js Express)       ║
║  Frontend:    http://localhost:8080  (Vite React)            ║
╠═══════════════════════════════════════════════════════════════╣
║  Web UI:      http://localhost:8080/workspace-chat           ║
║  API Health:  http://localhost:3001/api/health               ║
║  MCP Status:  http://localhost:3001/api/ai/workspace-chat/mcp-status ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Test connections
Write-Host "Testing connections..." -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-Host "[OK] API Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[X] API not responding" -ForegroundColor Red
}

try {
    $mcpStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/workspace-chat/mcp-status" -TimeoutSec 5
    Write-Host "[OK] MCP Connected: $($mcpStatus.mcp.toolsCount) tools available" -ForegroundColor Green
} catch {
    Write-Host "[X] MCP not connected" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
