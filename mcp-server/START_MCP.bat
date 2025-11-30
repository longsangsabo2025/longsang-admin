@echo off
REM ═══════════════════════════════════════════════════════════
REM   START MCP SERVER - Longsang Workspace
REM   Port: 3002
REM ═══════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           STARTING MCP SERVER                             ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv" (
    echo [INFO] Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install dependencies if needed
pip show mcp >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt
)

REM Start server
echo.
echo [INFO] Starting MCP Server on port 3002...
echo [INFO] Press Ctrl+C to stop
echo.

python server.py
