# Phase 2 Services Stop Script
# Stops all running Phase 2 services

Write-Host "🛑 Stopping Phase 2 Services..." -ForegroundColor Yellow
Write-Host ""

# Stop jobs
$jobs = Get-Job | Where-Object { $_.Name -like "*MCP*" -or $_.Name -like "*API*" -or $_.Command -like "*server.py*" -or $_.Command -like "*npm run dev*" }

if ($jobs) {
    Write-Host "Found $($jobs.Count) running job(s)..." -ForegroundColor Cyan
    foreach ($job in $jobs) {
        Write-Host "   Stopping job $($job.Id) ($($job.Name))..." -ForegroundColor White
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Jobs stopped" -ForegroundColor Green
} else {
    Write-Host "No running jobs found" -ForegroundColor Yellow
}

# Kill processes on ports
Write-Host ""
Write-Host "Checking processes on ports 3001, 3002, 3003..." -ForegroundColor Cyan

$ports = @(3001, 3002, 3003)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   Killing process $($process.ProcessName) (PID: $pid) on port $port..." -ForegroundColor White
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host ""
Write-Host "✅ All services stopped" -ForegroundColor Green

