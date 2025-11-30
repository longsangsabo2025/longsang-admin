# Phase 2 Services Startup Script
# Starts both MCP Server and API Server

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     PHASE 2: Starting Services                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Paths
$mcpServerDir = Join-Path $projectRoot "mcp-server"
$apiServerDir = Join-Path $projectRoot "api"

Write-Host "📁 Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "📁 MCP Server: $mcpServerDir" -ForegroundColor Yellow
Write-Host "📁 API Server: $apiServerDir" -ForegroundColor Yellow
Write-Host ""

# Check if directories exist
if (-not (Test-Path $mcpServerDir)) {
    Write-Host "❌ MCP Server directory not found: $mcpServerDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $apiServerDir)) {
    Write-Host "❌ API Server directory not found: $apiServerDir" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "🔍 Checking Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check FFmpeg
Write-Host "🔍 Checking FFmpeg..." -ForegroundColor Cyan
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    if ($ffmpegVersion -match "ffmpeg version") {
        Write-Host "✅ FFmpeg found" -ForegroundColor Green
    } else {
        # Try C:\ffmpeg\bin\ffmpeg.exe
        if (Test-Path "C:\ffmpeg\bin\ffmpeg.exe") {
            Write-Host "✅ FFmpeg found at C:\ffmpeg\bin\ffmpeg.exe" -ForegroundColor Green
            $env:Path += ";C:\ffmpeg\bin"
        } else {
            Write-Host "⚠️  FFmpeg not in PATH. Video generation may fail." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  FFmpeg not found. Video generation may fail." -ForegroundColor Yellow
}

Write-Host ""

# Check if ports are available
Write-Host "🔍 Checking ports..." -ForegroundColor Cyan
$port3001 = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
$port3002 = Test-NetConnection -ComputerName localhost -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue
$port3003 = Test-NetConnection -ComputerName localhost -Port 3003 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($port3001) {
    Write-Host "⚠️  Port 3001 is already in use (API Server)" -ForegroundColor Yellow
}
if ($port3002) {
    Write-Host "⚠️  Port 3002 is already in use (MCP Server)" -ForegroundColor Yellow
}
if ($port3003) {
    Write-Host "⚠️  Port 3003 is already in use (MCP HTTP API)" -ForegroundColor Yellow
}

Write-Host ""

# Start MCP Server
Write-Host "🚀 Starting MCP Server (port 3002 + 3003)..." -ForegroundColor Cyan
$mcpServerJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    python server.py
} -ArgumentList $mcpServerDir

Write-Host "✅ MCP Server job started (ID: $($mcpServerJob.Id))" -ForegroundColor Green

# Wait a bit for MCP Server to initialize
Start-Sleep -Seconds 3

# Start API Server
Write-Host "🚀 Starting API Server (port 3001)..." -ForegroundColor Cyan
$apiServerJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $apiServerDir

Write-Host "✅ API Server job started (ID: $($apiServerJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ SERVICES STARTED                                   ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "   • MCP Server: http://localhost:3002 (MCP) + :3003 (HTTP)" -ForegroundColor White
Write-Host "   • API Server: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow

# Wait and check services
$maxWait = 30
$waited = 0
$mcpReady = $false
$apiReady = $false

while ($waited -lt $maxWait -and (-not $mcpReady -or -not $apiReady)) {
    Start-Sleep -Seconds 2
    $waited += 2

    if (-not $mcpReady) {
        $mcpCheck = Test-NetConnection -ComputerName localhost -Port 3003 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($mcpCheck) {
            $mcpReady = $true
            Write-Host "✅ MCP Server HTTP API is ready (port 3003)" -ForegroundColor Green
        }
    }

    if (-not $apiReady) {
        $apiCheck = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($apiCheck) {
            $apiReady = $true
            Write-Host "✅ API Server is ready (port 3001)" -ForegroundColor Green
        }
    }

    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
Write-Host ""

if ($mcpReady -and $apiReady) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✅ ALL SERVICES READY                                ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services may still be starting..." -ForegroundColor Yellow
    if (-not $mcpReady) {
        Write-Host "   • MCP Server: Still starting..." -ForegroundColor Yellow
    }
    if (-not $apiReady) {
        Write-Host "   • API Server: Still starting..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   • View MCP Server logs: Receive-Job -Id $($mcpServerJob.Id) -Keep" -ForegroundColor White
Write-Host "   • View API Server logs: Receive-Job -Id $($apiServerJob.Id) -Keep" -ForegroundColor White
Write-Host "   • Stop all services: Stop-Job -Id $($mcpServerJob.Id),$($apiServerJob.Id); Remove-Job -Id $($mcpServerJob.Id),$($apiServerJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Run Test Script:" -ForegroundColor Cyan
Write-Host "   cd api" -ForegroundColor White
Write-Host "   node scripts/test-phase2-video-ab.js" -ForegroundColor White
Write-Host ""

# Keep script running
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 5

        # Check if jobs are still running
        $mcpState = (Get-Job -Id $mcpServerJob.Id).State
        $apiState = (Get-Job -Id $apiServerJob.Id).State

        if ($mcpState -eq "Failed" -or $mcpState -eq "Completed") {
            Write-Host "⚠️  MCP Server job stopped (State: $mcpState)" -ForegroundColor Yellow
            Receive-Job -Id $mcpServerJob.Id -Keep | Write-Host
        }

        if ($apiState -eq "Failed" -or $apiState -eq "Completed") {
            Write-Host "⚠️  API Server job stopped (State: $apiState)" -ForegroundColor Yellow
            Receive-Job -Id $apiServerJob.Id -Keep | Write-Host
        }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow

    Stop-Job -Id $mcpServerJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $apiServerJob.Id -ErrorAction SilentlyContinue

    Remove-Job -Id $mcpServerJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $apiServerJob.Id -ErrorAction SilentlyContinue

    Write-Host "✅ Services stopped" -ForegroundColor Green
}

