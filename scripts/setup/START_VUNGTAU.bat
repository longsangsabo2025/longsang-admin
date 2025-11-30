@echo off
title Vung Tau Dream Homes Dev
echo.
echo ========================================
echo   VUNG TAU DREAM HOMES
echo ========================================
echo.
cd /d "D:\0.PROJECTS\01-MAIN-PRODUCTS\vungtau-dream-homes"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting Vung Tau on http://localhost:5175...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5175
npm run dev
pause