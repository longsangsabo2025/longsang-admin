@echo off
title LongSang Admin Dashboard
echo.
echo ========================================
echo   LONGSANG ADMIN DASHBOARD
echo ========================================
echo.

cd /d "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Starting Admin Dashboard...
echo.
echo Frontend: http://localhost:8080
echo API:      http://localhost:3001
echo.

REM Start the dev server
call npm run dev

pause
