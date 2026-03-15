@echo off
REM ============================================================
REM start-all.bat ? Quick launcher for dev environment
REM ============================================================
REM Launches start-all.ps1 in a PowerShell window
REM Double-click this file or run from cmd
REM ============================================================

title LongSang Admin - Dev Environment
cd /d "%~dp0"
echo.
echo  ===================================================
echo   LongSang Admin - Starting Dev Environment...
echo  ===================================================
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start-all.ps1"

pause
