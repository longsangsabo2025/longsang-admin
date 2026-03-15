@echo off
title LongSang Portfolio Dev
echo.
echo ========================================
echo   LONGSANG PORTFOLIO
echo ========================================
echo.
cd /d "D:\0.PROJECTS\01-MAIN-PRODUCTS\long-sang-forge"

REM Check node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting Portfolio on http://localhost:8080...
echo.
start http://localhost:8080
npm run dev
pause