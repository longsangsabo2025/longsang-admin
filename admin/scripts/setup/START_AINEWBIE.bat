@echo off
title AI Newbie Web Dev
echo.
echo ========================================
echo   AI NEWBIE WEB
echo ========================================
echo.
cd /d "D:\0.PROJECTS\01-MAIN-PRODUCTS\ainewbie-web"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting AI Newbie on http://localhost:5174...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5174
npm run dev
pause