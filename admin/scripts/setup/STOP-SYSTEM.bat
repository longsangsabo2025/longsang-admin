@echo off
cd /d "d:\0.APP\1510\long-sang-forge"

echo.
echo ========================================
echo   LONG SANG AI AUTOMATION - STOP
echo ========================================
echo.

echo Stopping all services...
powershell -ExecutionPolicy Bypass -File "scripts\system-manager.ps1" -Action stop

echo.
echo ✅ All services stopped!
echo.
echo Press any key to continue...
pause >nul