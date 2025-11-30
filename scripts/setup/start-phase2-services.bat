@echo off
REM Phase 2 Services Startup Script (Windows Batch)
REM Starts both MCP Server and API Server

echo ╔═══════════════════════════════════════════════════════════╗
echo ║     PHASE 2: Starting Services                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check Python
echo 🔍 Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python.
    pause
    exit /b 1
)
echo ✅ Python found
echo.

REM Check Node.js
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js.
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

REM Check FFmpeg
echo 🔍 Checking FFmpeg...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    if exist "C:\ffmpeg\bin\ffmpeg.exe" (
        echo ✅ FFmpeg found at C:\ffmpeg\bin\ffmpeg.exe
        set PATH=%PATH%;C:\ffmpeg\bin
    ) else (
        echo ⚠️  FFmpeg not found. Video generation may fail.
    )
) else (
    echo ✅ FFmpeg found
)
echo.

REM Start MCP Server in new window
echo 🚀 Starting MCP Server (port 3002 + 3003)...
start "MCP Server" cmd /k "cd /d mcp-server && python server.py"
timeout /t 3 /nobreak >nul

REM Start API Server in new window
echo 🚀 Starting API Server (port 3001)...
start "API Server" cmd /k "cd /d api && npm run dev"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     ✅ SERVICES STARTED                                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📊 Service Status:
echo    • MCP Server: http://localhost:3002 (MCP) + :3003 (HTTP)
echo    • API Server: http://localhost:3001
echo.
echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo ✅ Services should be ready now!
echo.
echo 🧪 Run Test Script:
echo    cd api
echo    node scripts/test-phase2-video-ab.js
echo.
echo Press any key to exit...
pause >nul

