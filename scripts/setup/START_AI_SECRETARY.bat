@echo off
title AI Secretary Dev
echo.
echo ========================================
echo   AI SECRETARY
echo ========================================
echo.
cd /d "D:\0.PROJECTS\01-MAIN-PRODUCTS\ai_secretary"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting AI Secretary on http://localhost:5173...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
npm run dev
pause