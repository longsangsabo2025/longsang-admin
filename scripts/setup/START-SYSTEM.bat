@echo off
cd /d "d:\0.APP\1510\long-sang-forge"

echo.
echo ========================================
echo   LONG SANG AI AUTOMATION - QUICK START
echo ========================================
echo.

echo Starting system manager...
powershell -ExecutionPolicy Bypass -File "scripts\system-manager.ps1" -Action start -Background -WithTunnel

echo.
echo Waiting for services to start...
timeout /t 8 /nobreak >nul

echo.
echo ✅ System started in background!
echo 📊 N8N: http://localhost:5678
echo ⚛️ React App: http://localhost:8080
echo 🧪 Workflow Tester: http://localhost:8080/workflow-test
echo.

echo Opening browsers...
start http://localhost:8080
start http://localhost:5678

echo.
echo 🎉 Long Sang AI Automation System is ready!
echo Press any key to exit...
pause >nul