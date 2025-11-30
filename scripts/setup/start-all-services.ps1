# ╔═══════════════════════════════════════════════════════════════╗
# ║           LONGSANG ADMIN - ALL SERVICES LAUNCHER              ║
# ║         One-Click Start for Complete Platform                 ║
# ╚═══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "LongSang Admin - Service Manager"

# Colors
function Write-Color($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

# Banner
Clear-Host
Write-Color "╔═══════════════════════════════════════════════════════════════╗" "Cyan"
Write-Color "║           🚀 LONGSANG ADMIN - ALL SERVICES                    ║" "Cyan"
Write-Color "║              Starting Complete Platform...                    ║" "Cyan"
Write-Color "╚═══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Host ""

# Paths
$ADMIN_ROOT = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
$API_PATH = "$ADMIN_ROOT\api"
$MCP_PATH = "$ADMIN_ROOT\mcp-server"
$FRONTEND_PATH = $ADMIN_ROOT

# ════════════════════════════════════════════════════════════
# STEP 1: Kill existing processes to avoid port conflicts
# ════════════════════════════════════════════════════════════
Write-Color "[1/5] Cleaning up existing processes..." "Yellow"

# Kill node processes on our ports
$ports = @(3001, 3002, 3003, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  Freed port $port"
    }
}
Start-Sleep -Seconds 2
Write-Color "  ✅ Ports cleared" "Green"

# ════════════════════════════════════════════════════════════
# STEP 2: Start API Server (Node.js) - Port 3001
# ════════════════════════════════════════════════════════════
Write-Color "[2/5] Starting API Server (Port 3001)..." "Yellow"

$apiJob = Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$API_PATH'; `$Host.UI.RawUI.WindowTitle = '🔵 API Server (3001)'; node server.js"
) -WindowStyle Normal -PassThru

Start-Sleep -Seconds 3

# Check if API started
$apiRunning = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($apiRunning) {
    Write-Color "  ✅ API Server running on http://localhost:3001" "Green"
} else {
    Write-Color "  ⚠️ API Server may still be starting..." "Yellow"
}

# ════════════════════════════════════════════════════════════
# STEP 3: Start MCP Server (Python) - Port 3002
# ════════════════════════════════════════════════════════════
Write-Color "[3/5] Starting MCP Server (Port 3002)..." "Yellow"

$mcpJob = Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$MCP_PATH'; `$Host.UI.RawUI.WindowTitle = '🟢 MCP Server (3002)'; .\.venv\Scripts\activate.ps1; python run_server.py"
) -WindowStyle Normal -PassThru

Start-Sleep -Seconds 3
Write-Color "  ✅ MCP Server starting..." "Green"

# ════════════════════════════════════════════════════════════
# STEP 4: Start Frontend Dev Server - Port 5173
# ════════════════════════════════════════════════════════════
Write-Color "[4/5] Starting Frontend Dev Server (Port 5173)..." "Yellow"

$frontendJob = Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$FRONTEND_PATH'; `$Host.UI.RawUI.WindowTitle = '🟣 Frontend (5173)'; npm run dev"
) -WindowStyle Normal -PassThru

Start-Sleep -Seconds 3
Write-Color "  ✅ Frontend Dev Server starting..." "Green"

# ════════════════════════════════════════════════════════════
# STEP 5: Wait and verify all services
# ════════════════════════════════════════════════════════════
Write-Color "[5/5] Verifying services..." "Yellow"
Start-Sleep -Seconds 5

Write-Host ""
Write-Color "╔═══════════════════════════════════════════════════════════════╗" "Green"
Write-Color "║                    SERVICE STATUS                             ║" "Green"
Write-Color "╠═══════════════════════════════════════════════════════════════╣" "Green"

# Check API
$api = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($api) {
    Write-Color "║  ✅ API Server        http://localhost:3001                  ║" "Green"
} else {
    Write-Color "║  ❌ API Server        NOT RUNNING                            ║" "Red"
}

# Check MCP
$mcp = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($mcp) {
    Write-Color "║  ✅ MCP Server        http://localhost:3002                  ║" "Green"
} else {
    Write-Color "║  ⏳ MCP Server        Starting...                            ║" "Yellow"
}

# Check WebSocket
$ws = Get-NetTCPConnection -LocalPort 3003 -State Listen -ErrorAction SilentlyContinue
if ($ws) {
    Write-Color "║  ✅ WebSocket         ws://localhost:3003                    ║" "Green"
} else {
    Write-Color "║  ⏳ WebSocket         Starting with API...                   ║" "Yellow"
}

# Check Frontend
$frontend = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontend) {
    Write-Color "║  ✅ Frontend          http://localhost:5173                  ║" "Green"
} else {
    Write-Color "║  ⏳ Frontend          Starting...                            ║" "Yellow"
}

Write-Color "╚═══════════════════════════════════════════════════════════════╝" "Green"

Write-Host ""
Write-Color "🎉 All services launched! Opening browser..." "Cyan"
Write-Host ""

# Open browser after a short delay
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Color "═══════════════════════════════════════════════════════════════" "DarkGray"
Write-Color "  Press any key to open Service Manager menu..." "DarkGray"
Write-Color "  Or close this window (services will keep running)" "DarkGray"
Write-Color "═══════════════════════════════════════════════════════════════" "DarkGray"

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Service Manager Menu
while ($true) {
    Clear-Host
    Write-Color "╔═══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-Color "║              🔧 SERVICE MANAGER MENU                          ║" "Cyan"
    Write-Color "╠═══════════════════════════════════════════════════════════════╣" "Cyan"
    Write-Color "║  [1] Check Service Status                                     ║" "White"
    Write-Color "║  [2] Restart API Server                                       ║" "White"
    Write-Color "║  [3] Restart MCP Server                                       ║" "White"
    Write-Color "║  [4] Restart Frontend                                         ║" "White"
    Write-Color "║  [5] Open Browser (localhost:5173)                            ║" "White"
    Write-Color "║  [6] Open API Docs (localhost:3001/api-docs)                  ║" "White"
    Write-Color "║  [7] Stop All Services                                        ║" "White"
    Write-Color "║  [Q] Quit (services keep running)                             ║" "White"
    Write-Color "╚═══════════════════════════════════════════════════════════════╝" "Cyan"
    
    $choice = Read-Host "Select option"
    
    switch ($choice.ToUpper()) {
        "1" {
            Write-Host ""
            Write-Color "Checking services..." "Yellow"
            
            $api = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
            $mcp = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
            $ws = Get-NetTCPConnection -LocalPort 3003 -State Listen -ErrorAction SilentlyContinue
            $fe = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
            
            Write-Host ""
            if ($api) { Write-Color "✅ API Server (3001): RUNNING" "Green" } else { Write-Color "❌ API Server (3001): STOPPED" "Red" }
            if ($mcp) { Write-Color "✅ MCP Server (3002): RUNNING" "Green" } else { Write-Color "❌ MCP Server (3002): STOPPED" "Red" }
            if ($ws) { Write-Color "✅ WebSocket  (3003): RUNNING" "Green" } else { Write-Color "❌ WebSocket  (3003): STOPPED" "Red" }
            if ($fe) { Write-Color "✅ Frontend   (5173): RUNNING" "Green" } else { Write-Color "❌ Frontend   (5173): STOPPED" "Red" }
            
            Write-Host ""
            Read-Host "Press Enter to continue"
        }
        "2" {
            Write-Color "Restarting API Server..." "Yellow"
            $conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
            if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 2
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$API_PATH'; `$Host.UI.RawUI.WindowTitle = '🔵 API Server (3001)'; node server.js"
            Write-Color "✅ API Server restarted" "Green"
            Start-Sleep -Seconds 2
        }
        "3" {
            Write-Color "Restarting MCP Server..." "Yellow"
            $conn = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
            if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 2
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$MCP_PATH'; `$Host.UI.RawUI.WindowTitle = '🟢 MCP Server (3002)'; .\.venv\Scripts\activate.ps1; python run_server.py"
            Write-Color "✅ MCP Server restarted" "Green"
            Start-Sleep -Seconds 2
        }
        "4" {
            Write-Color "Restarting Frontend..." "Yellow"
            $conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
            if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 2
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND_PATH'; `$Host.UI.RawUI.WindowTitle = '🟣 Frontend (5173)'; npm run dev"
            Write-Color "✅ Frontend restarted" "Green"
            Start-Sleep -Seconds 2
        }
        "5" {
            Start-Process "http://localhost:5173"
        }
        "6" {
            Start-Process "http://localhost:3001/api-docs"
        }
        "7" {
            Write-Color "Stopping all services..." "Yellow"
            @(3001, 3002, 3003, 5173) | ForEach-Object {
                $conn = Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
                if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
            }
            Write-Color "✅ All services stopped" "Green"
            Start-Sleep -Seconds 2
        }
        "Q" {
            Write-Color "Exiting... Services will keep running." "Cyan"
            exit
        }
    }
}
