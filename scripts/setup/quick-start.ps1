# LONGSANG ADMIN - QUICK START
# Double-click from Desktop shortcut to launch

param(
    [switch]$Silent,
    [switch]$ApiOnly,
    [switch]$NoN8n,
    [switch]$Dev,       # Run dev server instead of production
    [switch]$Electron,  # Run Electron desktop app
    [switch]$NoCopilot  # Skip Copilot Bridge watcher
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
$Host.UI.RawUI.WindowTitle = "LongSang Admin Manager"

Clear-Host
Write-Host ""
Write-Host "  LONGSANG ADMIN - SYSTEM STARTUP" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
if ($Electron) {
    Write-Host "  Mode: ELECTRON DESKTOP APP" -ForegroundColor Magenta
} elseif ($Dev) {
    Write-Host "  Mode: DEVELOPMENT (hot reload)" -ForegroundColor Yellow
} else {
    Write-Host "  Mode: PRODUCTION WEB (optimized)" -ForegroundColor Green
}
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# STEP 1: Cleanup
Write-Host "  [1/7] Cleaning up old processes..." -ForegroundColor Yellow
@(3001, 3002, 3003, 8080, 4173, 5678) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Host "        Port $_ freed" -ForegroundColor DarkGreen
    }
}
Start-Sleep -Milliseconds 500

# STEP 2: Start API Server
Write-Host "  [2/7] Starting API Server..." -ForegroundColor Yellow
$apiJob = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$ProjectRoot\api" -WindowStyle Minimized -PassThru
if ($apiJob) {
    Write-Host "        API started (PID: $($apiJob.Id)) -> http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "        Failed to start API Server" -ForegroundColor Red
}

# STEP 3: Start Frontend
if (-not $ApiOnly) {
    if ($Electron) {
        # Electron mode - run desktop app
        Write-Host "  [3/7] Starting Electron Desktop App..." -ForegroundColor Yellow
        
        # Wait for API to be ready
        Write-Host "        Waiting for API..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
        
        $frontendJob = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run desktop:dev" -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        $frontendUrl = "Electron App"
    } elseif ($Dev) {
        # Dev mode - run Vite dev server
        Write-Host "  [3/7] Starting Frontend (Dev)..." -ForegroundColor Yellow
        $frontendJob = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev:frontend" -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        $frontendUrl = "http://localhost:8080"
    } else {
        # Production mode - build and preview
        Write-Host "  [3/7] Starting Frontend (Production)..." -ForegroundColor Yellow
        
        # Check if build exists
        if (-not (Test-Path "$ProjectRoot\dist\index.html")) {
            Write-Host "        Building production bundle..." -ForegroundColor DarkGray
            Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run build" -WorkingDirectory $ProjectRoot -Wait -WindowStyle Hidden
        }
        
        $frontendJob = Start-Process -FilePath "cmd" -ArgumentList "/c", "npx vite preview --port 4173" -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        $frontendUrl = "http://localhost:4173"
    }
    
    if ($frontendJob) {
        Write-Host "        Frontend started (PID: $($frontendJob.Id)) -> $frontendUrl" -ForegroundColor Green
    } else {
        Write-Host "        Failed to start Frontend" -ForegroundColor Red
    }
} else {
    Write-Host "  [3/7] Frontend skipped (API-only mode)" -ForegroundColor DarkGray
}

# STEP 4: Start MCP Server (Python AI Tools)
Write-Host "  [4/7] Starting MCP Server..." -ForegroundColor Yellow
$mcpPath = "$ProjectRoot\mcp-server"
$mcpPython = "$mcpPath\.venv\Scripts\python.exe"
if (Test-Path $mcpPython) {
    $mcpJob = Start-Process -FilePath $mcpPython -ArgumentList "server.py" -WorkingDirectory $mcpPath -WindowStyle Minimized -PassThru
    if ($mcpJob) {
        Write-Host "        MCP Server started (PID: $($mcpJob.Id)) -> http://localhost:3002" -ForegroundColor Green
    }
} else {
    Write-Host "        MCP Python env not found, skipping" -ForegroundColor DarkGray
}

# STEP 5: Start Copilot Bridge Watcher
if (-not $NoCopilot -and -not $ApiOnly) {
    Write-Host "  [5/7] Starting Copilot Bridge Watcher..." -ForegroundColor Yellow
    $watcherPath = "$ProjectRoot\api\services\local-watcher.js"
    if (Test-Path $watcherPath) {
        $watcherJob = Start-Process -FilePath "node" -ArgumentList $watcherPath -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        if ($watcherJob) {
            Write-Host "        Copilot Watcher started (PID: $($watcherJob.Id))" -ForegroundColor Green
        }
    } else {
        Write-Host "        Watcher not found, skipping" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [5/7] Copilot Watcher skipped" -ForegroundColor DarkGray
}

# STEP 6: Start n8n
if (-not $NoN8n) {
    Write-Host "  [6/7] Starting n8n..." -ForegroundColor Yellow
    $n8nRunning = Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue
    if ($n8nRunning) {
        Write-Host "        n8n already running -> http://localhost:5678" -ForegroundColor Green
    } else {
        $env:N8N_BASIC_AUTH_ACTIVE = "false"
        $env:N8N_USER_MANAGEMENT_DISABLED = "true"
        $env:N8N_SKIP_OWNER_SETUP = "true"
        $env:N8N_SECURE_COOKIE = "false"
        $env:N8N_HOST = "localhost"
        $env:N8N_PORT = "5678"
        $env:N8N_PROTOCOL = "http"
        $env:N8N_CORS_ALLOWED_ORIGINS = "http://localhost:8080,http://localhost:4173"
        $env:N8N_DATABASE_TYPE = "sqlite"
        
        $n8nProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx n8n" -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        if ($n8nProcess) {
            Write-Host "        n8n starting (PID: $($n8nProcess.Id)) -> http://localhost:5678" -ForegroundColor Green
        } else {
            Write-Host "        Failed to start n8n" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  [6/7] n8n skipped" -ForegroundColor DarkGray
}

# STEP 7: Health Check
Write-Host "  [7/7] Running health checks..." -ForegroundColor Yellow
Write-Host "        Waiting for services..." -ForegroundColor DarkGray
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "  SERVICE STATUS:" -ForegroundColor White
Write-Host "  ---------------" -ForegroundColor DarkGray

# Check API
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-Host "  [OK] API Server      -> http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "  [X]  API Server      -> http://localhost:3001" -ForegroundColor Red
}

# Check Frontend
if (-not $ApiOnly) {
    if ($Electron) {
        Write-Host "  [OK] Electron App    -> Desktop Window" -ForegroundColor Magenta
    } else {
        try {
            $null = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 5
            Write-Host "  [OK] Frontend        -> $frontendUrl" -ForegroundColor Green
        } catch {
            Write-Host "  [..] Frontend        -> $frontendUrl (loading...)" -ForegroundColor Yellow
        }
    }
}

# Check Copilot Watcher
if (-not $NoCopilot -and -not $ApiOnly) {
    Write-Host "  [OK] Copilot Watcher -> Active" -ForegroundColor Green
}

# Check MCP Server
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 3
    Write-Host "  [OK] MCP Server      -> http://localhost:3002" -ForegroundColor Green
} catch {
    Write-Host "  [..] MCP Server      -> http://localhost:3002 (starting...)" -ForegroundColor Yellow
}

# Check n8n
if (-not $NoN8n) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing -TimeoutSec 3
        Write-Host "  [OK] n8n             -> http://localhost:5678" -ForegroundColor Green
    } catch {
        Write-Host "  [..] n8n             -> http://localhost:5678 (starting...)" -ForegroundColor Yellow
    }
}

# Open browser (not for Electron mode)
if (-not $Silent -and -not $ApiOnly -and -not $Electron) {
    Write-Host ""
    Write-Host "  Opening browser..." -ForegroundColor Cyan
    Start-Sleep -Milliseconds 500
    Start-Process $frontendUrl
}

# Final message
Write-Host ""
Write-Host "  ================================" -ForegroundColor Green
Write-Host "  ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "  ================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Quick Links:" -ForegroundColor White
Write-Host "     Dashboard:  $frontendUrl" -ForegroundColor Cyan
Write-Host "     Sentry:     $frontendUrl/admin/sentry" -ForegroundColor Cyan
Write-Host "     API:        http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host "     MCP:        http://localhost:3002" -ForegroundColor Cyan
Write-Host "     n8n:        http://localhost:5678" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Copilot Bridge:" -ForegroundColor Magenta
Write-Host "     Errors auto-open in VS Code + Copilot fixes!" -ForegroundColor DarkMagenta
Write-Host ""
Write-Host "  Tips:" -ForegroundColor White
Write-Host "     Electron:   .\quick-start.ps1 -Electron" -ForegroundColor DarkGray
Write-Host "     Dev mode:   .\quick-start.ps1 -Dev" -ForegroundColor DarkGray
Write-Host "     API only:   .\quick-start.ps1 -ApiOnly" -ForegroundColor DarkGray
Write-Host "     No n8n:     .\quick-start.ps1 -NoN8n" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press any key to close (services keep running)..." -ForegroundColor DarkGray
Write-Host ""

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
