# ================================================
# RESTART ADMIN WITH ENVIRONMENT VARIABLES MANAGER
# ================================================
# Quick script to restart admin dashboard after adding Environment Variables Manager

Write-Host "`n🔄 RESTARTING ENHANCED ADMIN DASHBOARD" -ForegroundColor Cyan
Write-Host "   → New Feature: Environment Variables Manager" -ForegroundColor Green

# Kill existing admin processes
Write-Host "`n🛑 Stopping existing processes..." -ForegroundColor Yellow
@(3001, 8080, 8081) | ForEach-Object { 
    $port = $_
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { 
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") { 
            Write-Host "  Killing: $($proc.ProcessName) on port $port (PID: $($proc.Id))" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force 
        } 
    } 
}

Start-Sleep -Seconds 3

# Start admin dashboard
Write-Host "`n🚀 Starting enhanced admin dashboard..." -ForegroundColor Green
Set-Location "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin'; npm run dev" -WindowStyle Normal

Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check if services are running
$frontendRunning = $false
$apiRunning = $false

@(8080, 8081) | ForEach-Object {
    $port = $_
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $frontendRunning = $true
        $frontendPort = $port
    }
}

$apiConnection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($apiConnection) {
    $apiRunning = $true
}

Write-Host "`n📊 SERVICE STATUS:" -ForegroundColor Cyan
if ($frontendRunning) {
    Write-Host "  ✅ Frontend: http://localhost:$frontendPort" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend: Not running" -ForegroundColor Red
}

if ($apiRunning) {
    Write-Host "  ✅ API: http://localhost:3001" -ForegroundColor Green
    Write-Host "  ✅ Environment API: http://localhost:3001/api/env" -ForegroundColor Green
} else {
    Write-Host "  ❌ API: Not running" -ForegroundColor Red
}

if ($frontendRunning -and $apiRunning) {
    Write-Host "`n🎉 ADMIN DASHBOARD READY!" -ForegroundColor Green
    Write-Host "   → Open: http://localhost:$frontendPort" -ForegroundColor White
    Write-Host "   → Go to Settings → Environment tab" -ForegroundColor White
    Write-Host "   → Test Environment Variables Manager" -ForegroundColor White
    
    # Open browser
    Start-Process "http://localhost:$frontendPort"
    
    Write-Host "`n🆕 NEW ENVIRONMENT VARIABLES FEATURES:" -ForegroundColor Cyan
    Write-Host "   1. 📥 Load from System - Load existing .env files" -ForegroundColor White
    Write-Host "   2. ➕ Add Variable - Add new environment variables" -ForegroundColor White  
    Write-Host "   3. 🚀 Deploy to Projects - Push variables to all projects" -ForegroundColor White
    Write-Host "   4. 💾 Download .env - Export as .env file" -ForegroundColor White
    Write-Host "   5. 🔐 Secure Input - Auto-hide sensitive keys/tokens" -ForegroundColor White
    
} else {
    Write-Host "`n❌ STARTUP FAILED" -ForegroundColor Red
    Write-Host "   Check the console for errors" -ForegroundColor White
}

Write-Host "`n📝 API ENDPOINTS ADDED:" -ForegroundColor Yellow
Write-Host "   GET  /api/env/list - Load environment variables" -ForegroundColor White
Write-Host "   POST /api/env/deploy - Deploy variables to projects" -ForegroundColor White  
Write-Host "   GET  /api/env/status - Get deployment status" -ForegroundColor White
Write-Host "   DELETE /api/env/clear/:project - Clear project env vars" -ForegroundColor White

Write-Host "`n✅ ENVIRONMENT VARIABLES MANAGER - COMPLETE!" -ForegroundColor Green