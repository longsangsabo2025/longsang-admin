@echo off
title N8N Server - Auto Login + Auto Open Workflows
echo.
echo ========================================
echo   N8N WITH AUTO LOGIN + AUTO WORKFLOWS
echo ========================================
echo.

cd /d "d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"

REM ============================================
REM DISABLE ALL AUTHENTICATION (Auto Login)
REM ============================================
SET N8N_BASIC_AUTH_ACTIVE=false
SET N8N_USER_MANAGEMENT_DISABLED=true
SET N8N_SKIP_OWNER_SETUP=true
SET N8N_SECURE_COOKIE=false

REM Server Configuration
SET N8N_HOST=localhost
SET N8N_PORT=5678
SET N8N_PROTOCOL=http

REM CORS Configuration
SET N8N_CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://localhost:5174,http://localhost:5175
SET N8N_WEBHOOK_CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://localhost:5174,http://localhost:5175

REM Database
SET N8N_DATABASE_TYPE=sqlite

REM Execution settings
SET EXECUTIONS_DATA_PRUNE=true
SET EXECUTIONS_DATA_MAX_AGE=336
SET N8N_LOG_LEVEL=info

REM Check if n8n is installed
WHERE npx >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: npx not found! Installing n8n...
    npm install -g n8n
    IF %ERRORLEVEL% NEQ 0 (
        echo FAILED to install n8n
        pause
        exit /b 1
    )
)

echo.
echo [OK] Authentication DISABLED - No login required!
echo [OK] Will auto-open workflows page in browser...
echo.
echo Starting n8n server...

REM Start n8n in background
START /B npx n8n

REM Wait for server to start
echo Waiting for n8n to start...
timeout /t 6 /nobreak >nul

REM Auto-open browser directly to WORKFLOWS page (skip login)
echo Opening workflows page in browser...
START http://localhost:5678/workflows

echo.
echo ========================================
echo   N8N IS RUNNING!
echo ========================================
echo   URL: http://localhost:5678/workflows
echo   Auth: DISABLED (No login needed!)
echo ========================================
echo.
echo Press any key to STOP n8n server...
pause >nul

REM Kill n8n process
taskkill /F /IM node.exe /FI "WINDOWTITLE eq*n8n*" >nul 2>nul
echo N8N stopped.
