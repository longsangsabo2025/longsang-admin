@echo off
title LongSang Admin - Starting...
cd /d "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
echo.
echo  ========================================
echo   Starting LongSang Admin Desktop
echo  ========================================
echo.

:: Check if n8n is running
echo  [1/3] Checking n8n status...
netstat -an | find ":5678" | find "LISTENING" > nul
if errorlevel 1 (
    echo  [*] Starting n8n with auto-login...
    :: Start n8n without auth for local development
    start /B cmd /c "set N8N_USER_MANAGEMENT_DISABLED=true && set N8N_BASIC_AUTH_ACTIVE=false && set N8N_PUBLIC_API_DISABLED=false && n8n start > nul 2>&1"
    echo  [OK] n8n starting on http://localhost:5678
    timeout /t 5 /nobreak > nul
) else (
    echo  [OK] n8n already running
)

echo  [2/3] Starting Vite dev server...
echo  [3/3] Launching Electron app...
echo.
call npm run desktop:dev
pause
